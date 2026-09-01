#!/usr/bin/env node
/* =====================================================================
 * build.js  ―  公開用の静的サイトを dist/ に書き出す
 * ---------------------------------------------------------------------
 *   node build.js
 *
 * やっていること：
 *  ・data/ の内容を render.js でHTMLに焼き込む
 *    → JavaScriptが動かない状態でも全文が読める＝検索エンジンに確実に伝わる
 *    → 描画待ちが無くなるので表示が速く、レイアウトのガタつきも起きない
 *  ・?id= のURLを service/u-next.html のようなきれいなURLに変換する
 *  ・sitemap.xml と robots.txt を実URLで生成する
 *
 * 開発中は dist/ を作らず affiliate/ をそのまま開けば動きます（今まで通り）。
 * ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const SRC = __dirname;
const OUT = path.join(SRC, "dist");

/* ---- データとレンダラを読み込む ---- */
const g = {};
for (const f of ["site", "services", "content"]) {
  new Function("window", fs.readFileSync(path.join(SRC, "data", f + ".js"), "utf8"))(g);
}
const R = require("./js/render.js");

const DATA = { SITE: g.SITE, SERVICES: g.SERVICES, QUIZ: g.QUIZ, FAQS: g.FAQS, ARTICLES: g.ARTICLES };
const SITE = g.SITE;
const DOMAIN = SITE.baseUrl.replace(/\/+$/, "") + "/";

/* ---- 小道具 ---- */
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
function write(rel, body) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body);
}
function copy(rel) {
  const from = path.join(SRC, rel), to = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

/* 空のプレースホルダ <tag id="x"></tag> の中身を埋める */
function inject(html, id, content) {
  const re = new RegExp(`(<(\\w+)[^>]*\\bid="${id}"[^>]*>)\\s*</\\2>`);
  if (!re.test(html)) throw new Error(`プレースホルダ #${id} が見つかりません`);
  return html.replace(re, (_m, open, tag) => `${open}${content}</${tag}>`);
}
/* <div id="site-header"></div> のように要素ごと差し替える */
function replaceEl(html, id, content) {
  const re = new RegExp(`<(\\w+)[^>]*\\bid="${id}"[^>]*>\\s*</\\1>`);
  if (!re.test(html)) throw new Error(`要素 #${id} が見つかりません`);
  return html.replace(re, content);
}
const setAttr = (html, re, val) => html.replace(re, val);

/* ---- ページ共通の仕上げ ---- */
function finish(html, opt) {
  const base = opt.base || "";

  // body に静的化フラグと基準パスを持たせる（app.js が参照する）
  html = html.replace(/<body([^>]*)>/, `<body$1 data-prerendered="1" data-base="${base}">`);

  // ヘッダー・フッター・追従CTAを埋め込む
  html = replaceEl(html, "site-header", R.header(opt.current));
  html = replaceEl(html, "site-footer", R.footer() + R.stickyCta());

  // 構造化データを head に追加
  if (opt.ld && opt.ld.length) {
    html = html.replace("</head>", opt.ld.map(R.ld).join("") + "\n</head>");
  }

  // title / description / canonical / og を差し替える
  // og:title は必ず title と揃える。
  // テンプレを流用したサイトで旧サイト名が og:title だけ残る事故を防ぐ。
  const pageTitle = opt.title || (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  if (pageTitle) {
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,
                        (_m, a, b) => a + R.esc(pageTitle) + b);
  }
  if (opt.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${R.esc(opt.title)}</title>`);
  }
  if (opt.desc) {
    const d = R.esc(opt.desc);
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, (_m, a, b) => a + d + b);
    html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, (_m, a, b) => a + d + b);
  }
  // OGP画像は常にサイト直下の ogp.jpg。baseUrl を変えれば自動で追従する
  html = setAttr(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${DOMAIN}ogp.jpg$2`);

  const canonical = DOMAIN + (opt.path === "index.html" ? "" : opt.path);
  html = setAttr(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`);
  html = setAttr(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`);

  // サブディレクトリのページは、アセットとページへの相対リンクをずらす
  // （テンプレートにベタ書きされた href="compare.html" 等が壊れるのを防ぐ）
  if (base) {
    html = html.replace(/((?:href|src)=")(css\/|js\/|data\/|favicon\.svg)/g, `$1${base}$2`);
    html = html.replace(
      /(href=")(index|compare|articles|about|privacy)\.html(")/g,
      `$1${base}$2.html$3`);
  }
  return html;
}

/* ===================== 生成 ===================== */
fs.rmSync(OUT, { recursive: true, force: true });

const pages = [];   // sitemap用 [path, priority]
let count = 0;
const emit = (rel, html, priority) => {
  write(rel, html);
  pages.push([rel, priority]);
  count++;
};

/* ---------- トップ ---------- */
/* トップページはサイトごとに構成が違うため、テンプレートに存在する部品だけ埋める。
   中身は関数で受け取り、その部品が無いページでは生成自体を行わない
   （例：診断を使わないサイトで QUIZ 未定義のまま生成しようとして落ちるのを防ぐ） */
function injectOpt(html, id, build) {
  return new RegExp(`\\bid="${id}"`).test(html) ? inject(html, id, build()) : html;
}

R.init(DATA, { base: "", cleanUrls: true });
{
  let h = read("index.html");
  h = injectOpt(h, "quiz", () => R.quizQuestion(0));
  h = injectOpt(h, "picker", () => R.picker());
  h = injectOpt(h, "ranking", () => R.rankList(R.ranked().slice(0, 5)));
  h = injectOpt(h, "simulator", () => R.simulator());
  h = injectOpt(h, "compare", () => R.compareBlock(false));
  h = injectOpt(h, "faq", () => R.faqList());
  h = injectOpt(h, "posts", () => R.postGrid(DATA.ARTICLES.slice(0, 3)));
  emit("index.html", finish(h, {
    current: "index.html", path: "index.html",
    ld: [R.ldWebsite(), R.ldItemList(), R.ldFaq()]
  }), "1.0");
}

/* ---------- 全社比較 ---------- */
{
  const crumbs = [
    { name: "ホーム", href: "index.html" },
    { name: "全社比較", href: "compare.html" }
  ];
  let h = read("compare.html");
  h = inject(h, "crumbs", R.crumbs(crumbs));
  h = inject(h, "compare", R.compareBlock(true));
  h = inject(h, "simulator", R.simulator());
  h = inject(h, "ranking", R.rankList(R.ranked()));
  h = inject(h, "faq", R.faqList());
  emit("compare.html", finish(h, {
    current: "compare.html", path: "compare.html",
    ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs), R.ldFaq()]
  }), "0.9");
}

/* ---------- 記事一覧 ---------- */
{
  const crumbs = [
    { name: "ホーム", href: "index.html" },
    { name: "記事", href: "articles.html" }
  ];
  let h = read("articles.html");
  h = inject(h, "crumbs", R.crumbs(crumbs));
  h = inject(h, "posts", R.postGrid(DATA.ARTICLES));
  emit("articles.html", finish(h, {
    current: "articles.html", path: "articles.html",
    ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs)]
  }), "0.7");
}

