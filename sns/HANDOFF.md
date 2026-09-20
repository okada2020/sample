# Codex 引き継ぎ用

このディレクトリの下書きを、別のエージェント(Codex等)に渡して
X / Threads へ投入してもらうための仕様書。

---

## ファイル構成

| ファイル | 用途 |
|---|---|
| `x-drafts.md` | 人が読む用。カテゴリごとの解説つき |
| `x-drafts.json` | エージェントに渡す用。これが正 |
| `x-drafts.csv` | スプレッドシート / 投稿ツール取り込み用 |
| `HANDOFF.md` | このファイル |

`x-drafts.md` を編集したら `scripts/gen-drafts.py` を実行して
JSON と CSV を再生成すること。手で JSON を触らない。

---

## スキーマ (`x-drafts.json`)

```json
{
  "posts": [
    {
      "id": "A-1",
      "title": "逆算",
      "platform": "x",
      "category": "claim-check",
      "body": "投稿本文(そのまま投稿できる状態)",
      "weighted_length": 227,
      "limit": 280,
      "over_limit": false,
      "has_placeholder": false,
      "status": "draft"
    }
  ]
}
```

| フィールド | 意味 |
|---|---|
| `id` | 一意。`A/B/C/D` がカテゴリ、数字が連番 |
| `platform` | `x` または `threads` |
| `category` | `claim-check`(調査ベース) / `series-launch`(宣言) / `template`(穴埋め) / `threads-variant` |
| `body` | **加工せずそのまま投稿する**。改行も意味がある |
| `weighted_length` | X の重み付き文字数。日本語は1文字=2カウント |
| `limit` | X=280 / Threads=500 |
| `over_limit` | 現在は全件 false。編集したら再計算が必要 |
| `has_placeholder` | `◯` を含む。**実数値を埋めるまで投稿してはいけない** |
| `status` | `draft` / `scheduled` / `posted` |

---

## エージェントにやってほしいこと

### 前提として知っておくべきこと

- **X の公開 API に「下書き保存」のエンドポイントは無い。**
  下書きは X クライアント側の機能で、API からは作れない(要確認だが、
  少なくとも v2 の公開仕様には存在しない)。
  したがって取れる手段は次のどれか:

  | 方法 | 内容 | 向き |
  |---|---|---|
  | A. ブラウザ自動操作 | `x.com/compose/post` を開いて本文を入力し「下書き保存」を押す | **下書きを作りたいならこれ** |
  | B. API で直接投稿 | `POST /2/tweets` で即時投稿 | 確認せず出していい場合 |
  | C. 予約投稿 | X の投稿画面の予約機能を使う(A と同じくUI操作) | 時間指定したい場合 |

- Threads には公開の Publishing API があるが、こちらも下書き概念は無い想定。
  同様にブラウザ操作が確実。

### 指示(そのままコピペしてエージェントに渡す)

```
sns/x-drafts.json を読んでください。

やってほしいこと:
1. posts のうち platform == "x" かつ status == "draft" かつ
   has_placeholder == false のものだけを対象にする。
2. ブラウザ自動操作で x.com にログイン済みのセッションを使い、
   1件ずつ投稿画面を開いて body をそのまま貼り付け、「下書き保存」する。
   ※ 直接投稿はしないでください。必ず下書き止まりにすること。
3. body は絶対に書き換えない。改行・記号もそのまま。
   ハッシュタグや絵文字を勝手に足さない。
4. 1件成功するごとに、その post の status を "scheduled" に更新して
   x-drafts.json を保存する。途中で落ちても再開できるようにする。
5. 全部終わったら、成功した id の一覧と、失敗した id + 理由を報告する。

対象外にすること:
- has_placeholder が true のもの(◯ が未入力のテンプレート)
- category == "threads-variant"(Threads 用なので X には入れない)

注意:
- 本文中の数字は出典のある実データです。丸めたり言い換えたりしないでください。
- 「誰でも稼げる」等の断定表現を追加しないでください。意図的に避けています。
```

---

## 運用メモ

- `category: template` (C-1〜C-5) は `◯` を実数値に置換してから使う。
  置換せずに投稿すると意味不明になるので、`has_placeholder` で弾いている。
- 投稿順の推奨: `B-1` → `A-1` → `A-5` → `B-3` → 以降は A を混ぜつつ
  検証の進捗(C)を毎日挟む。
- A(調査ネタ)だけを続けると「批評する人」になる。3〜4本で B に移る。
