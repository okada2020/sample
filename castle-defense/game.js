"use strict";

/* =========================================================
 * サムライガード 〜忍者襲来〜 (v2)
 * ドラッグで侍を動かし自動連射、鳥居ゲートで強化しながら
 * 押し寄せる妖怪の大群から城を守るハイテンポ・ディフェンス
 * ========================================================= */

(() => {
  // ---------- キャンバス ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- サウンド ----------
  let audioCtx = null;
  function beep(freq, dur, type = "square", gain = 0.04) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* サウンド非対応環境では無音で続行 */ }
  }
  const sfx = {
    shoot: () => beep(920, 0.05, "square", 0.018),
    hit: () => beep(240, 0.06, "sawtooth", 0.03),
    kill: () => beep(540, 0.1, "triangle", 0.045),
    gate: () => { beep(700, 0.1, "triangle", 0.06); setTimeout(() => beep(1050, 0.14, "triangle", 0.06), 90); },
    castleHit: () => beep(90, 0.25, "sawtooth", 0.08),
    buy: () => beep(1040, 0.15, "triangle", 0.06),
    waveClear: () => { beep(660, 0.12, "triangle", 0.06); setTimeout(() => beep(990, 0.2, "triangle", 0.06), 120); },
    gameover: () => { beep(300, 0.3, "sawtooth", 0.07); setTimeout(() => beep(150, 0.5, "sawtooth", 0.07), 250); },
  };

  // ---------- 状態 ----------
  const STORAGE_KEY = "castle-defense-best-wave";

  const state = {
    mode: "title",           // title | playing | shop | gameover
    wave: 1,
    gold: 0,
    kills: 0,
    castleHp: 100,
    castleMaxHp: 100,
    up: { damage: 0, rate: 0, multi: 0, archer: 0, wall: 0 },
    hero: { x: 0, targetX: 0, recoil: 0 },
    buffs: { multi: 0, dmg: 0, rate: 0 }, // 残り秒数
    enemies: [],
    arrows: [],
    gates: [],
    particles: [],
    floaters: [],
    archers: [],
    combo: 0,
    comboTimer: 0,
    spawnQueue: 0,
    spawnTimer: 0,
    gateTimer: 0,
    fireCooldown: 0,
    shake: 0,
    time: 0,
  };

  // ---------- バランス ----------
  const castleLineY = () => H * 0.82;
  const heroY = () => castleLineY() - 52;

  function playerDamage() {
    return Math.round((10 + state.up.damage * 6) * (state.buffs.dmg > 0 ? 1.6 : 1));
  }
  function fireInterval() {
    const base = Math.max(0.1, 0.3 - state.up.rate * 0.03);
    return base / (state.buffs.rate > 0 ? 1.5 : 1);
  }
  function arrowCount() {
    return 1 + state.up.multi + (state.buffs.multi > 0 ? 1 : 0);
  }

  const UPGRADES = [
    {
      key: "damage", icon: "⚔️", name: "業物の鏃",
      desc: l => `矢のダメージ ${10 + l * 6} → ${10 + (l + 1) * 6}`,
      cost: l => 30 + l * 35, max: 20,
    },
    {
      key: "rate", icon: "🏹", name: "早撃ちの技",
      desc: l => `発射間隔 ${(0.3 - l * 0.03).toFixed(2)}秒 → ${Math.max(0.1, 0.3 - (l + 1) * 0.03).toFixed(2)}秒`,
      cost: l => 40 + l * 50, max: 6,
    },
    {
      key: "multi", icon: "🎯", name: "扇の陣・同時発射+1",
      desc: l => `一度に ${1 + l} 本 → ${2 + l} 本の矢を放つ`,
      cost: l => 120 + l * 150, max: 4,
    },
    {
      key: "archer", icon: "🎌", name: "足軽弓兵を雇う",
      desc: l => `自動で戦う足軽 ${l} 人 → ${l + 1} 人`,
      cost: l => 100 + l * 140, max: 4,
    },
    {
      key: "repair", icon: "⚒️", name: "城の普請(修理)",
      desc: () => "城のHPを50%回復する",
      cost: () => 60, max: Infinity,
      canBuy: () => state.castleHp < state.castleMaxHp,
      onBuy: () => { state.castleHp = Math.min(state.castleMaxHp, state.castleHp + state.castleMaxHp * 0.5); },
    },
    {
      key: "wall", icon: "🏯", name: "石垣の強化",
      desc: l => `最大HP ${100 + l * 50} → ${150 + l * 50}(全回復)`,
      cost: l => 80 + l * 90, max: 10,
      onBuy: () => { state.castleMaxHp = 100 + state.up.wall * 50; state.castleHp = state.castleMaxHp; },
    },
  ];

  // 敵タイプ(ハイテンポ調整)
  const ENEMY_TYPES = {
    ninja: { r: 17, hp: 16, speed: 78, dps: 6, gold: 7 },
    tengu: { r: 16, hp: 10, speed: 128, dps: 4, gold: 9 },
    oni:   { r: 23, hp: 55, speed: 46, dps: 12, gold: 20 },
    boss:  { r: 40, hp: 380, speed: 30, dps: 30, gold: 150 },
  };

  function waveScale(wave) { return 1 + (wave - 1) * 0.16; }
  function enemyCountForWave(wave) { return 8 + Math.floor(wave * 3); }

  // 鳥居ゲートのバフ
  const GATE_TYPES = {
    multi: { label: "矢 +1", color: "#4ec3f5", apply: () => { state.buffs.multi = 10; } },
    dmg:   { label: "攻撃UP", color: "#f56b4e", apply: () => { state.buffs.dmg = 10; } },
    rate:  { label: "連射UP", color: "#f5c542", apply: () => { state.buffs.rate = 10; } },
    gold:  { label: "+40両", color: "#7cf28a", apply: () => { state.gold += 40; updateHud(); } },
    heal:  { label: "城回復", color: "#f28ac8", apply: () => { state.castleHp = Math.min(state.castleMaxHp, state.castleHp + state.castleMaxHp * 0.15); updateHud(); } },
  };
  const GATE_KEYS = Object.keys(GATE_TYPES);

  // ---------- ウェーブ ----------
  function startWave() {
    state.mode = "playing";
    state.spawnQueue = enemyCountForWave(state.wave);
    state.spawnTimer = 0.4;
    state.gateTimer = 3;
    if (state.wave % 5 === 0) state.spawnQueue += 1; // ボス分
    hideOverlays();
    updateHud();
  }

  function pickEnemyType() {
    const w = state.wave;
    const r = Math.random();
    if (w >= 3 && r < 0.16 + w * 0.012) return "oni";
    if (w >= 2 && r < 0.45) return "tengu";
    return "ninja";
  }

  function spawnEnemy(type) {
    const def = ENEMY_TYPES[type];
    const scale = waveScale(state.wave);
    const margin = def.r + 12;
    state.enemies.push({
      type,
      x: margin + Math.random() * (W - margin * 2),
      y: -def.r - Math.random() * 40,
      r: def.r,
      hp: Math.round(def.hp * scale),
      maxHp: Math.round(def.hp * scale),
      speed: def.speed * (0.9 + Math.random() * 0.2),
      dps: def.dps * scale,
      gold: def.gold,
      wobble: Math.random() * Math.PI * 2,
      attacking: false,
      hitFlash: 0,
    });
  }

  function spawnGatePair() {
    const a = GATE_KEYS[Math.floor(Math.random() * GATE_KEYS.length)];
    let b = a;
    while (b === a) b = GATE_KEYS[Math.floor(Math.random() * GATE_KEYS.length)];
    state.gates.push({ y: -40, speed: 66, left: a, right: b });
  }

  // ---------- 矢 ----------
  const ARROW_SPEED = 760;

  function autoFire() {
    // 最も城に近い(=最下段の)敵を自動で狙う
    let target = null;
    for (const e of state.enemies) {
      if (e.y > -10 && (!target || e.y > target.y)) target = e;
    }
    if (!target) return false;

    const hx = state.hero.x, hy = heroY();
    const base = Math.atan2(target.y - hy, target.x - hx);
    const n = arrowCount();
    const spread = 0.11;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * spread;
      state.arrows.push({
        x: hx, y: hy - 14,
        vx: Math.cos(a) * ARROW_SPEED,
        vy: Math.sin(a) * ARROW_SPEED,
        dmg: playerDamage(),
      });
    }
    state.hero.recoil = 0.08;
    sfx.shoot();
    return true;
  }

  function archerShoot(archer, target) {
    const a = Math.atan2(target.y - archer.y, target.x - archer.x);
    state.arrows.push({
      x: archer.x, y: archer.y,
      vx: Math.cos(a) * ARROW_SPEED * 0.85,
      vy: Math.sin(a) * ARROW_SPEED * 0.85,
      dmg: Math.max(6, Math.round(playerDamage() * 0.5)),
    });
  }

  function rebuildArchers() {
    state.archers = [];
    const n = state.up.archer;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      state.archers.push({
        x: W * (0.1 + t * 0.8),
        y: castleLineY() + 24,
        cd: Math.random(),
      });
    }
  }

  // ---------- エフェクト ----------
  function addFloater(x, y, text, color, big = false) {
    state.floaters.push({ x, y, text, color, life: big ? 1.1 : 0.7, big });
  }

  function addBurst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 50 + Math.random() * 140;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.3,
        color,
      });
    }
  }

  function onKill(e) {
    state.gold += e.gold;
    state.kills++;
    state.combo++;
    state.comboTimer = 2;
    if (state.combo > 0 && state.combo % 10 === 0) {
      state.gold += 10;
      addFloater(W / 2, H * 0.3, `${state.combo} COMBO! +10両`, "#f5c542", true);
    }
    addFloater(e.x, e.y, `+${e.gold}両`, "#7cf28a");
    addBurst(e.x, e.y, e.type === "boss" ? "#c94ce0" : "#ff8a5e", e.type === "boss" ? 26 : 10);
    if (e.type === "boss") state.shake = 10;
    sfx.kill();
    updateHud();
  }

  // ---------- 更新 ----------
  function update(dt) {
    state.time += dt;
    if (state.mode !== "playing") return;

    // ヒーロー移動(ドラッグ先へ滑らかに追従)
    const hero = state.hero;
    const follow = 1 - Math.pow(0.0001, dt); // フレームレート非依存の追従
    hero.x += (hero.targetX - hero.x) * follow;
    hero.x = Math.max(24, Math.min(W - 24, hero.x));
    hero.recoil = Math.max(0, hero.recoil - dt);

    // バフ減衰
    for (const k in state.buffs) state.buffs[k] = Math.max(0, state.buffs[k] - dt);

    // コンボ
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;

    // スポーン
    if (state.spawnQueue > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        if (state.wave % 5 === 0 && state.spawnQueue === 1) {
          spawnEnemy("boss");
        } else {
          spawnEnemy(pickEnemyType());
        }
        state.spawnQueue--;
        state.spawnTimer = Math.max(0.18, 0.75 - state.wave * 0.03);
      }
    }

    // 鳥居ゲート
    if (state.spawnQueue > 0 || state.enemies.length > 0) {
      state.gateTimer -= dt;
      if (state.gateTimer <= 0) {
        spawnGatePair();
        state.gateTimer = 7;
      }
    }
    for (let i = state.gates.length - 1; i >= 0; i--) {
      const g = state.gates[i];
      g.y += g.speed * dt;
      if (g.y >= heroY()) {
        const key = state.hero.x < W / 2 ? g.left : g.right;
        const def = GATE_TYPES[key];
        def.apply();
        addFloater(state.hero.x, heroY() - 50, def.label + "!", def.color, true);
        addBurst(state.hero.x, heroY() - 20, def.color, 14);
        sfx.gate();
        state.gates.splice(i, 1);
      }
    }

    // 自動連射
    state.fireCooldown -= dt;
    if (state.fireCooldown <= 0) {
      if (autoFire()) state.fireCooldown = fireInterval();
      else state.fireCooldown = 0.05;
    }

    // 足軽弓兵
    for (const ar of state.archers) {
      ar.cd -= dt;
      if (ar.cd <= 0 && state.enemies.length > 0) {
        let best = null, bestD = Infinity;
        for (const e of state.enemies) {
          const d = (e.x - ar.x) ** 2 + (e.y - ar.y) ** 2;
          if (d < bestD) { bestD = d; best = e; }
        }
        if (best) { archerShoot(ar, best); ar.cd = 0.9; }
      }
    }

    // 矢
    for (let i = state.arrows.length - 1; i >= 0; i--) {
      const a = state.arrows[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -30 || a.x > W + 30 || a.y < -30 || a.y > H + 30) {
        state.arrows.splice(i, 1);
        continue;
      }
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        const dx = e.x - a.x, dy = e.y - a.y;
        if (dx * dx + dy * dy < (e.r + 5) ** 2) {
          e.hp -= a.dmg;
          e.hitFlash = 0.1;
          addFloater(e.x + (Math.random() - 0.5) * 14, e.y - e.r, `${a.dmg}`, "#ffe27a");
          addBurst(a.x, a.y, "#ffd75e", 4);
          state.arrows.splice(i, 1);
          if (e.hp <= 0) {
            state.enemies.splice(j, 1);
            onKill(e);
          } else {
            sfx.hit();
          }
          break;
        }
      }
    }

    // 敵
    const wallY = castleLineY();
    for (const e of state.enemies) {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.y < wallY - e.r) {
        e.wobble += dt * 7;
        e.y += e.speed * dt;
        e.x += Math.sin(e.wobble) * 14 * dt;
        e.x = Math.max(e.r, Math.min(W - e.r, e.x));
        e.attacking = false;
      } else {
        e.y = wallY - e.r;
        if (!e.attacking) { e.attacking = true; e.atkTimer = 0.4; }
        e.atkTimer -= dt;
        if (e.atkTimer <= 0) {
          e.atkTimer = 1.0;
          const dmg = Math.max(1, Math.round(e.dps));
          state.castleHp -= dmg;
          state.shake = 6;
          addFloater(e.x, wallY + 14, `-${dmg}`, "#ff8a7a");
          sfx.castleHit();
          updateHud();
          if (state.castleHp <= 0) {
            state.castleHp = 0;
            gameOver();
            return;
          }
        }
      }
    }

    // パーティクル・フローター
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) { state.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
    }
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 44 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }

    state.shake = Math.max(0, state.shake - dt * 22);

    if (state.spawnQueue === 0 && state.enemies.length === 0) waveClear();
  }

  // =========================================================
  // 描画 — ベクターキャラクター
  // =========================================================
  const OUTLINE = "#241d30";

  function strokePath() {
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  // 忍者: 黒装束+赤マフラー
  function drawNinja(r, t) {
    const lw = Math.max(1.6, r * 0.13);
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    const leg = Math.sin(t * 10) * r * 0.25;
    // 脚
    ctx.fillStyle = "#2c2c40";
    ctx.beginPath();
    ctx.roundRect(-r * 0.42, r * 0.35 + leg * 0.3, r * 0.34, r * 0.55 - leg * 0.3, r * 0.15);
    ctx.roundRect(r * 0.08, r * 0.35 - leg * 0.3, r * 0.34, r * 0.55 + leg * 0.3, r * 0.15);
    ctx.fill(); strokePath();
    // 胴体
    ctx.fillStyle = "#38384f";
    ctx.beginPath();
    ctx.roundRect(-r * 0.55, -r * 0.15, r * 1.1, r * 0.75, r * 0.25);
    ctx.fill(); strokePath();
    // 赤マフラー(たなびく)
    ctx.fillStyle = "#d1443a";
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.15);
    ctx.quadraticCurveTo(-r * 1.15, -r * 0.05 + Math.sin(t * 8) * r * 0.15, -r * 1.35, r * 0.25);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.3, -r * 0.45, r * 0.12);
    ctx.closePath();
    ctx.fill(); strokePath();
    // 頭(頭巾)
    ctx.fillStyle = "#38384f";
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.55, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    // 目もと(肌)
    ctx.fillStyle = "#f0c9a0";
    ctx.beginPath();
    ctx.roundRect(-r * 0.42, -r * 0.72, r * 0.84, r * 0.3, r * 0.14);
    ctx.fill();
    // 目
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.57, r * 0.08, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.57, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // クナイ
    ctx.strokeStyle = "#b9c2cc";
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.moveTo(r * 0.55, 0);
    ctx.lineTo(r * 0.95, r * 0.3);
    ctx.stroke();
  }

  // 天狗: 赤い顔+長い鼻+黒い羽
  function drawTengu(r, t) {
    const lw = Math.max(1.6, r * 0.13);
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    const flap = Math.sin(t * 14) * 0.5;
    // 羽(左右)
    ctx.fillStyle = "#2c2c40";
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.rotate(-0.3 - flap * 0.35);
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r * 0.1);
      ctx.quadraticCurveTo(r * 1.5, -r * 0.9, r * 1.7, -r * 0.1);
      ctx.quadraticCurveTo(r * 1.2, 0, r * 0.35, r * 0.25);
      ctx.closePath();
      ctx.fill(); strokePath();
      ctx.restore();
    }
    // 体(白装束)
    ctx.fillStyle = "#efe8da";
    ctx.beginPath();
    ctx.roundRect(-r * 0.5, -r * 0.1, r, r * 0.85, r * 0.3);
    ctx.fill(); strokePath();
    ctx.fillStyle = "#d1443a";
    ctx.fillRect(-r * 0.5, r * 0.32, r, r * 0.16);
    // 顔(赤)
    ctx.fillStyle = "#d9503f";
    ctx.beginPath();
    ctx.arc(0, -r * 0.5, r * 0.52, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    // 長い鼻
    ctx.fillStyle = "#c8402f";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.05, -r * 0.15);
    ctx.lineTo(-r * 0.18, -r * 0.42);
    ctx.closePath();
    ctx.fill(); strokePath();
    // 目・眉
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-r * 0.24, -r * 0.62, r * 0.11, 0, Math.PI * 2);
    ctx.arc(r * 0.24, -r * 0.62, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.62, r * 0.05, 0, Math.PI * 2);
    ctx.arc(r * 0.26, -r * 0.62, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // 鬼: 赤い体+角+金棒
  function drawOni(r, t) {
    const lw = Math.max(1.8, r * 0.11);
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    const sway = Math.sin(t * 6) * 0.06;
    ctx.rotate(sway);
    // 金棒
    ctx.save();
    ctx.rotate(0.5 + sway);
    ctx.fillStyle = "#5a4634";
    ctx.beginPath();
    ctx.roundRect(r * 0.35, -r * 1.25, r * 0.28, r * 1.3, r * 0.1);
    ctx.fill(); strokePath();
    ctx.fillStyle = "#8a8276";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(r * 0.49, -r * (0.5 + i * 0.3), r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // 脚
    ctx.fillStyle = "#c24a3e";
    ctx.beginPath();
    ctx.roundRect(-r * 0.5, r * 0.4, r * 0.4, r * 0.5, r * 0.15);
    ctx.roundRect(r * 0.1, r * 0.4, r * 0.4, r * 0.5, r * 0.15);
    ctx.fill(); strokePath();
    // 虎柄の腰布
    ctx.fillStyle = "#f5c542";
    ctx.beginPath();
    ctx.roundRect(-r * 0.55, r * 0.22, r * 1.1, r * 0.32, r * 0.1);
    ctx.fill(); strokePath();
    ctx.fillStyle = OUTLINE;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.3 - r * 0.06, r * 0.22);
      ctx.lineTo(i * r * 0.3 + r * 0.06, r * 0.54);
      ctx.lineWidth = lw * 0.7;
      ctx.stroke();
    }
    ctx.lineWidth = lw;
    // 胴体(筋肉質)
    ctx.fillStyle = "#d1443a";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.05, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    // 頭
    ctx.fillStyle = "#d1443a";
    ctx.beginPath();
    ctx.arc(0, -r * 0.62, r * 0.45, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    // 髪
    ctx.fillStyle = "#3a2f45";
    ctx.beginPath();
    ctx.arc(0, -r * 0.78, r * 0.4, Math.PI, 0);
    ctx.closePath();
    ctx.fill(); strokePath();
    // 角
    ctx.fillStyle = "#f6f1e6";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.18, -r * 0.95);
      ctx.lineTo(s * r * 0.3, -r * 1.25);
      ctx.lineTo(s * r * 0.4, -r * 0.9);
      ctx.closePath();
      ctx.fill(); strokePath();
    }
    // 顔
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-r * 0.16, -r * 0.62, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.16, -r * 0.62, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-r * 0.14, -r * 0.6, r * 0.05, 0, Math.PI * 2);
    ctx.arc(r * 0.18, -r * 0.6, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // 牙付きの口
    ctx.fillStyle = "#8a2c24";
    ctx.beginPath();
    ctx.roundRect(-r * 0.18, -r * 0.45, r * 0.36, r * 0.14, r * 0.05);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, -r * 0.45);
    ctx.lineTo(-r * 0.08, -r * 0.34);
    ctx.lineTo(-r * 0.02, -r * 0.45);
    ctx.moveTo(r * 0.14, -r * 0.45);
    ctx.lineTo(r * 0.08, -r * 0.34);
    ctx.lineTo(r * 0.02, -r * 0.45);
    ctx.fill();
  }

  // 竜(ボス): 蛇行する胴体+たてがみ
  function drawDragon(r, t) {
    const lw = Math.max(2.2, r * 0.08);
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    // 胴体(後ろから前へ)
    const segs = 6;
    for (let i = segs; i >= 1; i--) {
      const p = i / segs;
      const sx = Math.sin(t * 3 + p * 4) * r * 0.55;
      const sy = r * 0.15 + p * r * 0.75;
      const sr = r * (0.5 - p * 0.28);
      ctx.fillStyle = i % 2 ? "#3f9b5f" : "#358a52";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill(); strokePath();
    }
    // 頭
    const hx = Math.sin(t * 3) * r * 0.2;
    ctx.save();
    ctx.translate(hx, -r * 0.35);
    ctx.fillStyle = "#3f9b5f";
    ctx.beginPath();
    ctx.roundRect(-r * 0.55, -r * 0.42, r * 1.1, r * 0.8, r * 0.3);
    ctx.fill(); strokePath();
    // 金の腹・鼻先
    ctx.fillStyle = "#f5c542";
    ctx.beginPath();
    ctx.roundRect(-r * 0.34, r * 0.05, r * 0.68, r * 0.3, r * 0.12);
    ctx.fill();
    // たてがみ
    ctx.fillStyle = "#7ad1a0";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.22, -r * 0.5, r * 0.12, r * 0.26 + Math.sin(t * 5 + i) * r * 0.04, i * 0.2, 0, Math.PI * 2);
      ctx.fill(); strokePath();
    }
    // 角
    ctx.fillStyle = "#f6f1e6";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.3, -r * 0.5);
      ctx.lineTo(s * r * 0.48, -r * 0.85);
      ctx.lineTo(s * r * 0.55, -r * 0.5);
      ctx.closePath();
      ctx.fill(); strokePath();
    }
    // 目(光る琥珀)
    ctx.fillStyle = "#ffb347";
    ctx.beginPath();
    ctx.arc(-r * 0.24, -r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.24, -r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-r * 0.24, -r * 0.1, r * 0.05, 0, Math.PI * 2);
    ctx.arc(r * 0.24, -r * 0.1, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // ひげ
    ctx.strokeStyle = "#f6f1e6";
    ctx.lineWidth = lw * 0.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.5, r * 0.1);
      ctx.quadraticCurveTo(s * r * 0.95, r * 0.15 + Math.sin(t * 4) * r * 0.08, s * r * 1.1, -r * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  const ENEMY_DRAW = { ninja: drawNinja, tengu: drawTengu, oni: drawOni, boss: drawDragon };

  // 侍ヒーロー: 赤鎧+兜+弓
  function drawSamurai(x, y, t, recoil) {
    ctx.save();
    ctx.translate(x, y + recoil * 40);
    const r = 22;
    const lw = 2.4;
    ctx.lineWidth = lw;
    ctx.lineJoin = "round";
    // 脚(袴)
    ctx.fillStyle = "#3a3550";
    ctx.beginPath();
    ctx.roundRect(-r * 0.5, r * 0.35, r * 0.42, r * 0.55, r * 0.12);
    ctx.roundRect(r * 0.08, r * 0.35, r * 0.42, r * 0.55, r * 0.12);
    ctx.fill(); strokePath();
    // 胴体(赤鎧)
    ctx.fillStyle = "#c73e3a";
    ctx.beginPath();
    ctx.roundRect(-r * 0.58, -r * 0.2, r * 1.16, r * 0.8, r * 0.2);
    ctx.fill(); strokePath();
    // 鎧の段
    ctx.strokeStyle = "#8a2c24";
    ctx.lineWidth = lw * 0.7;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, r * 0.05 + i * r * 0.22);
      ctx.lineTo(r * 0.55, r * 0.05 + i * r * 0.22);
      ctx.stroke();
    }
    ctx.lineWidth = lw;
    // 弓(上向き・撃つと引き絞り)
    const draw = recoil > 0 ? 0.3 : 0;
    ctx.strokeStyle = "#5a4634";
    ctx.lineWidth = lw * 1.1;
    ctx.beginPath();
    ctx.arc(r * 0.75, -r * 0.55, r * 0.75, Math.PI * 0.75, Math.PI * 1.6);
    ctx.stroke();
    ctx.strokeStyle = "#d8cfc0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.25, -r * 1.1);
    ctx.lineTo(r * 0.55 + draw * 8, -r * 0.35);
    ctx.lineTo(r * 0.2, -r * 0.02);
    ctx.stroke();
    ctx.lineWidth = lw;
    // 頭
    ctx.fillStyle = "#f0c9a0";
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, r * 0.42, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    // 兜
    ctx.fillStyle = "#8a2c24";
    ctx.beginPath();
    ctx.arc(0, -r * 0.72, r * 0.46, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.5, r * 0.5, -r * 0.42);
    ctx.lineTo(-r * 0.5, -r * 0.42);
    ctx.closePath();
    ctx.fill(); strokePath();
    // 前立て(金の三日月)
    ctx.strokeStyle = "#f5c542";
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, -r * 1.0, r * 0.3, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // 目
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.58, r * 0.06, 0, Math.PI * 2);
    ctx.arc(r * 0.15, -r * 0.58, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 鳥居ゲート
  function drawGate(g) {
    const y = g.y;
    const halves = [
      { key: g.left, x0: 8, x1: W / 2 - 8 },
      { key: g.right, x0: W / 2 + 8, x1: W - 8 },
    ];
    for (const h of halves) {
      const def = GATE_TYPES[h.key];
      const cx = (h.x0 + h.x1) / 2;
      const w = h.x1 - h.x0;
      // 光の帯
      const grad = ctx.createLinearGradient(0, y - 34, 0, y + 20);
      grad.addColorStop(0, def.color + "00");
      grad.addColorStop(0.65, def.color + "44");
      grad.addColorStop(1, def.color + "00");
      ctx.fillStyle = grad;
      ctx.fillRect(h.x0, y - 34, w, 54);
      // 鳥居
      ctx.strokeStyle = "#c73e3a";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(h.x0 + w * 0.16, y + 16);
      ctx.lineTo(h.x0 + w * 0.2, y - 22);
      ctx.moveTo(h.x1 - w * 0.16, y + 16);
      ctx.lineTo(h.x1 - w * 0.2, y - 22);
      ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(h.x0 + w * 0.06, y - 26);
      ctx.quadraticCurveTo(cx, y - 34, h.x1 - w * 0.06, y - 26);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(h.x0 + w * 0.14, y - 14);
      ctx.lineTo(h.x1 - w * 0.14, y - 14);
      ctx.stroke();
      ctx.lineCap = "butt";
      // ラベル札
      ctx.fillStyle = "rgba(15,12,24,.78)";
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      const tw = Math.min(w * 0.62, 96), th2 = 24;
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, y - 8, tw, th2, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.label, cx, y + 4);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    drawBackground();
    drawCastle();

    // 鳥居ゲート(敵より奥)
    for (const g of state.gates) drawGate(g);

    // 足軽弓兵
    for (const ar of state.archers) {
      ctx.save();
      ctx.translate(ar.x, ar.y);
      ctx.scale(0.55, 0.55);
      drawSamuraiMini();
      ctx.restore();
    }

    // 敵
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.hitFlash > 0) ctx.filter = "brightness(1.9) saturate(.6)";
      const bob = e.attacking ? Math.sin(state.time * 16) * 2 : 0;
      ctx.translate(0, bob);
      ENEMY_DRAW[e.type](e.r, state.time + e.wobble);
      ctx.restore();
      if (e.hp < e.maxHp) {
        const bw = e.r * 2, bh = 5;
        const bx = e.x - e.r, by = e.y - e.r * 1.55;
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 2.5);
        ctx.fill();
        ctx.fillStyle = e.type === "boss" ? "#c94ce0" : "#ff5e4e";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh, 2.5);
        ctx.fill();
      }
    }

    // ヒーロー
    if (state.mode === "playing") {
      drawSamurai(state.hero.x, heroY(), state.time, state.hero.recoil);
      drawBuffPills();
    }

    // 矢(軌跡つき)
    for (const a of state.arrows) {
      const mag = Math.hypot(a.vx, a.vy) || 1;
      const nx = a.vx / mag, ny = a.vy / mag;
      ctx.strokeStyle = "rgba(245,197,66,.35)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(a.x - nx * 26, a.y - ny * 26);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
      ctx.strokeStyle = "#f5deb3";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.x - nx * 14, a.y - ny * 14);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
    }

    // パーティクル
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;

    // ダメージ数字・テキスト
    ctx.textAlign = "center";
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / (f.big ? 1.1 : 0.7));
      ctx.font = f.big ? "900 22px sans-serif" : "bold 15px sans-serif";
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // コンボ表示
    if (state.combo >= 5 && state.mode === "playing") {
      ctx.font = "900 26px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,.65)";
      ctx.lineWidth = 4;
      const txt = `${state.combo} COMBO`;
      const cy = H * 0.16;
      ctx.strokeText(txt, W / 2, cy);
      ctx.fillStyle = "#f5c542";
      ctx.fillText(txt, W / 2, cy);
    }

    ctx.restore();
  }

  // 足軽(簡略版の侍)
  function drawSamuraiMini() {
    const r = 20;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.fillStyle = "#3a5a8a";
    ctx.beginPath();
    ctx.roundRect(-r * 0.55, -r * 0.2, r * 1.1, r * 0.9, r * 0.2);
    ctx.fill(); strokePath();
    ctx.fillStyle = "#f0c9a0";
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.4, 0, Math.PI * 2);
    ctx.fill(); strokePath();
    ctx.fillStyle = "#8a7a5a";
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.85);
    ctx.lineTo(r * 0.5, -r * 0.85);
    ctx.lineTo(r * 0.3, -r * 0.6);
    ctx.lineTo(-r * 0.3, -r * 0.6);
    ctx.closePath();
    ctx.fill(); strokePath();
    ctx.strokeStyle = "#5a4634";
    ctx.beginPath();
    ctx.arc(r * 0.6, -r * 0.3, r * 0.55, Math.PI * 0.8, Math.PI * 1.6);
    ctx.stroke();
  }

  // バフ残り時間の表示(ヒーローの下に小さなピル)
  function drawBuffPills() {
    const active = [];
    if (state.buffs.multi > 0) active.push({ label: "矢+1", t: state.buffs.multi, color: GATE_TYPES.multi.color });
    if (state.buffs.dmg > 0) active.push({ label: "攻UP", t: state.buffs.dmg, color: GATE_TYPES.dmg.color });
    if (state.buffs.rate > 0) active.push({ label: "連UP", t: state.buffs.rate, color: GATE_TYPES.rate.color });
    if (!active.length) return;
    const y = heroY() + 34;
    const pw = 52, gap = 6;
    let x = state.hero.x - (active.length * pw + (active.length - 1) * gap) / 2;
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const b of active) {
      ctx.fillStyle = "rgba(10,8,18,.7)";
      ctx.beginPath();
      ctx.roundRect(x, y, pw, 17, 8.5);
      ctx.fill();
      ctx.fillStyle = b.color;
      ctx.fillText(`${b.label} ${Math.ceil(b.t)}`, x + pw / 2, y + 9);
      x += pw + gap;
    }
  }

  function drawBackground() {
    // 藍色の夜空
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#141a33");
    g.addColorStop(0.55, "#232a4d");
    g.addColorStop(1, "#3a3060");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 星
    ctx.fillStyle = "rgba(255,255,255,.5)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137.5) % W;
      const sy = (i * 89.7) % (H * 0.5);
      const tw = 0.5 + 0.5 * Math.sin(state.time * 2 + i);
      ctx.globalAlpha = 0.25 + tw * 0.35;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // 満月
    ctx.fillStyle = "#f7e9b0";
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.11, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220,190,120,.35)";
    ctx.beginPath();
    ctx.arc(W * 0.8 - 8, H * 0.11 + 5, 6, 0, Math.PI * 2);
    ctx.arc(W * 0.8 + 9, H * 0.11 - 7, 4, 0, Math.PI * 2);
    ctx.fill();

    // 富士山のシルエット
    const wallY = castleLineY();
    const baseY = wallY;
    const peakY = H * 0.58;
    const cxm = W * 0.28;
    ctx.fillStyle = "#1d1b38";
    ctx.beginPath();
    ctx.moveTo(cxm - W * 0.55, baseY);
    ctx.quadraticCurveTo(cxm - W * 0.18, peakY + 30, cxm - W * 0.07, peakY);
    ctx.lineTo(cxm + W * 0.07, peakY);
    ctx.quadraticCurveTo(cxm + W * 0.18, peakY + 30, cxm + W * 0.55, baseY);
    ctx.closePath();
    ctx.fill();
    // 冠雪
    ctx.fillStyle = "rgba(235,240,255,.85)";
    ctx.beginPath();
    ctx.moveTo(cxm - W * 0.07, peakY);
    ctx.lineTo(cxm + W * 0.07, peakY);
    ctx.lineTo(cxm + W * 0.09, peakY + 16);
    ctx.lineTo(cxm + W * 0.045, peakY + 9);
    ctx.lineTo(cxm, peakY + 18);
    ctx.lineTo(cxm - W * 0.045, peakY + 9);
    ctx.lineTo(cxm - W * 0.09, peakY + 16);
    ctx.closePath();
    ctx.fill();

    // 桜吹雪
    for (let i = 0; i < 26; i++) {
      const seed = i * 71.3;
      const fall = 22 + (i % 5) * 9;
      const drift = 14 + (i % 7) * 5;
      const px = ((seed * 13.7) % W + state.time * drift + Math.sin(state.time * 1.3 + seed) * 24 + W) % W;
      const py = ((seed * 29.1) % H + state.time * fall) % H;
      const rot = state.time * 2 + seed;
      const s = 3 + (i % 3);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = i % 2 ? "#f8c8d8" : "#f2a9c4";
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // 白壁と瓦屋根(入母屋風の反り)を描く共通処理
  function drawTieredRoof(cx, y, halfW, rh, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - halfW - 10, y);
    ctx.quadraticCurveTo(cx - halfW * 0.5, y - rh * 0.55, cx, y - rh);
    ctx.quadraticCurveTo(cx + halfW * 0.5, y - rh * 0.55, cx + halfW + 10, y);
    ctx.quadraticCurveTo(cx + halfW + 12, y - 4, cx + halfW + 14, y - 8);
    ctx.lineTo(cx + halfW + 4, y + 2);
    ctx.lineTo(cx - halfW - 4, y + 2);
    ctx.lineTo(cx - halfW - 14, y - 8);
    ctx.quadraticCurveTo(cx - halfW - 12, y - 4, cx - halfW - 10, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawCastle() {
    const wallY = castleLineY();

    // 石垣(野面積み風)
    const g = ctx.createLinearGradient(0, wallY, 0, H);
    g.addColorStop(0, "#8a8276");
    g.addColorStop(1, "#4e463c");
    ctx.fillStyle = g;
    ctx.fillRect(0, wallY, W, H - wallY);

    ctx.strokeStyle = "rgba(30,25,18,.4)";
    ctx.lineWidth = 1.5;
    const bh = 18, bw = 40;
    for (let row = 0; wallY + row * bh < H; row++) {
      const y = wallY + row * bh;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const wobY = y + Math.sin((x + row * 53) * 0.11) * 2.5;
        x === 0 ? ctx.moveTo(x, wobY) : ctx.lineTo(x, wobY);
      }
      ctx.stroke();
      const off = row % 2 === 0 ? 0 : bw / 2;
      for (let x = off; x < W; x += bw) {
        const wx = x + Math.sin((row * 31 + x) * 0.7) * 4;
        ctx.beginPath();
        ctx.moveTo(wx, y + 1);
        ctx.lineTo(wx + 2, Math.min(H, y + bh - 1));
        ctx.stroke();
      }
    }

    // 白漆喰の塀と瓦の笠木
    const heiH = 20;
    ctx.fillStyle = "#f2ede2";
    ctx.fillRect(0, wallY - heiH, W, heiH);
    ctx.fillStyle = "#3c3a45";
    for (let x = 14; x < W - 10; x += 46) {
      ctx.fillRect(x, wallY - heiH + 7, 8, 9);
    }
    ctx.fillStyle = "#4a4756";
    ctx.fillRect(-2, wallY - heiH - 6, W + 4, 7);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-2, wallY - heiH - 6, W + 4, 2);

    // 天守閣(画面端寄り・ヒーローと被らない位置)
    const tx = W * 0.85;
    const baseY = wallY - heiH - 4;
    const tierW = [40, 31];
    const tierH = 24;
    let y = baseY;
    for (let i = 0; i < 2; i++) {
      const hw = tierW[i];
      ctx.fillStyle = "#f6f1e6";
      ctx.fillRect(tx - hw, y - tierH, hw * 2, tierH);
      ctx.fillStyle = "#2e2b38";
      ctx.fillRect(tx - hw, y - 6, hw * 2, 3);
      ctx.fillStyle = "#3c3a45";
      ctx.fillRect(tx - 11, y - tierH + 6, 8, 9);
      ctx.fillRect(tx + 3, y - tierH + 6, 8, 9);
      y -= tierH;
      drawTieredRoof(tx, y, tierW[i], 14, "#4a5568");
      y -= 12;
    }
    drawTieredRoof(tx, y + 2, 20, 16, "#3d4759");
    ctx.fillStyle = "#f5c542";
    ctx.beginPath();
    ctx.ellipse(tx - 18, y - 7, 3.5, 6, -0.5, 0, Math.PI * 2);
    ctx.ellipse(tx + 18, y - 7, 3.5, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 幟(のぼり旗・日の丸)
    const fx = W * 0.08;
    ctx.strokeStyle = "#d8cfc0";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fx, wallY - heiH);
    ctx.lineTo(fx, wallY - heiH - 64);
    ctx.stroke();
    const sway = Math.sin(state.time * 3) * 2;
    ctx.fillStyle = "#c73e3a";
    ctx.fillRect(fx + 2, wallY - heiH - 62, 15 + sway, 40);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(fx + 9 + sway / 2, wallY - heiH - 42, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- HUD ----------
  const hudWave = document.getElementById("hud-wave");
  const hudGold = document.getElementById("hud-gold");
  const hpFill = document.getElementById("castle-hp-fill");
  const hpText = document.getElementById("castle-hp-text");

  function updateHud() {
    hudWave.textContent = `WAVE ${state.wave}`;
    hudGold.textContent = `🪙 ${state.gold} 両`;
    const ratio = state.castleMaxHp > 0 ? state.castleHp / state.castleMaxHp : 0;
    hpFill.style.width = `${Math.max(0, ratio * 100)}%`;
    hpFill.className = ratio < 0.25 ? "danger" : ratio < 0.5 ? "warn" : "";
    hpText.textContent = `🏯 ${Math.ceil(state.castleHp)} / ${state.castleMaxHp}`;
  }

  // ---------- 画面遷移 ----------
  const screens = {
    title: document.getElementById("screen-title"),
    shop: document.getElementById("screen-shop"),
    gameover: document.getElementById("screen-gameover"),
  };

  function hideOverlays() {
    for (const k in screens) screens[k].classList.remove("show");
  }

  function showScreen(name) {
    hideOverlays();
    screens[name].classList.add("show");
  }

  function getBest() {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0; } catch (e) { return 0; }
  }
  function setBest(wave) {
    try { localStorage.setItem(STORAGE_KEY, String(wave)); } catch (e) { /* プライベートモード等 */ }
  }

  function waveClear() {
    sfx.waveClear();
    const bonus = 20 + state.wave * 10;
    state.gold += bonus;
    state.mode = "shop";
    state.arrows = [];
    state.gates = [];
    state.combo = 0;
    document.getElementById("shop-title").textContent = `WAVE ${state.wave} クリア! (+${bonus}両)`;
    renderShop();
    showScreen("shop");
    updateHud();
  }

  function renderShop() {
    document.getElementById("shop-gold").textContent = state.gold;
    const list = document.getElementById("upgrade-list");
    list.innerHTML = "";
    for (const u of UPGRADES) {
      const lvl = u.key in state.up ? state.up[u.key] : 0;
      const maxed = lvl >= u.max;
      const cost = maxed ? 0 : u.cost(lvl);
      const blocked = u.canBuy ? !u.canBuy() : false;

      const item = document.createElement("div");
      item.className = "upgrade-item";

      const icon = document.createElement("div");
      icon.className = "upgrade-icon";
      icon.textContent = u.icon;

      const info = document.createElement("div");
      info.className = "upgrade-info";
      const name = document.createElement("div");
      name.className = "upgrade-name";
      name.textContent = u.name + (u.max !== Infinity && u.max > 1 ? ` Lv.${lvl}` : "");
      const desc = document.createElement("div");
      desc.className = "upgrade-desc";
      desc.textContent = maxed ? "最大レベルに到達!" : u.desc(lvl);
      info.append(name, desc);

      const btn = document.createElement("button");
      btn.className = "btn btn-buy" + (maxed ? " maxed" : "");
      if (maxed) {
        btn.textContent = "MAX";
        btn.disabled = true;
      } else {
        btn.textContent = `${cost}両`;
        btn.disabled = blocked || state.gold < cost;
        btn.addEventListener("click", () => {
          if (state.gold < cost) return;
          state.gold -= cost;
          if (u.key in state.up) state.up[u.key]++;
          if (u.onBuy) u.onBuy();
          if (u.key === "archer") rebuildArchers();
          sfx.buy();
          renderShop();
          updateHud();
        });
      }

      item.append(icon, info, btn);
      list.appendChild(item);
    }
  }

  function gameOver() {
    state.mode = "gameover";
    sfx.gameover();
    const best = getBest();
    if (state.wave > best) setBest(state.wave);
    document.getElementById("result-wave").textContent = `到達ウェーブ: ${state.wave}`;
    document.getElementById("result-kills").textContent = `倒した敵: ${state.kills} 体`;
    document.getElementById("result-best").textContent =
      state.wave > best ? "🎉 ベスト記録更新!" : `ベスト記録: WAVE ${Math.max(best, state.wave)}`;
    showScreen("gameover");
    updateHud();
  }

  function resetGame() {
    state.wave = 1;
    state.gold = 0;
    state.kills = 0;
    state.castleHp = 100;
    state.castleMaxHp = 100;
    state.up = { damage: 0, rate: 0, multi: 0, archer: 0, wall: 0 };
    state.hero.x = W / 2;
    state.hero.targetX = W / 2;
    state.hero.recoil = 0;
    state.buffs = { multi: 0, dmg: 0, rate: 0 };
    state.enemies = [];
    state.arrows = [];
    state.gates = [];
    state.particles = [];
    state.floaters = [];
    state.archers = [];
    state.combo = 0;
    state.spawnQueue = 0;
    state.fireCooldown = 0;
    state.shake = 0;
  }

  // ---------- 入力(ドラッグでヒーロー移動) ----------
  function pointerPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  let dragging = false;
  canvas.addEventListener("pointerdown", ev => {
    if (state.mode !== "playing") return;
    ev.preventDefault();
    dragging = true;
    state.hero.targetX = pointerPos(ev).x;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove", ev => {
    if (!dragging || state.mode !== "playing") return;
    state.hero.targetX = pointerPos(ev).x;
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  document.getElementById("btn-start").addEventListener("click", () => {
    resetGame();
    updateHud();
    startWave();
  });

  document.getElementById("btn-next-wave").addEventListener("click", () => {
    state.wave++;
    rebuildArchers();
    startWave();
  });

  document.getElementById("btn-retry").addEventListener("click", () => {
    resetGame();
    updateHud();
    startWave();
  });

  // ---------- メインループ ----------
  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // 動作確認用フック(ゲームロジックには影響しない)
  window.__castleDebug = state;

  // ---------- 初期化 ----------
  state.hero.x = W / 2;
  state.hero.targetX = W / 2;
  const best = getBest();
  document.getElementById("title-best").textContent = best > 0 ? `ベスト記録: WAVE ${best}` : "";
  updateHud();
  requestAnimationFrame(loop);
})();
