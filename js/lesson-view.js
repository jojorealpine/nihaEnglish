"use strict";

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

// 단어, 본문, 해설, 번역을 표시합니다. 재생은 audio-player.js에서 담당합니다.
export function createLessonView({ onPlaySentence, onStop }) {
  let lesson = null;

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
    $('vocab').innerHTML = lesson.vocabulary.map(item => `
      <div class="vocab"><strong>${escapeHTML(item.word)}</strong>
        <div class="ko">${escapeHTML(item.meaning)}</div><small>${escapeHTML(item.note)}</small></div>`).join('');
    $('reading').innerHTML = lesson.paragraphs.map(indices => `
      <div class="paragraph">${indices.map(index => `
        <span class="sentence" role="button" tabindex="0" data-index="${index}"
          aria-label="문장 ${index + 1} 듣기와 해설" aria-pressed="false">
          <span class="sentence-num">${String(index + 1).padStart(2, '0')}</span>${escapeHTML(lesson.sentences[index].english)}
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
