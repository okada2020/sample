/* =========================================================================
   フルーツ転倒RTA  (Fruit Tumble RTA)
   果物を背負った少年が坂で一度だけ転ぶ。こぼれた果物は前を転がりながら
   ゲートをくぐるたびに増え、坂を駆け上がってくる動物の群れを食い止める壁になる。
   壁を抜かれると少年が転がされて時間を失う。ゴールまでのタイムを競う。
   キャラクターは assets/ のスプライト（採用デザイン）をそのまま使用。
   ========================================================================= */
(() => {
  'use strict';

  const cv   = document.getElementById('game');
  const ctx  = cv.getContext('2d');
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const card    = document.getElementById('card');
  const elStock = document.getElementById('stock');
  const elTimer = document.getElementById('timer');
  const elBest  = document.getElementById('best');
  const elBar   = document.getElementById('bar');
  const elHint  = document.getElementById('hint');

  let W = 0, H = 0, DPR = 1, FOCAL = 600, HORIZON = 200, VANISH = 300, camH = 3.2;
  const ROAD_HALF = 5, CAM_BACK = 6.5, SLOPE = 0.16, WALL = ROAD_HALF - 0.8;
  const LEAD = 5.4;                      // 果物の壁は少年のどれだけ前を転がるか

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const rnd   = (a, b) => a + Math.random() * (b - a);
  const rint  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick  = a => a[Math.floor(Math.random() * a.length)];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    FOCAL   = W * 0.72;
    camH    = Math.max(2.4, Math.min(9, (H * 0.40) / FOCAL * CAM_BACK));
    VANISH  = H * 0.34;
    HORIZON = Math.max(H * 0.04, VANISH - SLOPE * FOCAL);
    VANISH  = HORIZON + SLOPE * FOCAL;
  }
  window.addEventListener('resize', resize);

  function project(x, z, y) {
    const dz = z - S.camZ;
    if (dz < 0.8) return null;
    const s = FOCAL / dz;
    return { x: W / 2 + x * s, y: HORIZON + (camH + SLOPE * dz - (y || 0)) * s, s: s, dz: dz };
  }

  // ---------------------------------------------------------------- 素材
  const SPR = {};
  ['boy-back', 'boy-fall', 'bear', 'monkey', 'boar', 'uribou'].forEach(n => {
    const im = new Image(); im.src = 'assets/' + n + '.png'; SPR[n] = im;
  });

  const FRUITS = [
    { c: '#e33b2e', leaf: true  }, { c: '#f59322', leaf: false },
    { c: '#f5d63a', leaf: false }, { c: '#7b4ea8', leaf: true  },
    { c: '#4a9b46', leaf: false }, { c: '#f08fa0', leaf: true  },
  ];

  // 坂を駆け上がって向かってくる動物たち。1 匹あたりの必要数は小さく、数で押してくる。
  const ANIMALS = {
    uribou: { spr: 'uribou', h: 1.25, w: 0.8, cost: 2,  sp: 11, name: 'ウリ坊' },
    monkey: { spr: 'monkey', h: 1.65, w: 0.7, cost: 3,  sp: 13, name: 'サル' },
    boar:   { spr: 'boar',   h: 1.60, w: 1.4, cost: 6,  sp: 15, name: 'イノシシ' },
    bear:   { spr: 'bear',   h: 2.20, w: 1.0, cost: 12, sp: 9,  name: 'クマ' },
  };

  // ---------------------------------------------------------------- 状態
  const BEST_KEY = 'fruitrta.best';
  const S = {
    mode: 'title',                       // title | intro | play | goal
    time: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    boy: { x: 0, z: 0, state: 'run', t: 0 },
    crowd: { x: 0, count: 0 },           // 前を転がる果物の壁
    enemies: [], items: [], waves: [], scenery: [], pops: [],
    lane: 0, camZ: -CAM_BACK, shake: 0, flash: 0, keyDir: 0, clock: 0, spin: 0, broke: 0,
  };

  const OPS = [
    { k: 'mul', v: 2, label: '×2', good: true },
    { k: 'mul', v: 3, label: '×3', good: true },
    { k: 'mul', v: 2, label: '×2', good: true },
    { k: 'add', v: 20, label: '+20', good: true },
    { k: 'div', v: 2, label: '÷2', good: false },
    { k: 'div', v: 3, label: '÷3', good: false },
    { k: 'sub', v: 20, label: '-20', good: false },
    { k: 'sub', v: 35, label: '-35', good: false },
  ];
  function applyOp(n, op) {
    let r = n;
    if (op.k === 'mul') r = Math.round(n * op.v);
    else if (op.k === 'add') r = n + op.v;
    else if (op.k === 'sub') r = n - op.v;
    else r = Math.ceil(n / op.v);
    return clamp(r, 0, 9999);
  }

  // ---------------------------------------------------------------- コース
  function buildLane() {
    S.lane = 470;
    S.items = []; S.waves = []; S.enemies = [];
    // ゲート → 敵の波 → ゲート …… と交互に並べる。波はだんだん重くなる。
    // 波は「止めるのに必要な果物の総量」で決める。果物はゲートで倍々に増えるので、
    // 波の重さも倍々で追いかけさせる。見える匹数は最大 12 匹に抑え、
    // 足りない分は 1 匹あたりの重さ（＝体格）に寄せる。
    // 波の重さは「そのときの壁のおよそ 4 割」。ゲートで倍に増えても、
    // 1 回まずい側を選ぶと届かなくなる、という綱渡りの数字にしてある。
    // 波の重さは「そのときの壁のおよそ 4 割」。ゲートで倍に増えても、
    // 1 回まずい側を選ぶと届かなくなる、という綱渡りの数字にしてある。
    // 波の重さは「ゲートを正しく選び続けたときの壁のおよそ 45%」。
    // 正解を選び続ければ守り切れるが、1 回まずい側を踏むと次の波に届かなくなる。
    const plan = [
      { kind: 'uribou', total: 15 },  { kind: 'monkey', total: 21 },
      { kind: 'uribou', total: 28 },  { kind: 'boar',   total: 37 },
      { kind: 'monkey', total: 48 },  { kind: 'bear',   total: 63 },
      { kind: 'boar',   total: 83 },  { kind: 'monkey', total: 108 },
      { kind: 'bear',   total: 140 },
    ];
    let z = 48, i = 0;   // 最初のゲートまでは構える余裕を置く
    while (z < S.lane - 30 && i < plan.length) {
      S.items.push(makeGate(z));
      z += rnd(20, 26);
      const p = plan[i++];
      const base = ANIMALS[p.kind].cost;
      const n = clamp(Math.round(p.total / base), 3, 12);
      S.waves.push({ z: z, kind: p.kind, n: n, each: Math.ceil(p.total / n), fired: false });
      z += rnd(26, 34);
    }
    S.items.sort((a, b) => a.z - b.z);
    S.scenery = [];
    for (let k = 0; k < 90; k++)
      S.scenery.push({ z: rnd(6, S.lane + 40),
        x: (Math.random() < 0.5 ? -1 : 1) * rnd(ROAD_HALF + 1.4, ROAD_HALF + 14), h: rnd(2.4, 4.4) });
    S.scenery.sort((a, b) => a.z - b.z);
  }
  function makeGate(z) {
    const g = OPS.filter(o => o.good), b = OPS.filter(o => !o.good);
    let a = pick(g), c = Math.random() < 0.75 ? pick(b) : pick(g);
    if (Math.random() < 0.5) { const t = a; a = c; c = t; }
    return { type: 'gate', z: z, ops: [a, c], flash: 0 };
  }
  function spawnWave(w) {
    const d = ANIMALS[w.kind];
    const big = clamp(1 + Math.log2(w.each / d.cost) * 0.22, 1, 1.9);
    for (let i = 0; i < w.n; i++) {
      S.enemies.push({
        kind: w.kind, cost: w.each, big: big,
        z: w.z + 34 + rnd(0, 16) + i * 1.6,
        x: clamp(rnd(-WALL, WALL) + (i - w.n / 2) * 0.5, -WALL, WALL),
        sp: d.sp * rnd(0.85, 1.15), t: rnd(0, 6), dead: 0,
      });
    }
    pop(d.name + ' ×' + w.n + '（' + (w.each * w.n) + '個ぶん）', '#ffd166', 0, w.z + 26, 4.4);
    sfx(160, 0.22, 'square', 0.05, 110);
  }

  // ---------------------------------------------------------------- 効果
  function pop(text, color, x, z, y) { S.pops.push({ text: text, color: color, x: x, z: z, y: y || 2, t: 0 }); }
  let AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function sfx(f, dur, type, vol, to) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, a.currentTime);
    if (to) o.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.05, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.02);
  }

  // ---------------------------------------------------------------- 入力
  let dragging = false, dragX = 0, baseX = 0;
  stageEl.addEventListener('pointerdown', e => {
    audio();
    if (S.mode !== 'play') return;
    dragging = true; dragX = e.clientX; baseX = S.boy.x;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    S.boy.x = clamp(baseX + (e.clientX - dragX) / W * (ROAD_HALF * 2.4), -WALL, WALL);
  });
  const up = () => { dragging = false; };
  stageEl.addEventListener('pointerup', up);
  stageEl.addEventListener('pointercancel', up);
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') S.keyDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') S.keyDir = 1;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const b = card.querySelector('button'); if (b) b.click();
    }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].indexOf(e.key) >= 0) S.keyDir = 0;
  });
  card.addEventListener('click', e => {
    if (e.target.getAttribute && e.target.getAttribute('data-act')) { audio(); start(); }
  });

  // ---------------------------------------------------------------- 進行
  const fmt = t => t.toFixed(2);

  function start() {
    S.mode = 'intro'; S.time = 0; S.broke = 0;
    S.boy = { x: 0, z: 0, state: 'run', t: 0 };
    S.crowd = { x: 0, count: 0 };
    S.enemies = []; S.pops = []; S.shake = 0; S.flash = 0; S.spin = 0;
    buildLane();
    S.camZ = -CAM_BACK;
    elHint.textContent = 'ドラッグ / ←→ で左右';
    overlay.classList.add('hidden');
  }

  function goal() {
    S.mode = 'goal';
    const t = S.time, first = !S.best || t < S.best;
    if (first) { S.best = t; localStorage.setItem(BEST_KEY, String(t)); }
    sfx(523, 0.12, 'square', 0.07); setTimeout(() => sfx(880, 0.22, 'square', 0.07), 130);
    showCard(
      '<span class="tag">GOAL</span>' +
      '<h2>' + (first ? '自己ベスト更新！' : 'ゴール！') + '</h2>' +
      '<div class="time">' + fmt(t) + '<span style="font-size:20px"> 秒</span></div>' +
      '<div class="best">BEST ' + fmt(S.best) + ' 秒　/　突破された回数 ' + S.broke + '</div>' +
      '<p>ゲートの選び方で果物の数が変わる。<br>壁を厚くして、止まらずに駆け抜けろ。</p>' +
      '<button data-act="retry">もう一度走る</button>'
    );
  }
  function showCard(html) { card.innerHTML = html; overlay.classList.remove('hidden'); }

  function title() {
    S.mode = 'title';
    buildLane();
    S.boy = { x: 0, z: 0, state: 'run', t: 0 };
    S.crowd = { x: 0, count: 0 };
    S.camZ = -CAM_BACK;
    showCard(
      '<h1>フルーツ転倒RTA<small>F R U I T　T U M B L E　R T A</small></h1>' +
      '<div class="rules">' +
      '🤸 少年が坂で<b>転ぶ</b>。こぼれた果物が前を転がりはじめる。<br>' +
      '🚪 <b>ゲート</b>をくぐるたびに果物は増減する（×3 や ÷2）。<br>' +
      '🐵 坂を<b>駆け上がってくる動物</b>を、果物の壁で食い止める。<br>' +
      '💥 壁が足りないと<b>突破されて転がされる</b>＝タイムロス。<br>' +
      '⏱ ゴールまでの<b>タイム</b>を競う。' +
      '</div>' +
      '<button data-act="retry">走る</button>'
    );
  }

  // ---------------------------------------------------------------- 更新
  function update(dt) {
    S.clock += dt;
    S.shake = Math.max(0, S.shake - dt * 3);
    S.flash = Math.max(0, S.flash - dt * 2.6);
    for (let i = S.pops.length - 1; i >= 0; i--) {
      const p = S.pops[i]; p.t += dt; p.y += dt * 1.8;
      if (p.t > 1.2) S.pops.splice(i, 1);
    }
    if (S.mode === 'title') { S.boy.z += dt * 5; S.camZ = S.boy.z - CAM_BACK; return; }
    if (S.mode === 'goal') return;

    const b = S.boy;
    b.t += dt;

    // ── 導入：走って、一度だけ転ぶ。ここで果物がこぼれる。
    if (S.mode === 'intro') {
      S.time += dt;
      if (b.state === 'run') {
        b.z += 19 * dt;
        if (b.z > 12) { b.state = 'fall'; b.t = 0; S.shake = 0.8; sfx(260, 0.2, 'square', 0.05, 90); }
      } else if (b.state === 'fall') {
        b.z += 7 * dt;
        if (b.t > 0.55) {
          S.crowd = { x: b.x, count: 14 };
          pop('果物がこぼれた！', '#ffd166', 0, b.z + 4, 3);
          b.state = 'getup'; b.t = 0;
        }
      } else if (b.state === 'getup') {
        b.z += 12 * dt;
        if (b.t > 0.45) { b.state = 'run'; b.t = 0; S.mode = 'play'; }
      }
      S.camZ = b.z - CAM_BACK;
      return;
    }

    // ── 本編
    S.time += dt;
    let speed = 22;
    if (b.state === 'down')  { speed = 6;  if (b.t > 0.9) { b.state = 'getup'; b.t = 0; } }
    if (b.state === 'getup') { speed = 13; if (b.t > 0.4) { b.state = 'run'; b.t = 0; } }
    if (S.keyDir && b.state === 'run') b.x = clamp(b.x + S.keyDir * 7 * dt, -WALL, WALL);

    const prevZ = b.z;
    b.z += speed * dt;
    S.camZ = b.z - CAM_BACK;

    // 果物の壁は少年の前をついて転がる
    const c = S.crowd;
    c.x += (b.x - c.x) * Math.min(1, dt * 13);   // 見たまま狙えるよう、壁は少年にきびきび付いてくる
    const cz = b.z + LEAD;
    S.spin += speed * dt * 0.8;

    // ゲート（壁が通過したときに適用）
    for (const it of S.items) {
      if (it.z <= prevZ + LEAD || it.z > cz) continue;
      const op = it.ops[c.x < 0 ? 0 : 1];
      const before = c.count;
      c.count = applyOp(c.count, op);
      it.flash = 1;
      const d = c.count - before;
      pop((d >= 0 ? '+' : '') + d, d >= 0 ? '#2fbf5a' : '#e3452f', c.x, it.z, 2.4);
      sfx(d >= 0 ? 700 : 300, 0.1, d >= 0 ? 'square' : 'sawtooth', 0.045, d >= 0 ? 980 : 150);
    }

    // 敵の波を出す
    for (const w of S.waves) {
      if (!w.fired && b.z > w.z - 30) { w.fired = true; spawnWave(w); }
    }

    // 敵は少年めがけて坂を駆け上がってくる
    const cr = crowdRadius(c.count);
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      const d = ANIMALS[e.kind];
      if (e.dead) {
        e.dead += dt; e.z += 26 * dt; e.x += e.fly * 16 * dt;
        if (e.dead > 1.1) S.enemies.splice(i, 1);
        continue;
      }
      e.z -= e.sp * dt;
      e.x += clamp(b.x - e.x, -1, 1) * 6.5 * dt;   // 少年を狙って寄ってくるので、必ず壁にぶつかる
      if (e.z < b.z - 6) { S.enemies.splice(i, 1); continue; }

      // 果物の壁とぶつかる
      if (c.count > 0 && e.z <= cz + 0.8 && e.z > cz - 2.4 && Math.abs(e.x - c.x) < cr + d.w * e.big) {
        if (c.count >= e.cost) {
          c.count -= e.cost;
          e.dead = 0.001; e.fly = e.x >= c.x ? 1 : -1;
          pop('-' + e.cost, '#ffd166', e.x, e.z, 2.2);
          S.shake = Math.max(S.shake, 0.25);
          sfx(520, 0.08, 'square', 0.04, 780);
        } else {
          c.count = 0;
          pop('壁が崩れた！', '#e3452f', c.x, cz, 2.6);
        }
        continue;
      }
      // 壁を抜けて少年に届く
      if (e.z <= b.z + 0.9 && Math.abs(e.x - b.x) < d.w * e.big + 0.5 && b.state === 'run') {
        b.state = 'down'; b.t = 0; S.broke++;
        // 立て直せる下限を進行度に合わせて上げる。ミスの代償は「失った時間」であって、
        // 走りそのものが詰むことではない。
        const floorN = 8 + Math.floor(b.z * 0.18);
        c.count = Math.max(floorN, Math.floor(c.count * 0.6));   // 箱からこぼれて最低限は立て直せる
        e.dead = 0.001; e.fly = e.x >= b.x ? 1 : -1;
        pop('突破された！', '#e3452f', b.x, b.z + 2, 3);
        S.shake = 1; S.flash = 0.5;
        sfx(140, 0.3, 'sawtooth', 0.07, 70);
      }
    }

    if (b.z >= S.lane) goal();
  }

  function crowdRadius(n) { return 0.34 * Math.sqrt(Math.max(1, Math.min(n, 60))) + 0.45; }

  // ---------------------------------------------------------------- 描画
  const clouds = [];
  for (let i = 0; i < 8; i++) clouds.push({ x: Math.random(), y: Math.random() * 0.55, s: rnd(0.6, 1.4), v: rnd(0.003, 0.01) });

  function drawSky() {
    ctx.fillStyle = '#8fd3f4'; ctx.fillRect(0, 0, W, VANISH + 12);
    for (const c of clouds) {
      c.x -= c.v * 0.016; if (c.x < -0.25) c.x = 1.25;
      const px = c.x * W, py = 34 + c.y * (VANISH - 70), r = 17 * c.s;
      for (let pass = 0; pass < 2; pass++) {
        const k = pass === 0 ? 3.5 : 0;
        ctx.beginPath();
        ctx.arc(px, py, r + k, 0, 7);
        ctx.arc(px + r * 0.95, py + r * 0.18, r * 0.72 + k, 0, 7);
        ctx.arc(px - r, py + r * 0.22, r * 0.62 + k, 0, 7);
        ctx.arc(px + r * 0.1, py - r * 0.6, r * 0.58 + k, 0, 7);
        ctx.fillStyle = pass === 0 ? '#1b1b1f' : '#fff'; ctx.fill();
      }
    }
    ctx.beginPath(); ctx.moveTo(-20, VANISH + 8);
    for (let i = 0; i <= 6; i++) {
      const x = -20 + (W + 40) * (i / 6);
      ctx.lineTo(x, VANISH + 8 - (46 + 30 * Math.sin(i * 2.1 + 1)));
      ctx.lineTo(x + (W + 40) / 12, VANISH + 8);
    }
    ctx.lineTo(W + 20, VANISH + 8); ctx.closePath();
    ctx.fillStyle = '#69b45a'; ctx.fill();
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function quad(a, b, half, color) {
    ctx.beginPath();
    ctx.moveTo(W / 2 - half * a.s, a.y); ctx.lineTo(W / 2 + half * a.s, a.y);
    ctx.lineTo(W / 2 + half * b.s, b.y); ctx.lineTo(W / 2 - half * b.s, b.y);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function drawRoad() {
    ctx.fillStyle = '#7cc45f'; ctx.fillRect(0, VANISH - 2, W, H - VANISH + 2);
    const edges = [], STEP = 4;
    for (let z = S.camZ + 0.85; z < S.camZ + 10; z += 0.5) edges.push(z);
    const g0 = Math.ceil((S.camZ + 10) / STEP) * STEP;
    for (let z = g0; z < S.camZ + 150; z += STEP) edges.push(z);
    for (let i = edges.length - 2; i >= 0; i--) {
      const a = project(0, edges[i], 0), b = project(0, edges[i + 1], 0);
      if (!a || !b) continue;
      const dark = (Math.floor((edges[i] + 0.01) / STEP) % 2 + 2) % 2 === 0;
      quad(a, b, 60, dark ? '#74bb58' : '#7cc45f');
      quad(a, b, ROAD_HALF + 0.32, '#1b1b1f');
      quad(a, b, ROAD_HALF, dark ? '#d8bb8c' : '#e0c496');
    }
  }
  function shadow(p, r) {
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.3, 0, 0, 7); ctx.fill();
  }
  function sprite(name, p, worldH, flip) {
    const im = SPR[name];
    if (!im || !im.complete || !im.naturalWidth) return;
    const h = worldH * p.s, w = h * im.naturalWidth / im.naturalHeight;
    ctx.save(); ctx.translate(p.x, p.y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.restore();
  }
  function drawFruit(p, size, kind, rot) {
    const r = size * 0.5;
    shadow(p, r * 0.9);
    ctx.save();
    ctx.translate(p.x, p.y - r); ctx.scale(r, r); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7);
    ctx.fillStyle = kind.c; ctx.fill();
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 0.15; ctx.stroke();
    if (kind.leaf) {
      ctx.beginPath(); ctx.ellipse(0.3, -0.95, 0.4, 0.17, -0.6, 0, 7);
      ctx.fillStyle = '#4a9b46'; ctx.fill(); ctx.lineWidth = 0.1; ctx.stroke();
    }
    ctx.restore();
  }
  function drawTree(p, size) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size);
    ctx.beginPath(); ctx.rect(-0.07, -0.36, 0.14, 0.36);
    ctx.fillStyle = '#8a5f3c'; ctx.fill();
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 0.05; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -0.62, 0.42, 0.42, 0, 0, 7);
    ctx.fillStyle = '#4f9f46'; ctx.fill(); ctx.lineWidth = 0.055; ctx.stroke();
    ctx.restore();
  }
  function drawGate(it) {
    const p = project(0, it.z, 0);
    if (!p) return;
    const fade = clamp((90 - p.dz) / 26, 0, 1) * clamp((p.dz - 3.5) / 5, 0, 1);
    if (fade <= 0.02) return;
    ctx.globalAlpha = fade;
    const s = p.s, h = 3.2 * s, y = p.y, cx = W / 2, half = ROAD_HALF * s;
    for (let i = 0; i < 2; i++) {
      const op = it.ops[i], x0 = i === 0 ? cx - half : cx;
      ctx.fillStyle = op.good ? 'rgba(90,215,120,.55)' : 'rgba(235,90,70,.55)';
      ctx.fillRect(x0, y - h, half, h);
      ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.strokeRect(x0, y - h, half, h);
      if (p.dz < 60) {
        const fs = clamp(s * 0.8, 11, 58);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.18; ctx.strokeStyle = '#1b1b1f';
        ctx.strokeText(op.label, x0 + half / 2, y - h * 0.55);
        ctx.fillStyle = '#fff'; ctx.fillText(op.label, x0 + half / 2, y - h * 0.55);
      }
    }
    ctx.globalAlpha = 1;
    it.flash = Math.max(0, it.flash - 0.04);
  }

  const layoutCache = {};
  function layout(n) {
    if (!layoutCache[n]) {
      const a = [];
      for (let i = 0; i < n; i++) {
        const ang = i * 2.39996, r = 0.34 * Math.sqrt(i);
        a.push([Math.cos(ang) * r, Math.sin(ang) * r * 0.75]);
      }
      layoutCache[n] = a;
    }
    return layoutCache[n];
  }

  function render() {
    ctx.save();
    if (S.shake > 0) ctx.translate(rnd(-1, 1) * S.shake * 8, rnd(-1, 1) * S.shake * 5);
    drawSky(); drawRoad();

    const list = [];
    for (const it of S.items) { const dz = it.z - S.camZ; if (dz > 0.8 && dz < 150) list.push(it); }
    for (const t of S.scenery) { const dz = t.z - S.camZ; if (dz > 0.8 && dz < 150) list.push({ type: 'tree', z: t.z, x: t.x, h: t.h }); }
    for (const e of S.enemies) { const dz = e.z - S.camZ; if (dz > 0.8 && dz < 150) list.push({ type: 'enemy', e: e, z: e.z }); }
    list.push({ type: 'boy', z: S.boy.z });
    if (S.crowd.count > 0) {
      const n = clamp(Math.ceil(S.crowd.count), 1, 40), off = layout(n), cz = S.boy.z + LEAD;
      for (let i = 0; i < n; i++)
        list.push({ type: 'fruit', i: i, x: S.crowd.x + off[i][0], z: cz + off[i][1] });
    }
    list.sort((a, b) => (b.z + (b.type === 'gate' ? 1.4 : 0)) - (a.z + (a.type === 'gate' ? 1.4 : 0)));

    for (const o of list) {
      if (o.type === 'gate') { drawGate(o); continue; }
      const p = project(o.x !== undefined ? o.x : 0, o.z, 0);
      if (!p) continue;
      if (o.type === 'tree') drawTree(p, p.s * o.h * 0.95);
      else if (o.type === 'fruit') drawFruit(p, p.s * 0.62, FRUITS[o.i % FRUITS.length], S.spin + o.i);
      else if (o.type === 'enemy') {
        const e = o.e, d = ANIMALS[e.kind];
        const q = project(e.x, e.z, 0);
        if (!q) continue;
        if (e.dead) {                                   // 弾かれて飛んでいく
          ctx.save();
          ctx.globalAlpha = clamp(1.1 - e.dead, 0, 1);
          ctx.translate(q.x, q.y); ctx.rotate(e.fly * e.dead * 3);
          sprite(d.spr, { x: 0, y: 0, s: q.s }, d.h * e.big);
          ctx.restore();
        } else {
          shadow(q, q.s * d.w * e.big * 0.45);
          const run = Math.abs(Math.sin(S.clock * 9 + e.t)) * 0.07;
          sprite(d.spr, { x: q.x, y: q.y, s: q.s }, d.h * e.big * (1 + run));
        }
      } else if (o.type === 'boy') {
        const b = S.boy, q = project(b.x, b.z, 0);
        if (!q) continue;
        shadow(q, q.s * 0.45);
        if (b.state === 'fall' || b.state === 'down') {
          sprite('boy-fall', { x: q.x, y: q.y + q.s * 0.2, s: q.s }, 1.8);
        } else {
          const bob = Math.abs(Math.sin(S.clock * 11)) * 0.06;
          sprite('boy-back', q, 2.3 + bob);
        }
      }
    }

    // 壁の枚数
    if (S.crowd.count > 0) {
      const p = project(S.crowd.x, S.boy.z + LEAD, 2.4);
      if (p) {
        const fs = clamp(p.s * 0.85, 14, 50);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#1b1b1f';
        ctx.strokeText(S.crowd.count, p.x, p.y);
        ctx.fillStyle = '#fff'; ctx.fillText(S.crowd.count, p.x, p.y);
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of S.pops) {
      const q = project(p.x, p.z, p.y);
      if (!q) continue;
      const fs = clamp(q.s * 0.75, 12, 40);
      ctx.globalAlpha = clamp(1.4 - p.t, 0, 1);
      ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
      ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#1b1b1f';
      ctx.strokeText(p.text, q.x, q.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, q.x, q.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(227,69,47,' + (S.flash * 0.3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------------------------------------------------------------- HUD
  let lastC = -1;
  function hud() {
    const c = S.crowd.count;
    if (c !== lastC) { elStock.textContent = c; lastC = c; }
    elTimer.textContent = S.mode === 'title' ? '0.00' : fmt(S.time);
    elBest.textContent = S.best ? fmt(S.best) : '--.--';
    elBar.style.width = (clamp(S.boy.z / S.lane, 0, 1) * 100) + '%';
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
    last = ts;
    if (!S.paused) { update(dt); render(); hud(); }
    requestAnimationFrame(frame);
  }

  window.FruitRTA = {
    state: S, start: start,
    setX: x => { S.boy.x = clamp(x, -WALL, WALL); },
    pause: v => { S.paused = !!v; },
    ctx: ctx,
  };

  resize();
  title();
  requestAnimationFrame(frame);
})();
