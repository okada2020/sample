# AIインフルエンサー「AIのショウさん」⌨️ 自動化システム

「生活とガジェット」ジャンルのAIインフルエンサー **AIのショウさん**(43歳・独身・総務事務)を、
ブログ「**暮らしのショートカット**」・X・Instagram・Threads(将来的にTikTok・楽天ROOM)で
運用するためのコンテンツ自動化パイプラインとサイト一式です。

> **現在は信頼構築期(`phase: trust`)。アフィリエイトリンクを貼らず、役立つ情報だけを発信中。**
> 収益化に切り替えるときは `config.yaml` の `phase` を `monetize` に変更する。

- ペルソナ設定: [docs/persona.md](docs/persona.md)
- 立ち上げ手順: [docs/roadmap.md](docs/roadmap.md)
- チャネル別戦略: [docs/strategy.md](docs/strategy.md)
- **記事の書き方・SEO・投稿の質: [docs/writing-seo.md](docs/writing-seo.md)**
- 遵守ルール: [docs/compliance.md](docs/compliance.md)
- アカウント一覧・追跡: [docs/accounts.md](docs/accounts.md)
- SNSプロフィール(コピペ用): [docs/sns-profiles.md](docs/sns-profiles.md)
- **投稿ストック: [docs/post-bank.md](docs/post-bank.md)**
- **予約投稿の設定: [docs/scheduling.md](docs/scheduling.md)**
- **予約カレンダー(2週間分の下書き): [docs/schedule-calendar.md](docs/schedule-calendar.md)**
- 市場リサーチ: [docs/research-2026-08.md](docs/research-2026-08.md)

## 仕組み

```
楽天ランキング/商品検索API ──→ 商品選定(自動)
        │                      ※1,000〜15,000円・レビュー条件でフィルタ
        ▼
Claude API ──→ ショウさんの口調でチャネル別コンテンツ生成(自動)
        │        ・X投稿3パターン ・Instagramキャプション
        │        ・Threads投稿 ・ブログ記事HTML
        │        (monetize期のみ)・楽天ROOM紹介文
        ▼
data/queue/ に投稿キュー出力(Markdown + JSON)
        │
        ├─→ X: src/post_x.py で自動投稿(任意)
        ├─→ ブログ: src/publish_post.py で site/ に記事化 → push → Cloudflare Pagesが自動デプロイ
        └─→ Instagram / Threads / 楽天ROOM: キューから人間がコピペ投稿(規約対応のため意図的に手動)
```

## セットアップ

### 1. キーの取得と設定

| 変数 | 取得先 | 必須 |
|---|---|---|
| `RAKUTEN_APP_ID` | [Rakuten Developers](https://webservice.rakuten.co.jp/) | ○ |
| `RAKUTEN_AFFILIATE_ID` | [楽天アフィリエイト](https://affiliate.rakuten.co.jp/) | ○ |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) | 推奨(無いとテンプレート生成) |
| `X_API_KEY` ほか4種 | [X Developer Portal](https://developer.x.com/) | X自動投稿時のみ |

`.env.example` を参考に環境変数を設定(GitHub Actionsで使う場合はリポジトリのSecretsに登録)。

### 2. ローカル実行

```bash
cd ai-influencer
pip install -r requirements.txt

DRY_RUN=true python -m src.pipeline   # キーなしで動作確認
python -m src.pipeline                # 本番: キュー生成
python -m src.post_x                  # X投稿(既定はドライラン。実投稿は X_POST_ENABLED=true)
python -m src.publish_post            # 最新キューの1商品目をブログ記事化
```

### 3. Cloudflare Pagesでサイト公開

サイト本体は `ai-influencer/site/`(ビルド不要の静的サイト)。

1. [Cloudflare](https://dash.cloudflare.com/)にログイン → **Workers & Pages → Create → Pages → Connect to Git**
2. このGitHubリポジトリを選択
3. 設定:
   - **Build command**: (空欄)
   - **Build output directory**: `ai-influencer/site`
4. Deploy。`https://<プロジェクト名>.pages.dev` で公開される(プロジェクト名は `kurashi-shortcut` を推奨)
5. 以後、pushするたびに自動デプロイ

### 4. GitHub Actionsでの日次実行

`.github/workflows/ai-influencer-daily.yml` が毎朝6時(JST)にキューを生成し、
Artifactとしてアップロードします(X自動投稿はSecretsに `X_POST_ENABLED=true` を入れると有効化)。

## 運用の1日の流れ(10〜15分)

1. 朝: Actionsがキューを生成 → Artifactの `queue_YYYY-MM-DD.md` を開く(または手元で実行)
2. 楽天ROOM: 紹介文をコピペして2〜3件投稿+いいね回り
3. Instagram: キャプションで1件投稿
4. X: 自動投稿済み(または手動コピペ)
5. 週2〜3回: `python -m src.publish_post` → 記事を確認・修正 → push でブログ公開
