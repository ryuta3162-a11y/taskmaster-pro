# チーム進捗ビュー（閲覧専用）URL一覧

利用者 To-Do と **同じ Web アプリ** の URL 末尾だけ変えます。  
`{BASE}` = 本番の exec URL（例: `https://script.google.com/a/macros/okamoto-group.co.jp/s/XXXX/exec`）

## 全チーム（MT・横断確認用）

```
{BASE}?page=progress
```

## チーム別（リーダー配布用）

| チーム | URL |
|--------|-----|
| 全チーム | `{BASE}?page=progress` |
| QSC＆監査 | `{BASE}?page=progress&team=QSC%26監査` |
| 原価低減 JOYFIT | `{BASE}?page=progress&team=原価低減%20JOYFIT` |
| 原価低減 FIT365 | `{BASE}?page=progress&team=原価低減%20FIT365` |
| 販促 | `{BASE}?page=progress&team=販促` |
| DX | `{BASE}?page=progress&team=DX` |
| PT | `{BASE}?page=progress&team=PT` |
| オプション | `{BASE}?page=progress&team=オプション` |
| CS・ES | `{BASE}?page=progress&team=CS%E3%83%BCES` |
| 競合対策 | `{BASE}?page=progress&team=競合対策` |
| スタジオPG | `{BASE}?page=progress&team=スタジオPG` |
| リテンション | `{BASE}?page=progress&team=リテンション` |
| オープン・リニューアル | `{BASE}?page=progress&team=オープン%E3%83%BBリニューアル` |
| リスクアセスメント | `{BASE}?page=progress&team=リスクアセスメント` |
| ヨガ＆ピラティスチーム | `{BASE}?page=progress&team=ヨガ%26ピラティスチーム` |

※ 画面上の **「チーム別ブックマークURL」** を開くと、デプロイ済みの正しい URL がコピーできます（手計算不要）。

## GAS 反映

1. `docs/gas/Code.gs` を貼り直し  
2. `docs/gas/progress.html` を貼り直し  
3. Web アプリを **新バージョン** でデプロイ  

## 権限（任意）

スクリプトプロパティ `TEAM_PROGRESS_ACCESS`（JSON）でチームごとの閲覧者を指定。  
`ADMIN_DASHBOARD_EMAILS` に入っている人は全チーム閲覧可。
