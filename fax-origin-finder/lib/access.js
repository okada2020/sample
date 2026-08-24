// 公開URLを知っている人なら誰でも開ける状態を避けるための、合言葉による入場制限。
// Cloudflare Workersとローカルサーバーの両方から使うため、Web Crypto以外は使いません。
const COOKIE_NAME = "fax_access";
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

/** 環境変数から合言葉を取り出す。未設定なら空文字＝入場制限なし。 */
export function accessPassword(value) {
  return typeof value === "string" ? value.trim() : "";
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 一致するまでの時間から合言葉を推測されないよう、長さが違っても必ず全体を比較する。
function timingSafeEqual(a, b) {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) {
    diff |= (a[index % a.length] ?? 0) ^ (b[index % b.length] ?? 0);
  }
  return diff === 0;
}

async function digest(text) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

async function sign(password, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export async function isCorrectPassword(input, password) {
  if (!password || typeof input !== "string" || input.length === 0) return false;
  // 長さの違いも時間差として漏れないよう、ハッシュ同士を比べる。
  return timingSafeEqual(await digest(input), await digest(password));
}

/** 合言葉そのものではなく、期限付きの署名をCookieに入れる。 */
export async function createSessionValue(password, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_SECONDS;
  const signature = await sign(password, String(expiresAt));
  return `${expiresAt}.${base64url(signature)}`;
}

export async function isValidSessionValue(value, password, now = Date.now()) {
  if (!password || typeof value !== "string") return false;
  const separator = value.indexOf(".");
  if (separator <= 0) return false;

  const expiresAt = Number(value.slice(0, separator));
  if (!Number.isSafeInteger(expiresAt) || expiresAt * 1000 <= now) return false;

  const expected = base64url(await sign(password, String(expiresAt)));
  return timingSafeEqual(encoder.encode(expected), encoder.encode(value.slice(separator + 1)));
}

export function readSessionCookie(header = "") {
  for (const part of String(header).split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return "";
}

export function sessionCookieHeader(value, { secure = true, clear = false } = {}) {
  const attributes = [
    `${COOKIE_NAME}=${clear ? "" : value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${clear ? 0 : SESSION_SECONDS}`
  ];
  // localhostのhttpではSecure付きCookieが保存されないため、httpsのときだけ付ける。
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export const LOGIN_PATH = "/auth/login";
export const LOGOUT_PATH = "/auth/logout";

export function loginPageHtml({ message = "" } = {}) {
  const notice = message
    ? `<p class="error" role="alert">${message.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])}</p>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>FAX 発信元サーチ</title>
<style>
:root { --ink:#18332e; --muted:#65766f; --paper:#f5f3ec; --card:#fffef9; --line:#dfe2d9; --green:#194f43; --orange:#de6b35; --red:#a43c30;
  font-family: Inter, "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", sans-serif; color: var(--ink); }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
  background: radial-gradient(circle at 12% 13%, rgba(222,107,53,.08), transparent 24rem), var(--paper); }
.card { width:min(420px,100%); background:var(--card); border:1px solid rgba(24,51,46,.12); border-radius:22px;
  box-shadow:0 20px 60px rgba(35,55,48,.1); padding:40px 34px; }
.brand { display:flex; gap:11px; align-items:center; font-weight:800; letter-spacing:.02em; margin-bottom:26px; }
.mark { width:35px; height:35px; border-radius:10px; background:var(--green); display:grid; place-items:center; }
.mark svg { width:21px; fill:none; stroke:#fff; stroke-width:1.8; }
h1 { font-size:19px; margin:0 0 8px; letter-spacing:.02em; }
p { color:var(--muted); font-size:13.5px; line-height:1.85; margin:0 0 22px; }
label { display:block; font-size:12px; font-weight:700; letter-spacing:.04em; color:var(--muted); margin-bottom:8px; }
input { width:100%; padding:13px 15px; border:1px solid var(--line); border-radius:12px; background:#fff; color:var(--ink); }
input:focus { outline:2px solid var(--green); outline-offset:1px; }
button { width:100%; margin-top:18px; padding:14px; border:0; border-radius:12px; background:var(--green); color:#fff;
  font-weight:800; letter-spacing:.03em; cursor:pointer; }
button:hover { background:#124036; }
.error { color:var(--red); font-size:13px; font-weight:700; margin:0 0 18px; }
.foot { margin:22px 0 0; font-size:11.5px; color:var(--muted); }
</style>
</head>
<body>
<main class="card">
  <div class="brand">
    <span class="mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M9 5h14v7H9zM6 11h20a2 2 0 0 1 2 2v10H4V13a2 2 0 0 1 2-2Zm3 8v8h14v-8H9Z"/><circle cx="23" cy="15" r="1.5"/></svg></span>
    <span>FAX 発信元サーチ</span>
  </div>
  <h1>合言葉を入力してください</h1>
  <p>このサイトは限定公開です。合言葉を知っている方だけが利用できます。</p>
  ${notice}
  <form method="post" action="${LOGIN_PATH}">
    <label for="password">合言葉</label>
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">開く</button>
  </form>
  <p class="foot">ログインした状態は12時間で切れます。</p>
</main>
</body>
</html>`;
}

export const LOGIN_PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  // このページはスクリプトを一切読み込まない。装飾のためのstyleだけ許可する。
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow"
};
