/* fruit-rta の配布用ビルド
   index.html + game.js + assets/*.png を 1 枚の HTML にまとめる
   （スプライトは data URI で埋め込むので file:// でもそのまま動く）。
   使い方: node build.js   →  dist/fruit-tumble-rta.html
*/
const fs = require('fs');
const path = require('path');
const dir = __dirname;

let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
let js   = fs.readFileSync(path.join(dir, 'game.js'), 'utf8');

const map = {};
for (const f of fs.readdirSync(path.join(dir, 'assets'))) {
  if (!f.endsWith('.png')) continue;
  const b64 = fs.readFileSync(path.join(dir, 'assets', f)).toString('base64');
  map[f.replace(/\.png$/, '')] = 'data:image/png;base64,' + b64;
}
js = js.replace("im.src = 'assets/' + n + '.png';",
                'im.src = EMBEDDED[n] || ("assets/" + n + ".png");');
js = 'const EMBEDDED = ' + JSON.stringify(map) + ';\n' + js;

const out = html.replace(/<script src="game\.js"><\/script>/,
  '<script>\n' + js.replace(/<\/script>/g, '<\\/script>') + '\n</script>');
if (out === html) { console.error('game.js の読み込みタグが見つかりません'); process.exit(1); }

fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
const file = path.join(dir, 'dist', 'furutori-runner.html');
fs.writeFileSync(file, out);
console.log('built:', path.relative(process.cwd(), file), (out.length / 1024).toFixed(0) + ' KB',
            '（スプライト ' + Object.keys(map).length + ' 枚を内包）');
