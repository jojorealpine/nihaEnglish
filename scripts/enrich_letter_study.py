#!/usr/bin/env python3
"""Generate resumable, sentence-specific Korean notes with a local MLX model.

Model weights and MLX are installed separately; no API key or paid service is used.
The source manifest protects English text, sentence ordering and audio bindings.
"""
import argparse
import copy
import hashlib
import json
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / 'data/letter_study'
MODEL_NAME = 'mlx-community/EXAONE-3.5-7.8B-Instruct-4bit'
FIELDS = ('korean', 'explanation', 'grammar')


def read(path):
    return json.loads(path.read_text())


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def source_hash(data):
    protected = {k: data.get(k) for k in ('id', 'fullAudio', 'originalText', 'paragraphs')}
    protected['sentences'] = [{k: s.get(k) for k in ('id', 'english', 'audio', 'chunkAudio', 'chunks')} for s in data['sentences']]
    return hashlib.sha256(json.dumps(protected, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def tokens(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower().replace('’', "'"))


def in_source(label, english):
    words, source = tokens(label), tokens(english)
    # Labels must use words in the input; allow punctuation/ellipsis between them.
    if not words:
        return False
    position = 0
    for word in words:
        try:
            position = source.index(word, position) + 1
        except ValueError:
            return False
    return True


def validate(raw, english):
    if isinstance(raw, str):
        start = raw.find('{')
        if start < 0:
            raise ValueError('No JSON object')
        raw, _ = json.JSONDecoder().raw_decode(raw[start:])
    result = {}
    for field in FIELDS:
        value = raw.get(field, '')
        if not isinstance(value, str) or not re.search('[가-힣]', value) or '�' in value or re.search('[\u4e00-\u9fff]', re.sub(r'[（(][\u4e00-\u9fff]+[）)]', '', value)):
            raise ValueError(f'Missing Korean {field}')
        result[field] = value.strip().replace('\\"', '"')
    for group, label, note in [('vocabulary', 'word', 'note'), ('expressions', 'expression', 'explanation')]:
        if not isinstance(raw.get(group), list):
            raise ValueError(f'Missing {group} array')
        entries = []
        for item in raw[group]:
            if not isinstance(item, dict) or re.search('[가-힣\u4e00-\u9fff]', str(item.get(label, ''))) or not in_source(str(item.get(label, '')), english):
                continue
            if not all(isinstance(item.get(k), str) and re.search('[가-힣]', item[k]) and '�' not in item[k] for k in ('meaning', note)):
                continue
            entries.append({k: item[k].strip() for k in (label, 'meaning', note)})
        result[group] = entries[:3 if group == 'vocabulary' else 2]
    if not result['vocabulary']:
        raise ValueError('No vocabulary grounded in English source')
    # Grammar must explain the source English, not only the Korean translation.
    quoted_source = any(q.lower().replace('’', "'") in english.lower().replace('’', "'") for q in re.findall('「([^」]+)」', result['grammar']) if tokens(q))
    if not (set(tokens(result['grammar'])) & set(tokens(english)) or quoted_source):
        raise ValueError('Grammar does not refer to the English sentence')
    return result


def prepare_model_notes(raw, english, grammar):
    raw = copy.deepcopy(raw)
    raw['grammar'] = grammar
    raw['expressions'] = [e for e in raw.get('expressions', [])
        if isinstance(e, dict) and len(tokens(str(e.get('expression', '')))) > 1
        and not re.search('주어|목적어|보어|현재형|과거형|시제|진행형', str(e.get('explanation', '')))]
    for item in raw.get('vocabulary', []):
        if isinstance(item, dict) and re.search('진행형|시제|과거형|현재형|과거분사|현재완료|과거완료|주어|목적어|보어', str(item.get('note', ''))):
            item['note'] = f'이 문맥에서는 「{item.get("meaning", "")}」의 뜻으로 읽습니다.'
    return validate(raw, english)


def publish(number, staged, manifest, force=False):
    path = ROOT / f'data/lesson{number:02}.json'
    lesson = read(path)
    if source_hash(lesson) != manifest['sourceHash']:
        raise ValueError(f'Lesson {number}: English/audio changed since manifest')
    if not force and all(s.get('studyStatus') and s.get('vocabulary') and all(s.get(k) for k in FIELDS) for s in lesson['sentences']):
        return True
    for sentence in lesson['sentences']:
        entry = staged['sentences'].get(str(sentence['id']))
        if not entry:
            return False
        notes = validate(entry['notes'], sentence['english'])
        for field in FIELDS:
            if not sentence.get(field):
                sentence[field] = notes[field]
        for field in ('vocabulary', 'expressions'):
            if not sentence.get(field):
                sentence[field] = notes[field]
        sentence['studyStatus'] = 'generated'
    for group, label in [('vocabulary', 'word'), ('expressions', 'expression')]:
        original = [item for item in lesson.get(group, []) if not item.get('studyGenerated')]
        seen = {' '.join(tokens(item[label])) for item in original}
        added = {}
        for sentence in lesson['sentences']:
            for item in sentence[group]:
                key = ' '.join(tokens(item[label]))
                if key in seen:
                    continue
                if key not in added:
                    added[key] = {**copy.deepcopy(item), 'sentenceIds': [], 'studyGenerated': True}
                added[key]['sentenceIds'].append(sentence['id'])
        lesson[group] = original + list(added.values())
    translation_generated = not lesson.get('translations') or lesson.get('studyGeneration', {}).get('translationGenerated', False)
    if translation_generated:
        lesson['translations'] = [' '.join(lesson['sentences'][i]['korean'] for i in indices) for indices in lesson['paragraphs']]
    status = lesson.setdefault('contentStatus', {})
    if status.get('translation') in (None, 'not-created'):
        status['translation'] = 'generated'
    status['studyNotes'] = 'generated'
    lesson['studyGeneration'] = {'model': MODEL_NAME, 'review': 'automated validation and selected manual samples', 'fullManualReview': False, 'translationGenerated': translation_generated, 'grammar': 'spaCy en_core_web_sm + construction templates'}
    assert source_hash(lesson) == manifest['sourceHash']
    for sentence, previous in zip(lesson['sentences'], manifest['preservedStudy']):
        for field, value in previous.items():
            assert sentence[field] == value, (number, sentence['id'], field)
    save(path, lesson)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', default='/tmp/niha-study-modelko')
    parser.add_argument('--model-name', default=MODEL_NAME)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--first', type=int, default=8)
    parser.add_argument('--last', type=int, default=365)
    parser.add_argument('--limit', type=int, default=0, help='Maximum generated batches (0 means all)')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--write', action='store_true', help='Publish completed lessons after sample review')
    args = parser.parse_args()
    globals()['MODEL_NAME'] = args.model_name
    manifest = read(STORE / 'source-manifest.json')
    seeds = read(STORE / 'seeds.json')
    seeds['Love'] = seeds['Love.']
    numbers = [n for n in list(range(8, 366)) + list(range(1, 8)) if args.first <= n <= args.last]
    lessons, staging, pending, failures = {}, {}, [], []
    for number in numbers:
        lesson = read(ROOT / f'data/lesson{number:02}.json')
        if source_hash(lesson) != manifest[str(number)]['sourceHash']:
            raise ValueError(f'Source mismatch: {number}')
        lessons[number] = lesson
        path = STORE / f'generated/{number:03}.json'
        staged = read(path) if path.exists() else {'sourceHash': manifest[str(number)]['sourceHash'], 'sentences': {}}
        if staged['sourceHash'] != manifest[str(number)]['sourceHash']:
            raise ValueError(f'Stale staging: {number}')
        staging[number] = staged
        for sentence in lesson['sentences']:
            sid = str(sentence['id'])
            if sid in staged['sentences']:
                validate(staged['sentences'][sid]['notes'], sentence['english'])
            elif sentence['english'].strip() in seeds:
                staged['sentences'][sid] = {'method': 'authored seed', 'notes': validate(seeds[sentence['english'].strip()], sentence['english'])}
            else:
                pending.append((number, sentence))
        if not args.verify:
            save(path, staged)
            if args.write:
                publish(number, staged, manifest[str(number)])
    def progress(state):
        completed = sum(len(s['sentences']) for s in staging.values())
        total = sum(len(d['sentences']) for d in lessons.values())
        data = {'state': state, 'model': MODEL_NAME, 'sentencesComplete': completed, 'sentencesTotal': total,
                'lessonsComplete': sum(len(staging[n]['sentences']) == len(d['sentences']) for n, d in lessons.items()),
                'lessonsTotal': len(lessons), 'failures': failures, 'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%S%z')}
        save(STORE / 'status.json', data)
        print(json.dumps({k: v for k, v in data.items() if k != 'failures'} | {'failedCount': len(failures)}, ensure_ascii=False), flush=True)
    if args.verify:
        missing = [(n, s['id']) for n, d in lessons.items() for s in d['sentences'] if not all(s.get(k) for k in FIELDS) or not s.get('vocabulary')]
        print(json.dumps({'sentencesChecked': sum(len(d['sentences']) for d in lessons.values()), 'missingCount': len(missing), 'firstMissing': missing[:20], 'sourceAndAudioUnchanged': True}, ensure_ascii=False))
        if missing:
            raise SystemExit(1)
        return
    # Group nearby letters by length to avoid a long output holding up short ones.
    pending.sort(key=lambda item: ((item[0] - 8) // 10, len(item[1]['english'])))
    progress('running')
    if not pending:
        progress('complete')
        return
    import spacy
    from letter_grammar import explain_grammar, vocabulary_targets
    nlp = spacy.load('en_core_web_sm', disable=['ner'])
    grammar_points = {}
    target_words = {}
    for (number, sentence), doc in zip(pending, nlp.pipe([s['english'] for _, s in pending], batch_size=128)):
        grammar_points[number, sentence['id']] = explain_grammar(doc)
        target_words[number, sentence['id']] = vocabulary_targets(doc)
    print(f'Prepared {len(grammar_points)} grammar notes from English syntax', flush=True)
    import mlx.core as mx
    from mlx_lm import load
    from mlx_lm.sample_utils import make_sampler
    from mlx_lm.models.cache import make_prompt_cache
    model_config = read(Path(args.model) / 'config.json')
    # Transformers 5 cannot infer the legacy EXAONE tokenizer config; its
    # published tokenizer is GPT-2-compatible and ships its own vocabulary.
    tokenizer_config = {'tokenizer_type': 'gpt2'} if model_config.get('model_type') == 'exaone' else None
    model, tokenizer = load(args.model, tokenizer_config=tokenizer_config)
    mx.set_cache_limit(512 * 1024 * 1024)
    mx.set_memory_limit(13 * 1024 * 1024 * 1024)
    system = (STORE / 'prompt.txt').read_text()
    def template(text):
        return tokenizer.apply_chat_template([{'role': 'system', 'content': system},
            {'role': 'user', 'content': text}], add_generation_prompt=True, enable_thinking=False)
    px, py = template('X'), template('Y')
    prefix = []
    for x, y in zip(px, py):
        if x != y:
            break
        prefix.append(x)
    prefix_cache = make_prompt_cache(model)
    for start in range(0, len(prefix), 256):
        model(mx.array([prefix[start:start + 256]]), cache=prefix_cache)
        mx.eval([c.state for c in prefix_cache])
    print(f'Cached {len(prefix)} shared instruction tokens', flush=True)
    from mlx_lm.generate import BatchGenerator
    prompts = []
    for number, sentence in pending:
        index = next(i for i, item in enumerate(lessons[number]['sentences']) if item['id'] == sentence['id'])
        previous = lessons[number]['sentences'][index - 1]['english'] if index else ''
        text = (f'참고 문맥(번역하지 마세요): {previous}\n\n' if previous else '') + f'분석 대상: {sentence["english"]}'
        text += '\n\nvocabulary.word에 사용할 영어 단어(그대로 복사): ' + ', '.join(target_words[number, sentence['id']])
        prompt = template(text)
        assert prompt[:len(prefix)] == prefix
        prompts.append(prompt[len(prefix):])
    generator = BatchGenerator(model, stop_tokens=[[t] for t in tokenizer.eos_token_ids],
        completion_batch_size=args.batch_size, prefill_batch_size=8,
        prefill_step_size=128, max_kv_size=2048, sampler=make_sampler(temp=0))
    uids = generator.insert(prompts, max_tokens=[800] * len(prompts), caches=[prefix_cache] * len(prompts))
    work = dict(zip(uids, pending))
    buffers = {uid: [] for uid in uids}
    changed = set()
    completed = generated_tokens = 0
    started = time.monotonic()

    def flush():
        for number in changed:
            save(STORE / f'generated/{number:03}.json', staging[number])
            if args.write:
                publish(number, staging[number], manifest[str(number)])
        changed.clear()
        elapsed = time.monotonic() - started
        print(f'Processed {completed}/{len(pending)} sentences in {elapsed:.1f}s; {generated_tokens/max(elapsed,1):.1f} tokens/s; peak {mx.get_peak_memory()/1e9:.2f}GB', flush=True)
        progress('running')

    try:
        while responses := generator.next_generated():
            for response in responses:
                uid = response.uid
                if response.finish_reason != 'stop':
                    buffers[uid].append(response.token)
                    generated_tokens += 1
                if response.finish_reason is None:
                    continue
                number, sentence = work[uid]
                text = tokenizer.decode(buffers.pop(uid))
                try:
                    raw, _ = json.JSONDecoder().raw_decode(text[text.index('{'):])
                    point, grammar = grammar_points[number, sentence['id']]
                    notes = prepare_model_notes(raw, sentence['english'], grammar)
                    staging[number]['sentences'][str(sentence['id'])] = {
                        'method': MODEL_NAME, 'grammarMethod': 'spaCy en_core_web_sm + construction templates',
                        'grammarPoint': point, 'notes': notes}
                    changed.add(number)
                except (ValueError, KeyError, TypeError) as error:
                    failures.append({'lesson': number, 'sentence': sentence['id'], 'error': str(error)})
                    save(STORE / f'failures/{number:03}-{sentence["id"]:03}.json', {'english': sentence['english'], 'error': str(error), 'response': text})
                completed += 1
                if completed % 32 == 0:
                    flush()
                if args.limit and completed >= args.limit * args.batch_size:
                    flush()
                    progress('partial')
                    return
        flush()
    finally:
        generator.close()
    progress('needs-review' if failures else ('complete' if args.write else 'draft-complete'))



if __name__ == '__main__':
    main()
