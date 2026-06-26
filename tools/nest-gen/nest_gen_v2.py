#!/usr/bin/env python3
"""
nest-gen v2 — Universal Educational Video Engine (FULL REBUILD)

Four-stage pipeline:
  Stage 1: COURSE INTELLIGENCE  — analyse title → blueprint JSON
  Stage 2: COURSE ARCHITECTURE  — design modules/lessons/types
  Stage 3: LESSON GENERATION    — ONE LLM CALL PER LESSON (not per module)
  Stage 4: PRODUCTION           — TTS, images, Remotion, upload

Usage:
  python nest_gen_v2.py "AI For Everyday Life"
  python nest_gen_v2.py "Quantum Physics" --modules 5 --lessons 3
  python nest_gen_v2.py "Negotiation Skills" --dry-run --save-stages
  python nest_gen_v2.py "Calculus" --modules 3 --lessons 4 --no-production
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from openai import OpenAI

from v2_schemas import (
    CourseArchitecture, CourseIntelligence,
    DifficultyProgression, Difficulty, EmotionalArcModule,
    ExampleStyle, LessonArchitecture, LessonType,
    ModuleArchitecture, SkillMix, SkillType,
    Transformation, VisualTheme,
    LESSON_TYPE_TEMPLATES, LESSON_TYPE_SLIDE_COUNTS,
    NARRATION_VOICE_BY_LESSON, NARRATION_LIMITS,
    SLIDE_JSON_SCHEMAS,
    course_intelligence_to_json, course_architecture_to_json,
    validate_module,
)
from production import stage4_production

# ═══════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════

load_dotenv()

NVIDIA_API_KEY  = os.getenv("NVIDIA_API_KEY", "")
LLM_CALL_INTERVAL = float(os.getenv("LLM_CALL_INTERVAL", "2.0"))

HERE    = Path(__file__).parent
OUT_DIR = HERE / "output"
OUT_DIR.mkdir(exist_ok=True, parents=True)


def log(level: str, msg: str) -> None:
    sym = {"INFO": "ℹ", "STAGE": "▶", "OK": "✓", "WARN": "⚠", "ERROR": "✗"}
    print(f"{sym.get(level, '·')} {msg}", flush=True)


# ═══════════════════════════════════════════════════════════════════════════
# LLM INTERFACE — NVIDIA / Llama 3.3 70B
# ═══════════════════════════════════════════════════════════════════════════

def llm_call(
    prompt: str,
    max_tokens: int = 4096,
    temperature: float = 0.7,
    system: str = "You are a curriculum design expert. Output only valid JSON. Start with { and end with }.",
) -> str:
    time.sleep(LLM_CALL_INTERVAL)
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )
    response = client.chat.completions.create(
        model="meta/llama-3.3-70b-instruct",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content.strip()
    # Strip markdown fences if LLM adds them despite instructions
    if content.startswith("```"):
        parts = content.split("```")
        content = parts[1] if len(parts) > 1 else content
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()
    return content


def llm_call_with_retry(prompt: str, max_tokens: int, temperature: float = 0.7, retries: int = 2) -> dict:
    last_err = None
    for attempt in range(retries + 1):
        try:
            raw = llm_call(prompt, max_tokens=max_tokens, temperature=temperature)
            return json.loads(raw)
        except json.JSONDecodeError as e:
            last_err = e
            log("WARN", f"  JSON parse failed (attempt {attempt + 1}): {e}")
            if attempt < retries:
                time.sleep(3)
    raise ValueError(f"LLM returned invalid JSON after {retries + 1} attempts: {last_err}")


# ═══════════════════════════════════════════════════════════════════════════
# STAGE 1: COURSE INTELLIGENCE
# ═══════════════════════════════════════════════════════════════════════════

_STAGE1_PROMPT = """\
You are the world's best curriculum designer. You have designed courses for MIT OpenCourseWare,
Coursera, MasterClass, and Khan Academy. Given a course title, you analyse everything about
how this course should be taught BEFORE any content is created.

Output valid JSON ONLY. No markdown fences. Start with {{ and end with }}.

Course title: "{title}"
Requested structure: {n_modules} modules, {n_lessons} lessons per module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYSE THE FOLLOWING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LEARNER PROFILE
   Who would take this course? Age range, background, what they already know,
   what they are trying to achieve. Be specific — real people with real goals.

