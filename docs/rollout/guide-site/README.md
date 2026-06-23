# To Do List 活用ガイド（紹介用 Web サイト）

テキスト説明＋**ページ内動画再生**（全画面対応）の専用サイトです。  
Vercel などにそのままデプロイできます。

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `index.html` | ページ本体 |
| `styles.css` | デザイン |
| `guide-config.js` | **動画URL・アプリURL・問い合わせ先（ここだけ編集）** |
| `guide.js` | 動画埋め込み・ナビ・全画面 |
| `vercel.json` | Vercel 設定 |

## 動画の設定

### 方式 A: サイト内 MP4（おすすめ・YouTube 不要）

1. 収録した動画を `videos/` に置く（例: `videos/checklist.mp4`）
2. `guide-config.js` の各章に `mp4: 'videos/checklist.mp4'` を指定
3. ページの **再生ボタン** をタップすると動画が流れ、**全画面** も使えます

本番動画がまだないときは `useDemoWhenEmpty: true` でサンプル再生を確認できます。

### 方式 B: YouTube（限定公開可）

1. YouTube にアップロード → **限定公開**
2. 動画ID をコピー（URL の `v=` の後ろ 11 文字）
3. 例:

```js
checklist: {
  title: 'リストチェック',
  youtube: 'xxxxxxxxxxx',  // 動画IDだけでもOK
  drive: '',
},
```

埋め込みは `rel=0` 付き iframe。**プレーヤー右下の全画面**も使えます。  
ページ上の「全画面」ボタンは iframe 全体を全画面表示します。

### Google Drive

1. 動画を Drive にアップロード
2. 共有を **「リンクを知っている全員」** に
3. ファイルID を `drive` に設定

```js
checklist: {
  drive: '1AbC...ファイルID...XyZ',
},
```

または preview URL 全体でも可: `https://drive.google.com/file/d/FILE_ID/preview`

## アプリURL・問い合わせ

```js
appUrl: 'https://script.google.com/.../exec',
checklistUrl: 'https://script.google.com/.../exec?page=checklist',
contactEmail: '担当者@okamoto-group.co.jp',
```

## Vercel へのデプロイ

### 方法 A: Vercel ダッシュボード

1. [vercel.com](https://vercel.com) で New Project
2. GitHub リポジトリ `taskmaster-pro` を接続
3. **Root Directory** を `docs/rollout/guide-site` に設定
4. Framework Preset: **Other**
5. Deploy

### 方法 B: CLI

```bash
cd docs/rollout/guide-site
npx vercel
```

本番: `npx vercel --prod`

## 動画が未設定のとき

「動画は準備中です」と表示されます。  
テキスト説明だけでも公開でき、動画は後から `guide-config.js` を更新して再デプロイするだけで反映されます。

## 社内共有の例

- 紹介メールに Vercel の URL を記載
- 動画は YouTube 限定公開 + このサイトに埋め込み（YouTube URL を社外に知られにくい運用も可）
- または Drive のみで社内 Google アカウント限定

## カスタムドメイン（任意）

Vercel の Project Settings → Domains で  
例: `todo-guide.okamoto-group.co.jp` を設定できます。
