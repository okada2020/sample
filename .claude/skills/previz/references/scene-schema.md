# Scene JSON schema

One JSON object drives the whole previz page. Units are **meters**, the y axis points **up**, and a heading is in **degrees where 0° faces +z and 90° faces +x** (turning clockwise when seen from above). Keep that convention in every scene so a cut written for one project reads the same in the next.

```json
{
  "title": "お会計 プリビズ",        // page title (2–4 words + the project name)
  "aspect": "9:16",                  // frame aspect; "16:9" for landscape
  "notes": "...",                    // free text about the world (optional)
  "props":  [ ... ],                 // static set: floor, shelves, counters, cameras
  "actors": [ ... ],                 // characters: sphere head + stick body
  "cuts":   [ ... ]                  // the shot list, in edit order
}
```

## props

| field | box | cylinder | plane | label |
|---|---|---|---|---|
| `id` | required | required | required | required |
| `type` | `"box"` | `"cylinder"` | `"plane"` | `"label"` |
| `pos` | `[x, y, z]` — **y is the floor offset of the bottom face**, not the center | same | center of the plane | anchor point of the text |
| `size` | `[w, h, d]` | — | `[w, d]` | — |
| `radius`, `height` | — | required | — | — |
| `rot` | yaw in degrees | yaw | — | — |
| `color` | hex | hex | hex | text color |
| `opacity` | 0–1, for glass (doors, fridge fronts) | — | — | — |
| `label` | text floated above the prop | same | — | use `text` |
| `text`, `bg`, `scale` | — | — | — | the sign text, its background, size multiplier |
| `visible` | default `true`; a cut can override | | | |

A `plane` draws a floor with a 1 m grid, so scale reads at a glance. Put a `box` with a small size and a label like `CAM04` wherever a fixed camera sits — it makes the camera's physical position part of the set, which is what a real previz does.

## actors

```json
{ "id": "hero", "label": "主人公", "height": 1.72, "color": "#2f6fdb",
  "pos": [0, 0, -1], "heading": 0, "visible": true }
```

Every actor renders as a sphere head on a thin cylinder body, plus **two direction markers**: a yellow nose cone on the head and a flat arrow on the floor in the actor's color. Two markers because a single one is ambiguous from many angles — the nose disappears when seen from behind, the ground arrow disappears at eye level. `label` floats above the head. The actor whose eyes a POV camera uses is hidden in that cut so the head does not block the lens.

## cuts

```json
{ "id": "C5", "name": "見上げて、戻す", "dur": 4,
  "camera": { "type": "pov", "actor": "hero", "yaw": 0, "pitch": 2, "fov": 70 },
  "actors": { "figure": { "visible": true, "pos": [0, 0, 9], "heading": 0 } },
  "props":  { "sign": { "visible": false } },
  "notes": "C4の構図から1.5秒でティルトアップ…" }
```

- `dur` is seconds; the header sums them so the running time is always visible.
- `actors` / `props` are **per-cut overrides** keyed by id (`pos`, `heading`, `visible`). Anything not overridden falls back to the base definition, so the base is "where things usually are" and each cut states only what moves.
- `notes` is the direction: what happens, what must not happen, what gets composited later. Write it for the person who will generate or shoot the cut.

### camera types

| type | fields | use for |
|---|---|---|
| `pov` | `actor` (default `hero`), `yaw` (relative to the actor's heading), `pitch` (+ up), `fov`, `eyeHeight` (default height − 0.10) | first-person shots. yaw/pitch are the head turn, so a "look at the screen on the right" is `yaw: 28, pitch: -18` and "look down at the scanner" is `pitch: -38` |
| `free` | `pos`, `lookAt`, `fov`, `id` | fixed cameras: security cameras, tripods, drones. Match `pos` to a labelled camera prop |
| `card` | `lines` (array; first line is large) | title cards and text-only beats |

fov is the vertical field of view in degrees. 60–70° reads like a phone camera; 40–50° like a longer lens.
