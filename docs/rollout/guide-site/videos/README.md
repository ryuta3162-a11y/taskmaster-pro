# 解説動画ファイル（MP4）

ここに収録した動画を置きます。YouTube は不要です。

## ファイル名の例

| ファイル | 対応する章 |
|----------|------------|
| `overview.mp4` | はじめに |
| `register.mp4` | 初回登録 |
| `checklist.mp4` | リストチェック |
| `request.mp4` | 新規投稿 |
| `repost.mp4` | 再投稿 |
| `scheduled.mp4` | 定期配信 |
| `progress.mp4` | チーム進捗 |
| `admin.mp4` | 進捗管理admin |

## 設定

`../guide-config.js` でパスを指定:

```js
checklist: {
  mp4: 'videos/checklist.mp4',
  poster: 'videos/checklist-poster.jpg', // 任意（サムネイル）
},
```

## 推奨仕様

- 形式: **MP4（H.264 + AAC）**
- 解像度: 1920×1080 または 1280×720
- 1ファイル目安: 50〜150MB（章ごと2〜4分）

## 動作確認だけ（本番動画がまだない場合）

`guide-config.js` の `useDemoWhenEmpty: true` のままだと、  
MP4 未設定の章に **サンプル動画** が表示され、再生ボタンで再生できます。

本番公開前に:

1. 実際の MP4 をこのフォルダに置く  
2. 各章の `mp4` を設定  
3. `useDemoWhenEmpty: false` に変更  

## Vercel

`videos/` フォルダごとデプロイされます。Git に MP4 をコミットするか、Vercel に直接アップロードしてください。

※ 動画が大きい場合は Git LFS または Vercel のストレージ制限に注意してください。
