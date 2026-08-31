# Higgsfield 動画 復旧台帳

Claude の会話をアーカイブしても、Higgsfield 側の生成物は消えていません。
2026-08-26 時点で Higgsfield のワークスペース（private / plan: ultimate）に残っていた
**動画ジョブ 69 件と音声ジョブ 94 件のすべて**を、プロンプト・原稿・設定・出力 URL 付きでここに書き出しました。

- 会話が消えても、この台帳があれば同じ動画をそのまま再ダウンロードできます
- 同じプロンプト・同じ設定で再生成もできます（モデル・尺・アスペクト比まで記録済み）
- MP4 の URL は CloudFront 直リンクです。必要なものは手元に保存しておくのが安全です

## 中身の要約

| 時期 | モデル | 本数 | 内容 |
|---|---|---|---|
| 2025-12-03〜12-15 | `sora2_video` | 21 | 「世界の珍味ランキング」ナレーション動画（第5位 血のパン / 第4位 タランチュラ / 第3位 亀ゼリー）＋ アクション映像 |
| 2026-07-12 | `kling3_0` | 2 | 鏡張りの部屋（日本語プロンプト） |
| 2026-08-22 06:09〜10:57 | `gemini_omni` | 21 | 鉛筆スケッチ風スタイル |
| 2026-08-22 13:23〜22:48 | `seedance_2_0_mini` | 24 | 2秒×5カットのハードカット構成（鉛筆スケッチ風・縦 9:16・10秒） |
| 2026-08-25 22:20 | `kling3_0` | 1 | 日本語オフィスドラマ（縦 9:16・5秒・音声あり） |

MP4 の URL はすべて
`https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/` 配下です。

---

## 2026-07 〜 2026-08 の生成（新しい順）

### 1. 2026-08-25 22:20 UTC — `kling3_0`

- job_id: `0789fd16-a69a-4901-8b01-b1ebd69700bd`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260825_222040_0789fd16-a69a-4901-8b01-b1ebd69700bd.mp4
- 設定: 9:16 / 5秒

<details><summary>プロンプト</summary>

```
Photorealistic Japanese office drama, vertical 9:16, cinematic handheld camera, one continuous scene in a tense boardroom. A smug woman in her 30s in a beige suit is presenting at the front. A gray-haired male executive seated at the table interrupts her, speaking coldly in Japanese: 「その企画は、昨日彼女から直接聞いたよ」. The presenting woman freezes mid-gesture, her face turning pale with shock. Realistic Japanese speech audio, tense dramatic atmosphere, quiet office ambience, no background music.
```

</details>

### 2. 2026-08-22 22:48 UTC — `seedance_2_0_mini`

- job_id: `ff3faa70-709c-43df-b5eb-9082d3a35255`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224859_ff3faa70-709c-43df-b5eb-9082d3a35255.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low side angle: the honey surface film, slow thick ripples crossing it.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: minute bubbles forming and fizzing along that film.
HARD CUT
SHOT 3 4.0-6.0s MEDIUM overhead top-down: the jar mouth from above, dense and still.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: shelf and jar together, lamplight snapping through the glass.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: another speck touching down and instantly puckering.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 3. 2026-08-22 22:48 UTC — `seedance_2_0_mini`

- job_id: `899dca41-dbc5-4ddf-99bd-473d31ad999c`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224809_899dca41-dbc5-4ddf-99bd-473d31ad999c.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: the wax comb, cells capped over in tidy rows.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: crystals blooming inside one cell like frost flowers.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the whole hive frame in soft daylight.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: a cell capping itself over with a firm press.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: a fresh speck drifting down toward the comb.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 4. 2026-08-22 22:48 UTC — `seedance_2_0_mini`

- job_id: `89bf0e16-005e-413d-8fc1-e36a4c2f792b`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224809_89bf0e16-005e-413d-8fc1-e36a4c2f792b.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: a plump round speck touching the glossy honey surface and wrinkling at once.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the pantry shelf, the honey jar standing at its centre.
HARD CUT
SHOT 3 4.0-6.0s CU low angle: the speck puckering, its round shell caving inward.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM overhead top-down: the wooden dipper stamping down into the jar.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the speck now a dried husk, sinking slowly under.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 5. 2026-08-22 22:44 UTC — `seedance_2_0_mini`

- job_id: `6ab6e839-b4e6-42b8-92c0-e33cde7e7695`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224432_6ab6e839-b4e6-42b8-92c0-e33cde7e7695.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low angle: fan blades slowing, halting, then turning the other way.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the living room, a hazed layer of warmth thick under the ceiling.
HARD CUT
SHOT 3 4.0-6.0s ECU macro: the little toggle switch on the housing flicking across.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM lateral: a curtain of warmth rolling down the wall and landing at the floor line.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the layer overhead visibly thinning.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 6. 2026-08-22 22:44 UTC — `seedance_2_0_mini`

- job_id: `2bd6e575-1442-4e00-9466-83ef241137fe`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224432_2bd6e575-1442-4e00-9466-83ef241137fe.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: a blade tip carving slow clockwise circles.
HARD CUT
SHOT 2 2.0-4.0s MEDIUM overhead top-down: the whole fan from above, air lines spiralling out to the walls.
HARD CUT
SHOT 3 4.0-6.0s CU low side angle: the switch in profile, seated firm in its winter position.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the room from the floor, warmth pouring down every wall at once.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: the ceiling gap where the layer used to sit, now clear.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 7. 2026-08-22 22:44 UTC — `seedance_2_0_mini`

- job_id: `0663dce1-bbaa-4e1c-8e48-01f553391d91`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224432_0663dce1-bbaa-4e1c-8e48-01f553391d91.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: frost on the window pane, the room side hazed with settled warmth.
HARD CUT
SHOT 2 2.0-4.0s CU low angle: an armchair corner, warmth curling gently around it.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the room evenly hazed from floor to ceiling.
HARD CUT
SHOT 4 6.0-8.0s ECU macro: the toggle switch flicking back the other way with a click.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: the blades easing round anew in the opposite turn.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 8. 2026-08-22 22:44 UTC — `seedance_2_0_mini`

- job_id: `81999985-9ce8-4e74-9a82-085572968b1c`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224400_81999985-9ce8-4e74-9a82-085572968b1c.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: the bottle on the counter, a small sachet standing beside it.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: the sachet granules drinking the haze, the air clearing around them.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the counter in daylight, sachet inside the bottle, cotton in the bin.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: the lid clicking down with a snap.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: a new bottle sliding into frame, a wad peeking from its neck.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 9. 2026-08-22 22:43 UTC — `seedance_2_0_mini`

- job_id: `5529d426-f973-48ce-b892-6b2e3763518b`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224359_5529d426-f973-48ce-b892-6b2e3763518b.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: damp air curling down into the open neck of the bottle.
HARD CUT
SHOT 2 2.0-4.0s MEDIUM overhead top-down: the wad inside, fibres drawing the damp in and plumping.
HARD CUT
SHOT 3 4.0-6.0s CU low side angle: the swollen wad pressed flat against a tablet.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the whole interior hazing over as the lid slams shut above.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: a tablet's edge softening and crumbling faintly.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 10. 2026-08-22 22:43 UTC — `seedance_2_0_mini`

- job_id: `cfbe81f1-0798-4dee-af97-836f2770a50f`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_224359_cfbe81f1-0798-4dee-af97-836f2770a50f.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU high angle looking down: a cotton wad tugged out of a pill bottle neck, stretching as it comes.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the cabinet shelf, amber bottles ranked in rows.
HARD CUT
SHOT 3 4.0-6.0s ECU macro: the cotton fibres up close, loose and airy.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM lateral: a tablet resting on the wad like luggage on padding.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the wad dropping toward the rim of a bin.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 11. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `9bec0519-5ce9-41cf-b82a-dd6162ef26bc`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223933_9bec0519-5ce9-41cf-b82a-dd6162ef26bc.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: steam wisps above a meal tray thinning and breaking apart mid-air.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the cabin row, tray table down, the meal centred on it.
HARD CUT
SHOT 3 4.0-6.0s CU low angle: a fork lifting, barely any wisp rising with it.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM lateral: the cabin window, dry air streaming past outside.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the last wisp fading to nothing above the food.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 12. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `11b81214-b809-40ae-a649-73baf3cd439b`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223933_11b81214-b809-40ae-a649-73baf3cd439b.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low side angle: the conveyor, bottles marching past with caps upright and attached.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: a hinge riding through a roller and holding fast.
HARD CUT
SHOT 3 4.0-6.0s MEDIUM overhead top-down: the belt from above, not one loose cap between the bottles.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the baler slamming a block of bottles tight, caps and all.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: one bottle turning on the belt, its cap swinging gently on the strap.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 13. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `127a82da-8b7b-46da-8335-e6bbaaa08aa5`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223932_127a82da-8b7b-46da-8335-e6bbaaa08aa5.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: a bottle cap twisting open and swinging on its hinge, tugged but holding fast.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the kitchen table, the bottle standing at its centre.
HARD CUT
SHOT 3 4.0-6.0s CU low angle: the thin strap flexing, the cap dangling stubborn from it.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM overhead top-down: a pile of loose caps stamped down beside the bottle.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the hinged cap snapping back against the neck.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 14. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `5805a391-9937-4638-b1ee-39783ac4d28d`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223932_5805a391-9937-4638-b1ee-39783ac4d28d.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low side angle: the galley cart, trays stacked in its slots, the air shimmering dry.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: a moisture bead evaporating off a tray lid in seconds.
HARD CUT
SHOT 3 4.0-6.0s MEDIUM overhead top-down: rows of trays, wisps absent over every one.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the galley walls humming with engine drone.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: a sweet roll sitting mute, not a single wisp above it.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 15. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `f7be40ed-3847-456e-a4f0-eddc63d2a46a`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223932_f7be40ed-3847-456e-a4f0-eddc63d2a46a.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: a fresh tray landing on the table, tomato and mushroom and ginger on it.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: bold spice wisps curling up thick and holding their shape.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the row of trays along the cabin, wisps standing over each.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: the tray stamped down on the table, wisps bouncing with it.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: steam rising steady over the meal as the cabin hums.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 16. 2026-08-22 22:39 UTC — `seedance_2_0_mini`

