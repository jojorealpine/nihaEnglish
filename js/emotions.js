"use strict";

import { initEmotionStudy } from './emotion-study.js';

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export async function initEmotionCards() {
  const section = $('emotions');
  if (!section) return;

  const canSpeak = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
  let data, category, selected;
  let speechVersion = 0;
  let activeUtterance = null;
  const visibleEmotions = () => data.emotions.filter(item => category === 'all' || item.category === category);
  const cardPatterns = () => data.cardPatternIds.map(id => data.patterns.find(pattern => pattern.id === id));

  function stopSpeech(message = '') {
    speechVersion += 1;
    if (canSpeak) window.speechSynthesis.cancel();
    activeUtterance = null;
    $('emotion-audio-status').textContent = message;
  }

  function speak(text) {
    stopSpeech();
    if (!canSpeak) return;
    const version = speechVersion;
    activeUtterance = new SpeechSynthesisUtterance(text);
    activeUtterance.lang = 'en-US';
    activeUtterance.rate = 1;
    $('emotion-audio-status').textContent = '영어 음성 재생 중…';
    activeUtterance.onend = () => {
      if (version !== speechVersion) return;
      activeUtterance = null;
      $('emotion-audio-status').textContent = '듣기 완료';
    };
    activeUtterance.onerror = () => {
      if (version !== speechVersion) return;
      activeUtterance = null;
      $('emotion-audio-status').textContent = '음성을 재생할 수 없습니다. 잠시 후 다시 눌러주세요.';
    };
    window.speechSynthesis.speak(activeUtterance);
  }

  function listenButton(text, label = '▶ 듣기') {
    return `<button type="button" class="secondary emotion-listen" data-emotion-action="speak" data-speak="${escapeHTML(text)}" aria-label="${escapeHTML(text)} 듣기" ${canSpeak ? '' : 'disabled'}>${label}</button>`;
  }

  function renderGuides() {
    $('emotion-guides').innerHTML = cardPatterns().map(pattern => `<article class="emotion-guide">
      <h3>${escapeHTML(pattern.title)}</h3><p class="emotion-formula">${escapeHTML(pattern.formula)}</p>
      <p class="emotion-rule">${escapeHTML(pattern.explanation)}</p>
      <p class="emotion-guide-example" lang="en">${escapeHTML(pattern.examples[0].english)}</p>
      <p class="emotion-guide-ko">${escapeHTML(pattern.examples[0].korean)}</p></article>`).join('');
  }

  function renderFilters() {
    const filters = [...data.categories, { id: 'all', label: '전체' }];
    $('emotion-filters').innerHTML = filters.map(item => `<button type="button" class="emotion-filter"
      data-emotion-action="filter" data-category="${escapeHTML(item.id)}" aria-pressed="${category === item.id}">${escapeHTML(item.label)}</button>`).join('');
    $('emotion-total').textContent = `${data.categories.length}가지 모음 · ${data.emotions.length}개 형용사`;
  }

  function renderCards() {
    const emotions = visibleEmotions();
    $('emotion-cards').innerHTML = emotions.map(item => `<button type="button" class="emotion-card"
      data-emotion-action="select" data-emotion="${escapeHTML(item.id)}" aria-pressed="${selected.id === item.id}">
      <strong lang="en">${escapeHTML(item.word)}</strong><span>${escapeHTML(item.meaning)}</span></button>`).join('');
    $('emotion-category-description').textContent = category === 'all'
      ? '여러 감정이 함께 느껴질 수도 있어요. 지금의 내 마음과 가까운 표현을 골라보세요.'
      : data.categories.find(item => item.id === category).description;
  }

  function updateStatus() {
    const label = category === 'all' ? '전체' : data.categories.find(item => item.id === category).label;
    $('emotion-selection-status').textContent = `${label} · ${visibleEmotions().length}개 감정 · ${selected.word} 선택`;
  }

  function renderDetail() {
    $('emotion-detail').innerHTML = `<div class="emotion-detail-heading"><div><div class="eyebrow">My feeling</div>
      <h3 id="emotion-word" lang="en">${escapeHTML(selected.word)}</h3><p>${escapeHTML(selected.meaning)}</p></div>
      <div class="emotion-word-controls">${listenButton(selected.word, '▶ 단어 듣기')}<button type="button" class="secondary emotion-listen" data-emotion-action="stop" ${canSpeak ? '' : 'disabled'}>■ 정지</button></div></div>
      <p class="emotion-nuance">${escapeHTML(selected.nuance)}</p>
      <div class="emotion-examples">${cardPatterns().map(pattern => {
        const example = selected.examples[pattern.id];
        return `<article><h4>${escapeHTML(pattern.title)}</h4><p class="emotion-example-en" lang="en">${escapeHTML(example.english)}</p>
          <p class="emotion-example-ko">${escapeHTML(example.korean)}</p>${listenButton(example.english)}</article>`;
      }).join('')}</div>
      <a class="emotion-practice-link" href="roleplay.html?scenario=feelings&amp;case=${escapeHTML(encodeURIComponent(selected.roleplayCase || 'mixed'))}">감정 대화로 연습하기 →</a>`;
    if (!canSpeak) $('emotion-audio-status').textContent = '이 브라우저에서는 듣기를 지원하지 않습니다. 예문을 보며 연습해보세요.';
    updateStatus();
  }

  function selectCategory(id) {
    stopSpeech();
    category = data.categories.some(item => item.id === id) ? id : 'all';
    const emotions = visibleEmotions();
    if (!emotions.some(item => item.id === selected.id)) selected = emotions[0];
    renderFilters();
    renderCards();
    renderDetail();
    Array.from($('emotion-filters').children).find(button => button.dataset.category === category)?.focus({ preventScroll: true });
  }

  function selectEmotion(id) {
    const emotion = visibleEmotions().find(item => item.id === id);
    if (!emotion) return;
    stopSpeech();
    selected = emotion;
    $('emotion-cards').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.emotion === id)));
    renderDetail();
  }

  section.onclick = event => {
    const button = event.target.closest('button[data-emotion-action]');
    if (!button) return;
    if (button.dataset.emotionAction === 'retry') { load(); return; }
    if (!data) return;
    switch (button.dataset.emotionAction) {
      case 'filter': selectCategory(button.dataset.category); break;
      case 'select': selectEmotion(button.dataset.emotion); break;
      case 'speak': speak(button.dataset.speak); break;
      case 'stop': stopSpeech('재생 정지'); break;
    }
  };
  window.addEventListener('pagehide', () => stopSpeech());

  async function load() {
    section.setAttribute('aria-busy', 'true');
    $('emotion-retry').hidden = true;
    $('emotion-status').textContent = '감정카드를 불러오는 중…';
    try {
      const response = await fetch('data/emotions.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      if (!data.categories?.length || !data.emotions?.length || !data.patterns?.length) throw new Error('감정 자료가 비어 있습니다.');
      category = data.categories.some(item => item.id === data.defaultCategory) ? data.defaultCategory : data.categories[0].id;
      selected = visibleEmotions()[0];
      renderGuides();
      renderFilters();
      renderCards();
      renderDetail();
      initEmotionStudy({ data, canSpeak, listenButton, stopSpeech });
      document.querySelectorAll('[data-emotion-action="stop"]').forEach(button => { button.disabled = !canSpeak; });
      $('emotion-status').textContent = '';
      $('emotion-content').hidden = false;
    } catch (error) {
      $('emotion-content').hidden = true;
      $('emotion-retry').hidden = false;
      $('emotion-status').textContent = '감정카드를 불러오지 못했어요. 로컬에서는 HTTP 서버로 실행하고 다시 불러오기를 눌러주세요.';
      console.error(error);
    } finally {
      section.removeAttribute('aria-busy');
    }
  }

  await load();
}

initEmotionCards();
