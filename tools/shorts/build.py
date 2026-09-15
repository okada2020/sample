#!/usr/bin/env python3
"""Build finished Shorts MP4s from the Higgsfield clips and narration.

Downloads the silent clips and the narration lines listed in clips.json,
then for each topic concatenates the clips, lays the narration over them,
burns in subtitles and writes one vertical 1080x1920 MP4.

    python3 build.py                 # build every topic
    python3 build.py kettle ketchup  # build only these
    python3 build.py --no-subs       # skip burned-in subtitles

Requires ffmpeg and ffprobe on PATH (brew install ffmpeg).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import textwrap
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
WORK = HERE / "work"
OUT = HERE / "out"

# Subtitle look. Sits above the Shorts UI so the caption is never covered.
SUBTITLE_STYLE = (
    "FontName=Arial,FontSize=16,Bold=1,"
    "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H99000000,"
    "BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=170,MarginL=60,MarginR=60"
)
WRAP_COLUMNS = 30


def run(cmd: list[str], cwd: Path | None = None) -> None:
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr[-4000:] + "\n")
        raise SystemExit(f"command failed: {' '.join(cmd[:3])} ...")


REQUIRED_FILTERS = (
    "scale", "crop", "setsar", "fps", "format", "concat",
    "tpad", "subtitles", "adelay", "aresample", "amix", "apad", "atrim", "asetpts",
)


def require_tools() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if subprocess.run(["which", tool], capture_output=True).returncode != 0:
            raise SystemExit(f"{tool} not found on PATH. Install it with: brew install ffmpeg")

    missing = [
        name for name in REQUIRED_FILTERS
        if subprocess.run(["ffmpeg", "-hide_banner", "-h", f"filter={name}"],
                          capture_output=True).returncode != 0
    ]
    if missing:
        raise SystemExit(
            "this ffmpeg build is missing required filters: " + ", ".join(missing)
            + "\nInstall a full build with: brew install ffmpeg"
        )


def download(base: str, name: str) -> Path:
    dest = ASSETS / name
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    ASSETS.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {name}")
    urllib.request.urlretrieve(base + name, dest)
    return dest


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def srt_timestamp(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(path: Path, cues: list[tuple[float, float, str]]) -> None:
    blocks = []
    for index, (start, end, text) in enumerate(cues, start=1):
        body = "\n".join(textwrap.wrap(text, WRAP_COLUMNS))
        blocks.append(f"{index}\n{srt_timestamp(start)} --> {srt_timestamp(end)}\n{body}\n")
    path.write_text("\n".join(blocks), encoding="utf-8")


def build_topic(topic: dict, base: str, defaults: dict, burn_subs: bool) -> Path:
    topic_id = topic["id"]
    print(f"\n[{topic_id}]")

    videos = [download(base, name) for name in topic["videos"]]
    audios = [download(base, line["audio"]) for line in topic["lines"]]

    gap = float(defaults.get("gap_seconds", 0.35))
    tail = float(defaults.get("tail_seconds", 0.6))

    # Lay the narration lines end to end with a short gap between them.
    starts: list[float] = []
    cursor = 0.0
    for audio in audios:
        starts.append(cursor)
        cursor += duration(audio) + gap
    total_audio = cursor - gap + tail

    video_total = sum(duration(v) for v in videos)
    # Hold the final frame if the narration outlasts the footage.
    pad = max(0.0, total_audio - video_total)

    work = WORK / topic_id
    work.mkdir(parents=True, exist_ok=True)

    cues = [
        (start, start + duration(audio), line["text"])
        for start, audio, line in zip(starts, audios, topic["lines"])
    ]
    write_srt(work / "subs.srt", cues)

    inputs: list[str] = []
    for path in videos + audios:
        inputs += ["-i", str(path)]

    filters: list[str] = []
    for index in range(len(videos)):
        filters.append(
            f"[{index}:v]scale=w=1080:h=1920:force_original_aspect_ratio=increase,"
            f"crop=w=1080:h=1920,setsar=sar=1,fps=fps=30,format=pix_fmts=yuv420p[v{index}]"
        )
    concat_inputs = "".join(f"[v{i}]" for i in range(len(videos)))
    filters.append(f"{concat_inputs}concat=n={len(videos)}:v=1:a=0[vcat]")

    stage = "vcat"
    if pad > 0.05:
        filters.append(f"[{stage}]tpad=stop_mode=clone:stop_duration={pad:.3f}[vpad]")
        stage = "vpad"
    if burn_subs:
        filters.append(
            f"[{stage}]subtitles=filename=subs.srt:force_style='{SUBTITLE_STYLE}'[vout]"
        )
        stage = "vout"
    else:
        filters.append(f"[{stage}]null[vout]")
        stage = "vout"

    for offset, start in enumerate(starts):
        stream = len(videos) + offset
        delay_ms = int(round(start * 1000))
        filters.append(
            f"[{stream}:a]adelay=delays={delay_ms}:all=1,aresample=osr=48000[a{offset}]"
        )
    mix_inputs = "".join(f"[a{i}]" for i in range(len(audios)))
    filters.append(
        f"{mix_inputs}amix=inputs={len(audios)}:normalize=0,"
        f"apad,atrim=start=0:end={total_audio:.3f},asetpts=expr=N/SR/TB[aout]"
    )

    OUT.mkdir(parents=True, exist_ok=True)
    output = OUT / f"{topic_id}.mp4"
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart", "-shortest",
        str(output),
    ]
    print(f"  encoding -> {output.name} ({total_audio:.1f}s)")
    run(cmd, cwd=work)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("topics", nargs="*", help="topic ids to build (default: all)")
    parser.add_argument("--no-subs", action="store_true", help="skip burned-in subtitles")
    parser.add_argument("--manifest", default=str(HERE / "clips.json"))
    args = parser.parse_args()

    require_tools()
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))

    wanted = set(args.topics)
    topics = [t for t in manifest["topics"] if not wanted or t["id"] in wanted]
    unknown = wanted - {t["id"] for t in manifest["topics"]}
    if unknown:
        raise SystemExit(f"unknown topic id(s): {', '.join(sorted(unknown))}")

    built = [
        build_topic(topic, manifest["cdn_base"], manifest.get("defaults", {}), not args.no_subs)
        for topic in topics
    ]

    print("\nbuilt:")
    for path in built:
        print(f"  {path}")


if __name__ == "__main__":
    main()