2. TRANSFORMATION
   Before: [what they cannot do]. After: [what they can confidently do].

3. SKILL TYPE MIX — rate each 0-10:
   conceptual | procedural | analytical | creative | physical | interpersonal | metacognitive

4. DIFFICULTY PROGRESSION
   Overall 1-10. Pattern: steady_climb | plateau_and_jump | wave | front_loaded | back_loaded

5. VISUAL THEME — choose ONE:
   neural | blueprint | chalkboard | kinetic | organic | cinematic | studio | workshop

6. EMOTIONAL ARC — one sentence per module describing how the learner should feel.

7. EXAMPLE STYLE — choose ONE:
   workplace | everyday | student | creative | technical | mixed

8. PREREQUISITES — list 0-5 things learner must already know, or empty array.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA (output exactly this structure)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
  "course_title": "{title}",
  "learner_profile": "2-3 specific sentences describing the target learner",
  "transformation": {{
    "before": "What the learner cannot do before this course",
    "after": "What the learner can confidently do after this course"
  }},
  "skill_mix": {{
    "conceptual": 0, "procedural": 0, "analytical": 0,
    "creative": 0, "physical": 0, "interpersonal": 0, "metacognitive": 0
  }},
  "primary_skill_types": ["top 1-2 types from skill_mix"],
  "difficulty": {{
    "overall": 5,
    "progression": "steady_climb",
    "description": "One sentence explaining the difficulty curve"
  }},
  "visual_theme": "neural",
  "emotional_arc": [
    {{"module": 1, "feeling": "Curious and reassured — AI is not scary, I can do this"}},
    {{"module": 2, "feeling": "..."}},
    {{"module": 3, "feeling": "..."}},
    {{"module": 4, "feeling": "..."}}
  ],
  "example_style": "everyday",
  "prerequisites": [],
  "course_description": "2-3 sentence compelling description for the course catalogue"
}}
"""


def stage1_course_intelligence(title: str, n_modules: int, n_lessons: int) -> CourseIntelligence:
    log("STAGE", "STAGE 1: Course Intelligence")
    log("INFO",  f"  Title: {title}  |  {n_modules} modules × {n_lessons} lessons")

    prompt = _STAGE1_PROMPT.format(title=title, n_modules=n_modules, n_lessons=n_lessons)
    data   = llm_call_with_retry(prompt, max_tokens=3000)

    arc = data.get("emotional_arc", [])
    if len(arc) < n_modules:
        for i in range(len(arc), n_modules):
            arc.append({"module": i + 1, "feeling": "Building confidence and skill"})

    blueprint = CourseIntelligence(
        course_title=data.get("course_title", title),
        learner_profile=data["learner_profile"],
        transformation=Transformation(
            before=data["transformation"]["before"],
            after=data["transformation"]["after"],
        ),
        skill_mix=SkillMix(**{
            k: int(data["skill_mix"].get(k, 0))
            for k in ["conceptual", "procedural", "analytical", "creative",
                       "physical", "interpersonal", "metacognitive"]
        }),
        primary_skill_types=[SkillType(s.lower()) for s in data.get("primary_skill_types", ["conceptual"])],
        difficulty=Difficulty(
            overall=int(data["difficulty"]["overall"]),
            progression=DifficultyProgression(data["difficulty"]["progression"].lower()),
            description=data["difficulty"]["description"],
        ),
        visual_theme=VisualTheme(data.get("visual_theme", "neural").lower()),
        emotional_arc=[EmotionalArcModule(module=a["module"], feeling=a["feeling"]) for a in arc[:n_modules]],
        example_style=ExampleStyle(data.get("example_style", "mixed").lower()),
        prerequisites=data.get("prerequisites", []),
        course_description=data["course_description"],
    )

    log("OK", f"  Theme: {blueprint.visual_theme.value}  |  Primary skills: {[s.value for s in blueprint.primary_skill_types]}")
    return blueprint


# ═══════════════════════════════════════════════════════════════════════════
# STAGE 2: COURSE ARCHITECTURE
# ═══════════════════════════════════════════════════════════════════════════

_STAGE2_PROMPT = """\
You are designing the complete structure of a video course.
You have analysed the course (blueprint below) and now must design modules, lessons, and assign
a LESSON TYPE to each lesson. This is where variety is engineered.

