import { buildSearchQuery } from "./fax.js";

function decodeHtml(value = "") {
  const named = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " "
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unwrapDuckDuckGoUrl(value = "") {
  const decoded = decodeHtml(value);
  try {
    const url = new URL(decoded, "https://duckduckgo.com");
    if (url.hostname.endsWith("duckduckgo.com") && url.searchParams.has("uddg")) {
      return decodeURIComponent(url.searchParams.get("uddg"));
    }
    return url.href;
  } catch {
    return decoded;
  }
}

export function parseDuckDuckGoHtml(html) {
  const blocks = String(html).split(/<div[^>]+class="[^"]*result(?:\s|__)[^"]*"[^>]*>/i).slice(1);
  const results = [];

  for (const block of blocks) {
    const anchor = block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) continue;
    const snippet = block.match(/<(?:a|div)[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/i);
    const url = unwrapDuckDuckGoUrl(anchor[1]);
    if (!/^https?:\/\//i.test(url)) continue;
    results.push({
      title: decodeHtml(anchor[2]),
      url,
      description: decodeHtml(snippet?.[1] || "")
    });
    if (results.length >= 8) break;
  }

  return results;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchBrave(query, apiKey) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("country", "JP");
  url.searchParams.set("search_lang", "ja");
  url.searchParams.set("ui_lang", "ja-JP");
  url.searchParams.set("extra_snippets", "true");

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey
    }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brave Search API: ${response.status} ${message.slice(0, 160)}`);
  }

  const body = await response.json();
  return (body.web?.results || []).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    description: [item.description, ...(item.extra_snippets || [])].filter(Boolean).join(" ")
  }));
}

async function searchDuckDuckGo(query) {
  const url = new URL("https://html.duckduckgo.com/html/");
  url.searchParams.set("q", query);
  url.searchParams.set("kl", "jp-jp");
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; FaxOriginFinder/1.0; local research tool)"
    }
  });
  if (!response.ok) throw new Error(`DuckDuckGo検索: HTTP ${response.status}`);
  return parseDuckDuckGoHtml(await response.text());
}

export async function searchFax(number, { apiKey = "" } = {}) {
  const query = buildSearchQuery(number);
  const provider = apiKey ? "brave" : "duckduckgo";
  const results = apiKey ? await searchBrave(query, apiKey) : await searchDuckDuckGo(query);
  return { query, provider, results };
}
