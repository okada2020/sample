/* =====================================================================
 * site.js  ―  サイト全体の設定（光回線比較）
 * ===================================================================== */
window.SITE = {
  name:        "光回線 実質料金ナビ",
  tagline:     "キャッシュバックと工事費まで込みの「本当の月額」で比べる",
  description: "主要6社の光回線を実質月額で比較。キャッシュバック・工事費・スマホセット割を差し引いた本当の負担額が分かります。",

  baseUrl:     "https://hikari-navi.pages.dev/",
  logoText:    "光回線 実質料金ナビ",
  copyright:   "光回線 実質料金ナビ",

  author: {
    name:    "運営者名をここに",
    role:    "主要光回線を契約・乗り換えして比較・検証",
    contact: "your-mail@example.com"
  },

  prLabel: "本ページはプロモーション（アフィリエイト広告）を含みます",
  ga4Id: "",
  demoMode: true,

  /* ---- 表示項目の定義 ------------------------------------------------
   * 光回線は「月額」だけ見ても比較になりません。
   * キャッシュバックと工事費を含めた実質月額を主役に据えています。
   * ------------------------------------------------------------------ */
  fields: {
    spec: [
      { label: "実質月額（戸建て）", cls: "hl",
        get: function (s, h) { return h.yen(realMonthly(s, "戸建て")) + '<span class="mini">（月額' + h.yen(s.priceHouse) + "）</span>"; } },
      { label: "実質月額（マンション）", cls: "hl",
        get: function (s, h) { return h.yen(realMonthly(s, "マンション")) + '<span class="mini">（月額' + h.yen(s.priceMansion) + "）</span>"; } },
      { label: "キャッシュバック", get: function (s, h) { return s.cashback ? h.yen(s.cashback) : "なし"; } },
      { label: "工事費",   get: function (s, h) { return s.construction === 0 ? "実質無料" : h.yen(s.construction); } },
      { label: "最大速度", get: function (s, h) { return h.esc(s.speed); } },
      { label: "契約期間", get: function (s, h) { return h.esc(s.term); } },
      { label: "スマホセット割", get: function (s, h) { return h.esc(s.setDiscount); } }
    ],

    quizSpec: [
      { label: "実質月額（戸建て）", cls: "hl", get: function (s, h) { return h.yen(realMonthly(s, "戸建て")); } },
      { label: "実質月額（マンション）", get: function (s, h) { return h.yen(realMonthly(s, "マンション")); } },
      { label: "スマホセット割", get: function (s, h) { return h.esc(s.setDiscount); } },
      { label: "契約期間", get: function (s, h) { return h.esc(s.term); } }
    ],

    table: [
      { label: "実質月額（戸建て）", get: function (s, h) { return '<span class="price">' + h.yen(realMonthly(s, "戸建て")) + "</span>"; } },
      { label: "実質月額（マンション）", get: function (s, h) { return '<span class="price">' + h.yen(realMonthly(s, "マンション")) + "</span>"; } },
      { label: "月額（戸建て）", get: function (s, h) { return h.yen(s.priceHouse); } },
      { label: "キャッシュバック", get: function (s, h) { return s.cashback ? '<span class="yes">' + h.yen(s.cashback) + "</span>" : '<span class="no">なし</span>'; } },
      { label: "工事費",   get: function (s, h) { return s.construction === 0 ? '<span class="yes">実質無料</span>' : h.yen(s.construction); } },
      { label: "最大速度", get: function (s, h) { return h.esc(s.speed); } },
      { label: "契約期間", get: function (s, h) { return h.esc(s.term); } },
      { label: "スマホセット割", get: function (s, h) { return h.esc(s.setDiscount); } }
    ]
  },


  /* ---- 1タップ選択パネル（ヒーローに表示） ---------------------------
   * 光回線はスマホのセット割で答えがほぼ決まるため、
   * 3問の診断ではなく「キャリアを1タップ」で即答する構成にしています。
   * ------------------------------------------------------------------ */
  picker: {
    question: "お使いのスマホを選ぶだけで、合う回線が出ます",
    options: [
      { label: "ドコモ",           sub: "ahamo以外",        tags: ["ドコモのスマホ", "家族で使う"] },
      { label: "au・UQ",           sub: "povo以外",         tags: ["auのスマホ", "UQモバイル"] },
      { label: "ソフトバンク",     sub: "ワイモバ含む",     tags: ["ソフトバンクのスマホ", "ワイモバイル"] },
      { label: "楽天モバイル",     sub: "",                 tags: ["楽天モバイル"] },
      { label: "格安SIM・その他",  sub: "ahamo/povo/LINEMO", tags: ["格安SIM", "とにかく安く", "縛りたくない"] }
    ]
  },

  filters: {
    values: function (s) { return s.filterTags; }
  },

  /* ---- 実質料金シミュレーター ----------------------------------------
   * 光回線は月額の安さと、実際に払う額の順位がよく入れ替わります。
   * 住居タイプを選ぶと、工事費とキャッシュバックを含めた実質月額を出します。
   * ------------------------------------------------------------------ */
  simulator: {
    enabled: true,
    question: "お住まいはどちらですか？",
    choices: ["マンション", "戸建て"],
    suffix: "",
    unit: "/月",
    calc: function (s, type) { return realMonthly(s, type); },
    lead: function (type, name, amount) {
      return type + "の場合、実質月額が最も安いのは<b>" + name + "</b>で<b>" + amount + "</b>です。";
    },
    note: "計算式：（月額 × 36か月 ＋ 工事費 − キャッシュバック）÷ 36か月。" +
          "3年間利用した場合の1か月あたりの負担額です。スマホのセット割は含みません。"
  },

  stickyCta: {
    enabled: true,
    serviceId: "gmo-hikari",
    text: "キャンペーンを確認する"
  }
};

/* 実質月額＝（月額×36 ＋ 工事費 − キャッシュバック）÷ 36
   光回線は工事費とキャッシュバックの差が大きく、月額だけでは比較になりません。 */
function realMonthly(s, type) {
  var price = type === "戸建て" ? s.priceHouse : s.priceMansion;
  return Math.max(0, Math.round((price * 36 + s.construction - s.cashback) / 36));
}
