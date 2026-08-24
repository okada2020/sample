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

test("市外局番どおりに区切った番号だけを検索語にする", () => {
  // ORや付加キーワードを混ぜると完全一致を見失うため、番号だけを引用符で囲む
  assert.equal(buildSearchQuery("03-1234-5678"), '"03-1234-5678"');
  assert.equal(buildSearchQuery("0463211111"), '"0463-21-1111"');
  assert.equal(buildSearchQuery("０１２６７－２－２１１１"), '"01267-2-2111"');
});
