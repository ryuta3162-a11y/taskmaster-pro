# GAS 3ファイル同期チェックリスト（INDEX / Code.gs / admin）

利用者アプリ・管理画面・サーバーは **別ファイル** だが **1つの GAS プロジェクト・1つの Webアプリデプロイ** で動く。  
フロントの変更だけ・GAS だけ・片方だけ更新すると不整合が起きる。

## 役割と正本（ソース・オブ・トゥルース）

| GAS 上のファイル | リポジトリの正本 | ビルド要否 | 主な役割 |
|------------------|------------------|------------|----------|
| **index** | `src/App.jsx` ほか → `npm run build:gas` → `docs/gas/deployed/index.html` | **要**（Vite 1枚HTML） | 利用者 UI・リストチェック |
| **Code.gs** | `docs/gas/Code.gs`（`deployed/Code.gs` と同一に保つ） | 不要 | API・スプレッドシート・メール |
| **admin** | `docs/gas/admin.html`（`deployed/admin.html` と同一に保つ） | 不要 | 管理ダッシュボード `?page=admin` |

## 現在のリポジトリ内の整合

| ペア | 状態 |
|------|------|
| `docs/gas/Code.gs` ↔ `docs/gas/deployed/Code.gs` | **一致** |
| `docs/gas/admin.html` ↔ `docs/gas/deployed/admin.html` | **一致** |
| `src/App.jsx` ↔ `docs/gas/deployed/index.html` | **`npm run build` / `build:gas` 後に一致**（約 369KB・`completeTaskStoresBulk` 含む） |

### index が古いときの目安（貼り付け前に検索）

`docs/gas/deployed/index.html` 内に **無い** 文字列があると、`App.jsx` より古いビルドです。

- `completeTaskStoresBulk`（一括完了 API）
- `完了しました`（トースト）
- `選択した店舗の未実施タスクはありません（他店舗が未完了`（店舗絞り込み文言）

**ある** のに挙動がおかしい場合は、GAS 本番の `Code.gs` に `completeTaskStoresBulk` があるか確認。

## フロント ↔ GAS API 対応表（index が呼ぶもの）

| フロント（App.jsx） | Code.gs 関数 | 備考 |
|---------------------|--------------|------|
| `fetchTasksForUser` | `getTasksForUser` | `targetStoreNames` / `storeCompletions` 付き |
| `fetchAppDataForUser` | `getAppDataForUser` | 初回表示用（tasks + sent + scheduled を1往復） |
| `completeTask` | `completeTask` | 店舗1件完了 |
| `completeTaskStoresBulk` | `completeTaskStoresBulk` | **一括完了（必須ペア）** |
| `uncompleteTask` | `uncompleteTask` | 第3引数 `storeName` で店舗取り消し |
| `registerEmployee` | `registerEmployee` | 管轄店舗最大 **50**（`EMPLOYEE_STORE_COL_MAX`） |
| 管理画面 | `getAdminDashboardData` / `sendAdminTaskReminder` | admin.html のみ |

チェックリストの未実施/実施済み・店舗チップは **index 側だけの表示ロジック**（Code.gs 変更不要）。

## デプロイ手順（3点セット）

1. **index** … `npm run build:gas` または GitHub Actions「Build GAS index」→ `docs/gas/deployed/index.html` を GAS の `index` に丸ごと貼付け  
2. **Code.gs** … `docs/gas/Code.gs` を丸ごと貼付け  
3. **admin** … 管理 UI を変えたときだけ `docs/gas/admin.html` を `admin` に貼付け  

最後に **デプロイ → 新バージョン**（index / Code / admin のどれか1つでも変えたら再デプロイ）。

## よくあるズレ

| 症状 | 原因の例 |
|------|----------|
| 一括完了が遅い・失敗 | 本番 index が古く `completeTaskStoresBulk` 未使用 |
| 完了しても未実施に残る | 古い index（`task.completed` 基準のまま） |
| 麻布で絞ると空なのにバッジ 1 | 古い index（店舗チップ件数ロジック未反映） |
| 管理画面だけエラー | `Code.gs` 未更新 or `ADMIN_DASHBOARD_EMAILS` 未設定 |

## 運用ルール（推奨）

1. **App.jsx を直したら必ず index を再ビルド**して GAS に反映  
2. **`deployed/` の3ファイル**を「GAS に貼る直前の控え」として常に最新に  
3. **Code.gs / admin を変えたら** `docs/gas/` と `docs/gas/deployed/` を同時にコミット  
4. GitHub Actions 成功後は Artifact または `deployed/index.html` を本番へ  

## 本番がリポジトリより新しい場合

GAS エディタで index だけ手直ししていると、リポジトリの `deployed/index.html` が古くなる。  
→ GAS から index をダウンロードして `deployed/index.html` に上書き保存するか、Actions でビルドし直して上書きする。
