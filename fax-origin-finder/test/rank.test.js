import test from "node:test";
import assert from "node:assert/strict";
import { rankResults, confidenceLabel, inferOrganization } from "../lib/rank.js";

test("番号が明記された公式系ページを上位にする", () => {
  const ranked = rankResults("03-1234-5678", [
    { title: "電話番号口コミ", description: "似た番号の情報", url: "https://example.net/list" },
    { title: "株式会社みどり｜会社概要", description: "FAX 03-1234-5678", url: "https://midori.co.jp/company" }
  ]);
  assert.equal(ranked[0].organization, "株式会社みどり");
  assert.equal(ranked[0].exactNumber, true);
  assert.ok(ranked[0].score >= 80);
});

test("番号が本文にない一般的なFAXページはexactNumberにならない", () => {
  const [ranked] = rankResults("03-1234-5678", [
    { title: "IP-ファクスを送信する", description: "FAXの使い方です", url: "https://example.jp/fax" }
  ]);
  assert.equal(ranked.exactNumber, false);
  assert.ok(ranked.score < 55);
});

test("確度ラベルを閾値どおり返す", () => {
  assert.equal(confidenceLabel(80), "高");
  assert.equal(confidenceLabel(55), "中");
  assert.equal(confidenceLabel(54), "低");
});

test("タイトルが一般名詞なら説明文の法人名を使う", () => {
  assert.equal(inferOrganization("電話番号検索", "株式会社あおぞら、東京都の事業者です。", "https://example.jp"), "株式会社あおぞら");
});