- job_id: `b7bfb008-a764-42da-ac48-5f98b650e2bf`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223932_b7bfb008-a764-42da-ac48-5f98b650e2bf.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: the beach strand at low tide, caps dotting the wrack line.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: one cap half-buried in sand, a wave nudging it deeper.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the shore curving away, litter glinting along its length.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: a wave dumping a fresh clatter of caps onto the sand.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: a single cap sliding back out with the foam.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 17. 2026-08-22 14:37 UTC — `seedance_2_0_mini`

- job_id: `95c52f54-c369-495b-b1b6-51c7286352ff`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143720_95c52f54-c369-495b-b1b6-51c7286352ff.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM overhead top-down: the packed lane, a dense knot of cars sliding rearward against the traffic.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: one gap slamming shut, bumper against bumper.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the whole stretch, the knot crawling back while its front melts free.
HARD CUT
SHOT 4 6.0-8.0s CU low side angle: a car bursting clear of the knot and pulling away.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: the tail of the knot swallowing another row of tail lamps.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 18. 2026-08-22 14:37 UTC — `seedance_2_0_mini`

- job_id: `65e1193a-58fa-47fe-b8e8-ed1db0516eb4`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143720_65e1193a-58fa-47fe-b8e8-ed1db0516eb4.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: the headrest post head shown in cross-section against the pane, rounded and soft-edged.
HARD CUT
SHOT 2 2.0-4.0s MEDIUM overhead top-down: the seat top, posts sliding up out of their sleeves.
HARD CUT
SHOT 3 4.0-6.0s CU low side angle: the tip pressed to the pane, force rippling wide across the glass.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the cabin dimming as water rises past the sill.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: the water line lapping the window's lower edge.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 19. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `1eae29c2-e2a8-48e6-ac85-f5edf2dbc3ce`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_1eae29c2-e2a8-48e6-ac85-f5edf2dbc3ce.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low angle: the door pocket, a pointed spring punch tool lifting free of it.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: the spring tip touching the pane's corner, the glass crazing instantly into a web.
HARD CUT
SHOT 3 4.0-6.0s WIDE lateral: the whole pane collapsing away into crumbs.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM overhead top-down: the tool set back into its pocket, ready.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the water line sinking away down the door panel.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 20. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `f8d70e58-0edc-4dfc-9d79-e8e1454d9b3b`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_f8d70e58-0edc-4dfc-9d79-e8e1454d9b3b.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU high angle looking down: headrest posts striking the side window and skipping off it.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the car cabin, a water line creeping over the door sill.
HARD CUT
SHOT 3 4.0-6.0s ECU macro: the blunt post tip flat against the glass, finding no bite.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM lateral: swing after swing, the pane flexing and holding.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the water line climbing the door panel.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 21. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `0f10a9d1-8500-4b52-ae2c-4ef682764162`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_0f10a9d1-8500-4b52-ae2c-4ef682764162.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s CU low side angle: the refrigerated case, cartons stacked, cold mist breathing out of it.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: the bare shell up close, pores open like pinpricks.
HARD CUT
SHOT 3 4.0-6.0s MEDIUM lateral: a dark speck creeping to a pore and sliding in unopposed.
HARD CUT
SHOT 4 6.0-8.0s WIDE low angle: the whole case humming, its lamp snapping on.
HARD CUT
SHOT 5 8.0-10.0s ECU slow push-in: condensation beading down the naked shell.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 22. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `be6e25ad-da2e-4d57-88ce-9eb1ee5b060c`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_be6e25ad-da2e-4d57-88ce-9eb1ee5b060c.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s MEDIUM lateral: a warm pantry shelf, eggs heaped in an open bowl.
HARD CUT
SHOT 2 2.0-4.0s ECU macro: the veiled shell, a dark speck skidding off the film.
HARD CUT
SHOT 3 4.0-6.0s WIDE high angle: the kitchen in daylight, no refrigerator anywhere in sight.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: veiled and bare eggs set side by side once more, stamping down.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: the bowl settling, one egg turning, its film catching the light.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 23. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `037116ff-6929-42c3-8a6c-e74208023386`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_037116ff-6929-42c3-8a6c-e74208023386.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: an egg turning slowly, a faint film shimmering across its shell.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the egg washing line, brushes spinning and jets hissing.
HARD CUT
SHOT 3 4.0-6.0s CU low angle: the jets hitting the shell, the shimmer streaming away off it.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM overhead top-down: two eggs side by side, one glistening bare, one softly veiled.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: the bare egg rolling on down the line.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 24. 2026-08-22 14:33 UTC — `seedance_2_0_mini`

- job_id: `7e7fcd0c-55bf-4bbf-9582-2f0f21373ea5`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143307_7e7fcd0c-55bf-4bbf-9582-2f0f21373ea5.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s WIDE high angle: a circular test track, cars spaced evenly around the ring, rolling smooth.
HARD CUT
SHOT 2 2.0-4.0s MEDIUM lateral: the spacing wobbling, a cluster gathering at one bend.
HARD CUT
SHOT 3 4.0-6.0s ECU macro: a tail lamp flaring inside the cluster, radiating lines snapping out again.
HARD CUT
SHOT 4 6.0-8.0s CU low angle: the stopped knot creeping backward round the ring while wheels ahead roll on.
HARD CUT
SHOT 5 8.0-10.0s MEDIUM slow drift: the ring settling into rhythm, one fresh lamp flaring at the knot's tail.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 25. 2026-08-22 14:24 UTC — `seedance_2_0_mini`

