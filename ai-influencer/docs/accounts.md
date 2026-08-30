# アカウント一覧と追跡

## 運用中のアカウント

| チャネル | URL | ハンドル |
|---|---|---|
| X | https://x.com/aishow_yoshioka | `@aishow_yoshioka` |
| Instagram | https://www.instagram.com/aishow_yoshioka/ | `@aishow_yoshioka` |
| Threads | https://www.threads.com/@aishow_yoshioka | `@aishow_yoshioka` |
| ブログ | https://kurashi-shortcut.pages.dev | — |
| A8.net | 登録済み(副サイトとしてブログを登録) | — |

3チャネルすべてハンドルを `aishow_yoshioka` に統一済み。

## 各アカウントにブログリンクを設定する

**設定するURL(共通):**
```
https://kurashi-shortcut.pages.dev
```
※Cloudflare Pagesで発行された実際のURLに読み替えてください。
 プロジェクト名が別名になった場合はそちらを使用。

### X
1. プロフィール → **プロフィールを編集**
2. **ウェブサイト** 欄に上のURLを貼る → 保存
3. あわせて **場所** 欄に `デスクと台所のあいだ` を入れるとキャラが立つ

### Instagram
1. プロフィール → **プロフィールを編集**
2. **リンク** → **外部リンクを追加** → URLを貼る
3. リンクのタイトルは `暮らしのショートカット` にする(URLそのままより押されやすい)
4. 自己紹介の末尾は `↓くわしくはブログで` にしてあるので、リンクへの導線が繋がる

### Threads
1. プロフィール → **プロフィールを編集**
2. **リンク** 欄にURLを貼る → 完了
   ※ThreadsはInstagramと**リンクが独立**しているので、両方に設定が必要

### 設定後の確認
3アカウントともプロフィールを開いて、リンクが青くなっているか・タップで開くかを確認する。
Instagramはリンクが1つでも「リンク」表示になるので、押せる状態かを必ず見ること。

## 追跡のやり方

週1回、各アカウントのフォロワー数を見て打ち込むだけ(所要1分)。

```bash
cd ai-influencer
python -m src.track_metrics record x 120
python -m src.track_metrics record instagram 45
python -m src.track_metrics record threads 38
python -m src.track_metrics report          # 成長レポート
python -m src.track_metrics report --weeks 8
```

- ブログの記事数は `site/posts/` から**自動計測**されるので手入力不要
- 記録は `data/metrics.csv` に貯まる(gitignore対象外なので履歴が残る)
- 3ヶ月目標(strategy.md準拠): X 1,000 / Instagram 800 / Threads 600 / ブログ記事 30本

## いま見るべき数字

フォロワー数より先に、**投稿を止めていないか**を見る。
レポートで「前回から変化なし」が出たら、たいてい投稿が止まっている。

伸びない原因の9割はネタ切れによる停止なので、
`data/queue/` のキューと `docs/post-bank.md` を切らさないことが最優先。
