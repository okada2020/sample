# 『お会計』CM — 画像生成ブリーフ（Codex 引き渡し用）

この1枚で全画像が作れるように書いてある。**プロンプトは英語のままコピーして使う**（日本語で指示すると画面内の日本語まで崩れやすい）。

---

## 0. 何を作るか

セルフレジ・ホラーゲーム『お会計』の**縦9:16・約1分のCM**に使う静止画。
静止画をそのまま使うか、動画生成の開始／終了フレームに固定して使う。

**物語**：23時20分、24時間スーパー。残業帰りの肉体労働者がカップ麺と半額弁当と発泡酒を買う。セルフレジの支払い画面が「お支払い金額 47.2kg円」になり、台の下から赤い液体が流れ出す。背後で物音、振り向くと誰もいない。向き直ると血も金額も元に戻っている。何事もなかったように会計を済ませると、レシートに「後ろを見ないでください」。防犯カメラに戻ると彼は一人だが、体重センサーは 47.2kg → 94.4kg。

**47.2kg は、冒頭のニュースで行方不明と報じられた女性店員の体重。** ただし**ニュースは体重を言わない**（実際の行方不明者情報は体重を出さない）。「身長158センチくらい／やせ型／小柄」とだけ伝えて、視聴者に自分で繋げさせる。

---

## 1. 全画像に共通する絶対ルール

- **縦 9:16**。解像度は高め（2k 相当）
- **一人称視点（POV）のカットは、必ず `Keep the image strictly first-person POV.` で締める**
- 店は**営業中**。真っ暗ではない。**冷たい蛍光灯で少し薄暗い、わずかに緑シアン寄り**
- 床は**光沢のあるタイル**で照明を反射している
- **実在企業・実在の決済サービス・実在の放送局のロゴや名称は一切出さない**
- **怪物・発光する目・異形・走る動作は禁止**。人影は普通の成人体型
- **film grain / vignette / dramatic lighting は付けない**（後で編集で足す）
- 画面内の日本語は**「」で囲んで一字一句指定**する
- **異常は1カットに1つだけ**。それ以外は徹底的に「普通」

---

## 2. 世界のバイブル（全カットで固定）

図にしたものが `assets/out/charsheet.png`（1枚の設定シート）。下の表と同じ内容。

| 要素 | 仕様 |
|---|---|
| 場所 | 日本の郊外の24時間スーパー。セルフレジが3台並ぶ |
| 時刻 | **23:15〜23:22**（2026-09-21 に変更。深夜1時からずらした） |
| 通路の向き | セルフレジから見て**左が冷蔵ケース（ガラス扉）、右が乾物の棚** |
| 主人公 | 30代男性、肉体労働者。残業帰りで疲れている |
| 袖 | **紺の作業着。袖口が少し汚れている** |
| 手 | **働く人の手**。幅広く乾いていて、爪は短く角ばっている。指の関節に小さな擦り傷 |
| イヤホン | **白いワイヤレスイヤホンを右耳だけ**。左耳は外している。POVでは見えないので、指定が要るのは防犯カメラのカットだけ |
| 帽子 | **紺の作業帽（つば付き）**。防犯カメラは高い位置にあるので、つばで顔が消える |
| 他の客 | 通路に2〜3人。**セルフレジのエリアだけは無人**。誰も主人公を見ない |
| カゴ | **日本のスーパーの33Lカゴ**。濃いグレーのポリプロピレン、側面に縦スリット、上端が太いリム、U字の折りたたみ取っ手2本 |
| カゴの中身（4点固定） | ①ラベルなしの透明な水のボトル（白いキャップ） ②白いカップ麺（赤い帯、ロゴなし） ③黒いトレーの弁当（透明フタ、**黄色い「半額」シール1枚**） ④無地の銀＋青の缶（発泡酒。ブランド名なし） |
| スキャナ | カウンター面に埋め込まれたフラットベッド。**赤く発光** |

**主人公を特定させない。** 顔を隠すのではなく、どういう男か分からなくする。POVのカットは元から顔が
映らないので、効くのは防犯カメラのカットだけ。そこでは ①通路に他の客を入れて彼を「その1人」にする
②作業帽のつばで顔を消す ③カメラを天井寄りにして頭頂と肩だけにする ④入店は明るいガラス面を背に
シルエット ⑤**ニュースのCAM 03と同じ粗さにそろえる**（同じ画質にすると、行方不明の女性の映像と
主人公の映像が見分けられなくなる）。ただし隠しすぎない ―― 最後に94.4kgが出たとき、視聴者が
「誰の重さか」を数え直せる程度には残す。
| 端末 | 縦型の黒いタッチスクリーン、カウンター右上に設置 |

---

## 3. 画面に出る日本語（一覧・一字一句）

