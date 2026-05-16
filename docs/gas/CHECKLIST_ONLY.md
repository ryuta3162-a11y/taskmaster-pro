# リストチェック専用 URL

依頼の投稿・再投稿・定期配信を使わない方が、**リストチェックだけ**を開ける入口です。  
通常の To-Do アプリ（`index`）と**同じ Web アプリ・同じデプロイ**で、URL のクエリだけ変えます。

## ブックマーク用 URL

利用者アプリの URL が次の形のとき:

`https://script.google.com/macros/s/XXXX/exec`

リストチェック専用は:

`https://script.google.com/macros/s/XXXX/exec?page=checklist`

## 通常アプリとの違い

| 項目 | 通常 `.../exec` | 専用 `.../exec?page=checklist` |
|------|-----------------|--------------------------------|
| ホーム（新規投稿など） | 表示 | **非表示** |
| リストチェック | メニューから遷移 | **最初から表示・固定** |
| 戻る（ホームへ） | あり | **なし** |
| ログイン・登録 | 同じ | 同じ |

画面の中身（未実施／実施済み、社員依頼／店舗依頼、店舗フィルタ、完了操作）は従来のリストチェックと同じです。

## 補足: `?tab=checklist`

`.../exec?tab=checklist` でもリストチェック画面を開けますが、**ホームに戻れる**通常モードです。  
「依頼は使わない人向けに URL を分けたい」場合は **`?page=checklist`** を配布してください。

## GAS 側の作業（両方必要）

1. **`Code.gs`** … `docs/gas/Code.gs` を GAS に反映（`?page=checklist` のとき HTML に起動フラグを埋め込む）
2. **`index.html`** … React をビルドして GAS の `index` に貼り付け（Actions「Build GAS index」でも可）
3. **新バージョンで Web アプリを再デプロイ**

※ GAS の iframe 内ではブラウザの `?page=checklist` が React に届かないことがあるため、**`Code.gs` と `index.html` の両方**が必要です。

反映後、`?page=checklist` で開くとブラウザタブのタイトルが **「リストチェック」** になり、ホームの「新規投稿」などは出ません。

## 配布の例

- 店舗スタッフ向け案内: 「タスク確認はこのリンクから」→ `?page=checklist`
- 依頼担当者: 従来どおり `.../exec`（フル機能）
