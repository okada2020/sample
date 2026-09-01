/* =====================================================================
 * app.js  ―  データからページを組み立てる描画エンジン
 * ---------------------------------------------------------------------
 * data/site.js, data/services.js, data/content.js を読み込んだあとに
 * このファイルを読み込みます。各ページは <body data-page="..."> と
 * プレースホルダ用の <div id="..."> を置くだけで中身が生成されます。
 * ===================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE, SERVICES = window.SERVICES || [];

  /* ================= 汎用ヘルパー ================= */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { return "¥" + Number(n).toLocaleString("ja-JP"); }
  function num(n) { return Number(n).toLocaleString("ja-JP"); }
  function byId(id) { return SERVICES.filter(function (s) { return s.id === id; })[0]; }
  function ranked() { return SERVICES.slice().sort(function (a, b) { return a.rank - b.rank; }); }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  function stars(score) {
    var full = Math.floor(score), half = score - full >= 0.5;
    return "★".repeat(full) + (half ? "☆" : "") + "・".repeat(5 - full - (half ? 1 : 0));
  }

  /* ================= アフィリエイトリンク =================
   * rel に sponsored / nofollow を必ず付与します（Googleの要件）。
   * target=_blank には noopener を必ず添えます（セキュリティ要件）。
   * data-aff-* は計測用。クリックはGA4へ自動送信されます。
   * ====================================================== */
  function affAttrs(sv, position) {
    return 'href="' + esc(sv.url) + '"' +
           ' target="_blank" rel="sponsored nofollow noopener"' +
           ' data-aff="' + esc(sv.id) + '" data-aff-name="' + esc(sv.name) + '"' +
           ' data-aff-pos="' + esc(position) + '"';
  }

  function ctaButton(sv, position, sub) {
    return '<a class="btn-cta" ' + affAttrs(sv, position) + '>' +
             esc(sv.ctaText) +
             (sub ? '<small>' + esc(sub) + '</small>' : '') +
           '</a>';
  }

  /* クリック計測（GA4があれば送信、無ければ何もしない） */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-aff]");
    if (!a) return;
    if (typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        service_id:   a.dataset.aff,
        service_name: a.dataset.affName,
        position:     a.dataset.affPos,
        page_path:    location.pathname
      });
    }
  });

  /* ================= 共通パーツ ================= */
  var NAV = [
    { href: "index.html",    label: "ホーム" },
    { href: "compare.html",  label: "全社比較" },
    { href: "articles.html", label: "記事" },
    { href: "about.html",    label: "運営者情報" }
  ];

  function currentFile() {
    var f = location.pathname.split("/").pop();
    return f === "" ? "index.html" : f;
  }

  function renderChrome() {
    var here = currentFile();
    var navHtml = NAV.map(function (n) {
      var cur = n.href === here ? ' aria-current="page"' : "";
      return '<a href="' + n.href + '"' + cur + '>' + esc(n.label) + "</a>";
    }).join("");

    var header =
      (SITE.demoMode
        ? '<div class="demo-bar">⚠ サンプルデータで表示中です。data/services.js を実案件に差し替え、site.js の demoMode を false にしてください。</div>'
        : "") +
      '<div class="pr-bar">' + esc(SITE.prLabel) + "</div>" +
      '<header class="site-header">' +
        '<div class="wrap header-in">' +
          '<a class="logo" href="index.html">' + esc(SITE.logoText) + "<span>.</span></a>" +
          '<nav class="gnav">' + navHtml + "</nav>" +
          '<button class="menu-btn" aria-label="メニューを開く" aria-expanded="false" aria-controls="drawer">' +
            "<span></span><span></span><span></span>" +
          "</button>" +
        "</div>" +
        '<div class="drawer" id="drawer">' + navHtml + "</div>" +
      "</header>";

    var footer =
      '<footer class="site-footer">' +
        '<div class="wrap">' +
          '<div class="logo">' + esc(SITE.logoText) + "</div>" +
          '<nav class="footer-nav">' +
            NAV.map(function (n) { return '<a href="' + n.href + '">' + esc(n.label) + "</a>"; }).join("") +
            '<a href="privacy.html">プライバシーポリシー・免責事項</a>' +
          "</nav>" +
          '<p class="footer-note">' +
            esc(SITE.prLabel) + "。掲載している料金・配信状況は編集時点の情報です。" +
            "最新かつ正確な内容は各公式サイトを必ずご確認ください。<br>" +
            "&copy; " + new Date().getFullYear() + " " + esc(SITE.copyright) +
          "</p>" +
        "</div>" +
      "</footer>";

    var h = $("#site-header"), f = $("#site-footer");
    if (h) h.outerHTML = header;
    if (f) f.outerHTML = footer;

    var btn = $(".menu-btn"), drawer = $("#drawer");
    if (btn && drawer) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        drawer.classList.toggle("open", !open);
      });
    }
  }

  /* ================= 追従CTA ================= */
  function renderStickyCta() {
    var cfg = SITE.stickyCta;
    if (!cfg || !cfg.enabled) return;
    var sv = byId(cfg.serviceId);
    if (!sv) return;

    var bar = document.createElement("div");
    bar.className = "sticky-cta";
    bar.innerHTML =
      '<a class="btn-cta" ' + affAttrs(sv, "sticky") + ">" + esc(cfg.text) + "</a>" +
      '<p class="note">' + esc(sv.name) + "｜" +
        (sv.trialDays > 0 ? "期間内の解約で料金は一切かかりません" : "公式サイトへ移動します") +
      "</p>";
    document.body.appendChild(bar);
    document.body.classList.add("has-sticky");

    /* 300px以上スクロールしたら表示（いきなり出すと離脱要因になるため） */
    var onScroll = function () { bar.classList.toggle("show", window.scrollY > 300); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ================= ランキング ================= */
  function serviceCard(sv, idx) {
    var isTop = idx === 0;
    return (
      '<article class="rank-card' + (isTop ? " is-top" : "") + '" id="' + esc(sv.id) + '">' +
        '<div class="rank-ribbon">' + (idx + 1) + "位</div>" +
        '<div class="rank-head" style="background:linear-gradient(135deg,' + esc(sv.color) + ',' + esc(sv.color) + 'ee)">' +
          '<div class="rank-badge">' + esc(sv.badge) + "</div>" +
          '<h3 class="rank-name">' + esc(sv.name) + "</h3>" +
          '<p class="rank-catch">' + esc(sv.catch) + "</p>" +
        "</div>" +
        '<div class="rank-body">' +
          '<div class="score-row">' +
            '<span class="stars">' + stars(sv.score) + "</span>" +
            '<span class="score-num">' + sv.score.toFixed(1) + "<small> / 5.0</small></span>" +
          "</div>" +
          '<table class="spec"><tbody>' +
            "<tr><th>月額（税込）</th><td class=\"hl\">" + yen(sv.price) + "</td></tr>" +
            "<tr><th>無料体験</th><td>" + (sv.trialDays > 0 ? sv.trialDays + "日間" : "なし") + "</td></tr>" +
            "<tr><th>配信作品数</th><td>約" + num(sv.works) + "本</td></tr>" +
            "<tr><th>同時視聴</th><td>" + sv.simultaneous + "台</td></tr>" +
            "<tr><th>画質</th><td>" + esc(sv.quality) + "</td></tr>" +
            "<tr><th>得意ジャンル</th><td>" + esc(sv.genres.slice(0, 4).join("・")) + "</td></tr>" +
          "</tbody></table>" +
          '<p class="campaign">🎁 ' + esc(sv.campaign) + "</p>" +
          '<div class="pc-list">' +
            '<div class="good"><h4>ここが良い</h4><ul>' +
              sv.pros.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
            "</ul></div>" +
            '<div class="bad"><h4>注意したい点</h4><ul>' +
              sv.cons.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
            "</ul></div>" +
          "</div>" +
          ctaButton(sv, "ranking_" + (idx + 1), sv.trialDays > 0 ? "期間内の解約で料金はかかりません" : "") +
          '<a class="btn-sub" href="service.html?id=' + esc(sv.id) + '">' + esc(sv.name) + "の詳細を見る</a>" +
          '<p class="cta-note">公式サイトへ移動します</p>' +
        "</div>" +
      "</article>"
    );
  }

  function renderRanking(el, limit) {
    var list = ranked().slice(0, limit || SERVICES.length);
    el.innerHTML = '<div class="rank-list">' + list.map(serviceCard).join("") + "</div>";
  }

  /* ================= 比較表 ================= */
  var ROWS = [
    { label: "月額（税込）", get: function (s) { return '<span class="price">' + yen(s.price) + "</span>"; } },
    { label: "無料体験",     get: function (s) { return s.trialDays > 0 ? '<span class="yes">' + s.trialDays + '日間</span>' : '<span class="no">なし</span>'; } },
    { label: "作品数",       get: function (s) { return "約" + num(s.works) + "本"; } },
    { label: "同時視聴",     get: function (s) { return s.simultaneous + "台"; } },
    { label: "ダウンロード", get: function (s) { return s.download ? '<span class="yes">◯</span>' : '<span class="no">×</span>'; } },
    { label: "画質",         get: function (s) { return esc(s.quality); } },
    { label: "得意ジャンル", get: function (s) { return esc(s.genres.slice(0, 3).join("・")); } }
  ];

  function compareTable(list) {
    var head = '<thead><tr><th>サービス</th>' +
      ROWS.map(function (r) { return "<th>" + esc(r.label) + "</th>"; }).join("") +
      "<th>申込</th></tr></thead>";

    var body = "<tbody>" + list.map(function (s) {
      return '<tr class="' + (s.rank === 1 ? "top" : "") + '">' +
        '<th><span class="rank-no">' + s.rank + "位</span>" + esc(s.name) + "</th>" +
        ROWS.map(function (r) { return "<td>" + r.get(s) + "</td>"; }).join("") +
        '<td><a class="cell-cta" ' + affAttrs(s, "table") + ">公式へ</a></td>" +
      "</tr>";
    }).join("") + "</tbody>";

    return '<div class="table-scroll"><table class="cmp">' + head + body + "</table></div>";
  }

  function renderCompare(el, withFilters) {
    var all = ranked();

    function draw(list) {
      el.querySelector("[data-table]").innerHTML =
        '<p class="table-hint">← 横にスクロールできます →</p>' + compareTable(list);
    }

    if (!withFilters) {
      el.innerHTML = "<div data-table></div>";
      draw(all);
      return;
    }

    /* 絞り込みボタンは全サービスのジャンルから自動生成 */
    var genres = [];
    all.forEach(function (s) {
      s.genres.forEach(function (g) { if (genres.indexOf(g) === -1) genres.push(g); });
    });

    el.innerHTML =
      '<div class="cmp-filters">' +
        '<button type="button" data-g="" aria-pressed="true">すべて</button>' +
        genres.map(function (g) {
          return '<button type="button" data-g="' + esc(g) + '" aria-pressed="false">' + esc(g) + "</button>";
        }).join("") +
      "</div><div data-table></div>";

    draw(all);

    el.querySelector(".cmp-filters").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-g]");
      if (!btn) return;
      el.querySelectorAll(".cmp-filters button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      var g = btn.dataset.g;
      draw(g ? all.filter(function (s) { return s.genres.indexOf(g) !== -1; }) : all);
    });
  }

  /* ================= 診断チャート ================= */
  function renderQuiz(el) {
    var QUIZ = window.QUIZ || [];
    if (!QUIZ.length) return;
    var step = 0, tags = [];

    function progress() {
      return '<div class="quiz-progress">' +
        QUIZ.map(function (_, i) { return '<i class="' + (i <= step ? "on" : "") + '"></i>'; }).join("") +
        "</div>";
    }

    function drawQuestion() {
      var q = QUIZ[step];
      el.innerHTML =
        progress() +
        '<p class="quiz-step">質問 ' + (step + 1) + " / " + QUIZ.length + "</p>" +
        '<h3 class="quiz-q">' + esc(q.q) + "</h3>" +
        '<div class="quiz-options">' +
          q.options.map(function (o, i) {
            return '<button type="button" data-i="' + i + '">' + esc(o.label) + "</button>";
          }).join("") +
        "</div>" +
        (step > 0 ? '<p class="quiz-back"><button type="button" data-back>← 前の質問にもどる</button></p>' : "");

      el.querySelector(".quiz-options").addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (!b) return;
        tags[step] = q.options[Number(b.dataset.i)].tags;
        step++;
        step < QUIZ.length ? drawQuestion() : drawResult();
      });

      var back = el.querySelector("[data-back]");
      if (back) back.addEventListener("click", function () { step--; drawQuestion(); });
    }

    function drawResult() {
      var flat = [].concat.apply([], tags);

      /* 選ばれたタグとの一致数でスコアリング。同点なら順位が上を優先 */
      var scored = SERVICES.map(function (s) {
        var hit = (s.recommendedFor || []).filter(function (t) { return flat.indexOf(t) !== -1; }).length;
        return { s: s, hit: hit };
      }).sort(function (a, b) { return b.hit - a.hit || a.s.rank - b.s.rank; });

      var best = scored[0].s, second = scored[1] && scored[1].s;

      el.innerHTML =
        '<div class="quiz-result-head">' +
          '<p class="small">あなたに合うのは</p>' +
          "<strong>" + esc(best.name) + "</strong>" +
          '<p class="small">' + esc(best.catch) + "</p>" +
        "</div>" +
        '<table class="spec"><tbody>' +
          "<tr><th>月額</th><td class=\"hl\">" + yen(best.price) + "</td></tr>" +
          "<tr><th>無料体験</th><td>" + (best.trialDays > 0 ? best.trialDays + "日間" : "なし") + "</td></tr>" +
          "<tr><th>同時視聴</th><td>" + best.simultaneous + "台</td></tr>" +
        "</tbody></table>" +
        ctaButton(best, "quiz_result", best.trialDays > 0 ? "期間内の解約で料金はかかりません" : "") +
        '<a class="btn-sub" href="service.html?id=' + esc(best.id) + '">' + esc(best.name) + "の詳細を見る</a>" +
        (second ? '<p class="cta-note">2番手の候補：<a href="service.html?id=' + esc(second.id) + '">' + esc(second.name) + "</a></p>" : "") +
        '<p class="quiz-back"><button type="button" data-retry>もう一度診断する</button></p>';

      el.querySelector("[data-retry]").addEventListener("click", function () {
        step = 0; tags = []; drawQuestion();
      });

      if (typeof window.gtag === "function") {
        window.gtag("event", "quiz_complete", { result_service: best.id });
      }
    }

    drawQuestion();
  }

  /* ================= FAQ ================= */
  function renderFaq(el) {
    var FAQS = window.FAQS || [];
    el.innerHTML = '<div class="faq">' + FAQS.map(function (f) {
      return "<details><summary>Q. " + esc(f.q) + "</summary>" +
             '<div class="a">' + esc(f.a) + "</div></details>";
    }).join("") + "</div>";
  }

  /* ================= 記事一覧 ================= */
  function renderPosts(el, limit) {
    var list = (window.ARTICLES || []).slice(0, limit || 99);
    el.innerHTML = '<div class="post-grid">' + list.map(function (a) {
      return '<a class="post-card" href="article.html?id=' + esc(a.id) + '">' +
        '<span class="cat">' + esc(a.category) + "</span>" +
        "<h3>" + esc(a.title) + "</h3>" +
        "<p>" + esc(a.excerpt) + "</p>" +
        '<p class="meta">' + esc(a.date) + "・約" + a.readMin + "分で読めます</p>" +
      "</a>";
    }).join("") + "</div>";
  }

  /* ================= 記事内CTAボックス ================= */
  function ctaBox(sv) {
    if (!sv) return "";
    return '<div class="cta-box">' +
      '<span class="eyebrow">今なら</span>' +
      "<h3>" + esc(sv.name) + "｜" + esc(sv.campaign) + "</h3>" +
      "<p>" + esc(sv.catch) + "</p>" +
      ctaButton(sv, "in_article") +
      '<p class="cta-note">公式サイトへ移動します</p>' +
    "</div>";
  }

  /* ================= 構造化データ ================= */
  function jsonLd(obj) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  }

  function breadcrumbLd(items) {
    jsonLd({
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: items.map(function (it, i) {
        return { "@type": "ListItem", position: i + 1, name: it.name, item: SITE.baseUrl + it.href };
      })
    });
  }

  function renderCrumbs(el, items) {
    el.className = "crumbs";
    el.innerHTML = items.map(function (it, i) {
      var last = i === items.length - 1;
      return (last ? "<span aria-current=\"page\">" + esc(it.name) + "</span>"
                   : '<a href="' + esc(it.href) + '">' + esc(it.name) + "</a>") +
             (last ? "" : "<span>›</span>");
    }).join("");
    breadcrumbLd(items);
  }

  /* ================= GA4 ================= */
  function loadGa4() {
    if (!SITE.ga4Id) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(SITE.ga4Id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", SITE.ga4Id);
  }

  /* ================= ページ別の組み立て ================= */
  var PAGES = {
    home: function () {
      renderQuiz($("#quiz"));
      renderRanking($("#ranking"), 5);
      renderCompare($("#compare"), false);
      renderFaq($("#faq"));
      renderPosts($("#posts"), 3);

      jsonLd({
        "@context": "https://schema.org", "@type": "ItemList",
        name: SITE.name + "｜動画配信サービスおすすめランキング",
        itemListElement: ranked().map(function (s, i) {
          return { "@type": "ListItem", position: i + 1, name: s.name, url: SITE.baseUrl + "service.html?id=" + s.id };
        })
      });
      jsonLd({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: (window.FAQS || []).map(function (f) {
          return { "@type": "Question", name: f.q,
                   acceptedAnswer: { "@type": "Answer", text: f.a } };
        })
      });
    },

    compare: function () {
      renderCrumbs($("#crumbs"), [{ name: "ホーム", href: "index.html" }, { name: "全社比較", href: "compare.html" }]);
      renderCompare($("#compare"), true);
      renderRanking($("#ranking"));
      renderFaq($("#faq"));
    },

    service: function () {
      var sv = byId(param("id")) || ranked()[0];
      document.title = sv.name + "の評判・料金は？メリットと注意点｜" + SITE.name;
      var md = $('meta[name="description"]');
      if (md) md.content = sv.name + "の料金・作品数・無料体験を実際の利用者目線で解説。" + sv.catch;

      renderCrumbs($("#crumbs"), [
        { name: "ホーム", href: "index.html" },
        { name: "全社比較", href: "compare.html" },
        { name: sv.name, href: "service.html?id=" + sv.id }
      ]);

      $("#detail").innerHTML =
        '<div class="rank-list">' + serviceCard(sv, sv.rank - 1) + "</div>" +

        '<section class="section"><div class="section-head">' +
          '<span class="label">EVALUATION</span><h2>' + esc(sv.name) + "の評価内訳</h2></div>" +
          '<table class="spec bg-white" style="padding:8px">' +
            Object.keys(sv.scores).map(function (k) {
              var v = sv.scores[k];
              return "<tr><th>" + esc(k) + "</th><td>" +
                '<span class="stars">' + stars(v) + "</span> " + v.toFixed(1) + "</td></tr>";
            }).join("") +
          "</table>" +
        "</section>" +

        (sv.reviews && sv.reviews.length
          ? '<section class="section"><div class="section-head">' +
              '<span class="label">REVIEWS</span><h2>利用者の声</h2></div>' +
              '<div class="reviews">' + sv.reviews.map(function (r) {
                return '<div class="review"><p class="meta"><b>' + esc(r.name) + "</b>" + esc(r.age) +
                       '<span class="stars">' + stars(r.rating) + "</span></p><p>" + esc(r.text) + "</p></div>";
              }).join("") + "</div>" +
            "</section>"
          : "") +

        '<section class="section">' + ctaBox(sv) + "</section>";

      $("#others").innerHTML =
        '<div class="rank-list">' +
          ranked().filter(function (s) { return s.id !== sv.id; }).slice(0, 3)
                  .map(function (s, i) { return serviceCard(s, s.rank - 1); }).join("") +
        "</div>";
    },

    articles: function () {
      renderCrumbs($("#crumbs"), [{ name: "ホーム", href: "index.html" }, { name: "記事", href: "articles.html" }]);
      renderPosts($("#posts"));
    },

    article: function () {
      var ART = (window.ARTICLES || []).filter(function (a) { return a.id === param("id"); })[0] || (window.ARTICLES || [])[0];
      if (!ART) return;

      document.title = ART.title + "｜" + SITE.name;
      var md = $('meta[name="description"]');
      if (md) md.content = ART.excerpt;

      renderCrumbs($("#crumbs"), [
        { name: "ホーム", href: "index.html" },
        { name: "記事", href: "articles.html" },
        { name: ART.title, href: "article.html?id=" + ART.id }
      ]);

      /* 本文を組み立てつつ、h2から目次を自動生成 */
      var toc = [], html = "", hIdx = 0;
      var ul = [];
      function flushList() {
        if (!ul.length) return;
        html += "<ul>" + ul.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
        ul = [];
      }

      ART.body.forEach(function (line) {
        var m;
        if (line.indexOf("## ") === 0) {
          flushList();
          var id = "h" + (++hIdx), text = line.slice(3);
          toc.push({ id: id, text: text });
          html += '<h2 id="' + id + '">' + esc(text) + "</h2>";
        } else if (line.indexOf("- ") === 0) {
          ul.push(line.slice(2));
        } else if ((m = line.match(/^\[cta:(.+)\]$/))) {
          flushList();
          html += ctaBox(byId(m[1]));
        } else {
          flushList();
          html += "<p>" + esc(line) + "</p>";
        }
      });
      flushList();

      var tocHtml = toc.length
        ? '<nav class="toc"><h2>この記事の内容</h2><ul>' +
            toc.map(function (t) { return '<li><a href="#' + t.id + '">' + esc(t.text) + "</a></li>"; }).join("") +
          "</ul></nav>"
        : "";

      $("#article").innerHTML =
        "<h1>" + esc(ART.title) + "</h1>" +
        '<p class="meta">' + esc(ART.date) + "　|　" + esc(ART.category) +
          "　|　約" + ART.readMin + "分　|　執筆：" + esc(SITE.author.name) + "</p>" +
        tocHtml + html;

      jsonLd({
        "@context": "https://schema.org", "@type": "Article",
        headline: ART.title, description: ART.excerpt,
        datePublished: ART.date, dateModified: ART.date,
        author: { "@type": "Person", name: SITE.author.name },
        publisher: { "@type": "Organization", name: SITE.name },
        mainEntityOfPage: SITE.baseUrl + "article.html?id=" + ART.id
      });

      $("#related").innerHTML = "";
      renderPosts($("#related"), 3);
    },

    doc: function () {
      var el = $("#crumbs");
      if (el) renderCrumbs(el, [
        { name: "ホーム", href: "index.html" },
        { name: document.title.split("｜")[0], href: currentFile() }
      ]);
    }
  };

  /* ================= 起動 ================= */
  document.addEventListener("DOMContentLoaded", function () {
    loadGa4();
    renderChrome();

    var page = document.body.dataset.page;
    if (PAGES[page]) PAGES[page]();

    renderStickyCta();

    jsonLd({
      "@context": "https://schema.org", "@type": "WebSite",
      name: SITE.name, url: SITE.baseUrl, description: SITE.description
    });
  });
})();
