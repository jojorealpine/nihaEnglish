# Niha English — Role Playing, Osho’s Letters & Emotion Cards

사이트 : https://jojorealpine.github.io/nihaEnglish/

GitHub Pages 정적 웹사이트. 메인 화면 `index.html`의 세 카드에서 원하는 학습 화면으로 이동합니다.

- **Role Playing** (`roleplay.html`): 12가지 상황의 핵심 표현 118개와 대화 케이스 39개. 상대의 말을 듣고 직접 답한 뒤 힌트와 답변 예시를 확인합니다.
- **Osho’s Letters** (`letters.html`): 편지 본문, 해석, 단어와 표현을 공부하고 문장별 MP3를 듣습니다.
- **Emotion Cards** (`emotions.html`): 감정 형용사 30개, 내면 표현 12개, 명상 후 대화 예시와 5단계 스피킹 연습을 제공합니다.

편지 페이지 상단의 **365편 텍스트 링크 목차**에서 편지를 선택합니다. 50편씩 8개 구간으로 나누고 번호 검색으로 바로 찾을 수 있습니다. 본문이 있는 편지는 진한 글씨, 준비 중인 편지는 회색으로 표시하며 현재 편지에는 밑줄을 표시합니다. **Letter 1 (1962 / 1)**은 20개, **Letter 2 (1962 / 2)**는 14개 문장/구절로 구성됩니다. 스캔 자료에서 추가한 Letter 3~7도 같은 형식으로 핵심 문구, 단어·표현, 문장별 해석·해설·문법, 전체 번역을 제공합니다. 본문에는 문장 번호를 표시하지 않습니다. 문장 클릭 즉시 MP3를 재생하며 파일이 없으면 브라우저 음성을 사용합니다. **전체 듣기** 버튼은 선택한 편지의 `script_all.mp3`를 재생합니다.

| 편지 | 본문 파일 | 문장/구절 수 |
| --- | --- | --- |
| Letter 3 | `data/lesson03.json` | 15 |
| Letter 4 | `data/lesson04.json` | 28 |
| Letter 5 | `data/lesson05.json` | 20 |
| Letter 6 | `data/lesson06.json` | 26 |
| Letter 7 | `data/lesson07.json` | 22 |

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
  data/letters.json      # 등록된 편지와 본문 파일 연결, 전체 목차 규모
  data/lesson01.json     # Letter 1 전체 내용
  data/lesson02.json     # Letter 2 전체 내용
  data/lesson03.json     # Letter 3 전체 내용
  data/lesson04.json     # Letter 4 전체 내용
  data/lesson05.json     # Letter 5 전체 내용
  data/lesson06.json     # Letter 6 전체 내용
  data/lesson07.json     # Letter 7 전체 내용
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

Letter 3~7은 본문과 학습 자료를 추가한 상태이며 새 MP3는 포함하지 않았습니다. 문장 듣기는 기본으로 켜진 브라우저 음성 대체 기능을 사용합니다. MP3를 준비하면 각각 `audio/1962-03/`~`audio/1962-07/`에 `01.mp3`부터 해당 편지의 마지막 구절 번호까지와 `script_all.mp3`를 배치하세요. 각 JSON의 `audio`와 `fullAudio`에 이 경로가 설정되어 있습니다.

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

### 끊어읽기 구절 MP3

끊어읽기 탭에서는 구절을 누르면 `audio/1962-01/chunks-views/02-01.mp3`처럼 문장 번호와 구절 번호로 저장한 MP3를 재생합니다. 한국어 해석은 각 문장 아래에 작게 표시합니다. 7개 편지의 318개 구절은 Artlist의 **Views** 음성으로 미국식 영어, 0.9배 속도, 음성 효과 없이 생성합니다. 기존 문장 MP3는 그대로 사용합니다.

각 JSON의 `chunks` 배열은 표시할 구절이며, 같은 순서의 `chunkAudio` 배열이 개별 MP3 경로입니다. 구절 텍스트를 수정했다면 Artlist에서 Views 음성으로 해당 MP3도 다시 생성하세요. MP3 재생 실패 시 본문의 브라우저 음성 대체 설정에 따라 해당 구절만 합성해 읽습니다.

Views MP3는 7개 편지의 318개 구절 모두 연결되었습니다. `audio/chunk-audio-manifest.json`에 음성 설정과 각 파일의 생성 출처를 기록했습니다. 같은 구절이 반복되면 생성한 Views 음성을 재사용합니다.

