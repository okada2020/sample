/* =====================================================================
 * render.js  ―  HTMLを組み立てる純粋関数群
 * ---------------------------------------------------------------------
 * ブラウザ（window.RENDER）とNode（require）の両方から使えます。
 * ここでDOMを触らないことで、同じコードで
 *   ・ブラウザ描画（開発中はビルド不要）
 *   ・build.js による静的HTML生成（公開用・SEO最適）
 * の両方をまかなえます。表示の修正はすべてこのファイルに集約されます。
 * ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RENDER = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var D = {};        // データ（SITE / SERVICES / QUIZ / FAQS / ARTICLES）
  var BASE = "";     // 相対パスの接頭辞（サブディレクトリのページでは "../"）
  var CLEAN = false; // true なら service/xxx.html 形式のきれいなURLを使う

  function init(data, opts) {
    D = data;
    opts = opts || {};
    BASE = opts.base || "";
    CLEAN = !!opts.cleanUrls;
    return API;
  }

  /* ================= 基本ヘルパー ================= */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { return "¥" + Number(n).toLocaleString("ja-JP"); }
  function num(n) { return Number(n).toLocaleString("ja-JP"); }
  function ranked() { return D.SERVICES.slice().sort(function (a, b) { return a.rank - b.rank; }); }
  function byId(id) { return D.SERVICES.filter(function (s) { return s.id === id; })[0]; }
  function stars(v) {
    var f = Math.floor(v), h = v - f >= 0.5;
    return "★".repeat(f) + (h ? "☆" : "") + "・".repeat(5 - f - (h ? 1 : 0));
  }

  /* ---- 実質額の計算（料金シミュレーターとカードで共通利用） ---- */
  function effective(sv) { return Math.max(0, sv.price - (sv.points || 0)); }
  function perPerson(sv, people) {
    return Math.round(effective(sv) / Math.min(people, sv.simultaneous));
  }

  /* ---- URL ---- */
  var url = {
    page:    function (f) { return BASE + f; },
    service: function (id) { return BASE + (CLEAN ? "service/" + id + ".html" : "service.html?id=" + id); },
    article: function (id) { return BASE + (CLEAN ? "article/" + id + ".html" : "article.html?id=" + id); }
  };
  /* サイトマップ・構造化データ用の絶対URL */
  function abs(path) { return D.SITE.baseUrl.replace(/\/$/, "/") + path.replace(/^\.\//, ""); }

  /* ================= アフィリエイトリンク =================
   * rel="sponsored nofollow" … 広告リンクであることの申告（Googleの要件）
   * rel="noopener"           … target=_blank のセキュリティ要件
   * data-aff-*               … GA4へ送るクリック計測用
   * ====================================================== */
  /* ASPの広告リンクが入っているか。未提携なら公式サイトへ飛ばす。
     プレースホルダ（#で始まる値）も未設定として扱う。 */
  function hasAffiliate(sv) {
    return !!sv.url && !/^#/.test(sv.url);
  }

  function affAttrs(sv, pos) {
    if (hasAffiliate(sv)) {
      /* 広告リンク：sponsored の申告と計測属性を付ける */
      return 'href="' + esc(sv.url) + '" target="_blank" rel="sponsored nofollow noopener"' +
             ' data-aff="' + esc(sv.id) + '" data-aff-name="' + esc(sv.name) + '"' +
             ' data-aff-pos="' + esc(pos) + '"';
    }
    /* 未提携：広告ではないので sponsored は付けない。
       計測は別イベント（official_click）として区別する。 */
    return 'href="' + esc(sv.officialUrl || "#") + '" target="_blank" rel="nofollow noopener"' +
           ' data-official="' + esc(sv.id) + '" data-aff-name="' + esc(sv.name) + '"' +
           ' data-aff-pos="' + esc(pos) + '"';
  }

  /* 最も目立つ場所（追従CTA・シミュレーター）は、報酬が発生する案件を優先する。
     提携済みが1件も無ければ、指定されたサービスをそのまま使う。 */
  function preferMonetizable(sv) {
    if (!sv || hasAffiliate(sv)) return sv;
    var paid = ranked().filter(hasAffiliate);
    return paid.length ? paid[0] : sv;
  }
  function ctaButton(sv, pos, sub) {
    return '<a class="btn-cta" ' + affAttrs(sv, pos) + ">" + esc(sv.ctaText) +
           (sub ? "<small>" + esc(sub) + "</small>" : "") + "</a>";
  }
  function trialNote(sv) {
    return sv.trialDays > 0 ? "期間内の解約で料金はかかりません" : "";
  }

  /* ================= 共通パーツ ================= */
  var NAV = [
    { href: "index.html",    label: "ホーム" },
    { href: "compare.html",  label: "全社比較" },
    { href: "articles.html", label: "記事" },
    { href: "about.html",    label: "運営者情報" }
  ];

  function navLinks(current) {
    return NAV.map(function (n) {
      return '<a href="' + url.page(n.href) + '"' +
             (n.href === current ? ' aria-current="page"' : "") + ">" + esc(n.label) + "</a>";
    }).join("");
  }

  function header(current) {
    return (D.SITE.demoMode
        ? '<div class="demo-bar">⚠ サンプルデータで表示中です。data/services.js を実案件に差し替え、site.js の demoMode を false にしてください。</div>'
        : "") +
      '<div class="pr-bar">' + esc(D.SITE.prLabel) + "</div>" +
      '<header class="site-header"><div class="wrap header-in">' +
        '<a class="logo" href="' + url.page("index.html") + '">' + esc(D.SITE.logoText) + "<span>.</span></a>" +
        '<nav class="gnav">' + navLinks(current) + "</nav>" +
        '<button class="menu-btn" aria-label="メニューを開く" aria-expanded="false" aria-controls="drawer">' +
          "<span></span><span></span><span></span></button>" +
      "</div>" +
      '<div class="drawer" id="drawer">' + navLinks(current) + "</div></header>";
  }

  function footer() {
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="logo">' + esc(D.SITE.logoText) + "</div>" +
      '<nav class="footer-nav">' + navLinks("") +
        '<a href="' + url.page("privacy.html") + '">プライバシーポリシー・免責事項</a></nav>' +
      '<p class="footer-note">' + esc(D.SITE.prLabel) +
        "。掲載している料金・配信状況は編集時点の情報です。最新かつ正確な内容は各公式サイトを必ずご確認ください。<br>" +
        "&copy; " + new Date().getFullYear() + " " + esc(D.SITE.copyright) + "</p>" +
      "</div></footer>";
  }

  function stickyCta() {
    var c = D.SITE.stickyCta;
    if (!c || !c.enabled) return "";
    var sv = preferMonetizable(byId(c.serviceId));
    if (!sv) return "";
    return '<div class="sticky-cta">' +
      '<a class="btn-cta" ' + affAttrs(sv, "sticky") + ">" + esc(c.text) + "</a>" +
      '<p class="note">' + esc(sv.name) + "｜" +
        (sv.trialDays > 0 ? "期間内の解約で料金は一切かかりません" : "公式サイトへ移動します") + "</p></div>";
  }

  function crumbs(items) {
    return items.map(function (it, i) {
      var last = i === items.length - 1;
      return (last ? '<span aria-current="page">' + esc(it.name) + "</span>"
                   : '<a href="' + esc(it.href) + '">' + esc(it.name) + "</a>") +
             (last ? "" : "<span>›</span>");
    }).join("");
  }

  /* ================= サービスカード ================= */
  function serviceCard(sv, idx) {
    var eff = effective(sv);
    return '<article class="rank-card' + (idx === 0 ? " is-top" : "") + '" id="' + esc(sv.id) + '">' +
      '<div class="rank-ribbon">' + (idx + 1) + "位</div>" +
      '<div class="rank-head" style="background:linear-gradient(135deg,' + esc(sv.color) + "," + esc(sv.color) + 'ee)">' +
        '<div class="rank-badge">' + esc(sv.badge) + "</div>" +
        '<h3 class="rank-name">' + esc(sv.name) + "</h3>" +
        '<p class="rank-catch">' + esc(sv.catch) + "</p></div>" +
      '<div class="rank-body">' +
        '<div class="score-row"><span class="stars">' + stars(sv.score) + "</span>" +
          '<span class="score-num">' + sv.score.toFixed(1) + "<small> / 5.0</small></span></div>" +
        '<table class="spec"><tbody>' +
          "<tr><th>月額（税込）</th><td class=\"hl\">" + yen(sv.price) + "</td></tr>" +
          (sv.points ? "<tr><th>ポイント還元後</th><td><b>実質" + yen(eff) +
                       '</b> <span class="mini">毎月' + num(sv.points) + "円分付与</span></td></tr>" : "") +
          "<tr><th>無料体験</th><td>" + (sv.trialDays > 0 ? sv.trialDays + "日間" : "なし") + "</td></tr>" +
          "<tr><th>配信作品数</th><td>約" + num(sv.works) + "本</td></tr>" +
          "<tr><th>同時視聴</th><td>" + sv.simultaneous + "台</td></tr>" +
          "<tr><th>画質</th><td>" + esc(sv.quality) + "</td></tr>" +
          "<tr><th>得意ジャンル</th><td>" + esc(sv.genres.slice(0, 4).join("・")) + "</td></tr>" +
        "</tbody></table>" +
        '<p class="campaign">🎁 ' + esc(sv.campaign) + "</p>" +
        '<div class="pc-list">' +
          '<div class="good"><h4>ここが良い</h4><ul>' +
            sv.pros.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="bad"><h4>注意したい点</h4><ul>' +
            sv.cons.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div></div>" +
        ctaButton(sv, "ranking_" + (idx + 1), trialNote(sv)) +
        '<a class="btn-sub" href="' + url.service(sv.id) + '">' + esc(sv.name) + "の詳細を見る</a>" +
        '<p class="cta-note">公式サイトへ移動します</p>' +
      "</div></article>";
  }

  function rankList(list) {
    return '<div class="rank-list">' +
      list.map(function (s, i) { return serviceCard(s, i); }).join("") + "</div>";
  }

  /* ================= 比較表 ================= */
  var ROWS = [
    { label: "月額（税込）", get: function (s) { return '<span class="price">' + yen(s.price) + "</span>"; } },
    { label: "実質月額",     get: function (s) { return s.points ? "<b>" + yen(effective(s)) + "</b>" : yen(s.price); } },
    { label: "無料体験",     get: function (s) { return s.trialDays > 0 ? '<span class="yes">' + s.trialDays + "日間</span>" : '<span class="no">なし</span>"'.slice(0, -1); } },
    { label: "作品数",       get: function (s) { return "約" + num(s.works) + "本"; } },
    { label: "同時視聴",     get: function (s) { return s.simultaneous + "台"; } },
    { label: "ダウンロード", get: function (s) { return s.download ? '<span class="yes">◯</span>' : '<span class="no">×</span>'; } },
    { label: "画質",         get: function (s) { return esc(s.quality); } },
    { label: "得意ジャンル", get: function (s) { return esc(s.genres.slice(0, 3).join("・")); } }
  ];

  function compareTable(list) {
    return '<div class="table-scroll"><table class="cmp">' +
      "<thead><tr><th>サービス</th>" +
        ROWS.map(function (r) { return "<th>" + esc(r.label) + "</th>"; }).join("") +
      "<th>申込</th></tr></thead><tbody>" +
      list.map(function (s) {
        return '<tr class="' + (s.rank === 1 ? "top" : "") + '" data-genres="' + esc(s.genres.join("|")) + '">' +
          '<th><span class="rank-no">' + s.rank + "位</span>" + esc(s.name) + "</th>" +
          ROWS.map(function (r) { return "<td>" + r.get(s) + "</td>"; }).join("") +
          '<td><a class="cell-cta" ' + affAttrs(s, "table") + ">公式へ</a></td></tr>";
      }).join("") +
      "</tbody></table></div>";
  }

  function compareBlock(withFilters) {
    var all = ranked(), genres = [];
    all.forEach(function (s) {
      s.genres.forEach(function (g) { if (genres.indexOf(g) === -1) genres.push(g); });
    });
    return (withFilters
      ? '<div class="cmp-filters"><button type="button" data-g="" aria-pressed="true">すべて</button>' +
        genres.map(function (g) {
          return '<button type="button" data-g="' + esc(g) + '" aria-pressed="false">' + esc(g) + "</button>";
        }).join("") + "</div>"
      : "") +
      '<div data-table><p class="table-hint">← 横にスクロールできます →</p>' + compareTable(all) +
      '<p class="cmp-empty" data-empty hidden>該当するサービスがありません。別のジャンルをお試しください。</p>' +
      "</div>";
  }

  /* ================= 料金シミュレーター =================
   * 「安く見せる」のではなく「自分の条件での金額」を出すことで
   * 検討を先に進めてもらうためのパーツ。計算式は画面上に明示します。
   * ==================================================== */
  function simResults(people) {
    var list = ranked().map(function (s) {
      return { s: s, per: perPerson(s, people) };
    }).sort(function (a, b) { return a.per - b.per; });

    var max = list[list.length - 1].per || 1;
    var best = list[0];

    return '<p class="sim-lead">' + people + "人で使う場合、1人あたりの負担は<b>" +
        esc(best.s.name) + "</b>が最安で<b>月" + yen(best.per) + "</b>です。</p>" +
      '<ul class="sim-bars">' + list.map(function (r) {
        var w = Math.max(8, Math.round(r.per / max * 100));
        return '<li class="' + (r === best ? "best" : "") + '">' +
          '<span class="nm">' + esc(r.s.name) + "</span>" +
          '<span class="bar"><i style="width:' + w + '%"></i></span>' +
          '<span class="val">' + yen(r.per) + "<small>/人</small></span></li>";
      }).join("") + "</ul>" +
      '<div class="sim-cta">' + (function () {
        var t = preferMonetizable(best.s);
        return ctaButton(t, "simulator", trialNote(t));
      })() + "</div>";
  }

  function simulator() {
    return '<div class="sim" id="sim">' +
      '<div class="sim-controls"><span class="sim-label">何人で使いますか？</span>' +
        '<div class="sim-people" role="group" aria-label="利用人数">' +
        [1, 2, 3, 4].map(function (n) {
          return '<button type="button" data-people="' + n + '" aria-pressed="' + (n === 1) + '">' + n + "人</button>";
        }).join("") + "</div></div>" +
      '<div class="sim-out" data-sim-out>' + simResults(1) + "</div>" +
      '<p class="sim-note">計算式：（月額 − 毎月付与されるポイント）÷ min(利用人数, 同時視聴台数)。' +
        "ポイントを毎月使い切った場合の試算です。</p></div>";
  }

  /* ================= 診断 ================= */
  function quizQuestion(step) {
    var q = D.QUIZ[step];
    return '<div class="quiz-progress">' +
        D.QUIZ.map(function (_, i) { return '<i class="' + (i <= step ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      '<p class="quiz-step">質問 ' + (step + 1) + " / " + D.QUIZ.length + "</p>" +
      '<h3 class="quiz-q">' + esc(q.q) + "</h3>" +
      '<div class="quiz-options">' +
        q.options.map(function (o, i) {
          return '<button type="button" data-i="' + i + '">' + esc(o.label) + "</button>";
        }).join("") + "</div>" +
      (step > 0 ? '<p class="quiz-back"><button type="button" data-back>← 前の質問にもどる</button></p>' : "");
  }

  /* 選んだタグと各サービスの recommendedFor の一致数で採点 */
  function quizScore(flatTags) {
    return D.SERVICES.map(function (s) {
      var hits = (s.recommendedFor || []).filter(function (t) { return flatTags.indexOf(t) !== -1; });
      return { s: s, hits: hits };
    }).sort(function (a, b) { return b.hits.length - a.hits.length || a.s.rank - b.s.rank; });
  }

  function quizResult(flatTags) {
    var scored = quizScore(flatTags), best = scored[0], second = scored[1];
    var reason = best.hits.length
      ? "あなたが選んだ「" + best.hits.map(esc).join("」「") + "」に最も合っています。"
      : "総合評価が最も高いサービスです。";

    return '<div class="quiz-result-head"><p class="small">あなたに合うのは</p>' +
        "<strong>" + esc(best.s.name) + "</strong>" +
        '<p class="small">' + esc(best.s.catch) + "</p></div>" +
      '<p class="quiz-reason">' + reason + "</p>" +
      '<table class="spec"><tbody>' +
        "<tr><th>月額</th><td class=\"hl\">" + yen(best.s.price) + "</td></tr>" +
        (best.s.points ? "<tr><th>実質月額</th><td><b>" + yen(effective(best.s)) + "</b></td></tr>" : "") +
        "<tr><th>無料体験</th><td>" + (best.s.trialDays > 0 ? best.s.trialDays + "日間" : "なし") + "</td></tr>" +
        "<tr><th>同時視聴</th><td>" + best.s.simultaneous + "台</td></tr>" +
      "</tbody></table>" +
      ctaButton(best.s, "quiz_result", trialNote(best.s)) +
      '<a class="btn-sub" href="' + url.service(best.s.id) + '">' + esc(best.s.name) + "の詳細を見る</a>" +
      (second ? '<p class="cta-note">2番手の候補：<a href="' + url.service(second.s.id) + '">' +
                esc(second.s.name) + "</a></p>" : "") +
      '<p class="quiz-back"><button type="button" data-retry>もう一度診断する</button></p>';
  }

  /* ================= FAQ / 記事一覧 ================= */
  function faqList() {
    return '<div class="faq">' + D.FAQS.map(function (f) {
      return "<details><summary>Q. " + esc(f.q) + "</summary>" +
             '<div class="a">' + esc(f.a) + "</div></details>";
    }).join("") + "</div>";
  }

  function postGrid(list) {
    return '<div class="post-grid">' + list.map(function (a) {
      return '<a class="post-card" href="' + url.article(a.id) + '">' +
        '<span class="cat">' + esc(a.category) + "</span><h3>" + esc(a.title) + "</h3>" +
        "<p>" + esc(a.excerpt) + "</p>" +
        '<p class="meta">' + esc(a.date) + "・約" + a.readMin + "分で読めます</p></a>";
    }).join("") + "</div>";
  }

  function ctaBox(sv) {
    if (!sv) return "";
    return '<div class="cta-box"><span class="eyebrow">今なら</span>' +
      "<h3>" + esc(sv.name) + "｜" + esc(sv.campaign) + "</h3>" +
      "<p>" + esc(sv.catch) + "</p>" + ctaButton(sv, "in_article") +
      '<p class="cta-note">公式サイトへ移動します</p></div>';
  }

  /* ================= 記事本文 ================= */
  function articleBody(art) {
    var toc = [], html = "", h = 0, ul = [];
    function flush() {
      if (!ul.length) return;
      html += "<ul>" + ul.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
      ul = [];
    }
    art.body.forEach(function (line) {
      var m;
      if (line.indexOf("## ") === 0) {
        flush();
        var id = "h" + (++h), t = line.slice(3);
        toc.push({ id: id, text: t });
        html += '<h2 id="' + id + '">' + esc(t) + "</h2>";
      } else if (line.indexOf("- ") === 0) {
        ul.push(line.slice(2));
      } else if ((m = line.match(/^\[cta:(.+)\]$/))) {
        flush(); html += ctaBox(byId(m[1]));
      } else {
        flush(); html += "<p>" + esc(line) + "</p>";
      }
    });
    flush();

    return "<h1>" + esc(art.title) + "</h1>" +
      '<p class="meta">' + esc(art.date) + "　|　" + esc(art.category) + "　|　約" + art.readMin +
        "分　|　執筆：" + esc(D.SITE.author.name) + "</p>" +
      (toc.length ? '<nav class="toc"><h2>この記事の内容</h2><ul>' +
        toc.map(function (t) { return '<li><a href="#' + t.id + '">' + esc(t.text) + "</a></li>"; }).join("") +
        "</ul></nav>" : "") + html;
  }

  /* ================= サービス詳細 ================= */
  function serviceDetail(sv) {
    return rankList([sv]) +
      '<section class="section"><div class="section-head">' +
        '<span class="label">EVALUATION</span><h2>' + esc(sv.name) + "の評価内訳</h2></div>" +
        '<table class="spec bg-white" style="padding:8px">' +
          Object.keys(sv.scores).map(function (k) {
            return "<tr><th>" + esc(k) + '</th><td><span class="stars">' + stars(sv.scores[k]) +
                   "</span> " + sv.scores[k].toFixed(1) + "</td></tr>";
          }).join("") + "</table></section>" +
      (sv.reviews && sv.reviews.length
        ? '<section class="section"><div class="section-head"><span class="label">REVIEWS</span>' +
          "<h2>利用者の声</h2></div>" +
          '<div class="reviews">' + sv.reviews.map(function (r) {
            return '<div class="review"><p class="meta"><b>' + esc(r.name) + "</b>" + esc(r.age) +
                   '<span class="stars">' + stars(r.rating) + "</span></p><p>" + esc(r.text) + "</p></div>";
          }).join("") + "</div></section>"
        : "") +
      '<section class="section">' + ctaBox(sv) + "</section>";
  }

  /* ================= 構造化データ ================= */
  function ld(obj) {
    return '<script type="application/ld+json">' +
           JSON.stringify(obj).replace(/</g, "\\u003c") + "<\/script>";
  }
  function ldWebsite() {
    return { "@context": "https://schema.org", "@type": "WebSite",
             name: D.SITE.name, url: D.SITE.baseUrl, description: D.SITE.description };
  }
  function ldItemList() {
    return { "@context": "https://schema.org", "@type": "ItemList",
      name: D.SITE.name + "｜動画配信サービスおすすめランキング",
      itemListElement: ranked().map(function (s, i) {
        return { "@type": "ListItem", position: i + 1, name: s.name,
                 url: abs(CLEAN ? "service/" + s.id + ".html" : "service.html?id=" + s.id) };
      }) };
  }
  function ldFaq() {
    return { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: D.FAQS.map(function (f) {
        return { "@type": "Question", name: f.q,
                 acceptedAnswer: { "@type": "Answer", text: f.a } };
      }) };
  }
  function ldBreadcrumb(items) {
    return { "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: items.map(function (it, i) {
        return { "@type": "ListItem", position: i + 1, name: it.name,
                 item: abs(it.href.replace(/^(\.\.\/)+/, "")) };
      }) };
  }
  function ldArticle(a) {
    return { "@context": "https://schema.org", "@type": "Article",
      headline: a.title, description: a.excerpt, datePublished: a.date, dateModified: a.date,
      author: { "@type": "Person", name: D.SITE.author.name },
      publisher: { "@type": "Organization", name: D.SITE.name },
      mainEntityOfPage: abs(CLEAN ? "article/" + a.id + ".html" : "article.html?id=" + a.id) };
  }

  var API = {
    init: init, esc: esc, yen: yen, num: num, stars: stars,
    ranked: ranked, byId: byId, hasAffiliate: hasAffiliate, effective: effective, perPerson: perPerson,
    url: url, abs: abs,
    header: header, footer: footer, stickyCta: stickyCta, crumbs: crumbs,
    serviceCard: serviceCard, rankList: rankList,
    compareTable: compareTable, compareBlock: compareBlock,
    simulator: simulator, simResults: simResults,
    quizQuestion: quizQuestion, quizResult: quizResult,
    faqList: faqList, postGrid: postGrid, ctaBox: ctaBox,
    articleBody: articleBody, serviceDetail: serviceDetail,
    ld: ld, ldWebsite: ldWebsite, ldItemList: ldItemList, ldFaq: ldFaq,
    ldBreadcrumb: ldBreadcrumb, ldArticle: ldArticle
  };
  return API;
});
