# 予約投稿の設定手順

各チャネルの予約投稿の状態と、設定に必要な作業。

| チャネル | 方式 | 状態 |
|---|---|---|
| **X** | GitHub Actions で完全自動 | 実装済み。APIキー登録のみ必要 |
| **Instagram** | Meta Business Suite の予約投稿 | 手動設定(下記手順) |
| **Threads** | Threads純正の予約投稿(最大75日先) | 手動設定(下記手順) |
| **ブログ** | git push → Cloudflare Pages 自動デプロイ | 設定済み・作業不要 |

---

## X(完全自動)

### 仕組み

```
data/x_queue.yaml (12本のストック)
        ↓
GitHub Actions が週3回 実行(月・水・金 6:30 JST)
        ↓
キューの先頭を1本投稿 → 30秒後に補足をぶら下げ
        ↓
data/x_posted.json に投稿済み位置を記録してコミット
```

**投稿直後の補足リプライ**は、滞在時間を伸ばして初速を上げるための仕込み。
2026年のXアルゴリズムは初速の反応を最重視するため、これが効く。

### 有効化の手順(これだけやれば動きます)

**1. X APIキーを取得**
[X Developer Portal](https://developer.x.com/) でアプリを作成し、以下4つを取得。
アプリの権限は **Read and Write** にすること(Readのみだと投稿できない)。

- API Key
- API Key Secret
- Access Token
- Access Token Secret

**2. GitHubリポジトリにSecretsを登録**

リポジトリ → Settings → Secrets and variables → Actions → **New repository secret**

| Secret名 | 値 |
|---|---|
| `X_API_KEY` | API Key |
| `X_API_SECRET` | API Key Secret |
| `X_ACCESS_TOKEN` | Access Token |
| `X_ACCESS_TOKEN_SECRET` | Access Token Secret |
| `X_POST_ENABLED` | `true` ← **これを入れるまで実投稿されません** |

**3. テスト実行**

Actions タブ → 「X 予約投稿」→ **Run workflow** →
`dry_run` に `true` を入れて実行。投稿されずに内容だけログに出る。

問題なければ `dry_run` を空(false)にして実行すると、1本目が実際に投稿される。

### 手元での確認

```bash
cd ai-influencer
python -m src.schedule_x --status   # 残り本数と次の内容を表示
python -m src.schedule_x            # ドライラン
```

### キューの補充

残り3本を切ると警告が出る。`docs/post-bank.md` から `data/x_queue.yaml` に追記する。

```yaml
- text: |
    本文をここに
  reply: |
    30秒後にぶら下げる補足(任意)
```

### 頻度を変えたい場合

`.github/workflows/x-scheduled-post.yml` の cron を編集する。
**UTC表記**なので、JSTから9時間引く。

| 希望 | cron |
|---|---|
| 週3回・月水金 6:30 JST(現在) | `30 21 * * 0,2,4` |
| 週5回・平日 6:30 JST | `30 21 * * 0-4` |
| 週2回・火金 7:00 JST | `0 22 * * 1,4` |

---

## Instagram(Meta Business Suiteで予約)

Instagramには純正の予約投稿があり、無料で使えます。

### 手順(PC / Meta Business Suite)

1. [Meta Business Suite](https://business.facebook.com/) を開く
2. 左メニュー **コンテンツ** → **投稿を作成**
3. 投稿先で **Instagram** にチェック
4. カルーセル画像(キャンバスからPNG書き出ししたもの)を順番にアップロード
5. キャプションを `docs/post-bank.md` からコピペ
6. 右下の **投稿** の横にある **▼** → **投稿を予約設定** → 日時を指定
7. 保存

### 手順(スマホアプリ)

1. 通常どおり投稿を作成し、キャプション入力画面まで進む
2. **詳細設定** をタップ
3. **この投稿を日時指定** をオンにして日時を選ぶ
4. **日時を指定してシェア**

### 推奨の予約パターン

週2〜3本。カルーセルは5本ストックがあるので、**約2週間分を一度に予約**しておくとラク。

| 曜日 | 時刻 | 内容 |
|---|---|---|
| 火 | 21:00 | カルーセル1本 |
| 金 | 21:00 | カルーセル1本 |
| 日 | 10:00 | カルーセル1本(任意) |

---

## Threads(純正の予約投稿)

Threadsにも公式の予約投稿があり、**最大75日先まで**指定できます。
※ Meta Business Suite は Threads に対応していないので、Threadsアプリ/Web版から設定します。

### 手順

1. Threadsで新規投稿の作成画面を開く
2. 本文を `docs/post-bank.md` からコピペ
3. 投稿ボタンの近くにある **⋯(その他)** から **スケジュール** を選ぶ
4. 日時を指定して保存

### 推奨の予約パターン

Threadsは**返信が最大のリーチ源**なので、予約は「自分の投稿」だけにして、
**返信は毎日手動で行う**のがいちばん効きます。予約に頼りすぎないこと。

- 予約する: 1日1本(朝または夜)
- 手動でやる: 他人の投稿への返信、自分の投稿への返信対応

---

## まとめ:あなたがやること

- [ ] X: Developer PortalでAPIキー4つを取得(権限は Read and Write)
- [ ] X: GitHubにSecretsを5つ登録(`X_POST_ENABLED=true` を忘れずに)
- [ ] X: Actionsからdry_runでテスト実行
- [ ] Instagram: カルーセルをPNG書き出し → Meta Business Suiteで2週間分予約
- [ ] Threads: 1週間分を予約 + 毎日の返信は手動
- [ ] ブログ: 作業なし(pushで自動公開)

Xが動き出せば、**週3回の投稿は完全に自動**になります。
