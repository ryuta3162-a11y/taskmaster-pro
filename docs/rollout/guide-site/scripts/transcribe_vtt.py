"""Transcribe guide-site MP4 files to WebVTT using faster-whisper."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from faster_whisper import WhisperModel

VIDEOS_DIR = Path(__file__).resolve().parents[1] / "videos"
FILES = [
    "register.mp4",
    "checklist.mp4",
    "request.mp4",
    "repost.mp4",
    "scheduled.mp4",
]


def fmt_ts(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # Drop obvious filler / noise fragments
    if len(text) <= 1:
        return ""
    return text


def segments_to_vtt(segments) -> str:
    lines = ["WEBVTT", ""]
    for seg in segments:
        text = clean_text(seg.text)
        if not text:
            continue
        start = max(0.0, seg.start)
        end = max(start + 0.4, seg.end)
        lines.append(f"{fmt_ts(start)} --> {fmt_ts(end)}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    print("Loading whisper model (small)...", flush=True)
    model = WhisperModel("small", device="cpu", compute_type="int8")

    for name in FILES:
        mp4 = VIDEOS_DIR / name
        vtt = VIDEOS_DIR / name.replace(".mp4", ".vtt")
        if not mp4.exists():
            print(f"SKIP missing: {mp4}", flush=True)
            continue

        print(f"Transcribing {name}...", flush=True)
        segments, info = model.transcribe(
            str(mp4),
            language="ja",
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 400},
        )
        seg_list = list(segments)
        vtt_content = segments_to_vtt(seg_list)
        vtt.write_text(vtt_content, encoding="utf-8")
        print(f"  -> {vtt.name} ({len(seg_list)} segments, lang={info.language})", flush=True)

    print("Done.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
