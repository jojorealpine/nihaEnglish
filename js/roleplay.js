"use strict";

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const canSpeak = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
const storageKey = 'nihaEnglish.roleplay.v1';
let storageAvailable = true;
let data, scenario, selectedCase;
let turnIndex = 0;
let replies = [];
let draft = '';
let showHints = false;
let showExamples = false;
let speechVersion = 0;
const progress = readProgress();

function readProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    return {
      completed: Array.isArray(saved?.completed) ? saved.completed.filter(id => typeof id === 'string') : [],
      memorized: Array.isArray(saved?.memorized) ? saved.memorized.filter(id => typeof id === 'string') : []
    };
  } catch {
    storageAvailable = false;
    return { completed: [], memorized: [] };
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  updateProgress();
}

const caseKey = item => `${scenario.id}/${item.id}`;

function updateProgress() {
  const allCases = data.scenarios.flatMap(scene => scene.cases.map(item => `${scene.id}/${item.id}`));
  const completed = allCases.filter(id => progress.completed.includes(id)).length;
  const memorized = data.essentials.filter(item => progress.memorized.includes(item.id)).length;
  const phrases = data.scenarios.reduce((count, scene) => count + scene.expressions.length, 0);
  $('role-overview').textContent = `${data.scenarios.length}가지 상황 · 핵심 표현 ${phrases}개 · ${allCases.length}개 대화 케이스`;
  $('completed-progress').textContent = `대화 연습 ${completed} / ${allCases.length}개 완료`;
  $('memory-progress').textContent = `${memorized} / ${data.essentials.length}개 익힘`;
  $('memory-hint').textContent = storageAvailable
    ? '자연스럽게 말할 수 있는 표현에 체크해보세요. 기록은 이 브라우저에 저장돼요.'
    : '자연스럽게 말할 수 있는 표현에 체크해보세요. 현재 브라우저에서는 기록이 이번 세션에만 유지돼요.';
}

function speakButton(text, label = '▶ 듣기') {
  return `<button type="button" class="secondary small-button listen-button" data-action="speak" data-speak="${escapeHTML(text)}" aria-label="${escapeHTML(text)} 듣기" ${canSpeak ? '' : 'disabled'}>${label}</button>`;
}

function renderScenarios() {
  $('scenario-list').innerHTML = data.scenarios.map(scene => `
    <button type="button" class="scenario-button" data-action="scenario" data-id="${escapeHTML(scene.id)}"
      aria-pressed="${scene === scenario}">
      <span>${escapeHTML(scene.title)}</span><small>${escapeHTML(scene.englishTitle)}</small>
    </button>`).join('');
}

function renderCases() {
  $('case-list').innerHTML = scenario.cases.map(item => `
    <button type="button" class="case-button" data-action="case" data-id="${escapeHTML(item.id)}" aria-pressed="${item === selectedCase}">
      <span>${escapeHTML(item.title)}</span>
      ${progress.completed.includes(caseKey(item)) ? '<small class="case-done">완료</small>' : ''}
    </button>`).join('');
}

