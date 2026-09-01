/* =====================================================================
 * services.js  ―  掲載アプリ（＝アフィリエイト案件）のデータ
 * ---------------------------------------------------------------------
 * ★★ 公開前に必ずやること ★★
 *  1. url に ASP（A8.net等）の発行リンクを貼る
 *     未提携の間は url を空文字 "" のままにしてください。
 *     officialUrl（公式サイト）へのリンクに自動で切り替わり、
 *     広告リンクではないため rel="sponsored" も付きません。
 *  2. 料金・会員数・年齢層を公式サイトで検証して修正する
 *  3. reviews は「実際に集めた声」に差し替える
 *     体験談の捏造は景表法違反です。集まるまでは reviews: [] に。
 *  4. data/site.js の demoMode を false にする
 *
 *  discount3 / discount6 / discount12 … 長期プランの割引率（1か月を1.0とする）
 *  filterTags … 比較表の絞り込みボタンに使う値
 *
 *  ↓ 以下は構造を確認するためのサンプル値です。実数値ではありません。
 * ===================================================================== */
window.SERVICES = [
  {
    id: "pairs",
    name: "Pairs（ペアーズ）",
    rank: 1,
    badge: "総合1位",
    catch: "会員数が最多。地方でも相手が見つかる唯一のアプリ",
    color: "#8a3a5f",
    accent: "#f97316",

    price: 4300, priceFemale: 0,
    discount3: 0.86, discount6: 0.75, discount12: 0.60,
    members: 2000,
    ageRange: "20代〜30代",
    purpose: "恋活〜婚活",
    filterTags: ["恋活", "婚活", "20代", "30代", "地方でも探せる"],
    idCheck: true,
    freeScope: "検索・いいね送信まで",
    campaign: "登録・相手探しは無料。メッセージ交換から課金",

    score: 4.7,
    scores: { "会員数": 5.0, "コスパ": 4.3, "使いやすさ": 4.6, "安全性": 4.7, "真剣度": 4.2 },

    pros: [
      "会員数が圧倒的で、地方や年齢層が高めでも候補が尽きにくい",
      "共通の趣味でつながる機能があり、話題に困らない",
      "女性は無料。男性も長期プランなら月あたりが大きく下がる"
    ],
    cons: [
      "会員が多いぶん、目的が真剣な人とそうでない人が混在する",
      "人気会員に「いいね」が集中しやすい"
    ],

    recommendedFor: ["まず1つ試したい", "恋活したい", "地方在住", "20代", "30代"],
    ctaText: "無料で登録して相手を探す",
    url: "",
    officialUrl: "https://www.pairs.lv/",

    reviews: []
  },

  {
    id: "with",
    name: "with（ウィズ）",
    rank: 2,
    badge: "20代に人気",
    catch: "性格診断で相性の良い相手が届く。話しかけるのが苦手な人向け",
    color: "#5c4a8f",
    accent: "#38bdf8",

    price: 3600, priceFemale: 0,
    discount3: 0.85, discount6: 0.72, discount12: 0.58,
    members: 1000,
    ageRange: "20代中心",
    purpose: "恋活",
    filterTags: ["恋活", "20代", "診断で相性がわかる"],
    idCheck: true,
    freeScope: "診断・検索・いいね送信まで",
    campaign: "登録・性格診断は無料",

    score: 4.4,
    scores: { "会員数": 4.0, "コスパ": 4.5, "使いやすさ": 4.8, "安全性": 4.5, "真剣度": 4.0 },

    pros: [
      "性格診断の結果から相手が提案されるので、自分で探す負担が少ない",
      "共通点が最初から分かるため、メッセージの1通目を書きやすい",
      "20代の利用者が多く、同年代を探しやすい"
    ],
    cons: [
      "会員数はPairsに劣り、地方では候補が少なくなることがある",
      "婚活目的にはやや軽い層が多い"
    ],

    recommendedFor: ["恋活したい", "20代", "メッセージが苦手", "まず1つ試したい"],
    ctaText: "無料で性格診断をする",
    url: "",
    officialUrl: "https://with.is/",

    reviews: []
  },

  {
    id: "omiai",
    name: "Omiai",
    rank: 3,
    badge: "真剣度が高い",
    catch: "結婚を視野に入れた人が中心。冷やかしが少ない",
    color: "#7c2f55",
    accent: "#f43f5e",

    price: 4800, priceFemale: 0,
    discount3: 0.85, discount6: 0.73, discount12: 0.57,
    members: 900,
    ageRange: "20代後半〜30代",
    purpose: "婚活寄り",
    filterTags: ["婚活", "30代", "真剣度が高い"],
    idCheck: true,
    freeScope: "検索・いいね送信まで",
    campaign: "登録・相手探しは無料",

    score: 4.3,
    scores: { "会員数": 4.0, "コスパ": 4.0, "使いやすさ": 4.4, "安全性": 4.8, "真剣度": 4.8 },

    pros: [
      "結婚を意識した利用者が多く、目的のすれ違いが起きにくい",
      "監視体制がしっかりしており、業者や不審な会員が少ない",
      "年齢層がやや高めで、落ち着いたやり取りがしやすい"
    ],
    cons: [
      "料金は高めの部類に入る",
      "気軽に始めたい人には雰囲気が重く感じられる"
    ],

    recommendedFor: ["婚活したい", "30代", "40代以上", "真剣な相手を探したい"],
    ctaText: "無料で登録して相手を探す",
    url: "",
    officialUrl: "https://fb.omiai-jp.com/",

    reviews: []
  },

  {
    id: "tapple",
    name: "タップル",
    rank: 4,
    badge: "気軽に始めたい人へ",
    catch: "趣味でつながる。まず会って話したい人に向く",
    color: "#b0526e",
    accent: "#fb923c",

    price: 3700, priceFemale: 0,
    discount3: 0.87, discount6: 0.76, discount12: 0.62,
    members: 1700,
    ageRange: "10代後半〜20代",
    purpose: "恋活・友達探し",
    filterTags: ["恋活", "20代", "気軽に始められる"],
    idCheck: true,
    freeScope: "カード送信・検索まで",
    campaign: "登録は無料",

    score: 4.0,
    scores: { "会員数": 4.5, "コスパ": 4.4, "使いやすさ": 4.5, "安全性": 4.0, "真剣度": 3.2 },

    pros: [
      "趣味カードで共通点から探せるため、若い層とつながりやすい",
      "すぐ会う約束につながる機能があり、やり取りが長引かない",
      "操作が簡単で、アプリに慣れていなくても迷わない"
    ],
    cons: [
      "婚活目的には向かない。真剣度は他より低め",
      "年齢層が若く、30代以降は候補が絞られる"
    ],

    recommendedFor: ["恋活したい", "20代", "気軽に始めたい", "メッセージが苦手"],
    ctaText: "無料で登録する",
    url: "",
    officialUrl: "https://tapple.me/",

    reviews: []
  },

  {
    id: "zexy-en",
    name: "ゼクシィ縁結び",
    rank: 5,
    badge: "婚活に本気なら",
    catch: "結婚情報誌が運営。デート日程の調整まで任せられる",
    color: "#a13a6a",
    accent: "#ec4899",

    price: 4900, priceFemale: 4900,
    discount3: 0.88, discount6: 0.78, discount12: 0.65,
    members: 140,
    ageRange: "20代後半〜30代",
    purpose: "婚活",
    filterTags: ["婚活", "30代", "真剣度が高い"],
    idCheck: true,
    freeScope: "検索・価値観診断まで",
    campaign: "価値観診断は無料",

    score: 4.1,
    scores: { "会員数": 3.2, "コスパ": 3.8, "使いやすさ": 4.5, "安全性": 4.9, "真剣度": 5.0 },

    pros: [
      "結婚を前提とした利用者が中心で、目的が明確",
      "日程調整を代行してもらえるため、初回のやり取りで消耗しない",
      "運営が大手で、身元確認が厳格"
    ],
    cons: [
      "女性も有料。気軽に試すには向かない",
      "会員数は少なく、地方では候補が限られる"
    ],

    recommendedFor: ["婚活したい", "30代", "真剣な相手を探したい"],
    ctaText: "無料で価値観診断をする",
    url: "",
    officialUrl: "https://zexy-enmusubi.net/",

    reviews: []
  },

  {
    id: "marrish",
    name: "マリッシュ",
    rank: 6,
    badge: "再婚・30代以上に",
    catch: "再婚やシングルの方に理解のある会員が多い",
    color: "#6d4a8f",
    accent: "#a78bfa",

    price: 3400, priceFemale: 0,
    discount3: 0.84, discount6: 0.71, discount12: 0.55,
    members: 200,
    ageRange: "30代〜50代",
    purpose: "婚活・再婚",
    filterTags: ["婚活", "再婚", "30代", "40代以上"],
    idCheck: true,
    freeScope: "検索・いいね送信まで",
    campaign: "登録は無料。再婚活向けの優遇あり",

    score: 3.9,
    scores: { "会員数": 3.3, "コスパ": 4.6, "使いやすさ": 4.0, "安全性": 4.4, "真剣度": 4.5 },

    pros: [
      "再婚やお子さんがいる方への理解がある会員が集まっている",
      "30代以上の割合が高く、同年代を探しやすい",
      "料金が安めで、長く続けても負担が小さい"
    ],
    cons: [
      "会員数は大手に及ばない",
      "20代の利用者は少ない"
    ],

    recommendedFor: ["婚活したい", "40代以上", "再婚を考えている", "30代"],
    ctaText: "無料で登録する",
    url: "",
    officialUrl: "https://marrish.com/",

    reviews: []
  }
];
