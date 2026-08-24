import test from "node:test";
import assert from "node:assert/strict";
import { readFaxNumber } from "../public/pdf-numbers.js";

const reads = (value) => readFaxNumber(value).normalized;

test("区切り記号の違いを吸収する", () => {
  for (const value of [
    "03-1234-5678", "03(1234)5678", "03（1234）5678", "03 1234 5678", "03　1234　5678",
    "03.1234.5678", "03・1234・5678", "03−1234−5678", "03ー1234ー5678", "03‐1234‐5678",
    "03/1234/5678", "０３－１２３４－５６７８", "  03-1234-5678  ", "03-1234\n-5678"
  ]) {
    assert.equal(reads(value), "0312345678", value);
  }
});

test("ラベルが付いていても番号だけを取り出す", () => {
  for (const value of ["FAX:03-1234-5678", "ＦＡＸ　03-1234-5678", "Fax. 03-1234-5678", "℡03-1234-5678", "F 03-1234-5678"]) {
    assert.equal(reads(value), "0312345678", value);
  }
});

test("国際表記を国内表記へ戻す", () => {
  for (const value of ["+81-3-1234-5678", "+81 (0)3 1234 5678", "0081-3-1234-5678", "81-3-1234-5678", "(+81)3-1234-5678"]) {
    assert.equal(reads(value), "0312345678", value);
  }
});

test("Excelで落ちた先頭の0を、実在する番号帯のときだけ補う", () => {
  assert.equal(reads("312345678"), "0312345678");
  assert.equal(reads("9012345678"), "09012345678");
  assert.equal(readFaxNumber("312345678").note, "先頭の0を補いました");
  // 0を補っても実在しない番号帯になる値は、補正せず要確認にする
  assert.equal(readFaxNumber("012345678").valid, false);
  assert.equal(readFaxNumber("099999999").valid, false);
});

test("内線などの余分な数字を切り離す", () => {
  assert.equal(reads("03-1234-5678 内線123"), "0312345678");
  assert.equal(reads("03-1234-5678(内線 123)"), "0312345678");
  assert.equal(reads("03-1234-5678（代）"), "0312345678");
});

test("1つの欄に複数あるときはFAXのラベルが近いものを選ぶ", () => {
  const both = readFaxNumber("TEL 03-1234-5677 FAX 03-1234-5678");
  assert.equal(both.normalized, "0312345678");
  assert.deepEqual(both.others, ["0312345677"]);
  assert.match(both.note, /2件/);

  // ラベルがないときは先に出てきたものを採る
  assert.equal(reads("03-1234-5678／03-1234-5679"), "0312345678");
  assert.equal(reads("03-1234-5678、03-1234-5679"), "0312345678");
});

test("縦書き書類の漢数字を読む", () => {
  assert.equal(reads("〇三－一二三四－五六七八"), "0312345678");
  assert.equal(reads("〇四六三－二一－一一一一"), "0463211111");
});

test("読み取れない値には理由を添える", () => {
  assert.equal(readFaxNumber("").note, "番号が入っていません");
  assert.equal(readFaxNumber("なし").note, "数字が含まれていません");
  assert.match(readFaxNumber("1234").note, /桁が足りません/);
  assert.match(readFaxNumber("0000123456").note, /番号帯/);
  // Excelが指数表記に変えた値は元の桁が失われているので、補正せず知らせる
  assert.match(readFaxNumber("3.12346E+09").note, /指数表記/);
  assert.equal(readFaxNumber("3.12346E+09").valid, false);
});

test("市外局番の桁数どおりに整形して返す", () => {
  assert.equal(readFaxNumber("０４６３（２１）１１１１").formatted, "0463-21-1111");
  assert.equal(readFaxNumber("FAX 01267-2-2111").formatted, "01267-2-2111");
  assert.equal(readFaxNumber("0120 123 456").formatted, "0120-123-456");
});
