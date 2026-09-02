# ぱんがじうす（パンガシウス）紹介動画

メコン川生まれの淡水ナマズ「パンガシウス」を10秒で紹介する縦動画。
フラットでかわいいイラストを紙芝居のように横スライドでつなぐ構成。

- 尺: 10.0秒（1カット2.24秒 + スライド0.3秒 × 4）
- 解像度: 1080x1920（9:16）/ 30fps / H.264
- 音声: なし（BGMを付ける場合は下記参照）

## 中身

| ファイル | 説明 |
| --- | --- |
| `build_kamishibai.py` | カード画像の生成と動画の書き出し |
| `prompts.md` | 5カットの画像プロンプトと字幕 |

素材画像（`images/s1.png` 〜 `s5.png`）はサイズが大きいためリポジトリには含めていない。
`prompts.md` のプロンプトで生成し直すか、手持ちの **3:4** の画像を同じ名前で置けばよい
（3:4 以外でも中央トリミングで収まるが、絵の端が切れる）。

## 書き出し

```sh
pip install Pillow imageio-ffmpeg   # ffmpeg が入っていれば imageio-ffmpeg は不要
python3 build_kamishibai.py --images ./images --out pangasius_intro_9x16.mp4
```

`--keep-cards ./cards` を付けると、字幕を焼き込んだ中間のカード画像も残る。

字幕のフォントは丸ゴシックがあればそれを使う（無ければゴシックにフォールバック）。
絵柄に寄せるなら M PLUS Rounded 1c を落としておくとよい:

```sh
mkdir -p fonts && curl -sSL -o fonts/MPLUSRounded1c-Bold.ttf \
  https://github.com/google/fonts/raw/main/ofl/mplusrounded1c/MPLUSRounded1c-Bold.ttf
```

`--font /path/to/font.ttf` で明示的に指定することもできる。

## 手を入れるところ

- 字幕の文言とカットの並び: `build_kamishibai.py` の `SCENES`
- 尺: `CLIP`（1カットの秒数）と `XFADE`（切り替えの秒数）。
  合計は `カット数 × CLIP - (カット数 - 1) × XFADE` で決まる
- 配色・余白: `PAPER` / `INK` / `ACCENT` / `RADIUS` と `PX, PY, PW, PH`
- BGMを付ける場合は、書き出した mp4 に後段で音声を足す:
  `ffmpeg -i pangasius_intro_9x16.mp4 -i bgm.m4a -shortest -c:v copy -c:a aac out_with_bgm.mp4`
