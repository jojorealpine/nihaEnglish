"""Import locally recognized scans into lesson JSON. No translations or audio are generated."""
import argparse
import hashlib
import json
import re
import statistics
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DUPLICATES = {'IMG_0784 2.JPG': 'IMG_0783 2.JPG', 'IMG_0795 2.JPG': 'IMG_0794 2.JPG'}
LAST_LETTER_IMAGE = 'IMG_0917 2.JPG'


def is_heading(line):
    return (re.fullmatch(r'\d{1,3}[.,]?', line['text']) is not None
            and line['y'] > 0.075 and line['height'] > 0.020)


def split_sentences(text):
    protected = re.sub(r'\b(?:Mr|Mrs|Ms|Dr|Prof|St|etc)\.', lambda m: m[0].replace('.', '\u2024'), text)
    protected = re.sub(r'\b(?:[A-Z]\.){2,}', lambda m: m[0].replace('.', '\u2024'), protected)
    protected = re.sub(r'(?<!\w)\d{1,2}\.(?=\s+[A-Z])', lambda m: m[0].replace('.', '\u2024'), protected)
    pieces = re.split(r'(?<=[.!?])\s+(?=[A-Z\u201c\u2018"(])', protected)
    return [piece.replace('\u2024', '.').strip() for piece in pieces if piece.strip()]


