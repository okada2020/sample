/* =====================================================================
 * site.js  ―  サイト全体の設定
 * ---------------------------------------------------------------------
 * ここを書き換えるだけでサイト名・配色・計測タグ・法定表記が変わります。
 * ===================================================================== */
window.SITE = {
  /* ---- 基本情報 ---------------------------------------------------- */
  name:        "VOD比較ナビ",
  tagline:     "動画配信サービスの「結局どれ？」を3分で解決",
  listName:    "動画配信サービスおすすめランキング",   // 構造化データのランキング名
  footerNote:  "掲載している料金・配信状況は編集時点の情報です。最新かつ正確な内容は各公式サイトを必ずご確認ください。",
  // サービス詳細ページの meta description
  serviceDesc: function (s) { return s.name + "の料金・作品数・無料体験を利用者目線で解説。" + s.catch; },
  description: "主要7社の動画配信サービス（VOD）を料金・作品数・無料体験で徹底比較。あなたに合う1本が3問の診断で分かります。",
  // Cloudflare Pages の無料URL（商用利用可）。
  // 独自ドメインに変えるときもここだけ書き換えれば
  // canonical・OGP・sitemap.xml がまとめて追従します。
  baseUrl:     "https://vod-navi.pages.dev/",
  logoText:    "VOD比較ナビ",
  copyright:   "VOD比較ナビ",

  /* ---- 運営者情報（E-E-A-T：検索評価に直結するので必ず実名情報に） -- */
  author: {
    name:    "運営者名をここに",
    role:    "※ 実際の経歴を記載してください（検証方法を具体的に書くほど信頼されます）",
    contact: "your-mail@example.com"
  },

  /* ---- ステマ規制（景表法）対応の表記 ------------------------------
   * 2023年10月〜、広告であることを隠すと違法（措置命令の対象）です。
   * 全ページの先頭に必ず出す運用にしています。文言変更は可、削除は非推奨。
   * ------------------------------------------------------------------ */
  prLabel: "本ページはプロモーション（アフィリエイト広告）を含みます",

  /* ---- 計測 ---------------------------------------------------------
   * GA4測定ID を入れるとタグが自動で読み込まれ、
   * アフィリンクのクリックが「affiliate_click」イベントで送信されます。
   * 空文字のままなら計測タグは読み込まれません（開発中はこのままでOK）。
   * ------------------------------------------------------------------ */
  ga4Id: "",

  /* ---- サンプルデータ警告バー ---------------------------------------
   * true の間は「サンプルです」の帯が出ます。
   * 実データ・実ASPリンクに差し替えたら false にしてください。
   * ------------------------------------------------------------------ */
  demoMode: true,


  /* ---- 表示項目の定義 ------------------------------------------------
   * カード内の仕様表・比較表の列を、ここで自由に決められます。
   * 別ジャンルのサイトを作るときは、この定義を書き換えるだけで
   * 表示される項目が入れ替わります（render.js は触りません）。
   *
   * get(s, h) の s は services.js の1件、h は書式ヘルパーです。
   *   h.yen(1000) → "¥1,000"   h.num(30000) → "30,000"
   *   h.esc(文字列) → HTMLとして安全な文字列
   *   h.effective(s) → 月額からポイント還元を引いた実質額
   * ------------------------------------------------------------------ */
  fields: {
    // サービスカード内の仕様表
    spec: [
      { label: "月額（税込）", cls: "hl", get: function (s, h) { return h.yen(s.price); } },
      { label: "ポイント還元後", when: function (s) { return !!s.points; },
        get: function (s, h) {
          return "<b>実質" + h.yen(h.effective(s)) + '</b> <span class="mini">毎月' +
                 h.num(s.points) + "円分付与</span>";
        } },
      { label: "無料体験",   get: function (s) { return s.trialDays > 0 ? s.trialDays + "日間" : "なし"; } },
      { label: "配信作品数", get: function (s, h) { return "約" + h.num(s.works) + "本"; } },
      { label: "同時視聴",   get: function (s) { return s.simultaneous + "台"; } },
      { label: "画質",       get: function (s, h) { return h.esc(s.quality); } },
      { label: "得意ジャンル", get: function (s, h) { return h.esc(s.genres.slice(0, 4).join("・")); } }
    ],

    // 診断結果に出す要約（項目を絞る）
    quizSpec: [
      { label: "月額", cls: "hl", get: function (s, h) { return h.yen(s.price); } },
      { label: "実質月額", when: function (s) { return !!s.points; },
        get: function (s, h) { return "<b>" + h.yen(h.effective(s)) + "</b>"; } },
      { label: "無料体験", get: function (s) { return s.trialDays > 0 ? s.trialDays + "日間" : "なし"; } },
      { label: "同時視聴", get: function (s) { return s.simultaneous + "台"; } }
    ],

    // 比較表の列
    table: [
      { label: "月額（税込）", get: function (s, h) { return '<span class="price">' + h.yen(s.price) + "</span>"; } },
      { label: "実質月額",     get: function (s, h) { return s.points ? "<b>" + h.yen(h.effective(s)) + "</b>" : h.yen(s.price); } },
      { label: "無料体験",     get: function (s) { return s.trialDays > 0 ? '<span class="yes">' + s.trialDays + "日間</span>" : '<span class="no">なし</span>'; } },
      { label: "作品数",       get: function (s, h) { return "約" + h.num(s.works) + "本"; } },
      { label: "同時視聴",     get: function (s) { return s.simultaneous + "台"; } },
      { label: "ダウンロード", get: function (s) { return s.download ? '<span class="yes">◯</span>' : '<span class="no">×</span>'; } },
      { label: "画質",         get: function (s, h) { return h.esc(s.quality); } },
      { label: "得意ジャンル", get: function (s, h) { return h.esc(s.genres.slice(0, 3).join("・")); } }
    ]
  },

  /* ---- 比較表の絞り込み ----------------------------------------------
   * 絞り込みボタンに使う値を返します。空配列や未定義なら絞り込みは出ません。
   * ------------------------------------------------------------------ */
  filters: {
    values: function (s) { return s.genres; }
  },

  /* ---- 料金シミュレーター --------------------------------------------
   * 使わないジャンルでは enabled: false にしてください
   * （その場合、ページ側の #simulator は空のままになります）。
   * ------------------------------------------------------------------ */
  simulator: {
    enabled: true,
    question: "何人で使いますか？",
    choices: [1, 2, 3, 4],
    suffix: "人",
    unit: "/人",
    // 選択肢の値ごとに、1件あたりの金額を返す
    calc: function (s, n, h) {
      return Math.round(h.effective(s) / Math.min(n, s.simultaneous));
    },
    lead: function (n, name, amount) {
      return n + "人で使う場合、1人あたりの負担は<b>" + name + "</b>が最安で<b>月" + amount + "</b>です。";
    },
    note: "計算式：（月額 − 毎月付与されるポイント）÷ min(利用人数, 同時視聴台数)。" +
          "ポイントを毎月使い切った場合の試算です。"
  },

  /* ---- 追従CTA（スマホ下部に常時出るボタン。CVRに最も効く要素） ----- */
  stickyCta: {
    enabled: true,
    serviceId: "u-next",           // 一番売りたい案件のID
    text: "今すぐ31日間無料で試す"
  }
};
