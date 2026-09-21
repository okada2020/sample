# このリポジトリについて

okada2020 の制作用リポジトリ。Web サイトのほかに、Claude と進めている映像・ゲーム制作の作業ファイルとスキルが入っている。

## まず読むもの

- 『お会計』（セルフレジ・ホラーゲームのCM）の続きを頼まれたら **`docs/okaikei/HANDOFF.md`** を最初に読む。生成ID、決定事項、次にやることが全部そこにある。
- 同じ手口で別の映像を作るなら **`docs/okaikei/WORKFLOW.md`**（制作工程。企画→絵コンテ→プリビズ→静止画→動画→確認→編集、プロンプトの型、クレジット単価、やりがちな失敗）。
- 他のAIやツールに画像生成を頼むときは **`docs/okaikei/CODEX-BRIEF.md`** をそのまま渡す（世界のバイブル、画面内の日本語一覧、コピーして使える英語プロンプト、既存素材のURL、失敗集）。
- **文字が入る画像（UI・レシート・オーバーレイ・タイトル・ニュースの枠）は生成モデルを使わず `docs/okaikei/assets/build.py` で描く。** HTML → headless Chromium → PNG。日本語が崩れず、毎回同じレイアウトで、クレジットゼロ。透過PNGも出せる。
- **動画の組み立ても無料でできる。** このコンテナに ffmpeg はないが、Higgsfield の `sandbox_exec` にはある。素材は raw.githubusercontent（このリポジトリは公開）と Higgsfield CDN から curl して、ffmpeg で組み、`media_upload` の presigned URL へ同一コマンド内で PUT、`media_confirm`。手順は `docs/okaikei/HANDOFF.md` の「組み立て方」。
- スキル（`.claude/skills/`）：
  - `previz` — 絵コンテから3Dブロッキングのページを作る（球体の頭＋棒の体、向き矢印、カットごとのカメラ）
  - `hyper-casual-game` — App Store のスクショから、遊べるカジュアルゲームの試作を1ページで作る（テンプレート同梱）

## 依頼者の好み

- 日本語で、短く。選択肢は番号で出す。
- ファイルの添付は好まない。調べられることは自分で調べる（「勝手に学習して」）。
- 判断は任せてよいが、Higgsfield のクレジットを使う前に見積もりを一言。
- **動画は 480p で作る**（4秒=12クレジット。720p は28、1080p は48）。指示がない限り 480p。
- 「こんなのできる？」は「作って見せて」の意味。説明より現物。

## 作ったもの（リンク）

- 『お会計』プリビズ：https://claude.ai/artifact/Y5MBRBp1GLnz2c3QGEJpeV
- ゲートラッシュ（クラウドランナー試作）：https://claude.ai/artifact/HJAWVopm1wQVHRbSc6J7Qn
- 『お会計』冒頭〜入店（15.5秒・組み立て済み）：https://d2ol7oe51mr4n9.cloudfront.net/user_32M6q94GH17qNpWcYirLFgOrQty/07c29274-0cba-4be6-8fcd-c736a816ee75.mp4
- **『降ります』**（満員電車すり抜け試作・採用）：https://claude.ai/artifact/VypL8fGgXbwCV4vfvAeHDr ／ ソースは `games/orimasu.html`

## 『降ります』メモ

満員電車を人にぶつからずかき分けて、扉が閉まる前に降りるアクション。核は**コンボ**（無接触で抜けると加速、接触で急停止し相手が振り向く）と**揺れ**（乗客が一斉に傾いて隙間が開閉。たまに急ブレーキで総入れ替え）。技：半身・くぐる・すり抜け・回り込み。邪魔はでかいリュック等、人間だけで足りる。負け＝乗り過ごし（次の駅まで）。CMはプレイ映像をそのまま使う方針。
