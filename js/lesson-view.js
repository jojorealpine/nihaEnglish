"use strict";

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

// 단어, 본문, 해설, 번역을 표시합니다. 재생은 audio-player.js에서 담당합니다.
export function createLessonView({ onPlaySentence, onPlayChunk, onStop }) {
  let lesson = null;
  const readingTabs = Array.from($('reading-tabs').querySelectorAll('[role="tab"]'));
  const studyTabs = Array.from($('study-tabs').querySelectorAll('[role="tab"]'));

  function selectStudyTab(selectedTab, tabs = studyTabs) {
    tabs.forEach(tab => {
      const selected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }

  [studyTabs, readingTabs].forEach(tabs => tabs.forEach((tab, index) => {
    tab.onclick = () => selectStudyTab(tab, tabs);
    tab.onkeydown = event => {
      let next;
      switch (event.key) {
        case 'ArrowRight': next = (index + 1) % tabs.length; break;
        case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectStudyTab(tabs[next], tabs);
      tabs[next].focus();
    };
  }));

  function selectSentence(index) {
    const sentence = lesson?.sentences[index];
    if (!sentence) return;
    document.querySelectorAll('.sentence').forEach(element => {
      const selected = Number(element.dataset.index) === index;
      element.classList.toggle('active', selected);
      element.setAttribute('aria-pressed', String(selected));
    });
    $('detail').innerHTML = `
      <div class="number">SENTENCE ${String(index + 1).padStart(2, '0')} / ${lesson.sentences.length}</div>
      <p class="selected-en">${escapeHTML(sentence.english)}</p>
      ${sentence.korean ? `<h3 class="sentence-detail-title">한국어 해석</h3><div class="selected-ko">${escapeHTML(sentence.korean)}</div>` : ''}
      <div class="speech-controls">
        <button id="speak-one" type="button">▶ 문장 듣기</button>
        <button id="stop-one" type="button" class="secondary">■ 멈춤</button>
      </div>
      ${sentence.explanation ? `<h3 class="sentence-detail-title">문장 설명</h3><p class="explain">${escapeHTML(sentence.explanation)}</p>` : ''}
      ${renderSentenceStudy(lesson, sentence)}
      ${sentence.grammar ? `<div class="grammar"><strong>문법 설명</strong>${escapeHTML(sentence.grammar)}</div>` : ''}`;
    $('speak-one').onclick = () => onPlaySentence(index);
    $('stop-one').onclick = onStop;
  }

  function markPlaying(index) {
    document.querySelectorAll('.sentence').forEach(element => {
      element.classList.toggle('playing', Number(element.dataset.index) === index);
    });
  }

  function render(data) {
    lesson = data;
    $('vocab').innerHTML = renderCards(lesson.vocabulary, 'word');
    const expressions = Array.isArray(lesson.expressions) ? lesson.expressions : [];
    $('vocab').closest('.section').hidden = !lesson.vocabulary.length && !expressions.length;
    $('translation').closest('.section').hidden = !lesson.translations.length;
    $('expressions').innerHTML = expressions.length
      ? renderExpressions(expressions)
      : '<p class="collection-empty">아직 등록된 표현이 없습니다.</p>';
    selectStudyTab(studyTabs[0]);
    selectStudyTab(readingTabs[0], readingTabs);
    $('chunk-reading').innerHTML = lesson.paragraphs.map(indices => `
      <div class="paragraph">${indices.map(index => {
        const sentence = lesson.sentences[index];
        const chunks = sentence.chunks || [sentence.english];
        return `<div class="chunk-sentence">
          <div lang="en">${chunks.map((chunk, chunkIndex) => `
            <button type="button" class="chunk-phrase" data-index="${index}" data-chunk="${chunkIndex}" aria-label="구절 듣기: ${escapeHTML(chunk)}">${escapeHTML(chunk)}</button>`
          ).join('<span class="chunk-divider"> / </span>')}</div>
          ${sentence.korean ? `<p class="chunk-translation" lang="ko">${escapeHTML(sentence.korean)}</p>` : ''}
        </div>`;
      }).join('')}</div>`).join('');
    $('test-reading').innerHTML = lesson.paragraphs.map(indices => `
      <div class="paragraph">${indices.map(index => {
        const sentence = lesson.sentences[index];
        const words = sentence.english.trim().split(/\s+/);
        const masked = words.map((word, position) => position === 0
          ? word
          : word.replace(/[\p{L}\p{N}]/gu, '_')).join(' ');
        return `<div class="test-sentence-row${sentence.korean ? '' : ' no-translation'}">
          <div class="test-english" lang="en">${escapeHTML(masked)}</div>
          ${sentence.korean ? `<div class="test-korean" lang="ko">${escapeHTML(sentence.korean)}</div>` : ''}
        </div>`;
      }).join('')}</div>`).join('');
    $('reading').innerHTML = lesson.paragraphs.map(indices => `
      <div class="paragraph">${indices.map(index => `
        <span class="sentence" role="button" tabindex="0" data-index="${index}"
          aria-label="문장 ${index + 1} 듣기와 해설" aria-pressed="false">
          ${escapeHTML(lesson.sentences[index].english)}
        </span>`).join(' ')}</div>`).join('');
    $('translation').innerHTML = lesson.translations.map(text => `<p>${escapeHTML(text)}</p>`).join('');
    selectSentence(0);
    resetVideo(lesson.youtubeUrl);
  }

  $('reading').onclick = event => {
    const element = event.target.closest('.sentence');
    if (element) onPlaySentence(Number(element.dataset.index));
  };

  $('chunk-reading').onclick = event => {
    const button = event.target.closest('.chunk-phrase');
    if (button) onPlayChunk(Number(button.dataset.index), Number(button.dataset.chunk));
  };
  $('reading').onkeydown = event => {
    const element = event.target.closest('.sentence');
    if (element && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      onPlaySentence(Number(element.dataset.index));
    }
  };

  // 영상 영역이 HTML 주석으로 숨겨져 있어도 초기화가 중단되지 않습니다.
  if ($('load-video') && $('clear-video')) {
    $('load-video').onclick = () => {
      const id = videoId($('youtube-url').value.trim());
      if (!id) {
        $('video-status').textContent = '올바른 유튜브 주소를 입력하세요.';
        return;
      }
      $('video-frame').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube" loading="lazy" allowfullscreen></iframe>`;
      $('video-frame').classList.remove('hide');
      $('video-status').textContent = '';
    };
    $('clear-video').onclick = () => resetVideo('');
  }

  return { render, selectSentence, markPlaying, clearVideo: () => resetVideo('') };
}

function renderCards(items, textKey) {
  return items.map(item => `
    <div class="vocab"><strong>${escapeHTML(item[textKey])}</strong>
      <div class="ko">${escapeHTML(item.meaning)}</div>
      ${item.note ? `<small>${escapeHTML(item.note)}</small>` : ''}</div>`).join('');
}

const normalizedWords = text => String(text).toLowerCase().replace(/[’‘]/g, "'").match(/[a-z]+(?:'[a-z]+)?/g) || [];
const irregularForms = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  have: ['has', 'had', 'having'],
  become: ['becomes', 'became', 'becoming'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  take: ['takes', 'took', 'taken', 'taking'],
  mean: ['means', 'meant', 'meaning'],
  know: ['knows', 'knew', 'known', 'knowing'],
  oneself: ['myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves']
};

function wordForms(word) {
  const roots = new Set([word]);
  for (const [base, forms] of Object.entries(irregularForms)) {
    if (base === word || forms.includes(word)) roots.add(base);
  }
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) roots.add(word.slice(0, -1));
  if (word.endsWith('ed')) { roots.add(word.slice(0, -2)); roots.add(word.slice(0, -1)); }
  if (word.endsWith('ing')) { roots.add(word.slice(0, -3)); roots.add(word.slice(0, -3) + 'e'); }
  const result = new Set();
  for (const root of roots) {
    if (!root) continue;
    if (irregularForms[root]) {
      [root, ...irregularForms[root]].forEach(form => result.add(form));
      continue;
    }
    [root, root + 's', root + 'es', root + 'ed', root + 'ing', ...(irregularForms[root] || [])].forEach(form => result.add(form));
    if (root.endsWith('e')) { result.add(root + 'd'); result.add(root.slice(0, -1) + 'ing'); }
    if (root.endsWith('y')) { result.add(root.slice(0, -1) + 'ies'); result.add(root.slice(0, -1) + 'ied'); }
    if (/[^aeiou][aeiou][b-df-hj-np-tv-z]$/.test(root)) {
      result.add(root + root.slice(-1) + 'ing');
      result.add(root + root.slice(-1) + 'ed');
    }
  }
  return result;
}

function matchesStudyItem(item, key, sentence) {
  // Explicit sentence links take priority; otherwise use source text and word forms.
  if (Array.isArray(item.sentenceIds)) return item.sentenceIds.includes(sentence.id);
  const sentenceWords = normalizedWords(sentence.english);
  const original = normalizedWords(item.original || '').join(' ');
  const fullText = sentenceWords.join(' ');
  if (original && (fullText.includes(original) || (sentenceWords.length >= 3 && original.includes(fullText)))) return true;
  const label = item[key] || '';
  const pattern = normalizedWords(label.replace(/-ing\b/gi, '').replace(/\b[A-B]\b/g, ''));
  if (!pattern.length) return false;
  let cursor = 0;
  for (let index = 0; index < pattern.length; index += 1) {
    const forms = wordForms(pattern[index]);
    let found = -1;
    for (let position = cursor; position < sentenceWords.length; position += 1) {
      if (forms.has(sentenceWords[position])) { found = position; break; }
    }
    if (found < 0 || (index > 0 && found - cursor > 6)) return false;
    cursor = found + 1;
  }
  return true;
}

function renderSentenceStudy(data, sentence) {
  const unique = (items, key) => {
    const found = new Map();
    items.forEach(item => {
      const label = normalizedWords(item[key]).join(' ');
      if (label && !found.has(label)) found.set(label, item);
    });
    return Array.from(found.values());
  };
  const words = unique([...(sentence.vocabulary || []),
    ...(data.vocabulary || []).filter(item => matchesStudyItem(item, 'word', sentence))], 'word');
  const expressions = unique([...(sentence.expressions || []),
    ...(data.expressions || []).filter(item => matchesStudyItem(item, 'expression', sentence))], 'expression');
  if (!words.length && !expressions.length) return '';
  return `<section class="sentence-study" aria-label="이 문장의 단어와 표현">
    <h3>이 문장의 단어와 표현</h3>
    ${words.length ? `<h4>핵심 단어</h4><dl class="sentence-study-words">${words.map(item => `
      <div><dt lang="en">${escapeHTML(item.word)}</dt><dd>${escapeHTML(item.meaning)}
        ${item.note ? `<p>${formatInlineCode(item.note)}</p>` : ''}</dd></div>`).join('')}</dl>` : ''}
    ${expressions.length ? `<h4>관용어·표현 설명</h4>${renderExpressions(expressions, true)}`
      : ['generated', 'curated', 'reviewed'].includes(sentence.studyStatus) ? '<h4>관용어·표현 설명</h4><p class="study-empty-note">이 문장에 따로 정리한 관용표현은 없습니다.</p>' : ''}
  </section>`;
}

// 설명과 예문이 있는 표현은 클릭/키보드로 펼칠 수 있는 목록으로 표시합니다.
function renderExpressions(items, expanded = false) {
  const metaKey = items.some(item => item.usage) ? 'usage' : 'grammar';
  const showMeta = items.some(item => item[metaKey]);
  const metaLabel = metaKey === 'usage' ? '활용도' : '핵심 문법';
  const meaningLabel = metaKey === 'usage' ? '뜻' : '의미';
  const rows = items.map(item => {
    const examples = Array.isArray(item.examples) ? item.examples : [];
    const notes = Array.isArray(item.notes) ? item.notes : [];
    const hasDetails = item.title || item.detailMeaning || item.original || item.explanation || item.note || notes.length || examples.length;
    const cells = `
      <span class="expression-name">${escapeHTML(item.expression)}</span>
      <span class="expression-meaning" data-label="${meaningLabel}">${escapeHTML(item.meaning)}</span>
      ${showMeta ? `<span class="expression-meta" data-label="${metaLabel}">${escapeHTML(item[metaKey] || '—')}</span>` : ''}`;
    if (!hasDetails) return `<div class="expression-row expression-static">${cells}</div>`;

    return `<details class="expression-item"${expanded ? ' open' : ''}>
      <summary class="expression-row">${cells}</summary>
      <div class="expression-detail">
        <h3>${escapeHTML(item.title || item.expression)}</h3>
        <p><strong>의미:</strong> ${escapeHTML(item.detailMeaning || item.meaning)}</p>
        ${item.original ? `<div class="expression-original"><h4>원문</h4><p lang="en">${escapeHTML(item.original)}</p></div>` : ''}
        ${item.explanation || item.note || notes.length ? `<div class="expression-notes"><h4>특이사항</h4>
          ${item.explanation || item.note ? `<p>${formatInlineCode(item.explanation || item.note)}</p>` : ''}
          ${notes.length ? `<ul>${notes.map(note => `<li>${formatInlineCode(note)}</li>`).join('')}</ul>` : ''}</div>` : ''}
        ${examples.length ? `<div class="expression-examples"><h4>예문</h4><ul>${examples.map(example => `
          <li><span class="example-en" lang="en">${escapeHTML(example.english)}</span>
            <span class="example-ko">${escapeHTML(example.korean)}</span></li>`).join('')}</ul></div>` : ''}
      </div>
    </details>`;
  }).join('');

  return `<div class="expression-list${showMeta ? ' with-meta' : ''}">
    <div class="expression-row expression-list-header" aria-hidden="true">
      <span>핵심 표현</span><span>${meaningLabel}</span>${showMeta ? `<span>${metaLabel}</span>` : ''}
    </div>${rows}</div>`;
}

function formatInlineCode(text) {
  return escapeHTML(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function resetVideo(url) {
  if (!$('youtube-url')) return;
  $('youtube-url').value = url || '';
  $('video-frame').replaceChildren();
  $('video-frame').classList.add('hide');
  $('video-status').textContent = '';
}

function videoId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    }
  } catch { /* 잘못된 주소는 null을 반환합니다. */ }
  return null;
}
