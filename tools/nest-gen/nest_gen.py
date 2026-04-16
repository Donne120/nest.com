#!/usr/bin/env python3
"""
nest-gen — One-click AI course generator for Nest.
Uses NVIDIA LLM + edge-tts + Remotion to build full 3-5 min lesson videos.

Usage:
  python nest_gen.py "AI For Everyday Life"
  python nest_gen.py "AI For Everyday Life" --modules 4 --lessons 4 --dry-run
"""

import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv
from tqdm import tqdm

# ── Load config ────────────────────────────────────────────────────────────
load_dotenv()

NVIDIA_API_KEY   = os.getenv("NVIDIA_API_KEY", "")
LLM_CALL_INTERVAL = float(os.getenv("LLM_CALL_INTERVAL", "3"))
EDGE_VOICE       = os.getenv("EDGE_VOICE", "en-US-JennyNeural")
NEST_API_URL     = os.getenv("NEST_API_URL", "http://localhost:8000")
NEST_TOKEN       = os.getenv("NEST_TOKEN", "")

FPS = 30

# Paths
HERE       = Path(__file__).parent
VIDEO_DIR  = HERE.parent.parent / "video"
PUBLIC_DIR = VIDEO_DIR / "public"
TEMP_DIR   = PUBLIC_DIR / "temp"
OUT_DIR    = HERE / "output"

HEADERS = {
    "Authorization": f"Bearer {NEST_TOKEN}",
    "Content-Type": "application/json",
}


# ── NVIDIA LLM (OpenAI-compatible) ─────────────────────────────────────────

CURRICULUM_PROMPT = """\
You are an expert curriculum designer for Nest, a professional online learning platform used in Africa.
Generate a complete course curriculum as valid JSON only — no markdown fences, no explanation, just JSON.

Course title: "{title}"
Target: {n_modules} modules, {n_lessons} lessons per module.

Teaching philosophy:
- Each lesson = one concept taught deeply and practically
- Videos are 3–5 minutes (180–300 seconds of audio narration)
- Structure per lesson: Hook (20s) → Core concept (120s) → Real example (60s) → Try it now (40s) → Recap (20s)
- 6–8 slides per lesson, each with 25–40 seconds of narration
- Narration must be conversational and engaging — like a brilliant friend explaining
- Bullets: max 4 per slide, short and punchy
- African context examples where relevant

Return ONLY this exact JSON:
{{
  "course_title": "...",
  "course_description": "...",
  "modules": [
    {{
      "title": "...",
      "description": "...",
      "order_index": 0,
      "lessons": [
        {{
          "title": "...",
          "order_index": 0,
          "slides": [
            {{
              "type": "title",
              "heading": "...",
              "subheading": "Module 1, Lesson 1",
              "narration": "..."
            }},
            {{
              "type": "content",
              "heading": "...",
              "bullets": ["...", "...", "..."],
              "narration": "..."
            }},
            {{
              "type": "example",
              "heading": "...",
              "bullets": ["...", "...", "..."],
              "narration": "..."
            }},
            {{
              "type": "summary",
              "heading": "Key Takeaways",
              "bullets": ["...", "...", "..."],
              "narration": "..."
            }}
          ]
        }}
      ]
    }}
  ]
}}
"""