/* ---------- 固定ページ ---------- */
for (const [file, pri] of [["about.html", "0.4"], ["privacy.html", "0.3"]]) {
  let h = read(file);
  const title = h.match(/<title>([^<]*)<\/title>/)[1].split("｜")[0];
  const crumbs = [{ name: "ホーム", href: "index.html" }, { name: title, href: file }];
  h = inject(h, "crumbs", R.crumbs(crumbs));
  emit(file, finish(h, {
    current: file, path: file, ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs)]
  }), pri);
}

/* ---------- サービス詳細（1社1ファイル） ---------- */
for (const sv of R.ranked()) {
  R.init(DATA, { base: "../", cleanUrls: true, currentId: sv.id });
  const rel = `service/${sv.id}.html`;
  const crumbs = [
    { name: "ホーム", href: "../index.html" },
    { name: "全社比較", href: "../compare.html" },
    { name: sv.name, href: rel }
  ];
  let h = read("service.html");
  h = inject(h, "crumbs", R.crumbs(crumbs));
  h = inject(h, "detail", R.serviceDetail(sv));
  h = inject(h, "others", R.rankList(R.ranked().filter((s) => s.id !== sv.id).slice(0, 3)));
  emit(rel, finish(h, {
    base: "../", current: "", path: rel,
    title: `${sv.name}の評判・料金は？メリットと注意点｜${SITE.name}`,
    desc: R.serviceDesc(sv),
    ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs)]
  }), "0.8");
}

/* ---------- 記事詳細（1本1ファイル） ----------
 * 直前のサービス詳細ループで currentId が残っていると、記事ページの
 * 追従CTAがそのサービスになってしまうため明示的に解除する
 * ------------------------------------------------------------------ */
R.init(DATA, { base: "../", cleanUrls: true, currentId: "" });
for (const a of DATA.ARTICLES) {
  const rel = `article/${a.id}.html`;
  const crumbs = [
    { name: "ホーム", href: "../index.html" },
    { name: "記事", href: "../articles.html" },
    { name: a.title, href: rel }
  ];
  let h = read("article.html");
  h = inject(h, "crumbs", R.crumbs(crumbs));
  h = inject(h, "article", R.articleBody(a));
  h = inject(h, "related", R.postGrid(DATA.ARTICLES.filter((x) => x.id !== a.id).slice(0, 3)));
  emit(rel, finish(h, {
    base: "../", current: "", path: rel,
    title: `${a.title}｜${SITE.name}`, desc: a.excerpt,
    ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs), R.ldArticle(a)]
  }), "0.6");
}

/* ---------- 404ページ ----------
 * 存在しないURLに来た訪問者をトップやランキングへ誘導して取りこぼしを防ぐ。
 * どの階層のURLで表示されても資産を読めるよう、パスは絶対指定にする。
 * sitemap には載せない（noindex のため）。
 * ------------------------------------------------------------------ */
{
  const sitePath = new URL(DOMAIN).pathname;   // 例: "/sample/"
  R.init(DATA, { base: sitePath, cleanUrls: true });
  let h = read("404.html");
  h = inject(h, "ranking", R.rankList(R.ranked().slice(0, 3)));
  h = inject(h, "posts", R.postGrid(DATA.ARTICLES.slice(0, 3)));
  write("404.html", finish(h, { base: sitePath, current: "", path: "404.html" }));
  count++;
}

