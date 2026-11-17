"use strict";

import { createAudioPlayer } from './audio-player.js';
import { createLessonView } from './lesson-view.js';

const $ = id => document.getElementById(id);
let catalog;
let selection = 0;
let view;
let activeLetterId;
let letterRange = 0;
const lettersPerRange = 50;

const player = createAudioPlayer({
  onSelect: index => view.selectSentence(index),
  onPlaying: index => view.markPlaying(index),
  onStatus: text => {
    $('player-status').textContent = text;
    $('hero-audio-status').textContent = text;
    $('chunk-status').textContent = text;
  },
  getRate: () => Number($('global-rate').value),
  shouldLoop: () => $('loop-single').checked,
  shouldFallback: () => $('auto-fallback').checked
});

view = createLessonView({
  onPlaySentence: index => player.playSentence(index),
  onPlayChunk: (index, chunkIndex) => player.playChunk(index, chunkIndex),
  onStop: () => player.stop()
});

$('play-all').onclick = () => player.playFull();
$('hero-play-all').onclick = () => player.playFull();
$('hero-stop').onclick = () => player.stop();
$('stop-all').onclick = () => player.stop();
$('chunk-stop').onclick = () => player.stop();
$('global-rate').onchange = () => player.setRate(Number($('global-rate').value));
window.addEventListener('pagehide', () => player.stop());

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json();
}

function renderNavigation() {
  const focused = document.activeElement?.dataset;
  const focusedLetter = focused?.letter;
  const focusedRange = focused?.range;
  const query = $('letter-search').value.trim();
  const number = /^\d+$/.test(query) ? Number(query) : NaN;
  const visible = query
    ? catalog.letters.filter(letter => letter.number === number)
    : catalog.letters.slice(letterRange * lettersPerRange, (letterRange + 1) * lettersPerRange);
  const ranges = Array.from({ length: Math.ceil(catalog.letters.length / lettersPerRange) }, (_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'letter-range';
    button.dataset.range = String(index);
    button.textContent = `${index * lettersPerRange + 1}–${Math.min((index + 1) * lettersPerRange, catalog.letters.length)}`;
    button.setAttribute('aria-pressed', String(index === letterRange));
    button.onclick = () => {
      letterRange = index;
      $('letter-search').value = '';
      renderNavigation();
    };
    return button;
  });
  $('letter-ranges').replaceChildren(...ranges);
  const links = visible.map(letter => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const url = new URL(window.location.href);
    url.searchParams.set('letter', letter.id);
    link.href = url.href;
    link.className = `letter-link${letter.file ? '' : ' pending'}`;
    link.dataset.letter = letter.id;
    link.textContent = `Letter ${letter.number}`;
    link.setAttribute('aria-label', `Letter ${letter.number}${letter.file ? '' : ' · 준비 중'}`);
    if (letter.id === activeLetterId) link.setAttribute('aria-current', 'page');
    link.onclick = event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectLetter(letter.id, 'push');
    };
    item.append(link);
    return item;
  });
  $('letter-list').replaceChildren(...links);
  $('letter-index-empty').hidden = visible.length > 0;
  $('letter-index-summary').textContent = `전체 ${catalog.letters.length}편 · 본문 ${catalog.letters.filter(letter => letter.file).length}편`;
  if (focusedLetter) $('letter-list').querySelector(`[data-letter="${focusedLetter}"]`)?.focus();
  if (focusedRange !== undefined) $('letter-ranges').querySelector(`[data-range="${focusedRange}"]`)?.focus();
}

$('letter-search').oninput = () => {
  if (!catalog?.letters) return;
  const number = Number($('letter-search').value);
  if (Number.isInteger(number) && number >= 1 && number <= catalog.letters.length) {
    letterRange = Math.floor((number - 1) / lettersPerRange);
  }
  renderNavigation();
};
$('letter-search').onkeydown = event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    $('letter-list').querySelector('a')?.click();
  }
};

function showMessage(title, text) {
  $('letter-message-title').textContent = title;
  $('letter-message-text').textContent = text;
  $('letter-message').hidden = false;
}

