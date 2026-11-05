#!/bin/bash
# Builds footage/base.mp4 for reel4-crew-footage.html: downloads the Mixkit clips listed in
# reel4-shots.txt, crops each to 9:16 (1080x1920), and joins them with a 3.5s navy end-card slot.
# reel4-shots.txt columns: <mixkit id> <start sec> <duration sec> <horizontal crop position 0..1>
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p footage/src footage/seg
: > footage/list.txt
n=0
while read -r id ss d xf; do
  [ -z "$id" ] && continue
  if [ ! -s "footage/src/$id.mp4" ]; then
    # Use 1080p when Mixkit offers it for free, otherwise 720p.
    for r in 1080 720 fail; do
      [ "$r" = fail ] && { echo "could not download Mixkit clip $id" >&2; exit 1; }
      if curl -fs -o "footage/src/$id.mp4" "https://assets.mixkit.co/videos/$id/$id-$r.mp4"; then break; fi
    done
  fi
  n=$((n+1))
  ffmpeg -nostdin -loglevel error -y -ss "$ss" -i "footage/src/$id.mp4" -t "$d" -an \
    -vf "crop=ih*9/16:ih:(iw-ih*9/16)*$xf:0,scale=1080:1920:flags=lanczos,fps=30,eq=contrast=1.08:saturation=1.1,unsharp=5:5:0.6,format=yuv420p" \
    -c:v libx264 -crf 16 -preset fast "footage/seg/$n.mp4"
  echo "file 'seg/$n.mp4'" >> footage/list.txt
done < reel4-shots.txt
ffmpeg -nostdin -loglevel error -y -f lavfi -i color=c=0x0f172a:s=1080x1920:r=30:d=3.5 \
  -c:v libx264 -crf 16 -pix_fmt yuv420p footage/seg/end.mp4
echo "file 'seg/end.mp4'" >> footage/list.txt
ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i footage/list.txt -c copy footage/base.mp4
echo "wrote footage/base.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 footage/base.mp4)s)"
