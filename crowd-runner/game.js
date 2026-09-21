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
    { c1: '#ff7a6e', c2: '#d32b20', leaf: true  }, // りんご
    { c1: '#ffc061', c2: '#ef7d12', leaf: false }, // みかん
    { c1: '#ffe98a', c2: '#e8c22a', leaf: false }, // レモン
    { c1: '#c79bff', c2: '#7b3fd1', leaf: true  }, // ぶどう
    { c1: '#ffb3c1', c2: '#ef5d80', leaf: true  }, // もも
    { c1: '#a9e88a', c2: '#4fa83d', leaf: false }, // メロン
  ];
  FRUITS.forEach(f => { f.grad = null; });

  function fruitGrad(f) {
    if (!f.grad) {
      const g = ctx.createRadialGradient(-0.35, -0.42, 0.08, 0, 0, 1.25);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.16, f.c1);
      g.addColorStop(0.72, f.c1);
      g.addColorStop(1, f.c2);
      f.grad = g;
    }
    return f.grad;
  }

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
    return {
      type: 'monkeys', z: z, x: rnd(-LIMIT_X + 1.2, LIMIT_X - 1.2),
      w: 1.0 + count * 0.045, count: count, hit: false, t: Math.random() * 6,
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
      '🐵 <b>サル</b>にぶつかるとフルーツを食べられる。<br>' +
      '🧱 <b>サルの壁</b>は数で押し通れ。足りなければ全滅。<br>' +
      '🐻 ゴールで<b>クマ</b>が襲ってくる。連打で反撃！' +
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
        if (Math.abs(S.playerX - it.x) < it.w + 0.7) {
          const dmg = Math.round(it.count * 1.5);
          S.fruits = clamp(S.fruits - dmg, 0, 9999);
          pop('-' + dmg, '#ff8d8d', it.x, it.z, 1.8);
          S.shake = 0.8; S.flash = 0.5;
          sfx(180, 0.2, 'sawtooth', 0.06, 90);
          if (S.fruits <= 0) return gameOver('サルに食べつくされた…');
        }

      } else if (it.type === 'wall') {
        it.hit = true;
        if (S.fruits > it.count) {
          S.fruits -= it.count;
          pop('突破！ -' + it.count, '#ffd166', 0, it.z, 2.2);
          S.shake = 1; sfx(420, 0.25, 'square', 0.06, 180);
        } else {
          S.fruits = 0;
          S.shake = 1;
          return gameOver('サルの壁に止められた…');
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
    S.bear = {
      hp: 100 + S.stage * 55, max: 100 + S.stage * 55,
      swipe: 1.4, intro: 1.4, lunge: 0, hurt: 0, z: S.endZ + 3,
    };
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
      b.swipe = Math.max(0.55, 1.25 - S.stage * 0.06);
      const dmg = 8 + S.stage * 4;
      S.fruits = clamp(S.fruits - dmg, 0, 9999);
      pop('-' + dmg, '#ff8d8d', rnd(-1.5, 1.5), S.playerZ + 1, 1.8);
      b.lunge = 1; S.shake = 0.9; S.flash = 0.45;
      sfx(150, 0.22, 'sawtooth', 0.07, 70);
    }
    S.fruits -= (1.5 + S.stage) * dt;     // じりじり削られる
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

  // --- フルーツ
  function drawFruit(p, size, kind, rot) {
    const r = size * 0.5;
    shadow(p, r * 0.95);
    ctx.save();
    ctx.translate(p.x, p.y - r * 1.02);
    ctx.rotate(rot);
    ctx.scale(r, r);
    ctx.fillStyle = fruitGrad(kind);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 0.07;
    ctx.beginPath(); ctx.arc(0, 0, 0.965, 0, 7); ctx.stroke();
    if (kind.leaf) {
      ctx.fillStyle = '#4b8b3b';
      ctx.beginPath(); ctx.ellipse(0.32, -0.88, 0.42, 0.18, -0.6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 0.09;
      ctx.beginPath(); ctx.moveTo(0, -0.95); ctx.lineTo(-0.05, -1.2); ctx.stroke();
    }
    ctx.restore();
  }

  // --- サル
  function drawMonkey(p, size, t, angry) {
    const bob = Math.sin(t * 6) * size * 0.03;
    shadow(p, size * 0.3);
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(size, size);
    const fur = angry ? '#7a4f38' : '#8d6247', furL = angry ? '#9a6a4d' : '#a5785c';
    // しっぽ
    ctx.strokeStyle = fur; ctx.lineWidth = 0.055; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.2, -0.24);
    ctx.quadraticCurveTo(0.5, -0.3 + Math.sin(t * 5) * 0.08, 0.38, -0.56); ctx.stroke();
    // 体・腕
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(0, -0.3, 0.24, 0.3, 0, 0, 7); ctx.fill();
    ctx.lineWidth = 0.1;
    ctx.beginPath(); ctx.moveTo(-0.2, -0.38); ctx.lineTo(-0.3, -0.52 + Math.sin(t * 6) * 0.06); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.2, -0.38); ctx.lineTo(0.3, -0.52 - Math.sin(t * 6) * 0.06); ctx.stroke();
    // 耳
    ctx.fillStyle = furL;
    ctx.beginPath(); ctx.arc(-0.25, -0.74, 0.1, 0, 7); ctx.arc(0.25, -0.74, 0.1, 0, 7); ctx.fill();
    // 頭
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.arc(0, -0.72, 0.26, 0, 7); ctx.fill();
    // 顔
    ctx.fillStyle = '#f0cfa6';
    ctx.beginPath(); ctx.ellipse(0, -0.68, 0.18, 0.2, 0, 0, 7); ctx.fill();
    // 目・口
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath(); ctx.arc(-0.07, -0.75, 0.032, 0, 7); ctx.arc(0.07, -0.75, 0.032, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 0.035;
    ctx.beginPath(); ctx.arc(0, -0.63, 0.07, 0.15, Math.PI - 0.15); ctx.stroke();
    if (angry) {   // 怒り眉
      ctx.lineWidth = 0.045;
      ctx.beginPath(); ctx.moveTo(-0.14, -0.84); ctx.lineTo(-0.02, -0.79);
      ctx.moveTo(0.14, -0.84); ctx.lineTo(0.02, -0.79); ctx.stroke();
    }
    ctx.restore();
  }

  // --- クマ
  function drawBear(p, size, t, hurt, lunge) {
    shadow(p, size * 0.42);
    ctx.save();
    ctx.translate(p.x, p.y - lunge * size * 0.06);
    ctx.scale(size, size);
    const fur = hurt > 0.3 ? '#8a5c44' : '#5b3a2a';
    const sway = Math.sin(t * 3) * 0.02;
    // 腕（振りかぶり）
    ctx.strokeStyle = fur; ctx.lineWidth = 0.16; ctx.lineCap = 'round';
    const arm = -0.42 - lunge * 0.22;
    ctx.beginPath(); ctx.moveTo(-0.26, -0.5); ctx.lineTo(-0.46, arm); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.26, -0.5); ctx.lineTo(0.46, arm); ctx.stroke();
    // 体
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(sway, -0.38, 0.34, 0.38, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7d573f';
    ctx.beginPath(); ctx.ellipse(sway, -0.32, 0.2, 0.24, 0, 0, 7); ctx.fill();
    // 耳
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.arc(-0.27 + sway, -0.92, 0.12, 0, 7); ctx.arc(0.27 + sway, -0.92, 0.12, 0, 7); ctx.fill();
    // 頭
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.arc(sway, -0.82, 0.3, 0, 7); ctx.fill();
    // 鼻先
    ctx.fillStyle = '#c69a75';
    ctx.beginPath(); ctx.ellipse(sway, -0.72, 0.16, 0.13, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#20140e';
    ctx.beginPath(); ctx.ellipse(sway, -0.78, 0.055, 0.04, 0, 0, 7); ctx.fill();
    // 口（咆哮）
    ctx.fillStyle = '#8e2b2b';
    ctx.beginPath(); ctx.ellipse(sway, -0.65, 0.1, 0.07 + lunge * 0.03, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(sway - 0.06, -0.7); ctx.lineTo(sway - 0.02, -0.63); ctx.lineTo(sway - 0.1, -0.65); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sway + 0.06, -0.7); ctx.lineTo(sway + 0.02, -0.63); ctx.lineTo(sway + 0.1, -0.65); ctx.fill();
    // 目
    ctx.fillStyle = '#20140e';
    ctx.beginPath(); ctx.arc(sway - 0.11, -0.89, 0.036, 0, 7); ctx.arc(sway + 0.11, -0.89, 0.036, 0, 7); ctx.fill();
    ctx.strokeStyle = '#20140e'; ctx.lineWidth = 0.05; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sway - 0.19, -0.99); ctx.lineTo(sway - 0.05, -0.93);
    ctx.moveTo(sway + 0.19, -0.99); ctx.lineTo(sway + 0.05, -0.93); ctx.stroke();
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
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = -ROAD_HALF + 0.6 + (i / (n - 1)) * (ROAD_HALF * 2 - 1.2);
      const q = project(x, it.z, 0);
      if (q) drawMonkey(q, q.s * 1.5, S.time + i, true);
    }
    const fs = clamp(p.s * 0.8, 10, 52);
    ctx.font = '900 ' + fs + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = '必要 ' + it.count;
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
      for (let i = 0; i < Math.min(it.count, 9); i++) {
        const x = it.x + (i - Math.min(it.count, 9) / 2 + 0.5) * (it.w * 2 / Math.min(it.count, 9));
        const q = project(x, it.z + (i % 2) * 0.5, 0);
        if (q) drawMonkey(q, q.s * 1.35, S.time * 1.2 + i, false);
      }
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
        if (p) drawBear(p, p.s * 5.2, S.time, S.bear.hurt, S.bear.lunge);
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
      const by = Math.min(H * 0.24, VANISH * 0.8);   // クマの顔に重ねない
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
    update(dt);
    render();
    hud();
    requestAnimationFrame(frame);
  }

  // QA / デバッグ用の最小ハンドル（自動テストからステージ操作するため）
  window.CrowdRunner = {
    state: S,
    startStage: startStage,
    skipToBoss: function () { if (S.mode === 'play') { S.playerZ = S.endZ - 12; S.prevZ = S.playerZ; } },
    setFruits: function (n) { S.fruits = n; },
  };

  resize();
  titleScreen();
  requestAnimationFrame(frame);
})();
