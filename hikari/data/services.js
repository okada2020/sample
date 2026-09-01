/* =====================================================================
 * services.js  ―  掲載回線（＝アフィリエイト案件）のデータ
 * ---------------------------------------------------------------------
 * ★★ 公開前に必ずやること ★★
 *  1. url に ASP（A8.net等）の発行リンクを貼る
 *     未提携の間は url を空文字 "" のままにしてください。
 *     officialUrl（公式サイト）へのリンクに自動で切り替わります。
 *  2. 料金・キャッシュバック額を公式サイトで検証して修正する
 *     キャッシュバックは窓口や時期で大きく変わります。
 *     貼ったリンクの窓口の条件と、必ず一致させてください。
 *  3. reviews は「実際に集めた声」に差し替える（無い間は [] のまま）
 *  4. data/site.js の demoMode を false にする
 *
 *  priceHouse / priceMansion … 戸建て / マンションの月額（税込）
 *  construction … 工事費。キャンペーンで実質無料なら 0
 *  cashback     … キャッシュバック額（円）
 *  filterTags   … 比較表の絞り込みボタンに使う値
 *
 *  ↓ 以下は構造を確認するためのサンプル値です。実数値ではありません。
 * ===================================================================== */
window.SERVICES = [
  {
    id: "gmo-hikari",
    name: "GMOとくとくBB光",
    rank: 1,
    badge: "縛りなしで最安級",
    catch: "契約期間の縛りがないのに実質月額が安い。迷ったらまずここ",
    color: "#0f172a",
    accent: "#22d3ee",

    priceHouse: 4818, priceMansion: 3773,
    construction: 0, cashback: 30000,
    speed: "1Gbps",
    term: "縛りなし",
    setDiscount: "なし（格安SIM利用者向き）",
    campaign: "キャッシュバック＋工事費実質無料",

    score: 4.6,
    scores: { "実質料金": 4.9, "速度": 4.3, "契約の自由度": 5.0, "サポート": 4.0, "キャンペーン": 4.5 },

    pros: [
      "契約期間の縛りと解約違約金がなく、いつでもやめられる",
      "月額自体が安く、キャッシュバックを含めた実質月額は最安級",
      "スマホのセット割に依存しないため、格安SIM利用者に最適"
    ],
    cons: [
      "大手キャリアのスマホセット割は対象外",
      "キャッシュバックの受け取りに申請手続きが必要"
    ],

    recommendedFor: ["格安SIM", "縛りたくない", "とにかく安く"],
    ctaText: "キャンペーンを確認する",
    url: "",
    officialUrl: "https://gmobb.jp/service/gmohikari/",
    reviews: []
  },

  {
    id: "docomo-hikari",
    name: "ドコモ光",
    rank: 2,
    badge: "ドコモユーザーなら",
    catch: "ドコモスマホが毎月割引。対応エリアの広さも全国級",
    color: "#111827",
    accent: "#f472b6",

    priceHouse: 5720, priceMansion: 4400,
    construction: 0, cashback: 25000,
    speed: "1Gbps",
    term: "2年",
    setDiscount: "ドコモ：スマホ1台あたり最大1,100円/月",
    campaign: "キャッシュバック＋工事費無料",

    score: 4.4,
    scores: { "実質料金": 4.0, "速度": 4.2, "契約の自由度": 3.8, "サポート": 4.5, "キャンペーン": 4.4 },

    pros: [
      "ドコモスマホとのセット割で家族全員の通信費が下がる",
      "フレッツ回線なので対応エリアが広く、引っ越しにも強い",
      "プロバイダを選べる"
    ],
    cons: [
      "ドコモ以外のスマホだと割引がなく、割高になる",
      "2年契約で、更新月以外の解約に費用がかかる"
    ],

    recommendedFor: ["ドコモのスマホ", "家族で使う"],
    ctaText: "キャンペーンを確認する",
    url: "",
    officialUrl: "https://www.docomo.ne.jp/hikari/",
    reviews: []
  },

  {
    id: "softbank-hikari",
    name: "ソフトバンク光",
    rank: 3,
    badge: "SB・ワイモバなら",
    catch: "ソフトバンク・ワイモバイルのスマホが毎月割引",
    color: "#101828",
    accent: "#a3e635",

    priceHouse: 5720, priceMansion: 4180,
    construction: 0, cashback: 36000,
    speed: "1Gbps",
    term: "2年",
    setDiscount: "SB：最大1,100円/月、ワイモバ：最大1,650円/月",
    campaign: "キャッシュバック＋他社違約金の還元（上限・条件あり）",

    score: 4.2,
    scores: { "実質料金": 4.1, "速度": 4.0, "契約の自由度": 3.8, "サポート": 4.2, "キャンペーン": 4.6 },

    pros: [
      "ワイモバイルでもセット割が効く数少ない回線",
      "他社の解約違約金を負担するキャンペーンがあり、乗り換えやすい",
      "開通までの間、Wi-Fi機器を無料で借りられる"
    ],
    cons: [
      "セット割にはオプション加入が必要で、条件を確認しないと割高になる",
      "混雑時間帯の速度は環境による差が大きい"
    ],

    recommendedFor: ["ソフトバンクのスマホ", "ワイモバイル"],
    ctaText: "キャンペーンを確認する",
    url: "",
    officialUrl: "https://www.softbank.jp/internet/sbhikari/",
    reviews: []
  },

  {
    id: "nuro-hikari",
    name: "NURO光",
    rank: 4,
    badge: "速度重視なら",
    catch: "下り最大2Gbps。オンラインゲームや在宅ワークの本命",
    color: "#0d1424",
    accent: "#38bdf8",

    priceHouse: 5200, priceMansion: 3850,
    construction: 0, cashback: 45000,
    speed: "2Gbps",
    term: "3年",
    setDiscount: "ソフトバンク：最大1,100円/月",
    campaign: "高額キャッシュバック＋工事費実質無料",

    score: 4.1,
    scores: { "実質料金": 4.2, "速度": 5.0, "契約の自由度": 3.2, "サポート": 3.8, "キャンペーン": 4.7 },

    pros: [
      "標準プランで下り最大2Gbpsと、速度面では頭ひとつ抜けている",
      "キャッシュバック額が大きく、実質月額は見た目より安い",
      "独自回線のため、夜間の混雑に強い傾向"
    ],
    cons: [
      "提供エリアが限られ、申し込めない地域がある",
      "開通工事が2回必要で、利用開始まで時間がかかることがある"
    ],

    recommendedFor: ["速度重視", "オンラインゲーム", "在宅ワーク", "ソフトバンクのスマホ"],
    ctaText: "エリアを確認する",
    url: "",
    officialUrl: "https://www.nuro.jp/hikari/",
    reviews: []
  },

  {
    id: "au-hikari",
    name: "auひかり",
    rank: 5,
    badge: "au・UQなら",
    catch: "独自回線で混雑に強い。au・UQモバイルのスマホが割引",
    color: "#12131f",
    accent: "#fb923c",

    priceHouse: 5610, priceMansion: 4180,
    construction: 0, cashback: 40000,
    speed: "1Gbps",
    term: "3年",
    setDiscount: "au：最大1,100円/月、UQ：最大1,100円/月",
    campaign: "高額キャッシュバック＋他社違約金を還元",

    score: 4.0,
    scores: { "実質料金": 4.2, "速度": 4.5, "契約の自由度": 3.2, "サポート": 4.0, "キャンペーン": 4.5 },

    pros: [
      "独自回線のため、フレッツ系より混雑に強い傾向",
      "au・UQモバイルとのセット割で家族の通信費が下がる",
      "キャッシュバック額が大きい"
    ],
    cons: [
      "戸建てタイプは提供エリア外の地域がある（関西・東海の一部など）",
      "解約時に撤去工事費がかかる場合がある"
    ],

    recommendedFor: ["auのスマホ", "UQモバイル", "家族で使う"],
    ctaText: "キャンペーンを確認する",
    url: "",
    officialUrl: "https://www.au.com/internet/auhikari/",
    reviews: []
  },

  {
    id: "rakuten-hikari",
    name: "楽天ひかり",
    rank: 6,
    badge: "楽天経済圏なら",
    catch: "楽天モバイルと合わせて使う人向け。SPUの倍率も上がる",
    color: "#131022",
    accent: "#f43f5e",

    priceHouse: 5280, priceMansion: 4180,
    construction: 19800, cashback: 0,
    speed: "1Gbps",
    term: "2年",
    setDiscount: "楽天モバイル併用で特典あり",
    campaign: "時期によりキャンペーンあり",

    score: 3.7,
    scores: { "実質料金": 3.5, "速度": 3.8, "契約の自由度": 3.8, "サポート": 3.6, "キャンペーン": 3.5 },

    pros: [
      "楽天モバイル利用者はポイント還元の恩恵が大きい",
      "楽天市場での買い物のポイント倍率が上がる",
      "フレッツ回線なので対応エリアが広い"
    ],
    cons: [
      "キャッシュバックが無く、工事費もかかるため実質月額は高くなりがち",
      "楽天モバイルを使っていないなら選ぶ理由が薄い"
    ],

    recommendedFor: ["楽天モバイル"],
    ctaText: "キャンペーンを確認する",
    url: "",
    officialUrl: "https://network.mobile.rakuten.co.jp/hikari/",
    reviews: []
  }
];

/* 絞り込みタグ（スマホのキャリアで選ぶのが最も実用的） */
window.SERVICES.forEach(function (s) {
  s.filterTags = {
    "gmo-hikari":      ["格安SIM・セット割不要", "縛りなし", "工事費実質無料"],
    "docomo-hikari":   ["ドコモ", "工事費実質無料", "エリアが広い"],
    "softbank-hikari": ["ソフトバンク", "ワイモバイル", "工事費実質無料", "エリアが広い"],
    "nuro-hikari":     ["ソフトバンク", "速度重視", "工事費実質無料"],
    "au-hikari":       ["au", "UQモバイル", "速度重視", "工事費実質無料"],
    "rakuten-hikari":  ["楽天モバイル", "エリアが広い"]
  }[s.id];
});