Output valid JSON ONLY. No markdown fences. Start with {{ and end with }}.

Course title: "{title}"
Structure: {n_modules} modules, {n_lessons} lessons per module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE BLUEPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{blueprint_json}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON TYPES — assign exactly one to each lesson
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AWAKENING      — First lesson: hook interest. 6 slides.
FOUNDATION     — Core concept/theory building. 7 slides.
SKILL_BUILD    — Step-by-step procedure, learner follows along. 8 slides.
DEEP_DIVE      — Nuance, edge cases, complexity after basics. 7 slides.
CASE_STUDY     — Real-world story + application. 7 slides.
CHALLENGE      — Learner solves with minimal guidance. 6 slides.
LAB            — Extended practice with multiple exercises. 8 slides.
MILESTONE      — Module end: celebrate, combine skills, bridge to next. 6 slides. ALWAYS LAST.
WORKED_EXAMPLE — Complete solved problem (math/science/analytical). 8 slides.
DEBATE         — Multiple perspectives, critical thinking. 7 slides.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSIGNMENT RULES (enforce strictly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. First lesson of the entire course MUST be "awakening".
2. Last lesson of EVERY module MUST be "milestone".
3. No two adjacent lessons in a module may have the same type.
4. If primary_skill_types includes "analytical": ≥30% lessons = worked_example or lab.
5. If primary_skill_types includes "procedural": ≥40% lessons = skill_build or lab.
6. If primary_skill_types includes "conceptual": ≥1 case_study or debate per module.
7. Each module must use ≥3 different lesson types.
8. "challenge" may only appear after at least one skill_build or foundation in the same module.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
  "course_title": "{title}",
  "course_description": "from blueprint",
  "modules": [
    {{
      "title": "Module title",
      "description": "What this module covers and what the learner achieves",
      "order_index": 0,
      "emotional_tone": "from blueprint emotional_arc for this module",
      "lessons": [
        {{
          "title": "Lesson title — benefit-focused, specific",
          "order_index": 0,
          "lesson_type": "awakening",
          "difficulty": 2,
          "key_concept": "The single most important idea in this lesson",
          "connects_to_next": "How this lesson sets up the next one",
          "example_context": "Brief note on what kind of example this lesson should use"
        }}
      ]
    }}
  ]
}}
"""


def stage2_course_architecture(
    title: str,
    n_modules: int,
    n_lessons: int,
    blueprint: CourseIntelligence,
) -> CourseArchitecture:
    log("STAGE", "STAGE 2: Course Architecture")

    blueprint_json = json.dumps(blueprint.to_dict(), indent=2, default=str)
    prompt = _STAGE2_PROMPT.format(
        title=title,
        n_modules=n_modules,
        n_lessons=n_lessons,
        blueprint_json=blueprint_json,
    )
    data = llm_call_with_retry(prompt, max_tokens=6000)

    modules = []
    for mod_data in data["modules"]:
        lessons = []
        for lesson_data in mod_data["lessons"]:
            lt_raw = lesson_data.get("lesson_type", "foundation").lower()
            try:
                lt = LessonType(lt_raw)
            except ValueError:
                lt = LessonType.FOUNDATION
            lessons.append(LessonArchitecture(
                title=lesson_data["title"],
                order_index=lesson_data["order_index"],
                lesson_type=lt,
                difficulty=int(lesson_data.get("difficulty", 5)),
                key_concept=lesson_data.get("key_concept", ""),
                connects_to_next=lesson_data.get("connects_to_next", ""),
                example_context=lesson_data.get("example_context", ""),
            ))
        modules.append(ModuleArchitecture(
            title=mod_data["title"],
            description=mod_data["description"],
            order_index=mod_data["order_index"],
            emotional_tone=mod_data.get("emotional_tone", ""),
            lessons=lessons,
        ))

    architecture = CourseArchitecture(
        course_title=title,
        course_description=blueprint.course_description,
        n_modules=n_modules,
        n_lessons_per_module=n_lessons,
        modules=modules,
    )

    _enforce_lesson_type_rules(architecture, blueprint)

    log("OK", f"  {n_modules} modules designed")
    for mod in architecture.modules:
        types = [l.lesson_type.value for l in mod.lessons]
        log("INFO", f"  [{mod.title[:40]}]: {types}")
    return architecture


def _enforce_lesson_type_rules(arch: "CourseArchitecture", blueprint: "CourseIntelligence") -> None:
    """Programmatically enforce all 8 lesson type assignment rules after LLM output."""
    primary = [s.value for s in blueprint.primary_skill_types]
    all_lessons = [l for m in arch.modules for l in m.lessons]
    n_total = len(all_lessons)

    # Rule 1: First lesson of entire course must be awakening
    if all_lessons and all_lessons[0].lesson_type != LessonType.AWAKENING:
        log("WARN", "  Rule 1 violated — forcing first lesson to awakening")
        all_lessons[0].lesson_type = LessonType.AWAKENING

    for mod in arch.modules:
        lessons = mod.lessons

        # Rule 2: Last lesson of every module must be milestone
        if lessons and lessons[-1].lesson_type != LessonType.MILESTONE:
            log("WARN", f"  Rule 2 violated in '{mod.title[:30]}' — forcing last lesson to milestone")
            lessons[-1].lesson_type = LessonType.MILESTONE

        # Rule 8: challenge must not appear before any skill_build/foundation in the module
        seen_skill = False
        for lesson in lessons[:-1]:  # skip milestone
            if lesson.lesson_type in (LessonType.SKILL_BUILD, LessonType.FOUNDATION):
                seen_skill = True
            if lesson.lesson_type == LessonType.CHALLENGE and not seen_skill:
                log("WARN", f"  Rule 8 violated — replacing early challenge with foundation in '{mod.title[:30]}'")
                lesson.lesson_type = LessonType.FOUNDATION
                seen_skill = True

        # Rule 3: no two adjacent lessons with same type
        for i in range(len(lessons) - 1):
            if lessons[i].lesson_type == lessons[i + 1].lesson_type:
                # Swap i+1 to the next viable type (not same as neighbours)
                used = {lessons[i].lesson_type}
                if i + 2 < len(lessons):
                    used.add(lessons[i + 2].lesson_type)
                candidates = [
                    LessonType.DEEP_DIVE, LessonType.CASE_STUDY,
                    LessonType.FOUNDATION, LessonType.SKILL_BUILD,
                ]
                for c in candidates:
                    if c not in used and lessons[i + 1].lesson_type != LessonType.MILESTONE:
                        log("WARN", f"  Rule 3 — fixing adjacent duplicate '{lessons[i].lesson_type.value}' at pos {i+1}")
                        lessons[i + 1].lesson_type = c
                        break

    # Rules 4/5: percentage minimums — fix globally by upgrading non-milestone lessons
    all_lessons = [l for m in arch.modules for l in m.lessons]

    if "procedural" in primary:
        target = int(n_total * 0.40)
        count = sum(1 for l in all_lessons if l.lesson_type in (LessonType.SKILL_BUILD, LessonType.LAB))
        if count < target:
            needed = target - count
            log("WARN", f"  Rule 5 — procedural course needs {target} skill_build/lab lessons, has {count}. Upgrading {needed}.")
            _redistribute_to_types(arch, needed, [LessonType.SKILL_BUILD, LessonType.LAB],
                                   exclude=[LessonType.MILESTONE, LessonType.AWAKENING,
                                            LessonType.SKILL_BUILD, LessonType.LAB])

    if "analytical" in primary:
        target = int(n_total * 0.30)
        count = sum(1 for l in all_lessons if l.lesson_type in (LessonType.WORKED_EXAMPLE, LessonType.LAB))
        if count < target:
            needed = target - count
            log("WARN", f"  Rule 4 — analytical course needs {target} worked_example/lab lessons, has {count}. Upgrading {needed}.")
            _redistribute_to_types(arch, needed, [LessonType.WORKED_EXAMPLE, LessonType.LAB],
                                   exclude=[LessonType.MILESTONE, LessonType.AWAKENING,
                                            LessonType.WORKED_EXAMPLE, LessonType.LAB])

    # Rule 6: conceptual → at least 1 case_study or debate per module
    if "conceptual" in primary:
        for mod in arch.modules:
            has_cs_or_debate = any(
                l.lesson_type in (LessonType.CASE_STUDY, LessonType.DEBATE)
                for l in mod.lessons
            )
            if not has_cs_or_debate:
                for lesson in mod.lessons:
                    if lesson.lesson_type not in (LessonType.MILESTONE, LessonType.AWAKENING):
                        log("WARN", f"  Rule 6 — adding case_study to '{mod.title[:30]}'")
                        lesson.lesson_type = LessonType.CASE_STUDY
                        break


def _redistribute_to_types(
    arch: "CourseArchitecture",
    needed: int,
    target_types: List[LessonType],
    exclude: List[LessonType],
) -> None:
    """Replace `needed` lessons (skipping excluded types) with alternating target_types."""
    replaced = 0
    for mod in arch.modules:
        for lesson in mod.lessons:
            if replaced >= needed:
                return
            if lesson.lesson_type not in exclude:
                lesson.lesson_type = target_types[replaced % len(target_types)]
                replaced += 1


# ═══════════════════════════════════════════════════════════════════════════
# STAGE 3: LESSON GENERATION — ONE LLM CALL PER LESSON
# ═══════════════════════════════════════════════════════════════════════════

def _build_slide_schemas_for_lesson(lesson_type: str) -> str:
    """Return JSON schema definitions for all slide types in this one lesson type."""
    needed = LESSON_TYPE_TEMPLATES.get(lesson_type, [])
    lines = ["SLIDE TYPE SCHEMAS — generate exactly these fields for each slide:\n"]
    seen = []
    for slide_type in needed:
        if slide_type not in seen:
            seen.append(slide_type)
        schema = SLIDE_JSON_SCHEMAS.get(slide_type)
        if schema:
            lines.append(f"--- {slide_type.upper()} ---")
            lines.append(schema)
            lines.append("")
    return "\n".join(lines)


def _narration_rules_for_lesson(lesson_type: str) -> str:
    """Build the narration word-count table for only the slide types in this lesson."""
    needed = LESSON_TYPE_TEMPLATES.get(lesson_type, [])
    lines = ["REQUIRED narration word counts per slide type (HARD MINIMUMS — count every word):"]
    for st in needed:
        mn, mx = NARRATION_LIMITS.get(st, (120, 160))
        lines.append(f"  {st}: {mn}–{mx} words")
    return "\n".join(lines)


_STAGE3_LESSON_PROMPT = """\
You are generating the complete slide-by-slide content for ONE lesson of a video course.
Fill every slide with rich, specific, example-driven content. Do not rush. Do not summarise.

