// pdf.jsをブラウザから相対パスで読み込めるよう public/vendor/pdfjs/ へ複製する。
//
//   node scripts/sync-vendor.mjs
//
// public/ はローカルサーバー（server.js）もCloudflareの静的アセットも
// そのまま配信するため、バンドラを通さずに動く形へ置いておく必要があります。
// cmaps と standard_fonts は、フォントを埋め込んでいない複合機出力のPDFや
// CJKの符号化を使うPDFから文字を取り出すために必要です。
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const from = (path) => fileURLToPath(new URL(`../node_modules/pdfjs-dist/${path}`, import.meta.url));
const to = (path) => fileURLToPath(new URL(`../public/vendor/pdfjs/${path}`, import.meta.url));

const ENTRIES = [
  ["build/pdf.mjs", "pdf.mjs"],
  ["build/pdf.worker.mjs", "pdf.worker.mjs"],
  ["cmaps", "cmaps"],
  ["standard_fonts", "standard_fonts"]
];

await rm(to(""), { recursive: true, force: true });
await mkdir(to(""), { recursive: true });
for (const [source, target] of ENTRIES) {
  await cp(from(source), to(target), { recursive: true });
}
console.log(`public/vendor/pdfjs/ を更新しました（${ENTRIES.length}項目）`);
