/* =====================================================================
 * site.js  ―  サイト全体の設定（マッチングアプリ比較）
 * ===================================================================== */
window.SITE = {
  name:        "マッチングアプリ診断ナビ",
  tagline:     "目的別に、あなたに合う1本が3分で分かる",
  listName:    "マッチングアプリおすすめランキング",
  footerNote:  "掲載している料金・会員数は編集時点の情報です。最新かつ正確な内容は各公式サイトを必ずご確認ください。18歳未満（高校生を含む）は利用できません。",
  serviceDesc: function (s) { return s.name + "の料金・会員数・年齢層・安全性を利用者目線で解説。" + s.catch; },
  description: "主要マッチングアプリを目的・年齢層・料金で比較。3問の診断で、恋活・婚活それぞれに合うアプリが分かります。",

  // Cloudflare Pages の無料URL。独自ドメインに変えるときもここだけ書き換えれば
  // canonical・OGP・sitemap.xml がまとめて追従します。
  baseUrl:     "https://matching-navi.pages.dev/",
  logoText:    "マッチング診断ナビ",
  copyright:   "マッチングアプリ診断ナビ",

  /* ---- 運営者情報（E-E-A-T：検索評価に直結するので必ず実名情報に） -- */
  author: {
    name:    "運営者名をここに",
    role:    "主要マッチングアプリを実際に利用して比較・検証",
    contact: "your-mail@example.com"
  },

  prLabel: "本ページはプロモーション（アフィリエイト広告）を含みます",
  ga4Id: "",
  demoMode: true,

  /* ---- 表示項目の定義 ------------------------------------------------
   * get(s, h) の h は書式ヘルパー：h.yen / h.num / h.esc / h.effective
   * ------------------------------------------------------------------ */
  fields: {
    spec: [
      { label: "男性の月額", cls: "hl", get: function (s, h) { return h.yen(s.price) + "〜"; } },
      { label: "女性の月額", get: function (s, h) { return s.priceFemale === 0 ? "無料" : h.yen(s.priceFemale) + "〜"; } },
      { label: "会員数",     get: function (s, h) { return "約" + h.num(s.members) + "万人"; } },
      { label: "主な年齢層", get: function (s, h) { return h.esc(s.ageRange); } },
      { label: "主な目的",   get: function (s, h) { return h.esc(s.purpose); } },
      { label: "本人確認",   get: function (s) { return s.idCheck ? "あり" : "なし"; } },
      { label: "登録",       get: function (s) { return "無料（メッセージ交換から課金）"; } }
    ],

    quizSpec: [
      { label: "男性の月額", cls: "hl", get: function (s, h) { return h.yen(s.price) + "〜"; } },
      { label: "女性の月額", get: function (s, h) { return s.priceFemale === 0 ? "無料" : h.yen(s.priceFemale) + "〜"; } },
      { label: "主な目的",   get: function (s, h) { return h.esc(s.purpose); } },
      { label: "主な年齢層", get: function (s, h) { return h.esc(s.ageRange); } }
    ],

    table: [
      { label: "男性の月額", get: function (s, h) { return '<span class="price">' + h.yen(s.price) + "</span>"; } },
      { label: "女性の月額", get: function (s, h) { return s.priceFemale === 0 ? '<span class="yes">無料</span>' : h.yen(s.priceFemale); } },
      { label: "会員数",     get: function (s, h) { return "約" + h.num(s.members) + "万人"; } },
      { label: "主な年齢層", get: function (s, h) { return h.esc(s.ageRange); } },
      { label: "主な目的",   get: function (s, h) { return h.esc(s.purpose); } },
      { label: "本人確認",   get: function (s) { return s.idCheck ? '<span class="yes">◯</span>' : '<span class="no">×</span>'; } },
      { label: "無料でできること", get: function (s, h) { return h.esc(s.freeScope); } }
    ]
  },

  /* ---- 比較表の絞り込み ----------------------------------------------
   * 目的と年齢層で絞れるようにする（services.js の filterTags を使用）
   * ------------------------------------------------------------------ */
  filters: {
    values: function (s) { return s.filterTags; }
  },

  /* ---- 料金シミュレーター --------------------------------------------
   * マッチングアプリは「何か月使うか」で総額が大きく変わり、
   * 長期プランほど月あたりが安くなる。そこを可視化する。
   * ------------------------------------------------------------------ */
  simulator: {
    enabled: true,
    question: "何か月くらい使う予定ですか？",
    choices: [1, 3, 6, 12],
    suffix: "か月",
    unit: "/月",
    // 契約期間が長いほど割引が効く。月あたりの実質額を返す
    calc: function (s, months) {
      var rate = months >= 12 ? s.discount12 : months >= 6 ? s.discount6
               : months >= 3 ? s.discount3 : 1;
      return Math.round(s.price * rate);
    },
    lead: function (n, name, amount) {
      return n + "か月使う場合、月あたりが最も安いのは<b>" + name + "</b>で<b>" + amount + "</b>です。";
    },
    note: "男性料金の目安です。長期プランは一括前払いのため、総額は「月あたり × 契約月数」になります。" +
          "女性は多くのアプリで無料です。"
  },

  stickyCta: {
    enabled: true,
    serviceId: "pairs",
    text: "無料で登録して相手を探す"
  }
};
