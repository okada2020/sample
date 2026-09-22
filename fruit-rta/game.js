/* =========================================================================
   フルトリランナー  (Furutori Runner)
   坂の上で少年が転ぶ。こぼれた 3 個の果物が転がり出す ── これがプレイヤー。
   ゲートをくぐるたびに数が増え、坂を駆け上がってくる動物を数の力で押し倒す。
   ウリ坊とサルは 1 個、イノシシは 10 個、クマは 50 個で倒せる。
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
  const elScore = document.getElementById('scoreval');
  const elTimer = document.getElementById('timer');
  const elBest  = document.getElementById('best');
  const elBar   = document.getElementById('bar');
  const elHint  = document.getElementById('hint');

  let W = 0, H = 0, DPR = 1, FOCAL = 600, HORIZON = 200, VANISH = 300, camH = 3.2;
  const ROAD_HALF = 5.6, CAM_BACK = 6.5, SLOPE = 0.16, WALL = ROAD_HALF - 1.4;   // 壁に寄りすぎて画面外に出ないように

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const rnd   = (a, b) => a + Math.random() * (b - a);
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
  ['boy-back', 'boy-fall', 'bear', 'monkey', 'boar', 'uribou', 'boss-bear'].forEach(n => {
    const im = new Image(); im.src = 'assets/' + n + '.png'; SPR[n] = im;
  });
  const FRUITS = [
    { c: '#e33b2e', leaf: true  }, { c: '#f59322', leaf: false },
    { c: '#f5d63a', leaf: false }, { c: '#7b4ea8', leaf: true  },
    { c: '#4a9b46', leaf: false }, { c: '#f08fa0', leaf: true  },
  ];
  // 強さ＝倒すのに必要な果物の数
  const ANIMALS = {
    uribou: { spr: 'uribou', h: 1.25, w: 0.8, hp: 1,  sp: 7,   name: 'ウリ坊' },
    monkey: { spr: 'monkey', h: 1.65, w: 0.7, hp: 1,  sp: 8,   name: 'サル' },
    boar:   { spr: 'boar',   h: 1.70, w: 1.4, hp: 10, sp: 6,   name: 'イノシシ' },
    bear:   { spr: 'bear',   h: 2.30, w: 1.1, hp: 50, sp: 3.6, name: 'クマ' },
  };

  // ---------------------------------------------------------------- 状態
  const BEST_KEY = 'fruitrta.best';
  const S = {
    mode: 'title',                       // title | intro | play | death | goal | over
    time: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    crowd: { x: 0, z: 0, count: 0, spin: 0 },   // ← プレイヤーはこの「転がる果物」
    boy: { z: 6, t: 0 },                        // 少年は坂の上で転んだまま動かない
    enemies: [], items: [], waves: [], scenery: [], pops: [],
    lane: 0, camZ: -CAM_BACK, shake: 0, flash: 0, keyDir: 0, clock: 0, killed: 0, boss: null,
    fx: [], dustT: 0, death: null,
  };

  // 想定カーブ：この地点でだいたいこのくらいの数になっているはず、という設計値。
  // ゲートの当たり/はずれも、敵の波の重さも、すべてこの値から決める。
  // → 数が青天井に膨らまず、1 回はずすと取り返しにゲート 2 枚ぶん必要になる。
  const MAX_FRUIT = 400;                 // 箱から出せる上限。クマ 1 頭 50 個が最後まで効くようにする。
  const EXPECT = [];
  for (let i = 0; i < 20; i++) EXPECT.push(Math.min(MAX_FRUIT, Math.round(9 * Math.pow(1.36, i))));

  function applyOp(n, op) {
    let r = n;
    if (op.k === 'mul') r = Math.round(n * op.v);
    else if (op.k === 'add') r = n + op.v;
    else if (op.k === 'sub') r = n - op.v;
    else r = Math.ceil(n / op.v);
    return clamp(r, 1, MAX_FRUIT);   // ゲートでは 0 にしないし、上限も超えない
  }

  // ---------------------------------------------------------------- コース
  function buildLane() {
    S.items = []; S.waves = []; S.enemies = [];
    // ゲート → 動物の群れ、の繰り返し。だんだん重くなる。
    // 波の重さは「ゲートを正しく選び続けたときの数のおよそ 45%」。
    // 1 個で倒せる小物はその数だけ並ぶので、終盤は数十匹がわらわら押し寄せる。
    // 波の重さ＝その地点の想定数の 55%。倒すのに要る数から、出す動物と匹数を決める。
    // 軽い波は小物がわらわら、重い波はイノシシやクマがまとまって来る。
    // 1 回の遭遇は 1〜3 体。強さ（ウリ坊1 / サル1 / イノシシ10 / クマ50）で段階を作る。
    const ENCOUNTERS = [
      { kind: 'uribou', n: 1 }, { kind: 'monkey', n: 1 }, { kind: 'uribou', n: 2 },
      { kind: 'monkey', n: 2 }, { kind: 'boar',   n: 1 }, { kind: 'monkey', n: 3 },
      { kind: 'boar',   n: 2 }, { kind: 'bear',   n: 1 }, { kind: 'boar',   n: 3 },
      { kind: 'bear',   n: 2 }, { kind: 'boar',   n: 4 }, { kind: 'bear',   n: 3 },
    ];
    function waveFor(z, i) {
      const e = ENCOUNTERS[Math.min(i, ENCOUNTERS.length - 1)];
      // 4 回目以降は 1 つおきに大軍（道を埋めて降りてくる）
      const horde = i >= 3 && i % 2 === 1;
      return { z: z, i: i, kind: e.kind, n: horde ? 30 + i * 6 : e.n, horde: horde, fired: false };
    }
    let z = 30, gi = 0;
    // 出だしの 2 枚は両側とも当たり。3 個をまず育ててから戦わせる。
    S.items.push(makeGate(z, gi++, true)); z += 22;
    S.items.push(makeGate(z, gi++, true)); z += 26;
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {                              // 1 つおきに「+N」パネルの連なり
        const L = makeLadder(z, i);
        S.items.push(L);
        // おいしい側の出口に木箱。まるごと拾ったぶんの半分くらいが壊すのに要る。
        S.items.push(makeCrate(z + L.len + 3, L.rich, Math.max(8, Math.round(L.richV * L.n * 0.5))));
        z += L.len + 16;
      }
      const w = waveFor(z, i);
      S.waves.push(w);
      z += w.horde ? 44 : 20 + w.n * 7;   // 大群は 1 ブロックぶん、単体は匹数ぶんの間隔
      S.items.push(makeGate(z, gi++));
      z += 18;
    }
    // 最後は強化クマのボス。HP バーを出して、数でねじ伏せる。
    S.boss = { z: z + 34, hp: 320, max: 320, t: 0, hurt: 0, dead: 0 };
    S.lane = S.boss.z + 16;
    S.scenery = [];
    for (let k = 0; k < 90; k++)
      S.scenery.push({ z: rnd(-8, S.lane + 40),
        x: (Math.random() < 0.5 ? -1 : 1) * rnd(ROAD_HALF + 1.4, ROAD_HALF + 14), h: rnd(2.4, 4.4) });
    S.scenery.sort((a, b) => a.z - b.z);
  }
  /** 左右の壁に並ぶパネル。寄った側のぶんだけ増える（片方は渋く、片方は大きい）。 */
  function makeLadder(z, i) {
    const e = EXPECT[Math.min(i, EXPECT.length - 1)];
    const small = Math.max(1, Math.round(e * 0.03));
    const big   = Math.max(5, Math.round(e * 0.26));
    const bigRight = Math.random() < 0.5;
    const n = 11;
    return { type: 'ladder', z: z, n: n, sp: 2.2, len: n * 2.2, lit: [],
             vL: bigRight ? small : big, vR: bigRight ? big : small,
             rich: bigRight ? 1 : -1, richV: big };
  }

  /** 木箱：道の半分をふさぐ障害物。数字ぶんの果物をぶつけると壊れる。
      おいしい壁（黄色）の出口に置くので、「大きく増やす代わりに壊す手間を払う」形になる。 */
  function makeCrate(z, side, hp) {
    return { type: 'crate', z: z, side: side, x: side * 2.7, w: 2.5, hp: hp, max: hp, flash: 0, dead: 0 };
  }

  function makeGate(z, i, safe) {
    const e = EXPECT[Math.min(i, EXPECT.length - 1)];
    const goods = [
      { k: 'mul', v: 2, label: '×2', good: true },
      { k: 'add', v: Math.round(e * 0.7), label: '+' + Math.round(e * 0.7), good: true },
    ];
    const bads = [
      { k: 'div', v: 2, label: '÷2', good: false },
      { k: 'sub', v: Math.round(e * 0.45), label: '-' + Math.round(e * 0.45), good: false },
    ];
    let a = pick(goods), c = safe ? pick(goods) : pick(bads);
    if (Math.random() < 0.5) { const t = a; a = c; c = t; }
    return { type: 'gate', z: z, ops: [a, c], flash: 0 };
  }

  /** 1 体ずつ順番に現れるように、道に沿って間隔をあけて置く */
  /** 群れの合計＝必要な果物の数を、手前の看板に出す */
  function drawWaveSigns() {
    for (const w of S.waves) {
      if (!w.fired || !w.total) continue;
      const alive = S.enemies.filter(e => e.wave === w && !e.dead)
        .reduce((a, e) => a + e.hp, 0);
      if (alive <= 0) continue;
      const p = project(ROAD_HALF - 0.6, Math.min(...S.enemies.filter(e => e.wave === w && !e.dead).map(e => e.z)) + 2, 0);
      if (!p || p.dz > 90 || p.dz < 3) continue;
      const s = p.s, w2 = 2.6 * s, h = 1.4 * s;
      ctx.fillStyle = '#8a6a3f';
      ctx.fillRect(p.x - w2 / 2, p.y - h * 1.9, w2, h);
      ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(2, s * 0.07);
      ctx.strokeRect(p.x - w2 / 2, p.y - h * 1.9, w2, h);
      worldText(alive, p.x, p.y - h * 1.4, clamp(s * 0.72, 12, 46), '#fff');
    }
  }

  /** 大軍：道幅いっぱいに隊列を組んで、まとめて降りてくる */
  function spawnHorde(w) {
    const kind = w.i >= 6 ? 'monkey' : 'uribou';
    const d = ANIMALS[kind];
    // 規模は「今の数の半分くらい」。育てた人にはちゃんと壁になる量が出る。
    const want = clamp(Math.round(S.crowd.count * 0.55), 24, 128);
    const cols = 14, rows = Math.max(3, Math.round(want / cols));   // 横に広く、奥行きは浅く＝道を埋める壁に見せる
    for (let r = 0; r < rows; r++) {
      for (let cI = 0; cI < cols; cI++) {
        S.enemies.push({
          kind: kind, hp: d.hp, max: d.hp, horde: true, wave: w, sc: 0.5,
          z: w.z + 24 + r * 0.95 + (cI % 2) * 0.4,
          x: -4.2 + cI * (8.4 / (cols - 1)) + rnd(-0.1, 0.1),
          sp: 4.2 + r * 0.02, t: rnd(0, 6), dead: 0, hurt: 0,
        });
      }
    }
    w.total = d.hp * rows * cols;
    pop(d.name + ' の大群 ' + (rows * cols) + ' 匹', '#ff9b8a', 0, w.z + 14, 4.6);
    sfx(110, 0.4, 'sawtooth', 0.06, 70);
  }

  function spawnWave(w) {
    const d = ANIMALS[w.kind];
    for (let i = 0; i < w.n; i++) {
      S.enemies.push({
        kind: w.kind, hp: d.hp, max: d.hp,
        z: w.z + 20 + i * 9,                       // 前後に離して、順番に向かってくる
        x: clamp(rnd(-WALL + d.w, WALL - d.w), -WALL, WALL),
        sp: d.sp * rnd(0.9, 1.1), t: rnd(0, 6), dead: 0, hurt: 0, wave: w,
      });
    }
    w.total = d.hp * w.n;
    if (w.n > 1) pop(d.name + ' ×' + w.n, '#ffd166', 0, w.z + 16, 4.2);
    sfx(170, 0.18, 'square', 0.045, 120);
  }

  // ---------------------------------------------------------------- 効果
  /** 土埃・跳ねる果物などの小さな演出 */
  function puff(x, z, n, big) {
    for (let i = 0; i < n; i++) {
      S.fx.push({ kind: 'dust', x: x + rnd(-0.5, 0.5), z: z + rnd(-0.5, 0.5), y: rnd(0.1, 0.5),
        vx: rnd(-1.6, 1.6), vz: rnd(-1.2, 1.6), vy: rnd(0.8, 2.4),
        r: rnd(0.3, 0.6) * (big ? 1.7 : 1), t: 0, life: rnd(0.5, 0.9) });
    }
  }
  function burstFruit(x, z, n) {
    for (let i = 0; i < n; i++) {
      S.fx.push({ kind: 'fruit', x: x, z: z, y: 0.4,
        vx: rnd(-4, 4), vz: rnd(-1, 4), vy: rnd(3, 6.5), spin: rnd(-9, 9), rot: rnd(0, 6),
        c: FRUITS[Math.floor(Math.random() * FRUITS.length)], t: 0, life: rnd(0.7, 1.2) });
    }
  }

  function pop(text, color, x, z, y) { S.pops.push({ text: text, color: color, x: x, z: z, y: y || 2, t: 0 }); }
  let AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  /** ざらついた音（噛み砕く・叩きつける） */
  function noise(dur, vol, cut) {
    const a = audio(); if (!a) return;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    const src = a.createBufferSource(); src.buffer = buf;
    const g = a.createGain(); g.gain.value = vol || 0.05;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut || 900;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
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
    if (S.mode === 'death' && S.death && S.death.t > 1) { gameOver(S.death.reason); return; }
    if (S.mode !== 'play') return;
    dragging = true; dragX = e.clientX; baseX = S.crowd.x;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    S.crowd.x = clamp(baseX + (e.clientX - dragX) / W * (ROAD_HALF * 2.4), -WALL, WALL);
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
    S.mode = 'intro'; S.time = 0; S.killed = 0;
    S.crowd = { x: 0, z: 0, count: 0, spin: 0 };
    S.boy = { z: 6, t: 0, fly: 0, rot: 0, alpha: 1, trem: 0, tx: 0 };
    S.death = null;
    S.enemies = []; S.pops = []; S.fx = []; S.shake = 0; S.flash = 0; S.boss = null;
    buildLane();
    S.camZ = -CAM_BACK;
    elHint.textContent = 'ドラッグ / ←→ で果物を操作';
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
      '<div class="best">BEST ' + fmt(S.best) + ' 秒　/　倒した数 ' + S.killed + '　残り ' + Math.ceil(S.crowd.count) + ' 個</div>' +
      '<p>ゲートの選び方で果物の数が決まる。<br>クマ 1 頭に 50 個。足りるように育てろ。</p>' +
      '<button data-act="retry">もう一度ころがす</button>'
    );
  }
  function gameOver(reason) {
    S.mode = 'over';
    sfx(200, 0.45, 'sawtooth', 0.07, 60);
    showCard(
      '<span class="tag">GAME OVER</span>' +
      '<h2>' + reason + '</h2>' +
      '<p>進んだ距離 <b>' + Math.round(S.crowd.z / S.lane * 100) + '%</b>　/　倒した数 ' + S.killed + '</p>' +
      '<div class="time">' + fmt(S.time) + '<span style="font-size:20px"> 秒</span></div>' +
      '<button data-act="retry">もう一度ころがす</button>'
    );
  }
  function showCard(html) { card.innerHTML = html; overlay.classList.remove('hidden'); }

  // ---------------------------------------------------------------- 最期（クマに喰われる）
  // 果物を食い破ったクマは、そのまま坂を駆け上がって、転んだままの少年に追いつく。
  const DT_DARK = 0.80, DT_CUT = 1.15, DT_HIT = 2.60, DT_SINK = 3.55, DT_CARD = 4.55;
  function deathByBear(reason) {
    if (S.mode === 'death') return;
    S.mode = 'death';
    S.death = { t: 0, bz: 0, bx: 0, cut: false, hit: false, sink: false,
                drops: [], splats: [], claws: [], reason: reason || 'クマに喰い殺された…' };
    const c = S.crowd;
    burstFruit(c.x, c.z, 24); puff(c.x, c.z, 16, true);
    c.count = 0;
    S.shake = 1.5; S.flash = 1;
    elHint.textContent = '';
    if (S.boss) { S.boss.fight = false; S.boss.lunge = 1; }
    sfx(90, 0.7, 'sawtooth', 0.09, 42);
    noise(0.55, 0.06, 700);
  }

  function spatter(n, big) {
    const D = S.death;
    for (let i = 0; i < n; i++) {
      const a = rnd(-2.6, -0.5), v = rnd(320, 980) * (big ? 1.3 : 1);
      D.drops.push({ x: W / 2 + rnd(-W * 0.18, W * 0.18), y: H * rnd(0.42, 0.62),
                     vx: Math.cos(a) * v * rnd(-1, 1), vy: Math.sin(a) * v,
                     r: rnd(4, big ? 26 : 14), t: 0, life: rnd(0.6, 1.4) });
    }
  }
  function lensSplat(n) {
    const D = S.death;
    for (let i = 0; i < n; i++) {
      const r = rnd(10, 46), blobs = [[0, 0, r]];
      for (let k = 0, m = Math.floor(rnd(2, 5)); k < m; k++) {
        const a = rnd(0, 6.28), d = r * rnd(0.6, 1.3);
        blobs.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, r * rnd(0.28, 0.62)]);
      }
      D.splats.push({ x: rnd(0.06, 0.94) * W, y: rnd(0.12, 0.92) * H, blobs: blobs, a: 0 });
    }
  }
  /** ベタ塗り＋黒フチの血の塊（採用デザインのタッチに合わせて 2 パスで描く） */
  function blobs(list, x, y, sc, fill) {
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (const b of list) {
        const r = b[2] * sc + (pass === 0 ? Math.max(2.5, b[2] * sc * 0.17) : 0);
        if (r <= 0) continue;
        ctx.moveTo(x + b[0] * sc + r, y + b[1] * sc);
        ctx.arc(x + b[0] * sc, y + b[1] * sc, r, 0, 7);
      }
      ctx.fillStyle = pass === 0 ? '#1b1b1f' : fill;
      ctx.fill();
    }
  }

  function updateDeath(dt) {
    const D = S.death, B = S.boy;
    D.t += dt;
    if (D.t < DT_DARK) {                                  // ① 目の前で果物が食い破られる
      if (S.boss) { S.boss.lunge = Math.min(1, (S.boss.lunge || 0) + dt * 4); S.boss.z -= 5 * dt; }
      S.shake = Math.max(S.shake, 0.7);
      return;
    }
    if (!D.cut && D.t >= DT_CUT) {                        // ② 坂の上へカット。クマが駆け上がってくる
      D.cut = true;
      S.camZ = B.z - 5.2;
      D.bz = B.z + 32; D.bx = 0;
      B.trem = 1;
      pop('！', '#ff5f56', 0.9, B.z, 2.6);
      sfx(70, 0.9, 'sawtooth', 0.07, 45);
    }
    if (!D.cut) return;
    S.camZ = B.z - 5.2;

    if (!D.hit) {                                         // ③ 距離を詰める（だんだん速く）
      const u = clamp((D.t - DT_CUT) / (DT_HIT - DT_CUT), 0, 1);
      D.bz = B.z + 32 - 30.6 * Math.pow(u, 1.9);
      D.bx = Math.sin(D.t * 7) * 0.25 * (1 - u);
      if (u > 0.55 && !D.roar) { D.roar = true; sfx(120, 0.5, 'sawtooth', 0.08, 55); noise(0.3, 0.05, 500); }
      if (u >= 1) {                                       // ④ 喰らいつく
        D.hit = true; D.bz = B.z + 0.7; D.bx = 0.9;
        S.shake = 1.8; S.flash = 1;
        B.fly = 0.2; B.vy = 6.2; B.rot = 0; B.spin = -8.0; B.tx = -0.2; B.vx = -2.2; B.trem = 0;
        spatter(26, true); lensSplat(9);
        D.claws.push({ t: 0, a: -0.55 }, { t: -0.12, a: -0.42 }, { t: -0.24, a: -0.68 });
        sfx(60, 0.8, 'sawtooth', 0.1, 30);
        noise(0.45, 0.09, 1600);
      }
      return;
    }

    // ⑤ 噛み砕かれる。少年は宙に舞って、落ちて、消える
    const e = D.t - DT_HIT;
    D.close = e > 0.5;                                    // ここから画面いっぱいのクマに寄る
    D.bx += (0.35 - D.bx) * Math.min(1, dt * 4);
    D.bz += (B.z + 0.15 - D.bz) * Math.min(1, dt * 3);
    B.vy -= 16 * dt; B.fly = Math.max(0, B.fly + B.vy * dt);
    B.tx += B.vx * dt; B.rot += B.spin * dt;
    if (B.fly <= 0 && B.vy < 0) { B.vy *= -0.35; B.vx *= 0.5; B.spin *= 0.5; }
    B.alpha = clamp(1 - (e - 0.40) / 0.22, 0, 1);
    if (e > 0.28 && !D.bite2) { D.bite2 = true; spatter(18, true); lensSplat(6); noise(0.4, 0.08, 1200); sfx(55, 0.6, 'sawtooth', 0.09, 28); }
    if (e > 0.62 && !D.bite3) { D.bite3 = true; spatter(14); lensSplat(5); noise(0.5, 0.07, 900); }
    if (D.t > DT_SINK && !D.sink) { D.sink = true; sfx(80, 1.2, 'sawtooth', 0.06, 34); }
    for (let i = D.drops.length - 1; i >= 0; i--) {       // 飛び散った血しぶき
      const d = D.drops[i]; d.t += dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 2200 * dt;
      if (d.t > d.life || d.y > H + 60) D.drops.splice(i, 1);
    }
    for (const c of D.claws) c.t += dt;
    for (const sp of D.splats) sp.a = Math.min(1, sp.a + dt * 8);
    S.shake = Math.max(S.shake, clamp(0.55 - e * 0.35, 0, 1));
    if (D.t >= DT_CARD) gameOver(D.reason);
  }

  /** 画面いっぱいのクマ（噛みついている最中）と、血しぶき・爪痕 */
  function drawDeathOverlay() {
    const D = S.death; if (!D) return;
    if (D.t < DT_CUT) {                                    // カットの直前は暗転
      const k = clamp((D.t - DT_DARK) / (DT_CUT - DT_DARK), 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,' + k + ')'; ctx.fillRect(0, 0, W, H);
      return;
    }
    if (D.t < DT_CUT + 0.3) {                              // カット直後に暗転を抜く
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - (D.t - DT_CUT) / 0.3) + ')'; ctx.fillRect(0, 0, W, H);
    }
    if (!D.hit) return;
    const e = D.t - DT_HIT;

    // 顔まで寄ったクマ（画面を埋めて、咥えたまま振り回す）
    const im = SPR['boss-bear'];
    if (D.close && im && im.complete && im.naturalWidth) {
      const u = clamp((e - 0.5) / 0.35, 0, 1);
      const h = H * (1.75 + u * 0.55), w = h * im.naturalWidth / im.naturalHeight;
      const sw = clamp(1.3 - e * 0.5, 0, 1);
      const shakeY = Math.sin(e * 33) * H * 0.02 * sw, shakeX = Math.sin(e * 26 + 1) * W * 0.05 * sw;
      ctx.save();
      ctx.drawImage(im, W / 2 - w / 2 + shakeX, H * 0.52 - h * 0.17 + shakeY, w, h);
      if (D.sink) {                                        // 最後は真っ黒いシルエットに沈む
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(12,10,12,' + clamp((D.t - DT_SINK) / 0.5, 0, 0.92) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // 爪痕（画面を斜めに走る）
    for (const c of D.claws) {
      if (c.t <= 0) continue;
      const u = clamp(c.t / 0.18, 0, 1), len = W * 1.6, th = H * 0.018;
      const x0 = -W * 0.25, y0 = H * (0.30 + (c.a + 0.7) * 1.15);
      ctx.save();
      ctx.translate(x0, y0); ctx.rotate(c.a);
      ctx.globalAlpha = clamp(1.5 - c.t / 0.8, 0, 1);
      for (let pass = 0; pass < 2; pass++) {
        const k = pass === 0 ? th * 0.55 : 0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * u * 0.45, -th - k, len * u, 0);
        ctx.quadraticCurveTo(len * u * 0.45, th + k, 0, 0);
        ctx.fillStyle = pass === 0 ? '#1b1b1f' : (c.t < 0.12 ? '#fff' : '#a80f12');
        ctx.fill();
      }
      ctx.restore();
    }

    // レンズに貼りついた血（トゥーン調：ベタ塗り＋黒フチ）
    for (const sp of D.splats) blobs(sp.blobs, sp.x, sp.y, sp.a, '#c1121f');
    for (const d of D.drops) blobs([[0, 0, d.r]], d.x, d.y, 1, '#e01b24');

    if (e < 0.75) {                                        // 噛み砕く音を画面に大きく出す
      ctx.save();
      ctx.globalAlpha = clamp(1 - e / 0.75, 0, 1);
      ctx.translate(W * 0.5, H * 0.34); ctx.rotate(-0.12);
      worldText('ゴキッ', 0, 0, Math.max(34, W * 0.17), '#fff');
      ctx.restore();
    } else if (e < 1.4) {
      ctx.save();
      ctx.globalAlpha = clamp(1 - (e - 0.75) / 0.65, 0, 1);
      ctx.translate(W * 0.52, H * 0.62); ctx.rotate(0.16);
      worldText('バキバキ', 0, 0, Math.max(28, W * 0.14), '#e01b24');
      ctx.restore();
    }
    if (D.sink) {                                          // 赤黒く沈んでいく
      const k = clamp((D.t - DT_SINK) / (DT_CARD - DT_SINK), 0, 1);
      ctx.fillStyle = 'rgba(40,2,6,' + k * 0.88 + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = clamp(k / 0.35, 0, 1);
      worldText('喰われた', W / 2, H * 0.2, Math.max(34, W * 0.17), '#e01b24');
      ctx.globalAlpha = 1;
    }
  }

  function title() {
    S.mode = 'title';
    buildLane();
    S.crowd = { x: 0, z: 0, count: 0, spin: 0 };
    S.camZ = -CAM_BACK;
    showCard(
      '<h1>フルトリランナー<small>F U R U T O R I　R U N N E R</small></h1>' +
      '<div class="rules">' +
      '🤸 少年が坂で転ぶ。こぼれた<b>3 個の果物</b>が転がり出す。<br>' +
      '👉 <b>操作するのは転がる果物</b>。少年は坂の上で転んだまま。<br>' +
      '🚪 <b>ゲート</b>をくぐるたびに増減する（×3 や ÷2）。<br>' +
      '🐵 向かってくる動物を数で押し倒す。<br>' +
      '　　ウリ坊とサルは <b>1 個</b>、イノシシは <b>10 個</b>、クマは <b>50 個</b>。<br>' +
      '⏱ 全部を抜けてゴールするまでの<b>タイム</b>を競う。' +
      '</div>' +
      '<button data-act="retry">ころがす</button>'
    );
  }

  // ---------------------------------------------------------------- 更新
  function update(dt) {
    S.clock += dt;
    S.shake = Math.max(0, S.shake - dt * 3);
    S.flash = Math.max(0, S.flash - dt * 2.6);
    for (let i = S.pops.length - 1; i >= 0; i--) {
      const p = S.pops[i]; p.t += dt; p.y += dt * 1.8;
      if (p.t > 1.3) S.pops.splice(i, 1);
    }
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i];
      f.t += dt;
      if (f.kind !== 'plus' && f.kind !== 'shot' && f.kind !== 'flash') {
        f.x += f.vx * dt; f.z += f.vz * dt;
        f.vy -= (f.kind === 'fruit' ? 14 : 3.2) * dt;
        f.y += f.vy * dt;
      }
      if (f.kind === 'shot') {
        const u = clamp(f.t / f.life, 0, 1);
        f.x = f.x + (f.tx - f.x) * Math.min(1, dt * 12);
        f.z = f.z + (f.tz - f.z) * Math.min(1, dt * 12);
        f.y = 0.4 + Math.sin(u * Math.PI) * 2.2 + u * f.ty * 0.3;
        if (u >= 1) {
          S.fx.push({ kind: 'flash', x: f.tx, z: f.tz, y: f.ty, t: 0, life: 0.22, r: rnd(0.5, 0.9) });
          S.fx.splice(i, 1); continue;
        }
      } else if (f.kind === 'flash') {
        // その場で膨らんで消える
      } else if (f.kind === 'plus') {
        const u = clamp(f.t / f.life, 0, 1);
        f.x += (f.tx - f.x) * Math.min(1, dt * 11);
        f.z += (S.crowd.z - f.z) * Math.min(1, dt * 11);
        f.y = 1.1 + Math.sin(u * Math.PI) * 0.9;
      } else if (f.kind === 'fruit') {
        f.rot += f.spin * dt;
        if (f.y < 0.12) { f.y = 0.12; f.vy *= -0.45; f.vx *= 0.7; f.vz *= 0.7; }
      } else { f.r += dt * 1.1; }
      if (f.t > f.life) S.fx.splice(i, 1);
    }
    if (S.mode === 'title') { S.camZ += dt * 4; if (S.camZ > 60) S.camZ = -CAM_BACK; return; }
    if (S.mode === 'death') { updateDeath(dt); return; }
    if (S.mode === 'goal' || S.mode === 'over') return;

    const c = S.crowd;

    // ── 導入：少年が転んで果物がこぼれる
    if (S.mode === 'intro') {
      S.boy.t += dt; S.time += dt;
      if (S.boy.t > 0.75 && c.count === 0) {
        c.count = 3; c.z = S.boy.z + 1.5;
        pop('3 個こぼれた！', '#ffd166', 0, c.z + 2, 3);
        S.shake = 0.6; sfx(280, 0.2, 'square', 0.05, 110);
      }
      if (S.boy.t > 2.0) { S.mode = 'play'; }   // 転ぶところを見せる間
      S.camZ = Math.max(-CAM_BACK, c.z - CAM_BACK);
      return;
    }

    // ── 本編：転がる果物がプレイヤー
    S.time += dt;
    // 敵とぶつかっている間は押し合いになって前に進めない（タイムも食う）
    const grinding = S.enemies.some(e => !e.dead && Math.abs(e.z - c.z) < 3.2 &&
                                    Math.abs(e.x - c.x) < crowdRadius(c.count) + 1.2);
    const bossFight = S.boss && S.boss.fight && !S.boss.dead;
    const speed = (23 + Math.min(6, c.z * 0.012)) * (bossFight ? 0 : grinding ? 0.42 : 1);        // 坂なので少しずつ速くなる
    if (S.keyDir) c.x = clamp(c.x + S.keyDir * 7.5 * dt, -WALL, WALL);
    const prevZ = c.z;
    c.z += speed * dt;
    c.spin += speed * dt * 0.8;
    S.camZ = c.z - CAM_BACK;
    S.dustT -= dt;                                     // 転がった跡の土埃
    if (S.dustT <= 0) {
      S.dustT = 0.07;
      const r = crowdRadius(c.count);
      puff(c.x + rnd(-r, r), c.z - r * 0.6, 1, c.count > 60);
    }

    // 壁のパネル：寄っている側のぶんだけ拾える（真ん中を走ると何ももらえない）
    for (const it of S.items) {
      if (it.type !== 'ladder') continue;
      const side = c.x < -1.3 ? 'L' : (c.x > 1.3 ? 'R' : null);
      if (!side) continue;
      const v = side === 'L' ? it.vL : it.vR;
      for (let k = 0; k < it.n; k++) {
        const pz = it.z + k * it.sp;
        if (pz <= prevZ || pz > c.z) continue;
        c.count = clamp(c.count + v, 1, MAX_FRUIT);
        it.lit[k] = 1;                                  // パネルが光る
        const wx = (side === 'L' ? -1 : 1) * (ROAD_HALF - 1.7);
        S.fx.push({ kind: 'plus', x: wx, z: pz, y: 1.1, tx: c.x, tz: c.z, txt: '+' + v,
                    big: v >= Math.max(it.vL, it.vR), t: 0, life: 0.42 });
        puff(c.x, c.z, 2);
        sfx(v >= Math.max(it.vL, it.vR) ? 880 : 700, 0.05, 'square', 0.035, 1200);
      }
    }
    // 木箱：ぶつかると数字ぶんの果物を消費して壊す。足りなければそこで終わり。
    for (const it of S.items) {
      if (it.type !== 'crate' || it.dead || it.z <= prevZ || it.z > c.z) continue;
      if (Math.abs(c.x - it.x) > it.w + crowdRadius(c.count) * 0.5) continue;
      const dmg = Math.min(c.count, it.hp);
      c.count -= dmg; it.hp -= dmg; it.flash = 1;
      S.shake = 0.7; puff(it.x, it.z, 10, true); burstFruit(it.x, it.z, 6);
      if (it.hp <= 0) {
        it.dead = 0.001;
        pop('こわした！', '#ffd166', it.x, it.z, 2.6);
        sfx(200, 0.25, 'square', 0.06, 90);
      } else {
        pop('あと ' + it.hp, '#e3452f', it.x, it.z, 2.6);
        sfx(140, 0.3, 'sawtooth', 0.06, 70);
        return gameOver('木箱を壊しきれなかった…');
      }
    }
    // ゲート
    for (const it of S.items) {
      if (it.type !== 'gate' || it.z <= prevZ || it.z > c.z) continue;
      const op = it.ops[c.x < 0 ? 0 : 1];
      const before = c.count;
      c.count = applyOp(c.count, op);
      it.flash = 1;
      const d = c.count - before;
      pop((d >= 0 ? '+' : '') + d, d >= 0 ? '#2fbf5a' : '#e3452f', c.x, it.z, 2.6);
      sfx(d >= 0 ? 700 : 300, 0.1, d >= 0 ? 'square' : 'sawtooth', 0.045, d >= 0 ? 980 : 150);
    }

    // 波を出す
    for (const w of S.waves) if (!w.fired && c.z > w.z - 34) { w.fired = true; (w.horde ? spawnHorde : spawnWave)(w); }

    // 動物は坂を駆け上がって向かってくる
    const cr = crowdRadius(c.count);
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      const d = ANIMALS[e.kind];
      e.hurt = Math.max(0, e.hurt - dt * 4);
      if (e.dead) {
        e.dead += dt;
        e.z += e.vz * dt; e.x += e.vx * dt;
        e.vy -= 13 * dt; e.y = Math.max(0, e.y + e.vy * dt);
        e.rot += e.spin * dt;
        if (e.y <= 0 && e.vy < 0) { e.vy *= -0.4; e.spin *= 0.6; if (Math.abs(e.vy) > 1) puff(e.x, e.z, 2); }
        if (e.dead > 1.4) S.enemies.splice(i, 1);
        continue;
      }
      e.z -= e.sp * dt;
      if (!e.horde) e.x += clamp(c.x - e.x, -1, 1) * 0.35 * dt;         // ほぼ自分のレーンを走る＝大物は避けられる
      if (e.z < c.z - 5) { S.enemies.splice(i, 1); continue; }

      if (e.z <= c.z + 1.0 && e.z > c.z - 2.6 && Math.abs(e.x - c.x) < cr + d.w) {
        const dmg = Math.min(c.count, e.hp);              // 当たった数だけ削る
        c.count -= dmg; e.hp -= dmg;
        if (e.hp <= 0) {
          const dir = e.x >= c.x ? 1 : -1;
          e.dead = 0.001; e.fly = dir; S.killed++;
          e.vx = dir * rnd(2.5, 5.5); e.vz = rnd(9, 16); e.vy = rnd(4, 7);
          e.y = 0.2; e.rot = 0; e.spin = dir * rnd(7, 13);       // 回転しながら転がっていく
          puff(e.x, e.z, d.hp >= 10 ? 8 : 4, d.hp >= 10);
          burstFruit(e.x, e.z, Math.min(6, 1 + Math.floor(dmg / 6)));
          S.shake = Math.max(S.shake, d.hp >= 50 ? 0.9 : d.hp >= 10 ? 0.5 : 0.2);
          if (e.horde) puff(e.x, e.z - 0.6, 2, false);
          if (dmg >= 5) pop('-' + dmg, '#ffd166', e.x, e.z, 2.2);
          sfx(dmg >= 5 ? 320 : 620, 0.07, 'square', 0.035, dmg >= 5 ? 180 : 880);
        } else {
          e.hurt = 1;
          pop('あと ' + e.hp, '#e3452f', e.x, e.z, 2.4);
          sfx(180, 0.18, 'sawtooth', 0.05, 90);
        }
        if (c.count <= 0) {
          if (e.kind === 'bear') return deathByBear('クマに喰い殺された…');
          return gameOver(d.name + 'に食べられた…');
        }
      }
    }

    // ボス戦（手前まで来たら護衛の大群が湧く）
    const B = S.boss;
    if (B && !B.escort && c.z > B.z - 70) {
      B.escort = true;
      B.max = B.hp = Math.max(320, Math.round(c.count * 2.6));   // 見えてから数字が跳ねないよう、ここで決める
      spawnHorde({ z: B.z - 26, i: 9, n: 54 });
    }
    if (B && !B.dead) {
      B.t += dt; B.hurt = Math.max(0, B.hurt - dt * 3);
      const gap = B.z - c.z;
      if (!B.fight && gap < 13) {                       // 交戦開始
        B.fight = true;
        pop('ボスだ！', '#ff9b8a', 0, B.z - 3, 5);
        sfx(110, 0.5, 'sawtooth', 0.08, 60);
        S.shake = 1;
      }
      if (B.fight) {
        // 削り合い：こちらは数ぶんだけ削り、向こうは毎秒＋叩きつけで減らしてくる
        B.hp -= c.count * 0.85 * dt;
        c.count -= Math.max(5, c.count * 0.03) * dt;
        B.z -= Math.max(0, gap - 2.4) * 1.1 * dt;       // 目の前まで詰めてくる
        B.slam = (B.slam || 1.2) - dt;
        if (B.slam <= 0) {
          B.slam = 1.25; B.lunge = 1;
          const dmg = Math.min(c.count, clamp(Math.round(c.count * 0.09), 12, 60));
          c.count -= dmg;
          pop('-' + Math.round(dmg), '#ff5f56', 0, c.z + 2, 3);
          S.shake = 1; S.flash = 0.5;
          puff(0, c.z + 1, 10, true); burstFruit(0, c.z + 1, 5);
          sfx(130, 0.28, 'sawtooth', 0.07, 60);
        }
        B.shotT = (B.shotT || 0) - dt;                    // 果物が次々飛んでいって当たる
        if (B.shotT <= 0) {
          B.shotT = 0.09;
          S.fx.push({ kind: 'shot', x: c.x + rnd(-1.5, 1.5), z: c.z + rnd(-0.5, 1.5), y: 0.4,
                      tx: rnd(-1.6, 1.6), tz: B.z - 1.2, ty: rnd(1.5, 4.5),
                      c: FRUITS[Math.floor(Math.random() * FRUITS.length)], t: 0, life: 0.28 });
        }
        B.lunge = Math.max(0, (B.lunge || 0) - dt * 3);
        B.tele = B.slam < 0.45 ? (0.45 - B.slam) / 0.45 : 0;   // 叩きつけの予兆（危険域が濃くなる）
        if (c.count <= 0) { c.count = 0; return deathByBear('クマに喰い殺された…'); }
        if (B.hp <= 0) {
          B.hp = 0; B.dead = 0.001; S.killed++;
          pop('ボス撃破！', '#ffd166', 0, B.z, 5);
          S.shake = 1.2; S.flash = 0.6;
          puff(0, B.z - 1, 22, true); burstFruit(0, B.z - 1, 14);
          sfx(523, 0.15, 'square', 0.07); setTimeout(() => sfx(880, 0.25, 'square', 0.07), 140);
        }
      }
    }
    if (B && B.dead) { B.dead += dt; B.z += 26 * dt; }
    if (c.z >= S.lane) goal();
  }
  function crowdRadius(n) { return Math.min(0.34 * Math.sqrt(clamp(n, 1, 80)), 2.5) + 0.5; }

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
  /** 参考ゲームに合わせた「画面に置く数字」：太字＋黒フチ、必要なら影つき */
  function worldText(text, x, y, size, color) {
    ctx.font = '900 ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.26; ctx.strokeStyle = '#1b1b1f';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, x, y);
  }

  function shadow(p, r) {
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.3, 0, 0, 7); ctx.fill();
  }
  function sprite(name, p, worldH) {
    const im = SPR[name];
    if (!im || !im.complete || !im.naturalWidth) return;
    const h = worldH * p.s, w = h * im.naturalWidth / im.naturalHeight;
    ctx.drawImage(im, p.x - w / 2, p.y - h, w, h);
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
      if (p.dz < 60) worldText(op.label, x0 + half / 2, y - h * 0.55, clamp(s * 0.85, 12, 60), '#fff');
    }
    ctx.globalAlpha = 1;
    it.flash = Math.max(0, it.flash - 0.04);
  }
  /** 左右の壁に並ぶパネル（渋い方は青、大きい方は黄色） */
  function drawLadder(it) {
    const cx = S.crowd.x;
    for (let k = it.n - 1; k >= 0; k--) {
      const pz = it.z + k * it.sp;
      const p = project(0, pz, 0);
      if (!p || p.dz > 95 || p.dz < 2) continue;
      const passed = pz <= S.crowd.z;
      for (const sd of [-1, 1]) {
        const v = sd < 0 ? it.vL : it.vR;
        const big = v >= Math.max(it.vL, it.vR);   // 大きい方の壁は黄色
        const x0 = sd * (ROAD_HALF - 1.7);
        const q = project(x0, pz, 0);
        if (!q) continue;
        const s = q.s, h = 1.9 * s, w = 2.5 * s;
        const lit = it.lit[k];
        if (lit) { it.lit[k] = Math.max(0, lit - 0.05); }
        ctx.globalAlpha = passed && !lit ? 0.16 : clamp((95 - p.dz) / 24, 0, 1);
        ctx.fillStyle = lit ? '#fff' : (big ? '#ffc93c' : '#3ba7ef');
        ctx.fillRect(q.x - w / 2, q.y - h, w, h * 0.92);
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.strokeRect(q.x - w / 2, q.y - h, w, h * 0.92);
        ctx.fillStyle = 'rgba(0,0,0,.14)';                 // 下端の陰でブロック感を出す
        ctx.fillRect(q.x - w / 2, q.y - h * 0.22, w, h * 0.14);
        worldText('+' + v, q.x, q.y - h * 0.52, clamp(s * 0.7, 11, 44), lit ? '#1b1b1f' : (big ? '#1b1b1f' : '#fff'));
        ctx.globalAlpha = 1;
      }
    }
  }

  /** 木箱（耐久値つきの障害物） */
  function drawCrate(it) {
    if (it.dead) { it.dead += 0.02; if (it.dead > 1.2) return; }
    const p = project(it.x, it.z, 0);
    if (!p || p.dz > 100 || p.dz < 1.5) return;
    const s = p.s, w = it.w * 2 * s, h = 2.2 * s;
    ctx.save();
    if (it.dead) { ctx.globalAlpha = clamp(1.2 - it.dead, 0, 1); ctx.translate(0, it.dead * 30); }
    ctx.fillStyle = it.flash > 0.1 ? '#fff' : '#a3703f';
    ctx.fillRect(p.x - w / 2, p.y - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    ctx.fillRect(p.x - w / 2, p.y - h * 0.34, w, h * 0.34);
    ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(3, s * 0.09);
    ctx.strokeRect(p.x - w / 2, p.y - h, w, h);
    ctx.lineWidth = Math.max(2, s * 0.05);               // 板の目
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, p.y - h * 0.66); ctx.lineTo(p.x + w / 2, p.y - h * 0.66);
    ctx.moveTo(p.x - w / 2, p.y - h * 0.34); ctx.lineTo(p.x + w / 2, p.y - h * 0.34);
    ctx.stroke();
    worldText(Math.max(0, Math.ceil(it.hp)), p.x, p.y - h * 0.5, clamp(s * 0.95, 14, 58), '#fff');
    ctx.restore();
    it.flash = Math.max(0, it.flash - 0.06);
  }

  /** ボス（強化クマ）と画面上の HP バー */
  function drawBoss() {
    const B = S.boss;
    const p = project(0, B.z, 0);
    if (!p) return;
    const sway = Math.sin(B.t * 1.6) * 0.02;
    {                                                  // 背後の木箱の壁（道を閉じている感じ）
      const w0 = project(0, B.z + 5, 0);
      if (w0 && w0.dz > 2) {
        const s0 = w0.s, ww = ROAD_HALF * 2 * s0 * 0.98, hh = 2.6 * s0;
        ctx.fillStyle = '#a3703f'; ctx.fillRect(w0.x - ww / 2, w0.y - hh, ww, hh);
        ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(w0.x - ww / 2, w0.y - hh * 0.34, ww, hh * 0.34);
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(3, s0 * 0.09);
        ctx.strokeRect(w0.x - ww / 2, w0.y - hh, ww, hh);
        ctx.lineWidth = Math.max(2, s0 * 0.05); ctx.beginPath();
        for (let k = 1; k < 4; k++) { ctx.moveTo(w0.x - ww / 2 + ww * k / 4, w0.y - hh); ctx.lineTo(w0.x - ww / 2 + ww * k / 4, w0.y); }
        ctx.moveTo(w0.x - ww / 2, w0.y - hh * 0.66); ctx.lineTo(w0.x + ww / 2, w0.y - hh * 0.66);
        ctx.stroke();
      }
    }
    if (B.fight && !B.dead) {                          // 足元から伸びる赤い危険域
      const a = project(0, B.z - 1, 0), bq = project(0, S.crowd.z - 1, 0);
      if (a && bq) {
        const tele = B.tele || 0;
        ctx.fillStyle = 'rgba(227,69,47,' + (0.14 + tele * 0.42 * (0.6 + 0.4 * Math.abs(Math.sin(S.clock * 26)))) + ')';
        ctx.beginPath();
        ctx.moveTo(W / 2 - 2.2 * a.s, a.y); ctx.lineTo(W / 2 + 2.2 * a.s, a.y);
        ctx.lineTo(W / 2 + 3.4 * bq.s, bq.y); ctx.lineTo(W / 2 - 3.4 * bq.s, bq.y);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.save();
    ctx.globalAlpha = B.dead ? clamp(1.4 - B.dead, 0, 1) : 1;
    if (B.hurt > 0.1) ctx.globalAlpha *= 0.55 + 0.45 * Math.abs(Math.sin(S.clock * 30));
    shadow(p, p.s * 1.5);
    sprite('boss-bear', { x: p.x + sway * p.s, y: p.y, s: p.s }, 7.6 * (1 + (B.lunge || 0) * 0.08));
    ctx.restore();
    if (!B.dead && p.dz < 120) {                       // 頭上の大きな HP バー
      const bw = clamp(p.s * 5.2, 90, 300), bh = Math.max(9, p.s * 0.32);
      const by = p.y - 7.6 * p.s - bh * 2.0;
      ctx.fillStyle = '#1b1b1f'; ctx.fillRect(p.x - bw / 2 - 3, by - 3, bw + 6, bh + 6);
      ctx.fillStyle = '#5a1f1f'; ctx.fillRect(p.x - bw / 2, by, bw, bh);
      ctx.fillStyle = '#e33b2e'; ctx.fillRect(p.x - bw / 2, by, bw * clamp(B.hp / B.max, 0, 1), bh);
      worldText(Math.ceil(B.hp), p.x, by - bh, clamp(p.s * 0.6, 14, 40), '#fff');
    }
  }

  /** 坂を駆け上がってくるクマ（最期の演出） */
  function drawChaseBear() {
    const D = S.death; if (!D) return;
    const p = project(D.bx, D.bz, 0);
    if (!p) return;
    const run = Math.abs(Math.sin(D.t * 13)) * 0.12;
    shadow(p, p.s * 1.3);
    if (D.hit) {                                        // 食らいついて前のめりに振り回す
      const e = D.t - DT_HIT;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(Math.sin(e * 30) * 0.10 - 0.16); ctx.translate(-p.x, -p.y);
      sprite('boss-bear', { x: p.x, y: p.y, s: p.s }, 7.6);
      ctx.restore();
      return;
    }
    sprite('boss-bear', { x: p.x, y: p.y, s: p.s }, 7.6 * (1 + run));
  }

  const layoutCache = {};
  function layout(n) {
    if (!layoutCache[n]) {
      const a = [];
      for (let i = 0; i < n; i++) {
        const ang = i * 2.39996, r = Math.min(0.34 * Math.sqrt(i), 2.5);
        a.push([Math.cos(ang) * r, Math.sin(ang) * r * 0.8]);
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
    if (S.boy.z - S.camZ > 0.8) list.push({ type: 'boy', z: S.boy.z });
    const c = S.crowd;
    if (c.count > 0) {
      const n = clamp(Math.ceil(c.count), 1, 44), off = layout(n);
      for (let i = 0; i < n; i++) list.push({ type: 'fruit', i: i, x: c.x + off[i][0], z: c.z + off[i][1] });
    }
    const DD = S.death;
    if (S.boss && !(DD && DD.cut)) list.push({ type: 'boss', z: S.boss.z });
    if (DD && DD.cut && !DD.close) list.push({ type: 'dbear', z: DD.bz });
    list.sort((a, b) => (b.z + (b.type === 'gate' ? 1.4 : 0)) - (a.z + (a.type === 'gate' ? 1.4 : 0)));

    for (const o of list) {
      if (o.type === 'gate') { drawGate(o); continue; }
      if (o.type === 'ladder') { drawLadder(o); continue; }
      if (o.type === 'crate') { drawCrate(o); continue; }
      if (o.type === 'boss') { drawBoss(); continue; }
      if (o.type === 'dbear') { drawChaseBear(); continue; }
      const p = project(o.x !== undefined ? o.x : 0, o.z, 0);
      if (!p) continue;
      if (o.type === 'tree') drawTree(p, p.s * o.h * 0.95);
      else if (o.type === 'fruit') drawFruit(p, p.s * 0.55, FRUITS[o.i % FRUITS.length], c.spin + o.i);
      else if (o.type === 'boy') {
        const b = S.boy;
        if (b.alpha === 0) continue;
        const tr = b.trem ? rnd(-0.07, 0.07) : 0;
        const bp = project((b.tx || 0) + tr, o.z, b.fly || 0);
        if (!bp) continue;
        ctx.save();
        if (b.alpha !== undefined) ctx.globalAlpha = b.alpha;
        if (!b.fly) shadow(bp, bp.s * 0.5);
        const ay = bp.y + bp.s * 0.2, ax = bp.x;
        if (b.rot) { ctx.translate(ax, ay - bp.s * 0.95); ctx.rotate(b.rot); ctx.translate(-ax, -(ay - bp.s * 0.95)); }
        sprite('boy-fall', { x: ax, y: ay, s: bp.s }, 1.9);
        ctx.restore();
      }
      else if (o.type === 'enemy') {
        const e = o.e, d = ANIMALS[e.kind], sc = e.sc || 1;
        const q = project(e.x, e.z, e.dead ? e.y : 0);     // ← 敵は自分の x で描く
        if (!q) continue;
        if (e.dead) {
          ctx.save();
          ctx.globalAlpha = clamp(1.4 - e.dead, 0, 1);
          ctx.translate(q.x, q.y - d.h * q.s * sc * 0.5); ctx.rotate(e.rot);
          sprite(d.spr, { x: 0, y: d.h * q.s * sc * 0.5, s: q.s }, d.h * sc);
          ctx.restore();
        } else {
          shadow(q, q.s * d.w * sc * 0.45);
          const run = Math.abs(Math.sin(S.clock * 9 + e.t)) * 0.07;
          if (e.hurt > 0) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 30)); }
          sprite(d.spr, q, d.h * sc * (1 + run));
          if (e.hurt > 0) ctx.restore();
          if (e.max > 1 && !e.horde) {                     // 頭上に HP バーと残り数
            const fs = clamp(q.s * 0.5, 11, 28);
            const by = q.y - d.h * q.s * sc - fs * 0.5;
            const bw = clamp(q.s * d.w * 1.6, 26, 120), bh = Math.max(5, fs * 0.28);
            ctx.fillStyle = '#1b1b1f';
            ctx.fillRect(q.x - bw / 2 - 2, by + fs * 0.62 - 2, bw + 4, bh + 4);
            ctx.fillStyle = '#5a1f1f';
            ctx.fillRect(q.x - bw / 2, by + fs * 0.62, bw, bh);
            ctx.fillStyle = '#e33b2e';
            ctx.fillRect(q.x - bw / 2, by + fs * 0.62, bw * clamp(e.hp / e.max, 0, 1), bh);
            worldText(e.hp, q.x, by, fs, '#fff');
          }
        }
      }
    }

    drawWaveSigns();

    // 土埃と跳ねた果物
    for (const f of S.fx) {
      const q = project(f.x, f.z, f.y);
      if (!q) continue;
      const a = clamp(1 - f.t / f.life, 0, 1);
      if (f.kind === 'shot') {
        drawFruit({ x: q.x, y: q.y, s: q.s }, q.s * 0.42, f.c, f.t * 20);
      } else if (f.kind === 'flash') {
        const u = f.t / f.life, r = f.r * q.s * (0.5 + u * 1.6);
        ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7);
        ctx.fillStyle = u < 0.4 ? '#fff6b0' : '#ff9a2e'; ctx.fill();
        ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.stroke();
        ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.45, 0, 7);
        ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.globalAlpha = 1;
      } else if (f.kind === 'plus') {
        ctx.globalAlpha = clamp(1.6 - f.t / f.life, 0, 1);
        worldText(f.txt, q.x, q.y, clamp(q.s * (f.big ? 1.0 : 0.8), 14, 52), f.big ? '#ffd166' : '#eafff0');
        ctx.globalAlpha = 1;
      } else if (f.kind === 'dust') {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = '#efe0c6';
        ctx.beginPath(); ctx.arc(q.x, q.y, f.r * q.s * 0.5, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = a;
        drawFruit({ x: q.x, y: q.y, s: q.s }, q.s * 0.4, f.c, f.rot);
        ctx.globalAlpha = 1;
      }
    }

    if (c.count > 0) {
      const p = project(c.x, c.z, 2.4);
      if (p) worldText(Math.ceil(c.count), p.x, p.y, clamp(p.s * 0.95, 18, 58), '#fff');
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of S.pops) {
      const q = project(p.x, p.z, p.y);
      if (!q) continue;
      ctx.globalAlpha = clamp(1.4 - p.t, 0, 1);
      worldText(p.text, q.x, q.y, clamp(q.s * 0.8, 13, 42), p.color);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S.flash > 0) { ctx.fillStyle = 'rgba(227,69,47,' + (S.flash * 0.3) + ')'; ctx.fillRect(0, 0, W, H); }
    if (S.death) drawDeathOverlay();
  }

  // ---------------------------------------------------------------- HUD
  let lastC = -1, lastSc = -1;
  function hud() {
    const n = Math.ceil(S.crowd.count);
    if (n !== lastC) { elStock.textContent = n; lastC = n; }
    const sc = S.killed * 10 + n;   // n はすでに整数
    if (sc !== lastSc) { elScore.textContent = sc; lastSc = sc; }
    elTimer.textContent = S.mode === 'title' ? '0.00' : fmt(S.time);
    elBest.textContent = S.best ? fmt(S.best) : '--.--';
    elBar.style.width = (clamp(S.crowd.z / S.lane, 0, 1) * 100) + '%';
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
    setX: x => { S.crowd.x = clamp(x, -WALL, WALL); },
    pause: v => { S.paused = !!v; },
    ctx: ctx,
  };

  resize();
  title();
  requestAnimationFrame(frame);
})();
