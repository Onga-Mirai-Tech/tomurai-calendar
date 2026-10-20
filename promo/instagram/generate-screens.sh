#!/usr/bin/env bash
# アプリの画面写真（screens/*.png）を見本データで撮る。Google Chrome（ヘッドレス）と macOS の sips を使う。
# スマホ幅 375x812 の2倍（750x1624）で撮る（capture.html の iframe に表示して撮り、中央を sips で切り抜く）。
# 先に npm run build:css で assets/app.css を作っておくこと。
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=8790

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
TMP="$(mktemp -d)"
trap 'kill $SERVER; rm -rf "$TMP"' EXIT
sleep 1

for mode in form top list; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=600,812 --virtual-time-budget=10000 \
    --screenshot="$PWD/screens/$mode.png" \
    "http://127.0.0.1:$PORT/promo/instagram/capture.html?mode=$mode" >/dev/null 2>&1
  sips -c 1624 750 "screens/$mode.png" >/dev/null   # 中央に置いた iframe の部分だけを残す
done

# 印刷用（A4）は PDF にしてから1ページ目を画像にする
"$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 \
  --print-to-pdf="$TMP/print.pdf" \
  "http://127.0.0.1:$PORT/promo/instagram/capture.html?mode=print" >/dev/null 2>&1
sips -s format png --resampleWidth 1240 "$TMP/print.pdf" --out screens/print.png >/dev/null

echo "screens/ に form・top・list・print.png を作成しました"
