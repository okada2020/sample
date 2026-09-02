#!/usr/bin/env python3
"""ぱんがじうす（パンガシウス）紹介動画ビルダー。

静止画を紙芝居ふうのカードに仕立て、横スライドでつないだ
10秒 / 9:16（1080x1920, 30fps）の動画を書き出す。

使い方:
    python3 build_kamishibai.py --images ./images --out pangasius_intro_9x16.mp4

images ディレクトリには s1, s2, ... を置く（拡張子は .jpg / .png どちらでもよい）。
カットの数と字幕は SCENES で決まり、尺は TOTAL に収まるよう自動で割り振られる。
写真が横位置なら横長の枠、縦位置なら縦長の枠に自動で切り替わる（--layout で固定も可）。
画像のプロンプトとカットの意図は prompts.md を参照。
ffmpeg が PATH に無い場合は imageio-ffmpeg の同梱バイナリを使う。
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
FPS = 30
TOTAL = 10.0         # 動画全体の秒数
XFADE = 0.30         # スライド切り替えの秒数
PAPER = (255, 251, 244)
INK = (62, 58, 54)
ACCENT = (104, 176, 206)
RADIUS = 32          # 写真枠の角丸

# 写真の位置とサイズ。縦位置の絵と横位置の写真で枠を変える。
# (x, y, 幅, 高さ, 見出しのy, 罫線のy, ローマ字のy, 字幕1行目のy)
LAYOUTS = {
    "portrait": (60, 300, 960, 1240, 112, 214, 236, 1620),
    "landscape": (60, 570, 960, 720, 290, 402, 424, 1450),
}

# 丸ゴシックがあれば優先する
FONT_CANDIDATES = [
    "fonts/MPLUSRounded1c-Bold.ttf",
    "/usr/share/fonts/truetype/mplus/MPLUSRounded1c-Bold.ttf",
    "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc",
    "C:/Windows/Fonts/meiryo.ttc",
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
]

SCENES = [
    ("s1", ["世界でいちばん", "養殖されているナマズ"]),
    ("s2", ["ふるさとは、メコン川。"]),
    ("s3", ["クセのない、やわらかな白身"]),
]


def find_font(override=None):
    for path in ([override] if override else []) + FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    sys.exit("日本語フォントが見つかりません。--font でパスを指定してください。")


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit("ffmpeg が見つかりません。ffmpeg か imageio-ffmpeg を入れてください。")
    return imageio_ffmpeg.get_ffmpeg_exe()


def find_source(images_dir, stem):
    """s1 のような名前から、拡張子を問わず素材を1枚見つける。"""
    matches = sorted(glob.glob(os.path.join(images_dir, stem + ".*")))
    if not matches:
        sys.exit(f"素材が見つかりません: {os.path.join(images_dir, stem)}.*")
    return matches[0]


def pick_layout(sources, requested):
    if requested != "auto":
        return requested
    # 横長の素材が過半なら横長の枠にする
    wide = sum(1 for s in sources if Image.open(s).width >= Image.open(s).height)
    return "landscape" if wide * 2 >= len(sources) else "portrait"


def cover(im, w, h):
    """アスペクト比を保ったまま w x h を埋めるように中央トリミングする。"""
    src_ratio, dst_ratio = im.width / im.height, w / h
    if src_ratio > dst_ratio:
        nh, nw = h, max(w, round(h * src_ratio))
    else:
        nw, nh = w, max(h, round(w / src_ratio))
    im = im.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - w) // 2, (nh - h) // 2
    return im.crop((x, y, x + w, y + h))


def ctext(draw, y, text, font, fill, tracking=0):
    """画面中央そろえでテキストを描く。tracking は字間（px）。"""
    if tracking:
        widths = [draw.textlength(c, font=font) + tracking for c in text]
        x = (W - (sum(widths) - tracking)) / 2
        for char, cw in zip(text, widths):
            draw.text((x, y), char, font=font, fill=fill)
            x += cw
    else:
        draw.text(((W - draw.textlength(text, font=font)) / 2, y), text, font=font, fill=fill)


def rounded_mask(w, h, radius):
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([(0, 0), (w - 1, h - 1)], radius=radius, fill=255)
    return mask


def build_card(src, lines, out, font_path, layout):
    px, py, pw, ph, title_y, rule_y, romaji_y, cap_y = LAYOUTS[layout]
    f_title = ImageFont.truetype(font_path, 76)
    f_romaji = ImageFont.truetype(font_path, 26)
    f_cap = ImageFont.truetype(font_path, 60)

    bg = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(bg)

    # 見出し（全カット共通）
    ctext(draw, title_y, "ぱんがじうす", f_title, INK)
    draw.rectangle([(W // 2 - 90, rule_y), (W // 2 + 90, rule_y + 3)], fill=ACCENT)
    ctext(draw, romaji_y, "PANGASIUS", f_romaji, (120, 108, 96), tracking=7)

    # 写真のやわらかい影と角丸の枠
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rounded_rectangle(
        [(px - 4, py + 6), (px + pw + 4, py + ph + 16)], radius=RADIUS + 8, fill=64)
    bg.paste(Image.new("RGB", (W, H), (120, 110, 100)), (0, 0),
             shadow.filter(ImageFilter.GaussianBlur(18)))
    bg.paste(cover(Image.open(src).convert("RGB"), pw, ph), (px, py),
             rounded_mask(pw, ph, RADIUS))
    draw.rounded_rectangle([(px - 5, py - 5), (px + pw + 4, py + ph + 4)],
                           radius=RADIUS + 5, outline=(232, 226, 214), width=6)

    # 下段のことば
    y = cap_y if len(lines) > 1 else cap_y + 40
    for line in lines:
        ctext(draw, y, line, f_cap, INK)
        y += 88

    bg.save(out)


def clip_seconds(count):
    """全体が TOTAL 秒に収まる、1カットあたりの表示秒数。"""
    return (TOTAL + (count - 1) * XFADE) / count


def build_video(cards, out_path, ffmpeg):
    """カードを横スライドでつないで1本の動画にする。"""
    clip = clip_seconds(len(cards))
    args = [ffmpeg, "-y", "-loglevel", "error"]
    for card in cards:
        args += ["-loop", "1", "-t", str(round(clip, 3)), "-i", card]

    steps = [f"[{i}:v]fps={FPS},format=rgb24[a{i}]" for i in range(len(cards))]
    prev = "[a0]"
    for i in range(1, len(cards)):
        # i 番目の切り替え開始位置。最終尺は len*clip - (len-1)*XFADE = TOTAL 秒
        offset = round(i * clip - i * XFADE, 3)
        tail = ",format=yuv420p[v]" if i == len(cards) - 1 else f"[x{i}]"
        steps.append(
            f"{prev}[a{i}]xfade=transition=slideleft:duration={XFADE}:offset={offset}{tail}")
        prev = f"[x{i}]"

    args += ["-filter_complex", ";".join(steps), "-map", "[v]",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", str(FPS), out_path]
    subprocess.run(args, check=True)


def main():
    parser = argparse.ArgumentParser(description="ぱんがじうす紹介動画（紙芝居式・10秒・9:16）を書き出す")
    parser.add_argument("--images", default="images", help="s1, s2, ... を置いたディレクトリ")
    parser.add_argument("--out", default="pangasius_intro_9x16.mp4", help="出力する mp4 のパス")
    parser.add_argument("--keep-cards", metavar="DIR", help="中間のカード画像を残すディレクトリ")
    parser.add_argument("--font", help="字幕に使う日本語フォント（.ttf/.otf）のパス")
    parser.add_argument("--layout", default="auto", choices=["auto", "portrait", "landscape"],
                        help="写真枠の形。auto は素材の縦横から決める")
    args = parser.parse_args()

    font_path = find_font(args.font)
    ffmpeg = find_ffmpeg()
    sources = [find_source(args.images, stem) for stem, _ in SCENES]
    layout = pick_layout(sources, args.layout)
    card_dir = args.keep_cards or tempfile.mkdtemp(prefix="kamishibai-")
    os.makedirs(card_dir, exist_ok=True)

    cards = []
    for i, (src, (_, lines)) in enumerate(zip(sources, SCENES), 1):
        card = os.path.join(card_dir, f"card{i}.png")
        build_card(src, lines, card, font_path, layout)
        cards.append(card)
        print(f"カード{i} 作成: {card}（{os.path.basename(src)}）")

    build_video(cards, args.out, ffmpeg)
    print(f"書き出し完了: {args.out}"
          f"（{TOTAL:.1f}秒 / {W}x{H} / {len(cards)}カット・{layout}）")

    if not args.keep_cards:
        shutil.rmtree(card_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
