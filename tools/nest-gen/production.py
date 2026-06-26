"""
nest-gen v2 — Production Pipeline (Stage 4) — FULL REBUILD

Deterministic pipeline (no LLM calls):
  - TTS with per-slide prosody (rate + pitch by slide type)
  - Voice selected by visual theme
  - Contextual images via Stability AI (with placeholder fallback)
  - Thumbnail generation
  - Remotion composition JSON
  - Upload to Nest API (optional)
"""

import asyncio
import base64
import json
import os
import subprocess
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

from v2_schemas import (
    TTS_PROSODY, VOICE_BY_THEME,
    DEFAULT_PROSODY, DEFAULT_VOICE,
    IMAGE_SLIDE_TYPES, NO_IMAGE_TYPES,
)

load_dotenv()

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
NEST_API_URL = os.getenv("NEST_API_URL", "http://localhost:8000")
NEST_TOKEN = os.getenv("NEST_TOKEN", "")

HERE = Path(__file__).parent
OUTPUT_DIR = HERE / "output"
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

# Remotion serves files from video/public/ — TTS audio goes here so staticFile() can resolve it
VIDEO_PUBLIC_TEMP = HERE.parent.parent / "video" / "public" / "temp"
VIDEO_PUBLIC_TEMP.mkdir(exist_ok=True, parents=True)


def log(level: str, msg: str) -> None:
    sym = {"INFO": "ℹ", "PROD": "▶", "OK": "✓", "WARN": "⚠", "ERROR": "✗"}
    print(f"{sym.get(level, '·')} {msg}", flush=True)


# ═══════════════════════════════════════════════════════════════════════════
# TTS — edge-tts with per-slide prosody
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class TTSRequest:
    text: str
    voice: str
    rate: str   # e.g. "-10%"
    pitch: str  # e.g. "-2Hz"
    slide_index: int


async def generate_tts(req: TTSRequest) -> Optional[str]:
    try:
        import edge_tts

        filename = f"narration_{req.slide_index}_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = VIDEO_PUBLIC_TEMP / filename
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch,
        )
        await communicate.save(str(audio_path))
        log("OK", f"    TTS: {filename}  ({len(req.text.split())} words)")
        # Return relative path that Remotion's staticFile("temp/...") can resolve
        return f"temp/{filename}"
    except Exception as e:
        log("WARN", f"    TTS failed: {e}")
        return None


def get_tts_params(slide_type: str, theme: str) -> tuple:
    """Return (voice, rate, pitch) for a given slide type and visual theme."""
    voice = VOICE_BY_THEME.get(theme, DEFAULT_VOICE)
    rate, pitch = TTS_PROSODY.get(slide_type, DEFAULT_PROSODY)
    return voice, rate, pitch


# ═══════════════════════════════════════════════════════════════════════════
# IMAGES — Stability AI with placeholder fallback
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class SlideImageRequest:
    slide_type: str
    heading: str
    theme: str
    content_summary: str
    slide_index: int
    visual_hint: Optional[str] = None


def generate_placeholder_image(req: SlideImageRequest) -> Optional[str]:
    try:
        from PIL import Image

        bg_map = {
            "neural":     (10, 14, 39),
            "blueprint":  (0, 61, 130),
            "chalkboard": (27, 67, 50),
            "kinetic":    (255, 0, 110),
            "organic":    (82, 183, 136),
            "cinematic":  (42, 42, 42),
            "studio":     (248, 248, 248),
            "workshop":   (139, 90, 60),
        }
        bg = bg_map.get(req.theme, (30, 60, 90))
        img = Image.new("RGB", (1920, 1080), bg)
        filename = f"slide_{req.slide_index}_{uuid.uuid4().hex[:8]}.png"
        path = VIDEO_PUBLIC_TEMP / filename
        img.save(str(path))
        return f"temp/{filename}"
    except Exception as e:
        log("WARN", f"    Placeholder failed: {e}")
        return None


async def generate_slide_image(req: SlideImageRequest) -> Optional[str]:
    if req.slide_type in NO_IMAGE_TYPES:
        return None

    if not STABILITY_API_KEY:
        return generate_placeholder_image(req)

    prompt_text = (
        f"Professional educational slide visual. "
        f"Topic: {req.heading}. "
        f"Style: {req.theme}, clean, modern, no text, 16:9. "
        f"Context: {req.content_summary[:120]}"
    )

    try:
        response = requests.post(
            "https://api.stability.ai/v1/generation/"
            "stable-diffusion-xl-1024-v1-0/text-to-image",
            headers={
                "authorization": f"Bearer {STABILITY_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "text_prompts": [{"text": prompt_text, "weight": 1.0}],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30,
            },
            timeout=30,
        )
        if response.status_code == 200:
            artifacts = response.json().get("artifacts", [])
            if artifacts:
                filename = f"slide_{req.slide_index}_{uuid.uuid4().hex[:8]}.png"
                path = VIDEO_PUBLIC_TEMP / filename
                path.write_bytes(base64.b64decode(artifacts[0]["base64"]))
                log("OK", f"    Image: {filename}")
                return f"temp/{filename}"
        log("WARN", f"    Stability API {response.status_code} — using placeholder")
        return generate_placeholder_image(req)
    except Exception as e:
        log("WARN", f"    Image error: {e} — using placeholder")
        return generate_placeholder_image(req)


