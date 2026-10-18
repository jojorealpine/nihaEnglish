# Osho English Study — Letters

사이트 : https://jojorealpine.github.io/nihaEnglish/

GitHub Pages 정적 웹사이트. 상단의 **Letter 1, 2, 3…** 버튼으로 편지를 선택합니다. **Letter 1 (1962 / 1)**은 20개, **Letter 2 (1962 / 2)**는 14개 문장/구절로 구성됩니다. Letter 3은 아직 본문이 없어 선택하면 **준비 중** 안내가 표시됩니다. 본문에는 문장 번호를 표시하지 않습니다. 문장 클릭 즉시 MP3를 재생하고, **전체 듣기** 버튼은 선택한 편지의 `script_all.mp3`를 재생합니다.

## 1. MP3 배치 (중요)

음성 파일은 편지별 폴더로 구분합니다. 각 문장 MP3와 전체 음원은 아래 경로에 배치합니다.

```text
nihaEnglish/
  index.html
  css/styles.css         # 전체 화면 스타일
  js/app.js              # 편지 목록, 선택, 데이터 로딩, URL
  js/lesson-view.js      # 단어, 본문, 문장 해설, 번역 표시
  js/audio-player.js     # MP3, 브라우저 TTS, 반복 및 정지
  data/letters.json      # 편지 버튼 목록과 각 본문 파일의 연결
  data/lesson01.json     # Letter 1 전체 내용
  data/lesson02.json     # Letter 2 전체 내용
  audio/1962-01/
    01.mp3
    02.mp3
    ...
    20.mp3
    script_all.mp3
  audio/1962-02/
    01.mp3
    02.mp3
    ...
    14.mp3
    script_all.mp3
```

Letter 1의 `01.mp3`는 `Love, I received your letter.`에 대응하며 `20.mp3`는 마지막 문장에 대응합니다. Letter 2의 `01.mp3`는 `Love, I am in bliss.`에 대응하며 `14.mp3`는 마지막 구절에 대응합니다. 전체 듣기는 선택한 편지 폴더의 `script_all.mp3`를 재생합니다. 이미 MP3를 가지고 있다면 생성 스크립트를 실행할 필요가 없습니다. 문장 MP3가 없으면 체크박스를 켠 상태에서 브라우저 TTS로 대체하지만, 전체 음성은 파일이 필수입니다.

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

스크립트는 지정한 편지의 문장별 MP3와 `script_all.mp3`를 생성합니다. 옵션 없이 실행하면 Letter 1을 사용합니다. 기존 파일은 건너뛰며, 강제 재생성에는 `--force` 옵션을 사용합니다. API 키는 GitHub에 올리지 마세요. OpenAI API 비용이 발생할 수 있습니다.

## 5. 유지보수

각 편지는 **별도 JSON 파일**로 관리합니다. Letter 1은 `data/lesson01.json`, Letter 2는 `data/lesson02.json`입니다. 선택한 편지는 `?letter=1962-01` 또는 `?letter=1962-02`처럼 URL에 저장되어 새로고침, 링크 공유, 브라우저 뒤로/앞으로 가기에서도 유지됩니다. 편지를 바꾸면 이전 편지의 음성 재생과 반복이 정지합니다.

### 새 편지를 추가하는 방법 (Letter 3 예시)

상단의 핵심 문구는 각 편지 JSON의 `lesson` 문자열에서 가져옵니다. `lesson01.json`, `lesson02.json` 등에서 이 값만 수정하면 해당 편지를 선택할 때 문구가 바뀝니다. 현재는 각 본문에서 고른 문장이 들어 있으며, 한국어 문구로 바꿔도 됩니다. 값을 비워 두거나 필드를 생략하면 문구 영역을 숨깁니다.

```json
"lesson": "이 편지의 핵심 문장을 입력하세요."
```

