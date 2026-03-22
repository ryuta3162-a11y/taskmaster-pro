# 定期配信：初回の今月分タスク（GAS 側）

フロントから `registerScheduledTask` に **`skipInitialTask`**（boolean）が送られます。

- **`skipInitialTask === false`（デフォルト）**  
  定期配信データを保存したあと、**今月分の初回タスクを 1 回だけ** `申請データ`（または既存の `createNewTask` と同じシート）に追加し、メール・Chat 通知も通常タスクと同様に行ってください。
- **`skipInitialTask === true`**  
  定期配信データの保存のみ。初回の今月分は作りません（翌月以降の `processScheduledTasksBatch` のみ）。

## 期限（deadline）の計算

`deadlineOffset` はフロントと同じ形式です（`月末` または `1日`〜`31日`）。

- **月末** … 今月の最終日を期限日とする。
- **N日** … 今月の N 日を期限とする。ただし **今日の日付がすでに N 日より後**なら、**翌月の N 日**を期限とする（当月に有効な期限が残っていないため）。

※ `processScheduledTasksBatch` 内の期限計算と揃えると運用が分かりやすいです。

## タスク種別

初回行の `type` は既存の「定期タスク」と区別できるよう、例: **`定期タスク（初回）`** などにすると一覧で判別しやすいです。

## 疑似コード（イメージ）

```javascript
function registerScheduledTask(data) {
  // 1. 既存どおり 定期配信データ に行追加
  // ...

  if (data.skipInitialTask === true) {
    return { status: 'success' };
  }

  var deadlineStr = computeInitialDeadlineThisCycle_(data.deadlineOffset); // 上記ルール
  createNewTask_({
    type: '定期タスク（初回）',
    sender: data.sender,
    content: data.content,
    deadline: deadlineStr,
    urls: data.urls,
    targetTags: data.targetTags,
    targets: data.targets,
    images: data.images
  });
  return { status: 'success' };
}
```

`createNewTask_` は、既存の `createNewTask` と同じ列・通知処理を内部関数化したものを想定しています。

## 重複注意

同じ内容で何度も「登録」すると初回タスクが複数できるため、必要ならシート側で **定期配信ID と紐づけた初回済みフラグ** を持つなどの対策を検討してください。
