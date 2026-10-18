"use strict";

// 편지가 바뀌면 진행 중인 MP3/TTS와 문장 반복을 모두 취소합니다.
export function createAudioPlayer({ onSelect, onPlaying, onStatus, getRate, shouldLoop, shouldFallback }) {
  const audio = new Audio();
  audio.preload = 'none';
  let lesson = null;
  let generation = 0;
  let cancelPending = null;

  function cancel() {
    generation += 1;
    audio.pause();
    if (cancelPending) cancelPending();
    audio.removeAttribute('src');
    audio.load();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onPlaying(null);
  }

  function stop() {
    cancel();
    onStatus('재생 정지');
  }

  function playMP3(source, token) {
    if (!source) return Promise.resolve(false);
    return new Promise(resolve => {
      let finished = false;
      function done(success) {
        if (finished) return;
        finished = true;
        audio.onended = null;
        audio.onerror = null;
        cancelPending = null;
        resolve(success && token === generation);
      }
      cancelPending = () => done(false);
      audio.src = source;
      audio.playbackRate = getRate();
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });
  }

  function playBrowserSpeech(text, token) {
    if (!('speechSynthesis' in window)) return Promise.resolve(false);
    return new Promise(resolve => {
      let finished = false;
      const utterance = new SpeechSynthesisUtterance(text);
      function done(success) {
        if (finished) return;
        finished = true;
        cancelPending = null;
        resolve(success && token === generation);
      }
      cancelPending = () => done(false);
      utterance.lang = 'en-US';
      utterance.rate = getRate();
      utterance.onend = () => done(true);
      utterance.onerror = () => done(false);
      window.speechSynthesis.speak(utterance);
    });
  }

  async function playSentence(index) {
    if (!lesson?.sentences[index]) return;
    cancel();
    const token = generation;
    const sentence = lesson.sentences[index];
    onSelect(index);
    onPlaying(index);
    do {
      onStatus(`문장 ${index + 1} 재생 중…`);
      let success = await playMP3(sentence.audio, token);
      if (token !== generation) return;
      if (!success && shouldFallback()) {
        onStatus(`MP3 없음 · 문장 ${index + 1} 브라우저 음성으로 재생`);
        success = await playBrowserSpeech(sentence.english, token);
      }
      if (token !== generation) return;
      if (!success) {
        onPlaying(null);
        onStatus('문장 음성을 재생할 수 없습니다.');
        return;
      }
    } while (shouldLoop() && token === generation);
    onPlaying(null);
    onStatus('재생 완료');
  }

  async function playFull() {
    if (!lesson) return;
    cancel();
    const token = generation;
    onStatus('전체 음성 재생 중…');
    const success = await playMP3(lesson.fullAudio, token);
    if (token !== generation) return;
    onStatus(success ? '전체 듣기 완료' : '전체 음성 파일을 찾을 수 없거나 재생할 수 없습니다.');
  }

  return {
    playSentence, playFull, stop,
    setLesson(data) { cancel(); lesson = data; },
    setRate(rate) { audio.playbackRate = rate; }
  };
}
