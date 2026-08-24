import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFax, formatFax, isPlausibleJapaneseFax } from "./lib/fax.js";
import { rankResults, confidenceLabel } from "./lib/rank.js";
import { searchFax } from "./lib/search.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC = join(ROOT, "public");
const MAX_BODY_BYTES = 256 * 1024;
const MAX_NUMBERS = 100;

await loadDotEnv(join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 4173);
const API_KEY = process.env.BRAVE_SEARCH_API_KEY?.trim() || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  // pdf.js本体とワーカーは .mjs で配置される。MIMEが合っていないと
  // ブラウザがモジュールとして実行しない。
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".bcmap": "application/octet-stream",
  ".pfb": "application/octet-stream",
  ".ttf": "font/ttf"
};

async function loadDotEnv(path) {
  try {
    const content = await readFile(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("リクエストが大きすぎます");
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("JSONの形式が正しくありません");
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const output = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

async function lookupOne(rawNumber) {
  const normalized = normalizeFax(rawNumber);
  if (!isPlausibleJapaneseFax(rawNumber)) {
    return {
      input: String(rawNumber),
      normalized,
      formatted: formatFax(normalized),
      status: "invalid",
      message: "日本のFAX番号として桁数または形式を確認してください",
      candidates: []
    };
  }

  try {
    const search = await searchFax(normalized, { apiKey: API_KEY });
    // 検索エンジンは引用符付き検索でも一般的なFAXページを混ぜる場合がある。
    // 番号そのものが検索結果のタイトル・要約・URLにない候補は、誤特定防止のため除外する。
    const candidates = rankResults(normalized, search.results).filter((item) => item.exactNumber).slice(0, 5).map((item) => ({
      organization: item.organization,
      title: item.title,
      url: item.url,
      description: item.description,
      score: item.score,
      confidence: confidenceLabel(item.score),
      exactNumber: item.exactNumber,
      faxContext: item.faxContext
    }));

    return {
      input: String(rawNumber),
      normalized,
      formatted: formatFax(normalized),
      status: candidates.length ? "found" : "not_found",
      message: candidates.length ? "公開情報から候補が見つかりました" : "一致する公開情報を確認できませんでした",
      query: search.query,
      provider: search.provider,
      candidates
    };
  } catch (error) {
    return {
      input: String(rawNumber),
      normalized,
      formatted: formatFax(normalized),
      status: "error",
      message: error.name === "AbortError" ? "検索がタイムアウトしました" : error.message,
      candidates: []
    };
  }
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/config") {
    return json(response, 200, {
      provider: API_KEY ? "brave" : "duckduckgo",
      apiKeyConfigured: Boolean(API_KEY),
      maxNumbers: MAX_NUMBERS
    });
  }

  if (request.method === "POST" && url.pathname === "/api/lookup") {
    let body;
    try {
      body = await readJson(request);
    } catch (error) {
      return json(response, 400, { error: error.message });
    }
    if (!Array.isArray(body.numbers) || body.numbers.length === 0) {
      return json(response, 400, { error: "numbersには1件以上の番号を指定してください" });
    }
    if (body.numbers.length > MAX_NUMBERS) {
      return json(response, 400, { error: `一度に検索できるのは${MAX_NUMBERS}件までです` });
    }

    const uniqueNumbers = [...new Set(body.numbers.map((value) => String(value ?? "").trim()))];
    const results = await mapWithConcurrency(uniqueNumbers, API_KEY ? 3 : 1, lookupOne);
    return json(response, 200, { results });
  }

  return json(response, 404, { error: "APIが見つかりません" });
}

async function serveStatic(request, response, url) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const relative = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(PUBLIC, relative);
  if (filePath !== PUBLIC && !filePath.startsWith(PUBLIC + sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw Object.assign(new Error("Not found"), { code: "ENOENT" });
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    });
    response.end(content);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.code === "ENOENT" ? "Not found" : "Internal server error");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(request, response, url);
    else if (request.method === "GET" || request.method === "HEAD") await serveStatic(request, response, url);
    else response.writeHead(405, { Allow: "GET, HEAD, POST" }).end("Method Not Allowed");
  } catch (error) {
    console.error(error);
    if (!response.headersSent) json(response, 500, { error: "予期しないエラーが発生しました" });
    else response.end();
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`FAX 発信元サーチ: http://localhost:${PORT}`);
  console.log(`検索プロバイダー: ${API_KEY ? "Brave Search API" : "DuckDuckGo（試用）"}`);
});

export { server, lookupOne };
