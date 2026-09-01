#!/bin/sh
# =====================================================================
# サイト間で共通のエンジン（描画・ビルド・スタイル）を揃える
# ---------------------------------------------------------------------
# affiliate/ を正とし、他サイトへコピーします。
# エンジンを修正したら必ずこれを実行してください。
# 各サイト固有のもの（data/ と *.html）はコピーしません。
#   使い方:  sh sync-engine.sh
# =====================================================================
set -e
SRC=affiliate
SITES="matching hikari"
FILES="js/render.js js/app.js build.js css/style.css _headers .node-version"

for site in $SITES; do
  [ -d "$site" ] || continue
  for f in $FILES; do
    mkdir -p "$site/$(dirname "$f")"
    cp "$SRC/$f" "$site/$f"
    echo "  $SRC/$f -> $site/$f"
  done
done
echo "エンジンを同期しました。各サイトで node build.js を実行してください。"
