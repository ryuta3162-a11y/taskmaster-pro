# 理解度チェック Vol.2 採点 GAS

- 名簿と保存先: スプレッドシート `1NvJrgfanwN8XMu9YQh5tFbrqDHxU7fuJYJteLzfKqbI` の「Vol.2」シート（A=名前, B=メール）。結果は同じ行の C 列以降（1〜10問目・合格/不合格・最終回答日時）に書く。見出しは初回送信時に自動で付く。名簿にない社内アドレス（@okamoto-group.co.jp）は名前空欄で末尾に追加。`?action=ping` で名簿の人数を確認できる
- ページ: https://todo-list-guide.vercel.app/quiz2 （`docs/rollout/guide-site/quiz2.html` / `quiz2.js`）
- 正解は `Code.js` の `QUIZ2_CONFIG.correctAnswers`（`quiz2.js` の問題順と一致させる）
- デプロイ: このフォルダで `clasp push -f` → `clasp deploy -i AKfycbwMrT4gtAl7snuPExS-2KNwBrnB5NetHhIIy64E21Gl2UC03bOAcijr64HHAQevh8M-4A`
