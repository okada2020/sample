/* =========================================================================
   フルーツ・クラウドランナー  (Fruit Crowd Runner)
   坂道でフルーツを転がし、ゲートで増やし、サルを蹴散らし、最後はクマと戦う。
   依存ライブラリなし / Canvas 2D の擬似3D（1点透視）で描画する。
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
  let FOCAL = 600, HORIZON = 200, VANISH = 300;

  const ROAD_HALF = 5;      // 道の半幅（ワールド単位）
  let   camH      = 3.2;    // カメラ高さ（画面比で自動調整）
  const CAM_BACK  = 6.5;    // 先頭集団からカメラまでの距離
  const SLOPE     = 0.16;   // 下り坂の傾き（大きいほど急坂に見える）
  const MAX_DRAW  = 42;     // 同時に描くフルーツの上限
  const LIMIT_X   = ROAD_HALF - 0.4;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    FOCAL = W * 0.72;
    // 縦長でも横長でも同じ見え方になるよう、消失点と俯瞰の強さを画面比から決める。
    // 先頭集団の足元 - 消失点 = FOCAL * camH / CAM_BACK  なので、これが画面の約 40% になるようにする。
    camH    = Math.max(2.4, Math.min(9, (H * 0.40) / FOCAL * CAM_BACK));
    VANISH  = H * 0.33;
    HORIZON = Math.max(H * 0.04, VANISH - SLOPE * FOCAL);
    VANISH  = HORIZON + SLOPE * FOCAL;
    skyGrad = null;
  }
  window.addEventListener('resize', resize);

  /** ワールド座標 → スクリーン座標（1点透視 + 下り坂補正） */
  function project(x, z, y) {
    const dz = z - S.camZ;
    if (dz < 0.8) return null;
    const s = FOCAL / dz;
    return { x: W / 2 + x * s, y: HORIZON + (camH + SLOPE * dz - (y || 0)) * s, s: s, dz: dz };
  }

  // ---------------------------------------------------------------- 素材
  const FRUITS = [
    { base: '#ef5350', shade: '#c0272d', light: '#ff9a90', leaf: true  }, // りんご
    { base: '#ffa726', shade: '#e06c00', light: '#ffd08a', leaf: false }, // みかん
    { base: '#ffe14d', shade: '#e0a800', light: '#fff4a0', leaf: false }, // レモン
    { base: '#ab5ec9', shade: '#6f2a94', light: '#d79ceb', leaf: true  }, // ぶどう
    { base: '#f78fb3', shade: '#c9456f', light: '#ffc2d6', leaf: true  }, // もも
    { base: '#9ccc65', shade: '#5c8f2e', light: '#c9e8a2', leaf: false }, // メロン
  ];

  // ---------------------------------------------------------------- 状態
  const BEST_KEY = 'crowdrunner.best';
  const S = {
    mode: 'title',            // title | play | boss | clear | over
    stage: 1,
    fruits: 12,
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    playerX: 0, targetX: 0, playerZ: 0, prevZ: 0, camZ: -CAM_BACK,
    speed: 0, endZ: 0, time: 0, shake: 0, flash: 0,
    items: [], scenery: [], pops: [],
    bear: null, boost: 0, keyDir: 0,
  };

  // ---------------------------------------------------------------- レベル生成
  const OPS = [
    { k: 'mul', v: 2,  label: '×2',  good: true  },
    { k: 'mul', v: 3,  label: '×3',  good: true  },
    { k: 'add', v: 10, label: '+10', good: true  },
    { k: 'add', v: 20, label: '+20', good: true  },
    { k: 'add', v: 30, label: '+30', good: true  },
    { k: 'sub', v: 15, label: '-15', good: false },
    { k: 'sub', v: 30, label: '-30', good: false },
    { k: 'div', v: 2,  label: '÷2',  good: false },
    { k: 'div', v: 3,  label: '÷3',  good: false },
  ];
  const rnd  = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

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
    if (r < 0.62)      { a = pick(goods); b = pick(bads);  }   // 当たり／はずれ
    else if (r < 0.85) { a = pick(goods); b = pick(goods); }   // どっちも当たり（大きい方を選ぶ）
    else {                                                     // どっちも罠（マシな方へ）
      const divs = bads.filter(o => o.k === 'div');            // ÷ は 0 にならないので詰まない
      a = pick(divs); b = pick(divs);
    }
    if (a === b) b = pick(a.good ? bads : goods);
    if (Math.random() < 0.5) { const t = a; a = b; b = t; }
    return { type: 'gate', z: z, ops: [a, b], hit: false, flash: 0 };
  }

  function makeMonkeys(z, stage) {
    const count = rint(3, 6) + stage * 2;
    const shown = Math.min(count, 8);           // 見た目に並べる数
    const cols  = Math.min(shown, 4);           // 1 列は 4 匹まで、あとは後ろの列へ
    const SP = 0.95;
    const halfW = (cols - 1) * SP / 2 + 0.45;
    const spots = [];
    for (let i = 0; i < shown; i++) {
      const row = Math.floor(i / cols), col = i % cols;
      const n = Math.min(cols, shown - row * cols);
      spots.push([(col - (n - 1) / 2) * SP, row * 1.3]);
    }
    return {
      type: 'monkeys', z: z, x: rnd(-LIMIT_X + halfW, LIMIT_X - halfW),
      w: halfW, count: count, spots: spots, hit: false,
    };
  }

  function makeWall(z, stage) {
    return { type: 'wall', z: z, count: 12 + stage * 8 + rint(0, 10), hit: false, t: 0 };
  }

  function makeBonus(z) {
    return { type: 'bonus', z: z, x: rnd(-LIMIT_X + 0.8, LIMIT_X - 0.8), amount: rint(8, 18), hit: false };
  }

  function buildLevel(stage) {
    S.endZ = 520 + stage * 60;
    S.items = [];
    let z = 46;
    while (z < S.endZ - 70) {
      const r = Math.random();
      const late = z > S.endZ * 0.55;
      if (r < 0.44)                    S.items.push(makeGate(z));
      else if (r < 0.80)               S.items.push(makeMonkeys(z, stage));
      else if (r < 0.90 && late) {
        S.items.push(makeGate(z));                       // 壁の前には必ず増やす機会を置く
        z += 30;
        S.items.push(makeWall(z, stage));
      }
      else                             S.items.push(makeBonus(z));
      z += rnd(48, 78);
    }
    S.items.push(makeGate(S.endZ - 46));               // ボス前の最後のチャンス
    S.items.sort((p, q) => p.z - q.z);

    // 背景の木
    S.scenery = [];
    for (let i = 0; i < 90; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      S.scenery.push({
        type: 'tree', z: rnd(10, S.endZ + 60),
        x: side * rnd(ROAD_HALF + 1.6, ROAD_HALF + 12),
        h: rnd(2.6, 4.6),
      });
    }
    S.scenery.sort((p, q) => p.z - q.z);
  }

  // ---------------------------------------------------------------- 効果
  function pop(text, color, x, z, y) {
    S.pops.push({ text: text, color: color, x: x, z: z, y: y || 1.4, t: 0 });
  }

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
  let dragging = false, dragX = 0, dragBase = 0;
  const stageEl = document.getElementById('stage');

  stageEl.addEventListener('pointerdown', e => {
    audio();
    if (S.mode === 'boss') { S.boost = 0.28; sfx(640, 0.05, 'square', 0.04); return; }
    if (S.mode !== 'play') return;
    dragging = true; dragX = e.clientX; dragBase = S.targetX;
    stageEl.setPointerCapture(e.pointerId);
  });
  stageEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    S.targetX = clamp(dragBase + (e.clientX - dragX) / W * (ROAD_HALF * 2.4), -LIMIT_X, LIMIT_X);
  });
  const endDrag = () => { dragging = false; };
  stageEl.addEventListener('pointerup', endDrag);
  stageEl.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft'  || e.key === 'a') S.keyDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') S.keyDir = 1;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (S.mode === 'boss') { S.boost = 0.28; sfx(640, 0.05, 'square', 0.04); }
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
    if (act === 'start')  startStage(1, 0);
    if (act === 'next')   startStage(S.stage + 1, S.score);
    if (act === 'retry')  startStage(1, 0);
  });

  // ---------------------------------------------------------------- 進行
  function startStage(stage, score) {
    S.stage = stage; S.score = score;
    S.fruits = 15; S.playerX = 0; S.targetX = 0;
    S.playerZ = 0; S.prevZ = 0; S.camZ = -CAM_BACK;
    S.speed = 20 + stage * 1.5;
    S.pops = []; S.bear = null; S.boost = 0; S.shake = 0; S.flash = 0;
    buildLevel(stage);
    S.mode = 'play';
    elBoss.style.display = 'none';
    elHint.textContent = 'ドラッグ / ←→ で左右に移動';
    hideCard();
  }

  function gameOver(reason) {
    S.mode = 'over';
    S.best = Math.max(S.best, S.score);
    localStorage.setItem(BEST_KEY, String(S.best));
    elBoss.style.display = 'none';
    sfx(220, 0.5, 'sawtooth', 0.07, 60);
    showCard(
      '<span class="tag">GAME OVER</span>' +
      '<h2>' + reason + '</h2>' +
      '<div class="score">' + S.score + '</div>' +
      '<div class="best">BEST ' + S.best + '　/　STAGE ' + S.stage + '</div>' +
      '<button data-act="retry">もう一度ころがす</button>'
    );
  }

  function stageClear() {
    S.mode = 'clear';
    const bonus = Math.ceil(S.fruits) * 10 + S.stage * 200;
    S.score += bonus;
    S.best = Math.max(S.best, S.score);
    localStorage.setItem(BEST_KEY, String(S.best));
    elBoss.style.display = 'none';
    sfx(523, 0.12, 'square', 0.07); setTimeout(() => sfx(784, 0.2, 'square', 0.07), 130);
    showCard(
      '<span class="tag">STAGE ' + S.stage + ' CLEAR</span>' +
      '<h2>クマを追いはらった！</h2>' +
      '<p>残ったフルーツ <b>' + Math.ceil(S.fruits) + '</b> 個<br>ステージボーナス +' + bonus + '</p>' +
      '<div class="score">' + S.score + '</div>' +
      '<div class="best">BEST ' + S.best + '</div>' +
      '<button data-act="next">STAGE ' + (S.stage + 1) + 'へ</button>'
    );
  }

  function showCard(html) { card.innerHTML = html; overlay.classList.remove('hidden'); }
  function hideCard() { overlay.classList.add('hidden'); }

  function titleScreen() {
    S.mode = 'title';
    buildLevel(1);            // タイトル背景用の景色
    S.playerZ = 0; S.camZ = -CAM_BACK; S.fruits = 15;
    showCard(
      '<h1>フルーツ・クラウドランナー<small>F R U I T　C R O W D　R U N N E R</small></h1>' +
      '<div class="rules">' +
      '🍎 坂道をフルーツが転がり落ちる。<br>' +
      '🚪 <b>ゲート</b>をくぐると仲間が増減（×3 や ÷2）。<br>' +
      '🐵 <b>サル</b>は 1 匹につき果物 1 個の通行料。払うと帰る。<br>' +
      '🧱 <b>サルの壁</b>は通行料が高い。足りないと追い返される。<br>' +
      '🐻 ゴールの<b>クマ</b>は体力おばけ。数が力。連打で反撃！' +
      '</div>' +
      '<button data-act="start">ころがす</button>'
    );
  }

  // ---------------------------------------------------------------- 更新
  function update(dt) {
    S.time += dt;
    S.shake = Math.max(0, S.shake - dt * 3.2);
    S.flash = Math.max(0, S.flash - dt * 2.6);
    S.boost = Math.max(0, S.boost - dt);

    for (let i = S.pops.length - 1; i >= 0; i--) {
      const p = S.pops[i];
      p.t += dt; p.y += dt * 1.6;
      if (p.t > 1.1) S.pops.splice(i, 1);
    }

    if (S.mode === 'title') {           // タイトルはゆっくり流す
      S.playerZ += dt * 6; S.camZ = S.playerZ - CAM_BACK;
      S.playerX = Math.sin(S.time * 0.7) * 1.6;
      if (S.playerZ > S.endZ - 80) { S.playerZ = 0; }
      return;
    }
    if (S.mode === 'clear' || S.mode === 'over') return;

    // 横移動
    if (S.keyDir) S.targetX = clamp(S.targetX + S.keyDir * 7.5 * dt, -LIMIT_X, LIMIT_X);
    S.playerX += (S.targetX - S.playerX) * Math.min(1, dt * 11);

    if (S.mode === 'play') {
      S.prevZ = S.playerZ;
      S.playerZ += S.speed * dt;
      S.camZ = S.playerZ - CAM_BACK;
      checkItems();
      if (S.playerZ >= S.endZ - 11) enterBoss();
    } else if (S.mode === 'boss') {
      updateBoss(dt);
    }
  }

  function checkItems() {
    for (const it of S.items) {
      if (it.hit || it.z > S.playerZ || it.z <= S.prevZ) continue;

      if (it.type === 'gate') {
        const side = S.playerX < 0 ? 0 : 1;
        const op = it.ops[side];
        const before = S.fruits;
        S.fruits = applyOp(S.fruits, op);
        it.hit = true; it.flash = 1; it.taken = side;
        const diff = S.fruits - before;
        pop((diff >= 0 ? '+' : '') + diff, diff >= 0 ? '#8dff9e' : '#ff8d8d', S.playerX, it.z, 1.8);
        if (diff >= 0) sfx(680, 0.12, 'square', 0.05, 980);
        else { sfx(300, 0.18, 'sawtooth', 0.05, 140); S.shake = 0.5; }
        if (S.fruits <= 0) return gameOver('ゲートで全滅…');

      } else if (it.type === 'monkeys') {
        it.hit = true;
        if (Math.abs(S.playerX - it.x) < it.w + 0.45) {
          const toll = it.count;                       // サル 1 匹につき果物 1 個
          S.fruits = clamp(S.fruits - toll, 0, 9999);
          it.paid = true; it.leaveAt = S.time;
          pop('-' + toll, '#ffd166', it.x, it.z, 1.8);
          S.shake = 0.35;
          sfx(520, 0.09, 'square', 0.045, 760);
          if (S.fruits <= 0) return gameOver('サルに全部わたしてしまった…');
        }

      } else if (it.type === 'wall') {
        it.hit = true;
        if (S.fruits > it.count) {
          S.fruits -= it.count;
          it.paid = true; it.leaveAt = S.time;
          pop('通してもらった -' + it.count, '#ffd166', 0, it.z, 2.2);
          S.shake = 0.6; sfx(430, 0.22, 'square', 0.055, 700);
        } else {
          S.fruits = 0;
          S.shake = 1;
          return gameOver('通行料が払えず追い返された…');
        }

      } else if (it.type === 'bonus') {
        it.hit = true;
        if (Math.abs(S.playerX - it.x) < 1.3) {
          S.fruits = clamp(S.fruits + it.amount, 0, 9999);
          pop('+' + it.amount, '#8dff9e', it.x, it.z, 1.6);
          sfx(880, 0.1, 'triangle', 0.05, 1200);
        }
      }
    }
  }

  function enterBoss() {
    S.mode = 'boss';
    S.targetX = 0;
    const hp = 220 + S.stage * 90;                 // 体力おばけ。数をそろえないと削り切れない
    S.bear = { hp: hp, max: hp, swipe: 1.6, intro: 1.4, lunge: 0, hurt: 0, z: S.endZ + 3 };
    elBoss.style.display = 'block';
    elHint.textContent = '連打 / スペースで反撃！';
    sfx(120, 0.6, 'sawtooth', 0.08, 70);
    S.shake = 1;
  }

  function updateBoss(dt) {
    const b = S.bear;
    // 集団はボスの手前で止まる
    const standZ = S.endZ - 9;
    S.playerZ += (standZ - S.playerZ) * Math.min(1, dt * 3);
    S.camZ = S.playerZ - CAM_BACK;
    b.hurt = Math.max(0, b.hurt - dt * 3);
    b.lunge = Math.max(0, b.lunge - dt * 2);

    if (b.intro > 0) { b.intro -= dt; return; }

    // フルーツの数だけダメージ（連打でブースト）
    const power = S.boost > 0 ? 1.8 : 1;
    b.hp -= S.fruits * 0.85 * power * dt;
    if (S.boost > 0 && Math.random() < dt * 14) b.hurt = 1;

    // クマの攻撃
    b.swipe -= dt;
    if (b.swipe <= 0) {
      b.swipe = Math.max(0.7, 1.3 - S.stage * 0.05);
      const dmg = 7 + S.stage * 3;
      S.fruits = clamp(S.fruits - dmg, 0, 9999);
      pop('-' + dmg, '#ff8d8d', rnd(-1.5, 1.5), S.playerZ + 1, 1.8);
      b.lunge = 1; S.shake = 0.9; S.flash = 0.45;
      sfx(150, 0.22, 'sawtooth', 0.07, 70);
    }
    S.fruits -= (1.2 + S.stage * 0.7) * dt;   // じりじり削られる
    if (S.fruits <= 0) { S.fruits = 0; return gameOver('クマに食べられた…'); }
    if (b.hp <= 0) { b.hp = 0; return stageClear(); }
  }

  // ---------------------------------------------------------------- 描画
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
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, VANISH + 12);

    // 雲（クラウド）
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    for (const c of clouds) {
      c.x -= c.v * 0.016;
      if (c.x < -0.2) c.x = 1.2;
      const px = c.x * W - S.playerX * 6, py = 40 + c.y * (VANISH - 80), r = 16 * c.s;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 7);
      ctx.arc(px + r * 0.9, py + r * 0.15, r * 0.75, 0, 7);
      ctx.arc(px - r * 0.95, py + r * 0.2, r * 0.65, 0, 7);
      ctx.arc(px + r * 0.1, py - r * 0.55, r * 0.6, 0, 7);
      ctx.fill();
    }

    // 遠景の山
    ctx.fillStyle = '#5e8f7a';
    ctx.beginPath();
    ctx.moveTo(-20, VANISH + 6);
    const peaks = 7;
    for (let i = 0; i <= peaks; i++) {
      const x = -20 + (W + 40) * (i / peaks);
      const h = 40 + 34 * Math.sin(i * 2.3 + 1.2) + 20 * Math.sin(i * 5.1);
      ctx.lineTo(x, VANISH + 6 - Math.abs(h));
      ctx.lineTo(x + (W + 40) / peaks / 2, VANISH + 6);
    }
    ctx.lineTo(W + 20, VANISH + 6);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad() {
    ctx.fillStyle = '#7bb661';
    ctx.fillRect(0, VANISH - 2, W, H - VANISH + 2);

    // 描画するストリップの境界を作る（手前は細かく、遠方は 4 単位グリッドに揃える）
    const NEAR = 0.85, MID = 10, FAR = 150, FINE = 0.5, STEP = 4;
    const edges = [];
    for (let z = S.camZ + NEAR; z < S.camZ + MID; z += FINE) edges.push(z);
    const g0 = Math.ceil((S.camZ + MID) / STEP) * STEP;
    for (let z = g0; z < S.camZ + FAR; z += STEP) edges.push(z);

    for (let i = edges.length - 2; i >= 0; i--) {   // 奥から手前へ
      const za = edges[i], zb = edges[i + 1];
      const a = project(0, za, 0), b = project(0, zb, 0);
      if (!a || !b) continue;
      const dark = (Math.floor((za + 0.01) / STEP) % 2 + 2) % 2 === 0;

      ctx.fillStyle = dark ? '#74ae5b' : '#7fbb64';   // 草地
      quad(a, b, 60);
      ctx.fillStyle = dark ? '#c9a678' : '#d3b184';   // 道
      quad(a, b, ROAD_HALF);
      ctx.fillStyle = dark ? '#fff4d8' : '#ef6b5e';   // 路肩
      band(a, b, ROAD_HALF, ROAD_HALF + 0.28);
      band(a, b, -ROAD_HALF - 0.28, -ROAD_HALF);
    }
  }
  function quad(a, b, half) {
    ctx.beginPath();
    ctx.moveTo(W / 2 - half * a.s, a.y);
    ctx.lineTo(W / 2 + half * a.s, a.y);
    ctx.lineTo(W / 2 + half * b.s, b.y);
    ctx.lineTo(W / 2 - half * b.s, b.y);
    ctx.closePath(); ctx.fill();
  }
  function band(a, b, x1, x2) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + x1 * a.s, a.y);
    ctx.lineTo(W / 2 + x2 * a.s, a.y);
    ctx.lineTo(W / 2 + x2 * b.s, b.y);
    ctx.lineTo(W / 2 + x1 * b.s, b.y);
    ctx.closePath(); ctx.fill();
  }

  function shadow(p, r) {
    ctx.fillStyle = 'rgba(0,0,0,.20)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r, r * 0.34, 0, 0, 7);
    ctx.fill();
  }

  // ---------------------------------------------------------------- キャラクター
  // トゥーン調：ベタ塗り＋硬いエッジの影＋ハイライト＋太い主線。光源は常に左上。
  // ファンシーな造形に、笑っていない目と安っぽい笑顔を乗せる。
  const INK   = '#3d2419';
  const JUICE = '#c4123c';
  const BLUSH = 'rgba(255,124,158,.6)';

  function ink(w) {
    ctx.strokeStyle = INK; ctx.lineWidth = w;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }

  /** トゥーン塗り：path の内側をベタ塗りし、右下に硬い影、左上にハイライト、最後に主線。 */
  function toon(path, cx, cy, r, base, shade, lw, hl) {
    ctx.save();
    path(); ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.arc(cx + r * 0.72, cy + r * 0.8, r * 1.3, 0, 7); ctx.fill();
    if (hl) {
      ctx.fillStyle = hl;
      ctx.beginPath(); ctx.ellipse(cx - r * 0.42, cy - r * 0.46, r * 0.32, r * 0.2, -0.6, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (lw) { path(); ink(lw); }
  }
  function ball(cx, cy, r, base, shade, lw, hl) {
    toon(function () { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); }, cx, cy, r, base, shade, lw, hl);
  }
  function blob(cx, cy, rx, ry, rot, base, shade, lw, hl) {
    toon(function () { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); },
         cx, cy, Math.max(rx, ry), base, shade, lw, hl);
  }

  /** 笑っていない目：白目が大きく瞳は点。左右で視線が微妙にズレる。 */
  function deadEye(x, y, rx, ry, px, py, pr, blood) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ink(0.022);
    if (blood) {
      ctx.strokeStyle = 'rgba(206,40,64,.75)'; ctx.lineWidth = 0.008;
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.92, y - ry * 0.1); ctx.quadraticCurveTo(x - rx * 0.6, y + ry * 0.1, x - rx * 0.45, y + ry * 0.45);
      ctx.moveTo(x + rx * 0.92, y + ry * 0.1); ctx.quadraticCurveTo(x + rx * 0.6, y - ry * 0.1, x + rx * 0.5, y - ry * 0.45);
      ctx.stroke();
    }
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x + px, y + py, pr, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(x + px - pr * 0.5, y + py - pr * 0.6, pr * 0.42, 0, 7); ctx.fill();
  }

  /** 安っぽい笑顔：口角だけ上げた、横に広くて浅い笑い。歯は不揃いで一本欠け。 */
  function cheapSmile(cx, cy, w, depth, teeth, fang) {
    const lip = function () {
      ctx.beginPath();
      ctx.moveTo(cx - w, cy);
      ctx.quadraticCurveTo(cx, cy + depth * 2.3, cx + w, cy);
      ctx.closePath();
    };
    lip(); ctx.fillStyle = '#5e0c20'; ctx.fill();
    ctx.save(); lip(); ctx.clip();
    ctx.fillStyle = '#fdf6ec';
    const tw = (w * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      if (i === Math.floor(teeth / 2) + 1) continue;               // 一本欠け
      ctx.fillRect(cx - w + i * tw + tw * 0.08, cy - 0.004, tw * 0.84, depth * (i % 2 ? 0.95 : 0.72));
    }
    if (fang) {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.72, cy); ctx.lineTo(cx - w * 0.44, cy); ctx.lineTo(cx - w * 0.58, cy + depth * 1.7);
      ctx.moveTo(cx + w * 0.72, cy); ctx.lineTo(cx + w * 0.44, cy); ctx.lineTo(cx + w * 0.58, cy + depth * 1.7);
      ctx.fill();
      ctx.fillStyle = '#ff9fb8';
      ctx.beginPath(); ctx.ellipse(cx, cy + depth * 2.3, w * 0.8, depth * 0.5, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,.18)';                             // 口の奥の影
    ctx.beginPath(); ctx.ellipse(cx + w * 0.35, cy + depth * 1.6, w * 0.7, depth * 0.9, 0, 0, 7); ctx.fill();
    ctx.restore();
    lip(); ink(0.025);
    ctx.beginPath();                                               // 上がりすぎた口角
    ctx.moveTo(cx - w, cy); ctx.lineTo(cx - w * 1.2, cy - depth * 0.9);
    ctx.moveTo(cx + w, cy); ctx.lineTo(cx + w * 1.2, cy - depth * 0.9);
    ink(0.022);
  }

  /** 口元の果汁のあとと、口角からしたたる一筋 */
  function juiceStain(cx, cy, w, drip) {
    ctx.fillStyle = 'rgba(196,18,60,.5)';
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.92, cy + w * 0.1, w * 0.22, w * 0.13, 0.5, 0, 7);
    ctx.ellipse(cx + w * 0.92, cy + w * 0.06, w * 0.2, w * 0.12, -0.5, 0, 7);
    ctx.fill();
    const dx = cx + w * 0.92, dy = cy + w * 0.14;
    ctx.fillStyle = JUICE;
    ctx.beginPath();
    ctx.moveTo(dx - w * 0.055, dy); ctx.lineTo(dx + w * 0.055, dy);
    ctx.lineTo(dx + w * 0.028, dy + drip); ctx.lineTo(dx - w * 0.028, dy + drip);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(dx, dy + drip, w * 0.06, 0, 7); ctx.fill();
  }

  // --- フルーツ（顔なし。転がりはスジで見せる）
  function drawFruit(p, size, kind, rot) {
    const r = size * 0.5;
    shadow(p, r * 0.95);
    ctx.save();
    ctx.translate(p.x, p.y - r * 1.02);
    ctx.scale(r, r);
    ball(0, 0, 1, kind.base, kind.shade, 0.075, kind.light);
    ctx.save();                               // 回転するスジ＝転がって見える
    ctx.beginPath(); ctx.arc(0, 0, 0.97, 0, 7); ctx.clip();
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 0.6, -1.0, 1.0); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 0.6, Math.PI - 1.0, Math.PI + 1.0); ctx.stroke();
    ctx.restore();
    if (kind.leaf) {                          // ヘタも一緒に回る
      ctx.save(); ctx.rotate(rot);
      ctx.fillStyle = '#5aa53f';
      ctx.beginPath(); ctx.ellipse(0.34, -0.9, 0.4, 0.17, -0.6, 0, 7); ctx.fill(); ink(0.06);
      ctx.strokeStyle = '#7a5433'; ctx.lineWidth = 0.1;
      ctx.beginPath(); ctx.moveTo(0, -0.92); ctx.lineTo(-0.06, -1.22); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // --- サル（通行料を取りに来る。もらうと満足して帰る）
  const M_FUR = '#b98a5e', M_SHD = '#93683f', M_LIT = '#d3a87c';
  const M_FACE = '#f3a5a5', M_FACE_S = '#dd7f86';
  function drawMonkey(p, size, t, angry, carry) {
    const bob = Math.sin(t * 6) * size * 0.022;
    shadow(p, size * 0.27);
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(size, size);
    // しっぽ
    ctx.beginPath();
    ctx.moveTo(0.18, -0.22);
    ctx.quadraticCurveTo(0.62, -0.14 + Math.sin(t * 5) * 0.08, 0.5, -0.46);
    ctx.strokeStyle = M_FUR; ctx.lineWidth = 0.075; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 0.105; ctx.strokeStyle = INK;
    ctx.globalCompositeOperation = 'destination-over'; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // 脚・腕
    blob(-0.13, -0.05, 0.1, 0.07, 0, M_FUR, M_SHD, 0.022);
    blob(0.13, -0.05, 0.1, 0.07, 0, M_FUR, M_SHD, 0.022);
    const armY = carry ? -0.46 : -0.3 + Math.sin(t * 6) * 0.03;
    blob(-0.26, armY, 0.075, 0.12, 0.35, M_FUR, M_SHD, 0.022);
    blob(0.26, armY, 0.075, 0.12, -0.35, M_FUR, M_SHD, 0.022);
    // 体
    blob(0, -0.29, 0.22, 0.25, 0, M_FUR, M_SHD, 0.026);
    blob(0, -0.25, 0.13, 0.15, 0, '#e9cfae', '#d2b48f', 0);
    // 耳（頭の上のほうに出す）
    ball(-0.39, -0.63, 0.125, M_FUR, M_SHD, 0.026);
    ball(0.39, -0.63, 0.125, M_FUR, M_SHD, 0.026);
    ctx.fillStyle = '#f7b7c8';
    ctx.beginPath(); ctx.arc(-0.39, -0.63, 0.062, 0, 7); ctx.arc(0.39, -0.63, 0.062, 0, 7); ctx.fill();
    // 頭・顔
    ball(0, -0.65, 0.32, M_FUR, M_SHD, 0.03, M_LIT);
    blob(0, -0.61, 0.2, 0.185, 0, M_FACE, M_FACE_S, 0.022);
    ctx.fillStyle = BLUSH;
    ctx.beginPath(); ctx.arc(-0.245, -0.59, 0.058, 0, 7); ctx.arc(0.245, -0.59, 0.058, 0, 7); ctx.fill();
    deadEye(-0.093, -0.67, 0.07, 0.083, -0.012, 0.016, 0.024, angry);
    deadEye(0.093, -0.67, 0.07, 0.083, 0.025, -0.007, 0.022, angry);
    cheapSmile(0, -0.55, 0.125, 0.04, 6, angry);
    juiceStain(0, -0.54, 0.125, 0.05 + Math.abs(Math.sin(t * 1.3)) * 0.1);
    if (angry) {
      ctx.strokeStyle = INK; ctx.lineWidth = 0.028;
      ctx.beginPath();
      ctx.moveTo(-0.185, -0.81); ctx.lineTo(-0.04, -0.76);
      ctx.moveTo(0.185, -0.81); ctx.lineTo(0.04, -0.76); ink(0.028);
    } else {
      ctx.fillStyle = '#ff8fb4';                    // 耳のリボン
      ctx.beginPath();
      ctx.moveTo(0.25, -0.93); ctx.lineTo(0.37, -0.99); ctx.lineTo(0.37, -0.87);
      ctx.moveTo(0.25, -0.93); ctx.lineTo(0.13, -0.99); ctx.lineTo(0.13, -0.87);
      ctx.closePath(); ctx.fill(); ink(0.022);
      ctx.beginPath(); ctx.arc(0.25, -0.93, 0.032, 0, 7); ctx.fill();
    }
    if (carry) {                                    // もらった果物をかかげて帰る
      ball(0, -1.02, 0.15, carry.base, carry.shade, 0.03, carry.light);
    }
    ctx.restore();
  }

  // --- クマ（ぬいぐるみ。体力おばけ）
  function drawBear(p, size, t, hurt, lunge) {
    shadow(p, size * 0.44);
    ctx.save();
    ctx.translate(p.x, p.y - lunge * size * 0.05);
    ctx.scale(size, size);
    const fur  = hurt > 0.3 ? '#e6c6ab' : '#c39a7c', furS = hurt > 0.3 ? '#c9a488' : '#a07c62';
    const furL = hurt > 0.3 ? '#f6e2d1' : '#dcbb9e';
    const bel  = hurt > 0.3 ? '#fbf0e4' : '#ecd8c2', belS = hurt > 0.3 ? '#e8d8c6' : '#d5bda4';
    const sway = Math.sin(t * 3) * 0.02;
    const drip = 0.06 + Math.abs(Math.sin(t * 0.9)) * 0.15;
    const arm  = -0.55 - lunge * 0.22;
    // 腕と爪
    blob(-0.44, arm, 0.13, 0.19, 0.5, fur, furS, 0.028);
    blob(0.44, arm, 0.13, 0.19, -0.5, fur, furS, 0.028);
    for (const sx of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(sx * 0.46 + i * 0.06, arm - 0.13);
        ctx.lineTo(sx * 0.46 + i * 0.06 + 0.035, arm - 0.24);
        ctx.lineTo(sx * 0.46 + i * 0.06 + 0.07, arm - 0.13);
        ctx.closePath();
        ctx.fillStyle = '#fdf6ec'; ctx.fill(); ink(0.016);
      }
      ctx.fillStyle = 'rgba(196,18,60,.75)';
      ctx.beginPath(); ctx.ellipse(sx * 0.46 + 0.035, arm - 0.22, 0.075, 0.028, 0, 0, 7); ctx.fill();
    }
    // 脚
    blob(-0.2, -0.06, 0.15, 0.08, 0, fur, furS, 0.028);
    blob(0.2, -0.06, 0.15, 0.08, 0, fur, furS, 0.028);
    // 体・お腹（縫い目つき）
    blob(sway, -0.38, 0.37, 0.35, 0, fur, furS, 0.032);
    blob(sway, -0.34, 0.22, 0.23, 0, bel, belS, 0);
    ctx.strokeStyle = 'rgba(61,36,25,.5)'; ctx.lineWidth = 0.016;
    ctx.setLineDash([0.035, 0.035]);
    ctx.beginPath(); ctx.moveTo(sway, -0.56); ctx.lineTo(sway, -0.12); ctx.stroke();
    ctx.setLineDash([]);
    // 首のリボンと鈴
    ctx.fillStyle = '#ff8fb4';
    ctx.beginPath(); ctx.rect(sway - 0.32, -0.66, 0.64, 0.07); ctx.fill(); ink(0.022);
    ctx.beginPath();
    ctx.moveTo(sway, -0.63); ctx.lineTo(sway - 0.15, -0.73); ctx.lineTo(sway - 0.15, -0.53); ctx.closePath();
    ctx.fill(); ink(0.022);
    ctx.beginPath();
    ctx.moveTo(sway, -0.63); ctx.lineTo(sway + 0.15, -0.73); ctx.lineTo(sway + 0.15, -0.53); ctx.closePath();
    ctx.fill(); ink(0.022);
    ball(sway, -0.63, 0.055, '#ffd166', '#e0a92e', 0.022);
    // 耳
    ball(sway - 0.4, -1.09, 0.17, fur, furS, 0.032);
    ball(sway + 0.4, -1.09, 0.17, fur, furS, 0.032);
    ctx.fillStyle = '#f7b7c8';
    ctx.beginPath(); ctx.arc(sway - 0.4, -1.09, 0.085, 0, 7); ctx.arc(sway + 0.4, -1.09, 0.085, 0, 7); ctx.fill();
    // 頭・口まわり
    ball(sway, -0.82, 0.45, fur, furS, 0.036, furL);
    blob(sway, -0.69, 0.31, 0.25, 0, bel, belS, 0.024);
    ctx.fillStyle = BLUSH;
    ctx.beginPath(); ctx.arc(sway - 0.32, -0.73, 0.1, 0, 7); ctx.arc(sway + 0.32, -0.73, 0.1, 0, 7); ctx.fill();
    // 目：片方は死んだ目、片方は × に縫い留められている
    deadEye(sway - 0.17, -0.91, 0.1, 0.12, -0.02, 0.03, 0.03, true);
    ctx.strokeStyle = INK; ctx.lineWidth = 0.032; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sway + 0.1, -0.97); ctx.lineTo(sway + 0.24, -0.85);
    ctx.moveTo(sway + 0.24, -0.97); ctx.lineTo(sway + 0.1, -0.85);
    ctx.moveTo(sway + 0.12, -0.91); ctx.lineTo(sway + 0.22, -0.91);
    ctx.stroke();
    // 鼻と口
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.ellipse(sway, -0.76, 0.07, 0.05, 0, 0, 7); ctx.fill();
    cheapSmile(sway, -0.68, 0.27 + lunge * 0.06, 0.075, 8, true);
    juiceStain(sway, -0.66, 0.27, drip);
    ctx.restore();
  }

  function drawTree(p, size) {
    shadow(p, size * 0.16);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(size, size);
    ctx.fillStyle = '#7a5637';
    ctx.fillRect(-0.05, -0.34, 0.1, 0.34);
    ctx.fillStyle = '#3f8f46';
    for (let i = 0; i < 3; i++) {
      const y = -0.3 - i * 0.22, w = 0.34 - i * 0.08;
      ctx.beginPath(); ctx.moveTo(0, y - 0.34); ctx.lineTo(w, y); ctx.lineTo(-w, y); ctx.fill();
    }
    ctx.restore();
  }

  // --- ゲート
  function drawGate(it) {
    const p = project(0, it.z, 0);
    if (!p) return;
    const fade = clamp((95 - p.dz) / 30, 0, 1);       // 遠いゲートは薄く（重なりを防ぐ）
    if (fade <= 0.02) return;
    ctx.globalAlpha = fade;
    const s = p.s, h = 3.6 * s, y = p.y;
    const cx = W / 2, half = ROAD_HALF * s;
    for (let i = 0; i < 2; i++) {
      const op = it.ops[i];
      const x0 = i === 0 ? cx - half : cx;
      const w = half;
      const good = op.good;
      const alpha = it.hit ? 0.18 : 0.48;
      const g = ctx.createLinearGradient(0, y - h, 0, y);
      g.addColorStop(0, good ? 'rgba(90,230,150,' + alpha + ')' : 'rgba(255,110,100,' + alpha + ')');
      g.addColorStop(1, good ? 'rgba(40,180,110,' + (alpha * 0.55) + ')' : 'rgba(210,60,60,' + (alpha * 0.55) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(x0, y - h, w, h);
      ctx.strokeStyle = good ? 'rgba(180,255,210,.9)' : 'rgba(255,200,195,.9)';
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.strokeRect(x0, y - h, w, h);

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
    // 柱
    ctx.fillStyle = '#f2f6f8';
    const pw = Math.max(2, s * 0.12);
    ctx.fillRect(cx - half - pw, y - h, pw, h);
    ctx.fillRect(cx + half, y - h, pw, h);
    ctx.fillRect(cx - pw / 2, y - h, pw, h);
    ctx.globalAlpha = 1;
  }

  function drawWall(it) {
    const p = project(0, it.z, 0);
    if (!p) return;
    const n = 7;
    const gone = it.paid ? S.time - it.leaveAt : 0;
    if (gone > 2.4) return;
    ctx.globalAlpha = gone > 1.4 ? clamp(1 - (gone - 1.4), 0, 1) : 1;
    for (let i = 0; i < n; i++) {
      const x = -ROAD_HALF + 0.7 + (i / (n - 1)) * (ROAD_HALF * 2 - 1.4);
      const q = project(x + (x >= 0 ? 1 : -1) * gone * gone * 4.5, it.z + (i % 2) * 0.35 + gone * 0.6, 0);
      if (q) drawMonkey(q, q.s * 1.85, S.time + i * 1.3, true, gone ? FRUITS[i % FRUITS.length] : null);
    }
    ctx.globalAlpha = 1;
    if (it.paid) return;
    const fs = clamp(p.s * 0.8, 10, 52);
    ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = '通行料 ' + it.count;
    const ly = p.y - p.s * 2.6;
    ctx.lineWidth = fs * 0.18; ctx.strokeStyle = 'rgba(20,10,6,.9)';
    ctx.strokeText(label, W / 2, ly);
    ctx.fillStyle = S.fruits > it.count ? '#b6ffc4' : '#ffb4ae';
    ctx.fillText(label, W / 2, ly);
  }

  function drawItem(it) {
    if (it.type === 'gate') drawGate(it);
    else if (it.type === 'wall') drawWall(it);
    else if (it.type === 'monkeys') {
      const gone = it.paid ? S.time - it.leaveAt : 0;   // 帰りはじめてからの秒数
      if (gone > 2.4) return;
      ctx.globalAlpha = gone > 1.4 ? clamp(1 - (gone - 1.4), 0, 1) : 1;
      for (let i = it.spots.length - 1; i >= 0; i--) {
        const sp = it.spots[i];
        const dir = (it.x + sp[0] >= 0 ? 1 : -1);
        const q = project(it.x + sp[0] + dir * gone * gone * 4.5, it.z + sp[1] + gone * 0.6, 0);
        if (q) drawMonkey(q, q.s * 1.7, S.time * 1.2 + i * 1.7, false,
                          gone ? FRUITS[i % FRUITS.length] : null);
      }
      ctx.globalAlpha = 1;
    } else if (it.type === 'bonus') {
      const q = project(it.x, it.z, 0);
      if (!q) return;
      if (!it.hit) {
        const bob = Math.abs(Math.sin(S.time * 3)) * 0.3;
        const q2 = project(it.x, it.z, 0.3 + bob);
        drawFruit(q2, q.s * 0.75, FRUITS[4], S.time * 2);
        const fs = clamp(q.s * 0.6, 9, 34);
        ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(10,30,20,.8)';
        ctx.strokeText('+' + it.amount, q.x, q.y - q.s * 1.5);
        ctx.fillStyle = '#c9ffdc';
        ctx.fillText('+' + it.amount, q.x, q.y - q.s * 1.5);
      }
    }
  }

  // --- 集団のレイアウト（黄金角スパイラル）
  const layoutCache = {};
  function layout(n) {
    if (!layoutCache[n]) {
      const a = [];
      for (let i = 0; i < n; i++) {
        const ang = i * 2.39996, r = 0.34 * Math.sqrt(i);
        a.push([Math.cos(ang) * r, Math.sin(ang) * r * 1.15]);
      }
      layoutCache[n] = a;
    }
    return layoutCache[n];
  }

  function render() {
    ctx.save();
    if (S.shake > 0) {
      ctx.translate(rnd(-1, 1) * S.shake * 7, rnd(-1, 1) * S.shake * 5);
    }
    drawSky();
    drawRoad();

    // 奥→手前でまとめて描画
    const list = [];
    for (const it of S.items) {
      const dz = it.z - S.camZ;
      if (dz > 0.8 && dz < 150) list.push(it);
    }
    for (const t of S.scenery) {
      const dz = t.z - S.camZ;
      if (dz > 0.8 && dz < 150) list.push(t);
    }
    const n = clamp(Math.ceil(S.fruits), 1, MAX_DRAW);
    const off = layout(n);
    for (let i = 0; i < n; i++) {
      list.push({ type: 'unit', i: i, x: S.playerX + off[i][0], z: S.playerZ + off[i][1] });
    }
    if (S.bear) list.push({ type: 'bear', z: S.bear.z });
    list.sort((a, b) => b.z - a.z);

    for (const o of list) {
      if (o.type === 'unit') {
        const p = project(o.x, o.z, 0);
        if (!p) continue;
        const kind = FRUITS[o.i % FRUITS.length];
        drawFruit(p, p.s * 0.55, kind, S.playerZ * 1.1 + o.i * 0.7);
      } else if (o.type === 'tree') {
        const p = project(o.x, o.z, 0);
        if (p) drawTree(p, p.s * o.h * 0.5);
      } else if (o.type === 'bear') {
        const p = project(0, S.bear.z, 0);
        if (p) drawBear(p, p.s * 6.0, S.time, S.bear.hurt, S.bear.lunge);
      } else {
        drawItem(o);
      }
    }

    // ダメージ表示
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of S.pops) {
      const q = project(p.x, p.z, p.y);
      if (!q) continue;
      const fs = clamp(q.s * 0.8, 12, 46);
      ctx.globalAlpha = clamp(1.3 - p.t, 0, 1);
      ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
      ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(10,20,25,.85)';
      ctx.strokeText(p.text, q.x, q.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, q.x, q.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(255,60,60,' + (S.flash * 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.mode === 'boss' && S.bear.intro > 0) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const msg = 'クマがあらわれた！';
      let fs = Math.min(W * 0.1, 52);
      ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
      const wpx = ctx.measureText(msg).width;
      if (wpx > W * 0.82) { fs = fs * (W * 0.82) / wpx; ctx.font = '900 ' + fs + 'px system-ui, sans-serif'; }
      const pb = project(0, S.bear.z, 0), pc = project(0, S.playerZ, 0);   // クマと集団の間の空きに置く
      const by = pb && pc ? (pb.y + pc.y) / 2 : H * 0.55;
      ctx.lineWidth = fs * 0.16; ctx.strokeStyle = 'rgba(20,10,6,.9)';
      ctx.strokeText(msg, W / 2, by);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(msg, W / 2, by);
    }
  }

  // ---------------------------------------------------------------- HUD
  let lastCount = -1, lastScore = -1, lastStage = -1;
  function hud() {
    const c = Math.ceil(S.fruits);
    if (c !== lastCount) { elCount.textContent = c; lastCount = c; }
    if (S.score !== lastScore) { elScore.textContent = S.score; lastScore = S.score; }
    if (S.stage !== lastStage) { elStage.textContent = S.stage; lastStage = S.stage; }
    elBar.style.width = (clamp(S.playerZ / S.endZ, 0, 1) * 100) + '%';
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

  // QA / デバッグ用の最小ハンドル（自動テストからステージ操作するため）
  window.CrowdRunner = {
    state: S,
    startStage: startStage,
    skipToBoss: function () { if (S.mode === 'play') { S.playerZ = S.endZ - 12; S.prevZ = S.playerZ; } },
    setFruits: function (n) { S.fruits = n; },
    pause: function (v) { S.paused = !!v; },
    ctx: ctx,
    art: { fruit: drawFruit, monkey: drawMonkey, bear: drawBear, fruits: FRUITS },
  };

  resize();
  titleScreen();
  requestAnimationFrame(frame);
})();
