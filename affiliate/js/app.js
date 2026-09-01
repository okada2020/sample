/* =====================================================================
 * app.js  ―  ブラウザ側の処理
 * ---------------------------------------------------------------------
 * 役割は2つだけです。
 *  1. 静的化していないページ（開発中）の中身を render.js で描画する
 *  2. 操作が必要な部分（診断・絞り込み・シミュレーター・追従CTA）を動かす
 *
 * build.js で静的化したページには <body data-prerendered="1"> が付き、
 * 1 はスキップされます（描き直しによるチラつきを防ぐため）。
 * ===================================================================== */
(function () {
  "use strict";

  var R = window.RENDER;
  var SITE = window.SITE;
  var PRE = document.body.dataset.prerendered === "1";

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  R.init({
    SITE: SITE, SERVICES: window.SERVICES,
    QUIZ: window.QUIZ, FAQS: window.FAQS, ARTICLES: window.ARTICLES
  }, { base: document.body.dataset.base || "", cleanUrls: PRE });

  /* 静的化済みなら何もしない。未描画のときだけ中身を入れる */
  function fill(sel, html) {
    var el = $(sel);
    if (!el) return null;
    if (!PRE) el.innerHTML = html;
    return el;
  }
  function head(html) {
    if (!PRE) document.head.insertAdjacentHTML("beforeend", html);
  }

  /* ================= 計測 ================= */
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
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  /* アフィリンクのクリックをまとめて計測（動的に足された要素にも効く） */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-aff]");
    if (!a) return;
    track("affiliate_click", {
      service_id: a.dataset.aff, service_name: a.dataset.affName,
      position: a.dataset.affPos, page_path: location.pathname
    });
  });

  /* ================= ハンバーガーメニュー ================= */
  function initMenu() {
    var btn = $(".menu-btn"), drawer = $("#drawer");
    if (!btn || !drawer) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      drawer.classList.toggle("open", !open);
    });
  }

  /* ================= 追従CTA ================= */
  function initSticky() {
    var bar = $(".sticky-cta");
    if (!bar) {
      var html = R.stickyCta();
      if (!html) return;
      document.body.insertAdjacentHTML("beforeend", html);
      bar = $(".sticky-cta");
      if (!bar) return;
    }
    document.body.classList.add("has-sticky");
    /* いきなり出すと邪魔なので、少し読み進めてから表示する */
    var onScroll = function () { bar.classList.toggle("show", window.scrollY > 300); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ================= 診断チャート ================= */
  function initQuiz() {
    var el = $("#quiz");
    if (!el || !window.QUIZ) return;
    var step = 0, picked = [];

    function drawQuestion() {
      el.innerHTML = R.quizQuestion(step);
      bind();
    }
    function bind() {
      var opts = $(".quiz-options", el);
      if (opts) {
        opts.addEventListener("click", function (e) {
          var b = e.target.closest("button[data-i]");
          if (!b) return;
          picked[step] = window.QUIZ[step].options[Number(b.dataset.i)].tags;
          step++;
          if (step < window.QUIZ.length) drawQuestion();
          else drawResult();
        });
      }
      var back = $("[data-back]", el);
      if (back) back.addEventListener("click", function () { step--; drawQuestion(); });
    }
    function drawResult() {
      var flat = [].concat.apply([], picked.slice(0, step));
      /* 同じタグが複数の設問から来るため重複を除く */
      var uniq = flat.filter(function (t, i) { return flat.indexOf(t) === i; });
      el.innerHTML = R.quizResult(flat);
      $("[data-retry]", el).addEventListener("click", function () {
        step = 0; picked = []; drawQuestion();
      });
      /* 「どの条件で」「どのサービスを薦めたか」の両方を残す。
         薦めた回数と実際のクリック数を突き合わせると、
         診断ロジックが的外れになっていないかを検証できる。 */
      var rec = $(".quiz-result-head strong", el);
      track("quiz_complete", {
        answers: uniq.join(","),
        result_service: rec ? rec.textContent : ""
      });
    }

    /* 静的化済みなら質問1のHTMLが既にあるので、handlerだけ付ける */
    if (PRE && $(".quiz-options", el)) bind();
    else drawQuestion();
  }

  /* ================= 料金シミュレーター ================= */
  function initSimulator() {
    var sim = $("#sim");
    if (!sim) return;
    sim.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-people]");
      if (!b) return;
      $$("button[data-people]", sim).forEach(function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
      var n = Number(b.dataset.people);
      $("[data-sim-out]", sim).innerHTML = R.simResults(n);
      track("simulator_change", { people: n });
    });
  }

  /* ================= 比較表の絞り込み ================= */
  function initFilters() {
    var box = $("#compare");
    if (!box) return;
    var filters = $(".cmp-filters", box);
    if (!filters) return;

    filters.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-g]");
      if (!btn) return;
      $$("button[data-g]", filters).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      var g = btn.dataset.g, shown = 0;
      /* 行の data-genres を見て表示/非表示を切り替える（再描画しない） */
      $$(".cmp tbody tr", box).forEach(function (tr) {
        var hit = !g || tr.dataset.genres.split("|").indexOf(g) !== -1;
        tr.hidden = !hit;
        if (hit) shown++;
      });
      var empty = $("[data-empty]", box);
      if (empty) empty.hidden = shown > 0;
      track("compare_filter", { genre: g || "all", shown: shown });
    });
  }

  /* ================= ページごとの描画（静的化していない場合のみ） ================= */
  var PAGES = {
    home: function () {
      fill("#quiz", R.quizQuestion(0));
      fill("#ranking", R.rankList(R.ranked().slice(0, 5)));
      fill("#simulator", R.simulator());
      fill("#compare", R.compareBlock(false));
      fill("#faq", R.faqList());
      fill("#posts", R.postGrid(window.ARTICLES.slice(0, 3)));
      head(R.ld(R.ldItemList()) + R.ld(R.ldFaq()));
    },

    compare: function () {
      fill("#crumbs", R.crumbs([
        { name: "ホーム", href: R.url.page("index.html") },
        { name: "全社比較", href: R.url.page("compare.html") }
      ]));
      fill("#compare", R.compareBlock(true));
      fill("#simulator", R.simulator());
      fill("#ranking", R.rankList(R.ranked()));
      fill("#faq", R.faqList());
      head(R.ld(R.ldFaq()));
    },

    service: function () {
      if (PRE) return;
      var sv = R.byId(param("id")) || R.ranked()[0];
      document.title = sv.name + "の評判・料金は？メリットと注意点｜" + SITE.name;
      var md = $('meta[name="description"]');
      if (md) md.content = sv.name + "の料金・作品数・無料体験を利用者目線で解説。" + sv.catch;
      fill("#crumbs", R.crumbs([
        { name: "ホーム", href: R.url.page("index.html") },
        { name: "全社比較", href: R.url.page("compare.html") },
        { name: sv.name, href: R.url.service(sv.id) }
      ]));
      fill("#detail", R.serviceDetail(sv));
      fill("#others", R.rankList(R.ranked().filter(function (s) { return s.id !== sv.id; }).slice(0, 3)));
    },

    articles: function () {
      fill("#crumbs", R.crumbs([
        { name: "ホーム", href: R.url.page("index.html") },
        { name: "記事", href: R.url.page("articles.html") }
      ]));
      fill("#posts", R.postGrid(window.ARTICLES));
    },

    article: function () {
      if (PRE) return;
      var a = window.ARTICLES.filter(function (x) { return x.id === param("id"); })[0] || window.ARTICLES[0];
      if (!a) return;
      document.title = a.title + "｜" + SITE.name;
      var md = $('meta[name="description"]');
      if (md) md.content = a.excerpt;
      fill("#crumbs", R.crumbs([
        { name: "ホーム", href: R.url.page("index.html") },
        { name: "記事", href: R.url.page("articles.html") },
        { name: a.title, href: R.url.article(a.id) }
      ]));
      fill("#article", R.articleBody(a));
      fill("#related", R.postGrid(window.ARTICLES.filter(function (x) { return x.id !== a.id; }).slice(0, 3)));
      head(R.ld(R.ldArticle(a)));
    },

    doc: function () {
      var el = $("#crumbs");
      if (!el) return;
      var f = location.pathname.split("/").pop() || "index.html";
      fill("#crumbs", R.crumbs([
        { name: "ホーム", href: R.url.page("index.html") },
        { name: document.title.split("｜")[0], href: R.url.page(f) }
      ]));
    }
  };

  /* ================= 起動 ================= */
  loadGa4();

  if (!PRE) {
    var h = $("#site-header"), f = $("#site-footer");
    if (h) h.outerHTML = R.header(location.pathname.split("/").pop() || "index.html");
    if (f) f.outerHTML = R.footer();
    head(R.ld(R.ldWebsite()));
  }

  var page = document.body.dataset.page;
  if (PAGES[page]) PAGES[page]();

  initMenu();
  initQuiz();
  initSimulator();
  initFilters();
  initSticky();
})();
