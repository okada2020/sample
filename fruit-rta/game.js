/* =========================================================================
   フルーツ転倒RTA  (Fruit Tumble RTA)
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
  const ROAD_HALF = 5.6, CAM_BACK = 6.5, SLOPE = 0.16, WALL = ROAD_HALF - 0.6;

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
  ['boy-back', 'boy-fall', 'bear', 'monkey', 'boar', 'uribou'].forEach(n => {
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
    mode: 'title',                       // title | intro | play | goal | over
    time: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    crowd: { x: 0, z: 0, count: 0, spin: 0 },   // ← プレイヤーはこの「転がる果物」
    boy: { z: 6, t: 0 },                        // 少年は坂の上で転んだまま動かない
    enemies: [], items: [], waves: [], scenery: [], pops: [],
    lane: 0, camZ: -CAM_BACK, shake: 0, flash: 0, keyDir: 0, clock: 0, killed: 0,
    fx: [], dustT: 0,
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
      return { z: z, i: i, kind: e.kind, n: e.n, fired: false };
    }
    let z = 30, gi = 0;
    // 出だしの 2 枚は両側とも当たり。3 個をまず育ててから戦わせる。
    S.items.push(makeGate(z, gi++, true)); z += 22;
    S.items.push(makeGate(z, gi++, true)); z += 26;
    for (let i = 0; i < 12; i++) {
      const w = waveFor(z, i);
      S.waves.push(w);
      z += 26 + w.n * 9;   // 1 体ずつ出てくるぶんの間隔
      S.items.push(makeGate(z, gi++));
      z += 22;
    }
    S.lane = z + 26;
    S.scenery = [];
    for (let k = 0; k < 90; k++)
      S.scenery.push({ z: rnd(-8, S.lane + 40),
        x: (Math.random() < 0.5 ? -1 : 1) * rnd(ROAD_HALF + 1.4, ROAD_HALF + 14), h: rnd(2.4, 4.4) });
    S.scenery.sort((a, b) => a.z - b.z);
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
  function spawnWave(w) {
    const d = ANIMALS[w.kind];
    for (let i = 0; i < w.n; i++) {
      S.enemies.push({
        kind: w.kind, hp: d.hp, max: d.hp,
        z: w.z + 20 + i * 9,                       // 前後に離して、順番に向かってくる
        x: clamp(rnd(-WALL + d.w, WALL - d.w), -WALL, WALL),
        sp: d.sp * rnd(0.9, 1.1), t: rnd(0, 6), dead: 0, hurt: 0,
      });
    }
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
    S.boy = { z: 6, t: 0 };
    S.enemies = []; S.pops = []; S.fx = []; S.shake = 0; S.flash = 0;
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
      '<div class="best">BEST ' + fmt(S.best) + ' 秒　/　倒した数 ' + S.killed + '　残り ' + S.crowd.count + ' 個</div>' +
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

  function title() {
    S.mode = 'title';
    buildLane();
    S.crowd = { x: 0, z: 0, count: 0, spin: 0 };
    S.camZ = -CAM_BACK;
    showCard(
      '<h1>フルーツ転倒RTA<small>F R U I T　T U M B L E　R T A</small></h1>' +
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
      f.x += f.vx * dt; f.z += f.vz * dt;
      f.vy -= (f.kind === 'fruit' ? 14 : 3.2) * dt;
      f.y += f.vy * dt;
      if (f.kind === 'fruit') {
        f.rot += f.spin * dt;
        if (f.y < 0.12) { f.y = 0.12; f.vy *= -0.45; f.vx *= 0.7; f.vz *= 0.7; }
      } else { f.r += dt * 1.1; }
      if (f.t > f.life) S.fx.splice(i, 1);
    }
    if (S.mode === 'title') { S.camZ += dt * 4; if (S.camZ > 60) S.camZ = -CAM_BACK; return; }
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
    const speed = 21 + Math.min(6, c.z * 0.012);        // 坂なので少しずつ速くなる
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

    // ゲート
    for (const it of S.items) {
      if (it.z <= prevZ || it.z > c.z) continue;
      const op = it.ops[c.x < 0 ? 0 : 1];
      const before = c.count;
      c.count = applyOp(c.count, op);
      it.flash = 1;
      const d = c.count - before;
      pop((d >= 0 ? '+' : '') + d, d >= 0 ? '#2fbf5a' : '#e3452f', c.x, it.z, 2.6);
      sfx(d >= 0 ? 700 : 300, 0.1, d >= 0 ? 'square' : 'sawtooth', 0.045, d >= 0 ? 980 : 150);
    }

    // 波を出す
    for (const w of S.waves) if (!w.fired && c.z > w.z - 34) { w.fired = true; spawnWave(w); }

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
      e.x += clamp(c.x - e.x, -1, 1) * 0.35 * dt;         // ほぼ自分のレーンを走る＝大物は避けられる
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
          if (dmg >= 5) pop('-' + dmg, '#ffd166', e.x, e.z, 2.2);
          sfx(dmg >= 5 ? 320 : 620, 0.07, 'square', 0.035, dmg >= 5 ? 180 : 880);
        } else {
          e.hurt = 1;
          pop('あと ' + e.hp, '#e3452f', e.x, e.z, 2.4);
          sfx(180, 0.18, 'sawtooth', 0.05, 90);
        }
        if (c.count <= 0) return gameOver(d.name + 'に食べられた…');
      }
    }

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
    list.sort((a, b) => (b.z + (b.type === 'gate' ? 1.4 : 0)) - (a.z + (a.type === 'gate' ? 1.4 : 0)));

    for (const o of list) {
      if (o.type === 'gate') { drawGate(o); continue; }
      const p = project(o.x !== undefined ? o.x : 0, o.z, 0);
      if (!p) continue;
      if (o.type === 'tree') drawTree(p, p.s * o.h * 0.95);
      else if (o.type === 'fruit') drawFruit(p, p.s * 0.55, FRUITS[o.i % FRUITS.length], c.spin + o.i);
      else if (o.type === 'boy') { shadow(p, p.s * 0.5); sprite('boy-fall', { x: p.x, y: p.y + p.s * 0.2, s: p.s }, 1.9); }
      else if (o.type === 'enemy') {
        const e = o.e, d = ANIMALS[e.kind];
        if (e.dead) {
          const q = project(e.x, e.z, e.y);
          if (!q) continue;
          ctx.save();
          ctx.globalAlpha = clamp(1.4 - e.dead, 0, 1);
          ctx.translate(q.x, q.y - d.h * q.s * 0.5); ctx.rotate(e.rot);
          sprite(d.spr, { x: 0, y: d.h * q.s * 0.5, s: q.s }, d.h);
          ctx.restore();
        } else {
          shadow(p, p.s * d.w * 0.45);
          const run = Math.abs(Math.sin(S.clock * 9 + e.t)) * 0.07;
          if (e.hurt > 0) { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 30)); }
          sprite(d.spr, p, d.h * (1 + run));
          if (e.hurt > 0) ctx.restore();
          if (e.max > 1) {                           // 頭上に「あと何個」
            const fs = clamp(p.s * 0.5, 11, 28), by = p.y - d.h * p.s - fs * 0.5;
            worldText(e.hp, p.x, by, fs, e.hp < e.max ? '#ff9b8a' : '#fff');
          }
        }
      }
    }

    // 土埃と跳ねた果物
    for (const f of S.fx) {
      const q = project(f.x, f.z, f.y);
      if (!q) continue;
      const a = clamp(1 - f.t / f.life, 0, 1);
      if (f.kind === 'dust') {
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
      if (p) worldText(c.count, p.x, p.y, clamp(p.s * 0.95, 18, 58), '#fff');
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
  }

  // ---------------------------------------------------------------- HUD
  let lastC = -1, lastSc = -1;
  function hud() {
    const n = S.crowd.count;
    if (n !== lastC) { elStock.textContent = n; lastC = n; }
    const sc = S.killed * 10 + n;
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
