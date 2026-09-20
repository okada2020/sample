---
name: hyper-casual-game
description: Build a playable browser prototype of a hyper-casual / casual mobile game in one pass — the kind seen in App Store screenshots (crowd runners with +N/×N gates, stack runners, merge/idle loops, one-thumb arcade games). Use this whenever the user shows a game screenshot or store page and asks "こんなのできる？", "こういうゲーム作って", "同じようなのを", or wants a quick playable mock of a casual game idea, even if they do not say "prototype". Also use it when they ask for another game "like the last one" (ゲートラッシュ / crowd runner). Delivers a single self-contained HTML page (Three.js, portrait 9:16, touch-first) published as an artifact.
---

# hyper-casual-game — a playable answer to "こんなのできる？"

The user who shows a store screenshot wants to know two things: *can this be made* and *what would it feel like*. A paragraph answers neither; a page they can thumb through on their phone answers both. So the deliverable is always a playable prototype, and the reply is the link plus a short table of what from the reference is in, what is not, and one honest line about the genre.

## Recipe (what every prototype shares)

- **One HTML file, Three.js r128 from cdnjs** (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`), no other libraries. Portrait canvas that fills a phone and caps at 9:16 on desktop.
- **Touch first**: `pointerdown/move/up` with `setPointerCapture`, `touch-action:none` on the body, arrow keys as the desktop fallback. One-thumb input only — the genre lives on that.
- **Auto-forward, player steers** (runner) or **tap to act** (arcade). Never both controls at once.
- **Crowds are InstancedMesh**, laid out with sunflower packing (`r = k·√i`, `θ = i·2.39996`) so 10 or 400 units read as one round blob. Sphere head + cylinder body + cone hat is enough character and costs nothing.
- **Numbers on screen**: gate values, enemy counts, boss HP as canvas-texture sprites; the live crowd count as big HUD text. The number going up *is* the game.
- **Start card → play → win/lose card → retry**, all in the page. A prototype that needs a reload to retry is not one people keep playing.
- **Fog + a bright saturated palette** (water blue, sandstone, team blue vs enemy red). These games are read at a glance on a small screen; low contrast kills them.

Copy `assets/gate-rush.html` and change the world, the rules and the numbers. Its structure — world build, instanced units, gates, enemies, state/reset, input, loop, resize — is the order that keeps a rewrite short. Most "new" hyper-casual games are one of its parts swapped: a stack runner is gates that add to a tower instead of a crowd; a merge game is the enemy loop without a track.

## Genre rules worth keeping

- **Every gate pair offers one good option.** A careful run can only grow; the skill is in choosing *how much*. Randomize the values, not the fairness.
- **Enemies advance when close and stop the crowd on contact**; ranged damage scales with crowd size so a big crowd feels powerful before the fight even starts.
- **Boss = one big unit with a visible HP number**, placed at the very end. The last 10 seconds are the screenshot people share.
- **Difficulty is tuned in three numbers**: gate spacing, enemy counts, boss HP. Expose them near the top of the script so the user can ask for "harder" and get it in one edit.

## Reply shape

1. The artifact link.
2. Controls in one line.
3. A small table: reference feature → in / not in.
4. One honest sentence about the market (this genre is crowded; a prototype proves feel, not a business) and an offer to go deeper (levels, upgrades, sound) if they want.

Keep the whole reply short; the page is the answer.
