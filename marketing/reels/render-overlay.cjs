// Composite a transparent HTML overlay onto a base video.
// usage: node render-overlay.cjs overlay.html base.mp4 out.mp4 [fps] [--stills t1,t2,...]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
(async () => {
  const [html, base, out, fpsArg, stillsFlag, stillsArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(html));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const shot = () => page.screenshot({ type: 'png', omitBackground: true });
  if (stillsFlag === '--stills') {
    for (const t of stillsArg.split(',').map(Number)) {
      await page.evaluate(t => render(t), t);
      const png = `${out}-${t}-ov.png`;
      require('fs').writeFileSync(png, await shot());
      execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', '-ss', String(t), '-i', base, '-i', png,
        '-filter_complex', '[0][1]overlay', '-frames:v', '1', `${out}-${t}.png`]);
    }
    await browser.close(); return;
  }
  const dur = await page.evaluate(() => DURATION);
  const n = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-nostdin', '-y', '-loglevel', 'error', '-i', base,
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo',
    '-filter_complex', '[0:v][1:v]overlay=format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '2:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high',
    '-c:a', 'aac', '-t', String(dur), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => render(t), i / fps);
    const buf = await shot();
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out, n, 'frames');
})();
