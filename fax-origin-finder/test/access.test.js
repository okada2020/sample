import test from "node:test";
import assert from "node:assert/strict";
import {
  accessPassword,
  createSessionValue,
  isCorrectPassword,
  isValidSessionValue,
  loginPageHtml,
  readSessionCookie,
  sessionCookieHeader
} from "../lib/access.js";

const PASSWORD = "hamatombetsu-2026";

test("合言葉の設定有無を判定する", () => {
  assert.equal(accessPassword("  合言葉  "), "合言葉");
  assert.equal(accessPassword("   "), "");
  assert.equal(accessPassword(undefined), "");
});

test("合言葉の照合は正しいものだけを通す", async () => {
  assert.equal(await isCorrectPassword(PASSWORD, PASSWORD), true);
  assert.equal(await isCorrectPassword("hamatombetsu-2027", PASSWORD), false);
  // 前方一致では通さない
  assert.equal(await isCorrectPassword("hamatombetsu", PASSWORD), false);
  assert.equal(await isCorrectPassword("", PASSWORD), false);
  // 合言葉が未設定なら誰も通さない（呼び出し側で入場制限自体を外す）
  assert.equal(await isCorrectPassword("", ""), false);
});

test("セッションは署名付きで、他の合言葉では検証できない", async () => {
  const value = await createSessionValue(PASSWORD);
  assert.equal(await isValidSessionValue(value, PASSWORD), true);
  assert.equal(await isValidSessionValue(value, "別の合言葉"), false);
});

test("署名や有効期限を書き換えたセッションを拒否する", async () => {
  const value = await createSessionValue(PASSWORD);
  const [expiresAt, signature] = value.split(".");

  assert.equal(await isValidSessionValue(`${expiresAt}.${signature}x`, PASSWORD), false);
  // 期限だけ延ばしても署名が合わない
  assert.equal(await isValidSessionValue(`9999999999.${signature}`, PASSWORD), false);
  assert.equal(await isValidSessionValue("署名なし", PASSWORD), false);
  assert.equal(await isValidSessionValue("", PASSWORD), false);
});

test("有効期限を過ぎたセッションを拒否する", async () => {
  const value = await createSessionValue(PASSWORD);
  assert.equal(await isValidSessionValue(value, PASSWORD, Date.now() + 11 * 60 * 60 * 1000), true);
  assert.equal(await isValidSessionValue(value, PASSWORD, Date.now() + 13 * 60 * 60 * 1000), false);
});

test("他のCookieが混ざっていても値を取り出せる", async () => {
  const value = await createSessionValue(PASSWORD);
  assert.equal(readSessionCookie(`a=1; fax_access=${value}; b=2`), value);
  assert.equal(readSessionCookie("a=1; b=2"), "");
  assert.equal(readSessionCookie(""), "");
});

test("Cookieに持ち出しを防ぐ属性を付ける", async () => {
  const header = sessionCookieHeader("x", { secure: true });
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  assert.match(header, /Secure/);
  // localhostのhttpではSecureを付けない（付けると保存されない）
  assert.doesNotMatch(sessionCookieHeader("x", { secure: false }), /Secure/);
  assert.match(sessionCookieHeader("", { secure: true, clear: true }), /Max-Age=0/);
});

test("ログイン画面は検索避けを付け、合言葉を書き出さない", () => {
  const html = loginPageHtml({ message: "合言葉が違います。" });
  assert.match(html, /noindex/);
  assert.match(html, /合言葉が違います。/);
  assert.match(html, /action="\/auth\/login"/);
});

test("ログイン画面のメッセージをHTMLとして解釈しない", () => {
  const html = loginPageHtml({ message: '<img src=x onerror="alert(1)">' });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});
