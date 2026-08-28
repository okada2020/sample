"use strict";

/* =========================================================
 * サムライガード 〜忍者襲来〜
 * タップで矢を放ち、忍者と鬼の軍勢から和の城を守るディフェンスゲーム
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

  // ---------- サウンド(WebAudio 簡易効果音) ----------
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
    shoot: () => beep(880, 0.07, "square", 0.025),
    hit: () => beep(220, 0.08, "sawtooth", 0.04),
    kill: () => beep(520, 0.12, "triangle", 0.05),
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
    // アップグレードレベル
    up: { damage: 0, rate: 0, multi: 0, archer: 0, wall: 0 },
    enemies: [],
    arrows: [],
    particles: [],
    floaters: [],            // ダメージ数字など
    archers: [],             // 自動弓兵
    spawnQueue: 0,
    spawnTimer: 0,
    fireCooldown: 0,
    aiming: false,
    aimX: 0, aimY: 0,
    shake: 0,
    time: 0,
  };

  // ---------- バランス定数 ----------
  const castleLineY = () => H * 0.82;          // 城壁の位置(ここまで来た敵が攻撃)
  const towerPos = () => ({ x: W / 2, y: H * 0.87 });

  function playerDamage() { return 10 + state.up.damage * 6; }
  function fireInterval() { return Math.max(0.12, 0.42 - state.up.rate * 0.05); }
  function arrowCount() { return 1 + state.up.multi; }

  const UPGRADES = [
    {
      key: "damage", icon: "⚔️", name: "業物の鏃",
      desc: l => `矢のダメージ ${10 + l * 6} → ${10 + (l + 1) * 6}`,
      cost: l => 30 + l * 35, max: 20,
    },
    {
      key: "rate", icon: "🏹", name: "早撃ちの技",
      desc: l => `発射間隔 ${(0.42 - l * 0.05).toFixed(2)}秒 → ${Math.max(0.12, 0.42 - (l + 1) * 0.05).toFixed(2)}秒`,
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

  // 敵タイプ定義(和風: 忍者・天狗・鬼・大蛇)
  const ENEMY_TYPES = {
    grunt: { emoji: "🥷", r: 18, hp: 20, speed: 42, dps: 6, gold: 8 },
    fast:  { emoji: "👺", r: 16, hp: 12, speed: 85, dps: 4, gold: 10 },
    tank:  { emoji: "👹", r: 24, hp: 70, speed: 26, dps: 12, gold: 22 },
    boss:  { emoji: "🐉", r: 36, hp: 400, speed: 20, dps: 30, gold: 150 },
  };

  function waveScale(wave) { return 1 + (wave - 1) * 0.18; }

  function enemyCountForWave(wave) { return 6 + Math.floor(wave * 2.2); }

  // ---------- ウェーブ生成 ----------
  function startWave() {
    state.mode = "playing";
    state.spawnQueue = enemyCountForWave(state.wave);
    state.spawnTimer = 0.5;
    if (state.wave % 5 === 0) state.spawnQueue += 1; // ボス分
    hideOverlays();
    updateHud();
  }

  function pickEnemyType() {
    const w = state.wave;
    const r = Math.random();
    if (w >= 3 && r < 0.18 + w * 0.01) return "tank";
    if (w >= 2 && r < 0.45) return "fast";
    return "grunt";
  }

  function spawnEnemy(type) {
    const def = ENEMY_TYPES[type];
    const scale = waveScale(state.wave);
    const margin = def.r + 10;
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
      emoji: def.emoji,
      wobble: Math.random() * Math.PI * 2,
      attacking: false,
      hitFlash: 0,
    });
  }

  // ---------- 矢 ----------
  const ARROW_SPEED = 620;

  function shootVolley(tx, ty) {
    const { x, y } = towerPos();
    const base = Math.atan2(ty - y, tx - x);
    const n = arrowCount();
    const spread = 0.09;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * spread;
      state.arrows.push({
        x, y,
        vx: Math.cos(a) * ARROW_SPEED,
        vy: Math.sin(a) * ARROW_SPEED,
        dmg: playerDamage(),
      });
    }
    sfx.shoot();
  }

  function archerShoot(archer, target) {
    const a = Math.atan2(target.y - archer.y, target.x - archer.x);
    state.arrows.push({
      x: archer.x, y: archer.y,
      vx: Math.cos(a) * ARROW_SPEED * 0.85,
      vy: Math.sin(a) * ARROW_SPEED * 0.85,
      dmg: Math.max(6, Math.round(playerDamage() * 0.6)),
    });
  }

  function rebuildArchers() {
    state.archers = [];
    const n = state.up.archer;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      state.archers.push({
        x: W * (0.12 + t * 0.76),
        y: castleLineY() + 26,
        cd: Math.random(),
      });
    }
  }

  // ---------- エフェクト ----------
  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 0.8 });
  }

  function addBurst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 120;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.3,
        color,
      });
    }
  }

  // ---------- 更新 ----------
  function update(dt) {
    state.time += dt;
    if (state.mode !== "playing") return;

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
        state.spawnTimer = Math.max(0.25, 1.1 - state.wave * 0.04);
      }
    }

    // プレイヤーの射撃(押している間、連射)
    state.fireCooldown -= dt;
    if (state.aiming && state.fireCooldown <= 0) {
      shootVolley(state.aimX, state.aimY);
      state.fireCooldown = fireInterval();
    }

    // 自動弓兵
    for (const ar of state.archers) {
      ar.cd -= dt;
      if (ar.cd <= 0 && state.enemies.length > 0) {
        let best = null, bestD = Infinity;
        for (const e of state.enemies) {
          const d = (e.x - ar.x) ** 2 + (e.y - ar.y) ** 2;
          if (d < bestD) { bestD = d; best = e; }
        }
        if (best) {
          archerShoot(ar, best);
          ar.cd = 1.0;
        }
      }
    }

    // 矢の移動と当たり判定
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
        if (dx * dx + dy * dy < (e.r + 4) ** 2) {
          e.hp -= a.dmg;
          e.hitFlash = 0.12;
          addFloater(e.x, e.y - e.r, `-${a.dmg}`, "#ffe27a");
          addBurst(a.x, a.y, "#ffd75e", 5);
          state.arrows.splice(i, 1);
          if (e.hp <= 0) {
            state.gold += e.gold;
            state.kills++;
            addFloater(e.x, e.y, `+${e.gold}🪙`, "#7cf28a");
            addBurst(e.x, e.y, "#ff8a5e", 12);
            state.enemies.splice(j, 1);
            sfx.kill();
            updateHud();
          } else {
            sfx.hit();
          }
          break;
        }
      }
    }

    // 敵の移動と城への攻撃
    const wallY = castleLineY();
    for (const e of state.enemies) {
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.y < wallY - e.r) {
        e.wobble += dt * 6;
        e.y += e.speed * dt;
        e.x += Math.sin(e.wobble) * 12 * dt;
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
      p.vy += 300 * dt;
    }
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= 40 * dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }

    state.shake = Math.max(0, state.shake - dt * 20);

    // ウェーブクリア判定
    if (state.spawnQueue === 0 && state.enemies.length === 0) {
      waveClear();
    }
  }

  // ---------- 描画 ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }

    drawBackground();
    drawCastle();

    // 足軽弓兵
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const ar of state.archers) {
      ctx.fillText("🏹", ar.x, ar.y);
    }

    // 敵
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.hitFlash > 0) ctx.filter = "brightness(1.8)";
      ctx.font = `${e.r * 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const bob = e.attacking ? Math.sin(state.time * 14) * 2 : Math.sin(e.wobble * 2) * 1.5;
      ctx.fillText(e.emoji, 0, bob);
      ctx.restore();
      // HPバー
      if (e.hp < e.maxHp) {
        const bw = e.r * 2, bh = 4;
        const bx = e.x - e.r, by = e.y - e.r - 10;
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = e.type === "boss" ? "#c94ce0" : "#ff5e4e";
        ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), bh);
      }
    }

    // 矢
    ctx.strokeStyle = "#f5deb3";
    ctx.lineWidth = 2.5;
    for (const a of state.arrows) {
      const len = 14;
      const mag = Math.hypot(a.vx, a.vy) || 1;
      const nx = a.vx / mag, ny = a.vy / mag;
      ctx.beginPath();
      ctx.moveTo(a.x - nx * len, a.y - ny * len);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
    }

    // パーティクル
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // ダメージ数字
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / 0.8);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // 照準
    if (state.aiming && state.mode === "playing") {
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(state.aimX, state.aimY, 16, 0, Math.PI * 2);
      ctx.moveTo(state.aimX - 24, state.aimY);
      ctx.lineTo(state.aimX + 24, state.aimY);
      ctx.moveTo(state.aimX, state.aimY - 24);
      ctx.lineTo(state.aimX, state.aimY + 24);
      ctx.stroke();
    }

    ctx.restore();
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

    // 桜吹雪(時刻から決まる手続き的アニメーション)
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
    // 軒先の反り上がり
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

    // 白漆喰の塀(狭間付き)と瓦の笠木
    const heiH = 20;
    ctx.fillStyle = "#f2ede2";
    ctx.fillRect(0, wallY - heiH, W, heiH);
    ctx.fillStyle = "#3c3a45";
    for (let x = 14; x < W - 10; x += 46) {
      ctx.fillRect(x, wallY - heiH + 7, 8, 9); // 狭間(矢を放つ小窓)
    }
    ctx.fillStyle = "#4a4756";
    ctx.fillRect(-2, wallY - heiH - 6, W + 4, 7); // 瓦の笠木
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-2, wallY - heiH - 6, W + 4, 2);

    // 天守閣(中央・プレイヤー位置)
    const t = towerPos();
    const baseY = wallY - heiH - 4;
    const tierW = [44, 34];
    const tierH = 26;
    let y = baseY;
    for (let i = 0; i < 2; i++) {
      const hw = tierW[i];
      // 白壁の階層
      ctx.fillStyle = "#f6f1e6";
      ctx.fillRect(t.x - hw, y - tierH, hw * 2, tierH);
      ctx.fillStyle = "#2e2b38";
      ctx.fillRect(t.x - hw, y - 6, hw * 2, 3); // 腰の黒帯
      // 窓
      ctx.fillStyle = "#3c3a45";
      ctx.fillRect(t.x - 12, y - tierH + 7, 9, 10);
      ctx.fillRect(t.x + 3, y - tierH + 7, 9, 10);
      y -= tierH;
      drawTieredRoof(t.x, y, tierW[i], 16, "#4a5568");
      y -= 14;
    }
    // 最上部の屋根と金鯱
    drawTieredRoof(t.x, y + 2, 22, 18, "#3d4759");
    ctx.fillStyle = "#f5c542";
    ctx.beginPath();
    ctx.ellipse(t.x - 20, y - 8, 4, 7, -0.5, 0, Math.PI * 2);
    ctx.ellipse(t.x + 20, y - 8, 4, 7, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 幟(のぼり旗・日の丸)
    const fx = t.x + 58;
    ctx.strokeStyle = "#d8cfc0";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fx, baseY);
    ctx.lineTo(fx, baseY - 74);
    ctx.stroke();
    const sway = Math.sin(state.time * 3) * 2;
    ctx.fillStyle = "#c73e3a";
    ctx.fillRect(fx + 2, baseY - 72, 16 + sway, 44);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(fx + 10 + sway / 2, baseY - 50, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // プレイヤー(天守の上の侍弓兵)
    ctx.font = "26px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏹", t.x, baseY - tierH + 8);
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
    state.aiming = false;
    document.getElementById("shop-title").textContent = `WAVE ${state.wave} クリア! (+${bonus}🪙)`;
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
        btn.textContent = `${cost}🪙`;
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
    state.aiming = false;
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
    state.enemies = [];
    state.arrows = [];
    state.particles = [];
    state.floaters = [];
    state.archers = [];
    state.spawnQueue = 0;
    state.fireCooldown = 0;
    state.aiming = false;
    state.shake = 0;
  }

  // ---------- 入力 ----------
  function pointerPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", ev => {
    if (state.mode !== "playing") return;
    ev.preventDefault();
    const p = pointerPos(ev);
    state.aiming = true;
    state.aimX = p.x;
    state.aimY = p.y;
    canvas.setPointerCapture(ev.pointerId);
  });

  canvas.addEventListener("pointermove", ev => {
    if (!state.aiming) return;
    const p = pointerPos(ev);
    state.aimX = p.x;
    state.aimY = p.y;
  });

  const stopAim = () => { state.aiming = false; };
  canvas.addEventListener("pointerup", stopAim);
  canvas.addEventListener("pointercancel", stopAim);

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
  const best = getBest();
  document.getElementById("title-best").textContent = best > 0 ? `ベスト記録: WAVE ${best}` : "";
  updateHud();
  requestAnimationFrame(loop);
})();
