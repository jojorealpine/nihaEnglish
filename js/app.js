"use strict";

import { createAudioPlayer } from './audio-player.js';
import { createLessonView } from './lesson-view.js';

const $ = id => document.getElementById(id);
let catalog;
let selection = 0;
let view;

const player = createAudioPlayer({
  onSelect: index => view.selectSentence(index),
  onPlaying: index => view.markPlaying(index),
  onStatus: text => {
    $('player-status').textContent = text;
    $('hero-audio-status').textContent = text;
  },
  getRate: () => Number($('global-rate').value),
  shouldLoop: () => $('loop-single').checked,
  shouldFallback: () => $('auto-fallback').checked
});

view = createLessonView({
  onPlaySentence: index => player.playSentence(index),
  onStop: () => player.stop()
});

$('play-all').onclick = () => player.playFull();
$('hero-play-all').onclick = () => player.playFull();
$('hero-stop').onclick = () => player.stop();
$('stop-all').onclick = () => player.stop();
$('global-rate').onchange = () => player.setRate(Number($('global-rate').value));

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  return response.json();
}

function renderNavigation() {
  const buttons = catalog.letters.map(letter => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'letter-button secondary';
    button.dataset.letter = letter.id;
    button.textContent = `Letter ${letter.number}`;
    if (!letter.file) {
      const badge = document.createElement('small');
      badge.textContent = '준비 중';
      button.append(badge);
    }
    button.onclick = () => selectLetter(letter.id, 'push');
    return button;
  });
  $('letter-list').replaceChildren(...buttons);
}

function showMessage(title, text) {
  $('letter-message-title').textContent = title;
  $('letter-message-text').textContent = text;
  $('letter-message').hidden = false;
}

async function selectLetter(id, historyMode = 'replace') {
  const letter = catalog.letters.find(item => item.id === id)
    || catalog.letters.find(item => item.id === catalog.defaultLetter)
    || catalog.letters[0];
  const token = ++selection;

  player.setLesson(null);
  view.clearVideo();
  $('lesson-content').hidden = true;
  $('hero-player').hidden = true;
  $('letter-message').hidden = true;
  $('study-main').removeAttribute('aria-busy');
  $('letter-heading').textContent = `Letter ${letter.number}`;
  $('letter-date').textContent = letter.title;
  document.title = `Osho Letters · Letter ${letter.number} (${letter.title}) — English Study`;
  document.querySelectorAll('.letter-button').forEach(button => {
    const selected = button.dataset.letter === letter.id;
    button.classList.toggle('selected', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const url = new URL(window.location.href);
  if (url.searchParams.get('letter') !== letter.id) {
    url.searchParams.set('letter', letter.id);
    if (historyMode === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
  }

  if (!letter.file) {
    $('letter-status').textContent = '아직 등록되지 않은 편지입니다.';
    showMessage(`Letter ${letter.number} · 준비 중`, '새로운 편지를 준비하고 있어요. Letter 1부터 읽고 들어보세요.');
    return;
  }

  $('letter-status').textContent = '편지를 불러오는 중…';
  $('study-main').setAttribute('aria-busy', 'true');
  try {
    const lesson = await readJSON(letter.file);
    if (token !== selection) return;
    view.render(lesson);
    player.setLesson(lesson);
    $('lesson-content').hidden = false;
    $('hero-player').hidden = false;
    $('letter-status').textContent = `Letter ${letter.number} · ${lesson.sentences.length}개 문장`;
    $('player-status').textContent = '문장을 누르면 해당 MP3를 재생합니다. 전체 듣기는 편지 전체 음원을 재생합니다.';
    $('hero-audio-status').textContent = '전체 편지 듣기';
  } catch (error) {
    if (token !== selection) return;
    $('letter-status').textContent = '편지를 불러오지 못했습니다.';
    showMessage('본문을 불러올 수 없어요', '잠시 후 편지 버튼을 다시 눌러주세요. 로컬에서는 HTTP 서버로 실행해 주세요.');
    console.error(error);
  } finally {
    if (token === selection) $('study-main').removeAttribute('aria-busy');
  }
}

async function init() {
  try {
    catalog = await readJSON('data/letters.json');
    if (!Array.isArray(catalog.letters) || !catalog.letters.length) throw new Error('편지 목록이 비어 있습니다.');
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
