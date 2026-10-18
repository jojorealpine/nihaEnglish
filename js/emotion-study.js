const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

// 학습 내용은 emotions.json, 대화 원문은 roleplay.json에서 관리합니다.
export function initEmotionStudy({ data, canSpeak, listenButton, stopSpeech }) {
  const patterns = new Map(data.patterns.map(pattern => [pattern.id, pattern]));
  const tabs = Array.from($('emotion-study-tabs').querySelectorAll('[role="tab"]'));
  const steps = data.speakingPractice;
  const answers = steps.map(() => '');
  let patternFilter = 'all';
  let stepIndex = 0;
  let showExamples = false;
  let reviewing = false;

  function stop() {
    stopSpeech(canSpeak ? '' : '이 브라우저에서는 듣기를 지원하지 않습니다. 예문을 보며 연습해보세요.');
  }

  function selectTab(id, updateHash = false) {
    const active = tabs.find(tab => tab.dataset.emotionTab === id) || tabs[0];
    stop();
    tabs.forEach(tab => {
      const selected = tab === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (updateHash) {
      const url = new URL(window.location.href);
      url.hash = active.dataset.emotionTab;
      window.history.replaceState(null, '', url);
    }
  }

  function renderFlow() {
    $('emotion-flow').innerHTML = data.sharingFlow.map((item, index) => `<li>
      <button type="button" data-study-action="jump-pattern" data-pattern="${escapeHTML(item.patternId)}">
        <span class="emotion-flow-number">${index + 1}</span><strong>${escapeHTML(item.label)}</strong>
        <span lang="en">${escapeHTML(patterns.get(item.patternId).expression)}</span>
        <small>${escapeHTML(item.hint)}</small>
      </button></li>`).join('');
  }

  function renderPatterns() {
    $('emotion-patterns').innerHTML = data.patternGroups.map(group => {
      const items = data.patterns.filter(pattern => pattern.group === group.id && (patternFilter === 'all' || pattern.starter));
      if (!items.length) return '';
      return `<section class="emotion-pattern-group" aria-labelledby="pattern-group-${escapeHTML(group.id)}">
        <h3 id="pattern-group-${escapeHTML(group.id)}">${escapeHTML(group.title)} <span lang="en">${escapeHTML(group.englishTitle)}</span></h3>
        <div class="emotion-pattern-columns" aria-hidden="true"><span>핵심 표현</span><span>의미</span><span>언제 사용하나요?</span></div>
        ${items.map(pattern => `<details class="emotion-pattern" id="pattern-${escapeHTML(pattern.id)}">
          <summary><span class="emotion-pattern-name" lang="en">${escapeHTML(pattern.expression)}${pattern.starter ? '<small lang="ko">먼저 익히기</small>' : ''}</span>
            <span>${escapeHTML(pattern.meaning)}</span><span class="emotion-pattern-usage">${escapeHTML(pattern.usage)}</span></summary>
          <div class="emotion-pattern-detail"><h4>이렇게 연결해요</h4>
            <p class="emotion-formula">${escapeHTML(pattern.formula)}</p><p class="emotion-rule">${escapeHTML(pattern.explanation)}</p>
            <div class="emotion-pattern-examples">${pattern.examples.map(example => `<article>
              <p class="emotion-example-en" lang="en">${escapeHTML(example.english)}</p><p class="emotion-example-ko">${escapeHTML(example.korean)}</p>${listenButton(example.english)}</article>`).join('')}</div>
          </div></details>`).join('')}
      </section>`;
    }).join('');
    document.querySelectorAll('[data-study-action="pattern-filter"]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === patternFilter));
    });
  }

  function openPattern(id) {
    if (!patterns.has(id)) return;
    if (patternFilter !== 'all' && !patterns.get(id).starter) {
      patternFilter = 'all';
      renderPatterns();
    }
    selectTab('patterns', true);
    const detail = $(`pattern-${id}`);
    detail.open = true;
    detail.querySelector('summary').focus();
  }

  function renderStarters() {
    $('emotion-starters').innerHTML = `<h3>이 다섯 가지부터 시작해요</h3>
      <p>한 번에 모두 외우기보다, 감정부터 변화까지 내 경험에 맞는 한 문장을 만들어보세요.</p>
      <div>${data.patterns.filter(pattern => pattern.starter).map(pattern => `<button type="button" class="secondary" data-study-action="jump-pattern" data-pattern="${escapeHTML(pattern.id)}" lang="en">${escapeHTML(pattern.expression)}</button>`).join('')}</div>`;
  }

  function roleplayURL() {
    return `roleplay.html?scenario=${encodeURIComponent(data.roleplay.scenarioId)}&case=${encodeURIComponent(data.roleplay.caseId)}`;
  }

  async function loadDialogue() {
    const container = $('emotion-dialogue');
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="emotion-status" role="status">대화 예시를 불러오는 중…</p>';
    try {
      const response = await fetch('data/roleplay.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const roleplay = await response.json();
      const scenario = roleplay.scenarios.find(item => item.id === data.roleplay.scenarioId);
      const dialogue = scenario?.cases.find(item => item.id === data.roleplay.caseId);
      if (!dialogue?.turns.length) throw new Error('연결된 대화가 없습니다.');
      container.innerHTML = `<div class="emotion-dialogue-heading"><div><h3 lang="en">${escapeHTML(data.roleplay.title)}</h3>
        <p>${escapeHTML(data.roleplay.description)}</p></div><label class="emotion-translation-toggle"><input type="checkbox" id="emotion-show-dialogue-translations"> 해석 보기</label></div>
        <ol class="emotion-dialogue-turns">${dialogue.turns.map(turn => `<li>
          <article class="emotion-dialogue-partner"><h4>A · 함께 명상한 참가자</h4><p class="emotion-example-en" lang="en">${escapeHTML(turn.partner.english)}</p>
            <p class="emotion-dialogue-ko">${escapeHTML(turn.partner.korean)}</p>${listenButton(turn.partner.english, '▶ A 듣기')}</article>
          <article class="emotion-dialogue-me"><h4>B · 나의 경험</h4><p class="emotion-example-en" lang="en">${escapeHTML(turn.responses[0].english)}</p>
            <p class="emotion-dialogue-ko">${escapeHTML(turn.responses[0].korean)}</p>${listenButton(turn.responses[0].english, '▶ B 듣기')}</article>
        </li>`).join('')}</ol>
        <a class="btn" href="${escapeHTML(roleplayURL())}">내 차례에 직접 답하며 연습하기 ↗</a>`;
    } catch (error) {
      container.innerHTML = `<p class="emotion-status" role="status">대화 예시를 불러오지 못했어요. 다시 불러오거나 Role Playing에서 연습해보세요.</p>
        <button type="button" class="secondary" data-study-action="retry-dialogue">다시 불러오기</button>
        <a class="emotion-practice-link" href="${escapeHTML(roleplayURL())}">Role Playing으로 이동 →</a>`;
      console.error(error);
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  function saveAnswer() {
    const input = $('emotion-speaking-answer');
    if (input) answers[stepIndex] = input.value;
  }

  function renderSpeaking() {
    if (reviewing) {
      const written = answers.map((answer, index) => ({ answer: answer.trim(), index })).filter(item => item.answer);
      const story = written.map(item => item.answer).join(' ');
      $('emotion-speaking').innerHTML = `<div class="emotion-speaking-progress"><span>내 이야기 모아보기</span><span>${written.length} / ${steps.length}개 답변 작성</span></div>
        <h3 id="emotion-speaking-title" tabindex="-1">내 말로 이어보기</h3>
        <p class="emotion-rule">내가 적은 문장들을 천천히 이어 말해보세요. 적지 않은 부분은 소리 내어 연습하거나, 이전 질문으로 돌아가 채워볼 수 있어요.</p>
        ${written.length ? `<ol class="emotion-story">${written.map(item => `<li><span>${escapeHTML(data.sharingFlow[item.index].label)}</span><p lang="en">${escapeHTML(item.answer)}</p></li>`).join('')}</ol>${listenButton(story, '▶ 내 이야기 듣기')}` : '<p class="emotion-empty-story">아직 적은 답변이 없어요. 소리 내어 말한 경험을 떠올려보거나, 첫 질문으로 돌아가 한 문장부터 적어보세요.</p>'}
        <div class="emotion-speaking-actions"><button type="button" class="secondary" data-study-action="previous">이전 질문</button><button type="button" data-study-action="first">첫 질문으로</button></div>`;
      return;
    }
    const step = steps[stepIndex];
    const pattern = patterns.get(step.patternId);
    $('emotion-speaking').innerHTML = `<div class="emotion-speaking-progress"><span>Speaking Practice · ${stepIndex + 1} / ${steps.length}</span><span>${escapeHTML(data.sharingFlow[stepIndex].label)}</span></div>
      <progress value="${stepIndex + 1}" max="${steps.length}" aria-label="현재 질문"></progress>
      <p class="emotion-question-label">상황 질문</p><h3 id="emotion-speaking-title" tabindex="-1">${escapeHTML(step.question)}</h3>
      <p class="emotion-speaking-pattern" lang="en">${escapeHTML(pattern.expression)}</p>
      <p class="emotion-formula">${escapeHTML(pattern.formula)}</p><p class="emotion-rule">${escapeHTML(step.hint)}</p>
      <label class="emotion-answer-label" for="emotion-speaking-answer">내 답변 적기 <span>선택 사항 · 소리 내어만 말해도 좋아요</span></label>
      <textarea id="emotion-speaking-answer" rows="3" maxlength="1500" lang="en" placeholder="내 경험을 한 문장으로 말해보세요.">${escapeHTML(answers[stepIndex])}</textarea>
      <button type="button" class="secondary" data-study-action="speaking-example" aria-controls="emotion-speaking-examples" aria-expanded="${showExamples}">예문 ${showExamples ? '닫기' : '확인'}</button>
      <div class="emotion-speaking-examples" id="emotion-speaking-examples" ${showExamples ? '' : 'hidden'}>${step.examples.map(example => `<article>
        <p class="emotion-example-en" lang="en">${escapeHTML(example.english)}</p><p class="emotion-example-ko">${escapeHTML(example.korean)}</p>${listenButton(example.english)}</article>`).join('')}</div>
      <div class="emotion-speaking-actions"><button type="button" class="secondary" data-study-action="previous" ${stepIndex === 0 ? 'disabled' : ''}>← 이전</button>
        <button type="button" data-study-action="next">${stepIndex + 1 === steps.length ? '내 이야기 모아보기' : '다음 →'}</button></div>`;
  }

  $('emotion-study-tabs').onclick = event => {
    const tab = event.target.closest('[data-emotion-tab]');
    if (tab) selectTab(tab.dataset.emotionTab, true);
  };
  $('emotion-study-tabs').onkeydown = event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const keys = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = tabs[keys[event.key]];
    selectTab(next.dataset.emotionTab, true);
    next.focus();
  };
  $('emotion-content').onclick = event => {
    const button = event.target.closest('[data-study-action]');
    if (!button) return;
    const action = button.dataset.studyAction;
    if (action === 'jump-pattern') { openPattern(button.dataset.pattern); return; }
    if (action === 'pattern-filter') {
      stop();
      patternFilter = button.dataset.filter;
      renderPatterns();
      return;
    }
    if (action === 'retry-dialogue') { loadDialogue(); return; }
    saveAnswer();
    stop();
    if (action === 'speaking-example') showExamples = !showExamples;
    if (action === 'previous') {
      if (reviewing) reviewing = false;
      else stepIndex = Math.max(0, stepIndex - 1);
      showExamples = false;
    }
    if (action === 'next') {
      if (stepIndex + 1 === steps.length) reviewing = true;
      else stepIndex += 1;
      showExamples = false;
    }
    if (action === 'first') { reviewing = false; stepIndex = 0; showExamples = false; }
    renderSpeaking();
    if (action === 'speaking-example') document.querySelector('[data-study-action="speaking-example"]').focus({ preventScroll: true });
    else $('emotion-speaking-title').focus({ preventScroll: true });
  };
  $('emotion-content').oninput = event => {
    if (event.target.id === 'emotion-speaking-answer') answers[stepIndex] = event.target.value;
  };
  $('emotion-content').onchange = event => {
    if (event.target.id === 'emotion-show-dialogue-translations') $('emotion-dialogue').classList.toggle('show-translations', event.target.checked);
  };
  window.onhashchange = () => selectTab(window.location.hash.slice(1));

  renderFlow();
  renderStarters();
  renderPatterns();
  renderSpeaking();
  selectTab(window.location.hash.slice(1));
  loadDialogue();
}
