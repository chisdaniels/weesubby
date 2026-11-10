"""Generate the explainer voice-over with ElevenLabs, one MP3 per script line.

usage: python3 make-voiceover.py [voice_id]      (default: Adam, pNInz6obpgDQGcFmaJgB)
Reads voiceover-script.txt, writes voiceover/<segment>.mp3 and prints each line's length.
Needs an ElevenLabs API key in ELEVENLABS_API_KEY (or a proxy that injects the xi-api-key header).
"""
import json
import os
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
voice = sys.argv[1] if len(sys.argv) > 1 else 'pNInz6obpgDQGcFmaJgB'
lines = []
with open(os.path.join(HERE, 'voiceover-script.txt'), encoding='utf-8') as f:
    for raw in f:
        raw = raw.strip()
        if raw and not raw.startswith('#'):
            seg, text = raw.split('|', 1)
            lines.append((seg, text))
out_dir = os.path.join(HERE, 'voiceover')
os.makedirs(out_dir, exist_ok=True)
key = os.environ.get('ELEVENLABS_API_KEY', 'proxy-injected')
for i, (seg, text) in enumerate(lines):
    body = {
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.15},
        # neighbouring lines keep intonation consistent across separately generated clips
        'previous_text': lines[i - 1][1] if i else None,
        'next_text': lines[i + 1][1] if i + 1 < len(lines) else None,
    }
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',
        data=json.dumps(body).encode(), method='POST',
        headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    path = os.path.join(out_dir, f'{seg}.mp3')
    with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
        f.write(r.read())
    dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                         capture_output=True, text=True).stdout.strip()
    print(f'{seg}\t{float(dur):.2f}s')
