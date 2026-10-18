// 기존에 공유한 index.html?letter=... 링크는 새 편지 페이지로 이어집니다.
const current = new URL(window.location.href);
if (current.searchParams.has('letter')) {
  const destination = new URL('letters.html', current);
  destination.search = current.search;
  destination.hash = current.hash;
  window.location.replace(destination.href);
} else if (current.hash === '#emotions') {
  window.location.replace(new URL('emotions.html', current).href);
}
