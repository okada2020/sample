/* crowd-runner の配布用ビルド
   index.html + game.js を 1 枚の HTML にまとめる（ダブルクリックで遊べる形）。
   使い方: node build.js   →  dist/fruit-crowd-runner.html
*/
const fs = require('fs');
const path = require('path');

const dir  = __dirname;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const js   = fs.readFileSync(path.join(dir, 'game.js'), 'utf8');

const out = html.replace(
  /<script src="game\.js"><\/script>/,
  '<script>\n' + js.replace(/<\/script>/g, '<\\/script>') + '\n</script>'
);
if (out === html) { console.error('game.js の読み込みタグが見つかりませんでした'); process.exit(1); }

fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
const file = path.join(dir, 'dist', 'fruit-crowd-runner.html');
fs.writeFileSync(file, out);
console.log('built:', path.relative(process.cwd(), file), (out.length / 1024).toFixed(1) + ' KB');
