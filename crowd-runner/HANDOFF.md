# 引き継ぎメモ（このゲームを別のAI／開発者に渡すとき用）

## これは何か
ブラウザで動くカジュアルゲーム「フルーツ・クラウドランナー」。
坂の上の人間が銃を撃つように果物を転がし、ゲートで増やし、坂の底のクマに当てる。
**依存ライブラリなし・画像素材なし**。HTML と JS だけで完結している。

## 渡すもの（用途別）
| 形 | ファイル | 用途 |
|---|---|---|
| 1ファイル版 | `dist/fruit-crowd-runner.html` | ダブルクリックで遊べる。動作確認・共有はこれだけでいい |
| ソース | `index.html` / `game.js` | 改造するならこちら。`node build.js` で1ファイル版を作り直せる |
| 仕様書 | `README.md` | **最初に読ませる**。コンセプト・操作・状態遷移・数値バランス・絵づくりの方針 |

## 動かし方
```bash
# 1ファイル版はそのまま開くだけ
open dist/fruit-crowd-runner.html

# ソースから動かす場合（file:// でも動くが、サーバ経由が確実）
python3 -m http.server 8000   # → http://localhost:8000/crowd-runner/

# 1ファイル版を作り直す
node build.js
```

## コードの地図（`game.js`／全体で約830行・1ファイル）
| やりたいこと | 見る場所 |
|---|---|
| 難易度・数値の調整 | `buildLevel()` の `PLAN` と `OPS`、`startStage()` の `hp` / `ammo` |
| 弾の挙動（加速・壁の反射・当たり判定） | `rollUpdate()`、撃ち出しは `fire()` |
| ねらいの予測線 | `drawAimLine()` |
| 見た目の総入れ替え | `drawHuman()` / `drawMonkey()` / `drawBear()` / `drawFruit()`（互いに独立） |
| 画面の見え方（カメラ・遠近） | `resize()` と `project()` |
| 画面遷移・UI | `startStage()` / `nextShot()` / `stageClear()` / `gameOver()` と `index.html` |

状態は `S` というオブジェクト1つに集約。`S.mode` が
`title → aim → roll → hit → (clear|over)` と遷移する。

## 自動テスト用のフック
`window.CrowdRunner` を公開している。ヘッドレスブラウザから操作してバランスを測れる。

```js
CrowdRunner.state        // 内部状態（S）そのもの
CrowdRunner.startStage(stage, score)
CrowdRunner.setAim(-1..1)
CrowdRunner.fire()
CrowdRunner.pause(true|false)   // 描画と更新を止める（スクリーンショット用）
CrowdRunner.art          // 各キャラの描画関数（キャラシートを描くとき用）
```

例：9発撃ってダメージを測る（Playwright）
```js
await page.click('button[data-act="start"]');
for (let i = 0; i < 9; i++) {
  await page.evaluate(() => { CrowdRunner.setAim(0); CrowdRunner.fire(); });
  await page.waitForFunction(() => CrowdRunner.state.mode !== 'roll');
  console.log(await page.evaluate(() => CrowdRunner.state.lastDmg));
  await page.waitForTimeout(1200);
}
```

## 今わかっている課題・次にやるべきこと
1. **絵柄がまだ決まっていない。** 現状はキャラを全部シルエットにして逃げている。
   寄せたい絵柄が決まったら `drawHuman/Monkey/Bear` を差し替える。ここだけで完結する。
2. **コースの当たり外れ**が残っている。並びは固定にしたが、ゲートの引き次第で
   1発あたりのダメージが 28〜79 とぶれる。クマの HP は `150 + ステージ×70`。
3. **音が最小限**（WebAudio のオシレータのみ）。
4. 拡張案は `README.md` の「今後の拡張アイデア」を参照。