/* ---------- 静的アセット ---------- */
["css/style.css", "css/theme.css", "js/render.js", "js/app.js",
 "data/site.js", "data/services.js", "data/content.js",
 "favicon.svg", "ogp.jpg", "_headers"].forEach(copy);

/* ---------- robots.txt / sitemap.xml ---------- */
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}sitemap.xml\n`);

const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(([p, pri]) =>
    `  <url>\n    <loc>${DOMAIN}${p === "index.html" ? "" : p}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n    <priority>${pri}</priority>\n  </url>`
  ).join("\n") + "\n</urlset>\n");

/* ---------- データ整合性の検査 ----------
 * 診断タグのタイプミスや、どの回答でも選ばれないサービスは
 * 見た目では気づけないため、ビルド時に機械的に検出する。
 * ------------------------------------------------------------------ */
{
  const problems = [];
  const allTags = new Set();
  g.SERVICES.forEach((s) => (s.recommendedFor || []).forEach((t) => allTags.add(t)));

  // 質問側のタグが、どのサービスの recommendedFor にも無い（＝採点に効かない死にタグ）
  const askTags = new Set();
  if (SITE.picker) {
    SITE.picker.options.forEach((o) => (o.tags || []).forEach((t) => askTags.add(t)));
  } else {
    (g.QUIZ || []).forEach((q) => q.options.forEach((o) => (o.tags || []).forEach((t) => askTags.add(t))));
  }
  [...askTags].filter((t) => !allTags.has(t))
    .forEach((t) => problems.push(`質問のタグ「${t}」がどのサービスの recommendedFor にも存在しません`));

  // サービス側のタグが、どの質問にも登場しない（＝一度も加点されない死にタグ）
  g.SERVICES.forEach((s) => (s.recommendedFor || [])
    .filter((t) => !askTags.has(t))
    .forEach((t) => problems.push(`${s.name} の「${t}」はどの質問にも無く、採点に使われません`)));

  // 全回答パターンを試し、一度も1位にならないサービスを検出。
  // 3問診断のサイトは全組み合わせ、キャリア選択パネルのサイトは各選択肢を1回ずつ試す。
  const usesQuiz = (g.QUIZ || []).length > 0 && !SITE.picker;
  const combos = SITE.picker
    ? SITE.picker.options.map((o) => o.tags)
    : (g.QUIZ || []).reduce((acc, q) =>
        acc.flatMap((prev) => q.options.map((o) => prev.concat(o.tags))), [[]]);
  if (combos.length) {
    const winners = new Set(combos.map((tags) => {
      const scored = g.SERVICES.map((s) => ({
        s, hit: (s.recommendedFor || []).filter((t) => tags.includes(t)).length
      })).sort((a, b) => b.hit - a.hit || a.s.rank - b.s.rank);
      return scored[0].s.id;
    }));
    g.SERVICES.filter((s) => !winners.has(s.id))
      .forEach((s) => problems.push(`${s.name} は診断のどの回答でも1位にならず、到達できません`));
  }

  // 参照の実在チェック
  (g.ARTICLES || []).forEach((a) => a.body.forEach((line) => {
    const m = String(line).match(/^\[cta:(.+)\]$/);
    if (m && !g.SERVICES.some((s) => s.id === m[1]))
      problems.push(`記事「${a.title}」の [cta:${m[1]}] が実在しません`);
  }));
  if (SITE.stickyCta && SITE.stickyCta.enabled &&
      !g.SERVICES.some((s) => s.id === SITE.stickyCta.serviceId))
    problems.push(`stickyCta.serviceId「${SITE.stickyCta.serviceId}」が実在しません`);

  if (problems.length) {
    console.log("\n■ データ整合性の警告");
    problems.forEach((t) => console.log("  ⚠ " + t));
  }
}

/* ---------- 完了レポート ---------- */
console.log(`\n✓ dist/ に ${count} ページを生成しました`);
if (SITE.demoMode) {
  console.log("\n⚠ demoMode が true です。サンプル警告バーが表示されたままになります。");
}
if (/example\.com/.test(SITE.baseUrl)) {
  console.log("⚠ baseUrl が example.com のままです。data/site.js を公開ドメインに変更してください。");
}
const unset = g.SERVICES.filter((s) => !s.url || /^#/.test(s.url));
if (unset.length) {
  console.log(`⚠ アフィリンク未設定：${unset.map((s) => s.name).join(", ")}`);
}
// ポイントが月額以上だと「実質0円」と表示され、景表法上の有利誤認になりかねない
const freeish = g.SERVICES.filter((s) => (s.points || 0) >= s.price);
if (freeish.length) {
  console.log(`⚠ points が月額以上のため「実質¥0」と表示されます：` +
    `${freeish.map((s) => s.name).join(", ")}　データを確認してください`);
}
console.log("");