- job_id: `01b664f4-4d8e-44e6-aa1c-cd076b2e719e`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_142418_01b664f4-4d8e-44e6-aa1c-cd076b2e719e.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Five hard-cut shots, each exactly two seconds, no camera drift within a shot.
SHOT 1 0.0-2.0s ECU macro: a car tail lamp flaring bright, short radiating lines snapping outward from the lens.
HARD CUT
SHOT 2 2.0-4.0s WIDE eye-level: the highway lanes stretching ahead, traffic evenly spaced and flowing.
HARD CUT
SHOT 3 4.0-6.0s CU low angle: the following car dipping its nose as it brakes harder still.
HARD CUT
SHOT 4 6.0-8.0s MEDIUM lateral: three cars bunching together, the gaps between them collapsing in turn.
HARD CUT
SHOT 5 8.0-10.0s CU slow drift: tail lamps lighting one after another away down the lane.
No people speak, no text or captions on screen, diegetic ambience only.
Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker.
```

</details>

### 26. 2026-08-22 10:57 UTC — `gemini_omni`

- job_id: `41a945c3-088e-48c5-9b08-9d8cb9d00070`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105715_41a945c3-088e-48c5-9b08-9d8cb9d00070.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (the inside of an elevator car, brushed metal walls, a column of round buttons in the side wall). @Image2 = PROP (a small hourglass with sand running through it). @Image3 = PROP (a round metal push button in a square plate, two plain triangles facing each other on its face).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the brushed metal car, the handrail running round it, a slow glint travelling along the column of buttons.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the button column fills the wall, then the lowest button presses in and springs straight back out.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the hourglass standing beside the panel, its upper chamber still full and the sand barely beginning to run.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the round door button tips into frame and stamps flat onto the car floor with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the panel and the hourglass side by side, the doors ahead not moving at all, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low elevator hum, a dry plastic click as the button presses and springs back, a fine sand hiss, one hard metal clack on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 27. 2026-08-22 10:57 UTC — `gemini_omni`

- job_id: `420b3d6c-3444-4514-b3f4-e4a5156ac108`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105715_420b3d6c-3444-4514-b3f4-e4a5156ac108.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (an office lobby outside a pair of closed elevator doors, tiled floor, a potted plant to one side). @Image2 = PROP (a small hourglass with sand running through it). @Image3 = PROP (a round metal push button in a square plate, two plain triangles facing each other on its face).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the lobby floor and the potted plant, the pair of elevator doors filling the far wall.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the doors in close view, the hourglass standing beside them down to its final few grains.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: the last grain drops through the neck and settles at the bottom.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: the doors snap shut together in one hard beat the instant the sand runs out.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the lobby settling, the closed doors quiet where they had stood open, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a quiet lobby room tone, a thinning sand trickle, a single tick as the last grain lands, one hard mechanical clunk on the impact beat as the doors close - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 28. 2026-08-22 10:57 UTC — `gemini_omni`

- job_id: `7090127e-b472-4aac-b735-efa1ae9702c9`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105715_7090127e-b472-4aac-b735-efa1ae9702c9.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (a tight low side angle on an elevator button panel, a column of round buttons in shallow recesses). @Image2 = PROP (a small hourglass with sand running through it). @Image3 = PROP (a round metal push button in a square plate, two plain triangles facing each other on its face).
SHOT 1 - 0.0s to 2.0s - CU low side angle, static: the metal panel from the side, the door button pressed again and again with no result at all.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, slow push-in: the hourglass now drained to half, sand streaming steadily through its neck.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM overhead top-down, gentle drift: the panel face from above, the button sinking and rising under repeated presses.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: the whole car, the doors standing wide open and refusing to move, holding with a low insistent hum.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the last of the upper sand thinning out toward the neck, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low elevator hum, repeated dry plastic clicks with no response, a steady sand hiss, one flat thud on the impact beat as the doors refuse - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 29. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `33e7cba0-d36d-4b51-b1a7-4e0a46bce903`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_33e7cba0-d36d-4b51-b1a7-4e0a46bce903.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (the inside of an open refrigerator, wire shelves running across, an empty middle shelf at eye level). @Image2 = PROP (a rigid lattice of small identical blocks locked into an ordered grid). @Image3 = PROP (a single thick slice of bread standing upright with open crumb).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the open refrigerator, wire shelves running across, cold air pooling slowly at the base.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the slice set on the middle shelf, the grid across it slowing and then stalling in place.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: one block hovering at the edge of the grid, pressing in but unable to lock on.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: the shelf frosting over hard in one beat, the whole grid seizing exactly where it stands.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the refrigerator settling, the slice on its shelf held exactly as it was, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a steady compressor hum, a thin frost crackle spreading, a failed dry click as the block cannot seat, one hard icy snap on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 30. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `ad2f0c94-9ab8-403f-9a8c-34ac3fa3cc86`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_ad2f0c94-9ab8-403f-9a8c-34ac3fa3cc86.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (tight lateral view of the cut face of a loaf of bread, open crumb filling the frame). @Image2 = PROP (a rigid lattice of small identical blocks locked into an ordered grid). @Image3 = PROP (a single thick slice of bread standing upright with open crumb).
SHOT 1 - 0.0s to 2.0s - CU low side angle, static: the cut face of the loaf, the ordered grid now spread wide across the open crumb and still widening.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, slow push-in: fresh blocks snap onto the edge of the grid one after another, each locking tight.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM overhead top-down, gentle drift: the whole cut face, the grid tightening and the airy holes closing up across it.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: the loaf with cold air pouring over it, the grid hardening all at once with a sharp crack.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the crumb gone tight and rigid, the grid locked edge to edge, holding still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low cold hum, dry clicks as each block locks on, a tightening creak as the crumb closes, one sharp crack on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 31. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `e637dc87-d829-4b4d-a0a1-8140c416c4eb`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_e637dc87-d829-4b4d-a0a1-8140c416c4eb.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (old money changer's counter with a balance scale, an open ledger and a stack of coins at its centre). @Image2 = PROP (a small heap of thin curled metal shavings). @Image3 = PROP (a large coin shown edge on with fine grooves around its rim).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the money changer's counter, the balance scale and ledger, the stack of coins standing at its centre.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the stack in close view, one smooth coin plucked out of it and set apart from the grooved ones.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: the grooved rim and the smooth rim held side by side, the difference unmistakable between them.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: the last of the shavings swept off the counter edge and gone in one hard sweep.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the counter settling, only whole grooved coins left standing on it, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a quiet shop room tone, a light clink as the coin is plucked out, a dry rasp as the shavings are swept, one hard scrape on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 32. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `e7660d1a-6873-442b-9578-3a48dbd9fffd`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_e7660d1a-6873-442b-9578-3a48dbd9fffd.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (old coin mint workshop, timber workbench under a screw press, tray of coins at its centre). @Image2 = PROP (a small heap of thin curled metal shavings). @Image3 = PROP (a large coin shown edge on with fine grooves around its rim).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the timber workbench under the screw press, the tray of finished coins sitting still at its centre, then a slow glint travelling across them.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the tray fills the frame, then one coin lifts clear as thin slivers curl away from its rim one after another.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the bare smooth edge of the coin, a blade paring one more sliver off it and the sliver dropping away.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the grooved coin tips into frame and stamps flat onto the bench with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the smooth coin and the grooved coin resting side by side, slivers gathering beside only one, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low workshop room tone, a thin metallic scrape as each sliver peels, a soft tick as slivers land, one hard metal clank on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 33. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `afe3af4e-aa67-43b7-8d53-e961cba93364`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_afe3af4e-aa67-43b7-8d53-e961cba93364.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (overhead top-down view of a scarred timber mint workbench with a coin lying flat at its centre). @Image2 = PROP (a small heap of thin curled metal shavings). @Image3 = PROP (a large coin shown edge on with fine grooves around its rim).
SHOT 1 - 0.0s to 2.0s - CU overhead top-down, static: the scarred bench surface, the heap of shavings now grown large beside a single coin, a few more slivers dropping onto it.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, slow push-in: the coin visibly smaller than the heap beside it, its rim worn down to nothing.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM lateral, gentle drift: a cutting tool presses fine grooves around a fresh rim, one groove appearing after another all the way round.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: the whole bench, the heap on one side and the newly grooved coins on the other, snapping into hard contrast with a sharp beat.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the finished grooves catching light along the rim, sharp and evenly spaced, then holding still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low workshop room tone, soft ticks as slivers land on the heap, a rhythmic metallic bite as each groove is cut, one sharp snap on the contrast beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 34. 2026-08-22 10:56 UTC — `gemini_omni`

- job_id: `e1bcf362-ce40-44ef-89ca-18800fbf2884`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_105604_e1bcf362-ce40-44ef-89ca-18800fbf2884.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES: @Image1 = LOCATION (home kitchen worktop with a bread knife on a board and a whole loaf at its centre). @Image2 = PROP (a rigid lattice of small identical blocks locked into an ordered grid). @Image3 = PROP (a single thick slice of bread standing upright with open crumb).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the tiled worktop, the whole loaf sitting on its board beside the knife, a slow glint moving across the crust.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the loaf fills the frame, then a few loose blocks drift together just under its crust.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: two blocks meet and click into place inside the open crumb, then a third joins them.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the bread slice tips into frame and stamps flat onto the board with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the loaf and the cut slice resting side by side, blocks gathering in only one of them, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a quiet kitchen room tone, a small dry click as each block locks on, a soft crust rustle, one flat wooden slap on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 35. 2026-08-22 08:17 UTC — `gemini_omni`

- job_id: `cc37905c-5481-4e53-920d-24ab458f3426`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_081712_cc37905c-5481-4e53-920d-24ab458f3426.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (tight lateral angle on a door face with the stainless steel lever handle seen from a low side angle). @Image2 = PROP (a leaning tower built from small round shells stacked one on another). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - CU low side angle, static: the steel lever from the side, the stack of shells now grown tall and tipping further over it.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, slow push-in: the brass knob set alongside, then small bright darts flick out of the brass into the shells at the bottom of the stack.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM overhead top-down, gentle drift: the brass knob turns flat below, the tall stack swaying above it with nothing to steady it.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: two handles on facing doors, the stack looming over the steel one and the brass one standing clear, snapping into hard contrast.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the bottom shells opening up one after another, the whole stack tipping further, then holding still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low room tone, a dry creak as the stack leans, thin ticks as the darts land, brittle cracks from the bottom shells, one sharp snap on the contrast beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 36. 2026-08-22 08:16 UTC — `gemini_omni`

- job_id: `3ddd24cc-6de7-4915-97d7-afb1359de5b4`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_081619_3ddd24cc-6de7-4915-97d7-afb1359de5b4.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (old apartment building entrance hall with a heavy panelled door and a round brass knob at the far end). @Image2 = PROP (a leaning tower built from small round shells stacked one on another). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the old entrance hall, the heavy panelled door standing at the far end, its round knob catching a slow travelling highlight.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the worn brass knob in close view, the leaning tower of shells above it tipping over and coming down.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: the fallen shells breaking open into scattered pieces, bare polished brass grain showing underneath.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: a mirror-bright steel lever drops into the same doorframe and locks home with a hard clack.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the hall settling, the new steel handle sitting quiet where the brass had been, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a hollow stairwell room tone, a long creak then a clattering tumble as the tower comes down, dry brittle snaps as the pieces scatter, one hard metal clack on the impact beat as the lever locks home - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 37. 2026-08-22 08:14 UTC — `gemini_omni`

- job_id: `e1e66dc0-3fe8-4f4b-9366-de1274d37ff4`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_081442_e1e66dc0-3fe8-4f4b-9366-de1274d37ff4.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (long empty hospital corridor with a stainless steel lever handle on the door at the right). @Image2 = PROP (a leaning tower built from small round shells stacked one on another). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the long empty corridor sits still, then the steel lever handle catches a slow moving glint along its length.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the steel lever fills the door face, then three round shells stack one onto another on its underside.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the small tower of shells settles into the brushed steel grain, then another shell climbs on top of it.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the brass doorknob tips into frame and stamps flat onto the floor tile with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the steel lever and the brass knob resting side by side, the little tower standing only on the steel, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a distant corridor room tone, a faint metallic ring on the glint, a small dry click as each shell stacks on, one hard metal clank on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 38. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `4aaaac54-fe5f-46ec-a40b-d10ded73695f`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_4aaaac54-fe5f-46ec-a40b-d10ded73695f.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (old apartment building entrance hall with a heavy panelled door and a round brass knob at the far end). @Image2 = PROP (a creeping cluster of small round dark specks forming an irregular colony). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the old entrance hall, the heavy panelled door standing at the far end, its round knob catching a slow travelling highlight.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the worn brass knob in close view, the last of the dark colony lifting away and vanishing from its surface.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: bare polished brass grain with nothing living left on it, the surface breathing faintly under the light.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: a mirror-bright steel lever drops into the same doorframe and locks home with a hard clack.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the hall settling, the new steel handle sitting quiet where the brass had been, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a hollow stairwell room tone, a soft brushed sweep as the colony lifts away, one hard metal clack on the impact beat as the lever locks home - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 39. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `42034c48-95d0-430b-a622-6876a74c4a00`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_42034c48-95d0-430b-a622-6876a74c4a00.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (repair workbench under an angled desk lamp with a flat battery cell opened up and laid out at the centre). @Image2 = PROP (a coiled metal spring squeezed under compression, its loops pressed close together). @Image3 = PROP (a flat rectangular battery cell cut away to show its stacked internal sheets).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the workbench under its lamp, the opened battery cell laid out at the centre, tools pushed aside and settling.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: the cell in close view, the coiled spring inside easing back off its limit loop by loop.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, slow push-in: the spring releasing into a relaxed open coil, the stacked sheets flattening out again behind it.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: a second identical cell drops onto the bench beside the first and lands with a solid knock.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the bench settling, the two cells side by side, the relaxed open coil visible in both, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a quiet workshop room tone under a faint lamp buzz, a long metallic release as the spring opens, a soft paper-like flatten as the sheets settle, one solid wooden knock on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 40. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `988fb6b6-1327-41eb-88a8-4bb57e2e6a57`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_988fb6b6-1327-41eb-88a8-4bb57e2e6a57.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (dark bedside table at night with a smartphone lying face up and a charging cable running off the edge). @Image2 = PROP (a coiled metal spring squeezed under compression, its loops pressed close together). @Image3 = PROP (a flat rectangular battery cell cut away to show its stacked internal sheets).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the dark bedside table, the phone lying face up, then the cable settles and pulls straight off the table edge.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the phone glowing on the wood, a plain bar creeping steadily upward toward its top end.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the cut-away cell inside, the coiled spring within it drawing tighter loop by loop as the bar climbs.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the cable connector tips into frame and stamps home into the port with a hard click.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the phone settling flat on the table, the spring inside held tight and quivering, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a quiet night room tone, a soft cable slither, a low rising hum as the bar climbs, a fine metallic creak as the spring tightens, one hard plastic click on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 41. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `4522d60e-efee-4027-b5c0-faad6fe50f88`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_4522d60e-efee-4027-b5c0-faad6fe50f88.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (tight lateral angle on a hospital door face with the stainless steel lever handle seen from a low side angle). @Image2 = PROP (a creeping cluster of small round dark specks forming an irregular colony). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - CU low side angle, static: the steel lever from the side, the dark colony now crowding every part of its grain and still creeping.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, slow push-in: the brass knob pressed alongside, then tiny darts flick out of the brass and puncture the round shells one after another.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM overhead top-down, gentle drift: the brass knob rotates flat, then a clear ring opens outward around it where nothing survives.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: both handles on facing doors, the steel crowded and the brass bare, snapping into hard contrast with a sharp beat.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the colony on the brass thinning fast, then the bare metal shows through and holds, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a low room tone, a dry granular crawl as the colony creeps, thin needle ticks as the darts strike, one sharp snap on the contrast beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 42. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `64f9d102-81e1-4f1e-a8b2-e020042cd88b`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_64f9d102-81e1-4f1e-a8b2-e020042cd88b.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (long empty hospital corridor with a stainless steel lever handle on the door at the right). @Image2 = PROP (a creeping cluster of small round dark specks forming an irregular colony). @Image3 = PROP (a solid round brass doorknob with a circular backplate).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the long empty corridor sits still, then the steel lever handle catches a slow moving glint along its length.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the steel lever fills the door face, then a few dark specks settle onto its underside one after another.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the specks clinging into the brushed steel grain, then slowly spreading outward across it.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the brass doorknob tips into frame and stamps flat onto the floor tile with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the steel lever and the brass knob resting side by side, the specks crawling only across the steel, then settling still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a distant corridor room tone, a faint metallic ring on the glint, a dry granular rustle as the specks settle, one hard metal clank on the impact beat - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 43. 2026-08-22 06:44 UTC — `gemini_omni`

- job_id: `4441a9f2-a791-4d37-b22f-4f8a9e8902b5`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064453_4441a9f2-a791-4d37-b22f-4f8a9e8902b5.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (tight overhead top-down view of a bedside table top at night with the phone face up and its cable coiling across the wood). @Image2 = PROP (a coiled metal spring squeezed under compression, its loops pressed close together). @Image3 = PROP (a flat rectangular battery cell cut away to show its stacked internal sheets).
SHOT 1 - 0.0s to 2.0s - CU overhead top-down, gentle drift: the phone sitting untouched on the wood, the cable still plugged in, only the faintest glow pulsing.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro, static: the coiled spring squeezed to its absolute limit inside the cell, quivering hard under the load.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM lateral, slow push-in: the stacked internal sheets of the cell, the outer sheet slowly buckling along its edge.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: the room in darkness, the phone the only lit thing, then the cable snaps taut against the table edge with a hard beat.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the compressed spring shivering in place, the buckled sheet holding under strain, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a deep quiet night room tone, a fine metallic strain from the spring, a slow creaking flex as the sheet buckles, one hard snap on the impact beat as the cable pulls taut - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 44. 2026-08-22 06:09 UTC — `gemini_omni`

- job_id: `4bfae411-4985-448e-89f1-5ab7fa91420a`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_060936_4bfae411-4985-448e-89f1-5ab7fa91420a.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (tight lateral coverage angle on the curved cabin wall, oval passenger window from a low side angle). @Image2 = PROP (feathery bloom of ice crystals). @Image3 = PROP (oval aircraft window cut away showing three separated panes with one tiny hole through the middle pane).
SHOT 1 - 0.0s to 2.0s - CU low side angle, static: the oval window seen from the side, frost already spread across half the glass and still widening.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - ECU macro on the pane edge, static: air pulls through the tiny hole in one slow steady thread.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - MEDIUM overhead top-down, gentle drift: the cut-away prop rotates flat, then its three panes stack apart in a row one after another.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - WIDE low angle, static: the outer pane bows outward under load, then snaps taut with a hard thud.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - CU slow push-in: the outer pane holds firm, the inner pane rests, then frost creeps to its edge and settles, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a dry crackle of spreading frost, a thin airy hiss through the hole, a light wooden clack as each pane stacks apart, one hard thud on the impact beat, under a low cabin room tone - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 45. 2026-08-22 06:09 UTC — `gemini_omni`

- job_id: `5411a740-b30a-4a05-b067-2e035f0628fa`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_060936_5411a740-b30a-4a05-b067-2e035f0628fa.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching scene, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (aircraft exterior at cruise altitude, fuselage flank with a row of small oval windows above a flat cloud deck). @Image2 = PROP (feathery bloom of ice crystals). @Image3 = PROP (oval aircraft window cut away showing three separated panes with one tiny hole through the middle pane).
SHOT 1 - 0.0s to 2.0s - WIDE high angle, gentle drift: the fuselage flank runs against the flat cloud deck, the row of small oval windows sliding steadily past.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM lateral, static: one single window in that row, still clouded over with grey frost.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: a bead of moisture is drawn into the tiny hole and vanishes.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU low angle, static: the frost bloom retreats from the centre outward, its edges snapping away in one sharp beat.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - WIDE slow drift out: the window now completely clear, the fuselage settling steadily against the cloud deck, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a steady low airflow rush outside the hull, a faint crystalline tick on the frost, a thin suck of air at the hole, one sharp snap on the impact beat as the frost lets go, under a distant engine drone - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 46. 2026-08-22 06:09 UTC — `gemini_omni`

- job_id: `b2fc2ef9-6a84-4e0c-8a84-ce9403ec2d65`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_060935_b2fc2ef9-6a84-4e0c-8a84-ce9403ec2d65.mp4
- 設定: 9:16 / 10秒 / 参照画像 3枚

<details><summary>プロンプト</summary>

```
Style: Hand-drawn graphite sketch on warm off-white paper, built from thin uneven pencil contour lines with visible wobble and open corners, shaded only by light diagonal hatching and soft smudged greys that leave the paper showing through; the palette is strictly monochrome - warm paper ground, charcoal linework, three or four steps of grey wash - with a single faint pencil-drawn shadow anchoring each object, plain empty paper background with no color, figures kept simple and rounded with dot eyes and clear silhouettes, motion reading as loose simple limited animation on twos with a gentle sketchbook flicker; simple limited animation on twos - the visual style is EXACTLY as in the reference images, same rendering, same surface treatment.
PALETTE LOCK: use ONLY the colors and the background treatment of the reference images (warm off-white paper ground, charcoal pencil linework, grey wash, no color). Do NOT introduce any new or foreign colors, no colored/gradient/painted backgrounds that aren't in the references, no recoloring of objects.
A single 10-second scene of FIVE hard-cut shots. Do NOT open the video on any reference image or show a sheet/swatch - stage everything fresh, matching room, colors and background to their references. Motion starts on frame 1 (no opening freeze).
REFERENCES (look, identity, palette): @Image1 = LOCATION (aircraft cabin window seat row, oval passenger window in the curved wall). @Image2 = PROP (feathery bloom of ice crystals). @Image3 = PROP (oval aircraft window cut away showing three separated panes with one tiny hole through the middle pane).
SHOT 1 - 0.0s to 2.0s - WIDE eye-level, static: the empty window seat row sits still, then the window shade slides upward and locks at the top.
HARD CUT.
SHOT 2 - 2.0s to 4.0s - MEDIUM low angle, slow push-in: the oval window fills the curved wall, then one frost star buds into its lower corner and creeps outward.
HARD CUT.
SHOT 3 - 4.0s to 6.0s - ECU macro, static: the pierced middle pane, then a single thread of vapour is drawn sideways through the tiny hole.
HARD CUT.
SHOT 4 - 6.0s to 8.0s - CU high angle looking down, static: the cut-away window prop tips into frame and stamps flat onto the tray table with a hard impact.
HARD CUT.
SHOT 5 - 8.0s to 10.0s - MEDIUM lateral drift: the three panes separate one after another, then the pierced middle pane settles last and holds, still and micro-moving.
Five hard-cut shots at 2.0s, 4.0s, 6.0s and 8.0s, no dissolves, no fades. simple limited animation on twos, continuous motion within each shot, never freezes.
AUDIO: a soft shade click on the slide, a faint crystalline tick as the frost buds, a thin airy hiss through the hole, one hard wooden stamp on the impact beat, under a low cabin room tone - no voice, no narration, no music.
NEGATIVE: opening on a reference image, a sheet/swatch or a static first frame, leading freeze, dissolves or fades, NEW or foreign colors, colored/gradient/painted background not in the references, recolored objects, style drift, extra people, characters, cloned characters, characters talking, lip-sync, on-screen text, captions, photorealism, 3D render, watermark.
```

</details>

### 47. 2026-07-12 03:12 UTC — `kling3_0`

- job_id: `4b59e8ab-62ff-47c2-9e0a-e94c9fd08176`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260712_031223_4b59e8ab-62ff-47c2-9e0a-e94c9fd08176.mp4
- 設定: 16:9 / 5秒

<details><summary>プロンプト</summary>

```
鏡ばりの部屋でミニスカートのおねいさんが歩く
ゆかも鏡
```

</details>

### 48. 2026-07-12 03:09 UTC — `kling3_0`

- job_id: `284ad4d5-b14f-4178-8d37-e689e3edcba8`
- 出力: https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260712_030911_284ad4d5-b14f-4178-8d37-e689e3edcba8.mp4
- 設定: 16:9 / 5秒

<details><summary>プロンプト</summary>

```
鏡ばりの部屋でミニスカートのおねいさんが歩く

