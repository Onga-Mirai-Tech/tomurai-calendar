# 弔いカレンダー

没年月日から中陰法要・年回法要の日程を計算し、カレンダーに登録・印刷できるWEBアプリ。

- 公開URL: `https://tomurai-cal.onga-mirai-tech.com/`（Xサーバーのサブドメイン）。旧URL `onga-mirai-tech.github.io/tomurai-calendar/` は転送ページ
- デプロイ: main への push で GitHub Actions が `dist/` を rsync 同期（遠賀町ナビ・Disaster Chronicle・もるっくんと同じ方式）。手順は `docs/deploy-xserver.md`。接続情報は GitHub の secrets にのみ置き、ファイルに書かない
- リポジトリは公開。コミット内容はすべて公開される前提で書く

## 作り

- `index.html` 1枚。スクリプトは中に直接書く。計算だけの関数は `// ==== LOGIC START/END ====` の間に置き、画面（DOM）に触らない
- テスト: `npm test`（LOGIC 区間を切り出して、日本時間とロサンゼルス時間の両方で実行する）
- スタイルは Tailwind CSS 3.4.17 をビルドして `assets/app.css` に出す（`npm run build:css`。`assets/app.css` はコミットしない）。独自のスタイルは `src/tailwind.css` に書く
- 印刷用の QR コード `qr.svg` は `npm run qr` で作ってコミットする（URL を変えたら作り直す）

## 守ること

- 入力された内容（お名前・戒名・メモ）は必ず `textContent` で表示する。`innerHTML` に入れない
- 外部の CDN・フォント・API は使わない。`server/.htaccess` の CSP（`connect-src 'none'`、`style-src 'self'` など）で本番だけ壊れる
- CSP は `<script>` の中身のハッシュで許可している（`scripts/csp-hashes.pl` → `scripts/build.sh`）。`onclick="…"` などの属性・`style="…"` 属性・`<style>` タグは本番で動かないので使わない
- 本番と同じ CSP で確かめるときは `.claude/launch.json` の `tomurai-calendar-dist` で開く
- `HOYO_DEFS` の並び順は予定のUIDに使っている。法要を足すときは末尾に足す（途中に入れると、登録し直したときに二重登録になる）
- 法要の説明文や計算の決まりは、宗派・地域で違いがある。断定しすぎず、注意事項（菩提寺へ相談）を消さない
- ドメインは `index.html`・`scripts/make-qr.js`・`scripts/brand/ogp.html`・`server/.htaccess`・`pages-redirect/`・`.github/workflows/`・`scripts/setup-deploy-env.sh`・`docs/` に書かれている。変えるときは `grep -rn tomurai-cal.onga-mirai-tech.com` で漏れなく置き換える

## 公開物に含めないもの

`scripts/build.sh` が `dist/` に集めたものだけが公開される: `index.html`・`assets/`・`qr.svg`・`favicon.svg`・`icon-180.png`・`ogp.png` と `server/.htaccess`。公開ファイルを足したら `scripts/build.sh` にも追記する。

- アイコン・カード画像の絵は `favicon.svg` が元。変えたら `bash scripts/brand/generate.sh`（Google Chrome と macOS の sips を使う）で `icon-180.png` と `ogp.png` を作り直す
