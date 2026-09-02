# ぱんがじうす紹介動画 — カット構成と素材

10秒 / 9:16（1080x1920, 30fps）。静止画を紙芝居のように横スライドでつなぐ。
1カットの表示秒数は `build_kamishibai.py` が全体10秒に収まるよう自動で割り振る
（3カットなら約3.63秒ずつ、5カットなら2.24秒ずつ）。

文字は画像に焼き込まず、`build_kamishibai.py` 側で日本語フォントで描画している。
文言と並びは同スクリプトの `SCENES` で決まる。

## 現行版 — 提供写真の3カット（横位置）

実写の写真を素材にした版。横位置の写真に合わせて、カードは横長の枠
（`LAYOUTS["landscape"]`）を使う。

| # | 素材 | 字幕 |
| --- | --- | --- |
| 1 | 水中を泳ぐパンガシウス | 世界でいちばん / 養殖されているナマズ |
| 2 | メコン川の小舟 | ふるさとは、メコン川。 |
| 3 | 白身の切り身 | クセのない、やわらかな白身 |

---

# 付録 — イラスト版（5カット）で使った画像プロンプト

素材を生成し直す場合の記録。Higgsfield の `nano_banana_pro`（2K, **3:4**）で生成した。
3:4 は縦長の枠（`LAYOUTS["portrait"]`）と同じ比率なので、トリミングで絵が欠けない。

## 絵柄について

日本のフリー素材サイトでよく見る、平坦でやさしいクリップアート調をねらっている。
共通で効いている指示は次のとおり。特定の作家名は入れず、特徴を言葉で指定している。

- `Simple flat vector clip-art illustration in the style of cute free Japanese clipart`
- `Flat fill colors with no shading and no black outlines`（ベタ塗り・影なし・輪郭線なし）
- `small round black dot eye, tiny pink round cheek blush`（点目とピンクの頬）
- `Centered composition, minimal detail`（中央配置・描き込みは控えめ）
- `clearly readable colors rather than washed-out pastels`（淡くしすぎない）
- `plain pale <色> background`（カットごとに淡い背景色を変えて場面を describe し分ける）
- `No text, no letters, no watermark`

主役が小さいと2秒では目に入らないので、1・3カット目は
「フレームの幅いっぱいに大きく描く」と明示している。

## カット1 — 泳ぐパンガシウス（淡い水色）
字幕: 世界でいちばん / 養殖されているナマズ

> Simple flat vector clip-art illustration in the style of cute free Japanese clipart: one friendly catfish (pangasius) swimming, seen from the side, drawn LARGE so the fish spans most of the width of the frame. Rounded soft body in clear grey-blue with a cream belly, one small round black dot eye, a round pink cheek blush, gentle smiling mouth, two simple curved whiskers, simple rounded fins and tail. Flat fill colors with no shading and no black outlines, clearly readable colors rather than washed-out pastels. Plain light blue background with three or four simple white wavy water lines and a few small round bubbles. Centered composition, modest margin around the fish, minimal detail, cheerful and gentle. No text, no letters, no watermark.

## カット2 — メコン川の養殖いかだ（淡い空色）
字幕: ふるさとは、メコン川。

> Simple flat vector clip-art illustration in the style of cute free Japanese clipart: a small wooden fish-farming raft with a simple hut floating on a river, and a tiny simple wooden boat beside it with one cute round-faced person in a conical straw hat paddling. Rounded soft shapes, flat fill colors with no shading and no black outlines, muted friendly palette of brown, cream and soft green. Plain pale sky-blue background, simple wavy blue water lines, two or three simple palm trees on a flat green bank, a plain round sun. Centered composition, generous empty space, minimal detail, childlike simplicity. No text, no letters, no watermark.

## カット3 — 大物を抱える人（淡い若草色）
字幕: 大きいものは全長1.5m

> Simple flat vector clip-art illustration in the style of cute free Japanese clipart: one cute round-faced person, drawn small, standing at the bottom of the frame and struggling to hold up with both arms an ENORMOUS grey-blue catfish that is far bigger than the person and spans almost the entire width of the frame. The comical size difference is the point. The person has small black dot eyes, a round pink cheek blush and a strained smile, simple blue shirt and cream trousers. The fish has a cream belly, one dot eye and simple curved whiskers. Flat fill colors with no shading and no black outlines, clearly readable colors rather than washed-out pastels. Plain light mint-green background, empty otherwise. Centered composition, minimal detail, gentle and humorous. No text, no letters, no watermark.

## カット4 — 白身の切り身（淡い桃色）
字幕: クセのない、やわらかな白身

> Simple flat vector clip-art illustration in the style of cute free Japanese clipart: two or three plain white fish fillets, soft rounded rectangular slabs of pale cream-white flesh with a simple pink-grey edge line, arranged on a simple oval white plate with a small green parsley leaf and a plain yellow lemon slice. Flat fill colors with no shading and no black outlines, muted gentle palette. Plain pale pink background, completely empty otherwise. Centered composition, generous empty space, minimal detail, childlike simplicity. No text, no letters, no watermark.

## カット5 — 調理された一皿（淡い杏色）
字幕: 「バサ」の名で、世界の食卓へ

> Simple flat vector clip-art illustration in the style of cute free Japanese clipart: a cooked golden-brown fish fillet on a round white plate with a plain yellow lemon wedge and a small green herb leaf, three tiny curved steam lines rising above it, a simple fork and knife lying flat on either side. Rounded soft shapes, flat fill colors with no shading and no black outlines, warm muted palette of golden brown, cream and soft green. Plain pale apricot background, completely empty otherwise. Centered composition seen from slightly above, generous empty space, minimal detail, cheerful and appetizing. No text, no letters, no watermark.
