#!/usr/bin/env bash
# Instagram 投稿用の画像（1080x1350）を slide-1〜5.html から作る。Google Chrome（ヘッドレス）を使う。
# アプリの画面写真 screens/ は generate-screens.sh で作る（スマホ幅 375x812 の2倍＝750x1624）。
set -euo pipefail

cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p out

for i in 1 2 3 4 5; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --allow-file-access-from-files \
    --window-size=1080,1350 --screenshot="$PWD/out/tomurai-$i.png" \
    "file://$PWD/slide-$i.html" >/dev/null 2>&1
done

echo "out/ に tomurai-1〜5.png を作成しました"
