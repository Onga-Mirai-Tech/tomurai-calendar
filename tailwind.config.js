// Tailwind CSS の設定。以前使っていた Play CDN（cdn.tailwindcss.com, v3 系）と同じ見た目になるよう、
// バージョンを 3.4.17 に固定している。
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        // 見出し用の明朝体（端末に入っているものを使う。外部フォントは読み込まない）
        mincho: ['"Hiragino Mincho ProN"', '"Yu Mincho"', '"YuMincho"', '"Noto Serif JP"', 'serif']
      }
    }
  },
  plugins: []
};
