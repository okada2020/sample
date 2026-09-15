# 豆知識 Shorts ビルド＋投稿ツール

Higgsfield で作った無音クリップとナレーションを、1 本の縦型 MP4 に仕上げて
YouTube に投稿するまでを自動化します。**Mac のターミナルで動かします。**

Claude Code on the web の環境からは Higgsfield の配信サーバーにも YouTube にも
到達できないため、この工程だけはローカルで実行する必要があります。

## できること

```
clips.json          6テーマ分の素材URL・原稿・タイトル・説明文
  ↓ build.py        ダウンロード → クリップ連結 → ナレーション合成 → 字幕焼き込み
out/<topic>.mp4     1080x1920 の完成品
  ↓ upload.py       YouTube にアップロード（既定は非公開）
```

## 1. 準備（初回のみ）

### ffmpeg

```bash
brew install ffmpeg
```

`build.py` は起動時に必要なフィルタが揃っているか確認し、欠けていれば止まります。

### Python パッケージ

```bash
cd tools/shorts
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### YouTube の OAuth 設定（10〜15 分）

1. [Google Cloud Console](https://console.cloud.google.com/) で新規プロジェクトを作成
2. 「API とサービス」→「ライブラリ」→ **YouTube Data API v3** を有効化
3. 「OAuth 同意画面」→ ユーザーの種類は **外部** → アプリ名とメールを入力して保存
4. 同じ画面の「対象」→ **テストユーザー** に自分の Google アカウントを追加
   （これを忘れると認証時に「アプリは確認されていません」で弾かれます）
5. 「認証情報」→「認証情報を作成」→ **OAuth クライアント ID** → 種類は **デスクトップ アプリ**
6. JSON をダウンロードし、`tools/shorts/client_secret.json` として保存

`client_secret.json` と、初回認証後にできる `token.json` は `.gitignore` 済みです。
**リポジトリにコミットしないでください。**

## 2. 動画をビルドする

```bash
python3 build.py              # 6テーマすべて
python3 build.py kettle       # 1テーマだけ
python3 build.py --no-subs    # 字幕を焼き込まない
```

初回は素材を `assets/` にダウンロードします（2 回目以降はキャッシュを使います）。
完成品は `out/kettle.mp4` のように出ます。

**仕上がりの仕様**

- 1080x1920 / 30fps / H.264 + AAC
- クリップ 2 本を連結。ナレーションのほうが長い場合は最終フレームを静止して尺を合わせます
- 字幕はナレーションの実測尺から自動生成し、画面下から 170px の位置に焼き込み
  （Shorts の UI に隠れない高さです）

見た目を変えたいときは `build.py` 冒頭の `SUBTITLE_STYLE` と `WRAP_COLUMNS` を調整してください。

## 3. 投稿する

```bash
python3 upload.py kettle                          # 非公開で1本
python3 upload.py                                 # ビルド済みを全部
python3 upload.py kettle --privacy unlisted       # 限定公開
python3 upload.py kettle --publish-at 2026-09-20T09:00:00Z   # 予約投稿
```

初回だけブラウザが開いて Google のログインを求められます。以降は `token.json` が
使われるので操作は不要です。

**既定は非公開（private）です。** 中身を確認してから YouTube Studio で公開に切り替えてください。
`--publish-at` を使うと非公開で上げて指定時刻に自動公開されます。

タイトル・説明文・タグは `clips.json` に入っています。投稿前に直したいときはそこを編集してください。

### 注意

- 縦向きで 3 分未満なので、YouTube 側で自動的に Shorts 扱いになります
- YouTube Data API の 1 日あたりの割り当ては 10,000 ユニット、
  アップロード 1 本で約 1,600 ユニット消費します（**1 日およそ 6 本が上限**）
- 新規プロジェクトは審査前だと 1 日 6 本程度に制限される場合があります

## 4. 素材を増やす

新しいテーマを作ったら `clips.json` の `topics` に追記します。

```json
{
  "id": "短い英数字のID",
  "title": "タイトル #shorts",
  "description": "説明文",
  "videos": ["...mp4", "...mp4"],
  "lines": [
    { "text": "字幕とナレーションの原稿", "audio": "...mp3" }
  ]
}
```

ファイル名は `cdn_base` からの相対です。`docs/higgsfield-video-archive.md`
に全テーマの URL と原稿が載っているので、そこからコピーしてください。

## 未検証について

このスクリプトは Claude Code on the web の環境で書かれましたが、
そこには完全な ffmpeg がなく、Higgsfield の素材にも到達できないため、
**通しでの動作確認ができていません。** 初回実行でエラーが出たら、
メッセージをそのまま伝えてもらえれば直します。
