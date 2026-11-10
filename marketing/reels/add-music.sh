#!/bin/bash
# Adds a Mixkit soundtrack to each rendered reel listed in music.txt.
# Reads the silent render from out/<file> and writes out/music/<file>. The video stream is copied untouched.
# The track is trimmed from its start offset to the reel's length, faded in (0.15s) and out (last 2.5s),
# and normalized to -14 LUFS, the level Instagram, TikTok and YouTube play at.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p music out/music
grep -vE '^\s*(#|$)' music.txt | while read -r reel id start; do
  if [ ! -s "out/$reel" ]; then echo "skip $reel: render it to out/ first" >&2; continue; fi
  [ -s "music/$id.mp3" ] || curl -fsS -o "music/$id.mp3" "https://assets.mixkit.co/music/$id/$id.mp3"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$reel")
  fade_at=$(awk -v d="$dur" 'BEGIN { printf "%.2f", d - 2.5 }')
  ffmpeg -nostdin -loglevel error -y -i "out/$reel" -ss "$start" -t "$dur" -i "music/$id.mp3" \
    -filter_complex "[1:a]atrim=0:$dur,asetpts=N/SR/TB,afade=t=in:st=0:d=0.15,afade=t=out:st=$fade_at:d=2.5,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ac 2 -t "$dur" -movflags +faststart "out/music/$reel"
  echo "out/music/$reel <- Mixkit track $id from ${start}s"
done
