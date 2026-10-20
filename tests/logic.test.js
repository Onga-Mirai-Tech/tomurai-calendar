// index.html の「// ==== LOGIC START ====」〜「// ==== LOGIC END ====」を切り出してテストする。
// npm test で、日本時間とロサンゼルス時間の2つの時刻帯で実行される（日付が1日ずれないことの確認）。
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ ==== LOGIC START ====([\s\S]*?)\/\/ ==== LOGIC END ====/);
assert.ok(m, 'index.html に LOGIC START/END が見つかりません');
const L = new Function(`${m[1]}
  return { SITE_URL, HOYO_DEFS, parseDateInput, addDays, addYears, calculateHoyo, uidFor,
           buildDescription, escapeICSText, foldICSLine, buildICS, getGoogleCalendarUrl, detectEnv };`)();

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const byName = (events, name) => events.find(e => e.name === name);

test('没年月日は端末の時刻帯でもその日のまま読む', () => {
  const d = L.parseDateInput('2026-10-20');
  assert.equal(ymd(d), '2026-10-20');
  assert.equal(d.getHours(), 0);
});

test('正しくない日付は null', () => {
  assert.equal(L.parseDateInput(''), null);
  assert.equal(L.parseDateInput('2026-02-30'), null);
  assert.equal(L.parseDateInput('2026/10/20'), null);
});

test('中陰法要と年回法要の日付', () => {
  const ev = L.calculateHoyo(L.parseDateInput('2026-10-20'), '山田太郎');
  assert.equal(ev.length, L.HOYO_DEFS.length);
  assert.equal(ymd(byName(ev, '初七日').date), '2026-10-26');
  assert.equal(ymd(byName(ev, '七七日（四十九日）').date), '2026-12-07');
  assert.equal(ymd(byName(ev, '百箇日').date), '2027-01-27');
  assert.equal(ymd(byName(ev, '一周忌').date), '2027-10-20');
  assert.equal(ymd(byName(ev, '三回忌').date), '2028-10-20');
  assert.equal(ymd(byName(ev, '五十回忌').date), '2075-10-20');
  assert.equal(byName(ev, '一周忌').title, '山田太郎の一周忌');
});

test('お名前が空なら「故人」', () => {
  const ev = L.calculateHoyo(L.parseDateInput('2026-10-20'), '');
  assert.equal(ev[0].title, '故人の初七日');
});

test('2月29日に亡くなった場合、うるう年でない年は2月28日', () => {
  const ev = L.calculateHoyo(L.parseDateInput('2024-02-29'), '');
  assert.equal(ymd(byName(ev, '一周忌').date), '2025-02-28');
  assert.match(byName(ev, '一周忌').note, /2月28日としています/);
  // 七回忌（2030年）は平年、十三回忌（2036年）はうるう年
  assert.equal(ymd(byName(ev, '十三回忌').date), '2036-02-29');
  assert.doesNotMatch(byName(ev, '十三回忌').note, /2月28日としています/);
});

test('十王の名前（秦広王）', () => {
  assert.match(L.HOYO_DEFS[0].note, /秦広王/);
  assert.doesNotMatch(JSON.stringify(L.HOYO_DEFS), /泰広王/);
});

test('UID は人ごと・法要ごとに別で、1件ずつと一括で同じ', () => {
  const death = L.parseDateInput('2025-10-20');
  const a = L.calculateHoyo(death, '山田太郎');
  const b = L.calculateHoyo(death, '山田花子');
  const uidA = L.uidFor(a[8], death, '山田太郎');
  assert.notEqual(uidA, L.uidFor(b[8], death, '山田花子'));
  assert.notEqual(uidA, L.uidFor(a[9], death, '山田太郎'));
  const info = { name: '山田太郎', kaimyo: '', customNote: '', deathDate: death };
  const now = new Date(Date.UTC(2026, 9, 20));
  const single = L.buildICS([a[8]], info, now);
  const all = L.buildICS(a, info, now);
  assert.ok(single.includes(`UID:${uidA}`));
  assert.ok(all.includes(`UID:${uidA}`));
});

test('ICS の特殊文字エスケープ', () => {
  assert.equal(L.escapeICSText('a,b;c\\d\r\ne'), 'a\\,b\\;c\\\\d\\ne');
});

test('ICS の行は75バイト以内で折り返す（日本語を途中で切らない）', () => {
  const death = L.parseDateInput('2026-10-20');
  const ev = L.calculateHoyo(death, '山田太郎');
  const info = { name: '山田太郎', kaimyo: '〇〇院釋〇〇', customNote: 'お寺の電話番号, 連絡事項; など'.repeat(5), deathDate: death };
  const ics = L.buildICS(ev, info, new Date());
  const lines = ics.split('\r\n');
  for (const line of lines) {
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `75バイトを超えています: ${line}`);
    assert.doesNotMatch(line, /�/);
  }
  // 折り返しを戻すと元の DESCRIPTION になる
  const unfolded = ics.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('戒名・法名: 〇〇院釋〇〇'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});

test('メモ欄に戒名・メモ・サイトURLが入る', () => {
  const ev = L.calculateHoyo(L.parseDateInput('2026-10-20'), '');
  const desc = L.buildDescription(ev[0], { kaimyo: '釋〇〇', customNote: '連絡事項' });
  assert.match(desc, /戒名・法名: 釋〇〇/);
  assert.match(desc, /-- メモ --\n連絡事項/);
  assert.ok(desc.includes(L.SITE_URL));
});

test('Googleカレンダーの URL（終日予定）', () => {
  const ev = L.calculateHoyo(L.parseDateInput('2026-10-20'), '');
  const url = new URL(L.getGoogleCalendarUrl(ev[0], { kaimyo: '', customNote: '' }));
  assert.equal(url.searchParams.get('dates'), '20261026/20261027');
  assert.equal(url.searchParams.get('text'), '故人の初七日');
});

test('端末の判定（iPad は Mac を名乗ってもタッチ操作で見分ける）', () => {
  const ipadUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  assert.equal(L.detectEnv(ipadUA, 5).isIOS, true);
  assert.equal(L.detectEnv(ipadUA, 0).isIOS, false);
  const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1';
  assert.equal(L.detectEnv(iphoneUA, 5).isIOS, true);
  assert.equal(L.detectEnv(iphoneUA + ' Line/14.0.0', 5).isInAppBrowser, true);
  assert.equal(L.detectEnv(iphoneUA, 5).isInAppBrowser, false);
});
