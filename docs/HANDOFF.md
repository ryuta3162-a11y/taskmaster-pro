# To Do List 引き継ぎメモ（2026年9月29日 時点）

別のパソコンで作業を再開するためのメモです。まずこのファイルを読んでから始めてください。

## 1. URL・ID 一覧

| 対象 | URL / ID |
|------|----------|
| To Do List 本番（利用者用） | https://script.google.com/a/okamoto-group.co.jp/macros/s/AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw/exec |
| リストチェック直リンク | 上のURL + `?page=checklist` |
| 本番 GAS スクリプトID | `1AALWbsGjHijGffBlvqLgTao5r6Z_ZOTI6Uf3BQq1ulfBKK_paFv7RgOS`（https://script.google.com/d/1AALWbsGjHijGffBlvqLgTao5r6Z_ZOTI6Uf3BQq1ulfBKK_paFv7RgOS/edit） |
| 本番デプロイID（固定・変更しない） | `AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw`（9/29 時点の最新バージョン **@139**） |
| To Do List データのスプレッドシート | https://docs.google.com/spreadsheets/d/1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc/edit |
| ヘルプセンター（マニュアル） | https://todo-list-guide.vercel.app/ |
| 理解度チェック | https://todo-list-guide.vercel.app/quiz |
| 理解度チェックの集計表（シート「テスト」） | https://docs.google.com/spreadsheets/d/1NvJrgfanwN8XMu9YQh5tFbrqDHxU7fuJYJteLzfKqbI/edit |
| 理解度チェックの採点 GAS（エンドポイント） | https://script.google.com/macros/s/AKfycbwiKoOOlJKon_2LRP7ppUVahIFfrzuhQt0aJ_1rIt7kBzbDcgBCtb5yqi56Ov0jtzieSA/exec |
| GitHub リポジトリ | `taskmaster-pro`（ブランチ `main`） |

メールはすべて `r-kusaka@okamoto-group.co.jp` から MailApp で送信されます。

## 2. ファイルの場所

| 内容 | 場所 |
|------|------|
| 本番 GAS のサーバー側コード（正本） | `docs/gas/Code.gs`, `SheetSetup.gs`, `DataCleanup.gs`, `NewOrgMigration.gs`, `NewOrgMigrationData.gs`, `AdminAnalytics.gs`, `RenameStoreIono.gs` |
| 本番 GAS の画面（正本） | `docs/gas/deployed/index.html`, `docs/gas/deployed/admin.html`, `docs/gas/progress.html` |
| clasp 作業フォルダ（Git 管理外） | `docs/rollout/gas-rollout-email/.clasp-workdir/`（`Code.gs` → `code.js`、他の `.gs` → `.js` にコピーして push） |
| ヘルプセンター | `docs/rollout/guide-site/`（詳しくは同フォルダの `README.md`） |
| 理解度チェック採点 GAS のコード | `docs/rollout/quiz-results-gas/Code.gs`（スプレッドシート側のスクリプト。clasp 管理外なので、変更時は Apps Script エディタに貼り付けてデプロイ） |

## 3. デプロイ手順

### 本番 GAS（To Do List）

別のパソコンで初めて作業するときは、先に clasp を準備します。

```powershell
npm i -g @google/clasp
clasp login   # r-kusaka@okamoto-group.co.jp でログイン
mkdir docs\rollout\gas-rollout-email\.clasp-workdir
cd docs\rollout\gas-rollout-email\.clasp-workdir
clasp clone 1AALWbsGjHijGffBlvqLgTao5r6Z_ZOTI6Uf3BQq1ulfBKK_paFv7RgOS
```

コードを直したら、次の順で反映します。

1. `docs/gas/*.gs` を作業フォルダへコピー（`Code.gs` は `code.js`、ほかは同名の `.js`）。HTML は `docs/gas/deployed/*.html` をコピー。
2. `node --check code.js` などで構文を確認。
3. `clasp push --force`
4. `clasp deploy -i AKfycbyUmHnVEEJbuntAayPBu5zEe_4iRVDjtq8LOHQ5pURXRgEQYpLX324-3SMxeX9_NllAuw -d "変更内容"`（**必ず同じデプロイIDに上書き**。新しいIDを作るとURLが変わる）
5. 確認：`clasp pull --versionNumber <番号>` を一時フォルダに取り、正本と一致するか比べる。