Output valid JSON ONLY. No markdown fences. Start with {{ and end with }}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course: "{course_title}"
Learner: {learner_profile}
Transformation: Before — {before}
                After  — {after}
Example style: {example_style}
Visual theme: {visual_theme}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module {module_num} of {n_modules}: "{module_title}"
Emotional tone: {emotional_tone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIS LESSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lesson {lesson_num} of {n_lessons_in_module}: "{lesson_title}"
Lesson type: {lesson_type}
Key concept: {key_concept}
Example context: {example_context}
Connects to next: {connects_to_next}
Narration voice: {narration_voice}

Slide sequence for {lesson_type} ({slide_count} slides total):
{slide_sequence}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — NARRATION LENGTH (NON-NEGOTIABLE HARD MINIMUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{narration_rules}

If your narration is under the minimum, YOU HAVE FAILED. Pad with examples, analogies, and explanation.

WRONG (18 words — NEVER do this):
"Welcome. Today you will learn how to use this skill effectively."

CORRECT (130 words — always do this):
"Welcome to this lesson. Today we are going to cover something that will genuinely save
you time and help you get better results in everything you do. A lot of people struggle
with this topic not because it is hard, but because nobody ever showed them the right
approach. By the time this lesson is over, you will have a clear method you can use
immediately — no waiting, no guessing. We are going to walk through it step by step
together. I will explain what it is, show you exactly how to do it, give you a real
example so you can see it working, and then give you a chance to try it yourself right
now. Let us get started — this is going to be a good one."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — THIS IS A SKILL COURSE. TEACH THE SKILL. SHOW THE EXACT STEPS.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The learner opens this lesson to learn HOW TO DO SOMETHING — not to hear a story.
Stories and characters are only setup. The TEACHING is the step-by-step doing.

For every walkthrough slide you MUST:
  • Show EXACT steps the learner takes right now (open ChatGPT → click New Chat → type THIS)
  • Write the example_prompt as a COMPLETE, COPYABLE prompt the learner pastes immediately
  • Write ai_response as a REALISTIC, SPECIFIC response ChatGPT would actually produce
  • The narration must walk through EACH step as if you are sitting next to the learner

WRONG walkthrough example_prompt:
  "Write a social media post about a new product launch"

RIGHT walkthrough example_prompt:
  "I run a small online clothing store called Luna Threads. I just launched a new summer
  dress collection. Write me 3 Instagram captions — one exciting and playful, one that
  focuses on the fabric quality, and one that creates urgency with a limited-time offer.
  Keep each caption under 150 characters and include 3-5 relevant hashtags."

WRONG ai_response:
  "Introducing our brand new product! This innovative solution is designed to make your
  life easier. Try it today!"

RIGHT ai_response:
  "1. ☀️ Summer is HERE and so is our Luna Threads dress collection — flowy, fun, and
  made for every adventure. Shop the drop now! #LunaThreads #SummerDress #OOTD
  2. Crafted from 100% breathable linen, our new summer dresses keep you cool when the
  heat is on. Quality you can feel. #SlowFashion #LinenDress #LunaThreads
  3. ⚡ Last 48 hours — 20% off the new collection. These are selling fast. Link in bio.
  #LimitedOffer #SummerSale #LunaThreads"

For every practice slide you MUST:
  • Give a SPECIFIC task the learner does in the next 2 minutes
  • The example_prompt must have [PLACEHOLDERS] the learner fills in with THEIR real info
  • Never say "try this in your own time" — say "pause this video right now and do this"

WRONG practice task:
  "Try using GPT to write content for your business."

RIGHT practice task:
  "Open ChatGPT right now. Think of ONE thing you sell, teach, or offer.
  Then copy this prompt and fill in the brackets:
  'I [what you do] for [who you help]. Write me 3 social media captions for [specific product/service].
  Make them [tone: professional/funny/inspiring]. Include hashtags.'"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — NARRATION VOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Warm, encouraging teacher — NOT a textbook. Use "you" and "we" constantly.
Conversational: "Here is the thing...", "Now watch this...", "Ready?"
Gets excited: "This is the part that changes everything."
Slows for hard parts: "Take a moment with this. It is important."
Never sounds robotic or corporate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — LESSON CONNECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{connection_rules}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE SCHEMAS — generate exactly these fields per slide type
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{slide_schemas}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT — generate this ONE lesson only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
  "title": "{lesson_title}",
  "order_index": {lesson_order_index},
  "lesson_type": "{lesson_type}",
  "difficulty": {difficulty},
  "key_concept": "{key_concept}",
  "slides": [
    ... exactly {slide_count} slides in this order: {slide_sequence_short} ...
  ]
}}
"""


def stage3_generate_lesson(
    blueprint: CourseIntelligence,
    architecture: CourseArchitecture,
    module_index: int,
    lesson_index: int,
    is_first_lesson_of_course: bool,
    is_last_lesson_of_course: bool,
) -> Dict[str, Any]:
    mod    = architecture.modules[module_index]
    lesson = mod.lessons[lesson_index]
    lt     = lesson.lesson_type.value

    template       = LESSON_TYPE_TEMPLATES.get(lt, [])
    slide_sequence = " → ".join(template)
    slide_count    = len(template)

    narration_voice = NARRATION_VOICE_BY_LESSON.get(lt, "clear and engaging")
    narration_rules = _narration_rules_for_lesson(lt)
    slide_schemas   = _build_slide_schemas_for_lesson(lt)

    if is_first_lesson_of_course:
        connection_rules = "This is the FIRST lesson of the entire course. No back-reference needed on the first slide."
    elif is_last_lesson_of_course:
        connection_rules = (
            "First slide narration: briefly reference what came in the previous lesson.\n"
            "Last slide narration: this is the FINAL lesson — deliver a course completion message, "
            "celebrating everything the learner has achieved."
        )
    else:
        connection_rules = (
            "First slide narration: briefly reference what came in the previous lesson.\n"
            f"Last slide narration: tease what comes next — '{lesson.connects_to_next}'"
        )

    prompt = _STAGE3_LESSON_PROMPT.format(
        course_title=architecture.course_title,
        learner_profile=blueprint.learner_profile,
        before=blueprint.transformation.before,
        after=blueprint.transformation.after,
        example_style=blueprint.example_style.value,
        visual_theme=blueprint.visual_theme.value,
        module_num=module_index + 1,
        n_modules=len(architecture.modules),
        module_title=mod.title,
        emotional_tone=mod.emotional_tone,
        lesson_num=lesson_index + 1,
        n_lessons_in_module=len(mod.lessons),
        lesson_title=lesson.title,
        lesson_type=lt,
        key_concept=lesson.key_concept,
        example_context=lesson.example_context,
        connects_to_next=lesson.connects_to_next,
        narration_voice=narration_voice,
        slide_sequence=slide_sequence,
        slide_sequence_short=", ".join(template),
        slide_count=slide_count,
        narration_rules=narration_rules,
        connection_rules=connection_rules,
        slide_schemas=slide_schemas,
        lesson_order_index=lesson_index,
        difficulty=lesson.difficulty,
    )

    data = llm_call_with_retry(prompt, max_tokens=4096, temperature=0.8)

    # Validate narration lengths and report
    slides = data.get("slides", [])
    short = []
    for i, slide in enumerate(slides):
        stype = slide.get("type", "?")
        wc    = len((slide.get("narration") or "").split())
        mn, _ = NARRATION_LIMITS.get(stype, (120, 160))
        if wc < mn:
            short.append(f"slide {i} ({stype}): {wc} words (need {mn}+)")

    if short:
        log("WARN", f"    Short narrations: {'; '.join(short)}")
    else:
        total_words = sum(len((s.get("narration") or "").split()) for s in slides)
        log("OK",   f"    {len(slides)} slides · {total_words} words narration")

    return data


def stage3_lesson_generation(
    blueprint: CourseIntelligence,
    architecture: CourseArchitecture,
    module_index: int,
) -> Dict[str, Any]:
    mod = architecture.modules[module_index]
    log("STAGE", f"STAGE 3.{module_index + 1}: Lesson Generation — Module {module_index + 1}: {mod.title}")

    total_lessons_in_course = sum(len(m.lessons) for m in architecture.modules)
    lessons_before_this_module = sum(len(architecture.modules[i].lessons) for i in range(module_index))

    generated_lessons = []
    for lesson_index, lesson in enumerate(mod.lessons):
        global_lesson_index = lessons_before_this_module + lesson_index
        is_first = (global_lesson_index == 0)
        is_last  = (global_lesson_index == total_lessons_in_course - 1)

        log("INFO", f"  [{lesson.lesson_type.value.upper()}] {lesson.title[:60]}")

        lesson_data = stage3_generate_lesson(
            blueprint=blueprint,
            architecture=architecture,
            module_index=module_index,
            lesson_index=lesson_index,
            is_first_lesson_of_course=is_first,
            is_last_lesson_of_course=is_last,
        )
        generated_lessons.append(lesson_data)

    module_data = {
        "title":         mod.title,
        "description":   mod.description,
        "order_index":   module_index,
        "emotional_tone": mod.emotional_tone,
        "lessons":       generated_lessons,
    }

    # Validate module as a whole
    issues = validate_module(module_data)
    if issues:
        log("WARN", f"  Module validation: {len(issues)} issue(s)")
        for issue in issues[:5]:
            log("WARN", f"    · {issue}")
    else:
        slide_count = sum(len(l.get("slides", [])) for l in generated_lessons)
        log("OK", f"  Module {module_index + 1} valid: {len(generated_lessons)} lessons, {slide_count} slides")

    return module_data


# ═══════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATION
# ═══════════════════════════════════════════════════════════════════════════

async def build_course(
    title: str,
    n_modules: int   = 4,
    n_lessons: int   = 3,
    dry_run: bool    = False,
    save_stages: bool = False,
    run_production: bool = True,
    upload: bool     = False,
) -> Dict[str, Any]:
    log("INFO",  "═" * 60)
    log("INFO",  "  nest-gen v2: UNIVERSAL EDUCATIONAL VIDEO ENGINE")
    log("INFO",  "═" * 60)
    log("INFO",  f"  Title:     {title}")
    log("INFO",  f"  Structure: {n_modules} modules × {n_lessons} lessons per module")
    log("INFO",  f"  LLM calls: {n_modules * n_lessons + 2} total (1 + 1 + {n_modules * n_lessons} lessons)")
    log("INFO",  "")

    # ── Stage 1 ──────────────────────────────────────────────────────────
    blueprint = stage1_course_intelligence(title, n_modules, n_lessons)
    if save_stages:
        p = OUT_DIR / "01_course_intelligence.json"
        p.write_text(course_intelligence_to_json(blueprint), encoding="utf-8")
        log("INFO", f"  Saved: {p.name}")

    # ── Stage 2 ──────────────────────────────────────────────────────────
    architecture = stage2_course_architecture(title, n_modules, n_lessons, blueprint)
    if save_stages:
        p = OUT_DIR / "02_course_architecture.json"
        p.write_text(course_architecture_to_json(architecture), encoding="utf-8")
        log("INFO", f"  Saved: {p.name}")

    if dry_run:
        log("INFO", "  DRY RUN: stopping before Stage 3.")
        return {"blueprint": blueprint.to_dict(), "architecture": architecture.to_dict()}

    # ── Stage 3 — one lesson per LLM call ────────────────────────────────
    log("INFO", "")
    modules_data: List[Dict[str, Any]] = []
    for idx in range(len(architecture.modules)):
        module_json = stage3_lesson_generation(
            blueprint=blueprint,
            architecture=architecture,
            module_index=idx,
        )
        modules_data.append(module_json)
        if save_stages:
            p = OUT_DIR / f"03_module_{idx + 1:02d}.json"
            p.write_text(json.dumps(module_json, indent=2, ensure_ascii=False), encoding="utf-8")
            log("INFO", f"  Saved: {p.name}")

    full_course = {
        "title":          title,
        "description":    blueprint.course_description,
        "learner_profile": blueprint.learner_profile,
        "transformation": {
            "before": blueprint.transformation.before,
            "after":  blueprint.transformation.after,
        },
        "visual_theme":   blueprint.visual_theme.value,
        "example_style":  blueprint.example_style.value,
        "modules":        modules_data,
    }

    course_path = OUT_DIR / "course_complete.json"
    course_path.write_text(json.dumps(full_course, indent=2, ensure_ascii=False), encoding="utf-8")
    log("OK", f"  Course saved: {course_path.name}")

    # ── Stage 4 ──────────────────────────────────────────────────────────
    if run_production:
        log("INFO", "")
        try:
            updated = await stage4_production(
                course_data=full_course,
                theme=blueprint.visual_theme.value,
                upload=upload,
            )
            # Re-save course_complete.json with audio/image paths added by Stage 4
            course_path.write_text(json.dumps(updated, indent=2, ensure_ascii=False), encoding="utf-8")
            log("OK", "  course_complete.json updated with audio/image paths")
        except Exception as e:
            log("WARN", f"  Stage 4 error: {str(e)[:120]}")
            import traceback
            traceback.print_exc()

    log("OK", "═" * 60)
    log("OK", "  Pipeline complete!")
    log("OK", "═" * 60)
    return full_course


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="nest-gen v2: Universal Educational Video Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  python nest_gen_v2.py "AI For Everyday Life"
  python nest_gen_v2.py "Quantum Physics" --modules 5 --lessons 3
  python nest_gen_v2.py "Negotiation" --dry-run --save-stages
  python nest_gen_v2.py "Calculus" --modules 3 --lessons 4 --no-production
        """,
    )
    parser.add_argument("title",          help="Course title")
    parser.add_argument("--modules",      type=int, default=4,  help="Number of modules (default: 4)")
    parser.add_argument("--lessons",      type=int, default=3,  help="Lessons per module (default: 3)")
    parser.add_argument("--dry-run",      action="store_true",  help="Stop after Stage 2")
    parser.add_argument("--save-stages",  action="store_true",  help="Save each stage as JSON")
    parser.add_argument("--no-production",action="store_true",  help="Skip Stage 4")
    parser.add_argument("--upload",       action="store_true",  help="Upload to Nest API after production")
    args = parser.parse_args()

    try:
        asyncio.run(build_course(
            title=args.title,
            n_modules=args.modules,
            n_lessons=args.lessons,
            dry_run=args.dry_run,
            save_stages=args.save_stages,
            run_production=not args.no_production,
            upload=args.upload,
        ))
    except KeyboardInterrupt:
        log("WARN", "Interrupted by user.")
        sys.exit(0)
    except Exception as e:
        log("ERROR", f"Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