‘핵심 단어와 표현’ 영역에는 **핵심 단어 / 표현** 탭이 있습니다. `vocabulary`는 핵심 단어 탭, `expressions`는 표현 탭에 표시됩니다. Letter 1은 **핵심 표현·의미·핵심 문법**, Letter 2는 **핵심 표현·뜻·활용도** 목록입니다. `usage`가 있는 편지는 활용도 열을, 그 외에는 `grammar`가 있으면 핵심 문법 열을 표시합니다. 항목을 누르면 자세한 설명과 예문이 펼쳐집니다. `title`과 `detailMeaning`은 펼친 영역의 제목과 자세한 의미, `original`은 원문, `explanation`은 문단형 특이사항, `notes`는 목록형 특이사항, `examples`는 영어·한국어 예문입니다. 설명 안의 백틱으로 감싼 부분은 코드 서식으로 표시합니다.

아래 추가 필드는 모두 선택 사항입니다. `expression`과 `meaning`만 있는 항목은 간단한 목록으로 표시됩니다. 기존 `note`도 설명으로 사용할 수 있습니다. `expressions`가 없거나 빈 배열이면 표현 탭에 ‘아직 등록된 표현이 없습니다.’가 표시됩니다. 편지를 바꾸면 핵심 단어 탭으로 돌아갑니다.

```json
"expressions": [
  {
    "expression": "insist on + -ing",
    "meaning": "~을 고집하다",
    "grammar": "전치사 on + 동명사",
    "title": "insist on + 명사 / -ing",
    "detailMeaning": "~을 강하게 요구하다, ~을 고집하다",
    "explanation": "`on`은 전치사이므로 뒤에 동사가 오면 `-ing`를 사용합니다.",
    "examples": [
      { "english": "She insisted on paying for dinner.", "korean": "그녀는 저녁값을 자기가 내겠다고 고집했다." }
    ]
  }
]
```

1. 기존 편지 JSON을 복사해 `data/lesson03.json`을 만듭니다.
2. 새 파일의 `id`를 `1962-03`, `title`을 `1962 / 3`로 바꾸고 `lesson`의 핵심 문구와 단어·본문·해설·번역을 Letter 3 내용으로 교체합니다. `english`에는 앞의 문장 번호를 넣지 않습니다.
3. `paragraphs`는 `sentences` 배열의 **0부터 시작하는 인덱스**입니다. 새 편지의 문장 수에 맞게 수정합니다. 각 문장의 `audio`와 `fullAudio`도 `audio/1962-03/` 경로로 바꾸고 MP3 파일을 배치합니다.
4. `data/letters.json`에서 Letter 3의 `file`을 `null`에서 `"data/lesson03.json"`으로 바꿉니다. 다음 페이지 로드부터 준비 중 표시 대신 새 편지가 나옵니다.

```json
{ "id": "1962-03", "number": 3, "title": "1962 / 3", "file": "data/lesson03.json" }
```

Letter 4부터는 `letters` 배열에 아래 항목을 추가하면 버튼이 자동으로 생깁니다. 본문이 아직 없으면 `file`을 `null`로 둡니다. `defaultLetter`는 처음 접속할 때 보여 줄 편지의 `id`입니다.

```json
{ "id": "1962-04", "number": 4, "title": "1962 / 4", "file": "data/lesson04.json" }
```

새 편지의 음원을 생성하려면 해당 JSON을 지정합니다. 기존처럼 옵션 없이 실행하면 Letter 1을 사용합니다.

```bash
python3 scripts/generate_audio.py --lesson data/lesson02.json
```

유튜브 URL은 각 JSON의 `youtubeUrl`에 설정할 수 있습니다. 영상 영역은 현재 `index.html`에서 주석으로 숨겨져 있으며 필요하면 해당 주석을 해제합니다. 음성은 공개 게시할 권리가 있는 파일만 업로드하세요.
=======
# nihaEnglish
Ensligh Study with Niharika