**セルフレジ 支払い画面（共通レイアウト）**
```
ヘッダー（濃いチャコール地／白文字）：左「お支払い金額」　右「47.2kg円」 or 「1,284円」
中央：「お支払い方法を選択してください」
ボタン5つ（白・角丸・グレーの線アイコン）：「現金」「クレジット」「交通系IC」「電子マネー」「コード決済」
下部（ティール地）：「もどる」「言語」
```

**スキャン中の画面**：「1点　¥108」のみ

**レシート**
```
2026/09/16  23:21
────────────────
水 500ml            ¥0
────────────────
合計                ¥0
お預り              ¥0
お釣り              ¥0

後ろを見ないでください
```

**防犯カメラのオーバーレイ**
```
左上：● REC ／ CAM 01（入店）or CAM 02（影）or CAM 04（体重）
右上：2026-09-16　23:19:40 / 23:21:02 / 23:21:19
右下の箱（CAM04のみ）：「レジ横 体重センサー」＋「47.2kg」→「94.4kg」
四隅に細い白のコーナーブラケット
```

**タイトル**：『お会計』／その下に小さく「金額がおかしい時は、後ろを見ないでください。」

---

## 4. 画像リスト

### ✅ 生成済み（作り直し不要。参照用に使える）

| # | 内容 | 画像URL |
|---|---|---|
| N1 | ニュース「27歳女性 行方不明」 | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260921_020345_581b4ddb-7fc5-4eb5-aef9-3050341c00a2.png |
| N2 | ニュース「勤務先のスーパー」（旧版・体重を明記していたため不採用） | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260921_020359_619a8d29-d7b8-4963-8d06-9d40366c9d3a.png |
| N0 | 歩きスマホPOV（画面は空＝合成用） | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260921_020729_a03b7afd-42e3-4087-b1d6-293ad856f189.png |
| A2 | 47.2kg円＋床の赤い液体 | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260921_020921_751b93b9-91a5-4e85-b0de-351ca8282c8f.png |
| C2 | 血が消え「1,284円」（A2と同一フレーム） | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260921_021007_181264a0-bb4a-4516-bde7-49329d434b0b.png |
| B | 振り向いた先・誰もいない | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260920_233530_971df76a-f7e8-4d96-82c2-d291b78decf9.png |
| D | 監視カメラ CAM02・奥に人影 | https://d8j0ntlcm91z4.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/hf_20260920_233538_1009640e-9e38-4985-8bbc-c8fc638d3766.png |

**A2 と C2 は「同じ写真の数秒後」でなければならない。** カメラ・カゴ・手の位置が完全一致していることが、この作品の山場（目を離した隙に世界が戻る）の条件。ズレていたら C2 だけを A2 参照で作り直す。

### ⬜ これから作るもの

**文字だけの素材（レジ画面・レシート・CCTVオーバーレイ・タイトル）は生成しないこと。** `docs/okaikei/assets/build.py` が HTML から PNG で書き出していて、日本語が崩れず毎回同一レイアウトになる。生成モデルに要るのは**写真的なカットだけ**。

---

#### 画像1：C3「半額弁当を取る」

**目的**：買い物の「普通」。主人公が誰なのかを決める1枚。深夜の半額弁当。
**参照に渡すもの**：A2（カゴ・手・袖・店内）

```
Photorealistic first-person POV photograph, vertical 9:16, in a Japanese 24-hour supermarket at about 11:17 PM. Cool overhead fluorescent lighting with a faint green-cyan cast, slightly dim, glossy reflective tile floor, store open, with two or three other late shoppers visible far down the aisle behind him, none of them looking his way. The shopper has stopped at a refrigerated open bento case on the RIGHT side of the aisle, which fills the right half of the frame: a low chilled shelf of boxed supermarket bentos, most slots already empty, a few remaining black plastic trays with clear lids, several wearing small bright yellow discount stickers reading 「半額」 in clear red type. His LEFT hand — a tired manual labourer's hand, broad and dry, short blunt nails, navy work-jacket sleeve with a slightly dirty cuff — reaches in and has just picked up one bento by the edge of its lid, lifting it out; five fingers, natural grip. At the bottom-right of the frame, his RIGHT hand grips one folding top handle of a dark grey Japanese 33-litre supermarket hand basket with tapered slotted sides; the arm hangs down so the basket dangles from that single handle and its body extends from the right edge toward the lower centre at an oblique angle, occupying roughly the bottom-right quarter of the frame. Inside the basket, only three items so far: a clear label-less water bottle with a plain white cap, a plain white cup noodle with a red band and no logo, and a tall plain silver-and-blue can with no brand name. No bento in the basket yet. It must NOT look like a shopping cart: no wheels, no horizontal bar, no two hands on the basket, nothing held out in front at chest height. Small white price tags on the shelf edge, no readable product branding anywhere. Nothing unusual anywhere in the frame. Natural smartphone-camera look, no film grain, no vignette, no dramatic lighting. Keep the image strictly first-person POV.
```

---

#### 画像2：レシートのクローズアップ

**目的**：警告が出る瞬間。**文字が主役なので絶対に崩してはいけない。** 崩れたら文字部分だけ後から合成する前提で、紙とライティングだけ使う。

