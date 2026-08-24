import test from "node:test";
import assert from "node:assert/strict";
import { parseDuckDuckGoHtml } from "../lib/search.js";

test("DuckDuckGo HTML検索結果からタイトル・転送先・要約を抽出する", () => {
  const html = `
    <div class="result results_links results_links_deep web-result">
      <h2><a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.co.jp%2Fcompany">株式会社サンプル &amp; 会社概要</a></h2>
      <a class="result__snippet">FAX 03-1234-5678 を掲載しています。</a>
    </div>`;
  const results = parseDuckDuckGoHtml(html);
  assert.equal(results.length, 1);
  assert.equal(results[0].title, "株式会社サンプル & 会社概要");
  assert.equal(results[0].url, "https://example.co.jp/company");
  assert.match(results[0].description, /03-1234-5678/);
});
