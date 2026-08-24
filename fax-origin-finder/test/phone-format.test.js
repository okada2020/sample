import test from "node:test";
import assert from "node:assert/strict";
import { areaCodeLength, formatFax, isPlausibleJapaneseFax, normalizeFax } from "../public/phone-format.js";

test("市外局番の桁数に合わせて区切り位置を変える", () => {
  // 市外局番は2桁から5桁まであり、一律に3桁で切ると地方の番号がすべてずれる。
  assert.equal(formatFax("0332121111"), "03-3212-1111");
  assert.equal(formatFax("0452111111"), "045-211-1111");
  assert.equal(formatFax("0463211111"), "0463-21-1111");
  assert.equal(formatFax("0995421111"), "0995-42-1111");
  assert.equal(formatFax("0126722111"), "01267-2-2111");
  assert.equal(formatFax("0499221111"), "04992-2-1111");
});

test("携帯・IP電話・フリーダイヤルを正しい形で整形する", () => {
  assert.equal(formatFax("09012345678"), "090-1234-5678");
  assert.equal(formatFax("05030001111"), "050-3000-1111");
  assert.equal(formatFax("06012345678"), "060-1234-5678");
  assert.equal(formatFax("08001234567"), "0800-123-4567");
  assert.equal(formatFax("0120123456"), "0120-123-456");
  assert.equal(formatFax("0570064000"), "0570-064-000");
  assert.equal(formatFax("0990511234"), "0990-511-234");
});

test("整形済みの番号を渡しても同じ結果になる", () => {
  assert.equal(formatFax("0463-21-1111"), "0463-21-1111");
  assert.equal(formatFax("０４６３－２１－１１１１"), "0463-21-1111");
  assert.equal(formatFax("0463(21)1111"), "0463-21-1111");
});

test("国際形式を国内表記へ戻す", () => {
  assert.equal(normalizeFax("+81 3 1234 5678"), "0312345678");
  assert.equal(normalizeFax("0081-3-1234-5678"), "0312345678");
  // +81-(0)3-… のように0が併記されていても二重にしない
  assert.equal(normalizeFax("+81-(0)3-1234-5678"), "0312345678");
});

test("市外局番として割り当てのない番号帯を弾く", () => {
  assert.equal(areaCodeLength("0463211111"), 4);
  assert.equal(areaCodeLength("0000123456"), 0);
  assert.equal(isPlausibleJapaneseFax("0000123456"), false);
  // 090で始まる10桁は携帯としても固定電話としても成立しない
  assert.equal(isPlausibleJapaneseFax("0901234567"), false);
  assert.equal(isPlausibleJapaneseFax("1234"), false);
  assert.equal(isPlausibleJapaneseFax("+1 212 555 0100"), false);
  assert.equal(isPlausibleJapaneseFax("0463-21-1111"), true);
  assert.equal(isPlausibleJapaneseFax("0120-123-456"), true);
});

test("市外局番テーブルがlibphonenumberと全番号帯で一致する", async (t) => {
  let parsePhoneNumberFromString;
  try {
    ({ parsePhoneNumberFromString } = await import("libphonenumber-js"));
  } catch {
    return t.skip("libphonenumber-js が未インストールのため省略します");
  }

  const mismatches = [];
  // 市外局番と市内局番を合わせた6桁すべてを突き合わせる。
  for (let index = 0; index < 100000; index++) {
    const digits = `0${String(index).padStart(5, "0")}1234`;
    const expected = parsePhoneNumberFromString(digits, "JP")?.formatNational();
    if (!expected?.includes("-")) continue;
    const actual = formatFax(digits);
    if (actual !== expected) mismatches.push(`${digits}: ${actual} ≠ ${expected}`);
  }
  assert.deepEqual(mismatches, []);
});
