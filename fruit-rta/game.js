/* =========================================================================
   フルーツ転倒RTA  (Fruit Tumble RTA)
   果物を背負った少年が坂を駆け下りる。タップで自分から転ぶと果物が前方へ
   ばらまかれ、ゲートをくぐるたびに増え、道をふさぐ動物を蹴散らす。
   転がり終わった果物は追いついて拾い直す。ゴールまでのタイムを競う。
   キャラクターは assets/ のスプライト（採用デザイン）を使用。
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
  const SPRITES = ['boy-back', 'boy-fall', 'bear', 'monkey', 'boar', 'uribou'];
  let loaded = 0;
  SPRITES.forEach(n => {
    const im = new Image();
    im.onload = () => { loaded++; };
    im.onerror = () => { loaded++; };
    im.src = 'assets/' + n + '.png';
    SPR[n] = im;
  });

  // 果物はベタ塗り＋太い黒線（絵柄ルールに合わせ、グラデーションと光沢は使わない）
  const FRUITS = [
    { c: '#e33b2e', leaf: true  },   // りんご
    { c: '#f59322', leaf: false },   // オレンジ
    { c: '#f5d63a', leaf: false },   // レモン
    { c: '#7b4ea8', leaf: true  },   // ぶどう
    { c: '#4a9b46', leaf: false },   // すいか
    { c: '#f08fa0', leaf: true  },   // もも
  ];

  const ANIMALS = {
    uribou: { spr: 'uribou', h: 1.25, w: 1.0, cost: 6,  name: 'ウリ坊' },
    monkey: { spr: 'monkey', h: 1.75, w: 0.8, cost: 10, name: 'サル' },
    boar:   { spr: 'boar',   h: 1.70, w: 1.7, cost: 18, name: 'イノシシ' },
    bear:   { spr: 'bear',   h: 2.40, w: 1.1, cost: 30, name: 'クマ' },
  };

  // ---------------------------------------------------------------- 状態
  const BEST_KEY = 'fruitrta.best';
  const S = {
    mode: 'title',                 // title | run | goal
    time: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    stock: 10,
    boy: { x: 0, z: 0, state: 'run', t: 0, v: 0 },
    wave: null,                    // 転がっている果物
    items: [], scenery: [], pops: [],
    lane: 0, camZ: -CAM_BACK, shake: 0, keyDir: 0, clock: 0,
  };

  const OPS = [
    { k: 'mul', v: 2, label: '×2', good: true },
    { k: 'mul', v: 3, label: '×3', good: true },
    { k: 'add', v: 10, label: '+10', good: true },
    { k: 'add', v: 20, label: '+20', good: true },
    { k: 'div', v: 2, label: '÷2', good: false },
    { k: 'div', v: 3, label: '÷3', good: false },
    { k: 'sub', v: 8, label: '-8', good: false },
    { k: 'sub', v: 15, label: '-15', good: false },
  ];
  function applyOp(n, op) {
    let r = n;
    if (op.k === 'mul') r = Math.round(n * op.v);
    else if (op.k === 'add') r = n + op.v;
    else if (op.k === 'sub') r = n - op.v;
    else r = Math.ceil(n / op.v);
    return clamp(r, 0, 9999);
  }

  function buildLane() {
    S.lane = 460;
    S.items = [];
    let z = 40;
    // 動物は easy → hard、ゲートはその手前に挟む
    const order = ['uribou', 'monkey', 'uribou', 'boar', 'monkey', 'bear', 'boar', 'bear'];
    let i = 0;
    while (z < S.lane - 40 && i < order.length) {
      S.items.push(makeGate(z));
      z += rnd(26, 34);
      const kind = order[i++];
      S.items.push(makeAnimal(z, kind));
      z += rnd(30, 42);
      if (Math.random() < 0.4) { S.items.push(makeGate(z)); z += rnd(26, 34); }
    }
    S.items.sort((a, b) => a.z - b.z);
    S.scenery = [];
    for (let k = 0; k < 90; k++) {
      S.scenery.push({ z: rnd(6, S.lane + 40),
        x: (Math.random() < 0.5 ? -1 : 1) * rnd(ROAD_HALF + 1.4, ROAD_HALF + 14), h: rnd(2.4, 4.4) });
    }
    S.scenery.sort((a, b) => a.z - b.z);
  }
  function makeGate(z) {
    const g = OPS.filter(o => o.good), b = OPS.filter(o => !o.good);
    let a = pick(g), c = Math.random() < 0.75 ? pick(b) : pick(g);
    if (Math.random() < 0.5) { const t = a; a = c; c = t; }
    return { type: 'gate', z: z, ops: [a, c], flash: 0 };
  }
  function makeAnimal(z, kind) {
    const d = ANIMALS[kind];
    return { type: 'animal', kind: kind, z: z, x: rnd(-WALL + d.w, WALL - d.w),
             cost: d.cost, alive: true, flee: 0, t: rnd(0, 6) };
  }

  // ---------------------------------------------------------------- 効果音
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
  function pop(text, color, x, z, y) { S.pops.push({ text: text, color: color, x: x, z: z, y: y || 2, t: 0 }); }

  // ---------------------------------------------------------------- 入力
  let dragging = false, dragX = 0, baseX = 0, moved = 0;
  stageEl.addEventListener('pointerdown', e => {
    audio();
    if (S.mode !== 'run') return;
    dragging = true; dragX = e.clientX; baseX = S.boy.x; moved = 0;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    moved = Math.max(moved, Math.abs(e.clientX - dragX));
    S.boy.x = clamp(baseX + (e.clientX - dragX) / W * (ROAD_HALF * 2.4), -WALL, WALL);
  });
  stageEl.addEventListener('pointerup', () => {
    if (dragging && moved < 12) dive();      // 動かさずに離したらタップ＝転ぶ
    dragging = false;
  });
  stageEl.addEventListener('pointercancel', () => { dragging = false; });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') S.keyDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') S.keyDir = 1;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (S.mode === 'run') dive();
      else { const b = card.querySelector('button'); if (b) b.click(); }
    }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].indexOf(e.key) >= 0) S.keyDir = 0;
  });
  card.addEventListener('click', e => {
    const act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (act) { audio(); start(); }
  });

  // ---------------------------------------------------------------- 進行
  function fmt(t) {
    return t.toFixed(2);
  }
  function start() {
    S.mode = 'run'; S.time = 0; S.stock = 10;
    S.boy = { x: 0, z: 0, state: 'run', t: 0, v: 0 };
    S.wave = null; S.pops = []; S.shake = 0;
    buildLane();
    S.camZ = -CAM_BACK;
    elHint.textContent = 'タップで転ぶ／ドラッグで左右';
    overlay.classList.add('hidden');
  }

  function dive() {
    const b = S.boy;
    if (b.state !== 'run') return;
    if (S.stock <= 0) { pop('在庫なし', '#ff9b8a', b.x, b.z + 2, 2.4); sfx(180, 0.1, 'square', 0.04); return; }
    b.state = 'dive'; b.t = 0;
    S.wave = { x: b.x, z: b.z + 2.5, count: S.stock, v: 32, spin: 0, dead: false };
    S.stock = 0;
    S.shake = 0.5;
    sfx(300, 0.16, 'square', 0.05, 720);
  }

  function goal() {
    S.mode = 'goal';
    const t = S.time;
    const first = !S.best || t < S.best;
    if (first) { S.best = t; localStorage.setItem(BEST_KEY, String(t)); }
    sfx(523, 0.12, 'square', 0.07); setTimeout(() => sfx(880, 0.22, 'square', 0.07), 130);
    showCard(
      '<span class="tag">GOAL</span>' +
      '<h2>' + (first ? '自己ベスト更新！' : 'ゴール！') + '</h2>' +
      '<div class="time">' + fmt(t) + '<span style="font-size:20px"> 秒</span></div>' +
      '<div class="best">BEST ' + fmt(S.best) + ' 秒　/　残った果物 ' + S.stock + ' 個</div>' +
      '<p>転ぶ回数とタイミングでタイムが変わる。<br>最短ルートを探せ。</p>' +
      '<button data-act="retry">もう一度走る</button>'
    );
  }

  function showCard(html) { card.innerHTML = html; overlay.classList.remove('hidden'); }

  function title() {
    S.mode = 'title';
    buildLane();
    S.boy = { x: 0, z: 0, state: 'run', t: 0, v: 0 };
    S.camZ = -CAM_BACK;
    showCard(
      '<h1>フルーツ転倒RTA<small>F R U I T　T U M B L E　R T A</small></h1>' +
      '<div class="rules">' +
      '🏃 少年は坂を自動で走る。<b>ゴールまでのタイム</b>を競う。<br>' +
      '🤸 <b>タップで自分から転ぶ</b>と、背負った果物が前へ転がり出す。<br>' +
      '🚪 転がる果物は<b>ゲート</b>をくぐるたびに増減する。<br>' +
      '🐻 道をふさぐ動物は、果物をぶつければ退散する。<br>' +
      '🍎 止まった果物は<b>拾い直せる</b>。拾い損ねると消える。' +
      '</div>' +
      '<button data-act="retry">走る</button>'
    );
  }

  // ---------------------------------------------------------------- 更新
  function update(dt) {
    S.clock += dt;
    S.shake = Math.max(0, S.shake - dt * 3);
    for (let i = S.pops.length - 1; i >= 0; i--) {
      const p = S.pops[i]; p.t += dt; p.y += dt * 1.8;
      if (p.t > 1.1) S.pops.splice(i, 1);
    }
    if (S.mode === 'title') { S.boy.z += dt * 5; S.camZ = S.boy.z - CAM_BACK; return; }
    if (S.mode !== 'run') return;

    S.time += dt;
    const b = S.boy;
    b.t += dt;

    // 状態遷移：走る → 転ぶ → うつ伏せ → 起き上がる
    let speed = 23;
    if (b.state === 'dive')  { speed = 17; if (b.t > 0.28) { b.state = 'down'; b.t = 0; } }
    if (b.state === 'down')  { speed = 7;  if (b.t > 0.42) { b.state = 'getup'; b.t = 0; } }
    if (b.state === 'getup') { speed = 13; if (b.t > 0.3) { b.state = 'run'; b.t = 0; } }
    if (b.state === 'crash') { speed = 5;  if (b.t > 1.1) { b.state = 'getup'; b.t = 0; } }
    if (S.keyDir && (b.state === 'run' || b.state === 'getup'))
      b.x = clamp(b.x + S.keyDir * 7 * dt, -WALL, WALL);

    const prevZ = b.z;
    b.z += speed * dt;
    S.camZ = b.z - CAM_BACK;

    // 転がっている果物
    const w = S.wave;
    if (w && !w.dead) {
      if (w.v > 0) {
        const pz = w.z;
        w.v = Math.max(0, w.v - 8.5 * dt);
        w.z += w.v * dt;
        w.spin += w.v * dt;
        for (const it of S.items) {
          if (it.z <= pz || it.z > w.z) continue;
          if (it.type === 'gate') {
            const op = it.ops[w.x < 0 ? 0 : 1];
            const before = w.count;
            w.count = applyOp(w.count, op);
            it.flash = 1;
            const d = w.count - before;
            pop((d >= 0 ? '+' : '') + d, d >= 0 ? '#2fbf5a' : '#e3452f', w.x, it.z, 2.2);
            sfx(d >= 0 ? 700 : 300, 0.1, d >= 0 ? 'square' : 'sawtooth', 0.045, d >= 0 ? 980 : 150);
          } else if (it.type === 'animal' && it.alive) {
            const d = ANIMALS[it.kind];
            if (Math.abs(w.x - it.x) < d.w + 0.6) {
              if (w.count >= it.cost) {
                w.count -= it.cost; it.alive = false; it.flee = 1;
                pop('-' + it.cost, '#ffd166', it.x, it.z, 2.4);
                sfx(520, 0.1, 'square', 0.045, 760);
              } else {
                pop('足りない', '#e3452f', it.x, it.z, 2.4);
                w.count = 0; sfx(200, 0.2, 'sawtooth', 0.05, 90);
              }
            }
          }
        }
        if (w.count <= 0) { w.dead = true; S.wave = null; }
      } else if (b.z > w.z - 1.6 && Math.abs(b.x - w.x) < 3.0) {   // 追いついて拾う
        S.stock += w.count;
        pop('+' + w.count, '#2fbf5a', w.x, w.z, 2.4);
        sfx(900, 0.12, 'triangle', 0.05, 1300);
        S.wave = null;
      } else if (b.z > w.z + 3) {                                   // 拾い損ね
        pop('拾えなかった…', '#e3452f', w.x, w.z, 2.4);
        S.wave = null;
      }
    }

    // 少年が動物にぶつかる
    for (const it of S.items) {
      if (it.type !== 'animal' || !it.alive || it.z <= prevZ || it.z > b.z) continue;
      const d = ANIMALS[it.kind];
      if (Math.abs(b.x - it.x) < d.w + 0.45 && b.state !== 'crash') {
        b.state = 'crash'; b.t = 0;
        const lost = Math.floor(S.stock / 2);
        S.stock -= lost;
        pop('ぶつかった！', '#e3452f', it.x, it.z, 3);
        S.shake = 1; sfx(150, 0.3, 'sawtooth', 0.07, 70);
      }
    }
    if (b.z >= S.lane) goal();
  }

  // ---------------------------------------------------------------- 描画
  const clouds = [];
  for (let i = 0; i < 8; i++) clouds.push({ x: Math.random(), y: Math.random() * 0.55, s: rnd(0.6, 1.4), v: rnd(0.003, 0.01) });

  function outline(w) { ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }

  function drawSky() {
    ctx.fillStyle = '#8fd3f4'; ctx.fillRect(0, 0, W, VANISH + 12);
    for (const c of clouds) {
      c.x -= c.v * 0.016; if (c.x < -0.25) c.x = 1.25;
      const px = c.x * W, py = 34 + c.y * (VANISH - 70), r = 17 * c.s;
      for (let pass = 0; pass < 2; pass++) {          // 1周目＝黒を一回り大きく敷く＝輪郭線
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
    ctx.fillStyle = '#69b45a'; ctx.fill(); outline(4);
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
      quad(a, b, ROAD_HALF + 0.32, '#1b1b1f');                      // 道のふち＝太い黒線
      quad(a, b, ROAD_HALF, dark ? '#d8bb8c' : '#e0c496');
    }
  }

  function shadow(p, r) {
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.3, 0, 0, 7); ctx.fill();
  }

  function sprite(name, p, worldH, flip, rot) {
    const im = SPR[name];
    if (!im || !im.complete || !im.naturalWidth) return;
    const h = worldH * p.s, w = h * im.naturalWidth / im.naturalHeight;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (rot) ctx.rotate(rot);
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
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 0.14; ctx.stroke();
    if (kind.leaf) {
      ctx.beginPath(); ctx.ellipse(0.3, -0.95, 0.4, 0.17, -0.6, 0, 7);
      ctx.fillStyle = '#4a9b46'; ctx.fill();
      ctx.lineWidth = 0.1; ctx.stroke();
    }
    ctx.restore();
  }

  function drawTree(p, size) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size);
    ctx.beginPath(); ctx.rect(-0.07, -0.36, 0.14, 0.36);
    ctx.fillStyle = '#8a5f3c'; ctx.fill(); ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 0.05; ctx.stroke();
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
        const ang = i * 2.39996, r = 0.32 * Math.sqrt(i);
        a.push([Math.cos(ang) * r, Math.sin(ang) * r * 1.1]);
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
    list.push({ type: 'boy', z: S.boy.z });
    if (S.wave) {
      const n = clamp(Math.ceil(S.wave.count), 1, 30), off = layout(n);
      for (let i = 0; i < n; i++)
        list.push({ type: 'fruit', i: i, x: S.wave.x + off[i][0], z: S.wave.z + off[i][1] });
    }
    list.sort((a, b) => b.z - a.z);

    for (const o of list) {
      if (o.type === 'gate') { drawGate(o); continue; }
      const p = project(o.x !== undefined ? o.x : 0, o.z, 0);
      if (!p) continue;
      if (o.type === 'tree') drawTree(p, p.s * o.h * 0.5);
      else if (o.type === 'fruit') drawFruit(p, p.s * 0.52, FRUITS[o.i % FRUITS.length], S.wave.spin + o.i);
      else if (o.type === 'animal') {
        const d = ANIMALS[o.kind];
        if (!o.alive) {
          o.flee = Math.max(0, o.flee - 0.012);
          if (o.flee <= 0) continue;
          const q = project(o.x + (o.x >= 0 ? 1 : -1) * (1 - o.flee) * 14, o.z + (1 - o.flee) * 4, 0);
          if (q) { ctx.globalAlpha = Math.min(1, o.flee * 2); shadow(q, q.s * d.w * 0.4); sprite(d.spr, q, d.h, o.x < 0); ctx.globalAlpha = 1; }
          continue;
        }
        shadow(p, p.s * d.w * 0.45);
        const bob = Math.sin(S.clock * 3 + o.t) * 0.02;
        sprite(d.spr, { x: p.x, y: p.y, s: p.s }, d.h * (1 + bob), o.x < 0);
      } else if (o.type === 'boy') {
        const b = S.boy;
        const q = project(b.x, b.z, 0);
        if (!q) continue;
        shadow(q, q.s * 0.45);
        if (b.state === 'run' || b.state === 'getup') {
          const bob = Math.abs(Math.sin(S.clock * 11)) * 0.05;
          sprite('boy-back', q, 2.3 + bob * (b.state === 'run' ? 1 : 0.3));
        } else {
          sprite('boy-fall', { x: q.x, y: q.y + q.s * 0.2, s: q.s }, 1.8);
        }
      }
    }

    // 転がっている数
    if (S.wave) {
      const p = project(S.wave.x, S.wave.z, 2.2);
      if (p) {
        const fs = clamp(p.s * 0.9, 14, 52);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#1b1b1f';
        ctx.strokeText(S.wave.count, p.x, p.y);
        ctx.fillStyle = '#fff'; ctx.fillText(S.wave.count, p.x, p.y);
      }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of S.pops) {
      const q = project(p.x, p.z, p.y);
      if (!q) continue;
      const fs = clamp(q.s * 0.75, 12, 42);
      ctx.globalAlpha = clamp(1.3 - p.t, 0, 1);
      ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
      ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#1b1b1f';
      ctx.strokeText(p.text, q.x, q.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, q.x, q.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- HUD
  let lastStock = -1;
  function hud() {
    if (S.stock !== lastStock) { elStock.textContent = S.stock; lastStock = S.stock; }
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
    state: S, start: start, dive: dive,
    pause: v => { S.paused = !!v; },
    setX: x => { S.boy.x = clamp(x, -WALL, WALL); },
    ctx: ctx,
  };

  resize();
  title();
  requestAnimationFrame(frame);
})();
