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

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import base64

import requests
from dotenv import load_dotenv
from tqdm import tqdm

# ── Load config ────────────────────────────────────────────────────────────
load_dotenv()

NVIDIA_API_KEY    = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_IMAGE_KEY  = os.getenv("NVIDIA_IMAGE_KEY", "")
LLM_CALL_INTERVAL = float(os.getenv("LLM_CALL_INTERVAL", "3"))
EDGE_VOICE        = os.getenv("EDGE_VOICE", "en-GB-RyanNeural")
NEST_API_URL      = os.getenv("NEST_API_URL", "http://localhost:8000")
NEST_TOKEN        = os.getenv("NEST_TOKEN", "")

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

# ── Theme auto-detection ───────────────────────────────────────────────────

_THEME_KEYWORDS: dict[str, list[str]] = {
    "blueprint": [
        "quantum", "physics", "engineering", "chemistry", "biology", "astronomy",
        "computing", "algorithm", "circuit", "electronics", "robotics", "aerospace",
        "architecture", "thermodynamics", "optics", "mechanics", "neuroscience",
        "cryptography", "encryption", "network", "cybersecurity", "database",
        "machine learning", "artificial intelligence", "data science", "signal",
        "semiconductor", "nanotechnology", "blockchain", "programming", "software",
    ],
    "chalkboard": [
        "math", "mathematics", "calculus", "algebra", "geometry", "trigonometry",
        "statistics", "probability", "linear algebra", "differential", "integral",
        "number theory", "combinatorics", "derivative", "equation", "formula",
        "theorem", "proof", "vector", "matrix", "set theory", "arithmetic",
        "fraction", "polynomial", "logarithm", "series", "sequence",
    ],
    "kinetic": [
        "business", "marketing", "sales", "finance", "investing", "entrepreneurship",
        "startup", "management", "leadership", "negotiation", "branding", "growth",
        "accounting", "economics", "strategy", "productivity", "communication",
        "persuasion", "influence", "decision", "career", "job", "interview",
        "money", "wealth", "stock", "trading", "venture", "corporate", "art of",
    ],
    "organic": [
        "health", "wellness", "nutrition", "meditation", "yoga", "fitness",
        "psychology", "mental health", "mindfulness", "therapy", "biology",
        "diet", "sleep", "stress", "anxiety", "habit", "happiness", "emotion",
        "breathing", "nature", "plant", "body", "brain", "memory", "focus",
        "self", "relationship", "parenting", "grief", "trauma", "healing",
    ],
    "cinematic": [
        "history", "culture", "language", "literature", "arts", "music",
        "geography", "philosophy", "sociology", "anthropology", "film",
        "writing", "storytelling", "journalism", "war", "empire", "revolution",
        "ancient", "medieval", "roman", "greek", "republic", "civilization",
        "fall of", "rise of", "world war", "cold war", "colonial", "dynasty",
        "renaissance", "enlightenment", "mythology", "religion", "society",
        "political", "democracy", "monarchy", "documentary", "biography",
    ],
}

def detect_theme(course_title: str) -> str:
    """Pick the best visual theme based on course title keywords."""
    title_lower = course_title.lower()
    for theme, keywords in _THEME_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            return theme
    return "neural"  # default


# ── NVIDIA LLM (OpenAI-compatible) ─────────────────────────────────────────

