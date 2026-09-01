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
  if (opt.title) {
    html = setAttr(html, /<title>[\s\S]*?<\/title>/, `<title>${R.esc(opt.title)}</title>`);
    html = setAttr(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${R.esc(opt.title)}$2`);
  }
  if (opt.desc) {
    html = setAttr(html, /(<meta name="description" content=")[^"]*(")/, `$1${R.esc(opt.desc)}$2`);
    html = setAttr(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${R.esc(opt.desc)}$2`);
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
R.init(DATA, { base: "", cleanUrls: true });
{
  let h = read("index.html");
  h = inject(h, "quiz", R.quizQuestion(0));
  h = inject(h, "ranking", R.rankList(R.ranked().slice(0, 5)));
  h = inject(h, "simulator", R.simulator());
  h = inject(h, "compare", R.compareBlock(false));
  h = inject(h, "faq", R.faqList());
  h = inject(h, "posts", R.postGrid(DATA.ARTICLES.slice(0, 3)));
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
R.init(DATA, { base: "../", cleanUrls: true });
for (const sv of R.ranked()) {
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
    desc: `${sv.name}の料金・作品数・無料体験を利用者目線で解説。${sv.catch}`,
    ld: [R.ldWebsite(), R.ldBreadcrumb(crumbs)]
  }), "0.8");
}

/* ---------- 記事詳細（1本1ファイル） ---------- */
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
["css/style.css", "js/render.js", "js/app.js",
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

/* ---------- 完了レポート ---------- */
console.log(`\n✓ dist/ に ${count} ページを生成しました`);
if (SITE.demoMode) {
  console.log("\n⚠ demoMode が true です。サンプル警告バーが表示されたままになります。");
}
if (/example\.com/.test(SITE.baseUrl)) {
  console.log("⚠ baseUrl が example.com のままです。data/site.js を公開ドメインに変更してください。");
}
const unset = g.SERVICES.filter((s) => /REPLACE_WITH_ASP_LINK|^#$/.test(s.url));
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
