#!/bin/bash
#
# Yukkuri Studio を Intel / Apple Silicon 両対応でビルドし、.app を組み立てる。
#
#   ./scripts/build_app.sh                     … ad-hoc 署名（自分の Mac 専用）
#   DEV_ID="Developer ID Application: Your Name (TEAMID)" ./scripts/build_app.sh
#                                              … 配布用に Developer ID 署名
#
# 配布するには署名後に公証（notarization）が必要。末尾の手順を参照。

set -euo pipefail

APP_NAME="Yukkuri Studio"
EXECUTABLE="YukkuriStudio"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT/.build"
APP_DIR="$ROOT/dist/$APP_NAME.app"

# --- ビルド（ユニバーサル） ------------------------------------------------
# v0.3.0 は arm64 単一スライスだったため Intel Mac で起動できなかった。
echo "==> ビルド中（arm64 + x86_64）"
swift build -c release --arch arm64 --arch x86_64 --package-path "$ROOT"

BINARY="$(swift build -c release --arch arm64 --arch x86_64 --package-path "$ROOT" --show-bin-path)/$EXECUTABLE"

# --- .app の組み立て -------------------------------------------------------
echo "==> バンドルを作成"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"

cp "$BINARY" "$APP_DIR/Contents/MacOS/$EXECUTABLE"
cp "$ROOT/Resources/Info.plist" "$APP_DIR/Contents/Info.plist"
printf 'APPL????' > "$APP_DIR/Contents/PkgInfo"

# 操作ガイド
[ -f "$ROOT/Resources/操作ガイド.md" ] && cp "$ROOT/Resources/操作ガイド.md" "$APP_DIR/Contents/Resources/"

# アプリアイコン（Resources/AppIcon.icns を用意しておく）
# v0.3.0 はアイコン未設定で Dock に白紙表示だった。
if [ -f "$ROOT/Resources/AppIcon.icns" ]; then
    cp "$ROOT/Resources/AppIcon.icns" "$APP_DIR/Contents/Resources/"
else
    echo "!! Resources/AppIcon.icns がありません（アイコンなしでビルドします）"
fi

# ビルドパスに含まれる個人情報（/Users/<名前>/…）をバイナリから除去
strip -x "$APP_DIR/Contents/MacOS/$EXECUTABLE" 2>/dev/null || true

echo "==> アーキテクチャ確認"
lipo -info "$APP_DIR/Contents/MacOS/$EXECUTABLE"

# --- 署名 ------------------------------------------------------------------
if [ -n "${DEV_ID:-}" ]; then
    echo "==> Developer ID で署名（Hardened Runtime 有効）"
    codesign --force --deep --timestamp --options runtime \
             --entitlements "$ROOT/Resources/YukkuriStudio.entitlements" \
             --sign "$DEV_ID" "$APP_DIR"
    codesign --verify --strict --verbose=2 "$APP_DIR"

    cat <<'NOTARIZE'

==> 次に公証（notarization）を行う:

    ditto -c -k --keepParent "dist/Yukkuri Studio.app" dist/YukkuriStudio.zip
    xcrun notarytool submit dist/YukkuriStudio.zip \
        --apple-id "you@example.com" \
        --team-id "TEAMID" \
        --password "app-specific-password" \
        --wait
    xcrun stapler staple "dist/Yukkuri Studio.app"

公証まで済ませると、他の Mac でも警告なしに起動できる。
NOTARIZE
else
    echo "==> ad-hoc 署名（この Mac でのみ動作）"
    codesign --force --deep --sign - "$APP_DIR"
    cat <<'ADHOC'

!! ad-hoc 署名のため、他の Mac へ配布すると Gatekeeper に拒否される。
   受け取った側で開くには:
       xattr -dr com.apple.quarantine "/Applications/Yukkuri Studio.app"
   配布用に署名するには DEV_ID を指定して再実行する。
ADHOC
fi

echo "==> 完成: $APP_DIR"