CURRICULUM_PROMPT = """\
You are a world-class practical skills trainer. Build a video course for everyday people in Africa —
business owners, students, market traders, teachers — who have NEVER studied technology.

Output valid JSON ONLY. No markdown fences, no explanation text. Start your reply with {{ and end with }}.

Course title: "{title}"
Structure: {n_modules} modules, {n_lessons} lessons per module, exactly 7 slides per lesson.

════ NON-NEGOTIABLE RULES ════
• NO jargon ever: never write algorithm, neural network, machine learning, NLP, model, dataset
• Every lesson answers ONE question: "How do I use this TODAY to earn money or save time?"
• Tools must be real and free right now: ChatGPT (chat.openai.com), Google Gemini, Canva AI, WhatsApp
• Examples must be African and specific:
    - Amara sells fabric in Lagos and needs WhatsApp captions
    - Kofi runs a phone repair shop in Accra and answers customer questions
    - Fatima writes invoices in French for her clients in Dakar
    - Blessing wants to advertise her food business on Instagram
• Narration tone: warm, encouraging, direct — as if a knowledgeable friend is sitting next to you
• Each narration MUST be 50–70 words (roughly 35–45 seconds of speech at normal pace)
• Steps in walkthrough: plain English, action-first, specific (e.g. "Open chat.openai.com on your phone")
• example_prompt values: must be realistic, specific to an African business context, ready to copy-paste
• ai_response values: must be a realistic, helpful, short AI reply (2–4 sentences max)

════ EXACT SLIDE ORDER (7 slides per lesson) ════

Slide 1 · type "title"
  heading: the lesson title (engaging, benefit-focused)
  subheading: "Module N · Lesson N"
  narration: 50–70 words — welcome the learner, state the one skill they'll have by the end

Slide 2 · type "hook"
  heading: the problem this lesson solves — phrased as a frustrated question
    e.g. "Spending 3 hours writing the same message to every customer?"
  story: one vivid sentence — an African character, their exact struggle, and the time/money cost
    e.g. "Amara spends 2 hours every night typing individual WhatsApp messages to 80 fabric customers in Lagos."
  narration: 50–70 words — tell the story, build empathy, then promise a solution in this lesson

Slide 3 · type "content"
  heading: "What [Tool Name] Can Do For You"
  bullets: 4 short benefit statements, verb-first, max 10 words each
  narration: 50–70 words — explain the tool in plain language with a simple analogy

Slide 4 · type "walkthrough"
  heading: "Step By Step — Let's Do It Together"
  steps: exactly 5 numbered strings — each is a complete, action-first instruction
    e.g. "Open your phone browser and go to chat.openai.com"
  example_prompt: the exact text to paste into the AI — African context, 1–2 sentences
  ai_response: a realistic short AI reply to that exact prompt — 2–4 sentences
  narration: 160–220 words — walk through EACH of the 5 steps one by one, slowly and clearly. For each step say what to do, what the learner will see, and what to expect next. Pause in your narration between steps. This is the most important slide — take your time so no learner is left behind.

Slide 5 · type "example"
  heading: "[Character from slide 2]'s Real Result"
  bullets: 4 bullets showing the before/after transformation for the African character — specific and concrete
  narration: 50–70 words — narrate what changed for this person after using the tool today

Slide 6 · type "practice"
  heading: "Your Turn — Do It Right Now"
  task: one clear instruction telling them exactly what to open and do
    e.g. "Open ChatGPT on your phone and type the prompt below"
  example_prompt: a personalised prompt for the learner to copy — African context, their own business/life
  timer_seconds: 120
  narration: 50–70 words — encourage them to pause the video, try it, and come back to share the result

Slide 7 · type "summary"
  heading: "What You Learned Today"
  bullets: 4 complete-sentence takeaways — each actionable, starting with "You can now..."
  narration: 50–70 words — celebrate what they learned, tell them the one thing to do before tomorrow

════ JSON SCHEMA ════
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
              "subheading": "Module 1 · Lesson 1",
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "hook",
              "heading": "...",
              "story": "One vivid sentence about an African character and their struggle.",
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "content",
              "heading": "What ChatGPT Can Do For You",
              "bullets": ["Verb-first benefit 1", "Verb-first benefit 2", "Verb-first benefit 3", "Verb-first benefit 4"],
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "walkthrough",
              "heading": "Step By Step — Let's Do It Together",
              "steps": [
                "Open chat.openai.com on your phone or laptop",
                "Click Sign Up and create a free account",
                "You will land on the chat page — see the text box at the bottom",
                "Type or paste your prompt and press the send button",
                "Read the reply — copy what is useful and paste it into WhatsApp or Word"
              ],
              "example_prompt": "I sell fresh tomatoes in Accra market. Write me 3 short WhatsApp messages to tell my regular customers about today's fresh delivery.",
              "ai_response": "Here are 3 WhatsApp messages for your customers: 1) 'Good morning! Fresh tomatoes just arrived at my stall today — come early before they finish!' 2) 'Special delivery today! Big, fresh tomatoes at the usual price. WhatsApp me to reserve yours.' 3) 'Your favourite tomatoes are back! Fresh batch this morning — first come, first served!'",
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "example",
              "heading": "...'s Real Result",
              "bullets": ["Before: ...", "After: ...", "Time saved: ...", "What she did next: ..."],
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "practice",
              "heading": "Your Turn — Do It Right Now",
              "task": "Open ChatGPT on your phone and type the prompt below",
              "example_prompt": "I [describe your business or job]. Write me 3 [WhatsApp messages / Instagram captions / reply messages] about [what you are selling or doing today].",
              "timer_seconds": 120,
              "narration": "50–70 word narration here..."
            }},
            {{
              "type": "summary",
              "heading": "What You Learned Today",
              "bullets": [
                "You can now use ChatGPT to write messages in seconds instead of hours.",
                "You know the exact steps to open the tool and type a prompt.",
                "You have a ready-to-use prompt template for your own business.",
                "You saved time today — use this every day to stay ahead."
              ],
              "narration": "50–70 word narration here..."
            }}
          ]
        }}
      ]
    }}
  ]
}}
"""