function updateLocation(mode) {
  const url = new URL(window.location.href);
  if (url.searchParams.get('scenario') === scenario.id && url.searchParams.get('case') === selectedCase.id) return;
  url.searchParams.set('scenario', scenario.id);
  url.searchParams.set('case', selectedCase.id);
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

function selectScenario(id, caseId, historyMode = 'push') {
  scenario = data.scenarios.find(scene => scene.id === id) || data.scenarios[0];
  renderScenarios();
  $('scenario-title').textContent = scenario.title;
  $('scenario-english').textContent = scenario.englishTitle;
  $('scenario-description').textContent = scenario.description;
  $('scenario-pattern').textContent = scenario.pattern;
  $('scenario-tip').textContent = scenario.tip;
  $('phrase-library-title').textContent = `핵심 표현 · ${scenario.expressions.length}개`;
  $('role-phrases').innerHTML = scenario.expressions.map(item => `
    <div class="role-phrase"><div><p lang="en">${escapeHTML(item.english)}</p><span>${escapeHTML(item.korean)}</span>
      ${item.note ? `<small class="role-phrase-note">${escapeHTML(item.note)}</small>` : ''}</div>${speakButton(item.english)}</div>`).join('');
  selectCase(caseId, historyMode);
}

function selectCase(id, historyMode = 'push') {
  stopSpeech('');
  selectedCase = scenario.cases.find(item => item.id === id) || scenario.cases[0];
  turnIndex = 0;
  replies = [];
  draft = '';
  showHints = false;
  showExamples = false;
  renderCases();
  $('case-context').innerHTML = `<div class="case-context"><h3>${escapeHTML(selectedCase.title)}</h3>
    <p>${escapeHTML(selectedCase.context)}</p><span>상대: ${escapeHTML(selectedCase.partnerRole)} · 내 역할: 나</span></div>`;
  renderStage();
  renderScript();
  updateLocation(historyMode);
}

function renderLog() {
  if (!replies.length) return '';
  return `<details class="practice-log" ${turnIndex === selectedCase.turns.length ? 'open' : ''}>
    <summary>지금까지 나눈 대화 · ${replies.length}번 답변</summary><ol>${replies.map((reply, index) => `
      <li><p class="log-partner"><b>상대</b> <span lang="en">${escapeHTML(selectedCase.turns[index].partner.english)}</span></p>
        <p class="log-me"><b>나</b> ${reply ? `<span lang="en">${escapeHTML(reply)}</span>` : '<span class="spoken-answer">소리 내어 연습 완료</span>'}</p></li>`).join('')}</ol></details>`;
}

function renderStage() {
  const total = selectedCase.turns.length;
  if (turnIndex === total) {
    $('practice-stage').innerHTML = `<div class="practice-complete"><div class="eyebrow">Practice complete</div>
      <h3 id="stage-title" tabindex="-1">이 케이스를 끝까지 연습했어요.</h3>
      <p>예문과 똑같이 말하지 않아도 좋아요. 내 말로 다음 내용을 전했는지 돌아보세요.</p>
      <ul>${selectedCase.review.map(text => `<li>${escapeHTML(text)}</li>`).join('')}</ul>
      <div class="practice-actions"><button type="button" data-action="restart">다시 연습</button><button type="button" class="secondary" data-action="next-case">다른 케이스 연습</button></div></div>${renderLog()}`;
    return;
  }

  const turn = selectedCase.turns[turnIndex];
  $('practice-stage').innerHTML = `<div class="turn-progress"><span>내 차례 ${turnIndex + 1} / ${total}</span><progress value="${turnIndex}" max="${total}" aria-label="완료한 답변 수"></progress></div>
    <div class="partner-turn"><div class="turn-label">Your partner · ${escapeHTML(selectedCase.partnerRole)}</div>
      <h3 id="stage-title" tabindex="-1" lang="en">${escapeHTML(turn.partner.english)}</h3>
      <p class="dialogue-ko">${escapeHTML(turn.partner.korean)}</p>${speakButton(turn.partner.english, '▶ 상대 말 듣기')}</div>
    <div class="my-turn"><div class="turn-label">Your turn</div><p class="turn-mission">${escapeHTML(turn.mission)}</p>
      <label class="answer-label" for="my-answer">내 답변 적기 <span>선택 사항 · 소리 내어만 답해도 좋아요</span></label>
      <textarea id="my-answer" rows="3" maxlength="2000" placeholder="내 말로 영어 문장을 만들어보세요." lang="en">${escapeHTML(draft)}</textarea>
      <div class="help-actions"><button type="button" class="secondary small-button" data-action="hint" aria-controls="turn-hints" aria-expanded="${showHints}">표현 힌트 ${showHints ? '닫기' : '보기'}</button>
        <button type="button" class="secondary small-button" data-action="example" aria-controls="turn-examples" aria-expanded="${showExamples}">답변 예시 ${showExamples ? '닫기' : '보기'}</button></div>
      <div class="turn-hints" id="turn-hints" ${showHints ? '' : 'hidden'}>${turn.hints.map(text => `<span lang="en">${escapeHTML(text)}</span>`).join('')}</div>
      <div class="turn-examples" id="turn-examples" ${showExamples ? '' : 'hidden'}><p class="example-note">다음은 가능한 답변 중 하나예요.</p>${turn.responses.map(response => `
        <div class="response-example"><p lang="en">${escapeHTML(response.english)}</p><p class="dialogue-ko">${escapeHTML(response.korean)}</p>${speakButton(response.english)}</div>`).join('')}</div>
      <button type="button" class="advance-button" data-action="advance">대답했어요 · ${turnIndex + 1 === total ? '연습 마치기' : '다음 대화'} →</button></div>${renderLog()}`;
}

function renderScriptLine(line, label, className) {
  const study = line.study;
  return `<div class="${className}"><b>${escapeHTML(label)}</b>
    <p lang="en">${escapeHTML(line.english)}</p>
    <p class="script-translation">${escapeHTML(line.korean)}</p>
    ${study ? `<div class="script-study">
      ${study.explanation ? `<p class="script-explanation">${escapeHTML(study.explanation)}</p>` : ''}
      ${study.terms?.length ? `<dl class="script-terms" aria-label="단어와 표현">${study.terms.map(term => `<div><dt lang="en">${escapeHTML(term.english)}</dt><dd>${escapeHTML(term.korean)}</dd></div>`).join('')}</dl>` : ''}
    </div>` : ''}
  </div>`;
}

function renderScript() {
  $('practice-script').innerHTML = `<details class="practice-script"><summary>전체 대본 보기</summary>
    <p class="example-note">내 차례의 문장은 답변 예시예요. 내 상황에 맞게 바꿔 말해보세요.</p>
    <ol>${selectedCase.turns.map(turn => `<li>
      ${renderScriptLine(turn.partner, '상대', 'script-partner')}
      ${renderScriptLine(turn.responses[0], '나 · 답변 예시', 'script-me')}
    </li>`).join('')}</ol></details>`;
}

function advance() {
  if (turnIndex >= selectedCase.turns.length) return;
  stopSpeech('');
  replies.push($('my-answer').value.trim());
  turnIndex += 1;
  draft = '';
  showHints = false;
  showExamples = false;
  if (turnIndex === selectedCase.turns.length) {
    const id = caseKey(selectedCase);
    if (!progress.completed.includes(id)) progress.completed.push(id);
    saveProgress();
    renderCases();
  }
  renderStage();
  $('stage-title').focus({ preventScroll: true });
}

function renderEssentials() {
  $('essential-list').innerHTML = data.essentials.map(item => `<label class="essential-item">
    <input type="checkbox" data-memory="${escapeHTML(item.id)}" ${progress.memorized.includes(item.id) ? 'checked' : ''}>
    <span><strong lang="en">${escapeHTML(item.english)}</strong><small>${escapeHTML(item.korean)}</small></span></label>`).join('');
}

function stopSpeech(message) {
  speechVersion += 1;
  if (canSpeak) window.speechSynthesis.cancel();
  $('role-status').textContent = message;
}

function speak(text) {
  stopSpeech('');
  if (!canSpeak) {
    $('role-status').textContent = '이 브라우저에서는 영어 듣기를 지원하지 않습니다.';
    return;
  }
  const version = speechVersion;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = Number($('role-rate').value);
  $('role-status').textContent = '영어 음성 재생 중…';
  utterance.onend = () => { if (version === speechVersion) $('role-status').textContent = '듣기 완료'; };
  utterance.onerror = () => { if (version === speechVersion) $('role-status').textContent = '음성을 재생할 수 없습니다. 잠시 후 다시 눌러주세요.'; };
  window.speechSynthesis.speak(utterance);
}

$('role-main').onclick = event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !data) return;
  switch (button.dataset.action) {
    case 'scenario': selectScenario(button.dataset.id); break;
    case 'case': selectCase(button.dataset.id); break;
    case 'speak': speak(button.dataset.speak); break;
    case 'advance': advance(); break;
    case 'restart': selectCase(selectedCase.id); break;
    case 'next-case': {
      const index = scenario.cases.indexOf(selectedCase);
      selectCase(scenario.cases[(index + 1) % scenario.cases.length].id);
      break;
    }
    case 'hint':
    case 'example':
      draft = $('my-answer').value;
      if (button.dataset.action === 'hint') showHints = !showHints;
      else showExamples = !showExamples;
      renderStage();
      document.querySelector(`[data-action="${button.dataset.action}"]`).focus({ preventScroll: true });
      break;
  }
};