async function selectLetter(id, historyMode = 'replace') {
  const letter = catalog.letters.find(item => item.id === id)
    || catalog.letters.find(item => /^letter-\d+$/.test(id || '') && item.number === Number(id.slice(7)))
    || catalog.letters.find(item => item.id === catalog.defaultLetter)
    || catalog.letters[0];
  const token = ++selection;

  player.setLesson(null);
  view.clearVideo();
  $('lesson-content').hidden = true;
  $('hero-player').hidden = true;
  $('letter-message').hidden = true;
  $('letter-lesson').textContent = '';
  $('letter-lesson').hidden = true;
  $('study-main').removeAttribute('aria-busy');
  $('letter-heading').textContent = `Letter ${letter.number}`;
  $('letter-date').textContent = letter.title;
  document.title = `Osho Letters · Letter ${letter.number} (${letter.title}) — English Study`;
  activeLetterId = letter.id;
  letterRange = Math.floor((letter.number - 1) / lettersPerRange);
  $('letter-search').value = '';
  renderNavigation();

  const url = new URL(window.location.href);
  if (url.searchParams.get('letter') !== letter.id) {
    url.searchParams.set('letter', letter.id);
    if (historyMode === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }

  if (!letter.file) {
    $('letter-status').textContent = '아직 등록되지 않은 편지입니다.';
    showMessage(`Letter ${letter.number} · 준비 중`, '아직 본문이 등록되지 않았어요. 목차의 진한 글씨로 표시된 편지를 먼저 읽어보세요.');
    return;
  }

  $('letter-status').textContent = '편지를 불러오는 중…';
  $('study-main').setAttribute('aria-busy', 'true');
  try {
    const lesson = await readJSON(letter.file);
    if (token !== selection) return;
    view.render(lesson);
    player.setLesson(lesson);
    $('letter-lesson').textContent = typeof lesson.lesson === 'string' ? lesson.lesson.trim() : '';
    $('letter-lesson').hidden = !$('letter-lesson').textContent;
    $('lesson-content').hidden = false;
    $('hero-player').hidden = !lesson.fullAudio;
    $('play-all').disabled = !lesson.fullAudio;
    $('letter-status').textContent = `Letter ${letter.number} · ${lesson.sentences.length}개 문장`;
    $('player-status').textContent = lesson.contentStatus?.audio === 'not-created'
      ? '영어 원문이 등록되었습니다. 녹음 파일은 아직 준비되지 않았습니다.'
      : '문장을 누르면 해당 MP3를 재생합니다. 전체 듣기는 편지 전체 음원을 재생합니다.';
    $('hero-audio-status').textContent = '전체 편지 듣기';
  } catch (error) {
    if (token !== selection) return;
    $('letter-status').textContent = '편지를 불러오지 못했습니다.';
    showMessage('본문을 불러올 수 없어요', '잠시 후 편지 링크를 다시 눌러주세요. 로컬에서는 HTTP 서버로 실행해 주세요.');
    console.error(error);
  } finally {
    if (token === selection) $('study-main').removeAttribute('aria-busy');
  }
}

async function init() {
  try {
    catalog = await readJSON('data/letters.json');
    if (!Array.isArray(catalog.letters) || !catalog.letters.length) throw new Error('편지 목록이 비어 있습니다.');
    const registered = new Map(catalog.letters.map(letter => [letter.number, letter]));
    const total = Math.max(365, Number(catalog.totalLetters) || 0, ...registered.keys());
    catalog.letters = Array.from({ length: total }, (_, index) => registered.get(index + 1) || {
      id: `letter-${String(index + 1).padStart(3, '0')}`,
      number: index + 1,
      title: '본문 준비 중',
      file: null
    });
    renderNavigation();
    await selectLetter(new URL(window.location.href).searchParams.get('letter'));
    window.addEventListener('popstate', () => {
      selectLetter(new URL(window.location.href).searchParams.get('letter'));
    });
  } catch (error) {
    $('letter-status').textContent = '편지 목록을 불러오지 못했습니다.';
    showMessage('편지 목록을 불러올 수 없어요', '새로고침해 주세요. 로컬에서는 python3 -m http.server 8000으로 실행한 뒤 localhost:8000을 열어주세요.');
    console.error(error);
  }
}

init();
