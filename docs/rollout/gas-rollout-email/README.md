# To Do List 本番運用案内メール（GAS）

7月1日本番運用開始の案内を、**HTMLメールの Gmail 下書き**として自動作成するスクリプトです。

## ファイル

| ファイル | 内容 |
|----------|------|
| `TodoListRolloutMail.gs` | 本番運用案内メール（下書き作成） |
| `TodoListRegistrationReminderMail.gs` | 未登録者向け登録依頼メール（下書き / 送信） |

## 使い方（最短）

### 1. GAS に貼り付け

1. [Google Apps Script](https://script.google.com/) を開く（または To Do List 用スプレッドシート → **拡張機能** → **Apps Script**）
2. 新規プロジェクト（または既存プロジェクト）に `TodoListRolloutMail.gs` の内容を**すべて貼り付け**
3. 先頭の **`ROLLOUT_MAIL_CONFIG`** を必要に応じて編集
   - `registeredCount` … 登録人数（現在 **63**）
   - `launchDateLabel` … **7月1日**
   - `appUrl` / `guideUrl` … 本番URL

### 2. 下書きを作成

1. 関数 **`createTodoListRolloutDraft`** を選んで **実行**
2. 初回は Gmail へのアクセス許可を求められたら **許可**
3. Gmail の **下書き** に HTML メールが1件入る

### 3. 送信

1. Gmail → **下書き** を開く
2. **宛先** に送りたい方のメールアドレスを入れる  
   - 一斉送信: **Bcc** に全員を入れる（To は自分のアドレスでも可）
3. 内容を確認して **送信**

---

## 2つの作成モード

| 関数 | 用途 |
|------|------|
| `createTodoListRolloutDraft` | **下書き1件**（宛先空）。Bcc 一斉送信用 |
| `createTodoListRolloutDraftsFromSheet` | シートのメール列から **1人1下書き** |

### シートから一括下書きする場合

`ROLLOUT_SHEET_CONFIG` を編集してから `createTodoListRolloutDraftsFromSheet` を実行します。

```javascript
const ROLLOUT_SHEET_CONFIG = {
  sheetName: 'ユーザーマスタ',  // シート名
  emailColumn: 2,               // メールアドレスの列（A=1, B=2…）
  startRow: 2,                  // データ開始行（1行目がヘッダーなら 2）
};
```

---

## スプレッドシートにメニューを出す（任意）

Apps Script に以下も入れておくと、シートから実行できます。

```javascript
function onOpen() {
  onOpenTodoListRolloutMenu();
}
```

※ 既存の `onOpen` がある場合は、その中で `onOpenTodoListRolloutMenu()` を呼んでください。

---

## メールに含まれる内容

- 登録 **63名** へのお礼
- **7月1日** 本番運用開始
- **To Do List ログインURL**
- 未登録の方への登録依頼
- **使い方ガイド**（https://todo-list-guide.vercel.app/）
- 不具合・エラー時の連絡先（**DXチーム** / **日下 竜太**）

---

## 注意

- このスクリプトは **送信しません**。下書き作成のみです。
- 送信前に必ず **プレビューで表示崩れ** を確認してください。
- 一斉送信時は社内ポリシーに従い、**Bcc** 利用を推奨します。

---

## 未登録者向け — 登録依頼メール

`TodoListRegistrationReminderMail.gs` を同じ GAS プロジェクトに追加して使います。

### 手順

1. `TodoListRegistrationReminderMail.gs` を貼り付け
2. 既存の個別下書き（12件）があれば削除
3. **`createRegistrationReminderDraft`** を実行 → Gmail 下書き **1件**
4. 内容を確認して送信

### 宛先の構成

| 欄 | 内容 |
|----|------|
| **To** | 未登録者 12名 |
| **CC** | メンバー 4名（笠原・後藤・初谷・渡邊） |

### 関数

| 関数 | 用途 |
|------|------|
| `createRegistrationReminderDraft` | **下書き1件**（To + CC） |

### 注意

- このスクリプトは **送信しません**。下書き作成のみです。
