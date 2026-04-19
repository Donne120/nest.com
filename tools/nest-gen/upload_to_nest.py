#!/usr/bin/env python3
"""Upload generated lesson videos from output/ to the Nest platform.

Reads manifest.json + curriculum.json, creates Modules, uploads video
and thumbnail files, then creates Video records via the Nest REST API.

Usage:
    python upload_to_nest.py [--dry-run] [--output-dir PATH]
                             [--from-lesson LESSON_ID]
                             [--module-ids IDX:ID IDX:ID ...]

Resume example (lessons 001-004 already uploaded, modules already exist):
    python upload_to_nest.py \\
        --from-lesson lesson_005 \\
        --module-ids 0:46c0e32b-6ab8-4f3c-a517-0b05a256578e \\
                     1:a7055f68-1522-4078-9fac-a4f9fa776f51 \\
                     2:5a951331-78c4-4ad7-9750-42e842a2294e \\
                     3:f24309d8-c720-4413-9a06-9cbd2792dcdd
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("NEST_API_URL", "http://localhost:8000")
TOKEN = os.getenv("NEST_TOKEN", "")
OUTPUT = Path(os.getenv("NEST_GEN_OUTPUT", Path(__file__).parent / "output"))

HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# Retry config for flaky connections
MAX_RETRIES = 3
RETRY_DELAY = 10   # seconds between retries


def _get(path):
    r = requests.get(f"{API_URL}{path}", headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def _post(path, body):
    r = requests.post(
        f"{API_URL}{path}", headers=HEADERS, json=body, timeout=30
    )
    if not r.ok:
        print(f"    POST {path} -> {r.status_code}: {r.text[:200]}")
        r.raise_for_status()
    return r.json()


def _upload(path, file_path):
    """Multipart-upload with retries; return the URL from the response."""
    mime = "video/mp4" if file_path.suffix == ".mp4" else "image/jpeg"
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with open(file_path, "rb") as fh:
                r = requests.post(
                    f"{API_URL}{path}",
                    headers=HEADERS,
                    files={"file": (file_path.name, fh, mime)},
                    timeout=600,
                )
            if not r.ok:
                print(
                    f"\n    UPLOAD {path} -> {r.status_code}: {r.text[:200]}"
                )
                r.raise_for_status()
            return r.json().get("url", "")
        except Exception as exc:
            last_exc = exc
            if attempt < MAX_RETRIES:
                print(
                    f"\n    attempt {attempt} failed: {exc}"
                    f" -- retrying in {RETRY_DELAY}s...",
                    end="",
                    flush=True,
                )
                time.sleep(RETRY_DELAY)
    raise last_exc


def main(dry_run, output_dir, from_lesson, module_ids_arg):
    manifest_path = output_dir / "manifest.json"
    curriculum_path = output_dir / "curriculum.json"

    if not manifest_path.exists():
        sys.exit(f"manifest.json not found in {output_dir}")
    if not curriculum_path.exists():
        sys.exit(f"curriculum.json not found in {output_dir}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    curriculum = json.loads(curriculum_path.read_text(encoding="utf-8"))

    course_title = curriculum.get("course_title", "AI for Everyday Life")
    modules_raw = curriculum.get("modules", [])

    if not TOKEN:
        sys.exit("NEST_TOKEN is not set -- add it to .env")

    print(f"\n[API]  {API_URL}")
    try:
        me = _get("/api/auth/me")
        print(f"[ME]   {me.get('email')} (role: {me.get('role')})")
    except Exception as exc:
        sys.exit(f"Cannot reach Nest API: {exc}")

    if dry_run:
        print("\n[!] DRY RUN -- no changes will be made.\n")

    # ── Pre-supplied module IDs (resume mode) ──────────────────────────────
    created_modules = {}
    if module_ids_arg:
        for pair in module_ids_arg:
            idx_str, mid = pair.split(":", 1)
            created_modules[int(idx_str)] = mid
        print("[RESUME] Using existing module IDs:")
        for idx, mid in created_modules.items():
            print(f"  mod {idx} -> {mid}")
        print()

    # ── Build module metadata ──────────────────────────────────────────────
    module_meta = {}
    for idx, mod in enumerate(modules_raw):
        title = mod.get("title", f"Module {idx + 1}")
        seen = [m["title"] for m in module_meta.values()]
        if title in seen:
            count = sum(
                1 for t in seen
                if t == title or t.startswith(title + " (")
            )
            title = f"{title} ({count + 1})"
        description = (
            mod.get("description")
            or mod.get("narration", "")[:500]
            or None
        )
        module_meta[idx] = {"title": title, "description": description}

    print(f"[COURSE] {course_title}")
    print(f"         {len(module_meta)} modules, {len(manifest)} lessons\n")

    # ── Create modules (skip if IDs already provided) ──────────────────────
    if not created_modules:
        for idx, meta in module_meta.items():
            print(f"  [MOD {idx}]  {meta['title']}")
            if dry_run:
                created_modules[idx] = f"dry-run-module-{idx}"
                continue
            try:
                result = _post("/api/modules", {
                    "title": meta["title"],
                    "description": meta["description"],
                    "order_index": idx,
                })
                created_modules[idx] = result["id"]
                print(f"            id={result['id']}")
            except Exception as exc:
                print(f"            FAILED: {exc}")
                sys.exit(1)
        print()

    # ── Determine which lessons to skip ───────────────────────────────────
    lesson_ids = [e["lesson_id"] for e in manifest]
    skip_before = 0
    if from_lesson:
        if from_lesson in lesson_ids:
            skip_before = lesson_ids.index(from_lesson)
            print(f"[RESUME] Starting from {from_lesson} "
                  f"(skipping {skip_before} already-uploaded lessons)\n")
        else:
            print(f"[WARN] --from-lesson '{from_lesson}' not found; "
                  "uploading all lessons.\n")

    # ── Upload each lesson ─────────────────────────────────────────────────
    for i, entry in enumerate(manifest):
        lesson_id = entry["lesson_id"]
        title = entry["title"]
        description = entry.get("description", "")
        module_idx = entry["module_index"]
        order_idx = entry["order_index"]
        duration = entry.get("duration_sec", 0)
        video_file = output_dir / entry["video_file"]
        thumb_name = entry.get("thumbnail", "")
        thumb_file = output_dir / thumb_name if thumb_name else None

        if i < skip_before:
            print(f"  [SKIP] {lesson_id}  (already uploaded)")
            continue

        module_id = created_modules.get(module_idx)
        if not module_id:
            print(f"  [SKIP] {lesson_id} -- module_index {module_idx} missing")
            continue

        print(f"  [{lesson_id}]  {title}")

        if dry_run:
            size = video_file.stat().st_size // 1_048_576
            print(f"    module={module_idx}  order={order_idx}  {duration}s")
            print(f"    video: {video_file.name} ({size} MB)")
            continue

        if not video_file.exists():
            print(f"    MISSING: {video_file}")
            continue

        size_mb = video_file.stat().st_size / 1_048_576
        print(f"    uploading video ({size_mb:.1f} MB)...", end="", flush=True)
        try:
            video_url = _upload("/api/videos/upload/video", video_file)
            print(" ok")
        except Exception as exc:
            print(f"\n    FAILED video upload: {exc}")
            continue

        thumb_url = None
        if thumb_file and thumb_file.exists():
            print("    uploading thumbnail...", end="", flush=True)
            try:
                thumb_url = _upload(
                    "/api/videos/upload/thumbnail", thumb_file
                )
                print(" ok")
            except Exception as exc:
                print(f"\n    thumbnail upload failed (skipping): {exc}")

        print("    creating video record...", end="", flush=True)
        try:
            v = _post("/api/videos", {
                "module_id": module_id,
                "title": title,
                "description": description,
                "video_url": video_url,
                "thumbnail_url": thumb_url,
                "duration_seconds": duration,
                "order_index": order_idx,
            })
            print(f" ok  id={v['id']}")
        except Exception as exc:
            print(f"\n    FAILED record creation: {exc}")

        time.sleep(1)

    status = "done (dry run)" if dry_run else "upload complete"
    print(f"\n[{status.upper()}]\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Upload nest-gen output to Nest platform"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview only -- no API calls",
    )
    parser.add_argument(
        "--output-dir", default=str(OUTPUT),
        help="Path to output/ directory",
    )
    parser.add_argument(
        "--from-lesson", default=None, metavar="LESSON_ID",
        help="Resume from this lesson ID (e.g. lesson_005); skips earlier ones",
    )
    parser.add_argument(
        "--module-ids", nargs="+", default=None, metavar="IDX:ID",
        help="Reuse existing module IDs (e.g. 0:uuid1 1:uuid2); skips creation",
    )
    args = parser.parse_args()
    main(
        dry_run=args.dry_run,
        output_dir=Path(args.output_dir),
        from_lesson=args.from_lesson,
        module_ids_arg=args.module_ids,
    )
