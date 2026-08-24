import { formatFax, isPlausibleJapaneseFax, normalizeFax } from "./phone-format.js";

// 縦書きの書類では番号を漢数字で書くことがある。位取りの「十」「百」は
// 電話番号には出てこないので、一桁ずつの置き換えだけを行う。
const KANJI_DIGITS = { "〇": "0", "零": "0", "一": "1", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6", "七": "7", "八": "8", "九": "9" };

export function convertKanjiDigits(value = "") {
  return String(value).replace(/[〇零一二三四五六七八九]/g, (char) => KANJI_DIGITS[char]);
}

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
      index: startMatch.index,
      context: text.slice(contextStart, contextEnd).trim()
    });
  }

  return [...new Map(matches.map((item) => [item.normalized, item])).values()];
}


// 「TEL 03-… FAX 03-…」のように1つの値へ複数の番号が入っている場合に、
// 番号の直前にあるラベルからFAX番号らしいものを選ぶ。
const LABELS = [
  ["fax", /fax|ﾌｧｯｸｽ|ファックス|ファクス|℻/gi],
  ["tel", /tel|℡|電話|phone|代表/gi]
];

function labelScore(before) {
  const window = before.slice(-48);
  let last = "";
  let lastIndex = -1;
  for (const [kind, pattern] of LABELS) {
    for (const match of window.matchAll(pattern)) {
      if (match.index >= lastIndex) { lastIndex = match.index; last = kind; }
    }
  }
  return last === "fax" ? 2 : last === "tel" ? -1 : 0;
}

function describeProblem(digits) {
  if (!digits) return "数字が含まれていません";
  if (digits.length < 10) return `桁が足りません（${digits.length}桁）`;
  if (digits.length > 11) return `桁が多すぎます（${digits.length}桁）。複数の番号が入っていないか確認してください`;
  return "市外局番として使われていない番号帯です";
}

function reading(input, normalized, { note = "", others = [] } = {}) {
  return { input, normalized, formatted: formatFax(normalized), valid: true, note, others };
}

/**
 * 表記の揺れを吸収して、1つの値からFAX番号を1件読み取る。
 * ハイフンの種類・全角・括弧・ラベル・国番号・内線・複数併記・
 * Excelで落ちた先頭の0まで面倒を見る。
 */
export function readFaxNumber(value = "") {
  const input = String(value ?? "").trim();
  if (!input) return { input, normalized: "", formatted: "", valid: false, note: "番号が入っていません", others: [] };

  const text = convertKanjiDigits(normalizePdfText(input));

  // Excelが指数表記に変えた値は、元の桁そのものが失われている。
  if (/^\d(?:\.\d+)?e[+-]?\d+$/i.test(text)) {
    return { input, normalized: "", formatted: input, valid: false, others: [],
      note: "Excelの指数表記になっていて、元の桁が失われています。セルを文字列にして入力し直してください" };
  }

  const digits = normalizeFax(text);
  if (isPlausibleJapaneseFax(digits)) return reading(input, digits);

  // 国番号81が残っている / Excelで先頭の0が落ちている。
  // 実在する番号帯かどうかで確かめるので、当てずっぽうにはならない。
  for (const candidate of [digits.startsWith("81") ? digits.slice(2) : "", digits]) {
    if (!candidate) continue;
    const restored = `0${candidate}`;
    if (isPlausibleJapaneseFax(restored)) {
      return reading(input, restored, { note: digits.startsWith("81") ? "国番号81を国内表記に直しました" : "先頭の0を補いました" });
    }
  }

  // 内線や複数併記が混ざっている場合は、値の中から番号を拾い直す。
  const found = extractFaxNumbersFromText(text);
  if (found.length) {
    const ranked = found
      .map((item) => ({ item, score: labelScore(text.slice(0, item.index)) }))
      .sort((a, b) => b.score - a.score);
    const others = ranked.slice(1).map((entry) => entry.item.normalized);
    return reading(input, ranked[0].item.normalized, {
      others,
      note: others.length ? `この欄には番号が${found.length}件あります` : "余分な数字を除いて読み取りました"
    });
  }

  return { input, normalized: digits, formatted: input, valid: false, others: [], note: describeProblem(digits) };
}