def convert(ocr_path):
    pages = [json.loads(line) for line in ocr_path.read_text().splitlines() if line.strip()]
    rules = json.loads((ROOT / 'data/letter_scans/corrections.json').read_text())
    reviewed_path = ROOT / 'data/letter_scans/reviewed-lines.json'
    reviewed = json.loads(reviewed_path.read_text())['lines'] if reviewed_path.exists() else []
    reviewed_keys = {(item['file'], item['side'], item['text']) for item in reviewed}
    letters, corrections, review, skipped = [], [], [], []
    current = None
    year = None
    for page in pages:
        file, side = page['file'], page['side']
        if file in DUPLICATES:
            skipped.append({'file': file, 'side': side, 'reason': 'duplicate scan', 'duplicateOf': DUPLICATES[file]})
            continue
        if file > LAST_LETTER_IMAGE:
            skipped.append({'file': file, 'side': side, 'reason': 'back matter'})
            continue
        lines = sorted(page['lines'], key=lambda line: -(line['y'] + line['height']))
        footer = [int(re.sub(r'\D', '', line['text'])) for line in lines
                  if re.fullmatch(r'\d{1,3}[.,]?', line['text']) and line['y'] < 0.075]
        printed_page = footer[-1] if footer else None
        body = [line for line in lines if line['x'] < 0.9 and line['y'] > 0.075 and not is_heading(line)
                and not re.fullmatch(r'19\d{2}', line['text'])]
        deltas = [a['y'] - b['y'] for a, b in zip(body, body[1:]) if 0.008 < a['y'] - b['y'] < 0.04]
        spacing = statistics.median(deltas) if deltas else 0.023
        previous = None
        for line in lines:
            text = unicodedata.normalize('NFKC', line['text']).strip()
            if line['x'] >= 0.9 or (re.fullmatch(r'\d{1,3}[.,]?', text) and line['y'] < 0.075):
                continue
            if re.fullmatch(r'19\d{2}', text) and line['height'] > 0.018:
                year = int(text)
                previous = None
                continue
            if is_heading(line):
                number = int(re.sub(r'\D', '', text))
                expected = 8 + len(letters)
                if number != expected:
                    raise ValueError(f'Non-contiguous letter heading: expected {expected}, got {number} at {file}/{side}')
                if year is None:
                    raise ValueError(f'Unknown year at letter {number}')
                current = {'number': number, 'year': year, 'paragraphLines': [], 'pages': []}
                letters.append(current)
                previous = None
                continue
            if not text:
                continue
            if current is None:
                raise ValueError(f'Unassigned text before first letter: {file}/{side}: {text}')
            location = {'file': file, 'side': side, 'printedPage': printed_page}
            if location not in current['pages']:
                current['pages'].append(location)
            before = text
            for word, replacement in rules['wordReplacements'].items():
                text = re.sub(r'(?<![A-Za-z])' + re.escape(word) + r'(?![A-Za-z])', lambda _: replacement, text)
            for rule in rules['lineReplacements']:
                if file == rule['file'] and side == rule['side'] and text == rule['before']:
                    text = rule['after']
            if text != before:
                corrections.append({**location, 'letter': current['number'], 'before': before, 'after': text})
            if line['confidence'] < 0.8:
                review.append({**location, 'letter': current['number'], 'text': text, 'confidence': line['confidence'],
                               'reviewStatus': 'verified-against-scan' if (file, side, text) in reviewed_keys else 'pending'})
            new_paragraph = not current['paragraphLines']
            if previous is not None:
                new_paragraph |= previous['y'] - line['y'] > spacing * 1.65
                new_paragraph |= previous['text'].strip() in {'Love', 'Love.', 'Love,', 'My respects to you.'}
            if new_paragraph:
                current['paragraphLines'].append([])
            current['paragraphLines'][-1].append(text)
            previous = line
    if [letter['number'] for letter in letters] != list(range(8, 366)):
        raise ValueError('The scans must cover letters 8 through 365 exactly')

    lessons = []
    for letter in letters:
        number, year = letter['number'], letter['year']
        sentences, paragraphs = [], []
        raw_paragraphs = ['\n'.join(lines) for lines in letter['paragraphLines']]
        for lines in letter['paragraphLines']:
            text = ' '.join(lines)
            indices = []
            for sentence in split_sentences(text):
                indices.append(len(sentences))
                sentences.append({'id': len(sentences) + 1, 'english': sentence, 'korean': '',
                                  'explanation': '', 'grammar': '', 'audio': None})
            if indices:
                paragraphs.append(indices)
        if not sentences:
            raise ValueError(f'Empty letter: {number}')
        lesson = {'id': f'{year}-{number:02d}', 'title': f'{year} / {number}', 'lesson': '', 'youtubeUrl': '',
                  'vocabulary': [], 'expressions': [], 'paragraphs': paragraphs, 'sentences': sentences,
                  'translations': [], 'fullAudio': None, 'originalText': '\n\n'.join(raw_paragraphs),
                  'contentStatus': {'transcription': 'ocr', 'translation': 'not-created', 'studyNotes': 'not-created', 'audio': 'not-created'},
                  'source': {'type': 'user-provided scans', 'directory': 'letter_scan', 'letterNumber': number,
                             'year': year, 'pages': letter['pages'], 'ocrEngine': 'macOS Vision',
                             'fullManualReview': False}}
        # Sentence segmentation may change whitespace only, never drop source text.
        assert re.sub(r'\s+', ' ', lesson['originalText']).strip() == ' '.join(s['english'] for s in sentences)
        lessons.append((ROOT / f'data/lesson{number:02d}.json', lesson, number))
    report = {'sourceImages': len({page['file'] for page in pages}), 'recognizedPages': len(pages),
              'lettersCreated': len(lessons), 'firstLetter': 8, 'lastLetter': 365,
              'skippedPages': skipped, 'corrections': corrections, 'reviewCandidates': review,
              'unresolvedReviewCandidates': sum(item['reviewStatus'] == 'pending' for item in review),
              'scope': 'English transcription only; no translations, study notes or audio generated',
              'ocrSHA256': hashlib.sha256(ocr_path.read_bytes()).hexdigest(),
              'totalSentences': sum(len(lesson['sentences']) for _, lesson, _ in lessons)}
    return lessons, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ocr', default='data/letter_scans/ocr_pages.jsonl')
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--overwrite', action='store_true', help='Explicitly replace already imported lessons')
    args = parser.parse_args()
    path = ROOT / args.ocr
    lessons, report = convert(path)
    if args.write:
        existing = [str(path.relative_to(ROOT)) for path, _, _ in lessons if path.exists()]
        if existing and not args.overwrite:
            raise SystemExit(f'Refusing to overwrite existing lessons: {existing[:5]}')
        catalog_path = ROOT / 'data/letters.json'
        catalog = json.loads(catalog_path.read_text())
        registered = {entry['number']: entry for entry in catalog['letters']}
        for path, lesson, number in lessons:
            path.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + '\n')
            registered[number] = {'id': lesson['id'], 'number': number, 'title': lesson['title'], 'file': str(path.relative_to(ROOT))}
        catalog['letters'] = [registered[number] for number in sorted(registered)]
        catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
        (ROOT / 'data/letter_scans/import-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['lettersCreated', 'firstLetter', 'lastLetter', 'totalSentences']}, ensure_ascii=False))
    print(f"Corrections: {len(report['corrections'])}; low-confidence lines: {len(report['reviewCandidates'])}")


if __name__ == '__main__':
    main()
