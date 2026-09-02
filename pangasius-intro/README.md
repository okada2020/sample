# ぱんがじうす（パンガシウス）紹介動画

メコン川生まれの淡水ナマズ「パンガシウス」を10秒で紹介する縦動画。
静止画を紙芝居のように横スライドでつなぐ構成。

- 尺: 10.0秒（カット数に応じて1カットの秒数を自動で割り振る）
- 解像度: 1080x1920（9:16）/ 30fps / H.264
- 音声: なし（BGMを付ける場合は下記参照）

## 中身

| ファイル | 説明 |
| --- | --- |
| `build_kamishibai.py` | カード画像の生成と動画の書き出し |
| `prompts.md` | 5カットの画像プロンプトと字幕 |

素材画像は `images/s1.*`, `s2.*`, ... に置く（拡張子は .jpg / .png どちらでもよい）。
枚数と字幕は `build_kamishibai.py` の `SCENES` で決まる。
写真が横位置なら横長の枠、縦位置なら縦長の枠に自動で切り替わる（`--layout` で固定も可）。

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

- 字幕の文言とカットの並び（枚数もここで決まる）: `build_kamishibai.py` の `SCENES`
- 尺: `TOTAL`（全体の秒数）と `XFADE`（切り替えの秒数）。
  1カットの表示秒数は全体が `TOTAL` に収まるよう自動で決まる
- 写真枠の位置とサイズ: `LAYOUTS`（`portrait` / `landscape`）
- 配色・角丸: `PAPER` / `INK` / `ACCENT` / `RADIUS`
- BGMを付ける場合は、書き出した mp4 に後段で音声を足す:
  `ffmpeg -i pangasius_intro_9x16.mp4 -i bgm.m4a -shortest -c:v copy -c:a aac out_with_bgm.mp4`
