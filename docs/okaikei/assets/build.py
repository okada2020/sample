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
 body{{font-family:{FONT};background:#fbfaf7;padding:44px 46px;color:#14161a;
       font-size:27px;line-height:1.7;letter-spacing:.02em}}
 .r{{display:flex;justify-content:space-between}}
 .r i{{font-style:normal;font-variant-numeric:tabular-nums}}
 hr{{border:0;border-top:2px dashed #b9b6ae;margin:14px 0}}
 .sp{{height:30px}}
 .warn{{text-align:center;font-size:31px;letter-spacing:.06em}}
 .small{{font-size:23px;color:#4a4d54}}
 .big i{{font-size:34px;font-weight:700}}
</style>
<div class="small">2026/09/16&nbsp;&nbsp;23:21</div>
<div class="small">セルフレジ 2号</div>
<hr>
<div class="r"><span>唐揚げ弁当（半額）</span><i>¥199</i></div>
<div class="r"><span>鮭おにぎり</span><i>¥108</i></div>
<div class="r"><span>夜更けラーメン</span><i>¥168</i></div>
<div class="r"><span>水 500ml</span><i>¥88</i></div>
<hr>
<div class="r"><span>小計</span><i>¥563</i></div>
<div class="r"><span>消費税（8%）</span><i>¥45</i></div>
<div class="r big"><span>合計</span><i>¥0</i></div>
<hr>
<div class="r"><span>重量</span><i>94.4kg</i></div>
<div class="r"><span>人数</span><i>2名</i></div>
<hr>
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


# ------------------------------------------------------- news footage inserts
# The middle band of a news frame. Drawn, not generated: these are graphics a
# broadcaster would make, so they should look made, not photographed.
FOOTAGE = {}

FOOTAGE["map"] = """
<svg viewBox="0 0 1080 700" preserveAspectRatio="xMidYMid slice">
  <rect width="1080" height="700" fill="#141a22"/>
  <rect x="0" y="392" width="1080" height="308" fill="#182029"/>
  <path d="M-20 300h1120" stroke="#2c3742" stroke-width="30"/>
  <path d="M-20 300h1120" stroke="#3b4855" stroke-width="3" stroke-dasharray="26 22"/>
  <path d="M640-20v760" stroke="#2c3742" stroke-width="22"/>
  <path d="M220-20l90 760" stroke="#252e38" stroke-width="16"/>
  <path d="M-20 530h1120" stroke="#252e38" stroke-width="14"/>
  <rect x="60" y="330" width="130" height="86" fill="#1d2630"/>
  <rect x="330" y="340" width="96" height="66" fill="#1d2630"/>
  <rect x="760" y="336" width="150" height="74" fill="#1d2630"/>
  <rect x="700" y="560" width="180" height="90" fill="#1b2a24"/>
  <rect x="120" y="560" width="210" height="76" fill="#1b2a24"/>
  <circle cx="640" cy="300" r="76" fill="none" stroke="#d0242a" stroke-width="3" opacity=".35"/>
  <circle cx="640" cy="300" r="46" fill="none" stroke="#d0242a" stroke-width="4" opacity=".65"/>
  <circle cx="640" cy="300" r="17" fill="#d0242a"/>
  <g font-family="{FONT}" fill="#e6ebf1">
    <rect x="404" y="176" width="300" height="52" rx="4" fill="rgba(8,11,16,.85)"/>
    <text x="554" y="213" font-size="34" text-anchor="middle" letter-spacing="6">現場周辺</text>
  </g>
</svg>"""

FOOTAGE["store"] = """
<svg viewBox="0 0 1080 700" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0e15"/><stop offset="1" stop-color="#17202b"/>
    </linearGradient>
    <linearGradient id="spill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cfe6dd" stop-opacity=".30"/>
      <stop offset="1" stop-color="#cfe6dd" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="700" fill="url(#sky)"/>
  <rect x="0" y="470" width="1080" height="230" fill="#12171e"/>
  <path d="M150 470h780v230H150z" fill="url(#spill)" opacity=".5"/>
  <rect x="150" y="214" width="780" height="256" fill="#1b222b"/>
  <rect x="150" y="214" width="780" height="54" fill="#222b36"/>
  <rect x="196" y="228" width="300" height="28" rx="3" fill="#39434f"/>
  <rect x="186" y="292" width="708" height="178" fill="#e8f3ee" opacity=".9"/>
  <g fill="#aebfc4" opacity=".55">
    <rect x="214" y="330" width="86" height="140"/><rect x="330" y="318" width="74" height="152"/>
    <rect x="436" y="336" width="80" height="134"/><rect x="600" y="322" width="78" height="148"/>
    <rect x="706" y="334" width="88" height="136"/>
  </g>
  <rect x="524" y="292" width="62" height="178" fill="#f4faf7"/>
  <g stroke="#96a8ad" stroke-width="3" opacity=".8">
    <path d="M186 292v178M314 292v178M442 292v178M586 292v178M714 292v178M842 292v178"/>
  </g>
  <rect x="150" y="466" width="780" height="8" fill="#0c1016"/>
  <g stroke="#2a323c" stroke-width="4" opacity=".8">
    <path d="M60 560h150M280 560h150M650 560h150M870 560h150"/>
    <path d="M60 640h150M280 640h150M650 640h150M870 640h150"/>
  </g>
  <rect x="972" y="150" width="10" height="330" fill="#2a323c"/>
  <ellipse cx="977" cy="150" rx="46" ry="14" fill="#d7e4dd" opacity=".22"/>
  <g font-family="{FONT}" fill="#e6ebf1">
    <rect x="352" y="88" width="376" height="52" rx="4" fill="rgba(8,11,16,.85)"/>
    <text x="540" y="125" font-size="34" text-anchor="middle" letter-spacing="6">勤務先のスーパー</text>
  </g>
</svg>"""

def mosaic(cols=30, rows=20, cell=36):
    """A low-resolution security-camera frame: a dim aisle with a figure at the
    far end. Coarse enough that you have to decide whether you are seeing one."""
    import random
    rnd, out = random.Random(47), []
    for r in range(rows):
        for c in range(cols):
            x, y = c / (cols - 1), r / (rows - 1)
            v  = 30 + 26 * (1 - abs(x - .5) * 2)      # aisle brighter at centre
            v += 34 * max(0, 1 - abs(y - .18) * 5)    # ceiling lights
            v -= 20 * max(0, y - .74)                 # dark floor edge
            if .30 < x < .70 and y > .52: v += 16 * (y - .52)   # floor sheen
            if .44 < x < .57 and .30 < y < .66: v -= 30         # the figure
            v = max(8, min(96, v + rnd.uniform(-6, 6)))
            out.append(f'<rect x="{c*cell}" y="{r*cell}" width="{cell}" '
                       f'height="{cell}" fill="rgb({int(v)},{int(v*1.09)},{int(v*1.04)})"/>')
    return "".join(out)

FOOTAGE["cctv"] = f"""
<svg viewBox="0 0 1080 720" preserveAspectRatio="xMidYMid slice">
  <rect width="1080" height="720" fill="#20262c"/>
  <g shape-rendering="crispEdges">{mosaic()}</g>
  <g font-family="{FONT}">
    <rect x="352" y="40" width="376" height="52" rx="4" fill="rgba(8,11,16,.85)"/>
    <text x="540" y="77" font-size="34" text-anchor="middle" letter-spacing="6"
          fill="#e6ebf1">防犯カメラの映像</text>
    <text x="40" y="694" font-size="26" fill="#c8cfd6" opacity=".85"
          letter-spacing="3">CAM 03</text>
  </g>
</svg>"""

# ------------------------------------------------- youtube-style vertical news
# Japanese news on a phone is a YouTube short, not a TV capture: a headline
# plate pinned at the top, the footage in the middle, and big burned-in
# subtitles at the bottom. Safe zone 5% sides / 3% top-bottom.

def ytnews(tag, tagcolor, headline, info, subtitle, *, plate=True, footage=None):
    infohtml = f'<div class="info">{info}</div>' if info else ''
    bg = "#11151b" if plate else "transparent"
    if not plate:
        slot = ''
    elif footage:
        slot = f'<div class="slot">{FOOTAGE[footage]}</div>'
    else:
        slot = '<div class="slot">［ ここに映像を合成 ］</div>'
    return f'''<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:1080px;height:1920px;background:{bg}}}
 body{{font-family:{FONT};position:relative;color:#fff}}
 .slot{{position:absolute;inset:520px 0 700px;display:flex;align-items:center;justify-content:center;
        background:#1d232c;color:#5b6674;font-size:36px;letter-spacing:.1em;overflow:hidden}}
 .slot svg{{width:100%;height:100%;display:block}}
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


# ------------------------------------------------------------- character sheet
# A reference sheet, not art: clean labelled diagrams of the things that keep
# breaking in generation (the basket above all), plus the fixed wardrobe and
# prop list. Paste the text block into every prompt; show the sheet to anyone
# else who generates for this film.
CHARSHEET = f"""<meta charset="utf-8"><style>
 *{{box-sizing:border-box;margin:0}} html,body{{width:1400px;height:2160px}}
 body{{font-family:{FONT};background:#f2f1ed;color:#15181d;padding:52px 56px}}
 h1{{font-size:46px;font-weight:700;letter-spacing:.06em;margin-bottom:6px}}
 .sub{{font-size:22px;color:#6b7280;margin-bottom:32px;letter-spacing:.04em}}
 .grid{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
 .card{{background:#fff;border:2px solid #dcdad3;border-radius:12px;padding:26px 28px}}
 .card.wide{{grid-column:1 / -1}}
 h2{{font-size:27px;font-weight:700;margin-bottom:4px}}
 .note{{font-size:19px;color:#6b7280;margin-bottom:18px}}
 .row{{display:flex;gap:22px;align-items:flex-start}}
 svg{{flex:none;background:#f7f7f4;border-radius:8px}}
 dl{{display:grid;grid-template-columns:auto 1fr;gap:9px 16px;font-size:21px;
     align-content:start;flex:1}}
 dt{{color:#6b7280;white-space:nowrap}}
 dd{{font-weight:500}}
 .warn{{background:#fdf3e7;border-left:6px solid #c9781a;padding:15px 20px;
        font-size:20px;line-height:1.7;border-radius:0 8px 8px 0;margin-top:18px}}
 .warn b{{color:#9c5a10}}
 .hi{{color:#c9781a;font-weight:700}}
 .items{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:4px}}
 .item{{text-align:center;font-size:19px;line-height:1.55}}
 .item svg{{display:block;margin:0 auto 10px}}
 .item b{{display:block;font-size:22px;margin-bottom:3px}}
 .item span{{color:#6b7280}}
 .two{{display:grid;grid-template-columns:1fr 1fr;gap:0 44px}}
</style>
<h1>『お会計』 キャラクター＆プロップ設定</h1>
<div class="sub">全カットで固定。生成のたびにこのページの指定をそのまま使う。</div>

<div class="grid">
  <div class="card">
    <h2>主人公</h2>
    <p class="note">28歳男性・肉体労働者・残業帰り。顔は一度も映らない</p>
    <div class="row">
      <svg width="270" height="330" viewBox="-40 -10 270 330">
        <ellipse cx="95" cy="52" rx="34" ry="38" fill="#e8c9a8" stroke="#15181d" stroke-width="2.5"/>
        <path d="M62 36q33-26 66 0v6H62z" fill="#243247" stroke="#15181d" stroke-width="2.5"/>
        <path d="M46 42h62q4 0 4 -4H50q-4 0-4 4z" fill="#1b2635" stroke="#15181d" stroke-width="2.5"/>
        <path d="M40 30h26" stroke="#c9781a" stroke-width="1.6"/>
        <text x="-38" y="26" font-size="15" fill="#c9781a">作業帽</text>
        <circle cx="128" cy="58" r="8.5" fill="#fff" stroke="#15181d" stroke-width="2.5"/>
        <path d="M128 67v9" stroke="#15181d" stroke-width="2.5"/>
        <path d="M140 58h18" stroke="#c9781a" stroke-width="1.6"/>
        <text x="161" y="63" font-size="15" fill="#c9781a">R 装着</text>
        <circle cx="62" cy="58" r="8.5" fill="none" stroke="#b9b6af" stroke-width="2" stroke-dasharray="3 3"/>
        <path d="M50 58H32" stroke="#6b7280" stroke-width="1.6"/>
        <text x="-38" y="63" font-size="15" fill="#6b7280">L 外す</text>
        <path d="M52 96h86l12 104H40z" fill="#1f3355" stroke="#15181d" stroke-width="2.5"/>
        <path d="M95 96v104" stroke="#15181d" stroke-width="2"/>
        <path d="M40 200l6 26h98l6-26" fill="#1f3355" stroke="#15181d" stroke-width="2.5"/>
        <rect x="30" y="184" width="20" height="24" rx="3" fill="#2b3a55" stroke="#15181d" stroke-width="2.5"/>
        <rect x="140" y="184" width="20" height="24" rx="3" fill="#2b3a55" stroke="#15181d" stroke-width="2.5"/>
        <path d="M28 196H-2" stroke="#c9781a" stroke-width="1.6"/>
        <text x="-38" y="178" font-size="15" fill="#c9781a">袖口が</text>
        <text x="-38" y="196" font-size="15" fill="#c9781a">汚れている</text>
        <path d="M120 122l40 30" stroke="#15181d" stroke-width="2.5" fill="none"/>
        <rect x="152" y="146" width="34" height="48" rx="5" fill="#3a3f4a" stroke="#15181d" stroke-width="2.5"/>
        <path d="M169 196v46" stroke="#6b7280" stroke-width="1.6" fill="none"/>
        <text x="150" y="262" font-size="15" fill="#6b7280" text-anchor="middle">ショルダーバッグ</text>
      </svg>
      <dl>
        <dt>帽子</dt><dd class="hi">紺の作業帽（つば付き）</dd>
        <dt>上着</dt><dd>紺の作業着</dd>
        <dt>袖口</dt><dd>少し汚れている</dd>
        <dt>手</dt><dd>幅広く乾いた働く手</dd>
        <dt></dt><dd>爪は短く角ばっている</dd>
        <dt></dt><dd>指の関節に小さな擦り傷</dd>
        <dt>持ち物</dt><dd>黒いショルダーバッグ</dd>
        <dt></dt><dd>スマートフォン</dd>
        <dt>イヤホン</dt><dd>白いワイヤレス</dd>
        <dt></dt><dd class="hi">片耳だけ（右）</dd>
      </dl>
    </div>
    <div class="warn"><b>イヤホンは片耳だけ。</b>両耳だと背後の物音が聞こえない理屈になる。POVでは見えず、防犯カメラのカットでだけ左右非対称に見える ―― 外から見た視聴者だけが気づく。</div>
  </div>

  <div class="card">
    <h2>買い物カゴ</h2>
    <p class="note">日本のスーパーの33Lカゴ。ここが一番崩れる</p>
    <div class="row">
      <svg width="270" height="330" viewBox="-20 -10 270 330">
        <text x="-18" y="18" font-size="15" fill="#c9781a">U字の折りたたみ取っ手 ×2</text>
        <path d="M84 30v-6" stroke="#c9781a" stroke-width="1.6"/>
        <path d="M60 116V74q0-16 16-16h78q16 0 16 16v42" fill="none" stroke="#8c8f94" stroke-width="7"/>
        <path d="M34 128h162l-22 132H56z" fill="#4a4e55" stroke="#15181d" stroke-width="2.5"/>
        <path d="M28 116h174v14H28z" fill="#5a5f66" stroke="#15181d" stroke-width="2.5"/>
        <g stroke="#2c3037" stroke-width="3">
          <path d="M52 142v108M70 142v108M88 142v108M106 142v108M124 142v108M142 142v108M160 142v108"/>
        </g>
        <path d="M58 260h114" stroke="#15181d" stroke-width="2.5"/>
        <path d="M28 286h174" stroke="#c9781a" stroke-width="2" stroke-dasharray="5 4"/>
        <path d="M34 280l-6 6 6 6M196 280l6 6-6 6" stroke="#c9781a" stroke-width="2" fill="none"/>
        <text x="46" y="310" font-size="15" fill="#c9781a">上が広い（重ねられる）</text>
      </svg>
      <dl>
        <dt>色</dt><dd>濃いグレーのPP</dd>
        <dt>形</dt><dd>上が広いテーパー</dd>
        <dt>側面</dt><dd>細い縦スリットが並ぶ</dd>
        <dt>上端</dt><dd>太く滑らかなリム</dd>
        <dt>取っ手</dt><dd>U字の金属線 ×2</dd>
        <dt></dt><dd>内側に倒れて畳める</dd>
      </dl>
    </div>
    <div class="warn"><b>POVでの持ち方。</b>片手で<b>取っ手1本だけ</b>を握り、腕は下に垂らす。カゴは画面の右下に斜めに見切れる程度。両手で胸の前に構えるとカートに見える ―― これで何度も失敗した。</div>
  </div>

  <div class="card wide">
    <h2>主人公の隠し方</h2>
    <p class="note">顔を見せないのではなく、<b>誰だか特定させない</b>。POVは元から顔が映らないので、効くのは防犯カメラのカット</p>
    <div class="two" style="gap:0 44px">
      <dl>
        <dt>①&nbsp;人を増やす</dt><dd><b>これが一番効く。</b>通路に客が2〜3人。
          彼は「その他大勢の1人」になる。<br>レジだけは無人 ―― 深夜1時では成立しなかったが、
          23時なら自然</dd>
        <dt>②&nbsp;作業帽</dt><dd>防犯カメラは高い位置にある。
          つばで顔が完全に消える。隠している感じがしない</dd>
        <dt>③&nbsp;真上寄り</dt><dd>カメラは天井から見下ろす。
          映るのは頭頂と肩だけ</dd>
      </dl>
      <dl>
        <dt>④&nbsp;逆光</dt><dd>入店のカットは、明るいガラス面を背に立たせて
          シルエットにする</dd>
        <dt>⑤&nbsp;粗さ</dt><dd>防犯カメラのカットを、ニュースの
          <b>CAM 03 と同じ粗さ</b>にそろえる</dd>
        <dt></dt><dd class="hi">同じ画質にすると、行方不明の女性の映像と
          主人公の映像が見分けられなくなる</dd>
      </dl>
    </div>
    <div class="warn">隠しても<b>特定できなくなるわけではない</b>。POVが直前まで続いているので、
      レジに立つ人影が誰かは分かる。分からなくなるのは<b>顔と、どういう男か</b>だけ。
      最後に94.4kgが出たとき、視聴者が「誰の重さか」を数え直せる程度には残しておく。</div>
  </div>

  <div class="card wide">
    <h2>カゴの中身 ― この4点で固定</h2>
    <p class="note">残業帰りの23時に買うもの。全カットで同じ4点、同じ並び</p>
    <div class="items">
      <div class="item">
        <svg width="100" height="140" viewBox="0 0 100 140">
          <rect x="38" y="14" width="24" height="15" rx="3" fill="#fff" stroke="#15181d" stroke-width="2.5"/>
          <path d="M42 17h16M42 21h16M42 25h16" stroke="#15181d" stroke-width="1.4"/>
          <path d="M36 29h28l7 19v70q0 8-8 8H37q-8 0-8-8V48z" fill="#e8f2f7" stroke="#15181d" stroke-width="2.5"/>
          <path d="M31 70h38M31 84h38" stroke="#b9c9d2" stroke-width="2.5"/>
        </svg>
        <b>水</b><span>ラベルなし・白キャップ<br>バーコードはキャップに</span>
      </div>
      <div class="item">
        <svg width="100" height="140" viewBox="0 0 100 140">
          <path d="M26 42h52l-8 78H34z" fill="#fff" stroke="#15181d" stroke-width="2.5"/>
          <rect x="22" y="30" width="60" height="14" rx="3" fill="#f0f0ee" stroke="#15181d" stroke-width="2.5"/>
          <path d="M29 66h46l-2 20H31z" fill="#d0242a" stroke="#15181d" stroke-width="2"/>
        </svg>
        <b>夜更けラーメン</b><span>白地にくすんだ赤い帯<br>細い紺線・銀のフタ</span>
      </div>
      <div class="item">
        <svg width="100" height="140" viewBox="0 0 100 140">
          <rect x="14" y="60" width="74" height="50" rx="4" fill="#26282c" stroke="#15181d" stroke-width="2.5"/>
          <rect x="14" y="50" width="74" height="14" rx="3" fill="#dbeaf2" stroke="#15181d" stroke-width="2.5" opacity=".9"/>
          <rect x="26" y="72" width="24" height="28" rx="2" fill="#f3efe2"/>
          <circle cx="66" cy="82" r="9" fill="#c98a4a"/>
          <circle cx="70" cy="98" r="7" fill="#a8703a"/>
          <circle cx="26" cy="48" r="17" fill="#ffd23f" stroke="#15181d" stroke-width="2"/>
          <text x="26" y="55" font-size="15" text-anchor="middle" fill="#c00" font-weight="bold">半額</text>
        </svg>
        <b>弁当</b><span>黒トレー・透明フタ<br><span class="hi">黄色い「半額」シール</span></span>
      </div>
      <div class="item">
        <svg width="100" height="140" viewBox="0 0 100 140">
          <path d="M50 26 88 108H12z" fill="#f7f4ec" stroke="#15181d" stroke-width="2.5"/>
          <path d="M34 76h32l16 32H18z" fill="#23262b" stroke="#15181d" stroke-width="2"/>
          <rect x="24" y="44" width="40" height="22" rx="2" fill="#efe7d2"
                stroke="#15181d" stroke-width="2" transform="rotate(-6 44 55)"/>
          <text x="44" y="60" font-size="15" text-anchor="middle" fill="#3a3f4a"
                transform="rotate(-6 44 55)">鮭 108</text>
          <rect x="18" y="40" width="10" height="9" fill="#dfe6ea" opacity=".85"
                stroke="#b9c2c7" stroke-width="1" transform="rotate(-6 44 55)"/>
          <rect x="60" y="61" width="10" height="9" fill="#dfe6ea" opacity=".85"
                stroke="#b9c2c7" stroke-width="1" transform="rotate(-6 44 55)"/>
        </svg>
        <b>鮭おにぎり</b><span>透明ラップ・中央だけ海苔<br><span class="hi">紙に手書き、テープ留め</span></span>
      </div>
    </div>
  </div>

  <div class="card wide">
    <h2>店とレジ</h2>
    <div class="two">
      <dl>
        <dt>時刻</dt><dd>23:15 〜 23:22</dd>
        <dt>客</dt><dd class="hi">通路に2〜3人。レジは無人</dd>
        <dt>営業</dt><dd>している。閉店間際ではない</dd>
        <dt>光</dt><dd>冷たい蛍光灯・少し薄暗い</dd>
        <dt></dt><dd>わずかに緑シアン寄り</dd>
        <dt>床</dt><dd>光沢タイル、照明を反射</dd>
      </dl>
      <dl>
        <dt>通路</dt><dd>左が冷蔵ケース（ガラス扉）</dd>
        <dt></dt><dd>右が乾物の棚</dd>
        <dt>レジ</dt><dd>セルフレジが3台</dd>
        <dt>端末</dt><dd>縦型の黒いタッチスクリーン</dd>
        <dt>スキャナ</dt><dd>カウンター埋込・赤く発光</dd>
      </dl>
    </div>
    <div class="warn">実在企業・決済サービス・放送局の名称とロゴは一切出さない。怪物・発光する目・異形・走る動作も禁止。人影は普通の成人体型。</div>
  </div>
</div>"""


ASSETS = [
    ("screen_47_2kg",  kiosk("47.2kg円"),          900, 1200, False),
    ("screen_0",       kiosk("0円"),               900, 1200, False),
    ("screen_scan",    kiosk("¥108", scanning=True), 900, 1200, False),
    ("receipt",        RECEIPT,                    620, 1080, False),
    ("cctv_cam01",     cctv("CAM 01", "2026-09-16　23:19:40"),            1080, 1920, True),
    ("cctv_cam02",     cctv("CAM 02", "2026-09-16　23:21:02"),            1080, 1920, True),
    ("cctv_cam04_472", cctv("CAM 04", "2026-09-16　23:21:19", "47.2"),    1080, 1920, True),
    ("cctv_cam04_944", cctv("CAM 04", "2026-09-16　23:21:21", "94.4"),    1080, 1920, True),
    ("news_n1",          ytnews("ニュース", "#d0242a", "27歳女性が<br>行方不明", "",
                          "今月2日から連絡が<br>取れなくなっています",
                          footage="map"), 1080, 1920, False),
    ("news_n1_overlay",  ytnews("ニュース", "#d0242a", "27歳女性が<br>行方不明", "",
                          "今月2日から連絡が<br>取れなくなっています", plate=False), 1080, 1920, True),
    ("news_n2a",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "ひとりで深夜の品出しを<br>担当していたということです",
                          footage="store"), 1080, 1920, False),
    ("news_n2a_overlay", ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "ひとりで深夜の品出しを<br>担当していたということです", plate=False), 1080, 1920, True),
    ("news_n2b",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "勤務を終えたあと<br>店内の防犯カメラに姿が",
                          footage="cctv"), 1080, 1920, False),
    ("news_n2b_overlay", ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "勤務を終えたあと<br>店内の防犯カメラに姿が", plate=False), 1080, 1920, True),
    ("news_n2c",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "映っていたのを最後に<br>行方が分かっていません",
                          footage="cctv"), 1080, 1920, False),
    ("news_n2d",         ytnews("ニュース", "#d0242a", "行方不明の女性<br>勤務先のスーパーで最後の目撃",
                          "身長158センチくらい　小柄で痩せ型",
                          "警察は情報の提供を<br>呼びかけています",
                          footage="cctv"), 1080, 1920, False),
    ("charsheet",       CHARSHEET,                  1400, 2160, False),
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
