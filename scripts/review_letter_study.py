#!/usr/bin/env python3
"""Refresh grounded grammar and apply selected manual corrections after generation."""
import argparse
import hashlib
import json
from pathlib import Path
import spacy
from enrich_letter_study import ROOT, STORE, MODEL_NAME, read, save, source_hash, validate, publish, prepare_model_notes
from letter_grammar import explain_grammar


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    status = read(STORE / 'status.json') if (STORE / 'status.json').exists() else {}
    if args.write and status.get('state') == 'running':
        raise SystemExit('Wait for generation to finish before writing review corrections.')
    manifest = read(STORE / 'source-manifest.json')
    manual = {(r['lesson'], r['sentence']): r for r in read(STORE / 'reviewed-notes.json')}
    revision = hashlib.sha256((ROOT / 'scripts/letter_grammar.py').read_bytes() + (STORE / 'grammar-corrections.json').read_bytes()).hexdigest()[:12]
    nlp = spacy.load('en_core_web_sm', disable=['ner'])
    report = {'grammarRevision': revision, 'grammarRefreshed': 0, 'manualNotes': 0,
              'recoveredFailures': [], 'pending': [], 'sourceAndAudioUnchanged': True,
              'fullManualReview': False, 'preservedEdits': []}
    for number in range(8, 366):
        path = ROOT / f'data/lesson{number:02}.json'
        lesson = read(path)
        expected = manifest[str(number)]
        assert source_hash(lesson) == expected['sourceHash'], number
        staged_path = STORE / f'generated/{number:03}.json'
        if not staged_path.exists():
            report['pending'].extend((number, s['id']) for s in lesson['sentences'])
            continue
        staged = read(staged_path)
        changed = False
        for sentence, doc in zip(lesson['sentences'], nlp.pipe([s['english'] for s in lesson['sentences']])):
            sid = str(sentence['id'])
            point, grammar = explain_grammar(doc)
            entry = staged['sentences'].get(sid)
            reviewed = manual.get((number, sentence['id']))
            externally_edited = bool(entry and sentence.get('studyStatus') and any(
                sentence.get(key) and sentence[key] != entry['notes'].get(key)
                for key in ('korean', 'explanation', 'grammar', 'vocabulary', 'expressions')))
            if externally_edited:
                report['preservedEdits'].append((number, sentence['id']))
                continue
            if reviewed:
                assert reviewed['english'] == sentence['english']
                notes = validate(reviewed['notes'], sentence['english'])
                entry = {'method': 'authored correction', 'notes': notes, 'review': reviewed['review']}
                staged['sentences'][sid] = entry
                sentence.update(notes)
                report['manualNotes'] += 1
                changed = True
            elif not entry:
                failure_path = STORE / f'failures/{number:03}-{sentence["id"]:03}.json'
                if failure_path.exists():
                    failure = read(failure_path)
                    assert failure['english'] == sentence['english']
                    try:
                        text = failure['response']
                        raw, _ = json.JSONDecoder().raw_decode(text[text.index('{'):])
                        notes = prepare_model_notes(raw, sentence['english'], grammar)
                        entry = {'method': MODEL_NAME, 'notes': notes, 'grammarMethod': 'spaCy en_core_web_sm + construction templates', 'grammarPoint': point}
                        staged['sentences'][sid] = entry
                        sentence.update(notes)
                        report['recoveredFailures'].append((number, sentence['id']))
                        changed = True
                    except (ValueError, TypeError, KeyError):
                        pass
            if not entry:
                report['pending'].append((number, sentence['id']))
                continue
            if entry['method'] == MODEL_NAME:
                entry['notes']['grammar'] = grammar
                entry['grammarPoint'] = point
                entry['grammarRevision'] = revision
                if sentence.get('studyStatus') or len(staged['sentences']) == len(lesson['sentences']):
                    sentence['grammar'] = grammar
                report['grammarRefreshed'] += 1
                changed = True
            validate(entry['notes'], sentence['english'])
        if args.write and changed:
            assert source_hash(lesson) == expected['sourceHash']
            save(staged_path, staged)
            save(path, lesson)
            publish(number, staged, expected, force=True)
            lesson = read(path)
            if lesson.get('studyGeneration'):
                lesson['studyGeneration']['grammarRevision'] = revision
            for sentence in lesson['sentences']:
                if (number, sentence['id']) in manual:
                    sentence['studyStatus'] = 'reviewed'
            assert source_hash(lesson) == expected['sourceHash']
            save(path, lesson)
    # First seven authored lessons retain all pre-existing translations/notes.
    for number in range(1, 366):
        lesson = read(ROOT / f'data/lesson{number:02}.json')
        assert source_hash(lesson) == manifest[str(number)]['sourceHash'], number
        for sentence, original in zip(lesson['sentences'], manifest[str(number)]['preservedStudy']):
            for key, value in original.items():
                assert sentence[key] == value, (number, sentence['id'], key)
    if args.write:
        save(STORE / 'review-report.json', report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
