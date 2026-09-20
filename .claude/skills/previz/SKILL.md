---
name: previz
description: Build an interactive 3D previsualization (previz / プリビズ / blocking / animatic / camera plan) from a shot list before any footage is generated or shot. Characters are sphere-head stick figures with unmistakable facing markers; sets are labelled blocks; every cut has its own camera (first-person POV, fixed security-camera style, or a title card) rendered inside the target frame (9:16, 16:9). Use this whenever the user wants to plan camera angles, staging, character placement, eyelines or cut order for a video, trailer, CM, short film, game cinematic or AI-generated clip — including when they say 絵コンテ, ブロッキング, 構図を先に決めたい, カメラ位置, 立ち位置, or complain that AI-generated shots keep coming out with the wrong composition. Reach for it even if they only ask "where should the camera be for this scene".
---

# previz — blocking before pixels

A previz answers *where is everyone, where is the camera, what is in frame* with cheap grey blocks, so those decisions are locked before anyone spends money on rendering, generating or shooting. For AI-generated video this matters twice: a composition that is only in your head gets re-guessed by the model on every attempt, and each guess costs credits. A previz frame turns "POV, basket on the right" into a picture the prompt can describe exactly (camera height, lens, what sits where in the frame).

The output is one self-contained HTML page: a cut list on the left, the frame in the middle, the direction notes underneath, and the scene JSON in an editor at the bottom so the user can nudge numbers and hit 適用 without coming back to you.

## Workflow

1. **Read the shot list you already have.** A storyboard, a script breakdown, a numbered list of cuts in the conversation — that is the input. Do not ask for one if it exists; extract it. If it truly does not exist, ask for the beats in one message, then proceed.
2. **Write the scene JSON** following `references/scene-schema.md` (read it once; it is short). Work in this order, because each step constrains the next:
   - **World & set** — floor plane, then the big volumes (walls, shelves, counters) as boxes with labels. Real dimensions: a supermarket gondola shelf is about 0.9 m deep and 1.8 m tall, a checkout counter 0.9 m high, an adult eye 1.6 m up. Place a small labelled box wherever a fixed camera physically sits.
   - **Actors** — the protagonist plus anyone who appears; a base position and heading each. Extras get a neutral grey.
   - **Cuts** — one entry per storyboard cut, in edit order, with `dur`, `camera`, per-cut overrides for whatever moves, and `notes` that carry the direction (what happens, what must *not* happen, what is composited later).
3. **Build the page**: `python <this skill>/scripts/build.py scene.json out.html`. It injects the JSON into `assets/previz-template.html`. Save the JSON next to the project (the page also embeds it, and the user can copy it back out of the editor).
4. **Publish it as an artifact** (or open the file) and walk the user through it cut by cut: ← → switches cuts, drag orbits, 真上 gives a floor plan. Say which cuts you are unsure about — a previz exists to be argued with.
5. **Iterate on the JSON, not the HTML.** When the user says "the figure should be further away" or "the camera is too high", change the numbers in the scene and rebuild. The template is shared across projects; project-specific tweaks belong in the scene.

## Conventions that keep scenes portable

- Meters, y up, heading 0° = +z, 90° = +x. Same in every project, so a POV cut copied from one scene behaves the same in another.
- Prop `pos.y` is the **bottom** of the object, so "on the floor" is `y: 0` and "on a 0.9 m counter" is `y: 0.9`. This avoids the off-by-half-height errors that come from center-anchored boxes.
- Per-cut overrides only for what changes. If the protagonist stands at the register in six cuts, put that in the base and override the two cuts where they are elsewhere.
- Name cuts the way the storyboard does (`C4`, `C7b`), not by index; people refer to them by name.

## From a previz frame to a generation prompt

Once a cut looks right, describe *the frame*, not the story, to an image or video model. Read these off the page:

- camera: POV or fixed, eye height, pitch ("looking down about 20°"), fov ("phone-camera field of view")
- what occupies which part of the frame: "counter fills the lower third; kiosk screen upper-right; aisle recedes to the top"
- distances that matter: "the figure is ~10 m away, small, at the far end of the aisle"
- what is absent: "no one within 5 m; the basket is out of frame on the right"

A model cannot see your previz, but it follows this kind of spatial description far better than adjectives — and the numbers are now decided, so retries change one thing at a time.

## Files

- `assets/previz-template.html` — the page (Three.js from cdnjs, no other dependencies). Placeholders `__SCENE_JSON__` and `__TITLE__`.
- `scripts/build.py` — injects a scene JSON into the template.
- `references/scene-schema.md` — every field, with the reasoning behind the conventions.
- `examples/okaikei.json` — a complete 10-cut scene (a self-checkout horror CM: POV cuts, two security-camera cuts, a title card). Copy it as a starting point; the set list and the per-cut override pattern are the parts worth keeping.
