// 日本の市外局番の桁数テーブルを libphonenumber-js のメタデータから生成する。
//
//   node scripts/generate-jp-area-codes.mjs
//
// libphonenumber-js は開発依存のままで、生成物 public/jp-area-codes.js だけを
// ブラウザ・Workerの両方が読み込む。市外局番の改定があったときに再実行する。
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// 市外局番と市内局番を合わせた6桁で区切り位置が一意に決まる。
// 5桁までで表を作ると、083961/086361/099331のように
// 6桁目で区切りが変わる番号帯を取り違える。
const FILLERS = ["1234", "9876", "2468"];

function areaCodeLengthOf(prefix6) {
  for (const filler of FILLERS) {
    const national = parsePhoneNumberFromString(prefix6 + filler, "JP")?.formatNational();
    if (national?.includes("-")) return national.indexOf("-");
  }
  return 0;
}

const lengths = [];
for (let index = 0; index < 100000; index++) {
  lengths.push(areaCodeLengthOf(`0${String(index).padStart(5, "0")}`));
}

// 連長圧縮する。ほとんどが連続した同じ値なので338区間まで縮む。
const runs = [];
for (const length of lengths) {
  const last = runs.at(-1);
  if (last && last[0] === length) last[1]++;
  else runs.push([length, 1]);
}

const table = runs.map(([value, count]) => `${value}x${count}`).join(",");
const source = `// 自動生成ファイル。直接編集しないでください。
// 生成コマンド: node scripts/generate-jp-area-codes.mjs
//
// 先頭6桁（0 + 5桁）ごとの市外局番の桁数を連長圧縮した表です。
// 値が0の区間は、日本の固定電話として割り当てのない番号帯を表します。
export const JP_AREA_CODE_TABLE = "${table}";
`;

const output = fileURLToPath(new URL("../public/jp-area-codes.js", import.meta.url));
await writeFile(output, source, "utf8");
console.log(`public/jp-area-codes.js を生成しました（${runs.length}区間 / ${table.length}文字）`);
