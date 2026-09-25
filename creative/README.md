# モーショングラフィック

X / TikTok 用の短い動画の素材。HTML のアニメーションを1コマずつ撮って MP4 にする。

| フォルダ | 中身 | 長さ |
|---|---|---|
| `imp5-to-4800/` | 表示回数 5 → 約4,800(無音) | 14.5秒 |
| `followers-500/` | フォロワー 11 → 認証済み500超え(オリジナル曲つき、128BPM) | 約16秒 |

どちらも 9:16(1080×1920)と 4:5(1080×1350)の2本を書き出す。

## 必要なもの

- Node.js と Playwright(`npm i playwright && npx playwright install chromium`)
- Python 3 と `numpy`、`imageio-ffmpeg`(`pip install numpy imageio-ffmpeg`)

## 書き出し

```bash
cd creative/followers-500
python3 synth.py                  # 曲 music.wav を作る(followers-500 のみ)

export NPM_ROOT=$(npm root)       # playwright を入れた場所。グローバルなら $(npm root -g)
export FFMPEG=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")

node render.js stills             # 確認用の静止画
node render.js video              # MP4 を2本
```

## 数字を変えるとき

- `imp5-to-4800/index.html` の `DATA`(日付ごとの表示回数)と、カウントアップの終点 `4800`
- `followers-500/index.html` の `vSmooth()`(実数の 11 / 29 / 500 の区間)と、日付チップの文字列

実際の数字は、実データのある点(日付を表示している点)だけに置くこと。途中のカウントアップは演出。

## フォント

`nsj-*.woff2` は Noto Sans JP(SIL Open Font License)を、動画で使う文字だけに絞ったもの。
文字を増やしたら、Google Fonts の `text=` パラメータで取り直す。
