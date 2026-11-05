// Deterministic timeline engine: window.render(t) sets every element's state for time t (seconds).
(function () {
  const E = {
    linear: x => x,
    out: x => 1 - Math.pow(1 - x, 3),
    in: x => x * x * x,
    inOut: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  const DEF = { o: 1, x: 0, y: 0, s: 1, r: 0, w: 1 };
  const tracks = new Map(); // el -> {prop -> [tween]}
  const hooks = [];
  // a(selector, start, dur, {o:[0,1], y:[60,0], ...}, ease)
  window.a = function (sel, start, dur, props, ease = 'out') {
    document.querySelectorAll(sel).forEach(el => {
      if (!tracks.has(el)) tracks.set(el, {});
      const tr = tracks.get(el);
      for (const k in props) (tr[k] = tr[k] || []).push({ start, dur, from: props[k][0], to: props[k][1], ease: E[ease] });
    });
  };
  // in/out helpers
  window.pop = (sel, t, d = .5, ease = 'back') => a(sel, t, d, { o: [0, 1], s: [.6, 1] }, ease);
  window.rise = (sel, t, d = .6, dist = 80) => a(sel, t, d, { o: [0, 1], y: [dist, 0] });
  window.fade = (sel, t, d = .4) => a(sel, t, d, { o: [0, 1] });
  window.leave = (sel, t, d = .35) => a(sel, t, d, { o: [1, 0], y: [0, -60] }, 'in');
  window.gone = (sel, t, d = .3) => a(sel, t, d, { o: [1, 0] }, 'in');
  window.typeText = (sel, t, cps = 22) => hooks.push(tt => {
    document.querySelectorAll(sel).forEach(el => {
      el.dataset.full = el.dataset.full ?? el.textContent;
      const n = Math.max(0, Math.floor((tt - t) * cps));
      const full = el.dataset.full;
      el.textContent = full.slice(0, n);
      el.classList.toggle('caret', tt > t && n < full.length);
    });
  });
  window.counter = (sel, t, d, from, to, fmt = v => Math.round(v)) => hooks.push(tt => {
    const p = Math.min(1, Math.max(0, (tt - t) / d));
    document.querySelectorAll(sel).forEach(el => (el.textContent = fmt(from + (to - from) * E.out(p))));
  });
  window.hook = fn => hooks.push(fn);
  function val(list, k, t) {
    let v = list[0].start > t ? list[0].from : DEF[k];
    for (const tw of list) {
      if (t < tw.start) break;
      const p = tw.dur <= 0 ? 1 : Math.min(1, (t - tw.start) / tw.dur);
      v = tw.from + (tw.to - tw.from) * tw.ease(p);
    }
    return v;
  }
  window.render = function (t) {
    for (const [el, tr] of tracks) {
      const g = k => (tr[k] ? val(tr[k].sort((p, q) => p.start - q.start), k, t) : DEF[k]);
      const o = g('o');
      el.style.opacity = o;
      el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
      el.style.transform = `translate(${g('x')}px, ${g('y')}px) scale(${g('s')}) rotate(${g('r')}deg)`;
      if (tr.w) el.style.setProperty('--w', g('w'));
    }
    hooks.forEach(h => h(t));
    document.documentElement.style.setProperty('--t', t);
  };
  window.DURATION = 18;
})();
