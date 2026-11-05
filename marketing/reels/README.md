# WeeSubby reels

Vertical (9:16, 1080×1920) motion-graphics reels for Instagram Reels, TikTok and YouTube Shorts.

| File | Audience | Length |
| --- | --- | --- |
| `reel1-homeowners.html` | Homeowners: post a job free, pros come to you | 18s |
| `reel2-contractors.html` | Contractors: browse jobs, list free, go Pro | 18s |
| `reel3-how-it-works.html` | Both: the 3-step flow and pricing | 20s |

Suggested post captions and hashtags are in `captions.md`.

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
```

You can also open any reel in a browser and run `render(5)` in the console to see a single moment.

The MP4s include a silent audio track. Add music inside the social app, since licensed and trending sounds there also help reach.
