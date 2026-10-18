"use strict";

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

// 단어, 본문, 해설, 번역을 표시합니다. 재생은 audio-player.js에서 담당합니다.
export function createLessonView({ onPlaySentence, onStop }) {
  let lesson = null;
  const studyTabs = Array.from($('study-tabs').querySelectorAll('[role="tab"]'));

  function selectStudyTab(selectedTab) {
    studyTabs.forEach(tab => {
      const selected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }

  studyTabs.forEach((tab, index) => {
    tab.onclick = () => selectStudyTab(tab);
    tab.onkeydown = event => {
      let next;
      switch (event.key) {
        case 'ArrowRight': next = (index + 1) % studyTabs.length; break;
        case 'ArrowLeft': next = (index - 1 + studyTabs.length) % studyTabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = studyTabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      selectStudyTab(studyTabs[next]);
      studyTabs[next].focus();
    };
  });

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
      <div class="selected-ko">${escapeHTML(sentence.korean)}</div>
      <div class="speech-controls">
        <button id="speak-one" type="button">▶ 문장 듣기</button>
        <button id="stop-one" type="button" class="secondary">■ 멈춤</button>
      </div>
      <p class="explain">${escapeHTML(sentence.explanation)}</p>
      <div class="grammar"><strong>영어 표현 · 문법 포인트</strong>${escapeHTML(sentence.grammar)}</div>`;
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
    $('expressions').innerHTML = expressions.length
      ? renderExpressions(expressions)
      : '<p class="collection-empty">아직 등록된 표현이 없습니다.</p>';
    selectStudyTab(studyTabs[0]);
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

// 설명과 예문이 있는 표현은 클릭/키보드로 펼칠 수 있는 목록으로 표시합니다.
function renderExpressions(items) {
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

    return `<details class="expression-item">
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
