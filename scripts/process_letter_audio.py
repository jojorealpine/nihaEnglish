"""Download Artlist results, verify explicit pauses, and publish sentence/full MP3s.

Requires imageio-ffmpeg and certifi. Generation itself uses the connected Artlist
tools. Ready records contain tool-returned download URLs and live outside the repo.
"""
import argparse
import json
import re
import shutil
import ssl
import subprocess
import time
import urllib.request
from pathlib import Path

import certifi
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'data/letter_audio'
CACHE = Path('/tmp/niha-letter-audio-cache')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
CONTEXT = ssl.create_default_context(cafile=certifi.where())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def ffmpeg(*args):
    result = subprocess.run([FFMPEG, '-hide_banner', '-nostdin', '-y', *map(str, args)], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-2000:])
    return result.stderr


def duration(path):
    log = ffmpeg('-i', path, '-f', 'null', '-')
    match = re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)', log)
    if not match:
        raise ValueError(f'No audio duration: {path}')
    hours, minutes, seconds = map(float, match.groups())
    return hours * 3600 + minutes * 60 + seconds


def boundaries(path, count):
    length = duration(path)
    if count == 1:
        return [(0.0, length)]
    # Explicit 1.5-second SSML pauses must produce exactly the expected count.
    # Never guess time positions when the recording does not match the plan.
    for minimum in [1.35, 1.1]:
        for level in [-38, -42, -35, -32]:
            log = ffmpeg('-i', path, '-af', f'silencedetect=noise={level}dB:d={minimum}', '-f', 'null', '-')
            starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
            ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
            gaps = [(a, b) for a, b in zip(starts, ends) if a > 0.2 and b < length - 0.15]
            if len(gaps) == count - 1:
                ranges = [(0.0 if i == 0 else gaps[i - 1][1] - 0.12,
                           length if i == count - 1 else gaps[i][0] + 0.12) for i in range(count)]
                if all(end - start > 0.2 for start, end in ranges):
                    return ranges
    raise ValueError(f'Pause count mismatch: expected {count - 1} boundaries in {path.name}')


def process(job, result):
    done = STATE / 'processed' / f"{job['key']}.json"
    if done.exists():
        return
    lesson_path = ROOT / job['lessonFile']
    lesson = json.loads(lesson_path.read_text())
    assert lesson['id'] == job['lessonId']
    assert [lesson['sentences'][i]['english'] for i in job['indices']] == job['sentences'], 'Lesson text changed after generation'
    assert re.fullmatch(r'\d{4}-\d{2,3}', lesson['id'])
    cache = CACHE / lesson['id']
    cache.mkdir(parents=True, exist_ok=True)
    source = cache / f"{job['key']}.mp3"
    if not source.exists():
        with urllib.request.urlopen(result['url'], context=CONTEXT, timeout=120) as response:
            data = response.read()
        if len(data) < 1000:
            raise ValueError('Empty audio download')
        temporary = source.with_suffix('.tmp.mp3')
        temporary.write_bytes(data)
        temporary.replace(source)
    ranges = boundaries(source, len(job['indices']))
    clips = []
    output = ROOT / 'audio' / lesson['id']
    output.mkdir(parents=True, exist_ok=True)
    for index, (start, end), text in zip(job['indices'], ranges, job['sentences']):
        assert end - start > max(0.2, len(text.split()) * 0.055), 'Implausibly short utterance'
        pcm = cache / f'{index + 1:02d}.wav'
        clip = output / f'{index + 1:02d}.mp3'
        temporary = clip.with_suffix('.tmp.mp3')
        ffmpeg('-ss', start, '-i', source, '-t', end - start, '-ac', 1, '-ar', 44100, '-c:a', 'pcm_s16le', pcm)
        ffmpeg('-i', pcm, '-c:a', 'libmp3lame', '-b:a', '128k', temporary)
        assert duration(temporary) > 0.2
        temporary.replace(clip)
        clips.append({'index': index, 'text': text, 'path': str(clip.relative_to(ROOT)), 'start': start, 'end': end})
    save(done, {'key': job['key'], 'number': job['number'], 'generationId': result['generationId'],
                'voice': 'Views', 'speed': 0.9, 'clips': clips})