## 5. 유지보수

각 편지는 **별도 JSON 파일**인 `data/lesson01.json`~`data/lesson365.json`에서 관리합니다. Letter 1~7은 기존 학습 자료와 음성을 유지합니다. Letter 8~365는 `letter_scan`의 JPG 148장을 로컬 OCR로 변환한 영어 원문입니다. 중복 촬영 2쌍과 책 뒤 안내문은 제외했습니다. 문장·문단과 스캔 파일·좌우 페이지 출처를 기록했습니다. 전체 365편의 4,044개 문장에 한국어 해석·문장 설명·문법·문장별 단어와 표현 항목을 보충했습니다. 생성 상태는 `data/letter_study/status.json`, 최종 보정 결과는 `data/letter_study/review-report.json`에 기록합니다. 비어 있는 학습 영역은 화면에서 숨깁니다. 녹음 진행 상태는 아래의 Artlist 항목에서 확인합니다.

선택한 편지는 `letters.html?letter=1962-03`처럼 URL에 저장되어 새로고침, 링크 공유, 브라우저 뒤로/앞으로 가기에서도 유지됩니다. 기존 `/?letter=...`와 `index.html?letter=...` 링크도 해당 편지 페이지로 연결됩니다. 편지를 바꾸거나 다른 페이지로 이동하면 음성 재생이 정지합니다.

### 스캔 원문과 OCR 기록

- `data/letter_scans/ocr_pages.jsonl`: 페이지별 OCR 원문·좌표·인식 후보.
- `data/letter_scans/corrections.json`: 명확한 글자 혼동 등에 대한 보정 규칙.
- `data/letter_scans/import-report.json`: 번호 연속성, 제외 페이지, 적용한 보정과 낮은 신뢰도 문장 목록.
- `data/letter_scans/reviewed-lines.json`: 낮은 신뢰도로 잡힌 15개 행을 실제 스캔과 대조한 기록. 전체 문장을 수작업으로 대조했다는 뜻은 아닙니다.
- 각 편지의 `originalText`: OCR 본문의 줄바꿈을 보존한 텍스트. `sentences`에서는 화면 표시를 위해 줄바꿈을 연결합니다.
- 각 편지의 `contentStatus`: 번역·해설·음성의 생성 상태. 학습 자료의 `studyGeneration.fullManualReview`와 스캔 출처의 `source.fullManualReview`는 별개이며, 전체 스캔을 수작업 대조한 자료로 표시하지 않습니다.

macOS에서 원본 148장에 같은 OCR을 다시 실행하려면 다음 명령을 사용합니다. 이미지나 원문을 외부 서비스에 업로드하지 않습니다.

```bash
swiftc scripts/ocr_letter_scans.swift -o /tmp/letter-ocr
/tmp/letter-ocr letter_scan /tmp/letter-pages.jsonl
python3 scripts/import_letter_scans.py --ocr /tmp/letter-pages.jsonl
```

마지막 명령은 검증만 합니다. JSON을 쓰려면 `--write`를 추가하며, 기존 변환 파일은 기본적으로 덮어쓰지 않습니다. 원본을 다시 변환해 덮어쓰려는 경우에만 `--overwrite`를 함께 지정하세요. 변환 대상은 8~365번이며 1~7번은 보존합니다.

### 문장별 한국어 학습 자료

문장마다 `korean`, `explanation`, `grammar`, `vocabulary`, `expressions`를 관리합니다. 단어의 `word`·`meaning`·`note`, 표현의 `expression`·`meaning`·`explanation`은 해당 문맥의 뜻과 쓰임을 설명합니다. 관용표현을 억지로 만들지 않고, 별도로 정리할 표현이 없으면 빈 배열을 씁니다. 문장별 자료를 먼저 보여 주고 기존 편지 전체 목록의 관련 항목도 함께 표시합니다.

