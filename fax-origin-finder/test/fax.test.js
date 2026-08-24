import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFax, formatFax, isPlausibleJapaneseFax, buildSearchQuery } from "../lib/fax.js";

test("全角・国際形式のFAX番号を正規化する", () => {
  assert.equal(normalizeFax("０３－１２３４－５６７８"), "0312345678");
  assert.equal(normalizeFax("+81 3 1234 5678"), "0312345678");
  assert.equal(normalizeFax("0081-3-1234-5678"), "0312345678");
});

test("主要な日本の番号形式を見やすく整形する", () => {
  assert.equal(formatFax("0312345678"), "03-1234-5678");
  assert.equal(formatFax("0612345678"), "06-1234-5678");
  assert.equal(formatFax("09012345678"), "090-1234-5678");
  assert.equal(formatFax("0451234567"), "045-123-4567");
});

test("日本の電話番号として妥当な桁数だけを許可する", () => {
  assert.equal(isPlausibleJapaneseFax("03-1234-5678"), true);
  assert.equal(isPlausibleJapaneseFax("090-1234-5678"), true);
  assert.equal(isPlausibleJapaneseFax("1234"), false);
  assert.equal(isPlausibleJapaneseFax("+1 212 555 0100"), false);
});

test("ハイフン有無の両方を含む検索クエリを作る", () => {
  assert.equal(buildSearchQuery("03-1234-5678"), '("03-1234-5678" OR "0312345678") (FAX OR ファックス OR 電話番号)');
});
