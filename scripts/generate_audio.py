"""Generate one MP3 per passage. Run from the repository root."""
import argparse
import json
import os
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--force', action='store_true', help='Regenerate existing files')
    p.add_argument('--voice', default='coral', help='OpenAI TTS voice')
    p.add_argument('--speed', type=float, default=0.9)
    args = p.parse_args()
    if not os.getenv('OPENAI_API_KEY'):
        raise SystemExit('OPENAI_API_KEY environment variable is missing.')
    client = OpenAI()
    data = json.loads((ROOT / 'data/lesson01.json').read_text(encoding='utf-8'))
    for item in [*data['sentences'], {'english':'\n'.join(s['english'] for s in data['sentences']), 'audio':data['fullAudio']}]:
        output = ROOT / item['audio']
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists() and not args.force:
            print('SKIP:', output.name)
            continue
        with client.audio.speech.with_streaming_response.create(
            model='gpt-4o-mini-tts', voice=args.voice,
            input=item['english'], response_format='mp3', speed=args.speed,
            instructions=('Read this meditative letter in a gentle, warm, thoughtful voice. '
                          'Use clear American English and natural pauses. Do not add any words.')
        ) as response:
            response.stream_to_file(output)
        print('CREATED:', output.relative_to(ROOT))

if __name__ == '__main__':
    main()
