# ToDo 用 GAS index.html をビルドして docs/gas/deployed/ にコピーします
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "プロジェクト: $root" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Node.js が見つかりません。" -ForegroundColor Red
    Write-Host "1. https://nodejs.org/ から LTS をインストール" -ForegroundColor Yellow
    Write-Host "2. Cursor / PowerShell を一度閉じて開き直す" -ForegroundColor Yellow
    Write-Host "3. もう一度このスクリプトを実行" -ForegroundColor Yellow
    exit 1
}

Write-Host "Node: $(node -v)  npm: $(npm -v)" -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
    Write-Host "初回: npm install を実行します..." -ForegroundColor Cyan
    npm install
}

Write-Host "ビルド中..." -ForegroundColor Cyan
npm run build

$src = Join-Path $root "dist\index.html"
$dst = Join-Path $root "docs\gas\deployed\index.html"
if (-not (Test-Path $src)) {
    Write-Host "dist\index.html ができませんでした。" -ForegroundColor Red
    exit 1
}

Copy-Item -Force $src $dst
$size = (Get-Item $dst).Length
Write-Host ""
Write-Host "完了: docs\gas\deployed\index.html ($size bytes)" -ForegroundColor Green
if (Select-String -Path $dst -Pattern "配信するチーム" -Quiet) {
    Write-Host "チーム機能の文字列を確認しました。" -ForegroundColor Green
} else {
    Write-Host "注意: 「配信するチーム」が見つかりません。App.jsx の変更が含まれているか確認してください。" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "次: GAS エディタの index を開き、このファイルの中身をすべてコピーして貼り付け → 新バージョンでデプロイ" -ForegroundColor Cyan
