# 画面収録（無音）とナレーション MP3 を合成する
#
# 使い方:
#   .\merge_narration.ps1 overview
#   .\merge_narration.ps1 checklist -Screen checklist-screen.mp4
#
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Chapter,

  [string]$Screen = "",
  [string]$Output = ""
)

$ErrorActionPreference = "Stop"
$videosDir = Join-Path $PSScriptRoot ".." "videos"
$audioDir = Join-Path $videosDir "audio"

$screenFile = if ($Screen) { $Screen } else { "$Chapter-screen.mp4" }
$screenPath = Join-Path $videosDir $screenFile
$audioPath = Join-Path $audioDir "$Chapter-narration.mp3"
$outFile = if ($Output) { $Output } else { "$Chapter.mp4" }
$outPath = Join-Path $videosDir $outFile
$vttSrc = Join-Path $audioDir "$Chapter-narration.vtt"
$vttDst = Join-Path $videosDir "$Chapter.vtt"

if (-not (Test-Path $screenPath)) {
  Write-Error "画面収録が見つかりません: $screenPath`n先に無音で $screenFile を videos/ に置いてください。"
}
if (-not (Test-Path $audioPath)) {
  Write-Error "ナレーションが見つかりません: $audioPath`n先に python generate_narration.py $Chapter を実行してください。"
}

Write-Host "合成中: $screenFile + $Chapter-narration.mp3 -> $outFile"

ffmpeg -y -i $screenPath -i $audioPath `
  -c:v copy -c:a aac -b:a 192k `
  -map 0:v:0 -map 1:a:0 -shortest `
  $outPath

if (Test-Path $vttSrc) {
  Copy-Item -Force $vttSrc $vttDst
  Write-Host "字幕コピー: $Chapter.vtt"
}

$dur = ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outPath
Write-Host "完了: $outPath (${dur}s)"