### ヘルプセンター（Vercel）

`main` に push すると自動で再デプロイされます（1〜2分）。CLI（`npx vercel --prod`）は権限エラーになるため使いません。

## 4. これまでにやったこと（9月の新組織対応）

- **新組織への移行（10/1 切り替え）**：店舗データ・従業員データを新組織に置き換え。旧シートは `_旧_日時` 付きで残してある。移行記録は `新組織移行ログ` シート。
- **重いシート整備を裏側のジョブへ**：ページ表示時に `scheduleSheetSetupIfNeeded_` → トリガー `runSheetSetupJob` で実行。結果は非表示シート `システムログ` に記録。
- **管轄店舗に合わせたエリア・テリトリーの自動補正**。
- **従業員データの自動並べ替え（v8）**：エリア → テリトリー → 役職 → 名前の順。E列（エリア）・F列（テリトリー）の表記もそろえる。背景色・文字色・太字・メモは行と一緒に移動。書き込みはロック付きで、並びが変わったときだけ行う。毎朝8時のバッチでも実行。
- **登録・プロフィール保存にロックを追加**：同時保存で行がずれないようにした。混雑時は「混み合っています…」と表示。
- **組織変更で担当外になった店舗依頼**を件数・進捗から除外。担当外店舗の本人完了分は取り消せる。
- **重複社員行・店舗アドレス（jf-）でのログイン記録を1回だけ整理**。店舗アドレスでのログインはブロック済み。
- **小林詩織さんの管轄38店舗**は本人入力のまま残す（確認済み）。
- **マニュアルを Q&A 形式のヘルプセンターに作り直し**（動画は廃止）。検索（言い換え・ひらがな対応）、質問ごとのリンクコピー、旧URL（`#gmail-label` など）の転送つき。
- **Gmail ラベルの正しいフィルタ**：`subject:"To-Do List"`（「受信トレイをスキップ」は付けない）。
- **理解度チェックを択一式（全6問）に変更**。最初にメールアドレスを「確認」し、集計表の名簿にある人だけ回答できる。

## 5. 残っている課題・今後やること

| 状況 | 内容 |
|------|------|
| 確認待ち | シート整備 **v7（不要シートの削除）・v8（従業員データの並べ替え）** がまだ走っていない可能性。誰かがアプリを開くか、朝8時のバッチで実行される。`システムログ` に「シート整備 v8」「従業員データの並べ替え」「不要シートの削除」が出ていれば完了。 |
| 入力待ち | **聖蹟桜ヶ丘・Well Be の店舗メールアドレス**が未入力（店舗データに記入する）。メールがなくても管轄店舗としては登録できる。 |
| 10月中旬 | `_旧_` 付きのバックアップシートを削除（1〜2週間様子を見てから）。 |
| 10月末まで | `新組織移行ログ` シートは残しておく。 |
| 必要なら | 理解度チェックを自分（r-kusaka）で試すときは、集計表「テスト」シートに名前・メールアドレスの行を追加する（名簿にない人は回答できない仕様）。 |
| 運用 | 管轄店舗を変えたい人は、本人がアプリで「ログアウト → メール入力 → ログイン情報を変更 → 変更を保存」。 |

## 6. 仕様メモ（よく聞かれること）

- **メール件名**：新規依頼・再投稿・リマインド＝「To-Do List」、訂正＝「【To-Do List】【訂正】…」、自動リマインド＝「【To-Do List】期限まであと2日です／明日が期限です／本日が期限です」、管理者リマインド＝「【To-Do List】〇〇チーム からのリマインド」、店舗共有＝「【To-Do List】期限までにご対応ください」。
- **修正・再投稿・リマインドの使い分け**：期限内の内容変更＝修正（完了記録は残る）、期限切れを同じ宛先へ＝再投稿、未完了者だけに催促＝リマインド。
- **店舗依頼**は担当者の誰か1人が完了にすると、その店舗は全員分完了になる。取り消せるのは自分の記録だけ。
