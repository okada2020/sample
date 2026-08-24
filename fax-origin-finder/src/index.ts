import { formatFax, readFaxNumber } from "../lib/fax.js";
import { rankResults, confidenceLabel } from "../lib/rank.js";
import { searchFax } from "../lib/search.js";
import {
  LOGIN_PAGE_HEADERS,
  LOGIN_PATH,
  LOGOUT_PATH,
  accessPassword,
  createSessionValue,
  isCorrectPassword,
  isValidSessionValue,
  loginPageHtml,
  readSessionCookie,
  sessionCookieHeader
} from "../lib/access.js";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_NUMBERS = 25;

type LookupBody = { numbers: string[] };

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    }
  });
}

function isLookupBody(value: unknown): value is LookupBody {
  if (!value || typeof value !== "object" || !("numbers" in value)) return false;
  const numbers = Reflect.get(value, "numbers");
  return Array.isArray(numbers) && numbers.every((item) => typeof item === "string");
}

async function readLookupBody(request: Request): Promise<LookupBody> {
  const declaredSize = Number(request.headers.get("Content-Length") || 0);
  if (declaredSize > MAX_BODY_BYTES) throw new Error("リクエストが大きすぎます");

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new Error("リクエストが大きすぎます");
  }

  let value: unknown;
  try {
    value = JSON.parse(text || "{}");
  } catch {
    throw new Error("JSONの形式が正しくありません");
  }
  if (!isLookupBody(value)) throw new Error("numbersには文字列の配列を指定してください");
  return value;
}

async function mapWithConcurrency<T, U>(items: T[], limit: number, mapper: (item: T) => Promise<U>): Promise<U[]> {
  const output = new Array<U>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      output[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return output;
}

async function lookupOne(rawNumber: string, apiKey: string) {
  // 表記の揺れはここで吸収する。どんな書き方で渡されても同じ番号として扱う。
  const reading = readFaxNumber(rawNumber);
  const normalized = reading.normalized;
  if (!reading.valid) {
    return {
      input: rawNumber,
      normalized,
      formatted: reading.formatted,
      status: "invalid",
      message: reading.note,
      candidates: []
    };
  }

  try {
    const search = await searchFax(normalized, { apiKey });
    const candidates = rankResults(normalized, search.results)
      .filter((item) => item.exactNumber)
      .slice(0, 5)
      .map((item) => ({
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
      input: rawNumber,
      normalized,
      formatted: formatFax(normalized),
      status: candidates.length ? "found" : "not_found",
      message: candidates.length ? "公開情報から候補が見つかりました" : "一致する公開情報を確認できませんでした",
      query: search.query,
      provider: search.provider,
      candidates
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "検索に失敗しました";
    console.error(JSON.stringify({ message: "fax lookup failed", error: message }));
    return {
      input: rawNumber,
      normalized,
      formatted: formatFax(normalized),
      status: "error",
      message: error instanceof DOMException && error.name === "AbortError" ? "検索がタイムアウトしました" : message,
      candidates: []
    };
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const secret = Reflect.get(env, "BRAVE_SEARCH_API_KEY");
  const apiKey = typeof secret === "string" ? secret.trim() : "";

  if (request.method === "GET" && url.pathname === "/api/config") {
    return json({
      provider: apiKey ? "brave" : "duckduckgo",
      apiKeyConfigured: Boolean(apiKey),
      accessProtected: Boolean(accessPassword(Reflect.get(env, "ACCESS_PASSWORD"))),
      maxNumbers: MAX_NUMBERS
    });
  }

  if (request.method === "POST" && url.pathname === "/api/lookup") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) return json({ error: "許可されていない送信元です" }, 403);

    let body: LookupBody;
    try {
      body = await readLookupBody(request);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "入力を確認してください" }, 400);
    }

    if (body.numbers.length === 0) return json({ error: "1件以上の番号を指定してください" }, 400);
    if (body.numbers.length > MAX_NUMBERS) {
      return json({ error: `一度に検索できるのは${MAX_NUMBERS}件までです` }, 400);
    }

    const uniqueNumbers = [...new Set(body.numbers.map((value) => value.trim()))];
    const results = await mapWithConcurrency(uniqueNumbers, apiKey ? 3 : 1, (number) => lookupOne(number, apiKey));
    return json({ results });
  }

  return json({ error: "APIが見つかりません" }, 404);
}

/**
 * ACCESS_PASSWORD が設定されているときだけ、合言葉を通っていない相手を止める。
 * 通してよい相手には null を返し、呼び出し側で本来の処理へ進む。
 */
async function guardAccess(request: Request, env: Env): Promise<Response | null> {
  const password = accessPassword(Reflect.get(env, "ACCESS_PASSWORD"));
  if (!password) return null;

  const url = new URL(request.url);
  const secure = url.protocol === "https:";

  if (url.pathname === LOGOUT_PATH) {
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
    return new Response(null, {
      status: 303,
      headers: { Location: "/", "Set-Cookie": sessionCookieHeader("", { secure, clear: true }) }
    });
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method !== "POST") {
      return new Response(loginPageHtml(), { headers: LOGIN_PAGE_HEADERS });
    }
    const form = await request.formData();
    if (await isCorrectPassword(String(form.get("password") ?? ""), password)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": sessionCookieHeader(await createSessionValue(password), { secure })
        }
      });
    }
    return new Response(loginPageHtml({ message: "合言葉が違います。" }), {
      status: 401,
      headers: LOGIN_PAGE_HEADERS
    });
  }

  if (await isValidSessionValue(readSessionCookie(request.headers.get("Cookie") ?? ""), password)) {
    return null;
  }

  if (url.pathname.startsWith("/api/")) return json({ error: "合言葉を入力してください" }, 401);
  return new Response(loginPageHtml(), { status: 401, headers: LOGIN_PAGE_HEADERS });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const blocked = await guardAccess(request, env);
      if (blocked) return blocked;

      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      // run_worker_first: true にしたので、静的ファイルもWorkerから返す。
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({
        message: "unhandled request error",
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error)
      }));
      return json({ error: "予期しないエラーが発生しました" }, 500);
    }
  }
} satisfies ExportedHandler<Env>;