```

</details>


---

## 2025-12 の生成（「世界の珍味ランキング」シリーズ）

モデルはすべて `sora2_video`（sora-2 / 720p）。同じ原稿で尺とアスペクト比を変えた試作が並んでいます。

### ナレーション原稿

**第5位：フィンランド “血のパン”**（映像：黒っぽいライ麦パンの写真）

```
「第5位は、フィンランドの“血のパン”。
これは、ライ麦粉に トナカイの血 を混ぜて焼き上げた伝統食です。
古くは貴重な栄養源として食べられ、今でもスーパーで買えるほど一般的。
見た目はずっしりですが、味は意外とあっさりしているそうです。」
```

**第4位：カンボジア “タランチュラのから揚げ”**（映像：油で揚げられたクモの写真）

```
「第4位は、カンボジアの“タランチュラのから揚げ”。
かつて食糧難の時代に生まれ、今では屋台の名物料理。
外はカリッ、中はホクホク…意外とエビのような味と言われています。
観光客にも人気ですが、見た目のインパクトはダントツ！」
```

**第3位：香港 “亀ゼリー”**（映像：黒いゼリーのデザート）

```
「第3位は、香港の“亀ゼリー”。
甲羅などを煮詰めて作ったとされ、昔から“健康に良い”と親しまれてきたデザートです。
見た目は真っ黒で苦そうですが、実際はハーブの風味が強い薬膳スイーツ。
香港の街角で普通に買える、ローカルな珍味です。」
```

### 出力一覧

| 日時 (UTC) | 内容 | 比率 | 尺 | job_id | MP4 |
|---|---|---|---|---|---|
| 2025-12-15 12:13 | 第3位 亀ゼリー | 9:16 | 12秒 | `a861cc81-ba8e-470e-915c-6a008e19835a` | `ca0daf72-5708-4d10-add9-e6ab9b01d218.mp4` |
| 2025-12-15 12:12 | 第3位 亀ゼリー | 9:16 | 12秒 | `037f77e4-a0ca-43a1-8c83-0e23f59710b7` | `229406f7-d730-49af-bdcf-eaca55d7fa31.mp4` |
| 2025-12-15 12:11 | 第3位 亀ゼリー | 16:9 | 12秒 | `23386e36-75cb-4b46-afd2-5f7fbca1fdeb` | `adae655f-6375-46e9-908d-df3c3caea2fa.mp4` |
| 2025-12-15 12:11 | 第5位 血のパン | 16:9 | 12秒 | `fe223b16-b7be-48ca-ae28-027279052953` | `2993d743-3e7b-40cd-92fb-2fd0a771c372.mp4` |
| 2025-12-15 12:09 | 第3位 亀ゼリー | 16:9 | 12秒 | `d6f83d20-77f3-4714-b6b0-2a6d6d05a3d9` | `6060f99f-4aec-486b-8429-a11d03968caf.mp4` |
| 2025-12-15 12:09 | 第5位 血のパン | 16:9 | 12秒 | `c3814441-e137-444b-98ac-cb0366a1d32d` | `cd0c6441-70aa-401d-98c5-10b7534bbb89.mp4` |
| 2025-12-15 12:08 | 第5位 血のパン | 16:9 | 12秒 | `d2c654fd-d71b-4622-ac9d-759621ec1ddc` | `6908a421-4a5d-4143-8d70-95b3137b6854.mp4` |
| 2025-12-15 12:06 | 第5位 血のパン | 16:9 | 12秒 | `a8a78fac-5f5b-4e28-9aad-cd18ebb46a91` | `f11c54ae-d106-4ece-a51f-5ed28dcbb9b4.mp4` |
| 2025-12-15 11:53 | 第4位 タランチュラ | 9:16 | 12秒 | `a75a9490-b060-4bb3-976f-aff0bec4add9` | `6701d561-be4e-4236-98db-caefdaf9c7c7.mp4` |
| 2025-12-15 11:51 | 第4位 タランチュラ | 16:9 | 12秒 | `128f1c0e-b824-4dd9-a24a-7da047570b12` | `00b58caf-91bf-4f46-b11c-3234b8c921f2.mp4` |
| 2025-12-15 11:51 | 第4位 タランチュラ | 16:9 | 4秒 | `410d5966-7b44-487a-afc6-516993bcd9aa` | `8d4f1443-5d39-46c1-b5e3-6ded83144bb1.mp4` |
| 2025-12-15 11:50 | 第4位 タランチュラ | 16:9 | 4秒 | `72410e7b-dba4-401b-b372-71507cbf205a` | `86e52d10-2e0e-4fc4-a8a0-014fc99d4059.mp4` |
| 2025-12-15 11:46 | 第5位 血のパン | 16:9 | 4秒 | `1acefaa7-793e-40bf-a3a1-28c8c2ec287a` | `4d9fe014-b2b8-4222-84c1-9f7f6201fb1e.mp4` |
| 2025-12-15 11:46 | 第5位 血のパン | 16:9 | 4秒 | `b95c3ef2-9476-4abc-a6e5-11f9195b129a` | `261d01d4-9608-427c-88c7-0b69fdbeb769.mp4` |
| 2025-12-15 11:44 | 第5位 血のパン | 16:9 | 12秒 | `f18cf339-975e-4dc4-a072-e9bab807b426` | `72f88d99-591a-4c27-ba07-a888c1505956.mp4` |
| 2025-12-15 11:43 | 第5位 血のパン | 16:9 | 12秒 | `15fa6df7-44fd-4e46-a14f-cc0c8569d3f5` | `d97e5b94-7aee-426d-a858-9faca9392c2d.mp4` |
| 2025-12-15 11:43 | 第5位 血のパン | 16:9 | 12秒 | `bed43837-2085-4ddb-bcdc-6d182886f7c7` | `727680d7-da73-4773-b58c-759d13500f92.mp4` |
| 2025-12-15 11:42 | 第5位 血のパン | 16:9 | 12秒 | `477eef62-05f6-472d-8fa4-e75979d1339c` | `4ed251b6-d21a-4e29-8195-7772f5c893b1.mp4` |
| 2025-12-15 11:14 | アクション映像 | 16:9 | 12秒 | `bf306e00-6166-456b-a860-f39c5d148de3` | `38308ab1-41f8-4afa-950d-8dccd36ebd7f.mp4` |
| 2025-12-15 11:14 | アクション映像 | 16:9 | 12秒 | `b676767a-49b7-4735-b710-717782078f3d` | `6e90cceb-a6bb-462f-8168-f2828d11b477.mp4` |
| 2025-12-03 11:35 | アクション映像 | 16:9 | 12秒 | `18f2dc5c-e7a1-415a-bb31-dad8e586e2ca` | `217a8f8a-3a5c-4f88-b7c3-3d55a1ed4ce5.mp4` |

「アクション映像」のプロンプト（英語・共通）:

```
A woman in a sleek black leather coat leans back, her expression focused and fierce, as she narrowly
avoids a barrage of bullets suspended in mid-air around her. Her long hair flows dramatically backward,
seemingly frozen in the chaos of the moment. Smoothly rotating around her, the camera captures the golden
bullets hovering, glinting in the soft, muted light from the towering glass buildings behind her. Rain
cascades gently in the background, creating reflections on the slick pavement that amplify the tension of
the scene. The air is charged with energy, a moment teetering between danger and grace, as time stands
still in this breathtaking instant of survival. The emotional weight of fear and determination hangs heavy
in the atmosphere, making this surreal tableau all the more striking.
```

---

## 再生成したいとき

台帳の `model` / プロンプト / 比率 / 尺 をそのまま指定すれば、同じ設計で作り直せます。
参照画像を使っていたジョブ（`seedance_2_0_mini` の 24 本）は、参照画像の URL も
Higgsfield 側に残っているので、同じ画像を読み込ませれば近い絵が再現できます。

## 覚えておくこと

- Claude の会話をアーカイブしても Higgsfield の生成物は消えない
- 逆に、Higgsfield 側から消すと復元できないので、消す前にこの台帳を更新する
- TikTok 連携アカウントは現在ゼロ件（`tiktok_accounts` が空）。投稿先の再連携が必要な場合はそこから

---

# 豆知識シリーズ 復旧台帳

Higgsfield の音声ジョブとして **ナレーション原稿 94 本**が丸ごと残っていました。
会話をアーカイブしても原稿は消えていません。以下がその全内容です。

原稿は「フック（意外な事実）→ 種明かし（仕組み）→ 実用オチ」の 3 行構成で、
1 本あたり約 8〜9 秒。音声は ElevenLabs、ナレーターは **Helena**（中年女性・落ち着いた声）で統一。
初期の 8/22 午前分にはスタイル指示が原稿の頭に埋め込まれています。

```
[ wry conversational explainer, neutral accent, bright dry timbre,
  lively pace, starts speaking immediately] [00:00-00:09]
