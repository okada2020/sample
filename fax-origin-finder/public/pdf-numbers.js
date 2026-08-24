import { formatFax, isPlausibleJapaneseFax, normalizeFax } from "./phone-format.js";

export function normalizePdfText(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[－ー―‐‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

// FAXの送信票には「08/24/2026 09:30」のような受信スタンプがほぼ必ず入る。
// 数字と記号だけを見て走査すると、日付と時刻がつながって10桁の番号に化けるため、
// 電話番号には現れない形の日付・時刻を先に伏せ字にしておく。
// 文字数は変えないので、抽出テキストの切り出し位置は元の文字列と一致する。
const DATE_TIME_PATTERNS = [
  /(?<!\d)\d{1,2}:\d{2}(?::\d{2})?(?!\d)/g,               // 09:30 / 09:30:15
  /(?<!\d)\d{4}[/.]\d{1,2}[/.]\d{1,2}(?!\d)/g,            // 2026/08/24
  /(?<!\d)\d{1,2}[/.]\d{1,2}[/.]\d{4}(?!\d)/g,            // 08/24/2026
  /(?<!\d)\d{4}-\d{1,2}-\d{1,2}(?!\d)/g                   // 2026-08-24
];

export function maskDateTime(value = "") {
  let text = value;
  for (const pattern of DATE_TIME_PATTERNS) {
    text = text.replace(pattern, (match) => "X".repeat(match.length));
  }
  return text;
}

function expectedLength(digits) {
  // 携帯・IP電話・0800のフリーダイヤルは11桁、それ以外の国内番号は10桁。
  return /^0[5-9]0/.test(digits) ? 11 : 10;
}

function scanSeparatedNumber(text, start) {
  let raw = "";
  let separatorLength = 0;

  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (/\d/.test(char)) {
      raw += char;
      separatorLength = 0;
    } else if (/[\s\p{P}\p{S}\p{M}\p{Cf}]/u.test(char)) {
      raw += char;
      separatorLength++;
      if (separatorLength > 6) break;
      continue;
    } else {
      break;
    }

    const digits = normalizeFax(raw);
    if (!digits.startsWith("0")) continue;
    const targetLength = expectedLength(digits);
    if (digits.length < targetLength) continue;
    if (digits.length > targetLength) return null;

    // A directly adjacent extra digit means this is not a valid complete number.
    if (/\d/.test(text[index + 1] || "")) return null;
    return {
      raw: raw.trim(),
      normalized: digits,
      end: index + 1
    };
  }

  return null;
}

export function extractFaxNumbersFromText(value = "") {
  const text = normalizePdfText(value);
  const scannable = maskDateTime(text);
  const matches = [];

  // PDF.js may split a number into separate text items. Besides spaces and
  // hyphens, accept punctuation, box-drawing characters, bullets and symbols
  // between digits, while stopping at letters so unrelated fields are not joined.
  for (const startMatch of scannable.matchAll(/(?<!\d)(?:\+\s*81|0081|0)/g)) {
    const scanned = scanSeparatedNumber(scannable, startMatch.index);
    // 桁数だけでなく、市外局番として実在する番号帯かどうかも確認する。
    // 請求書番号のような0始まりの連番を発信元として拾わないためのふるい。
    if (!scanned || !isPlausibleJapaneseFax(scanned.normalized)) continue;
    const contextStart = Math.max(0, startMatch.index - 42);
    const contextEnd = Math.min(text.length, scanned.end + 42);
    matches.push({
      normalized: scanned.normalized,
      formatted: formatFax(scanned.normalized),
      context: text.slice(contextStart, contextEnd).trim()
    });
  }

  return [...new Map(matches.map((item) => [item.normalized, item])).values()];
}
