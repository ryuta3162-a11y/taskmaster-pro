# テストラン案内メール（GAS）

## 使い方

1. ToDo 用スプレッドシート → **拡張機能** → **Apps Script**
2. `MeetInvitationMail.gs` を新規ファイルに**丸ごと貼り付け**
3. ファイル先頭の **`INVITE_CONFIG`** を編集（日程・Meet URL。枠が減れば `slots` の行を削除）
4. **`createMeetInvitationDraft`** を実行 → Gmail の**下書き**に HTML メールができる
5. 宛先を入れて送信

## ボタンの動き

各日程の **「参加する」** → その回の **Google Meet** が開きます（シンプル版）。

## 日程を教えてもらえれば

`INVITE_CONFIG` の `label` と `meetUrl` をこちらで埋め込んだ版に差し替えできます。
