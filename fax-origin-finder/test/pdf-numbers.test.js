import test from "node:test";
import assert from "node:assert/strict";
import { extractFaxNumbersFromText, normalizePdfText } from "../public/pdf-numbers.js";

test("PDFテキスト内のハイフン付きFAX番号を抽出する", () => {
  const results = extractFaxNumbersFromText("株式会社みどり　FAX：03-1234-5678　受付時間 9:00-17:00");
  assert.equal(results.length, 1);
  assert.equal(results[0].normalized, "0312345678");
  assert.equal(results[0].formatted, "03-1234-5678");
  assert.match(results[0].context, /株式会社みどり/);
});

test("全角と国際形式を正規化して重複をまとめる", () => {
  const results = extractFaxNumbersFromText("ＦＡＸ ＋８１－３－１２３４－５６７８ / 03 1234 5678");
  assert.equal(results.length, 1);
  assert.equal(results[0].normalized, "0312345678");
});

test("日付や短い管理番号はFAX番号として扱わない", () => {
  assert.deepEqual(extractFaxNumbersFromText("2026-08-21 管理番号 12345678"), []);
  assert.equal(normalizePdfText("ＡＢＣ　１２３"), "ABC 123");
});

test("PDFで記号や括弧に分割されたFAX番号を結合する", () => {
  const results = extractFaxNumbersFromText("FAX：0□3【1・2・3・4】5／6／7／8");
  assert.equal(results.length, 1);
  assert.equal(results[0].normalized, "0312345678");
  assert.equal(results[0].formatted, "03-1234-5678");
});

test("1文字ずつ分割された携帯系番号と国際形式を認識する", () => {
  const results = extractFaxNumbersFromText("FAX 0 5 0 ◆ 1 2 3 4 ◆ 5 6 7 8 / + 81・3・9876・5432");
  assert.deepEqual(results.map((item) => item.normalized), ["05012345678", "0398765432"]);
});

test("記号で区切られた複数番号を別々に抽出する", () => {
  const results = extractFaxNumbersFromText("東京 03／1234／5678 ｜ 大阪 06●9876●5432");
  assert.deepEqual(results.map((item) => item.normalized), ["0312345678", "0698765432"]);
});

test("桁数を超える連続数字の一部をFAX番号として扱わない", () => {
  assert.deepEqual(extractFaxNumbersFromText("管理番号 03123456789"), []);
});

test("受信スタンプの日付と時刻を番号として拾わない", () => {
  // FAX送信票の「08/24/2026 09:30」は、区切りを無視して読むと
  // 0824202609 という10桁の番号に見えてしまう。
  assert.deepEqual(
    extractFaxNumbersFromText("08/24/2026 09:30 0312345678 ABC CORP PAGE 01/03").map((item) => item.normalized),
    ["0312345678"]
  );
  assert.deepEqual(
    extractFaxNumbersFromText("受信日時 2026/08/24 09:30:15 送信元 FAX 03-1234-5678").map((item) => item.normalized),
    ["0312345678"]
  );
  assert.deepEqual(extractFaxNumbersFromText("営業時間 09:00-17:00 定休日 日曜"), []);
});

test("0始まりでも市外局番にならない連番は除外する", () => {
  assert.deepEqual(extractFaxNumbersFromText("請求書番号 0000123456 御中"), []);
});

test("市外局番が4桁・5桁の番号を正しい位置で区切る", () => {
  const results = extractFaxNumbersFromText("ひらつか中央医院 FAX 0463-21-1111 / 浜頓別 FAX 01267-2-2111");
  assert.deepEqual(results.map((item) => item.formatted), ["0463-21-1111", "01267-2-2111"]);
});

test("フリーダイヤルとナビダイヤルを本来の表記で返す", () => {
  const results = extractFaxNumbersFromText("お問い合わせ 0120-123-456 / 0800-123-4567 / 0570-064-000");
  assert.deepEqual(results.map((item) => item.formatted), ["0120-123-456", "0800-123-4567", "0570-064-000"]);
});