def _llm_call(prompt: str, max_tokens: int = 8000) -> str:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )
    response = client.chat.completions.create(
        model="meta/llama-3.3-70b-instruct",
        messages=[
            {"role": "system", "content": "You are a curriculum design expert. Output only valid JSON, nothing else. Start with { and end with }."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.7,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


# One-module prompt — one LLM call per module to stay within token limits
MODULE_PROMPT = """\
You are building one module for a VIDEO COURSE titled "{course_title}".
Audience: anyone who wants to learn this topic — students, workers, professionals, beginners.
Output valid JSON ONLY. No markdown. No explanation. Start with {{ and end with }}.

Module {module_num} of {n_modules}. This module has {n_lessons} lessons.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — NARRATION LENGTH (most critical rule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each narration field MUST be 120–150 words of natural spoken teaching.
This is non-negotiable. Short narrations produce short videos. The target is 5–7 minutes per lesson.
A 7-slide lesson needs ~130 words per slide to reach 6 minutes at normal speaking pace.

COUNT: a 130-word narration spoken at 130 words per minute = exactly 60 seconds per slide × 7 slides = 7 minutes.

CORRECT example (count these words — there are 128):
"Welcome to this lesson. Today we are going to cover something that will genuinely save you time and
help you get better results in everything you do. A lot of people struggle with this topic not because
it is hard, but because nobody ever showed them the right approach. By the time this lesson is over,
you will have a clear method you can use immediately — no waiting, no guessing. We are going to walk
through it step by step together. I will explain what it is, show you exactly how to do it, give you
a real example so you can see it working, and then give you a chance to try it yourself right now.
Let us get started — this is going to be a good one."

WRONG example (too short — only 18 words — DO NOT do this):
"Welcome to this lesson. Today you will learn how to use this skill effectively."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — CONTENT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Universal content — no country-specific references, no regional names or places
• Use generic relatable characters: "a small business owner", "a student", "a teacher", "someone who..."
• The lesson topic drives ALL examples — adapt every step and example to the actual subject matter
• Plain language only — no jargon, no technical terms unless the course is specifically about that topic
• Steps in walkthrough: clear, action-first, numbered, specific to what the learner actually does
• example_prompt: something the learner would realistically use right now for this exact topic
• ai_response / result: what the learner sees or gets — realistic, 2–4 sentences, genuinely useful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE STRUCTURE — exactly 7 slides per lesson
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Slide 1 · type "title"
  heading: lesson title
  subheading: "Module {module_num} · Lesson N"
  narration: 120–150 words — welcome + what they will achieve + why it matters today

Slide 2 · type "hook"
  heading: the exact problem this lesson solves, phrased as a frustrated question
  story: one sentence — a relatable person, their specific struggle, and what it costs them
  narration: 120–150 words — tell their story fully, build empathy, promise the solution

Slide 3 · type "content"
  heading: "What [Skill / Concept] Does For You"
  bullets: 4 short benefit statements, verb-first, max 10 words each
  visual_hint: pick ONE — the visual shape must match the idea shape:
    "timeline"  — sequential steps, ordered events, historical progression
    "cycle"     — circular/repeating process (seasons, feedback loops, business cycles)
    "stats"     — key numbers, percentages, measurable results (use when bullets contain digits)
    "default"   — concepts, ideas, benefits, comparisons (mind map)
  narration: 120–150 words — explain the concept with a clear analogy, no jargon

Slide 4 · type "walkthrough"
  heading: "Step By Step — Let us Do It Together"
  steps: exactly 5 numbered strings — plain English, action-first, specific
  example_prompt: the exact thing the learner types, clicks, or does — specific to this topic
  ai_response: what they get back — realistic 2–4 sentence result
  narration: 200–260 words — this is the most important slide. Walk through EACH of the 5 steps one by one. For every step: say what to do, describe exactly what the learner sees on screen, and tell them what to expect next before moving on. Speak slowly and clearly as if guiding someone who has never done this before. Do not rush — each step deserves its own moment.

Slide 5 · type "example"
  heading: "A Real Example"
  bullets: 4 bullets — before situation, after result, specific improvement, what to do next
  narration: 120–150 words — concrete story of someone using this skill and what changed

Slide 6 · type "practice"
  heading: "Your Turn — Do It Right Now"
  task: one clear instruction — what to open, what to do
  example_prompt: a ready-to-use prompt or task the learner can do right now with their own situation
  timer_seconds: 120
  narration: 120–150 words — encourage them to pause, try it, and come back with a result

Slide 7 · type "summary"
  heading: "What You Learned Today"
  bullets: 4 complete sentences starting with "You can now..."
  narration: 120–150 words — recap the skill, celebrate progress, give one action for today

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{
  "title": "Module title",
  "description": "One sentence about this module.",
  "order_index": {module_index},
  "lessons": [
    {{
      "title": "Lesson title",
      "order_index": 0,
      "slides": [
        {{
          "type": "title",
          "heading": "Lesson title",
          "subheading": "Module {module_num} · Lesson 1",
          "narration": "WRITE 120–150 WORDS HERE. Welcome the learner warmly. Tell them exactly what they will be able to do by the end of this lesson. Explain why this matters in their daily life or work. Tell them what the lesson covers: the concept, a step-by-step demonstration, a real example, and a hands-on exercise. Build anticipation. End with energy."
        }},
        {{
          "type": "hook",
          "heading": "Still doing [specific task] the slow, frustrating way?",
          "story": "Picture someone who [vivid specific struggle — what they do manually, how long it takes, what it costs them].",
          "narration": "WRITE 120–150 WORDS HERE. Open by painting the picture of that struggle in detail — what does their day look like, what does it feel like, what are they missing out on because of this problem? Make the learner nod and say 'that is me.' Then shift — tell them there is a better way, a clear method, and they are about to learn it. End with: 'That is exactly what this lesson is about.'"
        }},
        {{
          "type": "content",
          "heading": "What [Skill or Concept] Does For You",
          "bullets": ["Specific benefit 1", "Specific benefit 2", "Specific benefit 3", "Specific benefit 4"],
          "visual_hint": "default",
          "narration": "WRITE 120–150 WORDS HERE. Explain the skill or concept clearly using a simple analogy that anyone can picture. Describe what it does, why it works, and what becomes possible when you use it. Connect each bullet point to something the learner cares about. Do not use jargon. Speak conversationally as if explaining to a friend. End with a sentence that creates excitement for the next slide."
        }},
        {{
          "type": "walkthrough",
          "heading": "Step By Step — Let us Do It Together",
          "steps": [
            "Step 1: [specific first action]",
            "Step 2: [specific second action]",
            "Step 3: [specific third action — the key input or decision]",
            "Step 4: [specific fourth action — where the result happens]",
            "Step 5: [specific fifth action — reading, saving, applying the result]"
          ],
          "example_prompt": "The exact text, question, or instruction the learner uses — specific to this lesson topic.",
          "ai_response": "The realistic result they get — specific, useful, 2–4 sentences.",
          "narration": "WRITE 120–150 WORDS HERE. Walk through each step as if you are right next to the learner watching their screen. Describe what they see at each step, what to look for, what to do when something appears. Make it feel live and immediate. For steps 3 and 4, slow down and be extra clear — this is where people usually get confused. Describe the result they will see. End with encouragement."
        }},
        {{
          "type": "example",
          "heading": "A Real Example — See It Working",
          "bullets": [
            "Before: [the starting situation — specific]",
            "After: [the result — specific and measurable]",
            "Improvement: [what changed — time, quality, confidence, money]",
            "Next step: [what they did with the result]"
          ],
          "narration": "WRITE 120–150 WORDS HERE. Tell a concrete story of a real person using this skill. Be specific about their situation before and after. Describe the moment it clicked for them. Show the actual result in detail — what they got, how long it took, what they did with it. Connect this back to the learner: 'You can get the exact same result.' End by transitioning to the practice slide."
        }},
        {{
          "type": "practice",
          "heading": "Your Turn — Do It Right Now",
          "task": "Pause this video, [open / go to / take out] [specific resource], and [specific action]",
          "example_prompt": "A ready-to-use prompt or task — personalised with placeholders like [your topic] or [your goal] so any learner can adapt it.",
          "timer_seconds": 120,
          "narration": "WRITE 120–150 WORDS HERE. Tell the learner to pause the video right now — be direct about it. Explain exactly what to do: open this, copy that, type this, see what happens. Tell them the timer gives them two minutes but they can take more. Reassure them that it is okay if the first attempt is imperfect — the point is to try. Build up the importance of doing it now rather than later. End by telling them you will be right here when they come back and you will recap everything they just did."
        }},
        {{
          "type": "summary",
          "heading": "What You Learned Today",
          "bullets": [
            "You can now [specific skill from this lesson].",
            "You know [the key concept or method taught].",
            "You have [what they created or practiced].",
            "Your next step: [one specific action to take today]."
          ],
          "narration": "WRITE 120–150 WORDS HERE. Celebrate what the learner just accomplished — name the specific skill they learned. Walk through the 4 bullet points and explain why each one matters. Remind them that most people never learn this — they now have an advantage. Give them one specific thing to do before the end of today to reinforce this skill. Build excitement for the next lesson by hinting at what is coming. End warmly and encouragingly."
        }}
      ]
    }}
  ]
}}
"""

# ── Math course detection ──────────────────────────────────────────────────

_MATH_KEYWORDS = {
    'math', 'maths', 'algebra', 'calculus', 'geometry', 'trigonometry',
    'equation', 'equations', 'formula', 'arithmetic', 'statistics',
    'probability', 'vector', 'matrix', 'matrices', 'differential',
    'integral', 'polynomial', 'quadratic', 'linear', 'logarithm',
    'exponential', 'sequence', 'fraction', 'number', 'theorem',
    'proof', 'solve', 'calculate', 'derivative', 'function', 'graph',
    'coordinate', 'binomial', 'factorial', 'permutation', 'combination',
    'rational', 'irrational', 'complex', 'imaginary', 'parabola',
    'hyperbola', 'ellipse', 'circle', 'triangle', 'angle', 'sine',
    'cosine', 'tangent', 'pythagoras', 'euclid', 'limit', 'infinity',
}

def _is_math_course(title: str) -> bool:
    words = set(title.lower().split())
    return bool(words & _MATH_KEYWORDS)


# ── Math module prompt (replaces walkthrough with worked_example) ──────────

MATH_MODULE_PROMPT = MODULE_PROMPT + """

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATHEMATICS OVERRIDE — READ THIS CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a MATHEMATICS course. Apply ALL three overrides below.

────────────────────────────────────────────
OVERRIDE A · Slide 3 (content) — ANIMATED GRAPH
────────────────────────────────────────────
If the concept has a clear graphical form (parabola, sine wave, line, exponential,
circle, etc.), add visual_hint: "graph" and a graph_data block to Slide 3.

graph_data fields (all required when visual_hint is "graph"):
  x_range: [min_x, max_x]   — e.g. [-4, 4]
  y_range: [min_y, max_y]   — include some padding above/below the function range
  points: array of at least 20 {{x, y}} objects, evenly spaced across x_range
           — these are the sampled values of the function; MORE points = smoother curve
  key_points: 2–4 {{x, y, label}} objects — vertices, zeros, maxima, minima
              e.g. {{"x": 0, "y": 0, "label": "Origin"}}
  function_label: the equation string — e.g. "y = x²" or "f(x) = sin(x)"
  x_label: "x"  (or θ, t, n, etc.)
  y_label: "y"  (or f(x), etc.)
  shade_under: true ONLY when the concept is integration / area under curve

Example for y = x² over [-3, 3]:
{{
  "visual_hint": "graph",
  "graph_data": {{
    "x_range": [-3, 3],
    "y_range": [-0.5, 9.5],
    "points": [
      {{"x": -3.0, "y": 9.0}}, {{"x": -2.7, "y": 7.29}}, {{"x": -2.4, "y": 5.76}},
      {{"x": -2.1, "y": 4.41}}, {{"x": -1.8, "y": 3.24}}, {{"x": -1.5, "y": 2.25}},
      {{"x": -1.2, "y": 1.44}}, {{"x": -0.9, "y": 0.81}}, {{"x": -0.6, "y": 0.36}},
      {{"x": -0.3, "y": 0.09}}, {{"x": 0.0, "y": 0.0}},  {{"x": 0.3, "y": 0.09}},
      {{"x": 0.6, "y": 0.36}}, {{"x": 0.9, "y": 0.81}},  {{"x": 1.2, "y": 1.44}},
      {{"x": 1.5, "y": 2.25}}, {{"x": 1.8, "y": 3.24}},  {{"x": 2.1, "y": 4.41}},
      {{"x": 2.4, "y": 5.76}}, {{"x": 2.7, "y": 7.29}},  {{"x": 3.0, "y": 9.0}}
    ],
    "key_points": [
      {{"x": 0, "y": 0, "label": "Vertex (0,0)"}},
      {{"x": -2, "y": 4, "label": "(-2, 4)"}},
      {{"x": 2, "y": 4, "label": "(2, 4)"}}
    ],
    "function_label": "y = x²",
    "x_label": "x",
    "y_label": "y",
    "shade_under": false
  }}
}}

────────────────────────────────────────────
OVERRIDE B · Slide 4 — WORKED EXAMPLE (unchanged)
────────────────────────────────────────────
Replace Slide 4 (type "walkthrough") with type "worked_example".

  heading: "Let Us Solve It — Step By Step"
  math_steps: 4 to 6 steps showing the complete mathematical working.
    — Use clear Unicode math: x², x³, √, ±, π, θ, ÷, ×, ≠, ≤, ≥, ∞, Σ
    — Write fractions as (numerator) / (denominator)
    — annotation: max 6 words explaining what was done in that step
    — highlight: true ONLY on the very last step (the final answer)
  narration: 120–150 words — talk through every step as if writing on a board

Example math_steps for "Solve x² + 5x + 6 = 0":
[
  {{ "expression": "x² + 5x + 6 = 0",          "annotation": "Start with the equation" }},
  {{ "expression": "Find two numbers: 2 and 3",  "annotation": "Multiply to 6, add to 5" }},
  {{ "expression": "(x + 2)(x + 3) = 0",        "annotation": "Factorise" }},
  {{ "expression": "x + 2 = 0  or  x + 3 = 0",  "annotation": "Set each factor to zero" }},
  {{ "expression": "x = -2  or  x = -3",         "annotation": "Final answers", "highlight": true }}
]

────────────────────────────────────────────
OVERRIDE C · Slide 5 — QUIZ CHECKPOINT (NEW — insert between worked_example and example)
────────────────────────────────────────────
Add a NEW slide of type "quiz" as slide 5. Total slides become 8 for math lessons.
This checkpoint tests whether the learner understood the worked example.

  heading: one direct math question testing the worked_example — e.g. "If x = 4, what is 3x² − 2x?"
  quiz_options: exactly 4 objects, each with "text" and "correct" (boolean).
    — Exactly ONE must have "correct": true
    — The 3 wrong answers must be plausible: common sign errors, arithmetic slips, wrong operation
    — All answers must be concise (under 12 words)
  narration: 60–90 words — pose the question, give 2 seconds to think, then reveal the answer
             and explain in plain words WHY it is correct and where the wrong answers go astray

Example quiz slide:
{{
  "type": "quiz",
  "heading": "If x = 3, what is x² + 2x − 1?",
  "quiz_options": [
    {{"text": "14",  "correct": true}},
    {{"text": "12",  "correct": false}},
    {{"text": "16",  "correct": false}},
    {{"text": "8",   "correct": false}}
  ],
  "narration": "Here is your checkpoint. Pause for a moment and work it out. x equals 3, so x squared is 9. Then 2 times x is 6. Add them together: 9 plus 6 is 15. Subtract 1 and you get 14. The answer is 14. If you chose 12, you may have forgotten to subtract 1. If you got 8, check that you squared x first before multiplying."
}}

Slide order for math lessons:
1. title  2. hook  3. content (with graph)  4. worked_example  5. quiz  6. example  7. practice  8. summary
"""



# ── Cinematic module prompt (documentary / historical courses) ─────────────

CINEMATIC_MODULE_PROMPT = MODULE_PROMPT + """

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENTARY / HISTORICAL COURSE OVERRIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a HISTORY / DOCUMENTARY course. Apply the override below to every slide.

For EVERY slide in the lesson, add these four optional fields alongside the normal slide fields:

  scene_type:     One of "portrait" | "map" | "building" | "crowd" | "event"
                  Choose the type that best matches the slide's content:
                    "portrait"  — for individual people, thinkers, leaders, rulers
                    "map"       — for geography, trade routes, empires, exploration
                    "building"  — for architecture, institutions, monuments, cities
                    "crowd"     — for social movements, armies, protests, populations
                    "event"     — for battles, discoveries, turning points, moments of change

  scene_caption:  A concise label shown in the visual frame.
                  For portraits: "Name · Birth–Death" e.g. "Isaac Newton · 1643–1727"
                  For places/events: a short evocative description e.g. "Timbuktu, Mali" or "The Signing of the Treaty"

  scene_era:      The historical period as a short string e.g. "1687" | "15th Century" | "Age of Exploration"

  scene_location: The place name (city, country, region) e.g. "Cambridge, England" | "West Africa" | "Constantinople"

These fields drive animated SVG illustrations — portraits, maps with animated routes,
buildings that draw themselves, crowd scenes — shown alongside the narration as documentary b-roll.

Example for a slide about Isaac Newton:
{{
  "type": "content",
  "heading": "Newton's Laws of Motion",
  "scene_type": "portrait",
  "scene_caption": "Isaac Newton · 1643–1727",
  "scene_era": "1687",
  "scene_location": "Cambridge, England",
  ...other fields...
}}

Example for a slide about the Silk Road:
{{
  "type": "content",
  "heading": "The Silk Road — East Meets West",
  "scene_type": "map",
  "scene_caption": "Trade Routes of the Silk Road",
  "scene_era": "2nd Century BCE – 15th Century CE",
  "scene_location": "Central Asia",
  ...other fields...
}}

IMPORTANT: Include scene_type, scene_caption, scene_era, and scene_location on EVERY slide
(including title, hook, summary). Pick whichever scene_type makes the slide most visually alive.
"""


def generate_curriculum(title: str, n_modules: int, n_lessons: int) -> dict:
    is_math      = _is_math_course(title)
    is_cinematic = detect_theme(title) == "cinematic"
    if is_math:
        print(f"   📐 Math course detected — using worked_example slides")
    if is_cinematic:
        print(f"   🎬 Cinematic/history course detected — adding documentary scene fields")
    modules = []
    for m_idx in range(n_modules):
        print(f"  Generating module {m_idx + 1}/{n_modules}...")
        if is_math:
            base_prompt = MATH_MODULE_PROMPT
        elif is_cinematic:
            base_prompt = CINEMATIC_MODULE_PROMPT
        else:
            base_prompt = MODULE_PROMPT
        prompt = base_prompt.format(
            course_title=title,
            module_index=m_idx,
            module_num=m_idx + 1,
            n_modules=n_modules,
            n_lessons=n_lessons,
        )
        for attempt in range(3):
            try:
                text = _llm_call(prompt, max_tokens=8000)
                module = _parse_json(text)
                module = _validate_and_fix_narrations(module)
                modules.append(module)
                break
            except Exception as e:
                if attempt == 2:
                    raise RuntimeError(f"Module {m_idx + 1} failed after 3 attempts: {e}") from e
                print(f"    Retrying module {m_idx + 1} (attempt {attempt + 2}/3)...")
                time.sleep(3)
        time.sleep(float(os.getenv("LLM_CALL_INTERVAL", "3")))

    return {
        "course_title":       title,
        "course_description": f"A practical video course on {title}.",
        "modules":            modules,
    }


def _parse_json(text: str) -> dict:
    text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text.strip(), flags=re.MULTILINE)
    return json.loads(text.strip())


NARRATION_FIX_PROMPT = """\
The following lesson slide has a narration that is too short (only {word_count} words).
A narration must be 120–150 words — enough for roughly 55–65 seconds of speech.

Rewrite ONLY the narration field for this slide. Return ONLY the new narration text — no JSON,
no explanation, no quotes around it. Just the spoken paragraph, 120–150 words.

Slide type: {slide_type}
Slide heading: {heading}
Current (too short) narration: {narration}

Write a full 120–150 word narration for this slide now:"""


def _fix_short_narration(slide: dict) -> str:
    """Re-ask the LLM for a longer narration for a single slide that came back too short."""
    prompt = NARRATION_FIX_PROMPT.format(
        word_count=len(slide.get("narration", "").split()),
        slide_type=slide.get("type", "content"),
        heading=slide.get("heading", ""),
        narration=slide.get("narration", ""),
    )
    from openai import OpenAI
    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_API_KEY)
    resp = client.chat.completions.create(
        model="meta/llama-3.3-70b-instruct",
        messages=[
            {"role": "system", "content": "You write narration scripts for educational videos. Output only the narration text — no JSON, no quotes."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=400,
    )
    return resp.choices[0].message.content.strip()


def _validate_and_fix_narrations(module: dict) -> dict:
    """Check every slide narration. If under 90 words, request a longer version."""
    MIN_WORDS = 90
    for lesson in module.get("lessons", []):
        for slide in lesson.get("slides", []):
            narration = slide.get("narration", "")
            wc = len(narration.split())
            if wc < MIN_WORDS:
                slide_type = slide.get("type", "?")
                print(f"    ✏  '{slide_type}' narration too short ({wc} words) — expanding...")
                try:
                    slide["narration"] = _fix_short_narration(slide)
                    new_wc = len(slide["narration"].split())
                    print(f"       → {new_wc} words")
                    time.sleep(1)
                except Exception as e:
                    print(f"       ⚠ Could not fix narration: {e}")
    return module


# ── Thumbnail generation ───────────────────────────────────────────────────

THUMB_PROMPTS = [
    "A person smiling and using a laptop or smartphone, learning online, warm natural light, "
    "photo-realistic, soft background bokeh, professional educational feel",
    "Friendly instructor explaining something on a whiteboard or tablet, warm lighting, "
    "realistic photo, professional setting, engaging and approachable",
    "A student or professional working on a computer with a focused happy expression, "
    "modern office or cafe, natural light, photorealistic",
]

def generate_thumbnail(lesson_title: str, module_title: str, out_path: str) -> bool:
    """Generate a photorealistic instructor-style thumbnail via NVIDIA Image API.
    Falls back to a Pillow-generated card if API fails or key is missing.
    Returns True on success."""
    if NVIDIA_IMAGE_KEY:
        try:
            import random
            base_prompt = random.choice(THUMB_PROMPTS)
            prompt = f"{base_prompt}. Topic: {lesson_title}."
            negative = "logo, watermark, brand, dark theme, cartoon, Nest, letter N, text overlay"
            resp = requests.post(
                "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl",
                headers={
                    "Authorization": f"Bearer {NVIDIA_IMAGE_KEY}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json={
                    "text_prompts": [
                        {"text": prompt, "weight": 1.0},
                        {"text": negative, "weight": -1.0},
                    ],
                    "cfg_scale": 7.0,
                    "seed": 0,
                    "sampler": "K_DPM_2_ANCESTRAL",
                    "steps": 25,
                },
                timeout=90,
            )
            if resp.status_code == 200:
                data = resp.json()
                img_b64 = data["artifacts"][0]["base64"]
                img_bytes = base64.b64decode(img_b64)
                with open(out_path, "wb") as f:
                    f.write(img_bytes)
                return True
            else:
                print(f"    ⚠ Image API {resp.status_code}: {resp.text[:120]} — using Pillow fallback")
        except Exception as e:
            print(f"    ⚠ Image API error ({e}) — using Pillow fallback")

    return _pillow_thumbnail(lesson_title, module_title, out_path)


def _pillow_thumbnail(lesson_title: str, module_title: str, out_path: str) -> bool:
    try:
        from PIL import Image, ImageDraw, ImageFont

        W, H = 1280, 720
        # Warm gradient background (not Nest dark)
        img = Image.new("RGB", (W, H))
        draw = ImageDraw.Draw(img)

        # Warm gradient: deep teal → warm amber
        for y in range(H):
            t = y / H
            r = int(20  + t * 180)
            g = int(80  + t * 100)
            b = int(120 - t * 60)
            draw.line([(0, y), (W, y)], fill=(r, g, b))

        # Decorative circles (organic, human feel)
        draw.ellipse([W - 300, -100, W + 100, 300], fill=(255, 180, 60, 80))
        draw.ellipse([-80, H - 200, 220, H + 80], fill=(60, 200, 180, 60))

        # Module label
        try:
            font_lg = ImageFont.truetype("arial.ttf", 44)
            font_sm = ImageFont.truetype("arial.ttf", 32)
        except Exception:
            font_lg = ImageFont.load_default()
            font_sm = font_lg

        # Module tag
        tag_pad = 18
        tag_text = module_title[:50]
        bbox = draw.textbbox((0, 0), tag_text, font=font_sm)
        tag_w = bbox[2] - bbox[0] + tag_pad * 2
        draw.rounded_rectangle([60, 60, 60 + tag_w, 60 + 50], radius=10, fill=(255, 255, 255, 40))
        draw.text((60 + tag_pad, 68), tag_text, font=font_sm, fill=(255, 255, 255))

        # Main title (word-wrap at ~28 chars per line)
        words = lesson_title.split()
        lines, cur = [], ""
        for w in words:
            test = (cur + " " + w).strip()
            if len(test) > 28 and cur:
                lines.append(cur)
                cur = w
            else:
                cur = test
        if cur:
            lines.append(cur)

        y_start = H // 2 - len(lines) * 56 // 2
        for line in lines:
            draw.text((60, y_start), line, font=font_lg, fill=(255, 255, 255))
            y_start += 62

        # Bottom bar
        draw.rectangle([0, H - 8, W, H], fill=(255, 180, 60))

        img.save(out_path, "JPEG", quality=92)
        return True
    except ImportError:
        print("    ⚠ Pillow not installed — skipping thumbnail")
        return False
    except Exception as e:
        print(f"    ⚠ Thumbnail error: {e}")
        return False


# ── Lesson description ─────────────────────────────────────────────────────

def get_lesson_description(lesson: dict) -> str:
    """Build a 2-3 sentence description from the lesson's slide narrations."""
    slides = lesson.get("slides", [])
    parts = []
    for slide in slides:
        narration = slide.get("narration", "").strip()
        if narration and slide.get("type") in ("content", "example", "title"):
            parts.append(narration)
        if len(parts) >= 2:
            break
    if not parts:
        parts = [s.get("narration", "") for s in slides[:2] if s.get("narration")]
    combined = " ".join(parts)
    # Trim to ~400 chars at sentence boundary
    if len(combined) > 400:
        cut = combined[:400].rfind(".")
        combined = combined[:cut + 1] if cut > 200 else combined[:400] + "..."
    return combined


# ── TTS text cleaning + per-type prosody settings ─────────────────────────

def _clean_tts_text(narration: str) -> str:
    """Strip markdown and fix punctuation so TTS reads cleanly."""
    text = narration.strip()

    # Markdown: unwrap formatted spans first (order matters — ** before *)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*',     r'\1', text)
    text = re.sub(r'_(.+?)_',       r'\1', text)
    text = re.sub(r'`(.+?)`',       r'\1', text)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)   # [link text](url) → link text

    # Strip any leftover bare symbols after the above
    text = re.sub(r'\*+', '', text)           # stray * or **
    text = re.sub(r'(?m)^#{1,6}\s*', '', text)  # # headings
    text = re.sub(r'(?m)^>\s*', '', text)     # > blockquotes
    text = re.sub(r'(?m)^\s*[-•·]\s+', '', text)  # bullet prefixes

    # Double-slash (reads as "slash slash" or "forward slash forward slash")
    text = re.sub(r'//', ' ', text)

    # Dashes and ellipsis
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s*—\s*', ', ', text)
    text = re.sub(r'\s*--\s*', ', ', text)

    # Single slash between words → "or"
    text = re.sub(r'(?<=\w)\s*/\s*(?=\w)', ' or ', text)

    # Common abbreviations
    text = text.replace('e.g.', 'for example')
    text = text.replace('i.e.', 'that is')
    text = text.replace('etc.', 'and so on')
    text = text.replace('vs.', 'versus')

    # Strip any remaining XML/HTML tags (e.g. <break time="500ms"/> from old runs)
    text = re.sub(r'<[^>]+>', ' ', text)

    # Collapse any double spaces left over
    text = re.sub(r' {2,}', ' ', text).strip()
    return text


# Per-type rate/pitch for edge-tts Communicate() native parameters
# rate: e.g. "-10%" slows down, "+5%" speeds up (relative to voice default)
# pitch: e.g. "-5Hz" lowers, "+3Hz" raises
_TTS_PROSODY = {
    "title":         ("-7%",  "+0Hz"),
    "hook":          ("-12%", "-3Hz"),
    "content":       ("-8%",  "+0Hz"),
    "walkthrough":   ("-15%", "-3Hz"),
    "worked_example":("-15%", "-3Hz"),
    "example":       ("-9%",  "+0Hz"),
    "practice":      ("+0%",  "+3Hz"),
    "summary":       ("-7%",  "+0Hz"),
    "quiz":          ("-10%", "+2Hz"),
}


# ── TTS: edge-tts (free Microsoft neural voices) ──────────────────────────

async def _tts_async(text: str, output_path: str, voice: str, rate: str, pitch: str) -> list:
    """Stream TTS audio and capture word-boundary timestamps. Returns captions list."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    captions = []
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            captions.append({
                "text":        chunk["text"],
                "start_ms":    chunk["offset"] // 10000,
                "duration_ms": chunk["duration"] // 10000,
            })
    with open(output_path, "wb") as f:
        for data in audio_chunks:
            f.write(data)
    return captions


def generate_tts(narration: str, output_path: str, voice: str = EDGE_VOICE,
                 slide_type: str = "content") -> list:
    """Generate TTS audio and return word-level caption timestamps."""
    text = _clean_tts_text(narration)
    rate, pitch = _TTS_PROSODY.get(slide_type, ("-8%", "+0Hz"))
    captions = asyncio.run(_tts_async(text, output_path, voice, rate, pitch))

    # Fallback: edge-tts occasionally emits no WordBoundary events.
    # Synthesize captions from word count + actual audio duration.
    if not captions:
        duration_sec = get_audio_duration(output_path)
        words = text.split()
        if words and duration_sec > 0:
            ms_per_word = (duration_sec * 1000) / len(words)
            captions = [
                {
                    "text":        w,
                    "start_ms":    int(i * ms_per_word),
                    "duration_ms": int(ms_per_word * 0.85),
                }
                for i, w in enumerate(words)
            ]
            print(f"       ⚠ No word boundaries from TTS — synthesised {len(captions)} captions")
        else:
            print(f"       ⚠ No word boundaries and no audio duration — captions will be empty")
    else:
        print(f"       ✦ {len(captions)} caption words captured")

    return captions


# ── Per-slide contextual image (NVIDIA) ───────────────────────────────────

# Slide types that benefit from a contextual image (right-panel or background)
IMAGE_SLIDE_TYPES = {"content", "example", "hook"}

SLIDE_IMAGE_STYLE = (
    "educational illustration, professional photography style, "
    "warm natural lighting, no text, no logos, no watermarks, "
    "clean background, high quality, realistic"
)

def generate_slide_image(heading: str, slide_type: str, out_path: str) -> bool:
    """Generate a contextual image for a single slide. Returns True on success."""
    if not NVIDIA_IMAGE_KEY:
        return False
    try:
        style_map = {
            "hook":    f"person looking frustrated or overwhelmed with a task, {SLIDE_IMAGE_STYLE}",
            "content": f"person learning or working, topic: {heading}, {SLIDE_IMAGE_STYLE}",
            "example": f"person successfully completing a task, happy result, topic: {heading}, {SLIDE_IMAGE_STYLE}",
        }
        prompt   = style_map.get(slide_type, f"{heading}, {SLIDE_IMAGE_STYLE}")
        negative = "text, logo, watermark, cartoon, dark background, brand, ugly, blurry"

        resp = requests.post(
            "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl",
            headers={
                "Authorization": f"Bearer {NVIDIA_IMAGE_KEY}",
                "Accept":        "application/json",
                "Content-Type":  "application/json",
            },
            json={
                "text_prompts": [
                    {"text": prompt,   "weight": 1.0},
                    {"text": negative, "weight": -1.0},
                ],
                "cfg_scale": 7.0,
                "seed":      0,
                "sampler":   "K_DPM_2_ANCESTRAL",
                "steps":     25,
            },
            timeout=90,
        )
        if resp.status_code == 200:
            img_bytes = base64.b64decode(resp.json()["artifacts"][0]["base64"])
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            return True
        print(f"    ⚠ Slide image API {resp.status_code}: {resp.text[:80]}")
    except Exception as e:
        print(f"    ⚠ Slide image error: {e}")
    return False


# ── Background music mixer (ffmpeg post-process) ──────────────────────────

MUSIC_DIR = HERE / "music"

def mix_background_music(video_path: str, out_path: str, volume: float = 0.07) -> bool:
    """Mix a royalty-free ambient track under the video audio at low volume."""
    music_files = list(MUSIC_DIR.glob("*.mp3")) + list(MUSIC_DIR.glob("*.wav")) if MUSIC_DIR.exists() else []
    if not music_files:
        return False
    music = str(music_files[0])
    try:
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", video_path,
            "-i", music,
            "-filter_complex",
            (f"[1:a]volume={volume},aloop=loop=-1:size=2e+09[bg];"
             "[0:a][bg]amix=inputs=2:duration=first:weights=1 1[aout]"),
            "-map", "0:v:0",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            out_path,
        ]
        subprocess.run(cmd, check=True)
        return True
    except Exception as e:
        print(f"    ⚠ Music mix failed: {e}")
        return False


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
    theme: str = "neural",
) -> dict:
    """
    Generate audio for each slide, compute frame timings,
    and return the Remotion props dict.
    Audio files are saved to video/public/temp/{lesson_id}/.
    """
    audio_dir = TEMP_DIR / lesson_id
    audio_dir.mkdir(parents=True, exist_ok=True)

    slides_out = []
    current_frame = 90  # frames 0–89 reserved for cinematic lesson intro

    slides = lesson.get("slides", [])
    for i, slide in enumerate(tqdm(slides, desc="    Slides", leave=False, unit="slide")):
        narration = slide.get("narration", "").strip()
        if not narration:
            continue

        audio_filename = f"slide_{i:02d}.mp3"
        audio_path     = str(audio_dir / audio_filename)
        audio_key      = f"temp/{lesson_id}/{audio_filename}"

        slide_type = slide.get("type", "content")

        # Warn on suspiciously short narrations
        word_count = len(narration.split())
        if word_count < 40:
            print(f"    ⚠ Slide {i} ({slide.get('type')}) narration is only {word_count} words — video may feel rushed")

        # Generate TTS with SSML pacing tuned per slide type; capture word timestamps
        captions = generate_tts(narration, audio_path, slide_type=slide_type)

        # Generate contextual slide image for content/example/hook slides
        image_key = None
        if slide_type in IMAGE_SLIDE_TYPES:
            img_filename = f"slide_{i:02d}_img.jpg"
            img_path     = str(audio_dir / img_filename)
            if generate_slide_image(slide.get("heading", ""), slide_type, img_path):
                image_key = f"temp/{lesson_id}/{img_filename}"
                print(f"       ✦ Slide image generated ({slide_type})")

        # Measure duration — enforce per-type minimums so slides never rush
        duration_sec = get_audio_duration(audio_path)
        if slide_type == "walkthrough":
            step_count = len(slide.get("steps", [])) or 5
            # 10 seconds minimum per step so each one lands clearly
            min_frames = max(step_count * 10 * FPS, 40 * FPS)
        else:
            min_frames = {
                "title":         8  * FPS,
                "hook":          10 * FPS,
                "content":       12 * FPS,
                "example":       12 * FPS,
                "practice":      15 * FPS,
                "summary":       10 * FPS,
                "worked_example":14 * FPS,
                "quiz":          22 * FPS,
            }.get(slide_type, 8 * FPS)
        duration_frames = max(min_frames, int(duration_sec * FPS) + 20)

        slides_out.append({
            "type":            slide.get("type", "content"),
            "heading":         slide.get("heading", ""),
            "subheading":      slide.get("subheading"),
            "bullets":         slide.get("bullets", [])[:4],
            # walkthrough fields
            "steps":           slide.get("steps", [])[:6],
            "example_prompt":  slide.get("example_prompt"),
            "ai_response":     slide.get("ai_response"),
            # hook fields
            "story":           slide.get("story"),
            "character":       slide.get("character"),
            # practice fields
            "task":            slide.get("task"),
            "timer_seconds":   slide.get("timer_seconds", 120),
            # misc
            "code":            slide.get("code"),
            "math_steps":      slide.get("math_steps", []),
            "visual_hint":     slide.get("visual_hint", "default"),
            "graph_data":      slide.get("graph_data"),
            "quiz_options":    slide.get("quiz_options", []),
            # ── Cinematic / documentary scene fields ──
            "scene_type":      slide.get("scene_type"),
            "scene_caption":   slide.get("scene_caption"),
            "scene_era":       slide.get("scene_era"),
            "scene_location":  slide.get("scene_location"),
            "captions":        captions,
            "audio_key":       audio_key,
            "image_key":       image_key,
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
        "theme":          theme,
        "slides":         slides_out,
    }


# ── Remotion render ────────────────────────────────────────────────────────

def render_lesson(props: dict, output_path: str):
    props_file = TEMP_DIR / f"props_{uuid.uuid4().hex[:8]}.json"
    props_file.write_text(json.dumps(props))

    try:
        npx = "npx.cmd" if sys.platform == "win32" else "npx"
        cmd = [
            npx, "remotion", "render",
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
    manifest = []
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

            # Auto-detect visual theme from course title
            theme = detect_theme(curriculum["course_title"])

            # Generate audio + compute frame timings
            props = build_lesson_props(
                lesson=lesson,
                lesson_id=lesson_id,
                course_title=curriculum["course_title"],
                module_title=module["title"],
                lesson_number=lesson_counter,
                theme=theme,
            )
            print(f"    Theme: {theme}")

            duration_sec = props["total_frames"] // FPS
            print(f"    Duration: ~{duration_sec // 60}m {duration_sec % 60}s  ({len(props['slides'])} slides)")

            # Thumbnail
            thumb_path = out_dir / f"{lesson_id}_thumb.jpg"
            print(f"    Generating thumbnail...")
            generate_thumbnail(lesson["title"], module["title"], str(thumb_path))

            # Description
            description = get_lesson_description(lesson)

            # Render video
            video_path = out_dir / f"{lesson_id}.mp4"
            render_lesson(props, str(video_path))
            print(f"    ✓ Rendered → {video_path.name}")

            # Mix background music if a track exists in tools/nest-gen/music/
            music_out = out_dir / f"{lesson_id}_music.mp4"
            if mix_background_music(str(video_path), str(music_out)):
                video_path.unlink()
                music_out.rename(video_path)
                print(f"    ♪  Background music added")

            # Manifest entry
            manifest.append({
                "lesson_id":    lesson_id,
                "title":        lesson["title"],
                "module":       module["title"],
                "module_index": m_idx,
                "order_index":  l_idx,
                "description":  description,
                "video_file":   video_path.name,
                "thumbnail":    thumb_path.name if thumb_path.exists() else None,
                "duration_sec": duration_sec,
            })

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

    # Save manifest
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"\n📄 Manifest → {manifest_path}")

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
