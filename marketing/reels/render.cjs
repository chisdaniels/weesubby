// usage: node render.cjs page.html out.mp4 [fps] [--stills t1,t2,...]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [page_, out, fpsArg, stillsFlag, stillsArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(page_));
  const vpSize = await page.evaluate(() => window.VIEWPORT || null); // pages may set e.g. { width: 1920, height: 1080 }
  if (vpSize) await page.setViewportSize(vpSize);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (stillsFlag === '--stills') {
    for (const t of stillsArg.split(',').map(Number)) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: `${out}-${t}.png` });
    }
    await browser.close(); return;
  }
  const dur = await page.evaluate(() => DURATION);
  const n = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => render(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out, n, 'frames');
})();
