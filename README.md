# Osho English Study — 1962 / 1

GitHub Pages 정적 웹사이트. 사용자 제공 영어 원문을 **20개 문장/구절**로 분리하고 문장 클릭 즉시 MP3를 재생합니다. 상단 **전체 듣기** 버튼은 하나의 `script_all.mp3` 파일을 재생합니다.

## 1. MP3 배치 (중요)

본 프로젝트에는 MP3 원본 파일이 포함되지 않았습니다. 보유한 음성 파일을 아래 경로에 복사하세요.

```text
nihaEnglish/
  index.html
  data/lesson01.json
  js/app.js
  audio/1962-01/
    01.mp3
    02.mp3
    ...
    20.mp3
    script_all.mp3
```

`01.mp3`는 본문의 `01 Love, I received your letter.`에 대응하며 `20.mp3`는 마지막 문장에 대응합니다. 전체 듣기는 항상 `script_all.mp3`를 재생합니다. 이미 MP3를 가지고 있다면 생성 스크립트를 실행할 필요가 없습니다. 문장 MP3가 없으면 체크박스를 켠 상태에서 브라우저 TTS로 대체하지만, 전체 음성은 파일이 필수입니다.

## 2. 로컬 테스트

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. `file://`로 직접 HTML을 열면 JSON 불러오기가 실패할 수 있습니다.

## 3. GitHub Pages 배포

```bash
git init
git add .
git commit -m "Add Osho study with 20 audio passages"
git branch -M main
git remote add origin https://github.com/jojorealpine/nihaEnglish.git
git push -u origin main
```

GitHub 저장소 `Settings → Pages → Build and deployment → Deploy from a branch`에서 `main` 및 `/(root)`를 선택하세요. 주소는 `https://jojorealpine.github.io/nihaEnglish/`입니다.

## 4. MP3를 새로 생성하고 싶은 경우에만

```bash
python3 -m pip install -r requirements.txt
export OPENAI_API_KEY="YOUR_KEY"   # macOS/Linux
python3 scripts/generate_audio.py
```

스크립트는 20개 개별 MP3와 `script_all.mp3`를 생성합니다. 기존 파일은 건너뛰며, 강제 재생성에는 `--force` 옵션을 사용합니다. API 키는 GitHub에 올리지 마세요. OpenAI API 비용이 발생할 수 있습니다.

## 5. 유지보수

본문과 문장 해설은 `data/lesson01.json`에서 관리합니다. 음성 파일 경로는 `sentences[].audio`, 전체 듣기 경로는 `fullAudio`입니다. 유튜브 URL도 JSON의 `youtubeUrl`에 미리 설정할 수 있습니다. 음성은 공개 게시할 권리가 있는 파일만 업로드하세요.
=======
# nihaEnglish
Ensligh Study with Niharika
