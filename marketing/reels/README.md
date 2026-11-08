# WeeSubby reels

Vertical (9:16, 1080×1920) reels for Instagram Reels, TikTok and YouTube Shorts: three motion-graphics reels and one cut from stock construction footage.

| File | Audience | Length |
| --- | --- | --- |
| `reel1-homeowners.html` | Homeowners: post a job free, pros come to you | 18s |
| `reel2-contractors.html` | Contractors: browse jobs, list free, go Pro | 18s |
| `reel3-how-it-works.html` | Both: the 3-step flow and pricing | 20s |
| `reel4-crew-footage.html` | Both: real crew footage with WeeSubby overlays | 25s |

There's also a landscape (16:9, 1920×1080) app walkthrough:

| File | Audience | Length |
| --- | --- | --- |
| `how-to-use-explainer.html` | Both: how to use every feature and why it helps, for YouTube, the website or onboarding | 104s |

It shows the app in a browser window, with an animated cursor and a caption panel for each step. Part 1 covers homeowners: signing up, finding pros, profiles and messages, posting a job, tracking it and leaving a review. Part 2 covers contractors: profile, availability, open jobs, going Pro and accepting a job. It sets `VIEWPORT = { width: 1920, height: 1080 }`, which `render.cjs` picks up.

#### Voice-over

The narrated version uses an [ElevenLabs](https://elevenlabs.io) voice (Adam).

- `voiceover-script.txt` has one line per section.
- `make-voiceover.py` generates `voiceover/<section>.mp3`. It needs an ElevenLabs API key in `ELEVENLABS_API_KEY`.
- The generated clips are committed, so you can rebuild the video without paying for the voice again.
- `voiceover-video.py timing` writes `explainer-timing.js`, which slows any section that's too short for its line. While that file exists, the page renders at voice-over timing (about 1:58). Delete it to render the original 1:44 cut.
- `voiceover-video.py mix` lays the lines over the render, with the music well under the voice.

```bash
python3 make-voiceover.py                 # only after editing the script; default voice is Adam
python3 voiceover-video.py timing
node render.cjs how-to-use-explainer.html out/WeeSubby-HowToUse-voice-silent.mp4
python3 voiceover-video.py mix out/WeeSubby-HowToUse-voice-silent.mp4 out/WeeSubby-HowToUse-voice.mp4
```

Suggested post captions and hashtags are in `captions.md`. For reel 4, the caption and the clip credits are in `reel4-footage-credits.md`.

## How it works

- Each reel is a plain HTML page. Its animation timeline is the `<script>` at the bottom of the page.
- `engine.js` is a small timeline engine. Calling `render(t)` sets every element to how it looks at time `t` (in seconds), so frames come out the same every time.
- Helper calls:
  - `a(selector, start, duration, { o, x, y, s, r }, ease)` animates opacity, position, scale and rotation.
  - `pop`, `rise`, `fade`, `leave` and `gone` are shorthands for common entrances and exits.
  - `typeText` types text out character by character.
- `base.css` holds the brand tokens (amber `#f59e0b`, navy `#0f172a`) and the shared pieces: the phone mockup, cards, toasts and buttons.
- The fonts (Bebas Neue and DM Sans, both under the SIL Open Font License) are bundled in `fonts/`, so rendering works offline.

## Rendering

Requires Node, [Playwright](https://playwright.dev) with Chromium, and `ffmpeg` on your PATH.

```bash
cd marketing/reels
npm i -D playwright && npx playwright install chromium   # one-time setup (adds Playwright to the repo devDependencies)

mkdir -p out stills
node render.cjs reel1-homeowners.html out/WeeSubby-Reel1-Homeowners.mp4      # 30fps H.264 MP4
node render.cjs reel1-homeowners.html stills/r1 30 --stills 2,8,15          # PNG stills for quick checks
node render.cjs how-to-use-explainer.html out/WeeSubby-HowToUse.mp4        # 16:9 walkthrough (~5 min to render)
```

### Reel 4 (footage)

Reel 4 is a transparent HTML overlay composited over stock clips from [Mixkit](https://mixkit.co), which are free for commercial use with no credit required.

- The clips are not stored in git. `build-footage.sh` downloads them, crops each to 9:16 and joins them into `footage/base.mp4`.
- `reel4-shots.txt` is the shot list. Each line gives a Mixkit clip ID, its start time, its duration and the horizontal crop position (0 is the left edge, 1 is the right).
- If you change shot lengths, update the cut times noted at the top of the script in `reel4-crew-footage.html` to match.

```bash
./build-footage.sh                                                             # needs curl + network access to assets.mixkit.co
node render-overlay.cjs reel4-crew-footage.html footage/base.mp4 out/WeeSubby-Reel4-Crew.mp4
node render-overlay.cjs reel4-crew-footage.html footage/base.mp4 stills/r4 30 --stills 1,8,14
```

You can also open any reel in a browser and run `render(5)` in the console to see a single moment.

### Music

The renders above have a silent audio track. `add-music.sh` adds a Mixkit soundtrack to each reel and writes the result to `out/music/`.

- `music.txt` lists the track and start offset for each reel. Tracks are from the [Mixkit free music library](https://mixkit.co/free-stock-music/) under the Mixkit Stock Music Free License: free for commercial use, no credit required.
- To change a reel's music, put a different Mixkit track ID in `music.txt`.
- To find a start offset for a new track, run `python3 find-music-start.py music/<id>.mp3:<reel seconds>`. It suggests a bar line after any quiet intro, and needs `pip install librosa`. The track must already be in `music/`, either from a previous `add-music.sh` run or downloaded by hand.

```bash
./add-music.sh            # needs curl + network access to assets.mixkit.co
```

To use a trending sound instead, post the silent file from `out/` and add the sound inside the app.
