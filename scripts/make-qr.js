// 印刷用の QR コード（qr.svg）を作る。サイトの URL を変えたら npm run qr で作り直してコミットする。
// 以前は印刷のたびに外部サービス（api.qrserver.com）で作っていたが、ページを開くだけで外部へ通信が
// 発生し、サービスが止まると印刷物に QR が出なくなるため、画像としてリポジトリに置く方式にした。
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');

const URL_TEXT = 'https://tomurai-cal.onga-mirai-tech.com/';

QRCode.toString(URL_TEXT, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 }).then(svg => {
  fs.writeFileSync(path.join(__dirname, '..', 'qr.svg'), svg + '\n');
  console.log(`qr.svg を作成しました: ${URL_TEXT}`);
});
