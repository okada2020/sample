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