$('essential-list').onchange = event => {
  const id = event.target.dataset.memory;
  if (!id || !data.essentials.some(item => item.id === id)) return;
  progress.memorized = progress.memorized.filter(value => value !== id);
  if (event.target.checked) progress.memorized.push(id);
  saveProgress();
};
$('show-translations').onchange = event => document.body.classList.toggle('translations-hidden', !event.target.checked);
$('role-stop').onclick = () => stopSpeech('재생 정지');
$('reset-progress').onclick = () => {
  if (!data) return;
  progress.completed = [];
  progress.memorized = [];
  saveProgress();
  renderEssentials();
  renderCases();
  $('role-status').textContent = '학습 기록을 초기화했습니다.';
};
window.addEventListener('pagehide', () => stopSpeech(''));

async function init() {
  try {
    const response = await fetch('data/roleplay.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    const url = new URL(window.location.href);
    selectScenario(url.searchParams.get('scenario'), url.searchParams.get('case'), 'replace');
    renderEssentials();
    $('speaking-tips').innerHTML = data.speakingTips.map(item => `<article><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></article>`).join('');
    updateProgress();
    $('role-content').hidden = false;
    if (!canSpeak) $('role-status').textContent = '이 브라우저에서는 영어 듣기를 지원하지 않습니다. 문장을 보며 연습해 주세요.';
    window.addEventListener('popstate', () => {
      const current = new URL(window.location.href);
      selectScenario(current.searchParams.get('scenario'), current.searchParams.get('case'), 'replace');
    });
  } catch (error) {
    $('role-content').hidden = true;
    $('role-load-error').hidden = false;
    $('role-overview').textContent = '연습 자료를 불러오지 못했습니다.';
    console.error(error);
  } finally {
    $('role-main').removeAttribute('aria-busy');
  }
}

init();
