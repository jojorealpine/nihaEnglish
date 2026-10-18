# Niha English — Role Playing, Osho’s Letters & Emotion Cards

사이트 : https://jojorealpine.github.io/nihaEnglish/

GitHub Pages 정적 웹사이트. 메인 화면 `index.html`의 세 카드에서 원하는 학습 화면으로 이동합니다.

- **Role Playing** (`roleplay.html`): 12가지 상황의 핵심 표현 118개와 대화 케이스 39개. 상대의 말을 듣고 직접 답한 뒤 힌트와 답변 예시를 확인합니다.
- **Osho’s Letters** (`letters.html`): 편지 본문, 해석, 단어와 표현을 공부하고 문장별 MP3를 듣습니다.
- **Emotion Cards** (`emotions.html`): 감정 형용사 30개, 내면 표현 12개, 명상 후 대화 예시와 5단계 스피킹 연습을 제공합니다.

편지 페이지 상단의 **Letter 1, 2, 3…** 버튼으로 편지를 선택합니다. **Letter 1 (1962 / 1)**은 20개, **Letter 2 (1962 / 2)**는 14개 문장/구절로 구성됩니다. Letter 3은 아직 본문이 없어 선택하면 **준비 중** 안내가 표시됩니다. 본문에는 문장 번호를 표시하지 않습니다. 문장 클릭 즉시 MP3를 재생하고, **전체 듣기** 버튼은 선택한 편지의 `script_all.mp3`를 재생합니다.

## 1. MP3 배치 (중요)

음성 파일은 편지별 폴더로 구분합니다. 각 문장 MP3와 전체 음원은 아래 경로에 배치합니다.

```text
nihaEnglish/
  index.html            # 세 학습 메뉴를 선택하는 메인
  letters.html          # 기존 편지 학습 화면
  roleplay.html         # 상황별 표현과 역할 연습 화면
  emotions.html         # 감정카드와 말하기 패턴 학습 화면
  css/styles.css         # 전체 화면 스타일
  css/site.css           # 공통 메뉴와 메인 화면 스타일
  css/emotions.css       # 감정카드 페이지와 표현 안내 스타일
  css/roleplay.css       # 역할 연습 화면 스타일
  js/home.js             # 기존 편지 링크와 감정카드 링크 연결
  js/emotions.js         # 감정 모음·카드 선택, 예문 표시, 듣기
  js/emotion-study.js    # 표현 패턴, 탭 전환, 대화 예시와 5단계 스피킹
  js/app.js              # 편지 목록, 선택, 데이터 로딩, URL
  js/lesson-view.js      # 단어, 본문, 문장 해설, 번역 표시
  js/audio-player.js     # MP3, 브라우저 TTS, 반복 및 정지
  js/roleplay.js         # 상황 선택, 대화 진행, 힌트, 예시, 학습 기록
  data/roleplay.json     # 상황별 핵심 표현, 대화 케이스와 암기 표현
  data/emotions.json     # 감정 형용사, 뉘앙스, 말하기 패턴과 예문
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

각 편지는 **별도 JSON 파일**로 관리합니다. Letter 1은 `data/lesson01.json`, Letter 2는 `data/lesson02.json`입니다. 선택한 편지는 `letters.html?letter=1962-01` 또는 `letters.html?letter=1962-02`처럼 URL에 저장되어 새로고침, 링크 공유, 브라우저 뒤로/앞으로 가기에서도 유지됩니다. 기존 `/?letter=...`와 `index.html?letter=...` 링크도 해당 편지 페이지로 연결됩니다. 편지를 바꾸거나 다른 페이지로 이동하면 음성 재생이 정지합니다.

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

유튜브 URL은 각 JSON의 `youtubeUrl`에 설정할 수 있습니다. 영상 영역은 현재 `letters.html`에서 주석으로 숨겨져 있으며 필요하면 해당 주석을 해제합니다. 음성은 공개 게시할 권리가 있는 파일만 업로드하세요.

## 6. Role Playing 유지보수

내용은 `data/roleplay.json`에서 관리합니다. 기존 명상 대화 8가지(첫인사, 자기소개, 오늘의 감정, 명상 후 경험, 공감하기, 혼자만의 시간, 춤 제안 거절, 분명하게 경계 전하기)에 스캔 PDF의 일상 대화 4가지를 추가했습니다. 오늘의 감정에는 5개 케이스, 명상 후 경험에는 액티브 명상 대화를 포함한 4개 케이스, 나머지 상황에는 각 3개 케이스가 있습니다.

추가한 일상 상황은 **답답한 상황 이야기하기**(Day 04), **잘 맞는 사람과 신뢰**(Day 05), **약속 시간 조율하기**(Day 10), **늦을 때와 도착 연락**(Day 11)입니다. 핵심 표현과 대화 케이스는 기존 화면에서 같은 방식으로 연습합니다. 추가 상황의 `source`에 자료의 단원과 PDF 쪽수를 기록했습니다. 표현별 `note`에는 사용법, 말투, 문법 설명을 넣을 수 있습니다.

- `scenarios[]`: 상황의 `id`, `title`, `englishTitle`, 설명(`description`), 핵심 패턴(`pattern`), 팁(`tip`).
- `expressions[]`: 상황별 핵심 표현의 `english`, `korean`, 선택 사항인 사용법 설명(`note`).
- `cases[]`: 각 대화의 `id`, `title`, 상황 설명(`context`), 상대 역할(`partnerRole`), 대화 차례(`turns`), 마무리 복습 포인트(`review`).
- `turns[]`: 상대 문장(`partner.english`, `partner.korean`), 내 미션(`mission`), 표현 힌트(`hints`), 가능한 답변들(`responses`의 `english`, `korean`).
- `essentials[]`: 암기 체크리스트의 `id`, `english`, `korean`.
- `speakingTips[]`: 말하기 팁의 `title`, `text`.

상황과 케이스를 배열에 추가하면 선택 버튼이 자동으로 생깁니다. 케이스의 `id`는 같은 상황 안에서 중복되지 않게 작성합니다. 모든 케이스는 각 차례의 상대 질문에 소리 내어 답하거나 답을 입력하고 **대답했어요**를 눌러 진행합니다. 입력한 답은 대화 기록에서 확인하고, 전체 대본과 답변 예시도 볼 수 있습니다.

선택한 상황과 케이스는 `roleplay.html?scenario=greetings&case=first-hello`처럼 URL에 저장됩니다. 완료한 케이스와 암기 체크는 브라우저 `localStorage`의 `nihaEnglish.roleplay.v1`에 저장되며, **학습 기록 초기화**로 지울 수 있습니다. 듣기는 브라우저 TTS를 사용하고 기본 속도는 1.0×입니다.

## 7. Emotion Cards 유지보수

메인의 **Emotion Cards** 카드를 누르면 별도 페이지 `emotions.html`로 이동합니다. `data/emotions.json`에서 편안함·안정, 기쁨·활력, 불안·부담, 슬픔·지침, 화·혼란의 5가지 모음과 형용사 30개를 관리합니다. 기본 화면에는 편안함·안정의 6개 감정이 나오며, 다른 모음이나 **전체**를 선택할 수 있습니다.

페이지는 **감정카드 / 핵심 패턴 12개 / 대화 예시 / 스피킹 연습** 탭으로 구분합니다. `emotions.html#patterns`, `#dialogue`, `#speaking`으로 해당 탭에 바로 접근할 수 있습니다. 탭은 방향키와 Home/End로도 선택합니다.

