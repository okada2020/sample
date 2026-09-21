#!/usr/bin/env python3
"""Render the film's flat graphic assets (screens, receipt, overlays, title) to PNG.

Everything here is type and geometry, so a browser draws it perfectly and for
free — no generative model, no melted Japanese, identical layout every time.
Photographic shots still have to be generated; these do not.

    python3 build.py            # writes ./out/*.png
"""
import pathlib, subprocess, sys, shutil, glob

OUT = pathlib.Path(__file__).parent / "out"
TMP = pathlib.Path(__file__).parent / ".tmp"

def chrome():
    for p in sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")):
        return p
    for n in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(n): return shutil.which(n)
    sys.exit("no chromium found")

FONT = '"IPAGothic","Noto Sans CJK JP","Hiragino Sans",sans-serif'

# ---------------------------------------------------------------- kiosk screen
def kiosk(amount, *, scanning=False):
    rows = ""
    if scanning:
        body = f'''
        <div class="scanrow"><span class="thumb"></span><span class="nm">水 500ml</span><span class="q">1</span><span class="amt">¥108</span></div>
        <div class="hint">商品をスキャンしてください</div>'''
        head = f'<span>ただいまの合計</span><b>{amount}</b>'
        pay = ""
    else:
        head = f'<span>お支払い金額</span><b>{amount}</b>'
        body = '<div class="lead">お支払い方法を選択してください</div>'
        names = [("現金","M3 7h18v10H3z M7 12h.01 M17 12h.01"),
                 ("クレジット","M2 6h20v12H2z M2 10h20"),
                 ("交通系IC","M4 5h16v14H4z M8 9h8 M8 13h5"),
                 ("電子マネー","M7 3h10v18H7z M11 18h2"),
                 ("コード決済","M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 18h2v2h-2z")]
        cells = "".join(
            f'<div class="btn"><svg viewBox="0 0 24 24"><path d="{d}"/></svg><span>{n}</span></div>'
            for n, d in names)
        pay = f'<div class="grid">{cells}</div>'
    return f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:900px;height:1200px}}
 body{{font-family:{FONT};background:#f4f6f8;display:flex;flex-direction:column}}
 .head{{flex:none;background:#2b303a;color:#fff;padding:30px 34px;display:flex;align-items:baseline;justify-content:space-between}}
 .head span{{font-size:38px;letter-spacing:.04em}}
 .head b{{font-size:84px;font-weight:700;letter-spacing:.01em;font-variant-numeric:tabular-nums}}
 .main{{flex:1;min-height:0;padding:44px 40px;display:flex;flex-direction:column;gap:34px;justify-content:center}}
 .lead{{font-size:38px;text-align:center;color:#2b303a}}
 .grid{{display:grid;grid-template-columns:1fr 1fr;gap:22px}}
 .btn{{background:#fff;border:2px solid #d7dce3;border-radius:16px;height:150px;
       display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}}
 .btn:nth-child(5){{grid-column:1 / -1}}
 .btn svg{{width:52px;height:52px;fill:none;stroke:#7b838f;stroke-width:1.7;stroke-linecap:round}}
 .btn span{{font-size:32px;color:#2b303a}}
 .scanrow{{display:flex;align-items:center;gap:20px;background:#fff;border-radius:14px;padding:22px 26px;font-size:36px;color:#2b303a}}
 .thumb{{width:58px;height:74px;border-radius:6px;background:#dfe6ee;border:2px solid #cbd4de;flex:none}}
 .scanrow .nm{{flex:1}} .scanrow .q{{color:#7b838f}} .scanrow .amt{{font-variant-numeric:tabular-nums;min-width:150px;text-align:right}}
 .hint{{text-align:center;font-size:34px;color:#7b838f;margin-top:10px}}
 .foot{{flex:none;background:#12a3a8;display:flex;justify-content:flex-end;gap:18px;padding:22px 30px}}
 .foot div{{background:rgba(255,255,255,.92);border-radius:12px;padding:14px 30px;font-size:30px;color:#0d5f62}}
</style>
<div class="head">{head}</div>
<div class="main">{body}{pay}</div>
<div class="foot"><div>もどる</div><div>言語</div></div>'''

# ---------------------------------------------------------------- receipt
RECEIPT = f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:620px;height:1080px}}
 body{{font-family:{FONT};background:#fbfaf7;padding:54px 46px;color:#14161a;
       font-size:30px;line-height:1.85;letter-spacing:.02em}}
 .r{{display:flex;justify-content:space-between}} .r i{{font-style:normal;font-variant-numeric:tabular-nums}}
 hr{{border:0;border-top:2px dashed #b9b6ae;margin:18px 0}}
 .sp{{height:44px}} .warn{{text-align:center;font-size:32px;letter-spacing:.06em}}
 .small{{font-size:25px;color:#4a4d54}}
</style>
<div class="small">2026/09/16&nbsp;&nbsp;01:21</div>
<hr>
<div class="r"><span>水 500ml</span><i>¥0</i></div>
<div class="r"><span>カップ麺</span><i>¥0</i></div>
<div class="r"><span>弁当（半額）</span><i>¥0</i></div>
<div class="r"><span>発泡酒</span><i>¥0</i></div>
<hr>
<div class="r"><span>合計</span><i>¥0</i></div>
<div class="r"><span>お預り</span><i>¥0</i></div>
<div class="r"><span>お釣り</span><i>¥0</i></div>
<div class="sp"></div>
<div class="warn">後ろを見ないでください</div>'''

# ---------------------------------------------------------------- cctv overlay
def cctv(cam, stamp, sensor=None):
    box = ""
    if sensor:
        box = f'''<div class="sensor"><div class="lbl">レジ横 体重センサー</div>
                  <div class="val">{sensor}<em>kg</em></div></div>'''
    return f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:1080px;height:1920px;background:transparent}}
 body{{font-family:{FONT};position:relative}}
 .rec{{position:absolute;left:52px;top:56px;color:#fff;font-size:34px;letter-spacing:.1em;
       text-shadow:0 2px 6px rgba(0,0,0,.9)}}
 .rec .dot{{display:inline-block;width:20px;height:20px;border-radius:50%;background:#ff3b30;margin-right:14px;
       box-shadow:0 0 10px rgba(255,59,48,.9)}}
 .rec .cam{{display:block;margin-top:8px;font-size:30px;letter-spacing:.14em}}
 .ts{{position:absolute;right:52px;top:56px;color:#fff;font-size:32px;letter-spacing:.06em;
      font-variant-numeric:tabular-nums;text-shadow:0 2px 6px rgba(0,0,0,.9)}}
 .c{{position:absolute;width:74px;height:74px;border:5px solid rgba(255,255,255,.92)}}
 .tl{{left:30px;top:30px;border-right:0;border-bottom:0}} .tr{{right:30px;top:30px;border-left:0;border-bottom:0}}
 .bl{{left:30px;bottom:30px;border-right:0;border-top:0}} .br{{right:30px;bottom:30px;border-left:0;border-top:0}}
 .sensor{{position:absolute;right:48px;bottom:120px;background:rgba(6,8,12,.86);
    border:2px solid rgba(255,255,255,.22);border-radius:10px;padding:22px 34px;text-align:right}}
 .sensor .lbl{{color:#e8ecf2;font-size:30px;letter-spacing:.05em;margin-bottom:6px}}
 .sensor .val{{color:#ff3b30;font-size:96px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}}
 .sensor em{{font-style:normal;font-size:46px;margin-left:8px}}
</style>
<div class="rec"><span class="dot"></span>REC<span class="cam">{cam}</span></div>
<div class="ts">{stamp}</div>
<div class="c tl"></div><div class="c tr"></div><div class="c bl"></div><div class="c br"></div>
{box}'''

# ---------------------------------------------------------------- title
TITLE = f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:1080px;height:1920px}}
 body{{font-family:{FONT};background:#000;color:#fff;display:flex;flex-direction:column;
       align-items:center;justify-content:center;gap:56px;padding-bottom:120px}}
 h1{{font-size:170px;font-weight:700;letter-spacing:.14em;text-indent:.14em;line-height:1}}
 p{{font-size:38px;letter-spacing:.06em;color:#cfd3da;font-weight:400}}
</style>
<h1>お会計</h1>
<p>金額がおかしい時は、後ろを見ないでください。</p>'''


# ------------------------------------------------- youtube-style vertical news
# Japanese news on a phone is a YouTube short, not a TV capture: a headline
# plate pinned at the top, the footage in the middle, and big burned-in
# subtitles at the bottom. Safe zone 5% sides / 3% top-bottom.
def ytnews(tag, tagcolor, headline, info, subtitle, *, plate=True):
    infohtml = f'<div class="info">{info}</div>' if info else ''
    bg = "#11151b" if plate else "transparent"
    slot = ('<div class="slot">［ ここに映像を合成 ］</div>' if plate else '')
    return f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:1080px;height:1920px;background:{bg}}}
 body{{font-family:{FONT};position:relative;color:#fff}}
 .slot{{position:absolute;inset:520px 0 700px;display:flex;align-items:center;justify-content:center;
        background:#1d232c;color:#5b6674;font-size:36px;letter-spacing:.1em}}
 .top{{position:absolute;left:54px;right:54px;top:96px}}
 .tag{{display:inline-flex;align-items:center;gap:14px;margin-bottom:18px}}
 .tag .bar{{width:10px;height:38px;background:{tagcolor};border-radius:2px}}
 .tag span{{font-size:32px;letter-spacing:.22em;font-weight:700;
            text-shadow:0 2px 8px rgba(0,0,0,.9)}}
 .plate{{background:rgba(8,11,16,.88);border-left:12px solid {tagcolor};
         padding:26px 30px 28px;border-radius:4px}}
 .plate h1{{font-size:70px;font-weight:700;line-height:1.28;letter-spacing:.01em}}
 .info{{position:absolute;left:54px;right:54px;bottom:520px;
        background:rgba(8,11,16,.82);border-radius:8px;padding:22px 28px;
        font-size:36px;letter-spacing:.02em;line-height:1.5;white-space:nowrap;
        overflow:hidden;text-overflow:clip}}
 .sub{{position:absolute;left:54px;right:54px;bottom:300px;text-align:center;
       font-size:56px;font-weight:700;line-height:1.5;letter-spacing:.02em;
       paint-order:stroke fill;-webkit-text-stroke:14px #000;
       text-shadow:0 6px 18px rgba(0,0,0,.85)}}
</style>
<div class="top">
  <div class="tag"><i class="bar"></i><span>{tag}</span></div>
  <div class="plate"><h1>{headline}</h1></div>
</div>
{slot}
{infohtml}
<div class="sub">{subtitle}</div>'''

ASSETS = [
    ("screen_47_2kg",  kiosk("47.2kg円"),          900, 1200, False),
    ("screen_1284",    kiosk("1,284円"),           900, 1200, False),
    ("screen_scan",    kiosk("¥108", scanning=True), 900, 1200, False),
    ("receipt",        RECEIPT,                    620, 1080, False),
    ("cctv_cam01",     cctv("CAM 01", "2026-09-16　01:19:40"),            1080, 1920, True),
    ("cctv_cam02",     cctv("CAM 02", "2026-09-16　01:21:02"),            1080, 1920, True),
    ("cctv_cam04_472", cctv("CAM 04", "2026-09-16　01:21:19", "47.2"),    1080, 1920, True),
    ("cctv_cam04_944", cctv("CAM 04", "2026-09-16　01:21:21", "94.4"),    1080, 1920, True),
    ("news_n1",          ytnews("ニュース", "#d0242a", "27歳女性が<br>行方不明", "",
                          "今月2日から連絡が<br>取れなくなっています"), 1080, 1920, False),
    ("news_n1_overlay",  ytnews("ニュース", "#d0242a", "27歳女性が<br>行方不明", "",
                          "今月2日から連絡が<br>取れなくなっています", plate=False), 1080, 1920, True),
    ("news_n2a",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　やせ型　黒っぽい上着",
                          "小柄で、深夜の品出しを<br>担当していたということです"), 1080, 1920, False),
    ("news_n2a_overlay", ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　やせ型　黒っぽい上着",
                          "小柄で、深夜の品出しを<br>担当していたということです", plate=False), 1080, 1920, True),
    ("news_n2b",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　やせ型　黒っぽい上着",
                          "勤務を終えたあと<br>店内の防犯カメラに姿が"), 1080, 1920, False),
    ("news_n2b_overlay", ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　やせ型　黒っぽい上着",
                          "勤務を終えたあと<br>店内の防犯カメラに姿が", plate=False), 1080, 1920, True),
    ("title",          TITLE,                      1080, 1920, False),
]

def main():
    OUT.mkdir(exist_ok=True); TMP.mkdir(exist_ok=True)
    ch = chrome()
    for name, html, w, h, transparent in ASSETS:
        src = TMP / f"{name}.html"; src.write_text(html, encoding="utf-8")
        cmd = [ch, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
               f"--window-size={w},{h}", "--force-device-scale-factor=1",
               "--virtual-time-budget=3000", f"--screenshot={OUT/(name+'.png')}"]
        if transparent: cmd.append("--default-background-color=00000000")
        cmd.append(src.as_uri())
        subprocess.run(cmd, capture_output=True)
        print(f"{name:18} {(OUT/(name+'.png')).stat().st_size:>8,} bytes  {w}x{h}"
              f"{'  (transparent)' if transparent else ''}")
    shutil.rmtree(TMP, ignore_errors=True)

if __name__ == "__main__":
    main()
