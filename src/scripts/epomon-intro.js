
(() => {
  const intro = document.getElementById('intro');
  const stage = document.getElementById('stage');
  const bot = document.getElementById('bot');
  const signal = document.getElementById('signal');
  const shadow = document.getElementById('shadow');
  const zzzt = document.getElementById('zzzt');
  const label = document.getElementById('label');
  const replay = document.getElementById('replay');
  const soundBtn = document.getElementById('sound');
  const layers = { title: document.getElementById('title'), friends: document.getElementById('friends'), agents: document.getElementById('agents') };
  const cvs = [document.getElementById('tapeBack'), document.getElementById('tapeFront')];
  const ctxs = cvs.map(c => c.getContext('2d'));
  const root = intro;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = motion.matches;
  const pause = document.getElementById('pause');
  let paused = false;

  // ---------- two compositions of the same scene ----------
  // World units are the drawing's own pixels. VX is the world x at the stage's left edge.
  const LAYOUTS = {
    // phones and narrow windows: title, friends and AGENTS stacked, Perpleckcity lands in the gap
    tall: {
      W: 940, H: 1390, VX: 0, maxw: '640px',
      pos: { title: [164, 24], friends: [10, 205], agents: [55, 1010] },
      T: { aEnd: 4.4, flip: 4.7, cStart: 5.0, cEnd: 7.4, drop: 8.4, land: 8.95, settle: 9.4, z: 9.6 },
      back: (o) => [[800, 110], [640, 170], [330, 420], [o, 460]], sBack: [0.22, 0.45], backDip: 470,
      front: (o, h) => [[o, 860], [-20, 900], [150, 790], h], sFront: [0.55, 0.85],
      HOVER: [262, 815], GROUND: 975, BACK_FLOOR: 470,
      zzzt: [372, 756, -6, 0.7], label: [380, 884, -2, 0.6], pileX: -118
    },
    // desktop: the original page, with room on the left where he stops short of the group
    wide: {
      W: 1760, H: 1040, VX: -320, maxw: '1480px',   // stage is symmetric around the drawing (centre x 560), so the group sits mid-screen
      pos: { title: [248, 31], friends: [102, 211], agents: [147, 734] },
      T: { aEnd: 5.8, flip: 6.1, cStart: 6.4, cEnd: 9.2, drop: 10.3, land: 10.85, settle: 11.3, z: 11.5 },
      back: (o) => [[1035, 190], [860, 215], [440, 330], [o, 300]], sBack: [0.12, 0.36],
      front: (o, h) => [[o, 640], [-260, 760], [-120, 700], h], sFront: [0.6, 0.95],
      HOVER: [-30, 548], GROUND: 735, BACK_FLOOR: 468,
      zzzt: [-262, 404, -6, 0.8], label: [-150, 772, -2, 0.62], pileX: -150
    }
  };
  let L = null, k = 1, m = 1, offLeft = -200;

  function pickLayout() {
    return (innerWidth >= 760 && innerWidth / innerHeight >= 1.05) ? LAYOUTS.wide : LAYOUTS.tall;
  }

  function layout() {
    const next = pickLayout();
    const changed = next !== L;
    L = next;
    if (changed) {
      root.style.setProperty('--arw', L.W);
      root.style.setProperty('--arh', L.H);
      root.style.setProperty('--maxw', L.maxw);
      root.style.setProperty('--vx', (-L.VX) + 'px');
      for (const [id, [x, y]] of Object.entries(L.pos)) { layers[id].style.left = x + 'px'; layers[id].style.top = y + 'px'; }
    }
    const r = stage.getBoundingClientRect();
    const ir = intro.getBoundingClientRect();
    k = r.width / L.W;
    // on small screens the tape and lettering grow relative to the drawing so they stay readable
    m = clamp(0.55 / k, 1, 1.6);
    root.style.setProperty('--k', k);
    const sx = r.left - ir.left, sy = r.top - ir.top;
    // dot centres: world x = 45i (friends layer is aligned to the page grid in both layouts)
    const gx = L === LAYOUTS.wide ? 0 : 27 - 119, gy = L === LAYOUTS.wide ? 29 : 14 - 126;
    root.style.setProperty('--dotx', (sx + ((((gx - L.VX) % 45) + 45) % 45 - 22.5) * k) + 'px');
    root.style.setProperty('--doty', (sy + (((gy % 45) + 45) % 45 - 22.5) * k) + 'px');
    offLeft = L.VX - r.left / k - 140;
    const [zx, zy, zr, zs] = L.zzzt, [lx, ly, lr, ls] = L.label;
    Object.assign(zzzt.style, { left: zx + 'px', top: zy + 'px', transform: `rotate(${zr}deg) scale(${zs * m})` });
    Object.assign(label.style, { left: lx + 'px', top: ly + 'px', transform: `rotate(${lr}deg) scale(${ls * Math.min(m, 1.35)})` });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.forEach((c, i) => {
      c.width = Math.max(1, Math.round(CW * k * dpr));
      c.height = Math.max(1, Math.round(CH * k * dpr));
      ctxs[i].setTransform(k * dpr, 0, 0, k * dpr, -CX0 * k * dpr, 0);
    });
    drawTape(simT);
    return changed;
  }
  const CX0 = -1400, CW = 2800, CH = 1390;

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeIO = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn2 = t => t * t;
  const bez = (p, t) => {
    const u = 1 - t;
    return [0, 1].map(i => u*u*u*p[0][i] + 3*u*u*t*p[1][i] + 3*u*t*t*p[2][i] + t*t*t*p[3][i]);
  };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  const PULSE = 0.7;
  const PORT = [88, 50];   // tape slot on the sphere, relative to the body centre

  let jit = { x: 0, y: 0, r: 0 }, lastJ = -1;
  function jitter(t, amt) {
    const f = Math.floor(t * 12);
    if (f !== lastJ) {
      lastJ = f;
      jit = { x: (Math.random() * 2 - 1) * amt, y: (Math.random() * 2 - 1) * amt, r: (Math.random() * 2 - 1) * amt * 0.35 };
    }
    return jit;
  }

  // Sets the bot's pose for time t and returns where its tape slot is.
  function frame(t) {
    const T = L.T, HOVER = L.HOVER, sEnd = L.sFront[1];
    const REST_Y = L.GROUND - 103 * sEnd / 0.95;
    let x, y, s, face = 1, front = false, rot = 0, sq = 1, j = 1.2, bobAmp, sig = 1, dim = 0, op = 1;
    let spool = 'travel', burst = 0;
    const bob = Math.sin(t * Math.PI * 2 * 0.55);

    if (t < T.cStart) {
      const u = seg(t, 0, T.aEnd);
      const p = bez(L.back(offLeft), easeIO(u));
      x = p[0]; y = p[1];
      s = lerp(L.sBack[0], L.sBack[1], u);
      bobAmp = 8 + 16 * s;
      op = seg(t, 0, 0.5);
      face = t < T.flip ? 1 : -1;
      if (t < 0.4) spool = 'off';
    } else if (t < T.drop) {
      front = true; face = -1;
      const u = seg(t, T.cStart, T.cEnd);
      const e = easeOut(u);
      const p = bez(L.front(offLeft, HOVER), e);
      x = p[0]; y = p[1];
      s = lerp(L.sFront[0], sEnd, e);
      bobAmp = 18;
      const d = seg(t, T.cEnd, T.drop);
      j = 1.2 + 4 * d;
      bobAmp *= 1 - 0.7 * d;
      if (d > 0) {
        sig = 0.4 + 0.3 * Math.sin(t * 4);
        spool = 'burst';
        burst = (Math.random() < 0.8 ? 950 : 160) * (1 - 0.2 * d);
      }
      dim = d * 0.4;
    } else {
      front = true; face = -1; s = sEnd; x = HOVER[0]; bobAmp = 0; sig = 0; j = 0;
      if (t < T.land) {
        const u = easeIn2(seg(t, T.drop, T.land));
        y = lerp(HOVER[1], REST_Y, u);
        rot = 6 * u;
      } else {
        const u = seg(t, T.land, T.settle);
        y = REST_Y - Math.sin(Math.PI * u) * 22 * (1 - u * 0.3);
        rot = lerp(6, 14, easeOut(u));
        sq = u < 0.18 ? lerp(0.86, 1, u / 0.18) : 1;
      }
      dim = 0.4 + 0.6 * seg(t, T.drop, T.land);
      const fade = 1 - seg(t, T.drop, T.land + 0.35);
      spool = fade > 0 ? 'burst' : 'off';
      burst = 600 * fade * (Math.random() < 0.7 ? 1 : 0.3);
    }

    const jj = jitter(t, j);
    y += bob * bobAmp;
    const bx = x + jj.x, by = y + jj.y;
    const sx = s * face * (2 - sq), sy = s * sq;
    const ang = (rot + jj.r) * Math.PI / 180;

    bot.style.opacity = op;
    bot.style.zIndex = front ? 4 : 1;
    bot.style.transform = `translate(${bx - 104}px, ${by - 207}px) rotate(${rot + jj.r}deg) scale(${sx}, ${sy})`;
    bot.style.filter = dim ? `brightness(${1 - dim * 0.1}) contrast(${1 - dim * 0.15})` : 'none';
    const p = (t * PULSE) % 1;
    signal.style.transform = `scale(${0.55 + 0.6 * easeOut(p)})`;
    signal.style.opacity = sig * Math.pow(1 - p, 1.3) * clamp(p / 0.12);

    if (front) {
      const height = clamp((L.GROUND - (by + 100 * s)) / 220);
      shadow.style.opacity = (0.35 + 0.65 * (1 - height)) * clamp((x - offLeft) / 300);
      shadow.style.transform = `translate(${bx}px, ${L.GROUND}px) scale(${s * (1 - 0.35 * height)}, ${s})`;
    } else {
      shadow.style.opacity = 0;
    }

    const z = seg(t, T.z, T.z + 0.9);
    zzzt.style.clipPath = `inset(0 ${100 - z * 100}% 0 0)`;
    zzzt.style.opacity = z < 1 ? 1 : 0.65 + 0.35 * Math.cos((t - T.z - 0.9) * 2.2);
    const lb = seg(t, T.z + 0.6, T.z + 1.9);
    label.style.clipPath = `inset(0 ${100 - lb * 100}% 0 0)`;
    replay.classList.toggle('show', t > T.z);

    const lx = PORT[0] * sx, ly = PORT[1] * sy;
    return {
      cx: bx + lx * Math.cos(ang) - ly * Math.sin(ang),
      cy: by + lx * Math.sin(ang) + ly * Math.cos(ang),
      dir: face, s, front, spool, burst, op
    };
  }

  // ---------- ticker tape: a rope that only resists stretching ----------
  const SP = 9;
  const G = 950;
  let nodes = [], spoolAcc = 0, lastC = null, nodeId = 0, rate = 0, pileN = 0;

  function resetTape() { nodes = []; spoolAcc = 0; lastC = null; nodeId = 0; rate = 0; pileN = 0; }

  function addNode(pose, vx, vy, dt) {
    const front = pose.front;
    const id = nodeId++;
    const pile = pose.spool === 'burst';
    let tx = 0, ty = 0;
    if (pile) {
      const q = pileN++, th = q * Math.PI * 2 / 30, R = (40 + 14 * Math.sin(q * 0.05)) * Math.min(m, 1.3);
      tx = L.HOVER[0] + L.pileX - q * 0.6 + Math.cos(th) * R;
      ty = L.GROUND + 6 + Math.sin(th) * R * 0.38 + (hash(q) - 0.5) * 6;
    }
    nodes.push({
      x: pose.cx, y: pose.cy, px: pose.cx - vx * dt, py: pose.cy - vy * dt,
      layer: front ? 1 : 0,
      tx, floor: pile ? ty : front ? L.GROUND - 8 + hash(id) * 34 : L.BACK_FLOOR - 6 + hash(id) * 16,
      pile, landed: false,
      brk: nodes.length > 0 && nodes[nodes.length - 1].layer !== (front ? 1 : 0),
      w: Math.max(7, 30 * pose.s) * m, id
    });
  }

  function step(dt, pose, t) {
    const C = [pose.cx, pose.cy];
    const speed = lastC ? Math.hypot(C[0] - lastC[0], C[1] - lastC[1]) / dt : 0;
    rate = pose.spool === 'off' ? 0 : pose.spool === 'burst' ? pose.burst : Math.min(speed, 900) * 1.02 + 22;
    if (pose.spool !== 'off' && !nodes.length) addNode(pose, 0, 0, dt);
    spoolAcc += rate * dt;
    while (spoolAcc >= SP && nodes.length) {
      spoolAcc -= SP;
      const a = nodeId * 0.33;
      const coil = pose.spool === 'burst' ? 230 + 90 * Math.sin(nodeId * 0.05) : 0;
      addNode(pose, pose.dir * 70 * pose.s + Math.cos(a) * coil, 10 + Math.sin(a) * coil * 0.45, dt);
    }
    if (nodes.length > 1400) nodes.splice(0, nodes.length - 1400);
    lastC = C;

    const n = nodes.length;
    if (!n) return;
    const g = G * dt * dt;
    for (let i = 0; i < n - 1; i++) {
      const p = nodes[i];
      const grounded = p.y >= p.floor - 0.5;
      if (grounded && !p.landed) p.landed = true;
      const drag = grounded ? 0.55 : 0.975;
      if (p.pile && p.landed) p.x += (p.tx - p.x) * 0.12;
      const vx = (p.x - p.px) * drag, vy = (p.y - p.py) * 0.975;
      p.px = p.x; p.py = p.y;
      p.x += vx + (grounded ? 0 : Math.sin(t * 3 + p.id * 0.7) * 0.05);
      p.y += vy + g;
    }
    const head = nodes[n - 1];
    head.x = C[0]; head.y = C[1]; head.px = C[0]; head.py = C[1];
    for (let it = 0; it < 10; it++) {
      for (let i = n - 1; i > 0; i--) {
        const a = nodes[i], b = nodes[i - 1];
        if (a.brk) continue;            // torn here: the back strip and the front strip are separate
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        // paper can't stretch, and resists folding flat on itself, so slack bends into loops
        const target = d > SP ? SP : d < SP * 0.8 ? SP * 0.8 : d;
        if (target !== d && d > 0.0001) {
          const f = (d - target) / d * (d > SP ? 1 : 0.35);
          if (i === n - 1) { b.x -= dx * f; b.y -= dy * f; }
          else { a.x += dx * f * 0.5; a.y += dy * f * 0.5; b.x -= dx * f * 0.5; b.y -= dy * f * 0.5; }
        }
      }
      for (let i = 0; i < n - 1; i++) { const p = nodes[i]; if (p.y > p.floor) p.y = p.floor; }
    }
  }

  // ---------- drawing the tape in pen ----------
  function drawTape(t) {
    ctxs.forEach(c => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); });
    const n = nodes.length;
    if (n < 2) return;
    const boil = Math.floor(t * 12);
    const L = [], R = [], tw = [];
    for (let i = 0; i < n; i++) {
      const a = nodes[nodes[i].brk ? i : Math.max(0, i - 1)];
      const b = nodes[i + 1 < n && !nodes[i + 1].brk ? i + 1 : i];
      if (a === b) { L.push(L[i - 1] || [nodes[i].x, nodes[i].y]); R.push(R[i - 1] || [nodes[i].x, nodes[i].y]); tw.push(0.5); continue; }
      let nx = -(b.y - a.y), ny = b.x - a.x;
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      const twist = 0.28 + 0.72 * Math.abs(Math.cos(i * 0.085 + 1.3));
      const h = nodes[i].w * twist / 2;
      const wx = (hash(nodes[i].id + boil * 13.1) - 0.5) * 0.9, wy = (hash(nodes[i].id * 3.7 + boil) - 0.5) * 0.9;
      const p = nodes[i];
      L.push([p.x + nx * h + wx, p.y + ny * h + wy]);
      R.push([p.x - nx * h + wx, p.y - ny * h + wy]);
      tw.push(twist);
    }
    const CHUNK = 14;
    let i = 0;
    while (i < n - 1) {
      const layer = nodes[i].layer;
      let j = i;
      while (j < n - 1 && j - i < CHUNK && nodes[j + 1].layer === layer && !nodes[j + 1].brk) j++;
      if (j === i) { i++; continue; }
      const c = ctxs[layer];
      const lw = Math.max(1.1, nodes[i].w * 0.1);
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(L[i][0], L[i][1]);
      for (let q = i + 1; q <= j; q++) c.lineTo(L[q][0], L[q][1]);
      for (let q = j; q >= i; q--) c.lineTo(R[q][0], R[q][1]);
      c.closePath();
      c.fillStyle = '#ffffff'; c.fill();
      c.strokeStyle = '#111111'; c.lineWidth = lw;
      c.beginPath(); c.moveTo(L[i][0], L[i][1]); for (let q = i + 1; q <= j; q++) c.lineTo(L[q][0], L[q][1]); c.stroke();
      c.beginPath(); c.moveTo(R[i][0], R[i][1]); for (let q = i + 1; q <= j; q++) c.lineTo(R[q][0], R[q][1]); c.stroke();
      // the little tick marks printed along the tape
      c.lineWidth = lw * 0.7;
      c.beginPath();
      for (let q = i; q <= j; q++) {
        if (nodes[q].id % 3 || tw[q] < 0.5) continue;
        const a0 = 0.18 + hash(nodes[q].id) * 0.12, a1 = 0.55 + hash(nodes[q].id + 9) * 0.2;
        c.moveTo(lerp(R[q][0], L[q][0], a0), lerp(R[q][1], L[q][1], a0));
        c.lineTo(lerp(R[q][0], L[q][0], a1), lerp(R[q][1], L[q][1], a1));
      }
      c.stroke();
      // torn end at the start of each strip
      if (i === 0 || nodes[i].brk) {
        const e = i, f1 = Math.min(n - 1, i + 1);
        c.lineWidth = lw;
        c.beginPath(); c.moveTo(L[e][0], L[e][1]);
        for (let z = 1; z <= 4; z++) {
          const f = z / 4, off = (z % 2 ? 1 : -1) * nodes[e].w * 0.18;
          const bx = lerp(L[e][0], R[e][0], f), by = lerp(L[e][1], R[e][1], f);
          const tx = nodes[e].x - nodes[f1].x, ty = nodes[e].y - nodes[f1].y, tl = Math.hypot(tx, ty) || 1;
          c.lineTo(bx + tx / tl * off, by + ty / tl * off);
        }
        c.stroke();
      }
      i = j;
    }
  }

  // ---------- dot matrix printer, synthesised ----------
  let actx = null, gainN = null, soundOn = false;
  function printerBuffer(ac) {
    const sr = ac.sampleRate, dur = 6, N = Math.floor(sr * dur);
    const buf = ac.createBuffer(1, N, sr), d = buf.getChannelData(0);
    const KL = Math.floor(sr * 0.005), ker = new Float32Array(KL);
    for (let i = 0; i < KL; i++) {
      const tt = i / sr;
      ker[i] = (Math.random() * 2 - 1) * Math.exp(-tt * 1500) * 0.55
             + Math.sin(2 * Math.PI * 2650 * tt) * Math.exp(-tt * 900) * 0.5
             + Math.sin(2 * Math.PI * 4200 * tt) * Math.exp(-tt * 1700) * 0.3;
    }
    const add = (t0, amp) => { const s0 = Math.floor(t0 * sr); for (let i = 0; i < KL && s0 + i < N; i++) d[s0 + i] += ker[i] * amp; };
    let t = 0.02;
    while (t < dur - 0.35) {
      const end = Math.min(t + 0.45 + Math.random() * 0.5, dur - 0.3);
      for (let ct = t; ct < end; ct += 1 / 50) {
        if (Math.random() < 0.18) continue;               // spaces
        const strikes = 5 + Math.floor(Math.random() * 6);
        for (let s = 0; s < strikes; s++) add(ct + s * (1 / 50 / strikes) + Math.random() * 0.0005, 0.4 + Math.random() * 0.6);
      }
      for (let i = Math.floor(t * sr); i < end * sr; i++) d[i] += Math.sin(2 * Math.PI * 118 * i / sr) * 0.035;   // head motor
      // carriage return: a whoosh then a thunk
      const cr = 0.17, s0 = Math.floor(end * sr);
      let lp = 0;
      for (let i = 0; i < cr * sr && s0 + i < N; i++) {
        const tau = i / sr, env = Math.sin(Math.PI * tau / cr);
        lp += ((Math.random() * 2 - 1) - lp) * 0.09;
        d[s0 + i] += lp * env * 0.55 + Math.sin(2 * Math.PI * (180 + 260 * tau / cr) * tau) * env * 0.06;
      }
      const s1 = Math.floor((end + cr) * sr);
      for (let i = 0; i < 0.09 * sr && s1 + i < N; i++) { const tau = i / sr; d[s1 + i] += Math.sin(2 * Math.PI * 85 * tau) * Math.exp(-tau * 38) * 0.4; }
      t = end + cr + 0.05;
    }
    let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(d[i]));
    for (let i = 0; i < N; i++) d[i] *= 0.9 / (pk || 1);
    return buf;
  }
  function startAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!actx) {
      actx = new AC();
      gainN = actx.createGain(); gainN.gain.value = 0; gainN.connect(actx.destination);
      const src = actx.createBufferSource();
      src.buffer = printerBuffer(actx); src.loop = true; src.connect(gainN); src.start();
    }
    actx.resume();
    return true;
  }
  function powerDown() {
    if (!soundOn || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain(), now = actx.currentTime;
    o.type = 'triangle';
    o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(55, now + 0.5);
    g.gain.setValueAtTime(0.18, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    o.connect(g).connect(actx.destination); o.start(now); o.stop(now + 0.6);
  }
  function setPrinterLevel() {
    if (!actx || !gainN) return;
    const target = soundOn ? clamp(rate / 500) * 0.5 : 0;
    gainN.gain.setTargetAtTime(target, actx.currentTime, 0.04);
  }

  // ---------- run loop ----------
  const DT = 1 / 60;
  const simEnd = () => L.T.settle + 4;
  let simT = 0, acc = 0, last = null, raf = 0, firedDown = false;

  function advance(to) {
    while (simT + DT <= to) {
      simT += DT;
      const pose = frame(simT);
      if (simT < simEnd()) step(DT, pose, simT);
      else rate = 0;
      if (!firedDown && simT >= L.T.drop) { firedDown = true; powerDown(); }
    }
  }
  function tick(now) {
    if (last === null) last = now;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    acc += dt;
    const steps = Math.floor(acc / DT);
    advance(simT + steps * DT + 1e-8);
    acc -= steps * DT;
    drawTape(simT);
    setPrinterLevel();
    if (simT < simEnd()) raf = requestAnimationFrame(tick);
    else { rate = 0; setPrinterLevel(); pause.textContent = "finished"; pause.disabled = true; }
  }
  function reset() { cancelAnimationFrame(raf); resetTape(); simT = 0; acc = 0; last = null; lastJ = -1; firedDown = false; }
  function play() { paused = false; pause.disabled = false; pause.textContent = "pause"; reset(); layout(); raf = requestAnimationFrame(tick); }
  function jumpTo(t) { reset(); layout(); advance(t); drawTape(simT); }

  addEventListener('resize', () => { if (layout()) (reduce ? jumpTo(simEnd()) : play()); });
  replay.addEventListener('click', () => reduce ? jumpTo(simEnd()) : play());
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && !startAudio()) soundOn = false;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = soundOn ? 'sound on' : 'sound off';
    if (soundOn && !reduce) play();          // start over so the printing is heard from the top
    else setPrinterLevel();
  });

  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'resume' : 'pause';
    if (paused) { cancelAnimationFrame(raf); rate = 0; setPrinterLevel(); }
    else { last = null; raf = requestAnimationFrame(tick); }
  });
  motion.addEventListener('change', () => {
    reduce = motion.matches;
    if (reduce) { jumpTo(simEnd()); pause.disabled = true; pause.textContent = 'still'; }
    else play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); rate = 0; setPrinterLevel(); }
    else if (!reduce && !paused && simT < simEnd()) { last = null; raf = requestAnimationFrame(tick); }
  });
  layout();
  if (reduce) { pause.disabled = true; pause.textContent = 'still'; }
  const freeze = /^#t(\d+(?:\.\d+)?)$/.exec(location.hash);   // e.g. #t9.5 holds one moment
  if (reduce) jumpTo(simEnd());
  else if (freeze) jumpTo(parseFloat(freeze[1]));
  else { frame(0.5); if (document.readyState === 'complete') play(); else addEventListener('load', play, { once: true }); }
})();