- `defaultCategory`: 처음 보여 줄 감정 모음의 `id`.
- `categories[]`: 모음의 `id`, 이름(`label`), 설명(`description`).
- `patterns[]`: 말하기 패턴 12개의 `id`, 표현(`expression`), 제목(`title`), 의미(`meaning`), 사용 상황(`usage`), 그룹(`group`), 연결 방법(`formula`), 설명(`explanation`), 예문 배열(`examples[]`의 `english`, `korean`). `starter: true`인 다섯 표현은 먼저 익힐 목록에 표시합니다.
- `patternGroups[]`: 감정, 관찰, 깨달음, 경험, 해소의 다섯 패턴 그룹.
- `cardPatternIds[]`: 감정카드에서 사용할 세 패턴의 `id` (`feel`, `noticed`, `realized`).
- `emotions[]`: 감정의 `id`, 형용사(`word`), 뜻(`meaning`), 모음(`category`), 뉘앙스(`nuance`).
- `examples.feel`, `examples.noticed`, `examples.realized`: 선택한 감정에 맞는 영어·한국어 예문. 각각 `english`, `korean`을 입력합니다.
- `roleplayCase`: 감정 대화 연습으로 연결할 `feelings` 상황의 케이스 `id` (`calm`, `anxious`, `sad`, `lighter`, `mixed`).
- `sharingFlow[]`: 감정 → 신체 감각 → 생각 → 깨달음 → 변화의 안내. 각 단계의 `label`, 연결 패턴(`patternId`), 안내 문구(`hint`).
- `speakingPractice[]`: 다섯 단계의 `id`, 연결 패턴(`patternId`), 상황 질문(`question`), 힌트(`hint`), 예문(`examples[]`). `sharingFlow`와 같은 순서로 관리합니다.
- `roleplay`: 대화 예시의 제목과 설명, 연결할 `scenarioId`와 `caseId`. 대화 원문은 `data/roleplay.json`의 `after-meditation / active-meditation`에서 한 번만 관리하며 Emotion Cards와 Role Playing에서 함께 사용합니다.

카드를 누르면 뜻·뉘앙스와 세 가지 예문이 바뀝니다. 핵심 패턴 탭에서 전체 12개 또는 먼저 익힐 5개를 선택하고, 표현을 펼쳐 연결 방법과 예문을 확인합니다. 단어와 예문 듣기는 브라우저 TTS를 1.0×로 재생합니다.

스피킹 연습은 `I felt`, `I noticed`, `I found myself -ing`, `I realized`, `I let go of`를 따라 이전·다음으로 이동합니다. 예문을 열고 닫거나 탭을 바꿔도 입력한 답변은 현재 페이지에서 유지됩니다. 마지막에 **내 이야기 모아보기**로 작성한 문장들을 모아 읽고 들을 수 있습니다. 새로고침하면 스피킹 답변은 초기화됩니다.

=======
# nihaEnglish
Ensligh Study with Niharika
