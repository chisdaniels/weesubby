"""Suggest a start offset for a music track: the first bar line where the track has reached its
typical loudness (so a reel doesn't open on a quiet intro) with enough music left for the reel.

usage: python3 find-music-start.py music/158.mp3:18 music/49.mp3:18   (track path:reel length in seconds)
needs: pip install librosa
"""
import sys

import librosa
import numpy as np

for arg in sys.argv[1:]:
    path, need = arg.rsplit(':', 1)
    need = float(need)
    y, sr = librosa.load(path, sr=22050, mono=True)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    t = librosa.times_like(rms, sr=sr, hop_length=512)
    db = 20 * np.log10(rms + 1e-9)
    med = np.median(db)
    win = int(2 * sr / 512)  # 2-second smoothing window
    smooth = np.convolve(db, np.ones(win) / win, mode='same')
    start = None
    for i, b in enumerate(beats):
        if i % 4:  # treat every 4th beat as a bar line
            continue
        if b + need > dur - 1:
            break
        seg = (t >= b) & (t < b + need)
        if smooth[np.searchsorted(t, b)] >= med - 1.5 and np.mean(db[seg]) >= med - 1:
            start = round(float(b), 2)
            break
    print(f"{path}: {dur:.1f}s, {float(np.atleast_1d(tempo)[0]):.0f} BPM, suggested start: {start}")
