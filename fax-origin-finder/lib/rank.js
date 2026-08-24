import { digitsOnly, normalizeFax } from "./fax.js";

const GENERIC_TITLE_WORDS = [
  "電話番号検索",
  "電話帳",
  "事業者情報",
  "口コミ",
  "検索結果",
  "ホームページ",
  "公式サイト",
  "会社概要",
  "お問い合わせ",
  "FAX番号"
];

export function cleanText(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function inferOrganization(title = "", description = "", url = "") {
  const cleanedTitle = cleanText(title)
    .replace(/\s*[|｜]\s*.+$/, "")
    .replace(/\s*[-–—]\s*(公式.*|ホーム.*|電話.*|会社.*|法人.*)$/, "")
    .trim();

  if (cleanedTitle && !GENERIC_TITLE_WORDS.some((word) => cleanedTitle === word)) {
    return cleanedTitle.slice(0, 80);
  }

  const companyMatch = cleanText(description).match(
    /((?:株式会社|有限会社|合同会社|一般社団法人|公益社団法人|医療法人|社会福祉法人|学校法人)[^、。|｜]{1,40})/
  );
  if (companyMatch) return companyMatch[1].trim();

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "発信元候補";
  }
}

function domainQuality(url = "") {
  try {
    const host = new URL(url).hostname;
    // 自治体は lg.jp へ移行済みのところと、city.〇〇.〇〇.jp のままのところがある。
    // 平塚市（city.hiratsuka.kanagawa.jp）のような後者も官公庁として扱う。
    if (/\.(go|lg)\.jp$/.test(host) || /^(www\.)?(city|pref|town|vill|metro)\./.test(host)) return 12;
    if (/\.(or|ac|ed|co|ne)\.jp$/.test(host)) return 8;
    if (/jpnumber|telnavi|denwacho|meiwaku|navitime|mapion|itp\.ne\.jp/.test(host)) return -8;
    return 3;
  } catch {
    return 0;
  }
}

export function rankResults(number, results = []) {
  const target = normalizeFax(number);

  const scored = results.map((result, index) => {
    const title = cleanText(result.title);
    const description = cleanText(result.description);
    const content = `${title} ${description} ${result.url || ""}`;
    const compact = digitsOnly(content);
    const exactNumber = target && compact.includes(target);
    // 「ファクス」は官公庁で使われる表記。これを見落とすと自治体のページが下がる。
    const faxContext = /fax|ファックス|ファクス|ﾌｧｯｸｽ|ﾌｧｸｽ|℻/i.test(content);
    const officialContext = /公式|会社概要|法人番号|自治体|市役所|町役場|村役場|県庁|支所|病院|医院|クリニック|診療所|薬局|事業所|お問い合わせ/i.test(content);
    let score = 24 - Math.min(index * 2, 12) + domainQuality(result.url);
    if (exactNumber) score += 45;
    if (faxContext) score += 10;
    if (officialContext) score += 7;
    score = Math.max(5, Math.min(96, score));

    return {
      ...result,
      title,
      description,
      organization: inferOrganization(title, description, result.url),
      score,
      exactNumber,
      faxContext
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function confidenceLabel(score) {
  if (score >= 80) return "高";
  if (score >= 55) return "中";
  return "低";
}