def publish(plan):
    records = [json.loads(path.read_text()) for path in (STATE / 'processed').glob('*.json')]
    by_letter = {}
    for record in records:
        by_letter.setdefault(record['number'], {}).update({clip['index']: clip for clip in record['clips']})
    complete = []
    for number, clips in sorted(by_letter.items()):
        path = ROOT / f'data/lesson{number:02d}.json'
        lesson = json.loads(path.read_text())
        if set(clips) != set(range(len(lesson['sentences']))):
            # Keep completed recordings playable even when another part of the
            # same letter was rejected by the provider.
            for index, clip in clips.items():
                assert lesson['sentences'][index]['english'] == clip['text']
                lesson['sentences'][index]['audio'] = clip['path']
            lesson['contentStatus']['audio'] = 'partial'
            lesson['audioVoice'] = 'Views'
            save(path, lesson)
            continue
        marker = STATE / 'letters' / f'{number:03d}.json'
        if marker.exists():
            complete.append(number)
            continue
        cache = CACHE / lesson['id']
        cache.mkdir(parents=True, exist_ok=True)
        gap = CACHE / 'gap.wav'
        if not gap.exists():
            ffmpeg('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', 0.4, '-c:a', 'pcm_s16le', gap)
        sources = []
        for index in range(len(lesson['sentences'])):
            pcm = cache / f'{index + 1:02d}.wav'
            if not pcm.exists():
                ffmpeg('-i', ROOT / clips[index]['path'], '-ac', 1, '-ar', 44100, '-c:a', 'pcm_s16le', pcm)
            sources.append(pcm)
            if index + 1 < len(lesson['sentences']):
                sources.append(gap)
        concat = cache / 'concat.txt'
        concat.write_text(''.join(f"file '{source}'\n" for source in sources))
        full = ROOT / 'audio' / lesson['id'] / 'script_all.mp3'
        temporary = full.with_suffix('.tmp.mp3')
        ffmpeg('-f', 'concat', '-safe', 0, '-i', concat, '-c:a', 'libmp3lame', '-b:a', '128k', temporary)
        full_duration = duration(temporary)
        temporary.replace(full)
        for index, sentence in enumerate(lesson['sentences']):
            assert sentence['english'] == clips[index]['text']
            sentence['audio'] = clips[index]['path']
        lesson['fullAudio'] = str(full.relative_to(ROOT))
        lesson['contentStatus']['audio'] = 'ready'
        lesson['audioVoice'] = 'Views'
        save(path, lesson)
        save(marker, {'number': number, 'id': lesson['id'], 'fullAudio': lesson['fullAudio'],
                      'duration': full_duration, 'sentences': len(clips), 'voice': 'Views', 'speed': 0.9})
        shutil.rmtree(cache)
        complete.append(number)
        print(f"Letter {number}: {len(clips)} sentence MP3s and full audio ready", flush=True)
    progress = {'provider': 'Artlist', 'voice': 'Views', 'speed': 0.9,
                'totalLetters': plan['totalLetters'], 'totalSentences': plan['totalSentences'],
                'readyLetters': len(complete), 'readySentences': sum(len(by_letter[n]) for n in complete),
                'availableSentenceClips': sum(len(clips) for clips in by_letter.values()),
                'partialNumbers': sorted(set(by_letter) - set(complete)),
                'completedNumbers': complete, 'status': 'complete' if len(complete) == plan['totalLetters'] else 'partial'}
    save(STATE / 'status.json', progress)
    return progress


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ready-dir', default='/tmp/niha-letter-audio-ready')
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    plan = json.loads((STATE / 'plan.json').read_text())
    jobs = {job['key']: job for job in plan['jobs']}
    seen = set()
    while True:
        changed = False
        for path in sorted(Path(args.ready_dir).glob('*.json')):
            if path.stem in seen:
                continue
            try:
                result = json.loads(path.read_text())
            except (json.JSONDecodeError, OSError):
                continue
            key = result['key']
            if key not in jobs:
                continue
            try:
                process(jobs[key], result)
                failure = STATE / 'failures' / f'{key}.json'
                failure.unlink(missing_ok=True)
            except Exception as error:
                save(STATE / 'failures' / f'{key}.json', {'key': key, 'error': str(error), 'generationId': result.get('generationId')})
                print(f'Needs review: {key}: {error}', flush=True)
            seen.add(path.stem)
            changed = True
        if changed:
            progress = publish(plan)
            print(f"Progress: {progress['readyLetters']}/{progress['totalLetters']} letters", flush=True)
        if not args.watch or (STATE / 'generation-finished.json').exists():
            if not changed:
                publish(plan)
            break
        time.sleep(3)


if __name__ == '__main__':
    main()
