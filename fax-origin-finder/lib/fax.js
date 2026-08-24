// 番号の正規化・整形は public/phone-format.js に集約しています。
// ブラウザ側（public/pdf-numbers.js・public/app.js）と同じ実装を共有するため、
// ここでは再エクスポートと、サーバー側だけで使う検索クエリの組み立てを行います。
import { normalizeFax, formatFax, toHalfWidth } from "../public/phone-format.js";

export {
  toHalfWidth,
  normalizeFax,
  formatFax,
  areaCodeLength,
  isPlausibleJapaneseFax
} from "../public/phone-format.js";

export function buildSearchQuery(value) {
  const digits = normalizeFax(value);
  const formatted = formatFax(digits);
  return `("${formatted}" OR "${digits}") (FAX OR ファックス OR 電話番号)`;
}

export function digitsOnly(value = "") {
  return toHalfWidth(value).replace(/\D/g, "");
}