def generate_curriculum(title: str, n_modules: int, n_lessons: int) -> dict:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )
    prompt = CURRICULUM_PROMPT.format(title=title, n_modules=n_modules, n_lessons=n_lessons)

    print("  Calling NVIDIA LLM (llama-3.3-70b)...")
    response = client.chat.completions.create(
        model="meta/llama-3.3-70b-instruct",
        messages=[
            {"role": "system", "content": "You are a curriculum design expert. Output only valid JSON, nothing else."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.7,
        max_tokens=12000,
    )
    text = response.choices[0].message.content.strip()
    return _parse_json(text)


def _parse_json(text: str) -> dict:
    text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text.strip(), flags=re.MULTILINE)
    return json.loads(text.strip())


# ── TTS: edge-tts (free Microsoft neural voices) ──────────────────────────

async def _tts_async(text: str, output_path: str, voice: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


def generate_tts(text: str, output_path: str, voice: str = EDGE_VOICE):
    asyncio.run(_tts_async(text, output_path, voice))


# ── Audio duration via ffprobe ─────────────────────────────────────────────

def get_audio_duration(path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 5.0  # fallback


# ── Build lesson: generate audio + compute frame timing ───────────────────

def build_lesson_props(
    lesson: dict,
    lesson_id: str,
    course_title: str,
    module_title: str,
    lesson_number: int,
) -> dict:
    """
    Generate audio for each slide, compute frame timings,
    and return the Remotion props dict.
    Audio files are saved to video/public/temp/{lesson_id}/.
    """
    audio_dir = TEMP_DIR / lesson_id
    audio_dir.mkdir(parents=True, exist_ok=True)

    slides_out = []
    current_frame = 0

    slides = lesson.get("slides", [])
    for i, slide in enumerate(tqdm(slides, desc="    Slides", leave=False, unit="slide")):
        narration = slide.get("narration", "").strip()
        if not narration:
            continue

        audio_filename = f"slide_{i:02d}.mp3"
        audio_path     = str(audio_dir / audio_filename)
        audio_key      = f"temp/{lesson_id}/{audio_filename}"

        # Generate TTS
        generate_tts(narration, audio_path)

        # Measure duration
        duration_sec    = get_audio_duration(audio_path)
        duration_frames = max(30, int(duration_sec * FPS) + 15)  # +15 frames buffer

        slides_out.append({
            "type":            slide.get("type", "content"),
            "heading":         slide.get("heading", ""),
            "subheading":      slide.get("subheading"),
            "bullets":         slide.get("bullets", [])[:4],
            "code":            slide.get("code"),
            "audio_key":       audio_key,
            "start_frame":     current_frame,
            "duration_frames": duration_frames,
        })

        current_frame += duration_frames

    total_frames = current_frame

    return {
        "course_title":   course_title,
        "module_title":   module_title,
        "lesson_title":   lesson["title"],
        "lesson_number":  lesson_number,
        "total_frames":   total_frames,
        "slides":         slides_out,
    }


# ── Remotion render ────────────────────────────────────────────────────────

def render_lesson(props: dict, output_path: str):
    props_file = TEMP_DIR / f"props_{uuid.uuid4().hex[:8]}.json"
    props_file.write_text(json.dumps(props))

    try:
        cmd = [
            "npx", "remotion", "render",
            "LessonVideo",
            str(Path(output_path).resolve()),
            f"--props={props_file}",
            "--gl=angle",
            "--log=error",
        ]
        print(f"    Rendering {props['total_frames']} frames ({props['total_frames'] // FPS}s)...")
        subprocess.run(cmd, cwd=str(VIDEO_DIR), check=True)
    finally:
        props_file.unlink(missing_ok=True)


# ── Nest API helpers ───────────────────────────────────────────────────────

def api_create_module(title: str, description: str, order_index: int) -> str:
    resp = requests.post(
        f"{NEST_API_URL}/api/modules",
        json={"title": title, "description": description, "order_index": order_index},
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def api_upload_video(file_path: str) -> str:
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{NEST_API_URL}/api/videos/upload/video",
            files={"file": (Path(file_path).name, f, "video/mp4")},
            headers={"Authorization": f"Bearer {NEST_TOKEN}"},
            timeout=300,
        )
    resp.raise_for_status()
    return resp.json()["url"]


def api_create_video(
    module_id: str, title: str, video_url: str,
    duration: int, order_index: int,
) -> str:
    resp = requests.post(
        f"{NEST_API_URL}/api/videos",
        json={
            "module_id":       module_id,
            "title":           title,
            "video_url":       video_url,
            "duration_seconds": duration,
            "order_index":     order_index,
            "description":     "",
        },
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json()["id"]


# ── Main orchestrator ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="nest-gen: auto-generate courses for Nest")
    parser.add_argument("title",        help='Course title, e.g. "AI For Everyday Life"')
    parser.add_argument("--modules",    type=int, default=4,  help="Number of modules (default: 4)")
    parser.add_argument("--lessons",    type=int, default=4,  help="Lessons per module (default: 4)")
    parser.add_argument("--voice",      default=EDGE_VOICE,   help="edge-tts voice")
    parser.add_argument("--dry-run",    action="store_true",  help="Generate curriculum only, skip video rendering")
    parser.add_argument("--no-upload",  action="store_true",  help="Render videos but skip Nest API upload")
    parser.add_argument("--output",     default=str(OUT_DIR), help="Output directory")
    args = parser.parse_args()

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n🎓 nest-gen")
    print(f"   Course : {args.title}")
    print(f"   Modules: {args.modules}  ·  Lessons/module: {args.lessons}")
    print(f"   Voice  : {args.voice}\n")

    # ── Step 1: Curriculum ────────────────────────────────────────────────
    curriculum_path = out_dir / "curriculum.json"
    if curriculum_path.exists():
        print("📋 Using cached curriculum.json")
        curriculum = json.loads(curriculum_path.read_text())
    else:
        print("📋 Generating curriculum...")
        curriculum = generate_curriculum(args.title, args.modules, args.lessons)
        curriculum_path.write_text(json.dumps(curriculum, indent=2))
        print(f"   ✓ {len(curriculum['modules'])} modules · {sum(len(m['lessons']) for m in curriculum['modules'])} total lessons")

    _print_outline(curriculum)

    if args.dry_run:
        print("\n✅ Dry run — curriculum saved. Use without --dry-run to render videos.")
        return

    if not NEST_TOKEN and not args.no_upload:
        print("\n⚠️  NEST_TOKEN not set — running with --no-upload")
        args.no_upload = True

    # ── Step 2: Build each lesson video ──────────────────────────────────
    lesson_counter = 0
    for m_idx, module in enumerate(curriculum["modules"]):
        print(f"\n📦 Module {m_idx + 1}/{len(curriculum['modules'])}: {module['title']}")

        module_id = None
        if not args.no_upload:
            module_id = api_create_module(
                title=module["title"],
                description=module.get("description", ""),
                order_index=m_idx,
            )
            print(f"   Created module on Nest: {module_id}")

        for l_idx, lesson in enumerate(module["lessons"]):
            lesson_counter += 1
            lesson_id = f"lesson_{lesson_counter:03d}"
            print(f"\n  🎬 Lesson {l_idx + 1}: {lesson['title']}")

            # Generate audio + compute frame timings
            props = build_lesson_props(
                lesson=lesson,
                lesson_id=lesson_id,
                course_title=curriculum["course_title"],
                module_title=module["title"],
                lesson_number=lesson_counter,
            )

            duration_sec = props["total_frames"] // FPS
            print(f"    Duration: ~{duration_sec // 60}m {duration_sec % 60}s  ({len(props['slides'])} slides)")

            # Render video
            video_path = out_dir / f"{lesson_id}.mp4"
            render_lesson(props, str(video_path))
            print(f"    ✓ Rendered → {video_path.name}")

            # Upload + create record
            if not args.no_upload and module_id:
                print(f"    Uploading...")
                video_url = api_upload_video(str(video_path))
                api_create_video(
                    module_id=module_id,
                    title=lesson["title"],
                    video_url=video_url,
                    duration=duration_sec,
                    order_index=l_idx,
                )
                print(f"    ✓ Live on Nest")

            # Cleanup temp audio for this lesson
            lesson_temp = TEMP_DIR / lesson_id
            if lesson_temp.exists():
                shutil.rmtree(lesson_temp)

            # Rate limit between lessons
            if LLM_CALL_INTERVAL > 0:
                time.sleep(0.5)

    print(f"\n✅ Done! Course '{curriculum['course_title']}' — {lesson_counter} videos generated.")
    if args.no_upload:
        print(f"   Videos saved to: {out_dir}")


def _print_outline(curriculum: dict):
    print(f"\n{'─' * 58}")
    print(f"  {curriculum['course_title']}")
    print(f"{'─' * 58}")
    for m in curriculum["modules"]:
        print(f"  Module: {m['title']}")
        for l in m["lessons"]:
            n = len(l.get("slides", []))
            print(f"    └─ {l['title']}  ({n} slides)")
    print()


if __name__ == "__main__":
    main()