```
Photorealistic first-person POV photograph, vertical 9:16, close-up of a supermarket receipt held up in one hand just after being torn from a self-checkout printer, in a Japanese 24-hour supermarket at 11:21 PM. The receipt fills most of the frame, held between the thumb and fingers of a tired manual labourer's hand — broad, dry, short blunt nails, navy work-jacket sleeve with a slightly dirty cuff. The paper is plain white thermal receipt paper, slightly curled at the edges, lit by cool overhead fluorescent light, its printed text in ordinary dot-matrix-style thermal black type, printed at a very slight angle as real receipts are. The printed content, in this exact order and wording, in plain monospaced Japanese receipt typography:
「2026/09/16  23:21」
a dashed separator line
「水 500ml                 ¥0」
a dashed separator line
「合計                     ¥0」
「お預り                   ¥0」
「お釣り                   ¥0」
a blank line
「後ろを見ないでください」
All Japanese text crisp, correctly spelled, exactly as written, clearly legible. No blood, no stains, no handwriting, no smearing, no red ink — the line 「後ろを見ないでください」 is printed in exactly the same ordinary black thermal type and the same size as the rest, sitting where a normal receipt would say thank you. Behind the receipt, the blurred self-checkout counter and the bright aisle, shallow depth of field. No brand logos, no store name. Natural smartphone-camera look, no film grain, no vignette. Keep the image strictly first-person POV.
```

---

#### 画像3：タイトルカード

```
A vertical 9:16 title card on a pure black background, nothing else in the frame. Centred, in a clean heavy Japanese gothic typeface in white, large: 「お会計」. Below it, with generous space, in a much smaller thin white Japanese typeface: 「金額がおかしい時は、後ろを見ないでください。」. Both lines horizontally centred, the block sitting slightly above the vertical centre of the frame. No logo, no border, no decoration, no texture, no glow, no blood, no imagery of any kind. All Japanese text crisp and correctly spelled exactly as written. Flat, quiet, restrained.
```

---

## 5. 作り方の型（新しい画像を足すとき）

```
Photorealistic first-person POV photograph, vertical 9:16,
[場所・時刻・光]
[画面を上・中・下の3バンドに分けて、それぞれ何があるか]
[手・袖・持ち物]
[画面内の文字を「」で一字一句]
[異常は1つだけと明記／それ以外は普通と明記]
No real brand logos. Natural smartphone-camera look, no film grain, no vignette.
Keep the image strictly first-person POV.
```

**縦9:16は上中下の3バンドで設計する。** 例：上＝端末の画面、中＝カウンターと手とカゴ、下＝床。1フレームに3つの情報が入り、どれも指ささずに済む。

**同じ場所の別カットは、前のカットの画像を参照にして「Recreate the reference image EXACTLY — with only these changes: ...」と書く。** 変える点だけを列挙する。これで「同じ写真の数秒後」になる。

---

## 6. やってはいけないこと（実際に失敗した）

| 失敗 | 対策 |
|---|---|
| カートやトロリーが出る | `no wheels, no cart, no trolley` を毎回書く。POVでは「片手で取っ手1本を握り、腕は下に垂れ、カゴは右下に斜めに見切れる」と明示 |
| カゴの形が毎回違う | §2のカゴ仕様を毎回そのまま貼る。参照画像も渡す |
| カゴの中身が前後のカットと違う | 4点（水・カップ麺・半額弁当・発泡酒）を毎回全部書く |
| 手が老人の手／若い手でバラつく | 「働く人の手・紺の作業着・汚れた袖口」を毎回書く |
| 自分の生成物を参照にし続けて崩れが遺伝した | **参照の根元は実写（依頼者の撮影素材）に戻す。** 生成物を延々と参照しない |
| 血がゴアになる | `just the liquid, no body, no splatter, no gore` |
| 人影が怪物になる | `ordinary build, face not readable, no glowing eyes, nothing supernatural` |
| 日本語が崩れる | 「」で一字一句。崩れたら**その領域だけ後から合成**する前提で進める（この作品は最初からその方針） |

---

## 7. 編集側（画像生成の外でやること）

- **監視カメラのカットにだけ**VHS風ノイズを当てる（走査線／色にじみ／テープの揺れ／解像感を一段落とす）。**POVには一切かけない。** 層が分離して「記録されていた映像」になる
- 冒頭：N2 をフルフレームで3秒 → 0.5秒で縮小して N0 のスマホ画面にぴったり嵌める → N0 の歩きへクロスフェード。**N0のスマホ画面は空の灰色プレートで作ってあるので、N2の実画像をそのまま縮小して嵌めれば文字が劣化しない**
- 全カットに同じカラーグレード（少し暗く、少し青緑）
- 音：**BGMなし**。自動ドア、冷蔵庫、足音、カゴ、スキャン音、プリンター、蛍光灯のノイズ。47.2kg円が出た瞬間に**環境音を1つ消す**