```

（皮肉まじりの語り口・ニュートラルなアクセント・明るく乾いた声質・軽快なテンポ・冒頭から即発話）

8/22 午後以降はこの指示が外れ、本文のみになっています。

## 題材一覧（17 テーマ）

| # | テーマ | フック | 種明かし |
|---|---|---|---|
| 1 | 飛行機の窓の穴 | 窓には必ず穴が空いている。傷でも欠陥でもない | 3 枚構造の外側 1 枚に気圧を負担させる。湿気も逃がすので凍らない |
| 2 | スマホの充電 | 毎晩スマホを痛めつけている | 満充電での放置がカソードを傷める。80% で止め 20% を切らなければ寿命は 2〜3 倍 |
| 3 | 真鍮のドアノブ | 病院はドアノブの選択を間違えた | ステンレスは細菌が数週間生存。真鍮は銅イオンが細胞壁を貫き 2 時間で 99% 死滅 |
| 4 | 硬貨のギザギザ | 硬貨の縁に溝がある理由 | 銀貨の縁を削る詐欺への対策。1696 年、ニュートンが造幣局長として導入 |
| 5 | エレベーターの閉ボタン | あれはプラセボではない | バリアフリー法が最低保持時間を定めている。その間だけ入力が無視される |
| 6 | パンと冷蔵庫 | 冷蔵庫はパンの劣化を早めている | 乾燥ではなくデンプンの再結晶化。0℃ 強がその最速域 |
| 7 | 幽霊渋滞 | 原因のない渋滞 | 一人のブレーキが後方へ増幅。円形コースに 22 台、障害物ゼロでも波が発生 |
| 8 | 車の脱出とヘッドレスト | ヘッドレストで窓は割れない | 消防士の実験で 8 回振ってようやく。ポンチを常備すれば一撃 |
| 9 | 卵の洗浄 | 米国の卵は欧州では違法、その逆も | 殻のクチクラ層を洗うか残すか。洗えば要冷蔵、残せば常温棚 |
| 10 | ペットボトルのキャップ | 外れないのは仕様 | EU 法。緩んだキャップは包装ごみの 15%、選別機を通り抜けていた |
| 11 | シーリングファンの冬モード | 隠しスイッチがある | 時計回り・弱で天井の暖気を壁沿いに降ろす。暖房費が約 10% 減 |
| 12 | 薬瓶の綿 | あの綿は捨てる | 割れやすい錠剤の緩衝材だった名残。今は湿気を抱えこむだけ。乾燥剤は残す |
| 13 | 機内食 | まずいのは料理のせいではない | 上空で塩味と甘味の感度が約 30% 低下。乾燥と騒音も追い打ち。だからトマト・きのこ・生姜 |
| 14 | はちみつ | 腐らない唯一の食品 | 浸透圧で細菌の水を奪う＋弱酸性＋蜂由来の酵素が過酸化水素を出し続ける。結晶化は劣化ではない |
| 15 | アルミホイルの表裏 | 光沢面とつや消し面がある理由 | 最終圧延で 2 枚重ねて通すため。ローラーに触れた外側だけ光る。調理性能は同じ |
| 16 | 冷凍焼け | 安全な食品を捨てている | 白い部分は抜け出た水分が霜になったもの。味は落ちるが危険ではない |
| 17 | トマトと冷蔵庫 | 冷蔵庫が香りを消している | 13℃ 以下で香り遺伝子がオフ。一度止まると戻らない。ヘタを下にして常温保存 |

## 全原稿（94 本・古い順）

各テーマは言い回しを変えた複数テイクが録られています。

| # | 日時 | 声 | 尺 | 原稿 | 音声 |
|---|---|---|---|---|---|
| 1 | 07-12 03:14 | Tallulah | 1.92秒 | うんちはあここここここ | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260712_031403_cb38a36d-0ad6-41c9-8c8d-767f15d592c5.mp3) |
| 2 | 08-22 06:12 | Helena | 8.08秒 |  Your window is three panes deep. That little hole forces the outer pane to carry almost all the cabin pressure alone. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061253_2d9158c3-4346-4e41-b81e-1eedd8892574.mp3) |
| 3 | 08-22 06:12 | Helena | 7.2秒 |  Every airplane window has a hole. It is not damage, and the engineers who put it there call it breathing. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061253_a039f959-f56b-4186-badf-a87695c65ac8.mp3) |
| 4 | 08-22 06:12 | Helena | 6.48秒 |  It also breathes moisture out, which is why your view stays clear at forty thousand feet instead of freezing over completely. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061253_96902bbc-7d36-42b7-a58f-975b33640e20.mp3) |
| 5 | 08-22 06:14 | Helena | 7.52秒 |  It breathes moisture out too. That is why your window stays clear at forty thousand feet, instead of frosting over on every flight. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061437_022d01c3-9b6b-4f77-8dea-01fc9d88e5d5.mp3) |
| 6 | 08-22 06:14 | Helena | 8.32秒 |  Every airplane window has a hole. It is not damage or a crack, and the engineers who drilled it there call it breathing. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061437_5b75a6c9-dc39-4c15-8f2f-be2f6c2186e7.mp3) |
| 7 | 08-22 06:16 | Helena | 7.76秒 |  It breathes moisture out, too. That is why your window stays clear, never frosted over, even at forty thousand feet. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061647_a7e6ef3a-4d1e-4b72-975a-11ccea6c9d04.mp3) |
| 8 | 08-22 06:16 | Helena | 8.8秒 |  Every airplane window has a hole. Not damage, not a crack, not a flaw, the engineers just call it breathing. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_061647_f7b6bfc6-8565-414a-8572-f9cf40d59828.mp3) |
| 9 | 08-22 06:44 | Helena | 7.6秒 |  The damage is not the charging. It is the sitting, hours parked at full, straining the cathode while you sleep. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_7ef13acc-7bd4-4bfe-a6b7-1329ae47524e.mp3) |
| 10 | 08-22 06:44 | Helena | 9.2秒 |  You are killing your phone every night. That last twenty percent demands the highest voltage, and it quietly ages the cell every time. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_d375306d-919d-4ec5-bbbf-8e795df129b0.mp3) |
| 11 | 08-22 06:44 | Helena | 8.16秒 |  Stop at eighty percent, and stay above twenty. Battery tests show that habit can double, or even triple, your cycles. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_4ad1aeba-34a0-4656-8860-84034f09af9a.mp3) |
| 12 | 08-22 06:44 | Helena | 8.24秒 |  Brass is different. Copper ions punch straight through their cell walls, and the colony starts dying the moment it lands. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_3bcbd12c-af57-4fc3-a85d-2bd680305e82.mp3) |
| 13 | 08-22 06:44 | Helena | 9.2秒 |  Your hospital picked the wrong doorknob. Stainless steel looks clean, but bacteria can survive on it for weeks, sometimes months. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_f781911c-7414-4930-a399-7327c9fdf1fe.mp3) |
| 14 | 08-22 06:44 | Helena | 7.36秒 |  So the old buildings had it right. We swapped brass for steel because it looked more hygienic, and it never was. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064458_4d876f67-f3a3-4abb-a7d4-865e1e005f4c.mp3) |
| 15 | 08-22 06:46 | Helena | 7.68秒 |  The damage is not the charging. It is the sitting, hours parked at full, straining the cathode, while you sleep. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064636_3ce83fd1-06b4-4114-a760-b06101a6058b.mp3) |
| 16 | 08-22 06:46 | Helena | 8.4秒 |  Stop at eighty percent, and stay above twenty. Battery tests show that one habit can double, or even triple, your total cycles. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064636_5921a380-0407-413d-a782-819a0d745acb.mp3) |
| 17 | 08-22 06:46 | Helena | 7.84秒 |  So the old buildings had it right. We swapped brass for steel, because it looked more hygienic, and it never was. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_064636_f4d5f965-5612-459f-8302-f0054be15991.mp3) |
| 18 | 08-22 06:55 | Helena | 8.88秒 |  The damage is not the charging. It is the sitting, eight hours parked at full voltage, quietly straining the cathode while you sleep. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_065547_4e26a0cf-b828-4799-8982-f362aa61f263.mp3) |
| 19 | 08-22 06:55 | Helena | 9.6秒 |  So the old buildings had it right. Brass was ripped out everywhere for steel, which looked far more hygienic, and simply never was. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_065547_666ac94f-b62a-4d93-b253-7e7724a63c4a.mp3) |
| 20 | 08-22 06:55 | Helena | 10.08秒 |  Brass is different. Copper ions punch straight through their cell walls, and ninety nine percent of that colony dies within two hours. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_065547_9dba52c7-8d2e-4849-8420-d7822a4299c3.mp3) |
| 21 | 08-22 06:57 | Helena | 9.12秒 |  Brass is completely different. Copper ions punch through their cell walls, killing that colony, ninety nine percent, within two hours. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_065715_8b12ffd7-714c-4be7-966e-52b82b45adf1.mp3) |
| 22 | 08-22 09:57 | Helena | 7.92秒 |  Your coins have ridges for a reason. People shaved slivers off the edges of silver money, spent it, and kept the metal. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_ae8ad57c-a7a4-4a72-b5dc-a2bc8188776b.mp3) |
| 23 | 08-22 09:57 | Helena | 8.16秒 |  So keep it out, or freeze it solid. Below freezing the crystals cannot form at all, and the clock simply stops. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_2657213d-4602-48d4-84ce-d527fc0ba201.mp3) |
| 24 | 08-22 09:57 | Helena | 6.8秒 |  The close door button is not a placebo. It does work, just never in the moment you are jabbing at it. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_20cc8f9d-f9a5-4a60-a5c7-33297b0f136b.mp3) |
| 25 | 08-22 09:57 | Helena | 8秒 |  Accessibility law sets a minimum hold. The doors must stay open a few seconds, and until then the button is ignored. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_8be519ea-c7dd-4d7b-bf68-fdb765e8dc83.mp3) |
| 26 | 08-22 09:57 | Helena | 8.72秒 |  Your fridge is staling your bread faster. Cold does not dry it out, it rebuilds the starch inside, grain by grain. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_2a32a03d-c0b1-45c2-8fa0-f82f1cecfc0b.mp3) |
| 27 | 08-22 09:57 | Helena | 8.96秒 |  By sixteen ninety six, half the silver was gone. Isaac Newton took over the Mint, and cut grooves into every edge. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_238eb0a4-2ed7-452c-a8cc-32d4f8111833.mp3) |
| 28 | 08-22 09:57 | Helena | 9.6秒 |  The starch molecules lock back into crystals. That runs fastest just above freezing, which is precisely your refrigerator, day and night. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_d6af6afd-e096-4c22-85df-6da7a8e60d2b.mp3) |
| 29 | 08-22 09:57 | Helena | 8.32秒 |  Wait out the hold, then press once. The button was listening all along, and you were simply early, every single press. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_81934de4-1a3c-4352-be6a-55a72f49f507.mp3) |
| 30 | 08-22 09:57 | Helena | 8.72秒 |  A shaved coin now had a smooth edge. The fraud could not hide, and the ridges outlived the silver by centuries. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095725_2faeb2e8-604e-48e0-a540-59662e6f71f9.mp3) |
| 31 | 08-22 09:59 | Helena | 8.88秒 |  The starch molecules lock back into crystals. That runs fastest just above freezing, which is your refrigerator, day and night. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095916_d847bf5d-6586-45c1-8a24-ab7262da56ee.mp3) |
| 32 | 08-22 09:59 | Helena | 8.64秒 |  The close door button is not a placebo. It works, it just ignores you, precisely when you jab it, over and over. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_095916_e0d22675-0fa4-4940-999f-e55849b7267c.mp3) |
| 33 | 08-22 11:10 | Helena | 9.52秒 |  Your fridge is staling your bread faster. Cold does not dry it out, it rebuilds the starch inside into a rigid mesh. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_111003_a3b114e0-e1fa-4816-b8e7-bf66c8ecb08c.mp3) |
| 34 | 08-22 11:16 | Helena | 8.48秒 |  The close door button is not a placebo. It works, it just ignores you, precisely when you jab at it, repeatedly. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_111641_de07cb13-90cf-4c54-b57b-94fc13983550.mp3) |
| 35 | 08-22 14:34 | Helena | 8.48秒 | This traffic jam has no cause. No crash, no roadwork, just one driver braking slightly harder than the car ahead. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_6d76d353-7bc6-4bc1-8c09-8117ead98fa2.mp3) |
| 36 | 08-22 14:34 | Helena | 8.96秒 | The posts are blunt aluminium, built to stop whiplash. Against tempered glass, blunt force spreads out instead of biting in. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_a4f03ea5-4c58-4aaa-b6c0-6f5794238fb9.mp3) |
| 37 | 08-22 14:34 | Helena | 9.44秒 | American eggs are illegal in Europe. And European eggs break the law in America, over one invisible layer on the shell. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_dfd29fa0-1bdc-46de-abbd-95c0fbe7154c.mp3) |
| 38 | 08-22 14:34 | Helena | 8.48秒 | Each reaction lands a little late. The slowdown grows as it rolls backward, until cars a mile behind stand still. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_7dd40bc8-3c81-4f70-8d33-c7a6cf85d757.mp3) |
| 39 | 08-22 14:34 | Helena | 8.72秒 | Researchers proved it on a circular track. Twenty two cars, no obstacles, and the wave still formed all by itself. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_d482b077-2b87-4bd3-9cc9-7dab00a5aacd.mp3) |
| 40 | 08-22 14:34 | Helena | 7.68秒 | The shell wears a natural coating. America washes it off to kill germs, then must refrigerate every carton for life. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_53d61bea-3a18-4fc0-9232-4b6c6f9c9255.mp3) |
| 41 | 08-22 14:34 | Helena | 8秒 | A sinking car may give you ninety seconds. Keep a pointed punch in the door, it cracks glass in one blow. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_5a5a4085-1138-4a0b-bc17-cf48c25b815d.mp3) |
| 42 | 08-22 14:34 | Helena | 9.44秒 | Europe keeps the coating and bans washing, so its cartons sit on warm shelves. Same fear, two entirely opposite answers. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_7f2e575a-8d48-4418-a8df-4463fec50dcb.mp3) |
| 43 | 08-22 14:34 | Helena | 8.32秒 | Your headrest was never made for breaking windows. A firefighter tested that trick, and needed eight full swings to crack one. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143415_9fec7724-7f41-4d5d-9c5a-ff01491b45d4.mp3) |
| 44 | 08-22 14:37 | Helena | 7.6秒 | A sinking car may give you ninety seconds. Keep a pointed punch in your door, close at hand, it cracks glass instantly. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143737_dfd0cb80-767f-423a-959e-1170552b05dd.mp3) |
| 45 | 08-22 14:37 | Helena | 8.88秒 | The shell wears a natural coating. America washes it off, to kill surface germs, then must refrigerate every carton for life. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143737_0bf8e6c5-a0e6-476d-aa4c-e91efb0603dc.mp3) |
| 46 | 08-22 14:37 | Helena | 9.2秒 | This traffic jam has no cause. No crash, no roadwork, no closed lane, just one driver braking harder than the car ahead. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143737_fd41c159-062a-47fc-be9f-76000dfdb3f8.mp3) |
| 47 | 08-22 14:38 | Helena | 8.48秒 | A sinking car may give you only ninety seconds. A pointed spring punch, kept in the door, shatters the window in one blow. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_143859_a555c911-9d01-4c65-bc68-ed7c1d6b70ff.mp3) |
| 48 | 08-22 22:27 | Helena | 8.56秒 | Loose caps were fifteen percent of packaging litter. Too small for sorting machines, they slipped through into landfill and beaches. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_d5ca0cbd-7a16-41a7-bce8-f16386798835.mp3) |
| 49 | 08-22 22:27 | Helena | 6.96秒 | Your bottle cap will not come off anymore. That is a law, and the annoyance is the entire point of it. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_c5fc9df4-f2f8-413a-9450-c65aeb800e0a.mp3) |
| 50 | 08-22 22:27 | Helena | 6.96秒 | Warm air pools at the ceiling. Spun clockwise at low speed, the blades push it down the walls without a draught. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_25959b4e-f36b-4324-bdcf-bc3e86daea98.mp3) |
| 51 | 08-22 22:27 | Helena | 7.12秒 | Throw out the cotton in your pill bottle. It was cushioning for fragile tablets, and that need ended decades ago. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_473c7991-759e-41b8-8575-d964e9254f95.mp3) |
| 52 | 08-22 22:27 | Helena | 7.36秒 | Your ceiling fan has a hidden winter setting. One small switch reverses the blades, and it changes how heat moves. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_fe4ab7f0-bc3f-48c6-9666-db1361299bb0.mp3) |
| 53 | 08-22 22:27 | Helena | 6.56秒 | The little desiccant packet is the opposite. It dries the bottle out, so keep that one and bin the fluff. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_e9ce15d7-bf4d-48b0-9888-fcef39d88e4b.mp3) |
| 54 | 08-22 22:27 | Helena | 8.72秒 | Cabin air is drier than most deserts. Smell needs moisture, and the engine noise blunts sweetness even further on top. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_3fe0d4a6-f698-4a53-b114-adfef1c5bf7c.mp3) |
| 55 | 08-22 22:27 | Helena | 8.56秒 | Bitter, sour and spice survive the trip. So menus lean on tomato, mushroom and ginger, tuned for a broken tongue. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_1f5175cd-5db6-4e6a-becc-c082db80c480.mp3) |
| 56 | 08-22 22:27 | Helena | 7.76秒 | That trick can trim heating costs near ten percent. Flip the switch again in summer, and the breeze cools you instead. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_3c7f70f5-933b-4f8d-990e-b89fe0370168.mp3) |
| 57 | 08-22 22:27 | Helena | 8.56秒 | Airline food is not badly cooked. At cruising altitude your taste for salt and sweet drops by roughly thirty percent. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_6512c862-308f-404d-931f-6d0e748cd1e2.mp3) |
| 58 | 08-22 22:27 | Helena | 7.36秒 | Opened bottles let humid air in every time. Cotton soaks it up, then holds the dampness pressed against your medicine. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_a24d5100-b77b-4dd1-8812-296b33eec7e8.mp3) |
| 59 | 08-22 22:27 | Helena | 9.92秒 | European law now requires the tether on every drink. One hinge keeps cap and bottle recycled together, beaches roughly ten percent cleaner. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222725_7caa3ac6-9ca6-46fc-9725-556896c1b586.mp3) |
| 60 | 08-22 22:29 | Helena | 6.64秒 | Honey is the one food that cannot rot. Bacteria land on it, and the sugar pulls the water out of them. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_9dfd305c-e75c-4a02-8265-e2b74cc98378.mp3) |
| 61 | 08-22 22:29 | Helena | 7.2秒 | It is also mildly acidic. And the bees add an enzyme that keeps making traces of hydrogen peroxide inside it. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_a9bb8d0c-5bb2-46e7-bfa0-9a0216dc1d40.mp3) |
| 62 | 08-22 22:29 | Helena | 8.24秒 | A single sheet would tear in the last pass. Doubling up survives the squeeze, and steel only polishes the outer faces. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_efd2391c-2ed9-4fdb-93d6-d8d2a714ad1c.mp3) |
| 63 | 08-22 22:29 | Helena | 7.68秒 | Foil has a shiny side for one reason. Two sheets ride through the final rollers together, squeezed into one ribbon. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_cdb0f0e0-0147-493e-8a6e-325d2564636a.mp3) |
| 64 | 08-22 22:29 | Helena | 7.52秒 | Peel the pair apart and the difference appears. Both sides cook identically, the mill simply never touched one of them. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_b5f870ed-55da-4382-ba7a-ce7d6947fb53.mp3) |
| 65 | 08-22 22:29 | Helena | 8.32秒 | Three defenses, one jar, no expiry date. Crystals in old honey are not decay, just the sugar settling into shape. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_222900_91b4d8d6-02fe-4e4e-aaf7-677f97d80009.mp3) |
| 66 | 08-22 22:31 | Helena | 9.36秒 | Opened bottles let humid air inside, every single time. Cotton drinks it up, then holds that dampness, pressed against your medicine. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_fe603918-408b-4e77-aee5-e683e7456578.mp3) |
| 67 | 08-22 22:31 | Helena | 8.24秒 | That trick can trim heating costs by nearly ten percent. Flip it back in summer, and the breeze, instead, cools you. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_456c5ceb-a25d-42c5-b764-039be248f627.mp3) |
| 68 | 08-22 22:31 | Helena | 8.96秒 | Your ceiling fan has a hidden winter setting. One small switch, tucked on the motor, reverses the blades, and moves heat differently. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_ebb1326c-ec9d-4ab7-9b05-3ee1f9393908.mp3) |
| 69 | 08-22 22:31 | Helena | 8.96秒 | Airline food is not badly cooked. Up at cruising altitude, your taste for salt, and for sweetness, drops by roughly thirty percent. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_fdfe28f3-23ec-4985-a42d-38c646b9e266.mp3) |
| 70 | 08-22 22:31 | Helena | 7.68秒 | Your bottle cap will not come off anymore. That is the law, and the annoyance, believe it or not, is deliberate. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_a69f9185-6fb7-4728-820a-fd766d742ebd.mp3) |
| 71 | 08-22 22:31 | Helena | 7.84秒 | The little desiccant packet, by contrast, does the opposite. It dries the bottle out, so keep it and bin the cotton. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223141_cbe9e832-3b28-46a2-9964-c501c9e73f3b.mp3) |
| 72 | 08-22 22:31 | Helena | 8.08秒 | Warm air pools up at the ceiling. Spun clockwise, at low speed, the blades push it down the walls, without any draught. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223142_d726cbe2-02b0-487a-a44d-a23aeec2cb57.mp3) |
| 73 | 08-22 22:31 | Helena | 7.44秒 | Throw out the cotton in your pill bottle. It was packing, for fragile tablets, back when they chipped, and that is over. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223157_7dcb700c-8692-4867-a12b-3c6a2fb99057.mp3) |
| 74 | 08-22 22:34 | Helena | 9.04秒 | The little desiccant packet, by contrast, does exactly the opposite. It pulls moisture out of the bottle, so keep that one always. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223406_c667ac5c-e1d4-400e-a7ca-f9efb356e116.mp3) |
| 75 | 08-22 22:34 | Helena | 8.64秒 | Your bottle cap will not come off anymore. That design is required by regulation, and the daily annoyance, it turns out, is deliberate. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223406_ffb0ce3e-0669-4b3f-9939-559799d458ad.mp3) |
| 76 | 08-22 22:34 | Helena | 9.04秒 | Warm air naturally pools up at the ceiling. Spun clockwise, at low speed, the blades push it down the walls, without any draught. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223406_4ad0dc65-ab40-472d-a603-4d2f6e6f7224.mp3) |
| 77 | 08-22 22:34 | Helena | 8秒 | Throw out that cotton wad. It was packing for fragile tablets, from an era when they chipped, and crumbled, far too easily. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223406_66bc28a1-73fd-47e6-828d-0c6b417780bd.mp3) |
| 78 | 08-22 22:34 | Helena | 8.32秒 | That single trick can trim your heating costs, by nearly ten percent. Flip it back in summer, and the breeze cools you instead. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223435_f6f97cf9-549a-407f-9004-92094821acc7.mp3) |
| 79 | 08-22 22:35 | Helena | 8.8秒 | Throw out that cotton wad. It was once packing — protection for fragile tablets, from an era when they chipped far too easily. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223530_c8fb5ec6-a459-44d3-8e7f-74e644593ffa.mp3) |
| 80 | 08-22 22:35 | Helena | 8.72秒 | Your bottle cap will not come off anymore. That design is required by regulation — and the daily annoyance, it turns out, is deliberate. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223530_2f2f1cc1-5344-429f-9c86-bbf92d51fd4c.mp3) |
| 81 | 08-22 22:38 | Helena | 7.92秒 | Honey is the one food that cannot rot. Bacteria that land on it are drained, as the dense sugar pulls their water out. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223839_729718e9-119d-4125-a2f8-aff402430cbc.mp3) |
| 82 | 08-22 22:38 | Helena | 9.44秒 | European law now requires that tether on every bottle. One hinge keeps cap and body together and beaches run ten percent cleaner. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223839_f4455932-3826-4ed6-8179-30c0c83af93d.mp3) |
| 83 | 08-22 22:38 | Helena | 7.76秒 | Honey is also mildly acidic, all on its own. And the bees add an enzyme that keeps generating hydrogen peroxide inside it. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260822_223840_270fa155-5316-4bf3-b0b3-a01a54c04f39.mp3) |
| 84 | 08-25 21:51 | Helena | 10.72秒 | European law now requires that tether on every bottle. One hinge keeps cap and body together, projected to cut beach litter ten percent. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260825_215130_f0cf7e04-98d9-4230-8ff1-7ce7d99d0142.mp3) |
| 85 | 08-25 22:07 | Helena | 8.64秒 | European law now requires that tether on every bottle. One hinge keeps them together, to cut beach litter ten percent. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260825_220736_19e75466-47a6-40ac-846d-7c5d19e8e849.mp3) |
| 86 | 08-25 22:20 | Hana | 21.84秒 | 私の企画書を盗んだ先輩は、役員会議で堂々とプレゼンを始めました。その瞬間、役員がひとこと。「その企画、昨日彼女から直接聞いたものだよね？」みるみる青ざめる先輩。実は私、前の日に役員へ直談判していたんです。 | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260825_222048_105a46cc-56ff-43e3-8ec4-ad6692065c92.mp3) |
| 87 | 08-30 01:33 | Helena | 8.48秒 | The taste turns dull, never dangerous. Trim the dry spots, cook it well, and your dinner is completely fine tonight. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_8226cb58-d0b2-4dcc-b296-3605d89fc5ff.mp3) |
| 88 | 08-30 01:33 | Helena | 8.4秒 | You are throwing away perfectly safe food. Freezer burn looks alarming, but it has never once spoiled a single meal. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_dd081562-6623-46e4-bb2c-88e4601c857c.mp3) |
| 89 | 08-30 01:33 | Helena | 9.12秒 | Your fridge is quietly deleting your tomato's flavor. Cold breaks the tiny engine that makes taste, and it never fully restarts. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_f1fecfdd-9c08-425e-b159-18fdae5668c3.mp3) |
| 90 | 08-30 01:33 | Helena | 8.08秒 | Keep tomatoes on the counter, stem side down. A ripe one holds for days, and every slice still tastes like summer. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_d80cddcf-6352-4016-9165-d8555e2bdb18.mp3) |
| 91 | 08-30 01:33 | Helena | 9.84秒 | Below fifty five degrees, the genes for aroma switch off. The fruit stops making scent molecules, and stored ones slowly leak away. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_554fc053-88c1-4cf4-b368-ec4e3b30d957.mp3) |
| 92 | 08-30 01:33 | Helena | 7.76秒 | Those white patches are just escaped moisture. Water crystals slip out of the food and settle on the surface as frost. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013342_cf05ac9a-9e36-4ce8-97c4-905b5a479e54.mp3) |
| 93 | 08-30 01:34 | Helena | 7.92秒 | Below fifty five degrees, the aroma genes switch off. The fruit stops making scent molecules, and stored ones leak away. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_013458_0cb61598-25c4-444b-b033-0ae24780e407.mp3) |
| 94 | 08-30 01:41 | Helena | 8.08秒 | Those white patches are just escaped moisture. Ice crystals slip out of the frozen food and settle across its surface as frost. | [mp3](https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260830_014114_20028cfb-6ee3-459d-a405-48f9d5c0839c.mp3) |

※ 1 本目（07-12）は動作テストで、豆知識シリーズとは無関係です。
※ 08-25 の日本語 1 本は「ざまあ系ショートドラマ」用で、豆知識とは別企画です。
