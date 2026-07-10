"""
ガイド動画用ナレーション自動生成（edge-tts）

使い方:
  pip install -r requirements-narration.txt
  python generate_narration.py              # 全章
  python generate_narration.py checklist    # 1章だけ

出力:
  ../videos/audio/{id}-narration.mp3
  ../videos/audio/{id}-narration.vtt

音声の種類を変える: narration/*.json の "voice" を編集
  例: ja-JP-NanamiNeural（女性）, ja-JP-KeitaNeural（男性）
一覧: edge-tts --list-voices
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

SCRIPT_DIR = Path(__file__).resolve().parent
NARRATION_DIR = SCRIPT_DIR / "narration"
OUTPUT_DIR = SCRIPT_DIR.parent / "videos" / "audio"


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def probe_duration_seconds(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return max(0.1, float(out))


def segments_to_vtt(segments: list[dict], total_sec: float) -> str:
    """各セグメントを文字数比例でタイムコード付き VTT にする。"""
    texts = [str(s.get("text", "")).strip() for s in segments if str(s.get("text", "")).strip()]
    if not texts:
        return "WEBVTT\n\n"
    weights = [max(len(t), 1) for t in texts]
    weight_sum = sum(weights)
    lines = ["WEBVTT", ""]
    cursor = 0.0
    for i, text in enumerate(texts):
        span = total_sec * (weights[i] / weight_sum)
        start = cursor
        end = total_sec if i == len(texts) - 1 else min(total_sec, cursor + span)
        cursor = end
        lines.append(f"{fmt_ts(start)} --> {fmt_ts(end)}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def load_config(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build_narration_text(data: dict) -> str:
    segments = data.get("segments") or []
    parts: list[str] = []
    for seg in segments:
        t = str(seg.get("text", "")).strip()
        if not t:
            continue
        t = re.sub(r"[。．、]+$", "", t)
        parts.append(t)
    if not parts:
        raise ValueError(f"segments が空です: {path_label(data)}")
    return "。".join(parts) + "。"


def path_label(data: dict) -> str:
    return str(data.get("id") or data.get("title") or "unknown")


async def generate_one(config_path: Path) -> None:
    data = load_config(config_path)
    vid = path_label(data)
    voice = str(data.get("voice") or "ja-JP-NanamiNeural")
    rate = str(data.get("rate") or "-5%")
    segments = data.get("segments") or []
    text = build_narration_text(data)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    mp3_path = OUTPUT_DIR / f"{vid}-narration.mp3"
    vtt_path = OUTPUT_DIR / f"{vid}-narration.vtt"

    print(f"Generating: {vid} ({voice}, {rate})", flush=True)
    communicate = edge_tts.Communicate(text, voice, rate=rate)

    with open(mp3_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])

    duration = probe_duration_seconds(mp3_path)
    vtt_path.write_text(segments_to_vtt(segments, duration), encoding="utf-8")
    print(f"  duration: {duration:.1f}s", flush=True)
    print(f"  -> {mp3_path.name}", flush=True)
    print(f"  -> {vtt_path.name}", flush=True)


def list_targets(arg: str | None) -> list[Path]:
    if arg:
        p = NARRATION_DIR / f"{arg}.json"
        if not p.exists():
            p = NARRATION_DIR / arg
        if not p.exists():
            raise SystemExit(f"Not found: {arg} (looked in {NARRATION_DIR})")
        return [p]
    return sorted(NARRATION_DIR.glob("*.json"))


async def main() -> int:
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    targets = list_targets(arg)
    if not targets:
        print("narration/*.json がありません。", flush=True)
        return 1
    for path in targets:
        await generate_one(path)
    print("Done.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
