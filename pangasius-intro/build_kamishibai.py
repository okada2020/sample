#!/usr/bin/env python3
"""ぱんがじうす（パンガシウス）紹介動画ビルダー。

実写風の静止画5枚を紙芝居ふうのカードに仕立て、横スライドでつないだ
10秒 / 9:16（1080x1920, 30fps）の動画を書き出す。

使い方:
    python3 build_kamishibai.py --images ./images --out pangasius_intro_9x16.mp4

images ディレクトリには s1.png 〜 s5.png（9:16 の実写風画像）を置く。
画像のプロンプトとカットの意図は prompts.md を参照。
ffmpeg が PATH に無い場合は imageio-ffmpeg の同梱バイナリを使う。
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
FPS = 30
CLIP = 2.24          # 1カットの表示秒数
XFADE = 0.30         # スライド切り替えの秒数（5カットで合計10.0秒）
PAPER = (243, 236, 224)
INK = (36, 32, 28)
ACCENT = (188, 62, 45)
PX, PY, PW, PH = 60, 300, 960, 1240  # 写真の位置とサイズ

FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "C:/Windows/Fonts/meiryo.ttc",
]

SCENES = [
    ("s1.png", ["世界でいちばん", "養殖されているナマズ"]),
    ("s2.png", ["ふるさとは、メコン川。"]),
    ("s3.png", ["大きいものは全長1.5m"]),
    ("s4.png", ["クセのない、やわらかな白身"]),
    ("s5.png", ["「バサ」の名で、世界の食卓へ"]),
]


def find_font():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    sys.exit("日本語フォントが見つかりません。FONT_CANDIDATES にパスを追加してください。")


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
    except ImportError:
        sys.exit("ffmpeg が見つかりません。ffmpeg か imageio-ffmpeg を入れてください。")
    return imageio_ffmpeg.get_ffmpeg_exe()


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


def paper_bg():
    """わずかに紙の粒状感をのせた背景。"""
    flat = Image.new("RGB", (W, H), PAPER)
    noise = Image.effect_noise((W, H), 14).convert("L").filter(ImageFilter.GaussianBlur(0.6))
    grain = ImageChops.overlay(flat, Image.merge("RGB", (noise, noise, noise)))
    return Image.blend(flat, grain, 0.22)


def build_card(src, lines, out, font_path):
    f_title = ImageFont.truetype(font_path, 76)
    f_romaji = ImageFont.truetype(font_path, 26)
    f_cap = ImageFont.truetype(font_path, 60)

    bg = paper_bg()
    draw = ImageDraw.Draw(bg)

    # 見出し（全カット共通）
    ctext(draw, 112, "ぱんがじうす", f_title, INK)
    draw.rectangle([(W // 2 - 90, 214), (W // 2 + 90, 217)], fill=ACCENT)
    ctext(draw, 236, "PANGASIUS", f_romaji, (120, 108, 96), tracking=7)

    # 写真の影と白マット
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).rectangle(
        [(PX - 6, PY + 4), (PX + PW + 6, PY + PH + 18)], fill=90)
    bg.paste(Image.new("RGB", (W, H), (60, 50, 40)), (0, 0),
             shadow.filter(ImageFilter.GaussianBlur(16)))
    draw.rectangle([(PX - 14, PY - 14), (PX + PW + 14, PY + PH + 14)], fill=(252, 250, 245))
    bg.paste(cover(Image.open(src).convert("RGB"), PW, PH), (PX, PY))
    draw.rectangle([(PX - 15, PY - 15), (PX + PW + 15, PY + PH + 15)],
                   outline=(206, 195, 178), width=3)

    # 下段のことば
    y = 1620 if len(lines) > 1 else 1660
    for line in lines:
        ctext(draw, y, line, f_cap, INK)
        y += 88

    bg.save(out)


def build_video(cards, out_path, ffmpeg):
    """カードを横スライドでつないで1本の動画にする。"""
    args = [ffmpeg, "-y", "-loglevel", "error"]
    for card in cards:
        args += ["-loop", "1", "-t", str(CLIP), "-i", card]

    steps = [f"[{i}:v]fps={FPS},format=rgb24[a{i}]" for i in range(len(cards))]
    prev = "[a0]"
    for i in range(1, len(cards)):
        # i 番目の切り替え開始位置。最終尺は len*CLIP - (len-1)*XFADE = 10.0 秒
        offset = round(i * CLIP - i * XFADE, 3)
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
    parser.add_argument("--images", default="images", help="s1.png〜s5.png を置いたディレクトリ")
    parser.add_argument("--out", default="pangasius_intro_9x16.mp4", help="出力する mp4 のパス")
    parser.add_argument("--keep-cards", metavar="DIR", help="中間のカード画像を残すディレクトリ")
    args = parser.parse_args()

    font_path = find_font()
    ffmpeg = find_ffmpeg()
    card_dir = args.keep_cards or tempfile.mkdtemp(prefix="kamishibai-")
    os.makedirs(card_dir, exist_ok=True)

    cards = []
    for i, (name, lines) in enumerate(SCENES, 1):
        src = os.path.join(args.images, name)
        if not os.path.exists(src):
            sys.exit(f"素材が見つかりません: {src}")
        card = os.path.join(card_dir, f"card{i}.png")
        build_card(src, lines, card, font_path)
        cards.append(card)
        print(f"カード{i} 作成: {card}")

    build_video(cards, args.out, ffmpeg)
    print(f"書き出し完了: {args.out}（{len(SCENES) * CLIP - (len(SCENES) - 1) * XFADE:.1f}秒 / {W}x{H}）")

    if not args.keep_cards:
        shutil.rmtree(card_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