1~7번의 기존 해석·해설·문법은 보존하고 문장별 단어를 보충했습니다. 8~10번 및 일부 예외는 직접 작성·검토했습니다. 나머지는 로컬 [EXAONE](https://huggingface.co/mlx-community/EXAONE-3.5-7.8B-Instruct-4bit)로 번역·어휘 초안을 만들고, 문법은 [spaCy 영어 구문 분석](https://spacy.io/usage/linguistic-features)과 구문별 설명 규칙으로 작성합니다. 자동 자료는 표본 검토한 초안이며 전체 수동 검수 완료를 뜻하지 않습니다. `studyGeneration`과 `studyStatus`에 작성·검토 상태를 기록합니다.

- `data/letter_study/source-manifest.json`: 작업 시작 당시 영어·문장 순서·음원 연결 및 기존 해설의 보존 검사 기준.
- `data/letter_study/generated/`: 재개 가능한 문장별 생성 기록과 출처.
- `data/letter_study/seeds.json`: 반복되는 인사말 등을 직접 작성한 자료.
- `data/letter_study/grammar-corrections.json`, `reviewed-notes.json`: 시적인 구문과 스캔 대조 항목의 수동 보정.
- `data/letter_study/review-report.json`: 최종 보정·누락·원문 보존 검사 결과.

Apple Silicon에서 재개·검증할 때:

```bash
python3 -m venv /tmp/letter-study-env
/tmp/letter-study-env/bin/pip install -r requirements-letter-study.txt
HF_HUB_DISABLE_XET=1 /tmp/letter-study-env/bin/hf download mlx-community/EXAONE-3.5-7.8B-Instruct-4bit --local-dir /tmp/letter-study-model
/tmp/letter-study-env/bin/python scripts/enrich_letter_study.py --model /tmp/letter-study-model --write
/tmp/letter-study-env/bin/python scripts/review_letter_study.py --write
/tmp/letter-study-env/bin/python scripts/enrich_letter_study.py --verify --first 1
/tmp/letter-study-env/bin/python scripts/test_letter_grammar.py
```

`--write`가 없으면 생성 자료만 저장하고 화면의 편지 JSON에는 반영하지 않습니다. 보정 스크립트는 생성 작업이 끝난 뒤 실행합니다. 영어와 음성 연결을 의도적으로 바꾼 뒤에는 보존 검사 기준을 확인해야 하며, 기존 기준을 무조건 덮어쓰지 않습니다. 스캔의 일부 인식 오류는 영어 본문을 바꾸지 않고 세부 설명에서 바른 읽기를 안내합니다. 웹페이지는 생성 결과 JSON만 읽으므로 실행에 모델이나 API 키가 필요하지 않습니다.

### 편지 데이터 관리

학습 화면은 **01 영어 본문 → 02 한국어 전체 해석 → 03 핵심 단어와 표현** 순서입니다. 본문에서 문장을 선택하면 **한국어 해석 / 문장 설명 / 핵심 단어 / 관용어·표현 설명 / 문법 설명**을 표시합니다. 문장별 `vocabulary`와 `expressions`가 있으면 해당 문맥의 설명을 우선하며, 편지 전체 목록에 등록된 관련 항목도 함께 보여 줍니다. 세부 설명 안의 표현은 펼쳐진 상태로 표시하며, 03 영역의 전체 목록도 유지합니다. 관용표현을 따로 정리하지 않은 문장에는 그 사실을 표시합니다.

단어는 활용형을, 표현은 등록된 원문(`original`)과 표현 형태를 이용해 문장에 연결합니다. 특정 문장에 직접 연결하려면 단어나 표현 항목에 숫자 배열 `sentenceIds`를 지정할 수 있습니다. 예를 들어 `"sentenceIds": [2]`는 해당 편지의 `id: 2` 문장에 연결하며 자동 연결보다 우선합니다.

`data/letters.json`의 `totalLetters: 365`를 기준으로 미등록 번호는 준비 중 링크로 자동 표시합니다. 새 본문을 등록할 때 해당 번호의 항목을 `letters` 배열에 추가하면 준비 중 링크가 본문 링크로 바뀝니다. 미등록 편지의 주소(`?letter=letter-008`)도 등록 후 같은 번호의 본문으로 연결됩니다. 날짜는 실제 등록 자료의 `title`을 사용하며 준비 중 번호에는 날짜를 추정해 넣지 않습니다.

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

1. 해당 편지의 기존 JSON을 열어 내용을 수정합니다. 1~365번은 모두 등록되어 있습니다.
2. `id`와 `title`에는 스캔의 실제 연도를 사용합니다. 예를 들어 Letter 8은 `1963-08`, `1963 / 8`입니다. `english`에 편지 번호나 책의 쪽수를 넣지 않습니다.
3. `paragraphs`는 `sentences` 배열의 **0부터 시작하는 인덱스**입니다. 문장 수를 바꾸면 함께 수정합니다. 번역·단어·해설은 실제 작성한 자료만 채우고 `contentStatus`도 갱신합니다.
4. `data/letters.json`에는 편지의 번호와 본문 파일 경로를 연결합니다.

```json
{ "id": "1963-08", "number": 8, "title": "1963 / 8", "file": "data/lesson08.json" }
```

`defaultLetter`는 처음 접속할 때 보여 줄 편지의 `id`입니다. 본문이 아직 없으면 `file`을 `null`로 둘 수 있습니다.

```json
{ "id": "1963-09", "number": 9, "title": "1963 / 9", "file": "data/lesson09.json" }
```

### 스캔 편지의 Artlist Views 녹음

새 편지의 음성 설정은 **Views · 미국식 영어 · 0.9배 속도 · 효과 없음**입니다. 현재 **8~365번 중 352편**의 전체 MP3와 문장별 MP3 **3,861개**가 연결되었습니다. 이번 작업에서 문장별 MP3 **3,194개**와 전체 MP3 **303개**를 추가했습니다. **72·143·177·228·266·316번의 38개 문장**은 Artlist 콘텐츠 제한으로 생성되지 않아 해당 편지의 전체 듣기는 대기 중입니다. 이 편지에서도 생성이 끝난 문장은 개별 재생할 수 있습니다. 기존 1~7번을 포함하면 전체 **4,006개 문장·359편 전체 듣기**가 준비됐습니다. 기존 1~7번의 음성과 학습 내용은 유지합니다.

- `data/letter_audio/plan.json`: 전체 358편·3,899개 문장의 생성 계획. 문장 사이의 명시적인 쉼을 포함한 낭독 묶음으로 생성합니다.
- `data/letter_audio/generations/`: Artlist 생성 식별자와 완료 기록. 재개할 때 이미 생성한 음성을 다시 결제해 만들지 않고 재사용합니다.
- `data/letter_audio/processed/`: 검증한 문장 경계와 MP3 경로.
- `data/letter_audio/status.json`, `resume.json`: 완료된 편지·문장 수와 남은 작업.

음성 생성은 연결된 Artlist 도구로 진행합니다. 다운로드 URL은 저장소 밖의 준비 파일에 두고, 아래 스크립트로 문장 경계를 검증해 MP3로 저장합니다. 경계가 문장 수와 맞지 않으면 자동 게시하지 않습니다. 검증한 문장 MP3는 개별 연결하고, 편지의 모든 문장이 준비되면 전체 MP3를 조합합니다. 콘텐츠 제한으로 거절된 생성은 `provider-rejections.json`, 파일·본문 보존 검증은 `verification.json`에 기록합니다.

```bash
python3 -m pip install -r requirements-letter-audio.txt
python3 scripts/process_letter_audio.py --ready-dir /tmp/niha-letter-audio-ready --watch
```

`scripts/import_letter_scans.py --overwrite`는 전사 데이터를 다시 쓰므로 생성된 음성 연결도 초기화합니다. 녹음 후에는 필요할 때만 원문을 재생성하고, 영어 문장을 바꾸면 해당 녹음을 다시 만들어야 합니다.

기존 OpenAI 음성 생성 스크립트는 옵션 없이 실행하면 Letter 1을 사용합니다. 이 스크립트로 생성할 때는 해당 JSON의 `audio`와 `fullAudio`에 출력 경로를 먼저 설정합니다.

```bash
python3 scripts/generate_audio.py --lesson data/lesson02.json
```

유튜브 URL은 각 JSON의 `youtubeUrl`에 설정할 수 있습니다. 영상 영역은 현재 `letters.html`에서 주석으로 숨겨져 있으며 필요하면 해당 주석을 해제합니다. 음성은 공개 게시할 권리가 있는 파일만 업로드하세요.

## 6. Role Playing 유지보수

상황별 핵심 표현 118개는 영어 문장을 누르면 MP3로 재생됩니다. 별도의 듣기 버튼은 표시하지 않습니다. 음성은 Artlist **Suburb**, 미국식 영어, 생성 속도 **0.9배**입니다. 각 `expressions[]` 항목의 `audio`와 `audioVoice`에서 경로와 음성을 관리하며, 파일 및 생성 출처는 `audio/roleplay/expressions/suburb/`에 저장합니다. 대화 대본의 Hope/Jessica 음성은 그대로 사용합니다.

내용은 `data/roleplay.json`에서 관리합니다. 기존 명상 대화 8가지(첫인사, 자기소개, 오늘의 감정, 명상 후 경험, 공감하기, 혼자만의 시간, 춤 제안 거절, 분명하게 경계 전하기)에 스캔 PDF의 일상 대화 4가지를 추가했습니다. 오늘의 감정에는 5개 케이스, 명상 후 경험에는 액티브 명상 대화를 포함한 4개 케이스, 나머지 상황에는 각 3개 케이스가 있습니다.

추가한 일상 상황은 **답답한 상황 이야기하기**(Day 04), **잘 맞는 사람과 신뢰**(Day 05), **약속 시간 조율하기**(Day 10), **늦을 때와 도착 연락**(Day 11)입니다. 핵심 표현과 대화 케이스는 기존 화면에서 같은 방식으로 연습합니다. 추가 상황의 `source`에 자료의 단원과 PDF 쪽수를 기록했습니다. 표현별 `note`에는 사용법, 말투, 문법 설명을 넣을 수 있습니다.

- `scenarios[]`: 상황의 `id`, `title`, `englishTitle`, 설명(`description`), 핵심 패턴(`pattern`), 팁(`tip`).
- `expressions[]`: 상황별 핵심 표현의 `english`, `korean`, 선택 사항인 사용법 설명(`note`).
- `cases[]`: 각 대화의 `id`, `title`, 상황 설명(`context`), 상대 역할(`partnerRole`), 대화 차례(`turns`), 마무리 복습 포인트(`review`).
- `turns[]`: 상대 문장(`partner.english`, `partner.korean`), 내 미션(`mission`), 표현 힌트(`hints`), 가능한 답변들(`responses`의 `english`, `korean`).
- `partner.study`, `responses[].study`: 전체 대본에서 보여 줄 문장 해설(`explanation`)과 단어·표현 목록(`terms[]`의 `english`, `korean`). 각 문장 바로 옆에서 내용을 관리합니다.
- `essentials[]`: 암기 체크리스트의 `id`, `english`, `korean`.
- `speakingTips[]`: 말하기 팁의 `title`, `text`.

상황과 케이스를 배열에 추가하면 선택 버튼이 자동으로 생깁니다. 케이스의 `id`는 같은 상황 안에서 중복되지 않게 작성합니다. 모든 케이스는 각 차례의 상대 질문에 소리 내어 답하거나 답을 입력하고 **대답했어요**를 눌러 진행합니다. 입력한 답은 대화 기록에서 확인하고, 전체 대본과 답변 예시도 볼 수 있습니다.

**전체 대본 보기**를 펼치면 상대와 답변 예시의 각 영어 문장 아래에 한글 뜻, 짧은 문장 해설, 핵심 단어·표현이 작은 글씨로 표시됩니다. 대본의 한글 뜻은 항상 표시합니다. 영어 문장을 누르면 Artlist에서 생성한 MP3를 재생합니다. 화자1(상대)은 **Hope - Bubbly, Gossipy and Girly**, 화자2(나·답변 예시)는 **Jessica Anne Bogart - Chatty and Friendly**입니다. **전체 대화 듣기**는 두 화자의 대사를 번갈아 재생하며, 정지 버튼이나 케이스 변경으로 멈출 수 있습니다. 듣기 속도는 문장별 듣기와 전체 대화에 모두 적용됩니다.

39개 케이스의 236개 대사에 MP3가 연결되어 있습니다. 중복 문장을 재사용해 실제 파일은 220개이며 `audio/roleplay/dialogue/hope/`와 `audio/roleplay/dialogue/jessica/`에 저장합니다. 각 대사의 `audio`는 파일 경로, `audioVoice`는 화자 음성 이름입니다. 생성 출처와 설정은 `audio/roleplay/dialogue/manifest.json`에 기록했습니다. 대사 내용을 수정하면 해당 MP3도 다시 생성하세요.

현재 39개 케이스의 대화 문장 236개에 해설과 표현 설명이 들어 있습니다. 새 문장에는 아래처럼 `study`를 추가합니다. 이 필드는 선택 사항이며 생략하면 영어와 한글 뜻만 표시합니다.

```json
{
  "english": "I found myself crying during meditation.",
  "korean": "명상하다 보니 나도 모르게 울고 있었어.",
  "study": {
    "explanation": "found myself + -ing는 의도하지 않았는데 어느새 그런 행동을 하고 있었음을 뜻해요.",
    "terms": [
      { "english": "found myself crying", "korean": "나도 모르게 울고 있었다" },
      { "english": "during meditation", "korean": "명상하는 동안" }
    ]
  }
}
```

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
