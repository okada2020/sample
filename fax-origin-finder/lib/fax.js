// 番号の正規化・整形は public/phone-format.js に集約しています。
// ブラウザ側（public/pdf-numbers.js・public/app.js）と同じ実装を共有するため、
// ここでは再エクスポートと、サーバー側だけで使う検索クエリの組み立てを行います。
import { normalizeFax, formatFax, toHalfWidth } from "../public/phone-format.js";

export { readFaxNumber } from "../public/pdf-numbers.js";

export {
  toHalfWidth,
  normalizeFax,
  formatFax,
  areaCodeLength,
  isPlausibleJapaneseFax
} from "../public/phone-format.js";

/**
 * 検索エンジンは OR や付加キーワードを混ぜると、番号そのものの完全一致を
 * 見失う。実在する公開番号（0463-23-9467）で確かめたところ、
 *   "0463-23-9467"                         → 掲載元が1〜2位
 *   "0463239467"                           → 掲載元は出ず、番号案内サイトばかり
 *   ("0463-23-9467" OR "0463239467") (FAX…) → 掲載元が出ない
 *   "0463-23-9467" OR "0463(23)9467"       → 掲載元が出ない
 * という差が出た。市外局番どおりに区切った番号だけを引用符で囲むのが最も当たる。
 */
export function buildSearchQuery(value) {
  return `"${formatFax(value)}"`;
}

export function digitsOnly(value = "") {
  return toHalfWidth(value).replace(/\D/g, "");
}
