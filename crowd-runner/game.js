/* =========================================================================
   フルーツ・クラウドランナー  (Fruit Crowd Runner)
   坂の上に立った人間が、銃を撃つように果物を転がし落とす。
   果物はゲートを抜けるたびに増え、サルに通行料を取られ、最後にクマへ当たる。
   キャラクターはすべてシルエット。依存ライブラリなし / Canvas 2D の擬似3D。
   ========================================================================= */
(() => {
  'use strict';

  // ---------------------------------------------------------------- 画面
  const cv      = document.getElementById('game');
  const ctx     = cv.getContext('2d');
  const overlay = document.getElementById('overlay');
  const card    = document.getElementById('card');
  const elCount = document.getElementById('count');
  const elStage = document.getElementById('stage-no');
  const elScore = document.getElementById('score');
  const elBar   = document.getElementById('bar');
  const elHint  = document.getElementById('hint');
  const elBoss  = document.getElementById('bossbar');
  const elBossHp= document.getElementById('bosshp');

  let W = 0, H = 0, DPR = 1;
  let FOCAL = 600, HORIZON = 200, VANISH = 300, camH = 3.2;

  const ROAD_HALF = 5;
  const CAM_BACK  = 6.5;
  const SLOPE     = 0.16;
  const MAX_DRAW  = 34;
  const WALL      = ROAD_HALF - 0.45;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    FOCAL   = W * 0.72;
    camH    = Math.max(2.4, Math.min(9, (H * 0.40) / FOCAL * CAM_BACK));
    VANISH  = H * 0.33;
    HORIZON = Math.max(H * 0.04, VANISH - SLOPE * FOCAL);
    VANISH  = HORIZON + SLOPE * FOCAL;
    skyGrad = null;
  }
  window.addEventListener('resize', resize);

  function project(x, z, y) {
    const dz = z - S.camZ;
    if (dz < 0.8) return null;
    const s = FOCAL / dz;
    return { x: W / 2 + x * s, y: HORIZON + (camH + SLOPE * dz - (y || 0)) * s, s: s, dz: dz };
  }

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const rnd   = (a, b) => a + Math.random() * (b - a);
  const rint  = (a, b) => Math.floor(rnd(a, b + 1));
  const pick  = arr => arr[Math.floor(Math.random() * arr.length)];

  // ---------------------------------------------------------------- 素材
  // 果物だけが色を持ち、生き物はすべて影（シルエット）として描く。
  const FRUITS = [
    { base: '#ef5350', shade: '#c0272d', light: '#ff9a90', leaf: true  },
    { base: '#ffa726', shade: '#e06c00', light: '#ffd08a', leaf: false },
    { base: '#ffe14d', shade: '#e0a800', light: '#fff4a0', leaf: false },
    { base: '#ab5ec9', shade: '#6f2a94', light: '#d79ceb', leaf: true  },
    { base: '#f78fb3', shade: '#c9456f', light: '#ffc2d6', leaf: true  },
    { base: '#9ccc65', shade: '#5c8f2e', light: '#c9e8a2', leaf: false },
  ];
  const SIL      = '#20232b';       // シルエット
  const SIL_SOFT = 'rgba(32,35,43,.55)';

  // ---------------------------------------------------------------- 状態
  const BEST_KEY = 'crowdrunner.best';
  const S = {
    mode: 'title',                  // title | aim | roll | hit | clear | over
    stage: 1, score: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    ammo: 0, ammoMax: 0,
    aim: 0,                         // 撃ち出す角度（横速度に変換）
    human: { t: 0, recoil: 0 },
    ball: null,                     // 転がっている果物の群れ
    items: [], scenery: [], pops: [],
    bear: null, lane: 0,
    camZ: -CAM_BACK, time: 0, shake: 0, flash: 0, wait: 0, keyDir: 0,
    lastDmg: 0,
  };

  // ---------------------------------------------------------------- レベル
  const OPS = [
    { k: 'mul', v: 2, label: '×2', good: true  },
    { k: 'mul', v: 3, label: '×3', good: true  },
    { k: 'mul', v: 4, label: '×4', good: true  },
    { k: 'add', v: 8,  label: '+8',  good: true  },
    { k: 'add', v: 15, label: '+15', good: true  },
    { k: 'div', v: 2, label: '÷2', good: false },
    { k: 'div', v: 3, label: '÷3', good: false },
    { k: 'sub', v: 6,  label: '-6',  good: false },
    { k: 'sub', v: 12, label: '-12', good: false },
  ];
  function applyOp(n, op) {
    let r = n;
    if (op.k === 'mul') r = Math.round(n * op.v);
    else if (op.k === 'add') r = n + op.v;
    else if (op.k === 'sub') r = n - op.v;
    else if (op.k === 'div') r = Math.ceil(n / op.v);
    return clamp(r, 0, 9999);
  }

  function makeGate(z) {
    const goods = OPS.filter(o => o.good), bads = OPS.filter(o => !o.good);
    let a, b;
    const r = Math.random();
    if (r < 0.6)       { a = pick(goods); b = pick(bads); }
    else if (r < 0.85) { a = pick(goods); b = pick(goods); }
    else               { const d = bads.filter(o => o.k === 'div'); a = pick(d); b = pick(d); }
    if (a === b) b = pick(a.good ? bads : goods);
    if (Math.random() < 0.5) { const t = a; a = b; b = t; }
    return { type: 'gate', z: z, ops: [a, b], flash: 0 };
  }
  function makeMonkeys(z, stage) {
    const count = rint(3, 5) + Math.floor(stage * 0.8);
    const cols  = Math.min(count, 4);
    const SP = 0.95;
    const halfW = (cols - 1) * SP / 2 + 0.45;
    const spots = [];
    for (let i = 0; i < Math.min(count, 8); i++) {
      const row = Math.floor(i / cols), col = i % cols;
      const n = Math.min(cols, Math.min(count, 8) - row * cols);
      spots.push([(col - (n - 1) / 2) * SP, row * 1.2]);
    }
    return {                                   // 左右にうろうろするので毎回ねらいが変わる
      type: 'monkeys', z: z, count: count, spots: spots, w: halfW,
      home: rnd(-2.2, 2.2), range: rnd(1.0, 2.4), sp: rnd(0.5, 1.0), ph: rnd(0, 6), x: 0,
    };
  }
  function makeBonus(z) {
    return { type: 'bonus', z: z, x: rnd(-WALL + 0.8, WALL - 0.8), amount: rint(6, 14) };
  }

  function buildLevel(stage) {
    S.lane = 125 + stage * 12;
    S.items = [];
    // 並びは固定・中身はランダム。どのコースでもゲートが 3 枚以上入るようにして、
    // 「引きが悪いだけで詰む」コースが生まれないようにする。
    const PLAN = ['gate', 'monkeys', 'gate', 'bonus', 'gate', 'monkeys', 'gate', 'bonus', 'gate'];
    let z = 24, i = 0;
    while (z < S.lane - 18 && i < PLAN.length) {
      const t = PLAN[i++];
      S.items.push(t === 'gate' ? makeGate(z) : t === 'monkeys' ? makeMonkeys(z, stage) : makeBonus(z));
      z += rnd(22, 28);
    }
    S.items.sort((p, q) => p.z - q.z);
    S.scenery = [];
    for (let i = 0; i < 70; i++) {
      S.scenery.push({
        type: 'tree', z: rnd(6, S.lane + 40),
        x: (Math.random() < 0.5 ? -1 : 1) * rnd(ROAD_HALF + 1.6, ROAD_HALF + 13),
        h: rnd(2.6, 4.6),
      });
    }
    S.scenery.sort((p, q) => p.z - q.z);
  }

  // ---------------------------------------------------------------- 効果
  function pop(text, color, x, z, y) { S.pops.push({ text: text, color: color, x: x, z: z, y: y || 1.6, t: 0 }); }

  let AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function sfx(freq, dur, type, vol, to) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (to) o.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }

  // ---------------------------------------------------------------- 入力
  let dragging = false, dragX = 0, dragBase = 0, moved = 0;
  const stageEl = document.getElementById('stage');

  stageEl.addEventListener('pointerdown', e => {
    audio();
    if (S.mode !== 'aim' && S.mode !== 'roll') return;
    dragging = true; moved = 0; dragX = e.clientX;
    dragBase = S.mode === 'aim' ? S.aim : S.ball.vx;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = (e.clientX - dragX) / W;
    moved = Math.max(moved, Math.abs(e.clientX - dragX));
    if (S.mode === 'aim') S.aim = clamp(dragBase + dx * 2.6, -1, 1);
    else if (S.ball) S.ball.vx = clamp(dragBase + dx * 14, -7, 7);   // 転がり中の軌道修正
  });
  function release() {
    if (dragging && S.mode === 'aim') fire();
    dragging = false;
  }
  stageEl.addEventListener('pointerup', release);
  stageEl.addEventListener('pointercancel', () => { dragging = false; });

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a') S.keyDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') S.keyDir = 1;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (S.mode === 'aim') fire();
      else { const b = card.querySelector('button'); if (b) b.click(); }
    }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'ArrowRight', 'd'].indexOf(e.key) >= 0) S.keyDir = 0;
  });
  card.addEventListener('click', e => {
    const act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (!act) return;
    audio();
    if (act === 'start' || act === 'retry') startStage(1, 0);
    if (act === 'next') startStage(S.stage + 1, S.score);
  });

  // ---------------------------------------------------------------- 進行
  function startStage(stage, score) {
    S.stage = stage; S.score = score;
    S.ammoMax = 9; S.ammo = 9;
    S.aim = 0; S.ball = null; S.pops = []; S.shake = 0; S.flash = 0; S.wait = 0;
    buildLevel(stage);
    const hp = 150 + stage * 70;
    S.bear = { hp: hp, max: hp, z: S.lane, hurt: 0, roar: 0 };
    S.camZ = -CAM_BACK;
    S.mode = 'aim';
    elBoss.style.display = 'block';
    elHint.textContent = 'ドラッグでねらう → はなすと転がる';
    hideCard();
  }

  function fire() {
    if (S.mode !== 'aim' || S.ammo <= 0) return;
    S.ammo--;
    S.ball = { x: 0, z: 2.5, vx: S.aim * 4.6, count: 6, t: 0, spin: 0 };
    S.human.recoil = 1;
    S.mode = 'roll';
    elHint.textContent = 'ドラッグで転がる向きを微調整';
    sfx(240, 0.12, 'square', 0.05, 90);
  }

  function endShot(reason) {
    S.ball = null;
    S.mode = 'hit'; S.wait = reason === 'bear' ? 1.0 : 0.7;
  }

  /** 毎回同じ正解ルートにならないよう、撃つたびにコースを少し組み替える */
  function reshuffle() {
    const goods = OPS.filter(o => o.good), bads = OPS.filter(o => !o.good);
    for (const it of S.items) {
      if (it.type === 'gate') {
        if (Math.random() < 0.5) { const t = it.ops[0]; it.ops[0] = it.ops[1]; it.ops[1] = t; }
        if (Math.random() < 0.35) {
          const i = Math.random() < 0.5 ? 0 : 1;
          it.ops[i] = pick(it.ops[i].good ? goods : bads);
        }
      } else if (it.type === 'monkeys') {
        it.home = rnd(-2.2, 2.2); it.ph = rnd(0, 6); it.sp = rnd(0.5, 1.0);
        it.paid = 0;
      } else if (it.type === 'bonus') {
        it.x = rnd(-WALL + 0.8, WALL - 0.8); it.taken = 0;
      }
    }
  }

  function nextShot() {
    S.camZ = -CAM_BACK; S.flash = 0.35;
    reshuffle();
    if (S.bear.hp <= 0) return stageClear();
    if (S.ammo <= 0)    return gameOver('果物が尽きた…');
    S.mode = 'aim';
    elHint.textContent = 'ドラッグでねらう → はなすと転がる';
  }

  function gameOver(reason) {
    S.mode = 'over';
    S.best = Math.max(S.best, S.score);
    localStorage.setItem(BEST_KEY, String(S.best));
    sfx(220, 0.5, 'sawtooth', 0.07, 60);
    showCard(
      '<span class="tag">GAME OVER</span>' +
      '<h2>' + reason + '</h2>' +
      '<p>クマの残り体力 <b>' + Math.ceil(S.bear.hp) + '</b> / ' + S.bear.max + '</p>' +
      '<div class="score">' + S.score + '</div>' +
      '<div class="best">BEST ' + S.best + '　/　STAGE ' + S.stage + '</div>' +
      '<button data-act="retry">もう一度ころがす</button>'
    );
  }

  function stageClear() {
    S.mode = 'clear';
    const bonus = S.ammo * 120 + S.stage * 200;
    S.score += bonus;
    S.best = Math.max(S.best, S.score);
    localStorage.setItem(BEST_KEY, String(S.best));
    sfx(523, 0.12, 'square', 0.07); setTimeout(() => sfx(784, 0.2, 'square', 0.07), 130);
    showCard(
      '<span class="tag">STAGE ' + S.stage + ' CLEAR</span>' +
      '<h2>クマを転がし倒した！</h2>' +
      '<p>残り <b>' + S.ammo + '</b> 個で撃破<br>ボーナス +' + bonus + '</p>' +
      '<div class="score">' + S.score + '</div>' +
      '<div class="best">BEST ' + S.best + '</div>' +
      '<button data-act="next">STAGE ' + (S.stage + 1) + 'へ</button>'
    );
  }

  function showCard(html) { card.innerHTML = html; overlay.classList.remove('hidden'); }
  function hideCard() { overlay.classList.add('hidden'); }

  function titleScreen() {
    S.mode = 'title';
    buildLevel(1);
    S.bear = { hp: 1, max: 1, z: S.lane, hurt: 0, roar: 0 };
    S.camZ = -CAM_BACK; S.ammo = 9; S.ammoMax = 9;
    elBoss.style.display = 'none';
    showCard(
      '<h1>フルーツ・クラウドランナー<small>F R U I T　C R O W D　R U N N E R</small></h1>' +
      '<div class="rules">' +
      '🙋 坂の上から<b>果物を撃ち出す</b>。ねらいがすべて。<br>' +
      '🚪 <b>ゲート</b>を抜けるたびに転がる果物が増減（×4 や ÷2）。<br>' +
      '🐵 <b>サル</b>は 1 匹につき果物 1 個の通行料。全部取られたらその弾は終わり。<br>' +
      '🐻 坂の底の<b>クマ</b>に、届いた数だけダメージ。<br>' +
      '🍎 <b>9 発</b>で倒しきれ。' +
      '</div>' +
      '<button data-act="start">ころがす</button>'
    );
  }

  // ---------------------------------------------------------------- 更新
  function update(dt) {
    S.time += dt;
    S.human.t += dt;
    S.human.recoil = Math.max(0, S.human.recoil - dt * 3.4);
    S.shake = Math.max(0, S.shake - dt * 3.2);
    S.flash = Math.max(0, S.flash - dt * 2.6);
    if (S.bear) { S.bear.hurt = Math.max(0, S.bear.hurt - dt * 2.2); S.bear.roar = Math.max(0, S.bear.roar - dt); }

    for (let i = S.pops.length - 1; i >= 0; i--) {
      const p = S.pops[i]; p.t += dt; p.y += dt * 1.6;
      if (p.t > 1.1) S.pops.splice(i, 1);
    }
    for (const it of S.items) {                       // サルはうろうろする
      if (it.type === 'monkeys') it.x = clamp(it.home + Math.sin(S.time * it.sp + it.ph) * it.range, -WALL + it.w, WALL - it.w);
    }

    if (S.mode === 'title') { S.aim = Math.sin(S.time * 0.5) * 0.5; return; }
    if (S.mode === 'clear' || S.mode === 'over') return;

    if (S.mode === 'aim') {
      if (S.keyDir) S.aim = clamp(S.aim + S.keyDir * 1.4 * dt, -1, 1);
      S.camZ = -CAM_BACK;
    } else if (S.mode === 'roll') {
      rollUpdate(dt);
    } else if (S.mode === 'hit') {
      S.wait -= dt;
      if (S.wait <= 0) nextShot();
    }
  }

  function rollUpdate(dt) {
    const b = S.ball;
    b.t += dt;
    const v = Math.min(40, 18 + b.t * 4.2);            // 坂なので転がるほど速くなる
    const prevZ = b.z;
    b.z += v * dt;
    if (S.keyDir) b.vx = clamp(b.vx + S.keyDir * 9 * dt, -7, 7);
    b.x += b.vx * dt;
    if (b.x < -WALL) { b.x = -WALL; b.vx = Math.abs(b.vx) * 0.75; sfx(150, 0.05, 'square', 0.03); }
    if (b.x > WALL)  { b.x = WALL;  b.vx = -Math.abs(b.vx) * 0.75; sfx(150, 0.05, 'square', 0.03); }
    b.spin += v * dt * 0.9;
    S.camZ = b.z - CAM_BACK;

    for (const it of S.items) {
      if (it.z <= prevZ || it.z > b.z) continue;
      if (it.type === 'gate') {
        const op = it.ops[b.x < 0 ? 0 : 1];
        const before = b.count;
        b.count = applyOp(b.count, op);
        it.flash = 1;
        const d = b.count - before;
        pop((d >= 0 ? '+' : '') + d, d >= 0 ? '#8dff9e' : '#ff8d8d', b.x, it.z, 2);
        if (d >= 0) sfx(680, 0.1, 'square', 0.05, 980);
        else { sfx(300, 0.16, 'sawtooth', 0.05, 140); S.shake = 0.4; }
      } else if (it.type === 'monkeys') {
        if (Math.abs(b.x - it.x) < it.w + 0.45) {
          const toll = Math.min(it.count, b.count);
          b.count -= toll;
          it.paid = S.time;
          pop('-' + toll, '#ffd166', it.x, it.z, 2);
          S.shake = 0.3;
          sfx(520, 0.09, 'square', 0.045, 760);
        }
      } else if (it.type === 'bonus' && !it.taken) {
        if (Math.abs(b.x - it.x) < 1.3) {
          b.count += it.amount; it.taken = S.time;
          pop('+' + it.amount, '#8dff9e', it.x, it.z, 1.8);
          sfx(880, 0.1, 'triangle', 0.05, 1200);
        }
      }
    }

    if (b.count <= 0) {                                 // 全部取られた
      pop('ぜんぶ取られた', '#ff8d8d', b.x, b.z, 2.4);
      S.lastDmg = 0;
      sfx(200, 0.25, 'sawtooth', 0.05, 90);
      return endShot('lost');
    }
    if (b.z >= S.bear.z - 1.5) {                        // クマに着弾
      const dmg = b.count;
      S.bear.hp = Math.max(0, S.bear.hp - dmg);
      S.bear.hurt = 1; S.bear.roar = 1;
      S.lastDmg = dmg;
      pop('-' + dmg, '#fff1a8', 0, S.bear.z - 2, 3.4);
      S.shake = 1; S.flash = 0.35;
      sfx(120, 0.35, 'sawtooth', 0.08, 60);
      return endShot('bear');
    }
  }

  // ---------------------------------------------------------------- 背景
  let skyGrad = null;
  const clouds = [];
  for (let i = 0; i < 9; i++) clouds.push({ x: Math.random(), y: Math.random() * 0.6, s: rnd(0.5, 1.3), v: rnd(0.004, 0.014) });

  function drawSky() {
    if (!skyGrad) {
      skyGrad = ctx.createLinearGradient(0, 0, 0, VANISH + 10);
      skyGrad.addColorStop(0, '#2f7fb5');
      skyGrad.addColorStop(0.55, '#7ec8e3');
      skyGrad.addColorStop(1, '#dff3f7');
    }
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, VANISH + 12);
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    for (const c of clouds) {
      c.x -= c.v * 0.016; if (c.x < -0.2) c.x = 1.2;
      const px = c.x * W, py = 40 + c.y * (VANISH - 80), r = 16 * c.s;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 7);
      ctx.arc(px + r * 0.9, py + r * 0.15, r * 0.75, 0, 7);
      ctx.arc(px - r * 0.95, py + r * 0.2, r * 0.65, 0, 7);
      ctx.arc(px + r * 0.1, py - r * 0.55, r * 0.6, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#5e8f7a';
    ctx.beginPath(); ctx.moveTo(-20, VANISH + 6);
    const peaks = 7;
    for (let i = 0; i <= peaks; i++) {
      const x = -20 + (W + 40) * (i / peaks);
      const h = 40 + 34 * Math.sin(i * 2.3 + 1.2) + 20 * Math.sin(i * 5.1);
      ctx.lineTo(x, VANISH + 6 - Math.abs(h));
      ctx.lineTo(x + (W + 40) / peaks / 2, VANISH + 6);
    }
    ctx.lineTo(W + 20, VANISH + 6); ctx.closePath(); ctx.fill();
  }

  function quad(a, b, half) {
    ctx.beginPath();
    ctx.moveTo(W / 2 - half * a.s, a.y); ctx.lineTo(W / 2 + half * a.s, a.y);
    ctx.lineTo(W / 2 + half * b.s, b.y); ctx.lineTo(W / 2 - half * b.s, b.y);
    ctx.closePath(); ctx.fill();
  }
  function band(a, b, x1, x2) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + x1 * a.s, a.y); ctx.lineTo(W / 2 + x2 * a.s, a.y);
    ctx.lineTo(W / 2 + x2 * b.s, b.y); ctx.lineTo(W / 2 + x1 * b.s, b.y);
    ctx.closePath(); ctx.fill();
  }
  function drawRoad() {
    ctx.fillStyle = '#7bb661'; ctx.fillRect(0, VANISH - 2, W, H - VANISH + 2);
    const NEAR = 0.85, MID = 10, FAR = 150, FINE = 0.5, STEP = 4;
    const edges = [];
    for (let z = S.camZ + NEAR; z < S.camZ + MID; z += FINE) edges.push(z);
    const g0 = Math.ceil((S.camZ + MID) / STEP) * STEP;
    for (let z = g0; z < S.camZ + FAR; z += STEP) edges.push(z);
    for (let i = edges.length - 2; i >= 0; i--) {
      const za = edges[i], zb = edges[i + 1];
      const a = project(0, za, 0), b = project(0, zb, 0);
      if (!a || !b) continue;
      const dark = (Math.floor((za + 0.01) / STEP) % 2 + 2) % 2 === 0;
      ctx.fillStyle = dark ? '#74ae5b' : '#7fbb64'; quad(a, b, 60);
      ctx.fillStyle = dark ? '#c9a678' : '#d3b184'; quad(a, b, ROAD_HALF);
      ctx.fillStyle = dark ? '#fff4d8' : '#ef6b5e';
      band(a, b, ROAD_HALF, ROAD_HALF + 0.28); band(a, b, -ROAD_HALF - 0.28, -ROAD_HALF);
    }
  }
  function shadow(p, r) {
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.34, 0, 0, 7); ctx.fill();
  }

  // ---------------------------------------------------------------- 果物
  function drawFruit(p, size, kind, rot) {
    const r = size * 0.5;
    shadow(p, r * 0.95);
    ctx.save();
    ctx.translate(p.x, p.y - r * 1.02); ctx.scale(r, r);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.clip();
    ctx.fillStyle = kind.base; ctx.fillRect(-2, -2, 4, 4);
    ctx.fillStyle = kind.shade;
    ctx.beginPath(); ctx.arc(0.72, 0.8, 1.3, 0, 7); ctx.fill();
    ctx.fillStyle = kind.light;
    ctx.beginPath(); ctx.ellipse(-0.42, -0.46, 0.32, 0.2, -0.6, 0, 7); ctx.fill();
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 0.6, -1, 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 0.6, Math.PI - 1, Math.PI + 1); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(30,20,15,.85)'; ctx.lineWidth = 0.075;
    ctx.beginPath(); ctx.arc(0, 0, 0.96, 0, 7); ctx.stroke();
    if (kind.leaf) {
      ctx.save(); ctx.rotate(rot);
      ctx.fillStyle = '#5aa53f';
      ctx.beginPath(); ctx.ellipse(0.34, -0.9, 0.4, 0.17, -0.6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,20,15,.85)'; ctx.lineWidth = 0.06; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- シルエット
  /** 人間：坂の上で果物を構え、ボウリングのように振り抜いて転がす（背中side） */
  function drawHuman(p, size, t, recoil, kind) {
    const sw = Math.sin(t * 1.6) * 0.01;
    const hx = 0.3 - recoil * 0.3, hy = -0.34 - recoil * 0.06;   // 持ち手の位置
    shadow(p, size * 0.26);
    ctx.save();
    ctx.translate(p.x, p.y); ctx.scale(size, size);
    ctx.fillStyle = SIL; ctx.strokeStyle = SIL; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 0.115;                                        // 脚
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.03); ctx.lineTo(-0.11, -0.4);
    ctx.moveTo(0.1, -0.03); ctx.lineTo(0.11, -0.4);
    ctx.stroke();
    ctx.beginPath();                                              // 胴
    ctx.moveTo(-0.17 + sw, -0.74); ctx.lineTo(0.17 + sw, -0.74);
    ctx.lineTo(0.13 + sw, -0.35); ctx.lineTo(-0.13 + sw, -0.35); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(sw, -0.87, 0.105, 0, 7); ctx.fill();  // 頭
    ctx.lineWidth = 0.075;                                        // 腕
    ctx.beginPath();
    ctx.moveTo(0.16 + sw, -0.7); ctx.quadraticCurveTo(0.31, -0.56, hx, hy);
    ctx.moveTo(-0.16 + sw, -0.7); ctx.quadraticCurveTo(-0.29, -0.56, -0.23, -0.42);
    ctx.stroke();
    ctx.restore();
    if (kind && recoil < 0.5) {                                   // 手の中の次の一発
      const r = size * 0.1, cx = p.x + hx * size, cy = p.y + hy * size;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
      ctx.fillStyle = kind.base; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = kind.shade;
      ctx.beginPath(); ctx.arc(cx + r * 0.7, cy + r * 0.8, r * 1.3, 0, 7); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(30,20,15,.85)'; ctx.lineWidth = Math.max(1, r * 0.16);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    }
  }

  /** サル：しっぽで種類がわかるシルエット */
  function drawMonkey(p, size, t) {
    const bob = Math.sin(t * 5) * size * 0.02;
    shadow(p, size * 0.24);
    ctx.save();
    ctx.translate(p.x, p.y + bob); ctx.scale(size, size);
    ctx.fillStyle = SIL;
    ctx.strokeStyle = SIL; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // しっぽ
    ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.moveTo(0.14, -0.22);
    ctx.quadraticCurveTo(0.56, -0.12 + Math.sin(t * 4) * 0.08, 0.44, -0.5); ctx.stroke();
    // 脚・腕
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(-0.1, -0.04); ctx.lineTo(-0.1, -0.2);
    ctx.moveTo(0.1, -0.04); ctx.lineTo(0.1, -0.2);
    ctx.moveTo(-0.19, -0.36); ctx.lineTo(-0.27, -0.2 + Math.sin(t * 5) * 0.04);
    ctx.moveTo(0.19, -0.36); ctx.lineTo(0.27, -0.2 - Math.sin(t * 5) * 0.04);
    ctx.stroke();
    // 体・頭・耳
    ctx.beginPath(); ctx.ellipse(0, -0.34, 0.2, 0.22, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -0.66, 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-0.22, -0.68, 0.075, 0, 7); ctx.arc(0.22, -0.68, 0.075, 0, 7); ctx.fill();
    // 目だけ光る
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(-0.07, -0.68, 0.028, 0, 7); ctx.arc(0.07, -0.68, 0.028, 0, 7); ctx.fill();
    ctx.restore();
  }

  /** クマ：坂の底で待っている大きなシルエット */
  function drawBear(p, size, t, hurt, roar) {
    const sway = Math.sin(t * 1.6) * 0.015;
    const rise = roar * 0.05;
    shadow(p, size * 0.4);
    ctx.save();
    ctx.translate(p.x, p.y + hurt * Math.sin(t * 40) * size * 0.012);
    ctx.scale(size, size);
    ctx.fillStyle = hurt > 0.5 ? '#6a4340' : SIL;
    ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 脚
    ctx.beginPath();
    ctx.ellipse(-0.22, -0.07, 0.15, 0.09, 0, 0, 7);
    ctx.ellipse(0.22, -0.07, 0.15, 0.09, 0, 0, 7); ctx.fill();
    // 体
    ctx.beginPath(); ctx.ellipse(sway, -0.4 - rise, 0.36, 0.36, 0, 0, 7); ctx.fill();
    // 腕
    ctx.lineWidth = 0.19;
    ctx.beginPath();
    ctx.moveTo(-0.3 + sway, -0.52 - rise); ctx.lineTo(-0.47, -0.3 - rise * 3);
    ctx.moveTo(0.3 + sway, -0.52 - rise); ctx.lineTo(0.47, -0.3 - rise * 3);
    ctx.stroke();
    // 頭・耳・鼻づら
    ctx.beginPath(); ctx.arc(sway, -0.84 - rise, 0.3, 0, 7); ctx.fill();
    ctx.beginPath();
    ctx.arc(sway - 0.27, -1.05 - rise, 0.12, 0, 7);
    ctx.arc(sway + 0.27, -1.05 - rise, 0.12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sway, -0.74 - rise, 0.17, 0.12, 0, 0, 7); ctx.fill();
    // 目
    ctx.fillStyle = hurt > 0.2 ? '#fff1a8' : '#ff5f56';
    ctx.beginPath();
    ctx.arc(sway - 0.11, -0.9 - rise, 0.035, 0, 7);
    ctx.arc(sway + 0.11, -0.9 - rise, 0.035, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawTree(p, size) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size);
    ctx.fillStyle = SIL_SOFT;
    ctx.fillRect(-0.05, -0.34, 0.1, 0.34);
    for (let i = 0; i < 3; i++) {
      const y = -0.3 - i * 0.22, w = 0.34 - i * 0.08;
      ctx.beginPath(); ctx.moveTo(0, y - 0.34); ctx.lineTo(w, y); ctx.lineTo(-w, y); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- ゲート
  function drawGate(it) {
    const p = project(0, it.z, 0);
    if (!p) return;
    const fade = clamp((95 - p.dz) / 30, 0, 1) * clamp((p.dz - 3.5) / 6, 0, 1);  // 遠すぎ／近すぎは薄く
    if (fade <= 0.02) return;
    ctx.globalAlpha = fade;
    const s = p.s, h = 3.6 * s, y = p.y, cx = W / 2, half = ROAD_HALF * s;
    for (let i = 0; i < 2; i++) {
      const op = it.ops[i], x0 = i === 0 ? cx - half : cx, w = half, good = op.good;
      const a = 0.48 + it.flash * 0.3;
      const g = ctx.createLinearGradient(0, y - h, 0, y);
      g.addColorStop(0, good ? 'rgba(90,230,150,' + a + ')' : 'rgba(255,110,100,' + a + ')');
      g.addColorStop(1, good ? 'rgba(40,180,110,' + (a * 0.55) + ')' : 'rgba(210,60,60,' + (a * 0.55) + ')');
      ctx.fillStyle = g; ctx.fillRect(x0, y - h, w, h);
      ctx.strokeStyle = good ? 'rgba(180,255,210,.9)' : 'rgba(255,200,195,.9)';
      ctx.lineWidth = Math.max(1, s * 0.05); ctx.strokeRect(x0, y - h, w, h);
      if (p.dz < 62) {
        const fs = clamp(s * 0.85, 10, 64);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.16; ctx.strokeStyle = 'rgba(10,30,20,.85)';
        ctx.strokeText(op.label, x0 + w / 2, y - h * 0.55);
        ctx.fillStyle = good ? '#c9ffdc' : '#ffe0dc';
        ctx.fillText(op.label, x0 + w / 2, y - h * 0.55);
      }
    }
    ctx.fillStyle = '#f2f6f8';
    const pw = Math.max(2, s * 0.12);
    ctx.fillRect(cx - half - pw, y - h, pw, h);
    ctx.fillRect(cx + half, y - h, pw, h);
    ctx.fillRect(cx - pw / 2, y - h, pw, h);
    ctx.globalAlpha = 1;
    it.flash = Math.max(0, it.flash - 0.03);
  }

  // ---------------------------------------------------------------- 描画
  const layoutCache = {};
  function layout(n) {
    if (!layoutCache[n]) {
      const a = [];
      for (let i = 0; i < n; i++) {
        const ang = i * 2.39996, r = 0.3 * Math.sqrt(i);
        a.push([Math.cos(ang) * r, Math.sin(ang) * r * 1.15]);
      }
      layoutCache[n] = a;
    }
    return layoutCache[n];
  }

  /** ねらい表示：壁で跳ね返る予測線 */
  function drawAimLine() {
    let x = 0, vx = S.aim * 4.6, z = 5;
    const v = 18, step = 0.09;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 46; i++) {
      z += v * step; x += vx * step;
      if (x < -WALL) { x = -WALL; vx = Math.abs(vx) * 0.75; }
      if (x > WALL)  { x = WALL;  vx = -Math.abs(vx) * 0.75; }
      const p = project(x, z, 0.15);
      if (!p) continue;
      const r = Math.max(1, p.s * 0.035) * (1 - i / 52);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
    }
  }

  function render() {
    ctx.save();
    if (S.shake > 0) ctx.translate(rnd(-1, 1) * S.shake * 7, rnd(-1, 1) * S.shake * 5);
    drawSky();
    drawRoad();

    const list = [];
    for (const it of S.items) { const dz = it.z - S.camZ; if (dz > 0.8 && dz < 150) list.push(it); }
    for (const t of S.scenery) { const dz = t.z - S.camZ; if (dz > 0.8 && dz < 150) list.push(t); }
    if (S.bear && S.bear.z - S.camZ < 150) list.push({ type: 'bear', z: S.bear.z });
    if (S.mode !== 'roll') list.push({ type: 'human', z: 0.6 });
    if (S.ball) {
      const n = clamp(Math.ceil(S.ball.count), 1, MAX_DRAW), off = layout(n);
      for (let i = 0; i < n; i++)
        list.push({ type: 'unit', i: i, x: S.ball.x + off[i][0], z: S.ball.z + off[i][1] });
    }
    list.sort((a, b) => b.z - a.z);

    for (const o of list) {
      if (o.type === 'unit') {
        const p = project(o.x, o.z, 0);
        if (p) drawFruit(p, p.s * 0.5, FRUITS[o.i % FRUITS.length], S.ball.spin + o.i * 0.7);
      } else if (o.type === 'tree') {
        const p = project(o.x, o.z, 0); if (p) drawTree(p, p.s * o.h * 0.5);
      } else if (o.type === 'bear') {
        const p = project(0, S.bear.z, 0); if (p) drawBear(p, p.s * 5.6, S.time, S.bear.hurt, S.bear.roar);
      } else if (o.type === 'human') {
        const p = project(0, 0.6, 0);
        if (p) drawHuman(p, p.s * 1.9, S.human.t, S.human.recoil, S.ammo > 0 ? FRUITS[S.ammo % FRUITS.length] : null);
      } else if (o.type === 'gate') {
        drawGate(o);
      } else if (o.type === 'monkeys') {
        for (let i = o.spots.length - 1; i >= 0; i--) {
          const sp = o.spots[i];
          const q = project(o.x + sp[0], o.z + sp[1], 0);
          if (q) drawMonkey(q, q.s * 1.6, S.time * 1.2 + i * 1.7);
        }
      } else if (o.type === 'bonus' && !o.taken) {
        const q = project(o.x, o.z, 0);
        if (q) {
          const bob = Math.abs(Math.sin(S.time * 3)) * 0.3;
          drawFruit(project(o.x, o.z, 0.3 + bob), q.s * 0.7, FRUITS[4], S.time * 2);
          const fs = clamp(q.s * 0.6, 9, 34);
          ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(10,30,20,.8)';
          ctx.strokeText('+' + o.amount, q.x, q.y - q.s * 1.6);
          ctx.fillStyle = '#c9ffdc'; ctx.fillText('+' + o.amount, q.x, q.y - q.s * 1.6);
        }
      }
    }

    if (S.mode === 'aim' || S.mode === 'title') drawAimLine();

    // 転がっている数
    if (S.ball) {
      const p = project(S.ball.x, S.ball.z, 2.3);
      if (p) {
        const fs = clamp(p.s * 0.9, 14, 54);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(10,20,25,.9)';
        ctx.strokeText(S.ball.count, p.x, p.y);
        ctx.fillStyle = '#fff'; ctx.fillText(S.ball.count, p.x, p.y);
      }
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of S.pops) {
      const q = project(p.x, p.z, p.y);
      if (!q) continue;
      const fs = clamp(q.s * 0.8, 12, 46);
      ctx.globalAlpha = clamp(1.3 - p.t, 0, 1);
      ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
      ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(10,20,25,.85)';
      ctx.strokeText(p.text, q.x, q.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, q.x, q.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (S.flash * 0.3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------------------------------------------------------------- HUD
  let lastA = -1, lastS = -1, lastSt = -1;
  function hud() {
    if (S.ammo !== lastA) { elCount.textContent = S.ammo; lastA = S.ammo; }
    if (S.score !== lastS) { elScore.textContent = S.score; lastS = S.score; }
    if (S.stage !== lastSt) { elStage.textContent = S.stage; lastSt = S.stage; }
    elBar.style.width = (S.ball ? clamp(S.ball.z / S.bear.z, 0, 1) * 100 : 0) + '%';
    if (S.bear) elBossHp.style.width = (clamp(S.bear.hp / S.bear.max, 0, 1) * 100) + '%';
  }

  // ---------------------------------------------------------------- ループ
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
    last = ts;
    if (!S.paused) { update(dt); render(); hud(); }
    requestAnimationFrame(frame);
  }

  window.CrowdRunner = {
    state: S,
    startStage: startStage,
    fire: fire,
    setAim: function (a) { S.aim = clamp(a, -1, 1); },
    pause: function (v) { S.paused = !!v; },
    ctx: ctx,
    art: { fruit: drawFruit, monkey: drawMonkey, bear: drawBear, human: drawHuman, fruits: FRUITS },
  };

  resize();
  titleScreen();
  requestAnimationFrame(frame);
})();