# ═══════════════════════════════════════════════════════════════════════════
# THUMBNAIL
# ═══════════════════════════════════════════════════════════════════════════

def generate_thumbnail(course_title: str, theme: str) -> Optional[str]:
    try:
        from PIL import Image, ImageDraw, ImageFont

        accent_map = {
            "neural":     ("#0a0e27", "#00ff88"),
            "blueprint":  ("#003d82", "#00d4ff"),
            "chalkboard": ("#1b4332", "#f1faee"),
            "kinetic":    ("#ff006e", "#ffbe0b"),
            "organic":    ("#52b788", "#1b4332"),
            "cinematic":  ("#2a2a2a", "#d4a574"),
            "studio":     ("#f8f8f8", "#ff0000"),
            "workshop":   ("#8b5a3c", "#d4a574"),
        }
        bg_hex, fg_hex = accent_map.get(theme, ("#111111", "#ffffff"))
        to_rgb = lambda h: tuple(int(h.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))

        img = Image.new("RGB", (1280, 720), color=to_rgb(bg_hex))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("arial.ttf", 72)
        except Exception:
            font = ImageFont.load_default()

        # Word-wrap title to ~30 chars per line
        words = course_title.split()
        lines, current = [], ""
        for word in words:
            test = (current + " " + word).strip()
            if len(test) > 30:
                lines.append(current)
                current = word
            else:
                current = test
        if current:
            lines.append(current)

        y = 720 // 2 - (len(lines) * 80) // 2
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            w = bbox[2] - bbox[0]
            draw.text(((1280 - w) // 2, y), line, fill=to_rgb(fg_hex), font=font)
            y += 90

        safe = course_title.replace(" ", "_").replace("/", "-")[:40]
        path = OUTPUT_DIR / f"thumbnail_{safe}.png"
        img.save(str(path))
        log("OK", f"  Thumbnail: {path.name}")
        return str(path)
    except Exception as e:
        log("WARN", f"  Thumbnail failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# REMOTION COMPOSITION
# ═══════════════════════════════════════════════════════════════════════════

def generate_remotion_composition(course_data: Dict[str, Any]) -> str:
    composition = {
        "type": "course_v2",
        "title": course_data.get("title", ""),
        "theme": course_data.get("visual_theme", "neural"),
        "modules": [],
    }

    for module in course_data.get("modules", []):
        mod_comp = {"title": module.get("title", ""), "lessons": []}
        for lesson in module.get("lessons", []):
            lesson_comp = {
                "title": lesson.get("title", ""),
                "lesson_type": lesson.get("lesson_type", ""),
                "slides": [],
            }
            for slide in lesson.get("slides", []):
                word_count = len(slide.get("narration", "").split())
                lesson_comp["slides"].append({
                    "type": slide.get("type", ""),
                    "heading": slide.get("heading", ""),
                    "image": slide.get("image_path"),
                    "audio": slide.get("audio_path"),
                    "duration_frames": max(180, int((word_count / 130) * 30 * 60)),
                })
            mod_comp["lessons"].append(lesson_comp)
        composition["modules"].append(mod_comp)

    path = OUTPUT_DIR / "remotion_composition.json"
    path.write_text(json.dumps(composition, indent=2, ensure_ascii=False), encoding="utf-8")
    log("OK", f"  Remotion composition: {path.name}")
    return str(path)


def render_with_remotion(course_data: Dict[str, Any]) -> None:
    video_root = HERE.parent.parent / "video"
    if not video_root.exists():
        log("WARN", f"  Remotion directory not found: {video_root}")
        return

    lesson_num = 1
    for module in course_data.get("modules", []):
        for lesson in module.get("lessons", []):
            out_file = OUTPUT_DIR / f"lesson_{lesson_num:03d}.mp4"
            props = json.dumps({"lesson": lesson, "theme": course_data.get("visual_theme", "neural")})
            cmd = [
                "npx", "remotion", "render",
                "NestLesson",
                str(out_file),
                f"--props={props}",
                "--gl=angle",
            ]
            try:
                log("INFO", f"  Rendering lesson {lesson_num}…")
                result = subprocess.run(
                    cmd, cwd=str(video_root),
                    capture_output=True, timeout=300,
                )
                if result.returncode == 0 and out_file.exists():
                    size_mb = out_file.stat().st_size / (1024 * 1024)
                    log("OK", f"  Rendered: {out_file.name} ({size_mb:.1f} MB)")
                else:
                    log("WARN", f"  Remotion exit {result.returncode}: {result.stderr.decode()[:80]}")
            except FileNotFoundError:
                log("WARN", "  Remotion CLI not found — install: npm install -g @remotion/cli")
                return
            except subprocess.TimeoutExpired:
                log("WARN", f"  Render timed out for lesson {lesson_num}")
            lesson_num += 1


# ═══════════════════════════════════════════════════════════════════════════
# NEST API UPLOAD
# ═══════════════════════════════════════════════════════════════════════════

def upload_to_nest(course_data: Dict[str, Any]) -> Optional[str]:
    if not NEST_TOKEN:
        log("WARN", "  No NEST_TOKEN — skipping upload")
        return None
    try:
        response = requests.post(
            f"{NEST_API_URL}/api/courses",
            json={
                "title": course_data.get("title", ""),
                "description": course_data.get("description", ""),
                "content": course_data,
            },
            headers={
                "Authorization": f"Bearer {NEST_TOKEN}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        if response.status_code in (200, 201):
            course_id = response.json().get("id")
            log("OK", f"  Uploaded to Nest — ID: {course_id}")
            return course_id
        log("WARN", f"  Nest API {response.status_code}: {response.text[:80]}")
        return None
    except Exception as e:
        log("ERROR", f"  Upload failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════
# STAGE 4: PRODUCTION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════

async def stage4_production(
    course_data: Dict[str, Any],
    theme: str = "neural",
    upload: bool = False,
) -> Dict[str, Any]:
    log("PROD", "STAGE 4: Production Pipeline")
    log("INFO", f"  Theme: {theme}")
    log("INFO", f"  Voice: {VOICE_BY_THEME.get(theme, DEFAULT_VOICE)}")

    course_title = course_data.get("title", "Course")

    # ── TTS + Images per slide ────────────────────────────────────────────
    log("INFO", "  Generating slide assets (TTS + images)…")
    global_slide_idx = 0

    for module in course_data.get("modules", []):
        for lesson in module.get("lessons", []):
            log("INFO", f"    [{lesson.get('lesson_type', '?').upper()}] {lesson.get('title', '')[:50]}")
            for slide in lesson.get("slides", []):
                stype = slide.get("type", "concept")

                # TTS
                narration = slide.get("narration", "")
                if narration:
                    voice, rate, pitch = get_tts_params(stype, theme)
                    tts_req = TTSRequest(
                        text=narration,
                        voice=voice,
                        rate=rate,
                        pitch=pitch,
                        slide_index=global_slide_idx,
                    )
                    audio_path = await generate_tts(tts_req)
                    if audio_path:
                        slide["audio_path"] = audio_path

                # Image (only for types that use images)
                if stype in IMAGE_SLIDE_TYPES:
                    img_req = SlideImageRequest(
                        slide_type=stype,
                        heading=slide.get("heading", ""),
                        theme=theme,
                        content_summary=narration[:120],
                        slide_index=global_slide_idx,
                        visual_hint=slide.get("visual_hint"),
                    )
                    image_path = await generate_slide_image(img_req)
                    if image_path:
                        slide["image_path"] = image_path

                global_slide_idx += 1

    log("OK", f"  Assets complete — {global_slide_idx} slides processed")

    # ── Remotion composition ──────────────────────────────────────────────
    composition_path = generate_remotion_composition(course_data)

    # ── Thumbnail ─────────────────────────────────────────────────────────
    thumbnail_path = generate_thumbnail(course_title, theme)

    # ── Upload ────────────────────────────────────────────────────────────
    if upload:
        log("INFO", "  Uploading to Nest API…")
        course_id = upload_to_nest(course_data)
        if course_id:
            course_data["nest_course_id"] = course_id

    # ── Manifest ──────────────────────────────────────────────────────────
    manifest = {
        "course": course_title,
        "theme": theme,
        "voice": VOICE_BY_THEME.get(theme, DEFAULT_VOICE),
        "composition": composition_path,
        "thumbnail": thumbnail_path,
        "modules": len(course_data.get("modules", [])),
        "total_slides": global_slide_idx,
    }
    manifest_path = OUTPUT_DIR / "production_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    log("OK", f"  Manifest: {manifest_path.name}")
    log("OK", "  Stage 4 complete")

    return course_data


# ═══════════════════════════════════════════════════════════════════════════
# CLI — run production on saved course JSON
# ═══════════════════════════════════════════════════════════════════════════

def run_production_from_file(
    course_json_path: str,
    theme: str = "neural",
    upload: bool = False,
) -> None:
    course_data = json.loads(Path(course_json_path).read_text(encoding="utf-8"))
    asyncio.run(stage4_production(course_data=course_data, theme=theme, upload=upload))


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python production.py <course.json> [--theme neural] [--upload]")
        sys.exit(1)

    _theme = "neural"
    _upload = False
    if "--theme" in sys.argv:
        _theme = sys.argv[sys.argv.index("--theme") + 1]
    if "--upload" in sys.argv:
        _upload = True

    run_production_from_file(sys.argv[1], theme=_theme, upload=_upload)
