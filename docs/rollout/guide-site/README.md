# To Do List ヘルプセンター

Q&A 形式のマニュアルサイトです（https://todo-list-guide.vercel.app/）。  
`main` に push すると Vercel（Root Directory: `docs/rollout/guide-site`）が自動で再デプロイします。

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `index.html` | ヘルプセンター本体（カテゴリ別の Q&A） |
| `help.js` | 検索・リンクコピー・目次・旧URL（`#register` など）の転送 |
| `quiz.html` / `quiz.js` | 理解度チェック（全6問・択一式） |
| `styles.css` | デザイン |
| `guide-config.js` | **アプリURL・問い合わせ先・更新日（ここだけ編集）** |
| `vercel.json` | Vercel 設定（`/quiz` で `quiz.html` を表示） |

`videos/` `audio/` `images/` `scripts/` は旧動画版の素材で、現在のサイトからは使っていません。

## Q&A を追加・修正する

`index.html` の該当カテゴリ（`<section class="cat">`）に `details.qa` を追加します。

```html
<details class="qa" id="q-英数字の識別子" data-keywords="検索に使う言い換え 例 ひらがな読み">
  <summary>質問文（利用者が困っている言葉で書く）</summary>
  <div class="answer">
    <p>結論を1行目に書く。</p>
    <ol class="steps"><li>手順…</li></ol>
  </div>
</details>
```

- `id` は `https://todo-list-guide.vercel.app/#q-…` の直リンクになります。変更しないでください。
- 検索は質問文 → `data-keywords` → 回答本文の順に重み付けされます。利用者が使いそうな言い換えを `data-keywords` に入れてください。
- カテゴリの件数表示は自動で更新されます。

## 理解度チェック

採点は別 GAS（`docs/rollout/quiz-results-gas/Code.gs`）で行います。  
問題と選択肢は `quiz.js` の `QUESTIONS`、正解は GAS 側の `correctAnswers` です。問題を変えるときは両方をそろえてください。
