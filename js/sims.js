/* Fizpraktikum — virtual laboratoriya modellari.
   Har bir model HTML’da <div class="sim-box" data-sim="KALIT"></div> ko‘rinishida chaqiriladi.
   Modellar o‘quv maqsadida soddalashtirilgan; “asbob ko‘rsatishi” deb belgilangan qiymatlarga kichik tasodifiy shovqin qo‘shilgan. */
(() => {
  'use strict';
  const q = 1.602e-19, kB = 8.617e-5, eps0 = 8.854e-14, epsSi = 11.7 * eps0, epsOx = 3.9 * eps0;
  const Vt = T => kB * T;
  const A = s => (window.YAF_ALIF ? window.YAF_ALIF.A(s) : String(s));
  const C = { cyan:'#22d3ee', green:'#34d399', amber:'#fbbf24', rose:'#fb7185', violet:'#a78bfa', blue:'#60a5fa', grid:'#1e2c44', axis:'#64748b', text:'#cbd5e1' };
  const SUP = { '-':'⁻', '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
  const sci = (v, d = 2) => {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -2 && e <= 3) return v.toFixed(Math.max(0, d - (e > 0 ? e : 0)));
    const m = v / 10 ** e;
    return `${m.toFixed(d)}·10${String(e).split('').map(ch => SUP[ch]).join('')}`;
  };
  const fx = (v, d = 3) => (isFinite(v) ? Number(v).toFixed(d) : '—');

  function ctx2d(canvas) {
    const r = canvas.getBoundingClientRect();
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const dpr = Math.min((window.devicePixelRatio || 1) * zoom, 4);
    const w = Math.max(1, Math.floor(canvas.clientWidth || r.width)), h = Math.max(1, Math.floor(canvas.clientHeight || r.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    return { c, w, h };
  }

  function niceTicks(a, b, n = 5) {
    const span = b - a; if (span <= 0) return [a];
    const raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => span / s <= n + .5) || mag * 10;
    const out = []; for (let t = Math.ceil(a / step) * step; t <= b + step * 1e-6; t += step) out.push(+t.toPrecision(10));
    return out;
  }

  /* Umumiy grafik chizuvchi */
  function plot(c, box, o) {
    const [X0, Y0, W, H] = box, L = 54, R = 12, T = 22, B = 36;
    const px = X0 + L, py = Y0 + T, pw = W - L - R, ph = H - T - B;
    const tx = v => (o.logx ? Math.log10(v) : v), ty = v => (o.logy ? Math.log10(Math.max(v, 1e-300)) : v);
    const [xa, xb] = o.xr.map(tx), [ya, yb] = o.yr.map(ty);
    const X = v => px + (tx(v) - xa) / (xb - xa) * pw;
    const Y = v => py + ph - (ty(v) - ya) / (yb - ya) * ph;
    c.save(); c.font = '11px JetBrains Mono, monospace'; c.lineWidth = 1;
    const xt = o.logx ? range(Math.ceil(xa), Math.floor(xb)).map(e => 10 ** e) : niceTicks(o.xr[0], o.xr[1], o.nx || 6);
    const yt = o.logy ? range(Math.ceil(ya), Math.floor(yb)).filter((e, i, arr) => arr.length < 9 || i % 2 === 0).map(e => 10 ** e) : niceTicks(o.yr[0], o.yr[1], o.ny || 5);
    c.strokeStyle = C.grid; c.fillStyle = C.axis; c.textAlign = 'center';
    xt.forEach(t => { const x = X(t); c.beginPath(); c.moveTo(x, py); c.lineTo(x, py + ph); c.stroke(); c.fillText(o.logx ? sci(t, 0) : fmtTick(t), x, py + ph + 15); });
    c.textAlign = 'right';
    yt.forEach(t => { const y = Y(t); c.beginPath(); c.moveTo(px, y); c.lineTo(px + pw, y); c.stroke(); c.fillText(o.logy ? sci(t, 0) : fmtTick(t), px - 6, y + 4); });
    c.strokeStyle = C.axis; c.strokeRect(px, py, pw, ph);
    if (!o.logy && o.yr[0] < 0 && o.yr[1] > 0) { c.strokeStyle = '#475569'; c.beginPath(); c.moveTo(px, Y(0)); c.lineTo(px + pw, Y(0)); c.stroke(); }
    if (!o.logx && o.xr[0] < 0 && o.xr[1] > 0) { c.strokeStyle = '#475569'; c.beginPath(); c.moveTo(X(0), py); c.lineTo(X(0), py + ph); c.stroke(); }
    c.fillStyle = C.text; c.textAlign = 'center'; c.fillText(A(o.xl || ''), px + pw / 2, py + ph + 30);
    c.textAlign = 'left'; c.fillText(A(o.yl || ''), px, py - 8);
    c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    (o.fill || []).forEach(f => { c.fillStyle = f.c; c.beginPath(); f.pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.closePath(); c.fill(); });
    (o.series || []).forEach(s => {
      c.strokeStyle = s.c || C.cyan; c.lineWidth = s.w || 2; c.setLineDash(s.dash || []); c.beginPath(); let started = false;
      s.pts.forEach(([x, y]) => { if (!isFinite(y) || !isFinite(x) || (o.logy && y <= 0) || (o.logx && x <= 0)) { started = false; return; } const xx = X(x), yy = Y(y); if (!started) { c.moveTo(xx, yy); started = true; } else c.lineTo(xx, yy); });
      c.stroke(); c.setLineDash([]);
    });
    (o.vl || []).forEach(v => { c.strokeStyle = v.c || C.amber; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(X(v.x), py); c.lineTo(X(v.x), py + ph); c.stroke(); c.setLineDash([]); if (v.l) { c.fillStyle = v.c || C.amber; c.fillText(A(v.l), X(v.x) + 4, py + 12); } });
    (o.hl || []).forEach(v => { c.strokeStyle = v.c || C.amber; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(px, Y(v.y)); c.lineTo(px + pw, Y(v.y)); c.stroke(); c.setLineDash([]); if (v.l) { c.fillStyle = v.c || C.amber; c.fillText(A(v.l), px + 6, Y(v.y) - 5); } });
    (o.marks || []).forEach(m => { c.fillStyle = m.c || '#fff'; c.beginPath(); c.arc(X(m.x), Y(m.y), m.r || 5, 0, 7); c.fill(); if (m.l) { c.fillText(A(m.l), X(m.x) + 8, Y(m.y) - 8); } });
    c.restore();
    if ((o.legend || []).length) { c.fillStyle = 'rgba(3,7,18,.82)'; c.fillRect(px + pw - 156, py + 2, 152, o.legend.length * 16 + 8); }
    (o.legend || []).forEach((g, i) => { c.font = '11px Inter, sans-serif'; c.fillStyle = g.c; c.fillRect(px + pw - 150, py + 8 + i * 16, 12, 3); c.fillStyle = C.text; c.textAlign = 'left'; c.fillText(A(g.l), px + pw - 133, py + 13 + i * 16); });
    return { X, Y };
  }
  const fmtTick = t => (Math.abs(t) >= 1000 || (Math.abs(t) < .01 && t !== 0) ? sci(t, 1) : String(+t.toFixed(3)));
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  const label = (c, t, x, y, col = C.text, al = 'left') => { c.fillStyle = col; c.font = '12px Inter, sans-serif'; c.textAlign = al; c.fillText(A(t), x, y); };

  /* ---------- Fizpraktikum: umumiy yordamchilar ---------- */
  const e0 = 8.854e-12, mu0 = 4 * Math.PI * 1e-7, gAcc = 9.81, FARADAY = 96485;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const noisy = (v, rel = .005) => v * (1 + rel * (Math.random() * 2 - 1));
  const ln = (c, x1, y1, x2, y2, col = C.text, w = 1.5, dash) => { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]); };
  const arrow = (c, x1, y1, x2, y2, col = C.amber, w = 2) => { ln(c, x1, y1, x2, y2, col, w); const a = Math.atan2(y2 - y1, x2 - x1), s = 8; c.fillStyle = col; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - s * Math.cos(a - .4), y2 - s * Math.sin(a - .4)); c.lineTo(x2 - s * Math.cos(a + .4), y2 - s * Math.sin(a + .4)); c.closePath(); c.fill(); };
  const box = (c, x, y, w, h, col = '#334155', fill) => { if (fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); } c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(x, y, w, h); };
  const circ = (c, x, y, r, col = C.text, fill) => { c.beginPath(); c.arc(x, y, r, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); };
  const txt = (c, t, x, y, col = C.text, al = 'center', size = 12) => { c.fillStyle = col; c.font = `${size}px Inter, sans-serif`; c.textAlign = al; c.fillText(A(t), x, y); };
  // vertikal rezistor (zigzag) va manba belgisi
  const resV = (c, x, y1, y2, col = C.text) => { const n = 6, h = (y2 - y1) * .6, y0 = y1 + (y2 - y1) * .2; ln(c, x, y1, x, y0, col); c.beginPath(); c.moveTo(x, y0); for (let i = 1; i <= n; i++) c.lineTo(x + (i % 2 ? 7 : -7), y0 + h * (i - .5) / n); c.lineTo(x, y0 + h); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); ln(c, x, y0 + h, x, y2, col); };
  const battV = (c, x, y, col = C.text) => { ln(c, x - 12, y - 4, x + 12, y - 4, col, 2.5); ln(c, x - 6, y + 4, x + 6, y + 4, col, 2.5); };
  // to'lqin uzunligi → RGB rang
  const wlRGB = (wl, a = 1) => {
    let r = 0, g = 0, b = 0;
    if (wl < 440) { r = -(wl - 440) / 60; b = 1; } else if (wl < 490) { g = (wl - 440) / 50; b = 1; } else if (wl < 510) { g = 1; b = -(wl - 510) / 20; } else if (wl < 580) { r = (wl - 510) / 70; g = 1; } else if (wl < 645) { r = 1; g = -(wl - 645) / 65; } else r = 1;
    let f = wl < 420 ? .3 + .7 * (wl - 380) / 40 : wl > 700 ? .3 + .7 * (780 - wl) / 80 : 1; f = Math.max(0, f);
    return `rgba(${Math.round(255 * r * f)},${Math.round(255 * g * f)},${Math.round(255 * b * f)},${a})`;
  };
  const S = {};

  /* 1 — Elektrostatika: yassi kondensator va elektrometr */
  S.estat = {
    title: 'Yassi kondensator va elektrometrik kuchaytirgich',
    params: [
      { k: 'Q', l: 'Zaryad q, nKl', min: 1, max: 50, step: 1, v: 10 },
      { k: 'd', l: 'Plastinalar orasidagi masofa d, mm', min: 1, max: 20, step: .5, v: 5 },
      { k: 'a', l: 'Plastina tomoni a, sm', min: 10, max: 30, step: 1, v: 20 },
      { k: 'eps', l: 'Dielektrik singdiruvchanlik ε', min: 1, max: 8, step: .5, v: 1 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), S0 = (P.a / 100) ** 2, d = P.d / 1000, Cc = P.eps * e0 * S0 / d, U = P.Q * 1e-9 / Cc;
      const bx = 30, bw = w * .38, cy = h / 2, gap = 20 + P.d * 6, pl = bw * .8;
      if (P.eps > 1) { c.fillStyle = `rgba(56,189,248,${Math.min(.08 * P.eps, .5)})`; c.fillRect(bx + 10, cy - gap / 2, pl, gap); }
      ln(c, bx + 10, cy - gap / 2, bx + 10 + pl, cy - gap / 2, C.rose, 5); ln(c, bx + 10, cy + gap / 2, bx + 10 + pl, cy + gap / 2, C.blue, 5);
      txt(c, '+q', bx + 10 + pl + 16, cy - gap / 2 + 4, C.rose); txt(c, '−q', bx + 10 + pl + 16, cy + gap / 2 + 4, C.blue);
      const nl = Math.max(2, Math.round(P.Q / 4));
      for (let i = 0; i < nl; i++) { const x = bx + 18 + i * (pl - 16) / (nl - 1 || 1); arrow(c, x, cy - gap / 2 + 4, x, cy + gap / 2 - 4, 'rgba(251,191,36,.7)', 1.2); }
      // elektrometr shkalasi
      const mx = bx + bw / 2, my = h - 34, rr = 46, frac = Math.min(U / 300, 1);
      c.strokeStyle = '#475569'; c.lineWidth = 2; c.beginPath(); c.arc(mx, my, rr, Math.PI, 0); c.stroke();
      const ang = Math.PI + frac * Math.PI; arrow(c, mx, my, mx + rr * .9 * Math.cos(ang), my + rr * .9 * Math.sin(ang), C.green, 2);
      txt(c, `U = ${fx(U, 1)} V`, mx, my + 16, C.green);
      const ds = lin(1, 20, 60);
      plot(c, [w * .42, 0, w * .58, h], { xr: [0, 20], yr: [0, Math.max(50, P.Q * 1e-9 * 0.02 / (e0 * S0) * 1.05)], xl: 'd, mm', yl: 'U, V (q = const)', series: [{ pts: ds.map(x => [x, P.Q * 1e-9 * x / 1000 / (P.eps * e0 * S0)]), c: C.cyan, w: 2.5 }], marks: [{ x: P.d, y: U, c: C.green }] });
      return { 'C, pF': fx(Cc * 1e12, 1), 'U = q/C, V': fx(U, 1), 'E = U/d, kV/m': fx(U / d / 1000, 2), 'W = q²/2C, mkJ': fx((P.Q * 1e-9) ** 2 / (2 * Cc) * 1e6, 3) };
    }
  };

  /* 2 — RC zanjir */
  S.rc = {
    title: 'Kondensatorning zaryadlanishi va razryadlanishi',
    params: [
      { k: 'R', l: 'Qarshilik R, kOm', min: 10, max: 200, step: 5, v: 100 },
      { k: 'C', l: 'Sig‘im C, mkF', min: 50, max: 1000, step: 10, v: 500 },
      { k: 'U0', l: 'Manba kuchlanishi U₀, V', min: 1, max: 12, step: .5, v: 10 },
      { k: 'mode', l: 'Jarayon', type: 'sel', opts: ['Razryadlanish', 'Zaryadlanish'], v: 'Razryadlanish' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), tau = P.R * 1e3 * P.C * 1e-6, dis = P.mode === 'Razryadlanish';
      const f = t => dis ? P.U0 * Math.exp(-t / tau) : P.U0 * (1 - Math.exp(-t / tau));
      const T = 5 * tau, ts = lin(0, T, 200);
      plot(c, [0, 0, w, h], { xr: [0, T], yr: [0, P.U0 * 1.08], xl: 't, s', yl: 'U_C, V', series: [{ pts: ts.map(t => [t, f(t)]), c: C.cyan, w: 2.5 }], vl: [{ x: tau, l: 't = τ', c: C.amber }, { x: tau * Math.LN2, l: 't½', c: C.violet }], hl: [{ y: f(tau), l: dis ? '0,37 U₀' : '0,63 U₀', c: C.green }], marks: [{ x: tau, y: f(tau), c: C.green }] });
      return { 'τ = RC, s': fx(tau, 2), 't½ = τ·ln2, s': fx(tau * Math.LN2, 2), 'U(τ), V': fx(f(tau), 2), 'W = CU₀²/2, mJ': fx(P.C * 1e-6 * P.U0 ** 2 / 2 * 1e3, 2), '5τ dan keyin, %': fx(dis ? Math.exp(-5) * 100 : (1 - Math.exp(-5)) * 100, 1) };
    }
  };

  /* 3 — Om qonuni va ulash sxemalari */
  const RHO = { 'Nixrom': 1.1e-6, 'Nikelin': 4.2e-7, 'Konstantan': 5.0e-7, 'Mis': 1.7e-8 };
  S.ohm = {
    title: 'Om qonuni: ampermetr–voltmetr usuli',
    params: [
      { k: 'mat', l: 'Sim materiali', type: 'sel', opts: Object.keys(RHO), v: 'Nixrom' },
      { k: 'l', l: 'Uzunlik l, m', min: .1, max: 1, step: .05, v: 1 },
      { k: 'dd', l: 'Diametr d, mm', min: .1, max: 1, step: .01, v: .3 },
      { k: 'I', l: 'Ampermetr ko‘rsatishi I, A', min: .05, max: 1, step: .01, v: .2 },
      { k: 'sx', l: 'Sxema', type: 'sel', opts: ['Voltmetr ichkarida', 'Ampermetr ichkarida'], v: 'Voltmetr ichkarida' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), RA = .5, RV = 1e4, S0 = Math.PI * (P.dd * 1e-3) ** 2 / 4, R = RHO[P.mat] * P.l / S0;
      const Rm = P.sx === 'Voltmetr ichkarida' ? R * RV / (R + RV) : R + RA;
      const U = noisy(P.I * Rm, .004), I = noisy(P.I, .004), Is = lin(0, 1, 50);
      plot(c, [0, 0, w, h], { xr: [0, 1], yr: [0, Math.max(R, Rm) * 1.1], xl: 'I, A', yl: 'U, V', series: [{ pts: Is.map(i => [i, i * R]), c: '#64748b', dash: [6, 4] }, { pts: Is.map(i => [i, i * Rm]), c: C.cyan, w: 2.5 }], marks: [{ x: I, y: U, c: C.green }], legend: [{ c: '#64748b', l: 'haqiqiy R' }, { c: C.cyan, l: 'o‘lchanadigan' }] });
      return { 'Haqiqiy R, Om': fx(R, 3), 'Voltmetr U, V': fx(U, 3), 'R_o‘l = U/I, Om': fx(U / I, 3), 'Metodik xato, %': fx((Rm - R) / R * 100, 2), 'ρ (o‘lchangan), Om·m': sci(U / I * S0 / P.l), '√(R_A·R_V), Om': fx(Math.sqrt(RA * RV), 1) };
    }
  };

  /* 4 — Uitston ko'prigi */
  S.bridge = {
    title: 'Reoxordli Uitston ko‘prigi',
    params: [
      { k: 'Rx', l: 'Noma’lum qarshilik Rₓ, Om', min: 10, max: 200, step: 1, v: 83 },
      { k: 'R0', l: 'Magazin R₀, Om', min: 10, max: 200, step: 1, v: 50 },
      { k: 'x', l: 'Sirpang‘ich holati l₁, sm', min: 1, max: 99, step: .1, v: 50 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), E = 2, Rg = 100, Rw = 5;
      const Ig = x => { const a = Rw * x / 100, b = Rw - a, V1 = E * P.Rx / (P.R0 + P.Rx), V2 = E * a / Rw, Rth = P.R0 * P.Rx / (P.R0 + P.Rx) + a * b / Rw; return (V1 - V2) / (Rth + Rg) * 1e6; };
      const ig = Ig(P.x), xb = 100 * P.Rx / (P.R0 + P.Rx), xs = lin(1, 99, 200);
      // galvanometr
      const gx = w * .17, gy = h * .55, gr = Math.min(60, w * .13), ang = -Math.PI / 2 + Math.tanh(ig / 800) * 1.2;
      c.strokeStyle = '#475569'; c.lineWidth = 2; c.beginPath(); c.arc(gx, gy, gr, -Math.PI * .85, -Math.PI * .15); c.stroke();
      ln(c, gx, gy - gr, gx, gy - gr + 8, C.text, 2); arrow(c, gx, gy, gx + gr * .95 * Math.cos(ang), gy + gr * .95 * Math.sin(ang), Math.abs(ig) < 5 ? C.green : C.rose, 2.5);
      txt(c, 'G', gx, gy + 18, C.text, 'center', 14); txt(c, `I_g = ${fx(ig, 1)} mkA`, gx, gy + 38, Math.abs(ig) < 5 ? C.green : C.rose);
      // reoxord
      const rx0 = 20, rx1 = w * .34, ry = h - 30; ln(c, rx0, ry, rx1, ry, '#94a3b8', 3);
      const sx = rx0 + (rx1 - rx0) * P.x / 100; arrow(c, sx, ry - 24, sx, ry - 3, C.amber, 2); txt(c, `l₁ = ${fx(P.x, 1)} sm`, sx, ry - 28, C.amber);
      plot(c, [w * .38, 0, w * .62, h], { xr: [0, 100], yr: [-Math.max(...xs.map(x => Math.abs(Ig(x)))), Math.max(...xs.map(x => Math.abs(Ig(x))))], xl: 'l₁, sm', yl: 'I_g, mkA', series: [{ pts: xs.map(x => [x, Ig(x)]), c: C.cyan, w: 2.5 }], vl: [{ x: xb, l: 'muvozanat', c: C.green }], marks: [{ x: P.x, y: ig, c: C.amber }] });
      return { 'Galvanometr toki, mkA': fx(ig, 2), 'Muvozanat l₁, sm': fx(xb, 1), 'Rₓ = R₀·l₁/l₂ (joriy holat), Om': fx(P.R0 * P.x / (100 - P.x), 2), 'Nisbiy xato (Δl = 1 mm), %': fx(100 * .1 / (P.x * (100 - P.x)) * 100, 2) };
    }
  };

  /* 5 — Shunt va qo'shimcha qarshilik */
  S.meter = {
    title: 'O‘lchash chegarasini kengaytirish',
    params: [
      { k: 'mode', l: 'Asbob', type: 'sel', opts: ['Ampermetr (shunt)', 'Voltmetr (qo‘shimcha qarshilik)'], v: 'Ampermetr (shunt)' },
      { k: 'Ig', l: 'Galvanometr toki I_g, mA', min: .1, max: 5, step: .1, v: 1 },
      { k: 'Rg', l: 'Galvanometr qarshiligi R_g, Om', min: 10, max: 1000, step: 10, v: 100 },
      { k: 'n', l: 'Chegarani oshirish n, marta', min: 2, max: 1000, step: 1, v: 10 },
      { k: 'dev', l: 'O‘rnatilgan qarshilik xatosi, %', min: -10, max: 10, step: .5, v: 0 },
      { k: 'X', l: 'O‘lchanayotgan kattalik (chegaradan ulush)', min: 0, max: 1, step: .01, v: .6 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), amm = P.mode.startsWith('Amp'), Ig = P.Ig / 1000, k = 1 + P.dev / 100;
      let Rcalc, lim, reading, unit, Rtot;
      if (amm) { Rcalc = P.Rg / (P.n - 1); const Rsh = Rcalc * k; lim = P.n * Ig; const I = P.X * lim, ig = I * Rsh / (Rsh + P.Rg); reading = ig / Ig * lim; unit = 'A'; Rtot = Rsh * P.Rg / (Rsh + P.Rg); }
      else { Rcalc = P.Rg * (P.n - 1); const Rq = Rcalc * k; lim = P.n * Ig * P.Rg; const U = P.X * lim, ig = U / (P.Rg + Rq); reading = ig / Ig * lim; unit = 'V'; Rtot = P.Rg + Rq; }
      const cx = w / 2, cy = h * .78, r = Math.min(w * .38, h * .62), fr = Math.min(reading / lim, 1.05);
      c.strokeStyle = '#475569'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      for (let i = 0; i <= 10; i++) { const a = Math.PI * 1.15 + i / 10 * Math.PI * .7; ln(c, cx + r * Math.cos(a), cy + r * Math.sin(a), cx + (r - (i % 5 ? 8 : 16)) * Math.cos(a), cy + (r - (i % 5 ? 8 : 16)) * Math.sin(a), C.text, 1.5); if (i % 5 === 0) txt(c, fmtTick(lim * i / 10), cx + (r - 30) * Math.cos(a), cy + (r - 30) * Math.sin(a) + 4, C.axis); }
      const a = Math.PI * 1.15 + fr * Math.PI * .7; arrow(c, cx, cy, cx + (r - 4) * Math.cos(a), cy + (r - 4) * Math.sin(a), C.green, 2.5); circ(c, cx, cy, 5, C.text, C.text);
      txt(c, amm ? 'A' : 'V', cx, cy - r * .35, C.text, 'center', 22);
      return { [amm ? 'Hisoblangan shunt R_sh, Om' : 'Hisoblangan R_q, Om']: amm ? fx(Rcalc, 4) : fx(Rcalc, 0), 'Yangi chegara': `${fmtTick(lim)} ${unit}`, [amm ? 'Ampermetr qarshiligi, Om' : 'Voltmetr qarshiligi, Om']: amm ? fx(Rtot, 4) : fx(Rtot, 0), 'Haqiqiy qiymat': `${fx(P.X * lim, 4)} ${unit}`, 'Asbob ko‘rsatishi': `${fx(reading, 4)} ${unit}`, 'Xatolik, %': fx((reading / (P.X * lim || 1) - 1) * 100, 2) };
    }
  };

  /* 6 — Kirxgoff qoidalari */
  S.kirch = {
    title: 'Ikki manbali tarmoqlangan zanjir',
    params: [
      { k: 'E1', l: 'EYuK 𝓔₁, V', min: 1, max: 20, step: .5, v: 12 },
      { k: 'E2', l: 'EYuK 𝓔₂, V', min: 1, max: 20, step: .5, v: 6 },
      { k: 'R1', l: 'R₁, Om', min: 1, max: 100, step: 1, v: 10 },
      { k: 'R2', l: 'R₂, Om', min: 1, max: 100, step: 1, v: 20 },
      { k: 'R3', l: 'R₃, Om', min: 1, max: 100, step: 1, v: 30 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), U3 = (P.E1 / P.R1 + P.E2 / P.R2) / (1 / P.R1 + 1 / P.R2 + 1 / P.R3);
      const I1 = (P.E1 - U3) / P.R1, I2 = (P.E2 - U3) / P.R2, I3 = U3 / P.R3;
      const x1 = w * .2, x2 = w * .5, x3 = w * .8, yt = 40, yb = h - 40;
      ln(c, x1, yt, x3, yt); ln(c, x1, yb, x3, yb);
      [[x1, P.E1, P.R1, I1, '𝓔₁', 'R₁', 'I₁'], [x3, P.E2, P.R2, I2, '𝓔₂', 'R₂', 'I₂']].forEach(([x, E, R, I, en, rn, iname]) => {
        resV(c, x, yt, (yt + yb) / 2 - 10); ln(c, x, (yt + yb) / 2 - 10, x, yb - 40 - 4); battV(c, x, yb - 40); ln(c, x, yb - 36, x, yb);
        txt(c, `${rn} = ${R} Om`, x + 14, (yt + yb) / 4 + 20, C.text, 'left'); txt(c, `${en} = ${E} V`, x + 16, yb - 36, C.rose, 'left');
        const up = I >= 0; arrow(c, x - 18, up ? yb - 70 : yb - 110, x - 18, up ? yb - 110 : yb - 70, up ? C.green : C.amber); txt(c, `${iname} = ${fx(I, 3)} A`, x - 24, yb - 120, up ? C.green : C.amber, 'right');
      });
      resV(c, x2, yt, yb); txt(c, `R₃ = ${P.R3} Om`, x2 + 14, (yt + yb) / 2, C.text, 'left');
      arrow(c, x2 - 18, (yt + yb) / 2 - 30, x2 - 18, (yt + yb) / 2 + 10, C.cyan); txt(c, `I₃ = ${fx(I3, 3)} A`, x2 - 24, (yt + yb) / 2 - 36, C.cyan, 'right');
      circ(c, x2, yt, 4, C.text, C.text); circ(c, x2, yb, 4, C.text, C.text);
      return { 'I₁, A': fx(I1, 4), 'I₂, A': fx(I2, 4), 'I₃, A': fx(I3, 4), 'Tugun: I₁ + I₂ − I₃': fx(I1 + I2 - I3, 6), '1-kontur: 𝓔₁ − I₁R₁ − I₃R₃': fx(P.E1 - I1 * P.R1 - I3 * P.R3, 6), 'Quvvat: ΣℰI = ΣI²R, W': `${fx(P.E1 * I1 + P.E2 * I2, 3)} = ${fx(I1 * I1 * P.R1 + I2 * I2 * P.R2 + I3 * I3 * P.R3, 3)}` };
    }
  };

  /* 7 — Isitgich FIK */
  S.heater = {
    title: 'Elektr isitgich: harorat va FIK',
    params: [
      { k: 'P', l: 'Iste’mol quvvati P = UI, W', min: 300, max: 2500, step: 10, v: 1960 },
      { k: 'm', l: 'Suv massasi m, kg', min: .3, max: 2, step: .05, v: 1 },
      { k: 'k', l: 'Issiqlik yo‘qotish koeffitsiyenti k, W/K', min: 0, max: 10, step: .5, v: 3 },
      { k: 'Ch', l: 'Idish va qizdirgich sig‘imi, J/K', min: 0, max: 1500, step: 50, v: 450 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), cw = 4190, T0 = 20, Ctot = cw * P.m + P.Ch, pts = [], eta = [];
      let T = T0, t = 0, t90 = null; const dt = 1;
      while (t < 1800 && T < 100) { T += (P.P - P.k * (T - T0)) / Ctot * dt; t += dt; if (t % 5 === 0) { pts.push([t, T]); eta.push([t, cw * P.m * (T - T0) / (P.P * t) * 100]); } if (t90 === null && T >= 90) t90 = t; }
      const tm = Math.max(60, t);
      plot(c, [0, 0, w * .5, h], { xr: [0, tm], yr: [15, 102], xl: 't, s', yl: 'T, °C', series: [{ pts, c: C.rose, w: 2.5 }], hl: [{ y: 90, l: '90 °C' }], vl: t90 ? [{ x: t90, c: C.green }] : [] });
      plot(c, [w * .51, 0, w * .49, h], { xr: [0, tm], yr: [0, 100], xl: 't, s', yl: 'η(t), %', series: [{ pts: eta, c: C.cyan, w: 2.5 }] });
      const e90 = t90 ? cw * P.m * 70 / (P.P * t90) * 100 : NaN;
      return { '90 °C gacha vaqt, s': t90 ? fx(t90, 0) : '—', 'η (20→90 °C), %': fx(e90, 1), 'Boshlang‘ich FIK cm/(cm+C_id), %': fx(cw * P.m / Ctot * 100, 1), 'Isrof 90 °C da, W': fx(P.k * 70, 0) };
    }
  };

  /* 8 — Vakuumli diod */
  S.vdiode = {
    title: 'Vakuumli diod VAX',
    params: [
      { k: 'T', l: 'Katod harorati T, K', min: 2000, max: 2600, step: 10, v: 2400 },
      { k: 'B', l: 'Geometrik koeffitsiyent B, mA/V^1,5', min: .01, max: .1, step: .001, v: .045 },
      { k: 'sc', l: 'Shkala', type: 'sel', opts: ['Chiziqli', 'Log–log'], v: 'Chiziqli' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), Is = 60 * .1 * P.T * P.T * Math.exp(-4.54 / (kB * P.T)) * 1e3;
      const I = U => { const a = P.B * U ** 1.5; return U <= 0 ? 0 : 1 / (a ** -4 + Is ** -4) ** .25; };
      const ll = P.sc === 'Log–log', Us = ll ? lin(0, 2.3, 200).map(e => 10 ** e) : lin(0, 150, 300);
      const Uref = 2400;
      plot(c, [0, 0, w, h], ll ? { xr: [1, 200], yr: [1e-2, 200], logx: true, logy: true, xl: 'U_a, V', yl: 'I_a, mA', series: [{ pts: Us.map(u => [u, I(u)]), c: C.cyan, w: 2.5 }, { pts: Us.map(u => [u, P.B * u ** 1.5]), c: '#64748b', dash: [5, 4] }], legend: [{ c: C.cyan, l: 'I_a(U_a)' }, { c: '#64748b', l: 'BU^{3/2}' }] }
        : { xr: [0, 150], yr: [0, Math.max(Is * 1.15, 5)], xl: 'U_a, V', yl: 'I_a, mA', series: [{ pts: Us.map(u => [u, I(u)]), c: C.cyan, w: 2.5 }], hl: [{ y: Is, l: 'I_s (to‘yinish)', c: C.amber }] });
      return { 'To‘yinish toki I_s, mA': fx(Is, 2), 'To‘yinish kuchlanishi ≈ (I_s/B)^{2/3}, V': fx((Is / P.B) ** (2 / 3), 1), 'I_a(50 V), mA': fx(I(50), 2), 'Daraja ko‘rsatkichi (10–20 V)': fx(Math.log(I(20) / I(10)) / Math.log(2), 3), 'I_s(T)/I_s(2400 K)': fx(Is / (60 * .1 * Uref * Uref * Math.exp(-4.54 / (kB * Uref)) * 1e3), 2) };
    }
  };

  /* 9 — Amper kuchi */
  S.ampere = {
    title: 'Amper kuchi: tarozi usuli',
    params: [
      { k: 'B', l: 'Magnit induksiyasi B, Tl', min: .05, max: .5, step: .01, v: .2 },
      { k: 'I', l: 'Tok I, A', min: -5, max: 5, step: .1, v: 2 },
      { k: 'l', l: 'O‘tkazgich uzunligi l, sm', min: 1, max: 8, step: 1, v: 4 },
      { k: 'al', l: 'Burchak α, °', min: 0, max: 90, step: 1, v: 90 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), F = P.I * P.B * P.l / 100 * Math.sin(rad(P.al)), dm = noisy(F / gAcc * 1000, .01);
      const cx = w * .22, cy = h * .45, mw = Math.min(150, w * .3);
      c.fillStyle = '#b91c1c'; c.fillRect(cx - mw / 2, cy - 70, mw * .3, 120); c.fillStyle = '#1d4ed8'; c.fillRect(cx + mw * .2, cy - 70, mw * .3, 120);
      txt(c, 'N', cx - mw * .35, cy - 50, '#fff', 'center', 14); txt(c, 'S', cx + mw * .35, cy - 50, '#fff', 'center', 14);
      for (let i = 0; i < 4; i++) arrow(c, cx - mw * .2 + 2, cy - 40 + i * 22, cx + mw * .2 - 2, cy - 40 + i * 22, 'rgba(148,163,184,.6)', 1);
      circ(c, cx, cy, 10, C.amber, '#0f172a'); if (P.I >= 0) { circ(c, cx, cy, 3, C.amber, C.amber); } else { ln(c, cx - 6, cy - 6, cx + 6, cy + 6, C.amber, 2); ln(c, cx - 6, cy + 6, cx + 6, cy - 6, C.amber, 2); }
      const fl = Math.max(-60, Math.min(60, F * 2500)); if (Math.abs(fl) > 2) arrow(c, cx, cy - 12 * Math.sign(fl), cx, cy - 12 * Math.sign(fl) - fl, C.green, 3);
      box(c, cx - 70, h - 46, 140, 34, '#475569', '#0b1220'); txt(c, `${dm >= 0 ? '+' : ''}${fx(dm, 2)} g`, cx, h - 23, C.green, 'center', 18);
      const Is = lin(-5, 5, 50), k = P.B * P.l / 100 * Math.sin(rad(P.al)) * 1000;
      plot(c, [w * .45, 0, w * .55, h], { xr: [-5, 5], yr: [-Math.max(.5, 5 * .5 * .08 * 1000), Math.max(.5, 5 * .5 * .08 * 1000)], xl: 'I, A', yl: 'F, mN', series: [{ pts: Is.map(i => [i, i * k]), c: C.cyan, w: 2.5 }], marks: [{ x: P.I, y: F * 1000, c: C.green }] });
      return { 'F = IBl·sinα, mN': fx(F * 1000, 2), 'Tarozi Δm, g': fx(dm, 2), 'B = F/(Il), Tl': P.I && P.al ? fx(Math.abs(dm / 1000 * gAcc / (P.I * P.l / 100 * Math.sin(rad(P.al)))), 3) : '—', 'F(I) qiyaligi, mN/A': fx(k, 2) };
    }
  };

  /* 10 — To'g'ri tok va halqa maydoni */
  S.bfield = {
    title: 'To‘g‘ri tok va halqa magnit maydoni',
    params: [
      { k: 'mode', l: 'Manba', type: 'sel', opts: ['To‘g‘ri o‘tkazgich', 'Aylanma halqa (o‘q bo‘ylab)'], v: 'To‘g‘ri o‘tkazgich' },
      { k: 'I', l: 'Tok I, A', min: .5, max: 10, step: .1, v: 5 },
      { k: 'R', l: 'Halqa radiusi R, sm', min: 2, max: 10, step: .5, v: 5 },
      { k: 'N', l: 'Halqa o‘ramlari N', min: 1, max: 50, step: 1, v: 20 },
      { k: 'x', l: 'Datchik masofasi r yoki x, sm', min: .5, max: 10, step: .1, v: 1 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), wire = P.mode.startsWith('To‘g‘ri'), R = P.R / 100;
      const B = x => wire ? mu0 * P.I / (2 * Math.PI * x / 100) * 1e6 : mu0 * P.N * P.I * R * R / (2 * (R * R + (x / 100) ** 2) ** 1.5) * 1e6;
      const xs = lin(wire ? .3 : 0, 10, 200), b = B(P.x), meas = noisy(b, .02);
      plot(c, [0, 0, w, h], { xr: [0, 10], yr: [0, Math.min(B(wire ? .5 : 0) * 1.05, wire ? 4000 : 1e5)], xl: wire ? 'r, sm' : 'x, sm', yl: 'B, mkTl', series: [{ pts: xs.map(x => [x, B(x)]), c: C.cyan, w: 2.5 }], hl: [{ y: 50, l: 'Yer maydoni ≈ 50 mkTl', c: '#64748b' }], marks: [{ x: P.x, y: meas, c: C.green }] });
      const o = { 'B (nazariya), mkTl': fx(b, 2), 'Teslametr, mkTl': fx(meas, 1) };
      if (wire) o['B·r, mkTl·sm'] = fx(b * P.x, 1); else { o['B(0) markaz, mkTl'] = fx(B(0), 1); o['B(x)/B(0)'] = fx(b / B(0), 3); }
      return o;
    }
  };

  /* 11 — G'altak (solenoid) maydoni */
  S.solenoid = {
    title: 'O‘zaksiz g‘altak o‘qidagi maydon',
    params: [
      { k: 'N', l: 'O‘ramlar soni N', min: 50, max: 1000, step: 10, v: 300 },
      { k: 'L', l: 'G‘altak uzunligi L, sm', min: 2, max: 30, step: .5, v: 15 },
      { k: 'R', l: 'Radius R, sm', min: .5, max: 5, step: .1, v: 2 },
      { k: 'I', l: 'Tok I, A', min: .1, max: 2, step: .05, v: 1 },
      { k: 'x', l: 'Zond holati x, sm', min: -20, max: 20, step: .5, v: 0 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), L = P.L / 100, R = P.R / 100, n = P.N / L;
      const B = x => { const z = x / 100; return mu0 * n * P.I / 2 * ((z + L / 2) / Math.hypot(z + L / 2, R) - (z - L / 2) / Math.hypot(z - L / 2, R)) * 1e3; };
      const xs = lin(-25, 25, 300), inf = mu0 * n * P.I * 1e3;
      plot(c, [0, 0, w, h], { xr: [-25, 25], yr: [0, inf * 1.12], xl: 'x, sm', yl: 'B, mTl', fill: [{ c: 'rgba(56,189,248,.08)', pts: [[-P.L / 2, 0], [-P.L / 2, inf * 1.12], [P.L / 2, inf * 1.12], [P.L / 2, 0]] }], series: [{ pts: xs.map(x => [x, B(x)]), c: C.cyan, w: 2.5 }], hl: [{ y: inf, l: 'μ₀nI (cheksiz solenoid)', c: '#64748b' }], vl: [{ x: -P.L / 2, c: C.amber }, { x: P.L / 2, c: C.amber }], marks: [{ x: P.x, y: B(P.x), c: C.green }] });
      return { 'n = N/L, m⁻¹': fx(n, 0), 'μ₀nI, mTl': fx(inf, 3), 'B(0), mTl': fx(B(0), 3), 'B(L/2) uchida, mTl': fx(B(P.L / 2), 3), 'B(x), mTl': fx(B(P.x), 3), 'B(uch)/B(0)': fx(B(P.L / 2) / B(0), 3) };
    }
  };

  /* 12 — Tangens-galvanometr */
  S.tangent = {
    title: 'Tangens-galvanometr',
    params: [
      { k: 'N', l: 'O‘ramlar soni N', min: 1, max: 20, step: 1, v: 10 },
      { k: 'R', l: 'Halqa radiusi R, sm', min: 5, max: 20, step: .5, v: 10 },
      { k: 'I', l: 'Tok I, A', min: 0, max: 1, step: .01, v: .2 },
      { k: 'BH', l: 'Yer maydoni B_H, mkTl', min: 15, max: 40, step: .1, v: 27.6 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), Bc = mu0 * P.N * P.I / (2 * P.R / 100) * 1e6, phi = Math.atan2(Bc, P.BH), phiM = noisy(deg(phi), .004);
      const cx = w * .22, cy = h / 2, r = Math.min(w * .18, h * .4);
      circ(c, cx, cy, r, '#475569', '#0b1220');
      for (let a = 0; a < 360; a += 10) { const t = rad(a - 90); ln(c, cx + r * Math.cos(t), cy + r * Math.sin(t), cx + (r - (a % 30 ? 5 : 10)) * Math.cos(t), cy + (r - (a % 30 ? 5 : 10)) * Math.sin(t), C.axis, 1); }
      txt(c, 'Sh', cx, cy - r - 6, C.text); const sc = r * .8 / Math.max(P.BH, Bc, 1);
      arrow(c, cx, cy, cx, cy - P.BH * sc, '#64748b', 2); arrow(c, cx, cy, cx + Bc * sc, cy, C.amber, 2);
      const t = -Math.PI / 2 + phi; ln(c, cx - r * .75 * Math.cos(t), cy - r * .75 * Math.sin(t), cx, cy, '#e2e8f0', 4); arrow(c, cx, cy, cx + r * .75 * Math.cos(t), cy + r * .75 * Math.sin(t), C.rose, 4);
      txt(c, `φ = ${fx(phiM, 1)}°`, cx, cy + r + 18, C.rose);
      const Is = lin(0, 1, 100);
      plot(c, [w * .45, 0, w * .55, h], { xr: [0, 1], yr: [0, 90], xl: 'I, A', yl: 'φ, °', series: [{ pts: Is.map(i => [i, deg(Math.atan2(mu0 * P.N * i / (2 * P.R / 100) * 1e6, P.BH))]), c: C.cyan, w: 2.5 }], hl: [{ y: 45, l: '45° — eng aniq', c: C.green }], marks: [{ x: P.I, y: deg(phi), c: C.rose }] });
      const BHc = Bc / Math.tan(rad(phiM));
      return { 'B_halqa, mkTl': fx(Bc, 2), 'Og‘ish φ (kompas), °': fx(phiM, 1), 'tg φ': fx(Math.tan(rad(phiM)), 3), 'B_H = B_h/tgφ, mkTl': P.I ? fx(BHc, 1) : '—', 'H_H, A/m': P.I ? fx(BHc * 1e-6 / mu0, 1) : '—', 'Nisbiy xato (Δφ = 1°), %': P.I ? fx(2 * rad(1) / Math.sin(2 * phi) * 100, 1) : '—' };
    }
  };

  /* 13 — Aylanuvchi induksion g'altak */
  S.earthcoil = {
    title: 'Aylanuvchi induksion g‘altak (yer induktori)',
    params: [
      { k: 'N', l: 'O‘ramlar soni N', min: 50, max: 500, step: 10, v: 200 },
      { k: 'r', l: 'G‘altak radiusi r, sm', min: 5, max: 20, step: .5, v: 10 },
      { k: 'f', l: 'Aylanish chastotasi f, Gs', min: 1, max: 30, step: .5, v: 10 },
      { k: 'ax', l: 'Aylanish o‘qi', type: 'sel', opts: ['Vertikal o‘q (B_H o‘lchanadi)', 'Gorizontal o‘q, meridian bo‘ylab (B_V)'], v: 'Vertikal o‘q (B_H o‘lchanadi)' },
      { k: 'inc', l: 'Inklinatsiya θ, °', min: 0, max: 90, step: .5, v: 59.5 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), Bt = 53.6, BH = Bt * Math.cos(rad(P.inc)), BV = Bt * Math.sin(rad(P.inc)), vert = P.ax.startsWith('Vertikal');
      const Bp = (vert ? BH : BV) * 1e-6, S0 = Math.PI * (P.r / 100) ** 2, om = 2 * Math.PI * P.f, E0 = P.N * S0 * Bp * om * 1000;
      const T = 1 / P.f, ts = lin(0, 2 * T * 1000, 300);
      plot(c, [0, 0, w, h], { xr: [0, 2 * T * 1000], yr: [-Math.max(E0, 1) * 1.15, Math.max(E0, 1) * 1.15], xl: 't, ms', yl: '𝓔, mV', series: [{ pts: ts.map(t => [t, E0 * Math.sin(om * t / 1000)]), c: C.cyan, w: 2.5 }], hl: [{ y: E0, l: '𝓔₀', c: C.green }] });
      return { 'Amplituda 𝓔₀, mV': fx(noisy(E0, .01), 2), 'B_⊥ = 𝓔₀/(NSω), mkTl': fx(Bp * 1e6, 1), 'NSω, m²/s': fx(P.N * S0 * om, 1), 'Davr T, ms': fx(T * 1000, 1), 'B_H / B_V, mkTl': `${fx(BH, 1)} / ${fx(BV, 1)}` };
    }
  };

  /* 14 — Faradey induksiya qonuni */
  S.faraday = {
    title: 'Magnit g‘altak orqali o‘tganda induksiya EYuK',
    params: [
      { k: 'v', l: 'Magnit tezligi v, m/s', min: .2, max: 3, step: .05, v: 1 },
      { k: 'N', l: 'O‘ramlar soni N', min: 100, max: 1000, step: 50, v: 400 },
      { k: 'm', l: 'Magnit momenti, A·m²', min: .1, max: 2, step: .05, v: .5 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), R = .015, k = mu0 * P.m * R * R / 2;
      const Phi = z => k / (R * R + z * z) ** 1.5, E = z => P.N * 3 * k * z * P.v / (R * R + z * z) ** 2.5;
      const zs = lin(-6 * R, 6 * R, 400), tmax = 6 * R / P.v * 1000;
      const Emax = P.N * 3 * k * P.v * (R / 2) / (R * R * 1.25) ** 2.5;
      plot(c, [0, 0, w, h * .5], { xr: [-tmax, tmax], yr: [-Emax * 1.15 * 1000, Emax * 1.15 * 1000], xl: 't, ms', yl: '𝓔, mV', series: [{ pts: zs.map(z => [z / P.v * 1000, E(z) * 1000]), c: C.cyan, w: 2.5 }] });
      plot(c, [0, h * .5, w, h * .5], { xr: [-tmax, tmax], yr: [0, Phi(0) * P.N * 1000 * 1.1], xl: 't, ms', yl: 'NΦ, mWb', series: [{ pts: zs.map(z => [z / P.v * 1000, P.N * Phi(z) * 1000]), c: C.amber, w: 2.5 }] });
      return { '𝓔_max, mV': fx(Emax * 1000, 1), '∫𝓔dt (yarim o‘tish) = NΦ_max, mV·s': fx(P.N * Phi(0) * 1000, 2), 'Φ_max, mkWb': fx(Phi(0) * 1e6, 2), 'Impuls davomiyligi ~ 2R/v, ms': fx(2 * R / P.v * 1000, 1) };
    }
  };

  /* 15 — Elektroliz va Faradey doimiysi */
  const MET = { 'Mis (Cu²⁺)': [63.55, 2], 'Kumush (Ag⁺)': [107.87, 1], 'Rux (Zn²⁺)': [65.38, 2] };
  S.electrolysis = {
    title: 'Elektroliz: Faradey qonunlari',
    params: [
      { k: 'met', l: 'Metall', type: 'sel', opts: Object.keys(MET), v: 'Mis (Cu²⁺)' },
      { k: 'I', l: 'Tok I, A', min: .1, max: 2, step: .05, v: 1 },
      { k: 't', l: 'Vaqt t, min', min: 1, max: 60, step: 1, v: 30 },
      { k: 'eta', l: 'Tok unumdorligi, %', min: 80, max: 100, step: .5, v: 100 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), [M, z] = MET[P.met], k = M / (z * FARADAY), mt = t => P.eta / 100 * k * P.I * t * 60;
      const ts = lin(0, 60, 100), m = noisy(mt(P.t), .003);
      plot(c, [0, 0, w, h], { xr: [0, 60], yr: [0, Math.max(mt(60) * 1.1, .1)], xl: 't, min', yl: 'm, g', series: [{ pts: ts.map(t => [t, mt(t)]), c: C.amber, w: 2.5 }, { pts: ts.map(t => [t, k * P.I * t * 60]), c: '#64748b', dash: [5, 4] }], marks: [{ x: P.t, y: m, c: C.green }], legend: [{ c: C.amber, l: 'haqiqiy' }, { c: '#64748b', l: 'nazariy (100 %)' }] });
      const F = M * P.I * P.t * 60 / (z * m);
      return { 'Ajralgan massa m, g': fx(m, 4), 'Zaryad q = It, Kl': fx(P.I * P.t * 60, 0), 'k = M/(zF), mg/Kl': fx(k * 1000, 4), 'Hisoblangan F, Kl/mol': fx(F, 0), 'e = F/N_A, Kl': sci(F / 6.022e23, 3), 'Jadvaldan farq, %': fx((F / FARADAY - 1) * 100, 2) };
    }
  };

  /* 16 — Erkin elektromagnit tebranishlar */
  S.lc = {
    title: 'So‘nuvchi erkin tebranishlar (RLC)',
    params: [
      { k: 'L', l: 'Induktivlik L, mGn', min: 1, max: 100, step: 1, v: 10 },
      { k: 'C', l: 'Sig‘im C, mkF', min: .01, max: 1, step: .01, v: .1 },
      { k: 'R', l: 'Qarshilik R, Om', min: 0, max: 1500, step: 5, v: 20 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), L = P.L / 1000, Cc = P.C * 1e-6, w0 = 1 / Math.sqrt(L * Cc), b = P.R / (2 * L), T0 = 2 * Math.PI / w0;
      let U;
      if (b < w0 * .999) { const om = Math.sqrt(w0 * w0 - b * b); U = t => Math.exp(-b * t) * (Math.cos(om * t) + b / om * Math.sin(om * t)); }
      else if (b > w0 * 1.001) { const g = Math.sqrt(b * b - w0 * w0); U = t => Math.exp(-b * t) * (Math.cosh(g * t) + b / g * Math.sinh(g * t)); }
      else U = t => Math.exp(-b * t) * (1 + b * t);
      const tm = 8 * T0, ts = lin(0, tm, 600);
      plot(c, [0, 0, w, h], { xr: [0, tm * 1000], yr: [-1.1, 1.1], xl: 't, ms', yl: 'U_C / U₀', series: [{ pts: ts.map(t => [t * 1000, U(t)]), c: C.cyan, w: 2.2 }, { pts: ts.map(t => [t * 1000, Math.exp(-b * t)]), c: '#64748b', dash: [5, 4] }, { pts: ts.map(t => [t * 1000, -Math.exp(-b * t)]), c: '#64748b', dash: [5, 4] }] });
      const om = Math.sqrt(Math.max(w0 * w0 - b * b, 0)), T = om ? 2 * Math.PI / om : Infinity, lam = b * T;
      return { 'f₀ = 1/(2π√LC), Gs': fx(w0 / 2 / Math.PI, 0), 'Davr T, ms': om ? fx(T * 1000, 4) : 'tebranish yo‘q', 'β = R/2L, s⁻¹': fx(b, 0), 'λ = βT': om ? fx(lam, 3) : '—', 'Q = π/λ': om && lam ? fx(Math.PI / lam, 1) : '—', 'R_kr = 2√(L/C), Om': fx(2 * Math.sqrt(L / Cc), 0) };
    }
  };

  /* 17 — Transformator FIK */
  S.trans = {
    title: 'Transformator: FIK ning yuklamaga bog‘liqligi',
    params: [
      { k: 'k', l: 'N₂/N₁ (U₁ = 220 V)', min: .05, max: .5, step: .001, v: .109 },
      { k: 'RL', l: 'Yuklama R_yu, Om', min: 2, max: 100, step: .5, v: 11.5 },
      { k: 'P0', l: 'O‘zak isrofi P_o‘z, W', min: 0, max: 10, step: .5, v: 3 },
      { k: 'Rc', l: 'Chulg‘amlar keltirilgan qarshiligi, Om', min: .1, max: 2, step: .05, v: .5 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), E2 = 220 * P.k;
      const calc = RL => { const I2 = E2 / (RL + P.Rc), P2 = I2 * I2 * RL, P1 = P2 + I2 * I2 * P.Rc + P.P0; return { I2, U2: I2 * RL, P2, P1, eta: P2 / P1 }; };
      const r = calc(P.RL), Rs = lin(0, 1, 200).map(x => .2 * 500 ** x), pts = Rs.map(R => { const q = calc(R); return [q.I2, q.eta * 100]; }).filter(p => p[0] <= E2 / 2);
      const Iopt = Math.sqrt(P.P0 / P.Rc);
      plot(c, [0, 0, w, h], { xr: [0, Math.min(E2 / 2, Math.max(...pts.map(p => p[0])))], yr: [0, 100], xl: 'I₂, A', yl: 'η, %', series: [{ pts: pts.sort((a, b) => a[0] - b[0]), c: C.cyan, w: 2.5 }], vl: [{ x: Iopt, l: 'P_mis = P_o‘z', c: C.green }], marks: [{ x: r.I2, y: r.eta * 100, c: C.amber }] });
      return { 'U₂, V': fx(r.U2, 2), 'I₂, A': fx(r.I2, 3), 'P₂, W': fx(r.P2, 1), 'P₁ (vattmetr), W': fx(r.P1, 1), 'P_mis, W': fx(r.I2 * r.I2 * P.Rc, 2), 'η, %': fx(r.eta * 100, 1) };
    }
  };

  /* 18 — O'zgaruvchan tok: ketma-ket RLC */
  S.ac = {
    title: 'Ketma-ket RLC zanjir: rezonans',
    params: [
      { k: 'R', l: 'Qarshilik R, Om', min: 10, max: 500, step: 5, v: 100 },
      { k: 'L', l: 'Induktivlik L, Gn', min: .01, max: 1, step: .01, v: .1 },
      { k: 'C', l: 'Sig‘im C, mkF', min: 1, max: 50, step: .5, v: 10 },
      { k: 'f', l: 'Chastota f, Gs', min: 10, max: 1000, step: 1, v: 50 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), U = 10, Cc = P.C * 1e-6;
      const Zf = f => { const om = 2 * Math.PI * f; return Math.hypot(P.R, om * P.L - 1 / (om * Cc)); };
      const fs = lin(10, 1000, 500), om = 2 * Math.PI * P.f, XL = om * P.L, XC = 1 / (om * Cc), Z = Zf(P.f), I = U / Z, ph = Math.atan((XL - XC) / P.R), f0 = 1 / (2 * Math.PI * Math.sqrt(P.L * Cc));
      plot(c, [0, 0, w * .66, h], { xr: [10, 1000], yr: [0, U / P.R * 1000 * 1.1], xl: 'f, Gs', yl: 'I, mA (U = 10 V)', series: [{ pts: fs.map(f => [f, U / Zf(f) * 1000]), c: C.cyan, w: 2.5 }], vl: [{ x: f0, l: 'f₀', c: C.green }], marks: [{ x: P.f, y: I * 1000, c: C.amber }] });
      // vektor diagramma
      const ox = w * .72, oy = h * .55, sc = Math.min(w * .25, h * .4) / Math.max(I * P.R, I * XL, I * XC, U);
      arrow(c, ox, oy, ox + I * P.R * sc, oy, C.green); arrow(c, ox, oy, ox, oy - I * XL * sc, C.violet); arrow(c, ox, oy, ox, oy + I * XC * sc, C.rose); arrow(c, ox, oy, ox + I * P.R * sc, oy - (I * XL - I * XC) * sc, C.amber, 2.5);
      txt(c, 'U_R', ox + I * P.R * sc, oy + 14, C.green); txt(c, 'U_L', ox - 4, oy - I * XL * sc - 4, C.violet, 'right'); txt(c, 'U_C', ox - 4, oy + I * XC * sc + 12, C.rose, 'right'); txt(c, 'U', ox + I * P.R * sc + 6, oy - (I * XL - I * XC) * sc, C.amber, 'left');
      return { 'X_L / X_C, Om': `${fx(XL, 1)} / ${fx(XC, 1)}`, 'Z, Om': fx(Z, 1), 'I, mA': fx(I * 1000, 2), 'φ, °': fx(deg(ph), 1), 'f₀, Gs': fx(f0, 1), 'U_L / U_C, V': `${fx(I * XL, 2)} / ${fx(I * XC, 2)}`, 'Q = √(L/C)/R': fx(Math.sqrt(P.L / Cc) / P.R, 2) };
    }
  };

  /* 19 — Fotometriya qonunlari */
  S.photom = {
    title: 'Yoritilganlik qonunlari',
    params: [
      { k: 'I', l: 'Yorug‘lik kuchi I, kd', min: 10, max: 200, step: 1, v: 100 },
      { k: 'r', l: 'Masofa r, m', min: .3, max: 3, step: .05, v: 2 },
      { k: 'al', l: 'Tushish burchagi α, °', min: 0, max: 85, step: 1, v: 0 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), E = (r, a) => P.I * Math.cos(rad(a)) / (r * r), rs = lin(.3, 3, 200), as = lin(0, 90, 100);
      plot(c, [0, 0, w * .5, h], { xr: [0, 3], yr: [0, Math.min(E(.3, 0), 2500)], xl: 'r, m', yl: 'E, lk', series: [{ pts: rs.map(r => [r, E(r, P.al)]), c: C.amber, w: 2.5 }], marks: [{ x: P.r, y: E(P.r, P.al), c: C.green }] });
      plot(c, [w * .51, 0, w * .49, h], { xr: [0, 90], yr: [0, E(P.r, 0) * 1.1], xl: 'α, °', yl: 'E(α), lk', series: [{ pts: as.map(a => [a, E(P.r, a)]), c: C.cyan, w: 2.5 }], marks: [{ x: P.al, y: E(P.r, P.al), c: C.green }] });
      const e = E(P.r, P.al);
      return { 'E = I·cosα/r², lk': fx(e, 2), 'Lyuksmetr, lk': fx(noisy(e, .01), 1), 'E·r²/cosα, kd': fx(P.I, 1), 'To‘liq oqim 4πI, lm': fx(4 * Math.PI * P.I, 0) };
    }
  };

  /* 20 — Buzen fotometri */
  S.bunsen = {
    title: 'Buzen (moy dog‘li) fotometri',
    params: [
      { k: 'I0', l: 'Etalon lampa I₀, kd', min: 10, max: 100, step: 1, v: 25 },
      { k: 'Ix', l: 'Tekshiriladigan lampa Iₓ, kd (yashirin qiymat)', min: 10, max: 200, step: .25, v: 56.25 },
      { k: 'Lb', l: 'Lampalar orasidagi masofa, sm', min: 60, max: 200, step: 1, v: 100 },
      { k: 'x', l: 'Ekran holati (etalondan), sm', min: 5, max: 195, step: .5, v: 40 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), x = Math.min(P.x, P.Lb - 5), E1 = P.I0 / (x / 100) ** 2, E2 = P.Ix / ((P.Lb - x) / 100) ** 2;
      const x0 = 40, x1 = w - 40, y = h * .7, X = s => x0 + (x1 - x0) * s / P.Lb;
      ln(c, x0, y, x1, y, '#475569', 4); for (let s = 0; s <= P.Lb; s += 10) ln(c, X(s), y, X(s), y + (s % 50 ? 5 : 10), C.axis, 1);
      circ(c, X(0), y - 30, 12, C.amber, 'rgba(251,191,36,.8)'); circ(c, X(P.Lb), y - 30, 12, C.amber, 'rgba(251,191,36,.8)');
      txt(c, 'I₀', X(0), y - 50, C.amber); txt(c, 'Iₓ', X(P.Lb), y - 50, C.amber); ln(c, X(x), y - 70, X(x), y, C.text, 3);
      // ikki tomondan ko'rinish: dog' va fon
      const view = (cx, Ef, Eb, lab) => { const tot = Ef + Eb, bg = (.85 * Ef + .15 * Eb) / tot, sp = (.4 * Ef + .55 * Eb) / tot; const g1 = Math.round(80 + 170 * bg), g2 = Math.round(80 + 170 * sp); c.fillStyle = `rgb(${g1},${g1},${g1 - 10})`; c.fillRect(cx - 50, 20, 100, 80); c.fillStyle = `rgb(${g2},${g2},${g2 - 10})`; c.beginPath(); c.arc(cx, 60, 18, 0, 7); c.fill(); txt(c, lab, cx, 116, C.text); };
      view(w * .32, E1, E2, 'chap tomondan'); view(w * .68, E2, E1, 'o‘ng tomondan');
      const balance = Math.abs(E1 - E2) / (E1 + E2) < .01;
      txt(c, balance ? 'Muvozanat: dog‘ ko‘rinmaydi' : 'Dog‘ ko‘rinmoqda — ekranni suring', w / 2, 140, balance ? C.green : C.rose);
      return { 'E₁ (etalon tomoni), lk': fx(E1, 1), 'E₂, lk': fx(E2, 1), 'E₁/E₂': fx(E1 / E2, 3), 'Iₓ = I₀(rₓ/r₀)², kd': fx(P.I0 * ((P.Lb - x) / x) ** 2, 2) };
    }
  };

  /* 21 — Prizma */
  const COLW = { 'Qizil (656 nm)': 656, 'Sariq (589 nm)': 589, 'Ko‘k (486 nm)': 486, 'Binafsha (434 nm)': 434 };
  const nLam = (n, wl) => n + 4200 * (1 / (wl * wl) - 1 / (589 * 589));
  S.prism = {
    title: 'Uchyoqli prizma: og‘ish burchagi',
    params: [
      { k: 'A', l: 'Sindiruvchi burchak A, °', min: 30, max: 75, step: 1, v: 60 },
      { k: 'n', l: 'Sindirish ko‘rsatkichi n (589 nm)', min: 1.4, max: 1.9, step: .005, v: 1.52 },
      { k: 'i', l: 'Tushish burchagi i₁, °', min: 15, max: 89, step: .5, v: 49.5 },
      { k: 'col', l: 'Nur rangi', type: 'sel', opts: Object.keys(COLW), v: 'Sariq (589 nm)' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), wl = COLW[P.col], n = nLam(P.n, wl), A0 = rad(P.A);
      const dev = i => { const r1 = Math.asin(Math.sin(rad(i)) / n), r2 = A0 - r1, s = n * Math.sin(r2); return Math.abs(s) >= 1 ? NaN : deg(rad(i) + Math.asin(s) - A0); };
      const dmin = 2 * deg(Math.asin(n * Math.sin(A0 / 2))) - P.A, d = dev(P.i);
      // chizma
      const cx = w * .22, cy = h * .58, s = Math.min(w * .3, h * .7), half = A0 / 2;
      const top = [cx, cy - s * .55], bl = [cx - s * Math.tan(half) * .9, cy + s * .35], br = [cx + s * Math.tan(half) * .9, cy + s * .35];
      c.fillStyle = 'rgba(56,189,248,.12)'; c.beginPath(); c.moveTo(...top); c.lineTo(...bl); c.lineTo(...br); c.closePath(); c.fill(); c.strokeStyle = '#38bdf8'; c.lineWidth = 1.5; c.stroke();
      const col = wlRGB(wl), L1 = s * .6, hh = half;
      const refr = (d, N, eta) => { const ci = -(N[0] * d[0] + N[1] * d[1]), k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null; const f = eta * ci - Math.sqrt(k); return [eta * d[0] + f * N[0], eta * d[1] + f * N[1]]; };
      const p1 = [top[0] + (bl[0] - top[0]) * .55, top[1] + (bl[1] - top[1]) * .55];
      const d0 = [Math.cos(hh - rad(P.i)), Math.sin(hh - rad(P.i))], N1 = [-Math.cos(hh), -Math.sin(hh)];
      ln(c, p1[0] - L1 * d0[0], p1[1] - L1 * d0[1], p1[0], p1[1], col, 2.5);
      ln(c, p1[0] + 28 * N1[0], p1[1] + 28 * N1[1], p1[0] - 28 * N1[0], p1[1] - 28 * N1[1], '#64748b', 1, [4, 4]);
      const t1 = refr(d0, N1, 1 / n);
      if (t1) {
        const ex = br[0] - top[0], ey = br[1] - top[1], det = t1[0] * (-ey) - t1[1] * (-ex), ux = top[0] - p1[0], uy = top[1] - p1[1], tt = (ux * (-ey) - uy * (-ex)) / det;
        const p2 = [p1[0] + t1[0] * tt, p1[1] + t1[1] * tt]; ln(c, p1[0], p1[1], p2[0], p2[1], col, 2.5);
        const t2 = refr(t1, [-Math.cos(hh), Math.sin(hh)], n);
        if (t2) { ln(c, p2[0], p2[1], p2[0] + L1 * .75 * t2[0], p2[1] + L1 * .75 * t2[1], col, 2.5); ln(c, p2[0], p2[1], p2[0] + L1 * d0[0], p2[1] + L1 * d0[1], '#475569', 1, [4, 4]); }
        else txt(c, 'To‘la ichki qaytish', cx, cy + s * .5, C.rose);
      }
      const is = lin(15, 89, 300);
      plot(c, [w * .45, 0, w * .55, h], { xr: [15, 90], yr: [Math.max(0, dmin - 5), Math.min(90, dmin + 45)], xl: 'i₁, °', yl: 'δ, °', series: [{ pts: is.map(i => [i, dev(i)]), c: C.cyan, w: 2.5 }], hl: [{ y: dmin, l: 'δ_min', c: C.green }], marks: isFinite(d) ? [{ x: P.i, y: d, c: C.amber }] : [] });
      return { 'n(λ)': fx(n, 4), 'Og‘ish δ, °': isFinite(d) ? fx(d, 2) : 'chiqmaydi', 'δ_min, °': fx(dmin, 2), 'n = sin((A+δ_min)/2)/sin(A/2)': fx(Math.sin(rad(P.A + dmin) / 2) / Math.sin(A0 / 2), 4), 'Minimumdagi i₁, °': fx((P.A + dmin) / 2, 2) };
    }
  };

  /* 22 — Yassi parallel plastina */
  S.slab = {
    title: 'Yassi parallel plastinadan nur o‘tishi',
    params: [
      { k: 'n', l: 'Sindirish ko‘rsatkichi n', min: 1, max: 2.5, step: .01, v: 1.51 },
      { k: 'i', l: 'Tushish burchagi i, °', min: 0, max: 85, step: .5, v: 45 },
      { k: 'd', l: 'Qalinlik d, sm', min: .5, max: 3, step: .1, v: 1 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), r = Math.asin(Math.sin(rad(P.i)) / P.n), x = P.d * Math.sin(rad(P.i) - r) / Math.cos(r);
      const sc = Math.min(w * .55, h) / 6, cx = w * .3, top = h / 2 - P.d * sc / 2, bot = h / 2 + P.d * sc / 2;
      c.fillStyle = 'rgba(56,189,248,.14)'; c.fillRect(20, top, w * .56, bot - top); ln(c, 20, top, w * .56 + 20, top, '#38bdf8'); ln(c, 20, bot, w * .56 + 20, bot, '#38bdf8');
      const L = 2.2 * sc, ia = rad(P.i); ln(c, cx - L * Math.sin(ia), top - L * Math.cos(ia), cx, top, C.amber, 2.5);
      const bx = cx + (bot - top) * Math.tan(r); ln(c, cx, top, bx, bot, C.amber, 2.5); ln(c, bx, bot, bx + L * Math.sin(ia), bot + L * Math.cos(ia), C.amber, 2.5);
      ln(c, cx, top, cx + L * Math.sin(ia), top + L * Math.cos(ia), '#64748b', 1, [4, 4]); ln(c, cx, top - 40, cx, bot + 10, '#64748b', 1, [3, 4]);
      txt(c, `i = ${fx(P.i, 1)}°`, cx - 8, top - 46, C.text, 'right'); txt(c, `r = ${fx(deg(r), 1)}°`, cx + 6, top + 18, C.text, 'left');
      const is = lin(0, 85, 100);
      plot(c, [w * .6, 0, w * .4, h], { xr: [0, 1], yr: [0, 1], xl: 'sin r', yl: 'sin i', series: [{ pts: is.map(a => [Math.sin(rad(a)) / P.n, Math.sin(rad(a))]), c: C.cyan, w: 2.5 }], marks: [{ x: Math.sin(r), y: Math.sin(ia), c: C.amber }] });
      return { 'Sinish burchagi r, °': fx(deg(r), 2), 'n = sin i / sin r': P.i ? fx(Math.sin(ia) / Math.sin(r), 3) : '—', 'Yon siljish x, mm': fx(x * 10, 2), 'Kritik burchak (shisha→havo), °': P.n > 1 ? fx(deg(Math.asin(1 / P.n)), 1) : '—', 'Nur tezligi v = c/n, km/s': fx(3e5 / P.n, 0) };
    }
  };

  /* 23 — Zohiriy chuqurlik (mikroskop usuli) */
  S.appdepth = {
    title: 'Zohiriy qalinlik: h = d/n',
    params: [
      { k: 'd', l: 'Haqiqiy qalinlik d, mm', min: 1, max: 10, step: .1, v: 3 },
      { k: 'n', l: 'Sindirish ko‘rsatkichi n', min: 1, max: 2.5, step: .01, v: 1.52 },
      { k: 'u', l: 'Kuzatish yarim burchagi u (apertura), °', min: 1, max: 45, step: .5, v: 5 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), hu = u => { const r = Math.asin(Math.sin(rad(u)) / P.n); return P.d * Math.tan(r) / Math.tan(rad(u)); };
      const sc = Math.min(w * .5, h * .8) / 12, x0 = w * .25, top = h * .3, bot = top + P.d * sc;
      c.fillStyle = 'rgba(56,189,248,.14)'; c.fillRect(30, top, w * .4, bot - top); ln(c, 30, top, w * .4 + 30, top, '#38bdf8'); ln(c, 30, bot, w * .4 + 30, bot, '#38bdf8');
      circ(c, x0, bot, 4, C.rose, C.rose); const hh = hu(P.u), ya = top + hh * sc; circ(c, x0, ya, 4, C.green, C.green);
      [-1, 1].forEach(sg => { const r = Math.asin(Math.sin(rad(P.u)) / P.n), xs = x0 + sg * P.d * sc * Math.tan(r); ln(c, x0, bot, xs, top, C.amber, 2); ln(c, xs, top, xs + sg * 80 * Math.sin(rad(P.u)), top - 80 * Math.cos(rad(P.u)), C.amber, 2); ln(c, xs, top, x0, ya, C.green, 1, [4, 4]); });
      txt(c, 'haqiqiy nuqta', x0 + 10, bot + 16, C.rose, 'left'); txt(c, 'zohiriy nuqta', x0 + 10, ya + 4, C.green, 'left');
      const us = lin(1, 45, 100);
      plot(c, [w * .5, 0, w * .5, h], { xr: [0, 45], yr: [0, P.d * 1.05], xl: 'u, °', yl: 'h, mm', series: [{ pts: us.map(u => [u, hu(u)]), c: C.cyan, w: 2.5 }], hl: [{ y: P.d / P.n, l: 'd/n (paraksial)', c: C.green }], marks: [{ x: P.u, y: hh, c: C.amber }] });
      return { 'h = d/n (paraksial), mm': fx(P.d / P.n, 3), 'h(u) aniq, mm': fx(hh, 3), 'n = d/h(u)': fx(P.d / hh, 3), 'Chetlanish, %': fx((P.d / hh / P.n - 1) * 100, 2) };
    }
  };

  /* 24 — Yupqa linza */
  S.lens = {
    title: 'Yupqa linza: tasvir yasash',
    params: [
      { k: 'f', l: 'Fokus masofasi f, sm (− sochuvchi)', min: -30, max: 30, step: .5, v: 20 },
      { k: 'a', l: 'Buyumgacha masofa a, sm', min: 5, max: 100, step: .5, v: 30 },
      { k: 'ab', l: 'Sferik aberratsiya', type: 'sel', opts: ['Ko‘rsatilmaydi', 'Ko‘rsatish (parallel dasta)'], v: 'Ko‘rsatilmaydi' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), f = Math.abs(P.f) < 2 ? (P.f < 0 ? -2 : 2) : P.f, a = P.a, b = a * f / (a - f), G = -b / a;
      const cy = h / 2, lx = w * .45, sc = Math.min(w / 260, h / 90), X = s => lx + s * sc, hb = 8;
      ln(c, 10, cy, w - 10, cy, '#475569', 1); ln(c, lx, cy - 40 * sc, lx, cy + 40 * sc, '#38bdf8', 3);
      [f, -f].forEach(s => { circ(c, X(s), cy, 3, C.amber, C.amber); }); txt(c, 'F', X(f), cy + 16, C.amber); txt(c, 'F', X(-f), cy + 16, C.amber);
      if (P.ab.startsWith('Ko‘rsatish')) {
        for (let k = -4; k <= 4; k++) { if (!k) continue; const y0 = k * 2, fk = f * (1 - .004 * y0 * y0), xe = 2 * Math.abs(fk), ye = y0 - y0 / fk * xe;
          ln(c, 10, cy - y0 * sc, lx, cy - y0 * sc, wlRGB(560, .8), 1.5); ln(c, lx, cy - y0 * sc, X(xe), cy - ye * sc, Math.abs(k) > 2 ? C.rose : C.green, 1.5); }
        txt(c, 'Chekka nurlar (qizil) linzaga yaqinroq fokuslanadi', w / 2, 18, C.text);
        return { 'Paraksial fokus, sm': fx(f, 1), 'Chekka nur (h = 8 sm) fokusi, sm': fx(f * (1 - .004 * 64), 1), 'Bo‘ylama aberratsiya, sm': fx(Math.abs(f * .004 * 64), 1), 'Optik kuch D, dptr': fx(100 / f, 2) };
      }
      arrow(c, X(-a), cy, X(-a), cy - hb * sc, C.green, 3);
      const yi = G * hb; if (isFinite(b) && Math.abs(b) < 400) { arrow(c, X(b), cy, X(b), cy - yi * sc, b > 0 ? C.rose : 'rgba(251,113,133,.6)', 3);
        ln(c, X(-a), cy - hb * sc, lx, cy - hb * sc, C.amber, 1.5); ln(c, lx, cy - hb * sc, X(b), cy - yi * sc, C.amber, 1.5, b < 0 ? [5, 4] : []);
        ln(c, X(-a), cy - hb * sc, X(b), cy - yi * sc, C.cyan, 1.5, b < 0 ? [5, 4] : []); if (b < 0) { ln(c, lx, cy - hb * sc, lx + 120, cy - hb * sc + 120 * hb / f, C.amber, 1.5); } }
      const typ = !isFinite(b) || Math.abs(b) > 1e4 ? 'tasvir cheksizlikda' : (b > 0 ? 'haqiqiy, ' : 'mavhum, ') + (G < 0 ? 'teskari, ' : 'to‘g‘ri, ') + (Math.abs(G) > 1 ? 'kattalashgan' : 'kichraygan');
      return { 'Tasvirgacha b, sm': isFinite(b) && Math.abs(b) < 1e4 ? fx(b, 1) : '∞', 'Kattalashtirish Γ = b/a': fx(Math.abs(G), 2), 'Optik kuch D, dptr': fx(100 / f, 2), 'Tasvir': typ };
    }
  };

  /* 25 — Mikroskop kattalashtirishi */
  S.microscope = {
    title: 'Mikroskop kattalashtirishi',
    params: [
      { k: 'fob', l: 'Obyektiv fokus masofasi, mm', min: 2, max: 20, step: .5, v: 10 },
      { k: 'fok', l: 'Okulyar fokus masofasi, mm', min: 10, max: 50, step: 1, v: 25 },
      { k: 'D', l: 'Optik tubus uzunligi Δ, mm', min: 100, max: 200, step: 5, v: 160 },
      { k: 'NA', l: 'Sonli apertura NA', min: .1, max: 1.25, step: .01, v: .25 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), Gob = P.D / P.fob, Gok = 250 / P.fok, G = Gob * Gok;
      // obyekt-mikrometr (0,01 mm bo'laklar) tasviri va 25 sm dagi mm shkala
      const y1 = h * .3, y2 = h * .62, pxmm = Math.min(14, w / 70), x0 = 30;
      ln(c, x0, y2, w - 20, y2, C.text, 1.5); for (let m = 0; x0 + m * pxmm < w - 20; m++) { ln(c, x0 + m * pxmm, y2, x0 + m * pxmm, y2 + (m % 10 ? 6 : 14), C.text, 1); if (m % 10 === 0) txt(c, `${m} mm`, x0 + m * pxmm, y2 + 26, C.axis); }
      const step = .01 * G * pxmm; ln(c, x0, y1, Math.min(w - 20, x0 + 100 * step), y1, C.cyan, 2);
      for (let k = 0; k <= 100 && x0 + k * step < w - 20; k++) ln(c, x0 + k * step, y1, x0 + k * step, y1 - (k % 10 ? 8 : 18), C.cyan, k % 10 ? 1 : 2);
      txt(c, 'Obyekt-mikrometr tasviri (1 bo‘lak = 0,01 mm)', x0, y1 - 28, C.cyan, 'left'); txt(c, '25 sm masofadagi millimetrli shkala', x0, y2 + 46, C.text, 'left');
      const dmin = .61 * .55 / P.NA;
      return { 'Γ_ob = Δ/f_ob': fx(Gob, 1), 'Γ_ok = 250 mm/f_ok': fx(Gok, 1), 'Γ = Γ_ob·Γ_ok': fx(G, 0), '10 bo‘lak (0,1 mm) ko‘rinadi, mm': fx(.1 * G, 1), 'd_min = 0,61λ/NA (550 nm), mkm': fx(dmin, 2), 'Foydali Γ (500–1000)·NA': `${fx(500 * P.NA, 0)}–${fx(1000 * P.NA, 0)}` };
    }
  };

  /* 26 — Difraksion panjara */
  const SRC = { 'He-Ne lazer 633 nm': [632.8], 'Qizil lazer 650 nm': [650], 'Yashil lazer 532 nm': [532], 'Oq yorug‘lik': lin(400, 700, 31) };
  S.grating = {
    title: 'Difraksion panjara: ekrandagi manzara',
    params: [
      { k: 'N0', l: 'Shtrixlar zichligi, 1/mm', min: 50, max: 600, step: 10, v: 100 },
      { k: 'src', l: 'Manba', type: 'sel', opts: Object.keys(SRC), v: 'He-Ne lazer 633 nm' },
      { k: 'L', l: 'Panjara–ekran masofasi L, m', min: .3, max: 2, step: .01, v: 1 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), d = 1e-3 / P.N0, wls = SRC[P.src], white = wls.length > 1, span = .6;
      const X = x => w / 2 + x / span * (w / 2 - 20), y = h * .45;
      c.fillStyle = '#020617'; c.fillRect(10, y - 40, w - 20, 80);
      for (let x = -span; x <= span + 1e-9; x += .1) { ln(c, X(x), y + 44, X(x), y + 52, C.axis, 1); txt(c, `${fx(x * 100, 0)}`, X(x), y + 66, C.axis); }
      txt(c, 'x, sm', w - 30, y + 66, C.axis);
      wls.forEach(wl => { for (let k = -6; k <= 6; k++) { const s = k * wl * 1e-9 / d; if (Math.abs(s) >= 1) continue; const x = P.L * Math.tan(Math.asin(s)); if (Math.abs(x) > span) continue; c.fillStyle = wlRGB(wl, white ? .55 : Math.max(.35, 1 - Math.abs(k) * .12)); c.beginPath(); c.ellipse(X(x), y, white ? 3 : 6, white ? 34 : 14, 0, 0, 7); c.fill(); } });
      if (white) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(X(0), y, 5, 34, 0, 0, 7); c.fill(); }
      const wl = wls[0], s1 = wl * 1e-9 / d, x1 = P.L * Math.tan(Math.asin(Math.min(s1, .999)));
      return white ? { 'Davr d, mkm': fx(d * 1e6, 3), '1-tartib 400 nm, sm': fx(P.L * Math.tan(Math.asin(4e-7 / d)) * 100, 2), '1-tartib 700 nm, sm': fx(P.L * Math.tan(Math.asin(Math.min(7e-7 / d, .999))) * 100, 2), 'k_max (700 nm)': Math.floor(d / 7e-7 - 1e-9) }
        : { 'Davr d, mkm': fx(d * 1e6, 3), 'x₁ (1-tartib), sm': s1 < 1 ? fx(x1 * 100, 2) : '—', 'φ₁, °': s1 < 1 ? fx(deg(Math.asin(s1)), 2) : '—', 'λ = d·sin(arctg(x₁/L)), nm': s1 < 1 ? fx(d * Math.sin(Math.atan(x1 / P.L)) * 1e9, 1) : '—', 'k_max': Math.floor(d / (wl * 1e-9) - 1e-9), 'R = kN (1-tartib, 1 sm yoritilgan)': fx(P.N0 * 10, 0) };
    }
  };

  /* 27 — Ko'p tirqishli difraksiya */
  S.slits = {
    title: 'N tirqishda difraksiya: intensivlik profili',
    params: [
      { k: 'N', l: 'Tirqishlar soni N', min: 1, max: 8, step: 1, v: 2 },
      { k: 'b', l: 'Tirqish kengligi b, mm', min: .02, max: .2, step: .005, v: .05 },
      { k: 'd', l: 'Tirqishlar davri d, mm', min: .1, max: .6, step: .01, v: .25 },
      { k: 'wl', l: 'To‘lqin uzunligi λ, nm', min: 400, max: 700, step: 1, v: 650 },
      { k: 'L', l: 'Masofa L, m', min: .5, max: 3, step: .05, v: 2 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), lam = P.wl * 1e-9, b = P.b / 1000, d = P.d / 1000;
      const I = x => { const s = Math.sin(Math.atan(x / P.L)), be = Math.PI * b * s / lam, ga = Math.PI * d * s / lam; const f1 = Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2; const sg = Math.sin(ga); const f2 = Math.abs(sg) < 1e-9 ? P.N * P.N : (Math.sin(P.N * ga) / sg) ** 2; return f1 * f2 / (P.N * P.N); };
      const xm = .04, xs = lin(-xm, xm, 1400);
      // kamera tasviri
      for (let i = 0; i < w - 20; i++) { const x = -xm + 2 * xm * i / (w - 20), v = Math.min(1, Math.sqrt(I(x))); c.fillStyle = wlRGB(P.wl, v); c.fillRect(10 + i, 8, 1, 46); }
      plot(c, [0, 60, w, h - 60], { xr: [-xm * 1000, xm * 1000], yr: [0, 1.05], xl: 'x, mm', yl: 'I / I_max', series: [{ pts: xs.map(x => [x * 1000, I(x)]), c: wlRGB(P.wl), w: 1.8 }, { pts: xs.map(x => { const s = Math.sin(Math.atan(x / P.L)), be = Math.PI * b * s / lam; return [x * 1000, Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2]; }), c: '#64748b', dash: [5, 4] }] });
      const ratio = P.d / P.b, miss = Math.abs(ratio - Math.round(ratio)) < .02 ? `${Math.round(ratio)}, ${2 * Math.round(ratio)}, …` : 'yo‘q';
      return { 'Polosalar oralig‘i λL/d, mm': fx(lam * P.L / d * 1000, 2), 'O‘ram 1-minimumi λL/b, mm': fx(lam * P.L / b * 1000, 1), 'd/b': fx(ratio, 2), 'Yo‘qoladigan tartiblar': miss, 'Bosh maksimumlar orasidagi minimumlar': Math.max(P.N - 1, 0) };
    }
  };

  /* 28–29 — Nyuton halqalari */
  const newtonSim = def => ({
    title: 'Nyuton halqalari',
    params: [
      { k: 'R', l: 'Linza egrilik radiusi R, m', min: .3, max: 3, step: .01, v: 1 },
      { k: 'wl', l: 'To‘lqin uzunligi λ, nm', min: 400, max: 700, step: 1, v: 589 },
      { k: 'mode', l: 'Kuzatish', type: 'sel', opts: ['Qaytgan yorug‘lik', 'O‘tgan yorug‘lik'], v: def },
      { k: 'k', l: 'Halqa raqami k', min: 1, max: 15, step: 1, v: 5 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), lam = P.wl * 1e-9, refl = P.mode.startsWith('Qayt');
      const Ir = r => { const hh = r * r / (2 * P.R), s = Math.sin(2 * Math.PI * hh / lam) ** 2; return refl ? s : 1 - .16 * s; };
      const sz = Math.min(w * .45, h - 20), cx = 10 + sz / 2, cy = h / 2, rmax = Math.sqrt(16 * P.R * lam);
      const dpr = cv.width / w, px = Math.round(sz * dpr), img = c.createImageData(px, px), [R0, G0, B0] = wlRGB(P.wl).match(/\d+/g).map(Number);
      for (let j = 0; j < px; j++) for (let i = 0; i < px; i++) { const r = Math.hypot(i - px / 2, j - px / 2) / (px / 2) * rmax, v = Ir(r), p = 4 * (j * px + i); img.data[p] = R0 * v; img.data[p + 1] = G0 * v; img.data[p + 2] = B0 * v; img.data[p + 3] = 255; }
      c.putImageData(img, Math.round((cx - sz / 2) * dpr), Math.round((cy - sz / 2) * dpr));
      const rk = Math.sqrt(P.k * P.R * lam), rs = lin(0, rmax, 500);
      plot(c, [w * .5, 0, w * .5, h], { xr: [0, rmax * 1000], yr: [0, 1.05], xl: 'r, mm', yl: 'I', series: [{ pts: rs.map(r => [r * 1000, Ir(r)]), c: wlRGB(P.wl), w: 1.8 }], vl: [{ x: rk * 1000, l: `r_${P.k}`, c: C.amber }] });
      return { [refl ? 'k-qorong‘i halqa r = √(kRλ), mm' : 'k-yorug‘ halqa r = √(kRλ), mm']: fx(rk * 1000, 3), 'Diametr D_k, mm': fx(2 * rk * 1000, 3), 'D_k², mm²': fx(4 * rk * rk * 1e6, 3), 'Markaz': refl ? 'qorong‘i' : 'yorug‘', 'Kontrast': refl ? 'yuqori' : 'past (≈ 8 %)' };
    }
  });
  S.newton = newtonSim('Qaytgan yorug‘lik');
  S.newtonT = newtonSim('O‘tgan yorug‘lik');

  /* 30 — Chiziqli spektrlar */
  const LINES = {
    'Vodorod (H)': [[656.3, 1], [486.1, .5], [434.0, .3], [410.2, .2]],
    'Geliy (He)': [[447.1, .5], [471.3, .2], [492.2, .2], [501.6, .5], [587.6, 1], [667.8, .5], [706.5, .4]],
    'Natriy (Na)': [[589.0, 1], [589.6, .9], [568.8, .15], [498.3, .1], [616.1, .1]],
    'Simob (Hg)': [[404.7, .5], [435.8, .9], [546.1, 1], [577.0, .6], [579.1, .6]],
    'Neon (Ne)': [[540.1, .3], [585.2, .8], [588.2, .4], [594.5, .5], [607.4, .5], [614.3, .6], [621.7, .4], [626.6, .5], [633.4, .6], [640.2, 1], [650.7, .6], [659.9, .4], [692.9, .3], [703.2, .4]]
  };
  S.spectra = {
    title: 'Spektroskop: chiziqli nurlanish spektrlari',
    params: [
      { k: 'el', l: 'Manba', type: 'sel', opts: Object.keys(LINES), v: 'Vodorod (H)' },
      { k: 'p', l: 'Ko‘rsatkich (baraban) holati, nm', min: 380, max: 750, step: .1, v: 656.3 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), X = l => 20 + (w - 40) * (l - 380) / 370, y0 = 30, hh = h * .45;
      c.fillStyle = '#020617'; c.fillRect(20, y0, w - 40, hh);
      LINES[P.el].forEach(([l, a]) => { c.fillStyle = wlRGB(l, Math.min(1, .35 + .65 * a)); c.fillRect(X(l) - 1.5, y0, 3, hh); });
      ln(c, X(P.p), y0 - 10, X(P.p), y0 + hh + 10, '#fff', 1.5);
      for (let l = 400; l <= 750; l += 50) { ln(c, X(l), y0 + hh + 12, X(l), y0 + hh + 20, C.axis, 1); txt(c, `${l}`, X(l), y0 + hh + 34, C.axis); }
      for (let l = 380; l <= 750; l += 2) { c.fillStyle = wlRGB(l, .9); c.fillRect(X(l), h - 30, Math.max(1, X(l + 2) - X(l)), 10); }
      txt(c, 'λ, nm', w - 30, y0 + hh + 34, C.axis);
      const near = LINES[P.el].reduce((b, x) => (Math.abs(x[0] - P.p) < Math.abs(b[0] - P.p) ? x : b));
      const o = { 'Eng yaqin chiziq, nm': fx(near[0], 1), 'Ko‘rsatkichdan farq, nm': fx(P.p - near[0], 1), 'Nisbiy yorqinlik': fx(near[1], 2), 'Foton energiyasi, eV': fx(1239.84 / near[0], 3) };
      if (P.el.startsWith('Vodorod')) { const m = { 656.3: 3, 486.1: 4, 434.0: 5, 410.2: 6 }[near[0]]; o['Balmer: m → 2'] = `${m} → 2`; o['R_H = 1/[λ(1/4 − 1/m²)], m⁻¹'] = sci(1 / (near[0] * 1e-9 * (.25 - 1 / (m * m))), 4); }
      return o;
    }
  };

  /* 31 — Malyus qonuni */
  S.malus = {
    title: 'Malyus qonuni',
    params: [
      { k: 'phi', l: 'Analizator burchagi φ, °', min: 0, max: 360, step: 1, v: 0 },
      { k: 'I0', l: 'Maksimal intensivlik I_max, mkA', min: 10, max: 100, step: 1, v: 80 },
      { k: 'Pd', l: 'Qutblanish darajasi P', min: .5, max: 1, step: .005, v: .975 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), Imin = P.I0 * (1 - P.Pd) / (1 + P.Pd), I = f => Imin + (P.I0 - Imin) * Math.cos(rad(f)) ** 2;
      const cx = w * .14, cy = h / 2, r = Math.min(w * .1, h * .3);
      [[cx, 0, 'polyarizator'], [cx + r * 2.6, P.phi, 'analizator']].forEach(([x, a, l]) => { circ(c, x, cy, r, '#475569', 'rgba(148,163,184,.08)'); const t = rad(a) - Math.PI / 2; ln(c, x - r * .8 * Math.cos(t), cy - r * .8 * Math.sin(t), x + r * .8 * Math.cos(t), cy + r * .8 * Math.sin(t), C.amber, 3); txt(c, l, x, cy + r + 16, C.text); });
      const fs = lin(0, 360, 361);
      plot(c, [w * .4, 0, w * .6, h], { xr: [0, 360], yr: [0, P.I0 * 1.08], xl: 'φ, °', yl: 'I, mkA', nx: 8, series: [{ pts: fs.map(f => [f, I(f)]), c: C.cyan, w: 2.5 }], marks: [{ x: P.phi, y: I(P.phi), c: C.amber }] });
      return { 'I(φ), mkA': fx(noisy(I(P.phi), .005), 1), 'cos²φ': fx(Math.cos(rad(P.phi)) ** 2, 3), 'I/I_max': fx(I(P.phi) / P.I0, 3), 'I_min, mkA': fx(Imin, 2), 'Bryuster burchagi (n = 1,52), °': fx(deg(Math.atan(1.52)), 1) };
    }
  };

  /* 32 — Buger–Lambert qonuni */
  S.bouguer = {
    title: 'Buger–Lambert–Ber qonuni',
    params: [
      { k: 'a', l: 'Yutilish koeffitsiyenti α, sm⁻¹', min: .05, max: 2, step: .01, v: .51 },
      { k: 'd', l: 'Qalinlik d, sm', min: 0, max: 5, step: .05, v: 1 },
      { k: 'c', l: 'Nisbiy konsentratsiya c/c₀', min: .25, max: 3, step: .05, v: 1 },
      { k: 'rf', l: 'Sirtlardan qaytish', type: 'sel', opts: ['Hisobga olinmaydi', 'Hisobga olinadi (2 × 4,3 %)'], v: 'Hisobga olinmaydi' }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), ae = P.a * P.c, K = P.rf.startsWith('Hisobga olinadi') ? (1 - .043) ** 2 : 1;
      const T = d => (d > 0 ? K : 1) * Math.exp(-ae * d), ds = lin(0, 5, 200);
      plot(c, [0, 0, w * .5, h], { xr: [0, 5], yr: [0, 1.02], xl: 'd, sm', yl: 'T = I/I₀', series: [{ pts: ds.map(d => [d, T(d)]), c: C.cyan, w: 2.5 }], marks: [{ x: P.d, y: T(P.d), c: C.amber }] });
      plot(c, [w * .51, 0, w * .49, h], { xr: [0, 5], yr: [Math.log(T(5)) - .3, .2], xl: 'd, sm', yl: 'ln T', series: [{ pts: ds.filter(d => d > 0).map(d => [d, Math.log(T(d))]), c: C.amber, w: 2.5 }], marks: P.d > 0 ? [{ x: P.d, y: Math.log(T(P.d)), c: C.green }] : [] });
      const t = T(P.d);
      return { 'O‘tkazish T': fx(t, 4), 'Optik zichlik D = lg(1/T)': fx(-Math.log10(t), 3), 'α_eff = α·c/c₀, sm⁻¹': fx(ae, 3), 'Yarim yutilish qalinligi, sm': fx(Math.LN2 / ae, 2), 'ln T ning d = 0 dagi kesishmasi': fx(Math.log(K), 3) };
    }
  };

  /* 33 — Rangli eritmalarning yutilish spektri */
  const g = (l, l0, s) => Math.exp(-(((l - l0) / s) ** 2));
  const DYE = {
    'KMnO₄': { eps: l => 1700 * g(l, 507, 12) + 2400 * g(l, 526, 13) + 2350 * g(l, 546, 12) + 1200 * g(l, 566, 11) + 300 * g(l, 530, 45), u: 1e-4, un: '10⁻⁴ mol/L' },
    'CuSO₄': { eps: l => 12 * g(l, 810, 140) + .2, u: .02, un: '0,02 mol/L' },
    'K₂Cr₂O₇': { eps: l => 3150 * g(l, 350, 30) + 370 * g(l, 440, 45), u: 1e-3, un: '10⁻³ mol/L' }
  };
  S.absspec = {
    title: 'Rangli eritmaning yutilish spektri',
    params: [
      { k: 'dye', l: 'Eritma', type: 'sel', opts: Object.keys(DYE), v: 'KMnO₄' },
      { k: 'c', l: 'Konsentratsiya (birlikda)', min: .2, max: 5, step: .05, v: 1 },
      { k: 'l', l: 'Kyuveta uzunligi l, sm', min: .5, max: 5, step: .1, v: 1 },
      { k: 'p', l: 'Filtr (to‘lqin uzunligi), nm', min: 380, max: 780, step: 1, v: 525 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), D = DYE[P.dye], A0 = l => D.eps(l) * P.c * D.u * P.l, ls = lin(380, 780, 400);
      let R = 0, G = 0, B = 0, n = 0; ls.forEach(l => { const t = 10 ** -A0(l), [r, gg, b] = wlRGB(l).match(/\d+/g).map(Number); R += r * t; G += gg * t; B += b * t; n++; });
      const mx = Math.max(R, G, B, 1), col = `rgb(${Math.round(255 * R / mx * Math.min(1, R / n / 60 + .2))},${Math.round(255 * G / mx * Math.min(1, G / n / 60 + .2))},${Math.round(255 * B / mx * Math.min(1, B / n / 60 + .2))})`;
      box(c, w - 90, 30, 60, 90, '#94a3b8', col); txt(c, 'eritma rangi', w - 60, 136, C.text);
      const am = Math.max(...ls.map(A0));
      plot(c, [0, 0, w - 110, h], { xr: [380, 780], yr: [0, am * 1.15 + .05], xl: 'λ, nm', yl: 'D (optik zichlik)', series: [{ pts: ls.map(l => [l, A0(l)]), c: C.violet, w: 2.5 }], vl: [{ x: P.p, c: wlRGB(P.p) }], marks: [{ x: P.p, y: A0(P.p), c: C.amber }] });
      const lmax = ls.reduce((b, l) => (A0(l) > A0(b) ? l : b), 380);
      return { 'D(λ_filtr)': fx(A0(P.p), 3), 'T(λ_filtr), %': fx(10 ** -A0(P.p) * 100, 1), 'Yutilish maksimumi, nm': fx(lmax, 0), 'ε(λ), L/(mol·sm)': fx(D.eps(P.p), 0), 'Konsentratsiya birligi': D.un };
    }
  };

  /* 34 — Optik faollik (qand eritmasi) */
  const SW = { 'Qizil 656 nm': 656, 'Sariq 589 nm': 589, 'Yashil 546 nm': 546, 'Ko‘k 486 nm': 486 };
  S.sugar = {
    title: 'Qand eritmasida qutblanish tekisligining burilishi',
    params: [
      { k: 'c', l: 'Konsentratsiya c, g/ml', min: 0, max: .3, step: .005, v: .1 },
      { k: 'l', l: 'Naycha uzunligi l, dm', min: .5, max: 4, step: .5, v: 2 },
      { k: 'wl', l: 'Yorug‘lik', type: 'sel', opts: Object.keys(SW), v: 'Sariq 589 nm' },
      { k: 'an', l: 'Analizator burchagi, °', min: -90, max: 90, step: .5, v: 0 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), wl = SW[P.wl], al = 66.5 * (589 / wl) ** 2, phi = al * P.c * P.l;
      const I = (a, p) => Math.cos(rad(a - p)) ** 2, as = lin(-90, 90, 361);
      plot(c, [0, 0, w, h], { xr: [-90, 90], yr: [0, 1.05], xl: 'Analizator burchagi, °', yl: 'I / I_max', series: [{ pts: as.map(a => [a, I(a, 0)]), c: '#64748b', dash: [5, 4] }, { pts: as.map(a => [a, I(a, phi)]), c: wlRGB(wl), w: 2.5 }], vl: [{ x: phi, l: 'φ', c: C.amber }], marks: [{ x: P.an, y: I(P.an, phi), c: C.amber }], legend: [{ c: '#64748b', l: 'suv (φ = 0)' }, { c: wlRGB(wl), l: 'eritma' }] });
      return { 'Burilish φ = [α]cl, °': fx(phi, 2), '[α](λ), °·ml/(g·dm)': fx(al, 1), 'I(analizator)/I_max': fx(I(P.an, phi), 3), 'c = φ/([α]l), g/L': fx(phi / (al * P.l) * 1000, 1) };
    }
  };

  /* 35 — Plastinalar to'plamining o'tkazishi */
  S.transmit = {
    title: 'Shaffof plastinalar to‘plami: o‘tkazish',
    params: [
      { k: 'n', l: 'Sindirish ko‘rsatkichi n', min: 1.3, max: 2.5, step: .01, v: 1.52 },
      { k: 'N', l: 'Plastinalar soni N', min: 1, max: 10, step: 1, v: 5 },
      { k: 'a', l: 'Yutilish koeffitsiyenti α, sm⁻¹', min: 0, max: .5, step: .01, v: 0 },
      { k: 'd', l: 'Bitta plastina qalinligi, mm', min: 1, max: 10, step: .5, v: 2 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), R = ((P.n - 1) / (P.n + 1)) ** 2, T = N => (1 - R) / (1 + (2 * N - 1) * R) * Math.exp(-P.a * N * P.d / 10);
      const Ns = range(1, 10);
      plot(c, [0, 0, w * .5, h], { xr: [0, 10.5], yr: [0, 1.02], xl: 'N', yl: 'T_N', series: [{ pts: [[0, 1]].concat(Ns.map(N => [N, T(N)])), c: C.cyan, w: 2.5 }], marks: Ns.map(N => ({ x: N, y: T(N), c: N === P.N ? C.amber : C.cyan, r: N === P.N ? 6 : 3 })) });
      plot(c, [w * .51, 0, w * .49, h], { xr: [0, 10.5], yr: [.9, 1 / T(10) * 1.05], xl: 'N', yl: '1/T_N', series: [{ pts: Ns.map(N => [N, 1 / T(N)]), c: C.amber, w: 2.5 }], marks: [{ x: P.N, y: 1 / T(P.N), c: C.green }] });
      return { 'Bitta sirtdan qaytish R, %': fx(R * 100, 2), 'T_N': fx(T(P.N), 4), 'Yo‘qotish, %': fx((1 - T(P.N)) * 100, 1), 'Faqat qaytish hissasi, %': fx((1 - (1 - R) / (1 + (2 * P.N - 1) * R)) * 100, 1), '1/T_N qiyaligi 2R/(1−R)': fx(2 * R / (1 - R), 4) };
    }
  };

  /* 36 — Max–Zender interferometri */
  S.mz = {
    title: 'Max–Zender interferometri: gaz kamerasi',
    params: [
      { k: 'l', l: 'Kamera uzunligi l, sm', min: 1, max: 10, step: .1, v: 5 },
      { k: 'p', l: 'Kameradagi bosim p, kPa', min: 0, max: 101.3, step: .1, v: 101.3 },
      { k: 'wl', l: 'To‘lqin uzunligi λ, nm', min: 400, max: 700, step: .1, v: 632.8 }
    ],
    draw(cv, P) {
      const { c, w, h } = ctx2d(cv), n0 = 2.73e-4, p0 = 101.3, dN = P.l / 100 * n0 * (p0 - P.p) / p0 / (P.wl * 1e-9);
      // sxema
      const s = Math.min(w * .4, h * .8), x0 = 20, y0 = h * .15, col = wlRGB(P.wl);
      const pA = [x0 + s * .15, y0 + s * .15], pB = [x0 + s * .85, y0 + s * .15], pC = [x0 + s * .15, y0 + s * .75], pD = [x0 + s * .85, y0 + s * .75];
      ln(c, x0, pA[1], pA[0], pA[1], col, 2.5); ln(c, ...pA, ...pB, col, 2); ln(c, ...pA, ...pC, col, 2); ln(c, ...pB, ...pD, col, 2); ln(c, ...pC, ...pD, col, 2); ln(c, ...pD, pD[0] + s * .15, pD[1], col, 2);
      [[pA, 'BS'], [pD, 'BS'], [pB, 'K'], [pC, 'K']].forEach(([p, t]) => { ln(c, p[0] - 10, p[1] + 10, p[0] + 10, p[1] - 10, t === 'BS' ? '#93c5fd' : '#e2e8f0', 4); });
      box(c, (pA[0] + pB[0]) / 2 - s * .18, pA[1] - 9, s * .36, 18, '#94a3b8', `rgba(56,189,248,${.05 + .25 * P.p / p0})`); txt(c, `kamera, p = ${fx(P.p, 1)} kPa`, (pA[0] + pB[0]) / 2, pA[1] - 16, C.text);
      // polosalar
      const fx0 = w * .5, fw = w * .48, fy = h * .2, fh = h * .6, frac = dN % 1;
      for (let i = 0; i < fw; i++) { const v = .5 + .5 * Math.cos(2 * Math.PI * (i / fw * 6 - frac)); c.fillStyle = wlRGB(P.wl, v); c.fillRect(fx0 + i, fy, 1, fh); }
      ln(c, fx0 + fw / 12, fy - 8, fx0 + fw / 12, fy + fh + 8, '#fff', 1.5); txt(c, `ΔN = ${fx(dN, 2)}`, fx0 + fw / 2, fy + fh + 24, C.amber, 'center', 14);
      return { 'Siljigan polosalar ΔN': fx(dN, 2), 'n(p) − 1': sci(n0 * P.p / p0, 3), 'n₀ − 1 = ΔNλp₀/(lΔp)': P.p < p0 ? sci(dN * P.wl * 1e-9 * p0 / (P.l / 100 * (p0 - P.p)), 3) : '—', 'To‘liq vakuumgacha polosalar': fx(P.l / 100 * n0 / (P.wl * 1e-9), 1) };
    }
  };

  /* ---------- Simulyator konteynerini qurish ---------- */
  function build(box) {
    const key = box.dataset.sim, sim = S[key]; if (!sim) return;
    const id = `${key}-${Math.random().toString(36).slice(2, 7)}`;
    const ctrls = sim.params.map(p => {
      if (p.type === 'sel') return `<label class="control">${A(p.l)}<select data-k="${p.k}">${p.opts.map(o => `<option value="${o}"${o === p.v ? ' selected' : ''}>${A(o)}</option>`).join('')}</select></label>`;
      return `<label class="control">${A(p.l)} <output data-o="${p.k}"></output><input type="range" data-k="${p.k}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.v}"></label>`;
    }).join('');
    box.innerHTML = `<div class="sim-layout"><div class="card controls"><h3>${A(sim.title)}</h3>${ctrls}<div class="actions"><button class="secondary" type="button" data-reset>${A('Boshlang‘ich qiymatlar')}</button></div><div class="readout" aria-live="polite"></div></div><div class="card canvas-card"><div class="toolbar"><span>${A(sim.title)}</span><span class="stat notranslate">virtual laboratoriya</span></div><canvas id="${id}" role="img" aria-label="${A(sim.title)}"></canvas></div></div>`;
    const cv = box.querySelector('canvas'), ro = box.querySelector('.readout');
    const read = () => { const P = {}; box.querySelectorAll('[data-k]').forEach(el => { const p = sim.params.find(x => x.k === el.dataset.k); P[p.k] = p.type === 'sel' ? el.value : (p.log ? 10 ** +el.value : +el.value); const o = box.querySelector(`[data-o="${p.k}"]`); if (o) o.textContent = p.log ? sci(10 ** +el.value, 1) : (+el.value).toString(); }); return P; };
    const render = (dt) => { const r = sim.draw(cv, read(), dt || 0); ro.innerHTML = Object.entries(r || {}).map(([k, v]) => `<span>${A(k)}</span><b>${A(v)}</b>`).join(''); };
    box.addEventListener('input', () => render()); box.addEventListener('change', () => render());
    box.querySelector('[data-reset]').addEventListener('click', () => { box.querySelectorAll('[data-k]').forEach(el => { const p = sim.params.find(x => x.k === el.dataset.k); el.value = p.v; }); render(); });
    window.addEventListener('resize', () => render());
    render();
    if (sim.anim) { let last = performance.now(), vis = true; new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(box); const loop = now => { if (vis) render(Math.min((now - last) / 1000, .1)); last = now; requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  window.YAF_SIMS = S;
  const init = () => document.querySelectorAll('.sim-box[data-sim]').forEach(build);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
