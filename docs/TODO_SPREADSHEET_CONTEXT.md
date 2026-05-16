# TODO スプレッドシート側・現状メモ（コピペ用）

同僚や別端末で説明するときは、**下の「コピペ用ブロック」だけ貼る**か、**このファイルへの GitHub リンク**で十分なことが多いです。  
スプレッドシート本体の URL は共有範囲（会社内だけか等）に注意してください。

---

## 共有の仕方（目安）

| 相手 | おすすめ |
|------|-----------|
| 開発メンバー | このリポジトリ + 本ファイル。GAS は `docs/gas/Code.gs` などと差分比較。 |
| 運用だけの人 | 「スプレッドシート URL」を**閲覧権限で招待**し、必要なら **Web アプリのデプロイ URL** だけ別途渡す（スクリプトエディタは開かせない運用も可）。 |
| 自分用メモ | 下のブロックをメモ帳 / Notion にそのまま保存。 |

**含めない方がよいもの**: Chat Webhook の URL、API キー、個人メールの列データそのもの。

---

## コピペ用ブロック

```
【スプレッドシート（新 TODO 用・現状）】
URL: https://docs.google.com/spreadsheets/d/1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc/edit

【シート（最低限・3 つ】
- 従業員データ
- 定期配信データ
- 申請データ

【Web アプリ（利用者向け・デプロイ済み）】
https://script.google.com/a/macros/okamoto-group.co.jp/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec

【管理ダッシュボード】
上記 URL + ?page=admin

【GAS プロジェクト内ファイル（リポジトリ保管: docs/gas/deployed/）】
- index.html … 利用者向け（taskmaster-pro ビルド1枚・約330KB）
- Code.gs … サーバー処理
- admin.html … 管理ダッシュボード

【フロントのソース倉庫】
GitHub: taskmaster-pro（変更時は npm run build:gas または GAS から index をエクスポート）
```

---

## リポジトリとの対応（追記用）

- フロント開発: `src/App.jsx` ほか（Vite + React）。
- **GAS に今入っている実体（デスクトップから取り込み・3 ファイル別置き）**: `docs/gas/deployed/`  
  - `index.html` / `Code.gs` / `admin.html`（貼り付け用にそのままコピー可）
- ToDo 用の参照実装（開発テンプレ）: `docs/gas/Code.gs`・`docs/gas/admin.html`。
- 管理画面の手順説明: `docs/gas/ADMIN_DASHBOARD.md`。

※ `docs/gas/deployed/` の3ファイルは ToDo 用として揃済み（index はデスクトップの GAS 本番エクスポートを反映）。
