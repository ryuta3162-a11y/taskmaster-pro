# GAS に入れる ToDo 用ファイル（3 つ別置き）

| ファイル | 内容 | 更新元 |
|----------|------|--------|
| `Code.gs` | ToDo バックエンド | `docs/gas/Code.gs` と同期済み |
| `admin.html` | 管理ダッシュボード | `docs/gas/admin.html` と同期済み |
| `index.html` | 利用者向け Web アプリ（ビルド1枚・約330KB） | GAS 本番エクスポート済み |

## index.html を更新する手順

### A. 社用PCで Node が入れられない場合（推奨）

1. 変更を GitHub に push する  
2. GitHub の **Actions** → **Build GAS index** → **Run workflow**  
3. 完了後 **Artifacts** の `gas-index-html` から `index.html` をダウンロード  
4. GAS の `index` に丸ごと貼り付け → 新バージョンでデプロイ  

※ 社用PCに Node のインストールは不要です。

### B. Node が使える PC がある場合

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-gas.ps1
```

ビルド後、`index.html` の先頭付近に `<title>taskmaster-pro</title>` があり、ファイルサイズが **数百 KB 程度**になっていれば OK です。

## GAS への貼り付け

各ファイルを開き、中身をすべて選択 → 削除 → このフォルダの同名ファイルを丸ごと貼り付け → 保存 → Web アプリを新バージョンで再デプロイ。
