// 日本の電話番号・FAX番号の正規化と整形。
// ブラウザ（public/app.js・public/pdf-numbers.js）とサーバー（lib/fax.js）の
// 両方から読み込むため、依存も相対パス以外のimportも持たせていません。
import { JP_AREA_CODE_TABLE } from "./jp-area-codes.js";

let areaCodeRuns = null;

// 連長圧縮した表を「区間の開始位置」と「その区間の値」に展開しておき、
// 参照は二分探索で行う。10万件の配列を持たずに済む。
function areaCodeTable() {
  if (areaCodeRuns) return areaCodeRuns;
  const starts = [];
  const values = [];
  let offset = 0;
  for (const run of JP_AREA_CODE_TABLE.split(",")) {
    const [value, count] = run.split("x").map(Number);
    starts.push(offset);
    values.push(value);
    offset += count;
  }
  areaCodeRuns = { starts, values };
  return areaCodeRuns;
}

function lookupAreaCodeLength(prefix) {
  const { starts, values } = areaCodeTable();
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (starts[middle] <= prefix) low = middle;
    else high = middle - 1;
  }
  return values[low];
}

/** 全角英数字・各種ハイフン・全角プラスを半角へ揃える。 */
export function toHalfWidth(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[－ー―‐‑–—〜～]/g, "-");
}

/** 表記ゆれを取り除き、先頭0始まりの国内番号の数字列にする。 */
export function normalizeFax(value = "") {
  const text = toHalfWidth(value).trim();
  let digits = text.replace(/\D/g, "");

  // 国際形式。+81-(0)3-… のように0が併記されていても二重にしない。
  if (/^\+\s*81/.test(text) && digits.startsWith("81")) digits = digits.slice(2);
  else if (digits.startsWith("0081")) digits = digits.slice(4);
  else return digits;

  return digits.startsWith("0") ? digits : `0${digits}`;
}

/**
 * 10桁の固定電話番号について、市外局番の桁数（2〜5）を返す。
 * 割り当てのない番号帯や10桁でない番号は0を返す。
 */
export function areaCodeLength(value = "") {
  const digits = normalizeFax(value);
  if (!/^0\d{9}$/.test(digits)) return 0;
  return lookupAreaCodeLength(Number(digits.slice(1, 6)));
}

/** 携帯・IP電話・0800など、11桁で使われる番号帯か。 */
function isElevenDigitRange(digits) {
  return /^0800\d{7}$/.test(digits) || /^0[5-9]0\d{8}$/.test(digits);
}

/** 日本の固定電話・携帯・特番として桁数と番号帯が成立しているか。 */
export function isPlausibleJapaneseFax(value = "") {
  const digits = normalizeFax(value);
  if (digits.length === 11) return isElevenDigitRange(digits);
  if (digits.length === 10) return areaCodeLength(digits) > 0;
  return false;
}

/**
 * 市外局番の桁数に合わせてハイフンを入れる。
 * 0463-21-1111 や 01267-2-2111 のように、地域ごとに区切り位置が変わる。
 */
export function formatFax(value = "") {
  const digits = normalizeFax(value);
  if (!digits) return "";

  if (digits.length === 11 && isElevenDigitRange(digits)) {
    const head = digits.startsWith("0800") ? 4 : 3;
    return `${digits.slice(0, head)}-${digits.slice(head, 7)}-${digits.slice(7)}`;
  }

  // フリーダイヤルとナビダイヤルだけは 0120-123-456 のように下3桁で区切る。
  if (/^0(?:120|570|990)\d{6}$/.test(digits)) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  const head = areaCodeLength(digits);
  // 加入者番号は必ず下4桁。市外局番と市内局番で残り6桁を分ける。
  if (head) return `${digits.slice(0, head)}-${digits.slice(head, 6)}-${digits.slice(6)}`;

  return digits;
}
