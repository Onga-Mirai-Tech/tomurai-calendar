# 弔いカレンダー

中陰法要・年回法要 計算アプリ。没年月日を入力するだけで、初七日から五十回忌までの法要日程を計算し、Googleカレンダー・iPhone/Macのカレンダーに登録したり、日程表を印刷したりできます。

https://tomurai-cal.onga-mirai-tech.com/

- 計算はすべて端末の中で行い、入力内容をサーバーへ送りません
- お寺や地域によって日程の考え方は異なります。詳しくは菩提寺へご相談ください

## 開発

```bash
npm install
npm test            # 計算のテスト
bash scripts/build.sh   # 公開用ファイルを dist/ に作る
```

公開（Xserver へのデプロイ）の手順は [docs/deploy-xserver.md](docs/deploy-xserver.md) を参照してください。
