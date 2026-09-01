# VOD比較アフィリエイトサイト

動画配信サービス（VOD）比較・ランキング型のアフィリエイトサイトです。
**ビルド不要の静的サイト**で、掲載内容はすべて `data/` 配下のファイルから自動生成されます。

---

## 1. 公開までの手順（最短5ステップ）

| # | やること | 触るファイル |
|---|---|---|
| 1 | ASPで案件を提携し、発行された広告リンクを `url` に貼る | `data/services.js` |
| 2 | 料金・作品数などの数値を公式サイトで確認して修正する | `data/services.js` |
| 3 | サイト名・ドメイン・運営者情報を書き換える | `data/site.js` |
| 4 | GA4測定ID（`G-XXXXXXX`）を入れる | `data/site.js` |
| 5 | `demoMode: false` にして警告バーを消す | `data/site.js` |

> `demoMode` が `true` の間は「サンプルデータで表示中」の黄色い帯が出ます。
> **これが出たまま公開しないでください。**

`canonical` と `og:url`、`robots.txt`、`sitemap.xml` に `https://example.com/` が
残っているので、公開ドメインへ一括置換してください。

```bash
grep -rl "example.com" . | xargs sed -i 's#https://example.com/#https://あなたのドメイン/#g'
```

## 2. ディレクトリ構成

```
affiliate/
├─ index.html        トップ（診断＋ランキング＋比較表＋FAQ）
├─ compare.html      全社比較表（ジャンル絞り込み）
├─ service.html      サービス詳細（?id=u-next のように使う）
├─ articles.html     記事一覧
├─ article.html      記事詳細（?id=how-to-choose のように使う）
├─ about.html        運営者情報（検索評価に効くので必ず実情報へ）
├─ privacy.html      プライバシーポリシー・免責事項
├─ data/
│   ├─ site.js       サイト設定（名称・配色・計測・追従CTA）
│   ├─ services.js   ★掲載案件。ここを差し替えれば別ジャンルにも転用可
│   └─ content.js    診断・FAQ・記事本文
├─ css/style.css     全ページ共通スタイル
├─ js/app.js         データからHTMLを組み立てる描画エンジン
├─ robots.txt / sitemap.xml / favicon.svg
```

**サービスを1社追加したい**→ `data/services.js` の配列に1件足すだけで、
ランキング・比較表・診断・詳細ページ・サイトマップのすべてに反映されます。

## 3. 売るために組み込んである仕掛け

| 仕掛け | 場所 | 狙い |
|---|---|---|
| 3問の診断チャート | トップ最上部 | 「どれを選ぶか」の意思決定を代行し、迷いによる離脱を止める |
| 追従CTAバー | スマホ全ページ下部 | どこまで読んでも1タップで申込に行ける（300pxスクロールで出現） |
| ランキングカード | トップ／比較ページ | 1位を金枠で強調し、視線を最も売りたい案件へ集める |
| 比較表 | トップ／比較ページ | 「他と比べたい」欲求をサイト内で完結させ、離脱を防ぐ |
| 記事内CTAボックス | 記事の本文中 | 読了を待たず、納得したその場で申込へ渡す |
| デメリットの明記 | 各カード | 短所を書くほうが信頼され、結果的に成約率が上がる |
| キャンペーン帯 | 各カード | 「今だけ」を可視化して先延ばしを防ぐ |

### CTAの色を変えるときの注意
`css/style.css` の `--cta` は、ページ内で**最も明度・彩度が高い色**である必要があります。
サイトの基調色に馴染ませると押されなくなるため、浮くくらいで正解です。

## 4. 計測

`data/site.js` に GA4 の測定IDを入れると、タグが自動で読み込まれ、
アフィリエイトリンクのクリックが次のイベントで送信されます。

- `affiliate_click` … `service_id` / `service_name` / `position` / `page_path`
- `quiz_complete` … `result_service`

`position` には `ranking_1` `table` `sticky` `quiz_result` `in_article` が入るので、
**どの配置のボタンが稼いでいるか**をGA4で比較し、効かない配置を削れます。

## 5. 法令・規約まわり（未対応で公開すると危険）

- **ステマ規制（景表法）**：全ページ上部に「本ページはプロモーションを含みます」を常時表示しています。文言変更は可、削除は非推奨です。
- **アフィリエイトリンク**：`rel="sponsored nofollow noopener"` を自動付与しています（Googleの要件）。手書きでリンクを足す場合も必ず付けてください。
- **口コミ**：`reviews` はサンプル文です。**体験談の捏造は景表法違反**になります。実際に集めた声に差し替えるまでは `reviews: []` にしてください。
- **数値の裏取り**：料金・作品数は変動します。公式サイトで確認し、更新日を `index.html` の「最終更新」に反映してください。

## 6. ローカルで確認する

`data/*.js` はJavaScriptとして読み込むため、`file://` で直接開いても動きます。
念のためサーバー経由で確認する場合は：

```bash
cd affiliate
python3 -m http.server 8000
# → http://localhost:8000/
```

## 7. 別ジャンルへの転用

`data/services.js` の項目名（`price` / `trialDays` / `works` / `simultaneous` …）を
扱う商材に合わせて読み替え、`js/app.js` の `ROWS` と `serviceCard()` 内の
`<table class="spec">` の行を書き換えれば、そのまま別ジャンルの比較サイトになります。
