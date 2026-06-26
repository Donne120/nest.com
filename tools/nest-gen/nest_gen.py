#!/usr/bin/env python3
"""
nest-gen — One-click AI course generator for Nest.
Uses NVIDIA LLM + Stability AI + edge-tts + Remotion to build full lesson videos.

Usage:
  # Generate from scratch (LLM invents the curriculum)
  python nest_gen.py "AI For Everyday Life"
  python nest_gen.py "AI For Everyday Life" --modules 4 --lessons 4 --dry-run

  # Generate from your own documents (each file = one module, 1 lesson)
  python nest_gen.py "Basic AI Skills for Everyday Life" --from-files ./my_course/
  python nest_gen.py "Basic AI Skills" --from-files ./docs/ --dry-run --no-upload

  Supported file types: .pdf  .docx  .txt  .md
  Required extras:  pip install pypdf python-docx
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


import requests
from dotenv import load_dotenv
from tqdm import tqdm

# ── Load config ────────────────────────────────────────────────────────────
load_dotenv()

NVIDIA_API_KEY      = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_IMAGE_KEY    = os.getenv("NVIDIA_IMAGE_KEY", "")
STABILITY_API_KEY   = os.getenv("STABILITY_API_KEY", "")
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
SLIDE STRUCTURE — exactly 8 slides per lesson
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Slide 1 · type "hook"
  heading: the exact real-world situation this lesson solves — phrased as a frustrated question
    e.g. "Still spending an hour writing the same message to every customer?"
  story: one vivid sentence — a specific person, their exact daily struggle, and the cost
    e.g. "Every evening, a small business owner types 40 individual WhatsApp messages by hand."
  narration: 120–150 words — paint the struggle in detail, make the learner say "that is me",
             then promise a clear solution is coming in this lesson

Slide 2 · type "content"
  heading: "The One Idea Behind This" (or name the concept simply)
  bullets: 4 short plain-English statements explaining WHAT the skill/concept IS
  visual_hint: pick ONE — match the shape of the idea:
    "timeline"  — ordered steps or historical sequence
    "cycle"     — repeating process or loop
    "stats"     — when bullets contain numbers or percentages
    "default"   — ideas, concepts, benefits (mind map)
  narration: 120–150 words — explain the concept with one simple analogy. No jargon.
             Make it feel obvious and achievable. End with excitement for the next slide.

Slide 3 · type "content"
  heading: "Why This Works — The Logic Behind It"
  bullets: 4 bullets explaining the REASONING — why this approach is effective, not just what it does
  visual_hint: "default" or "stats" if numbers are present
  narration: 120–150 words — explain the logic in plain language. Use a real-world comparison.
             Help learners understand WHY so they can adapt it to their own situations.

Slide 4 · type "walkthrough"
  heading: "Step By Step — Let us Do It Together"
  steps: exactly 5 numbered strings — plain English, action-first, specific
  example_prompt: the exact thing the learner types, clicks, or does — specific to this topic
  ai_response: what they get back — realistic 2–4 sentence result
  narration: 200–260 words — the most important slide. Walk through EACH of the 5 steps one by one.
             For every step: say what to do, describe what the learner sees, tell them what comes next.
             Slow down — each step deserves its own moment. This is where skills are built.

Slide 5 · type "example"
  heading: "Watch It Work — A Real Situation"
  bullets: 4 bullets — the starting situation, the exact action taken, the result, and what changed
  narration: 120–150 words — narrate a real person doing this. Be specific. Show the before and after
             in concrete detail. End with: "You can get the exact same result."

Slide 6 · type "common_mistakes"
  heading: "What Goes Wrong — And How to Avoid It"
  bullets: 4 bullets — each is a specific mistake followed by the fix, format: "Mistake: [what] → Fix: [how]"
    e.g. "Mistake: Asking too broadly → Fix: Always include your specific situation"
  narration: 120–150 words — walk through each mistake conversationally. Describe exactly how it happens
             and what the learner should do instead. Be reassuring — everyone makes these at first.

Slide 7 · type "practice"
  heading: "Your Turn — Do It Right Now"
  task: one clear instruction — exactly what to open and do, right now
  example_prompt: a ready-to-use prompt or task with [placeholders] the learner fills in
  timer_seconds: 120
  narration: 120–150 words — tell them to pause right now. Be direct. Walk through exactly what
             to do step by step. Reassure them imperfect attempts are fine. Build urgency.

Slide 8 · type "summary"
  heading: "What You Can Do Now"
  bullets: 4 complete sentences starting with "You can now..."
  narration: 120–150 words — celebrate what they just learned. Name the skill specifically.
             Give one action to take today. Hint at what is coming next. End warmly.

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
          "type": "hook",
          "heading": "Still doing [specific frustrating thing] the hard way?",
          "story": "Picture [a specific person] who [exact daily struggle — what they do, how long it takes, what it costs].",
          "narration": "WRITE 120–150 WORDS HERE. Open with their daily frustration in vivid detail. Make the learner feel it. Then shift the energy — tell them there is a clear method and they are about to learn it. End with: 'That is exactly what this lesson is about.'"
        }},
        {{
          "type": "content",
          "heading": "The One Idea: [Name the concept simply]",
          "bullets": ["What it is — plain language", "What it does", "Who uses it", "What becomes possible"],
          "visual_hint": "default",
          "narration": "WRITE 120–150 WORDS HERE. Introduce the concept with one memorable analogy. Keep it conversational. Connect to something the learner already knows. End with a line that makes the next slide feel essential."
        }},
        {{
          "type": "content",
          "heading": "Why This Works",
          "bullets": ["The core reason it works", "The logic behind step 1", "The logic behind step 2", "Why most people get results fast"],
          "visual_hint": "default",
          "narration": "WRITE 120–150 WORDS HERE. Explain the reasoning clearly. Use a comparison or real-world parallel. Help the learner feel confident — not just told what to do but understanding why. End with energy going into the step-by-step."
        }},
        {{
          "type": "walkthrough",
          "heading": "Step By Step — Let us Do It Together",
          "steps": [
            "Step 1: [specific first action — what to open or start]",
            "Step 2: [specific second action]",
            "Step 3: [the key input or decision — most important step]",
            "Step 4: [where the result appears]",
            "Step 5: [what to do with the result]"
          ],
          "example_prompt": "The exact text or action — specific to this lesson topic.",
          "ai_response": "The realistic result — specific, useful, 2–4 sentences.",
          "narration": "WRITE 200–260 WORDS HERE. Guide every step as if sitting next to the learner. Describe exactly what they see at each moment. Slow down at steps 3 and 4 — that is where most people get stuck. Describe the result they will see. End with encouragement."
        }},
        {{
          "type": "example",
          "heading": "Watch It Work — A Real Situation",
          "bullets": [
            "Situation: [who they are and what they needed]",
            "Action: [exactly what they did using this lesson's skill]",
            "Result: [specific outcome — time, money, quality]",
            "What changed: [how their work or life improved]"
          ],
          "narration": "WRITE 120–150 WORDS HERE. Tell a concrete story. Be specific about the before and after. Show the result in real detail. End with: 'You can get the exact same result — and you are about to.'"
        }},
        {{
          "type": "common_mistakes",
          "heading": "What Goes Wrong — And How to Fix It",
          "bullets": [
            "Mistake: [specific wrong thing people do] → Fix: [exact correction]",
            "Mistake: [second common error] → Fix: [exact correction]",
            "Mistake: [third common error] → Fix: [exact correction]",
            "Mistake: [fourth common error] → Fix: [exact correction]"
          ],
          "narration": "WRITE 120–150 WORDS HERE. Walk through each mistake in a friendly, non-judgmental way. Describe exactly how it happens and why. Then give the clear fix. Reassure the learner — these mistakes are normal and now they know how to avoid them."
        }},
        {{
          "type": "practice",
          "heading": "Your Turn — Do It Right Now",
          "task": "Pause this video, open [specific tool or resource], and [specific action to take]",
          "example_prompt": "A ready-to-use prompt or task with [your situation] placeholders.",
          "timer_seconds": 120,
          "narration": "WRITE 120–150 WORDS HERE. Tell them to pause right now — be direct and encouraging. Walk through exactly what to do. Remind them the timer is a guide not a pressure. Reassure them that trying imperfectly is better than not trying. Tell them you will recap everything when they return."
        }},
        {{
          "type": "summary",
          "heading": "What You Can Do Now",
          "bullets": [
            "You can now [the core skill from this lesson].",
            "You understand [the key concept and why it works].",
            "You know [the common mistakes and how to avoid them].",
            "Your next step: [one specific action to take today]."
          ],
          "narration": "WRITE 120–150 WORDS HERE. Celebrate the skill they just learned — name it specifically. Walk through the bullets and explain why each one matters. Remind them most people never learn this properly. Give one action to take before the end of today. Build excitement for the next lesson. End warmly."
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


# ── File extraction (--from-files mode) ───────────────────────────────────

def _extract_text(file_path: Path) -> str:
    """Extract plain text from PDF, DOCX, TXT, or MD files."""
    ext = file_path.suffix.lower()

    if ext in (".txt", ".md"):
        return file_path.read_text(encoding="utf-8", errors="ignore").strip()

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            return "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            ).strip()
        except ImportError:
            raise RuntimeError(
                "pypdf is required for PDF files — run: pip install pypdf"
            )

    if ext in (".docx", ".doc"):
        try:
            import docx
            doc = docx.Document(str(file_path))
            return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
        except ImportError:
            raise RuntimeError(
                "python-docx is required for Word files — run: pip install python-docx"
            )

    raise ValueError(f"Unsupported file type: {ext}  (supported: .pdf .docx .txt .md)")


def _collect_source_files(folder: Path) -> list[Path]:
    """Return all supported files in the folder, sorted by name."""
    supported = {".pdf", ".docx", ".doc", ".txt", ".md"}
    files = sorted(
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in supported
    )
    if not files:
        raise RuntimeError(f"No supported files found in {folder}")
    return files


FROM_FILES_MODULE_PROMPT = """\
You are building one module of a professional video course called "{course_title}".

Below is the SOURCE CONTENT for this module, written by the course author.
Your job is to package this content into a perfect, professional lesson video — using the author's
words, examples, tools, and exercises as your primary source. Do not invent topics not in the source.
Do expand narrations to the required length using the ideas already present.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{source_content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

The module has exactly ONE lesson with exactly 8 slides in this order:

Slide 1 · type "hook"
  heading: the exact real-world frustration this module solves — a direct question
  story: one vivid sentence — a specific person, their struggle, the cost of not knowing this
  narration: 120–150 words — open with the learner's pain in vivid detail, promise a solution,
             end with "That is exactly what this lesson is about."

Slide 2 · type "content"
  heading: name the core concept or skill simply
  bullets: 4 short plain-English statements — WHAT it is, what it does, who uses it, what becomes possible
  visual_hint: "default" | "timeline" | "cycle" | "stats"
  narration: 120–150 words — one memorable analogy, conversational, end with excitement for the next slide

Slide 3 · type "content"
  heading: "Why This Works"
  bullets: 4 bullets — the reasoning, the logic, why this approach beats alternatives
  visual_hint: "default" or "stats"
  narration: 120–150 words — explain the logic with a real-world comparison

Slide 4 · type "walkthrough"
  heading: "Step By Step — Let us Do It Together"
  steps: exactly 5 numbered strings — action-first, specific, pulled from the source content
  example_prompt: the exact thing the learner types or does — use the real example from source if present
  ai_response: realistic 2–4 sentence result — what the learner sees
  narration: 200–260 words — walk through EACH step one by one, slow down at steps 3 and 4,
             describe what the learner sees at every moment

Slide 5 · type "example"
  heading: "Watch It Work — A Real Situation"
  bullets: 4 bullets — Situation / Action / Result / What changed
  narration: 120–150 words — tell the story concretely, end with "You can get the exact same result."

Slide 6 · type "common_mistakes"
  heading: "What Goes Wrong — And How to Fix It"
  bullets: 4 bullets — format: "Mistake: [what] → Fix: [how]"
  narration: 120–150 words — friendly, non-judgmental, walk through each mistake and its fix

Slide 7 · type "practice"
  heading: "Your Turn — Do It Right Now"
  task: one clear instruction — what to open and do right now (use the source exercise if present)
  example_prompt: a ready-to-use prompt with [placeholders] the learner fills in
  timer_seconds: 120
  narration: 120–150 words — direct, encouraging, tell them to pause now

Slide 8 · type "summary"
  heading: "What You Can Do Now"
  bullets: 4 complete sentences starting with "You can now..."
  narration: 120–150 words — celebrate the skill, give one action to take today, hint at what is next

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Every narration MUST be 120–150 words minimum (walkthrough: 200–260 words)
• Use real tool names from the source (ChatGPT, Claude, Gemini, Perplexity, etc.)
• Use the real exercises from the source in the practice slide
• Plain language — no jargon unless the source uses it
• Module order_index: {module_index}

JSON structure:
{{
  "title": "Module title from source",
  "description": "One sentence about this module.",
  "order_index": {module_index},
  "lessons": [
    {{
      "title": "Lesson title",
      "order_index": 0,
      "slides": [ ...8 slides... ]
    }}
  ]
}}
"""


def generate_curriculum_from_files(title: str, folder: Path) -> dict:
    """Build a curriculum from source documents. Each file becomes one module (1 lesson)."""
    files = _collect_source_files(folder)
    print(f"   📂 Found {len(files)} source file(s):")
    for f in files:
        print(f"      · {f.name}")

    modules = []
    for m_idx, file_path in enumerate(files):
        print(f"\n  Reading {file_path.name}...")
        try:
            content = _extract_text(file_path)
        except Exception as e:
            raise RuntimeError(f"Could not read {file_path.name}: {e}") from e

        if len(content) < 100:
            print(f"    ⚠ File too short — skipping {file_path.name}")
            continue

        print(f"  Structuring module {m_idx + 1}/{len(files)} via LLM...")
        prompt = FROM_FILES_MODULE_PROMPT.format(
            course_title=title,
            source_content=content[:12000],  # stay within context limits
            module_index=m_idx,
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
                    raise RuntimeError(
                        f"Module {m_idx + 1} ({file_path.name}) failed after 3 attempts: {e}"
                    ) from e
                print(f"    Retrying ({attempt + 2}/3)...")
                time.sleep(3)

        time.sleep(LLM_CALL_INTERVAL)

    if not modules:
        raise RuntimeError("No modules were generated — check your source files.")

    return {
        "course_title":       title,
        "course_description": f"A practical video course on {title}.",
        "modules":            modules,
    }


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
    "photorealistic wide shot of a modern bright learning environment, laptop on desk, "
    "warm natural window light, shallow depth of field, no people, no text, clean",
    "cinematic overhead shot of a clean workspace with notebook, pen and laptop, "
    "soft warm bokeh, professional educational feel, no text, no logos",
    "modern minimalist classroom or coworking space, golden hour sunlight streaming in, "
    "empty chairs, whiteboard in background, photorealistic, no text",
    "close-up of hands typing on a keyboard with a blurred bright office background, "
    "warm tone, photorealistic, no text, no logos",
    "wide shot of a bright modern library or study room, bookshelves, warm lighting, "
    "inviting academic atmosphere, photorealistic, no text",
]


def _overlay_captions(bg_path: str, lesson_title: str, module_title: str, out_path: str) -> bool:
    """Composite professional text captions over an AI-generated background image."""
    try:
        from PIL import Image, ImageDraw, ImageFont

        W, H = 1280, 720
        bg = Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS)
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Dark vignette gradient over bottom half so text always readable
        for y in range(H // 2, H):
            t = (y - H // 2) / (H // 2)
            alpha = int(t * 210)
            draw.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))

        # Lighter scrim over top-left for module badge
        draw.rectangle([0, 0, W, 120], fill=(0, 0, 0, 80))

        bg.paste(Image.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, 0)), overlay).convert("RGB"),
                 mask=overlay.split()[3])

        draw2 = ImageDraw.Draw(bg)

        def _font(size: int, bold: bool = False):
            candidates = (
                ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"] if bold
                else ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"]
            )
            for name in candidates:
                try:
                    return ImageFont.truetype(name, size)
                except Exception:
                    pass
            return ImageFont.load_default()

        font_badge   = _font(22)
        font_title   = _font(62, bold=True)
        font_caption = _font(26)

        # — MODULE BADGE ————————————————————————————————————————
        badge_text = module_title[:48].upper()
        bbox = draw2.textbbox((0, 0), badge_text, font=font_badge)
        bw = bbox[2] - bbox[0] + 32
        # Solid accent-blue pill so text is always legible over any background
        draw2.rounded_rectangle([52, 48, 52 + bw, 48 + 40], radius=8,
                                 fill=(80, 120, 255))
        draw2.text((52 + 16, 56), badge_text, font=font_badge, fill=(255, 255, 255))

        # — LESSON TITLE ————————————————————————————————————————
        MARGIN = 64
        max_w = W - MARGIN * 2

        def wrap(text: str, font, max_px: int) -> list[str]:
            words = text.split()
            lines, cur = [], ""
            for w in words:
                test = (cur + " " + w).strip()
                if draw2.textlength(test, font=font) > max_px and cur:
                    lines.append(cur)
                    cur = w
                else:
                    cur = test
            if cur:
                lines.append(cur)
            return lines

        title_lines = wrap(lesson_title, font_title, max_w)
        line_h = 76
        block_h = len(title_lines) * line_h
        # Place title in lower-centre zone
        y0 = H - 110 - block_h
        for line in title_lines:
            # Shadow
            draw2.text((MARGIN + 2, y0 + 2), line, font=font_title, fill=(0, 0, 0, 160))
            draw2.text((MARGIN, y0), line, font=font_title, fill=(255, 255, 255))
            y0 += line_h

        # — BOTTOM CAPTION BAR ——————————————————————————————————
        bar_h = 56
        bar_y = H - bar_h
        bar_bg = Image.new("RGBA", (W, bar_h), (0, 0, 0, 190))
        bg.paste(bar_bg.convert("RGB"), (0, bar_y), mask=bar_bg.split()[3])

        draw3 = ImageDraw.Draw(bg)
        # Accent line above bar
        draw3.line([(0, bar_y), (W, bar_y)], fill=(100, 140, 255), width=2)

        # Nest brand
        draw3.ellipse([52, bar_y + 16, 66, bar_y + 30], fill=(100, 140, 255))
        draw3.text((76, bar_y + 12), "Nest", font=_font(26, bold=True), fill=(255, 255, 255))

        # Right: module · lesson
        caption_text = f"{module_title}  ·  {lesson_title[:55]}"
        cw = draw3.textlength(caption_text, font=font_caption)
        draw3.text((W - cw - 52, bar_y + 14), caption_text, font=font_caption,
                   fill=(180, 200, 240))

        bg.save(out_path, "JPEG", quality=95)
        return True
    except Exception as e:
        print(f"    ⚠ Caption overlay error: {e}")
        return False


def generate_thumbnail(lesson_title: str, module_title: str, out_path: str) -> bool:
    """Generate thumbnail: Stability AI background + Pillow caption overlay.
    Falls back to pure Pillow card if API fails or key is missing."""
    if STABILITY_API_KEY:
        try:
            import random, tempfile
            prompt = (
                f"{random.choice(THUMB_PROMPTS)} "
                f"Subject theme: {lesson_title}."
            )
            resp = requests.post(
                "https://api.stability.ai/v2beta/stable-image/generate/core",
                headers={
                    "Authorization": f"Bearer {STABILITY_API_KEY}",
                    "Accept": "image/*",
                },
                files={"none": ""},
                data={
                    "prompt":        prompt,
                    "output_format": "jpeg",
                    "aspect_ratio":  "16:9",
                },
                timeout=90,
            )
            if resp.status_code == 200:
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    tmp.write(resp.content)
                    tmp_path = tmp.name
                if _overlay_captions(tmp_path, lesson_title, module_title, out_path):
                    import os; os.unlink(tmp_path)
                    return True
                import os; os.unlink(tmp_path)
            else:
                print(f"    ⚠ Stability API {resp.status_code}: {resp.text[:120]} — using Pillow fallback")
        except Exception as e:
            print(f"    ⚠ Stability thumbnail error ({e}) — using Pillow fallback")

    return _pillow_thumbnail(lesson_title, module_title, out_path)


def _pillow_thumbnail(lesson_title: str, module_title: str, out_path: str) -> bool:
    try:
        from PIL import Image, ImageDraw, ImageFont
        W, H = 1280, 720
        img = Image.new("RGB", (W, H))
        draw = ImageDraw.Draw(img, "RGBA")

        # Deep navy → rich indigo gradient
        for y in range(H):
            t = y / H
            r = int(10  + t * 30)
            g = int(12  + t * 20)
            b = int(40  + t * 60)
            draw.line([(0, y), (W, y)], fill=(r, g, b))

        # Subtle grid lines (tech/professional feel)
        grid_color = (255, 255, 255, 12)
        for x in range(0, W, 80):
            draw.line([(x, 0), (x, H)], fill=grid_color)
        for y in range(0, H, 80):
            draw.line([(0, y), (W, y)], fill=grid_color)

        # Glowing accent orbs
        orb = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        orb_draw = ImageDraw.Draw(orb)
        orb_draw.ellipse([W - 420, -180, W + 80, 320], fill=(80, 120, 255, 35))
        orb_draw.ellipse([-120, H - 260, 280, H + 120], fill=(120, 80, 255, 25))
        orb_draw.ellipse([W // 2 - 200, H // 2 - 200, W // 2 + 200, H // 2 + 200],
                         fill=(60, 200, 255, 10))
        img.paste(Image.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, 0)), orb).convert("RGB"),
                  mask=orb.split()[3])

        # Accent top bar (gradient stripe)
        for x in range(W):
            t = x / W
            r = int(80 + t * 120)
            g = int(60 + t * 60)
            b = int(255 - t * 60)
            draw.line([(x, 0), (x, 5)], fill=(r, g, b))

        # Fonts — try system fonts, fall back to default
        def _font(size: int, bold: bool = False):
            candidates = (
                ["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"] if bold
                else ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"]
            )
            for name in candidates:
                try:
                    return ImageFont.truetype(name, size)
                except Exception:
                    pass
            return ImageFont.load_default()

        font_module  = _font(24)
        font_title   = _font(58, bold=True)
        font_caption = _font(26)

        # — MODULE BADGE (top-left pill) ———————————————————————
        badge_text = module_title[:48].upper()
        bbox = draw.textbbox((0, 0), badge_text, font=font_module)
        bw = bbox[2] - bbox[0] + 32
        bh = 40
        bx, by = 56, 52
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=8,
                                fill=(255, 255, 255, 22))
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=8,
                                outline=(255, 255, 255, 60), width=1)
        draw.text((bx + 16, by + 8), badge_text, font=font_module, fill=(200, 210, 255))

        # — LESSON TITLE (centred vertically in main area) ————————
        MARGIN = 80
        max_w = W - MARGIN * 2

        def wrap_text(text: str, font, max_px: int) -> list[str]:
            words = text.split()
            lines, cur = [], ""
            for w in words:
                test = (cur + " " + w).strip()
                if draw.textlength(test, font=font) > max_px and cur:
                    lines.append(cur)
                    cur = w
                else:
                    cur = test
            if cur:
                lines.append(cur)
            return lines

        title_lines = wrap_text(lesson_title, font_title, max_w)
        line_h = 72
        block_h = len(title_lines) * line_h
        # Centre vertically between badge and caption bar
        y0 = (H - 100) // 2 - block_h // 2 + 20
        for line in title_lines:
            # Soft shadow
            draw.text((MARGIN + 3, y0 + 3), line, font=font_title, fill=(0, 0, 0, 120))
            draw.text((MARGIN, y0), line, font=font_title, fill=(255, 255, 255))
            y0 += line_h

        # — BOTTOM CAPTION BAR ————————————————————————————————
        bar_h = 80
        bar_y = H - bar_h
        # Semi-transparent dark bar
        bar_overlay = Image.new("RGBA", (W, bar_h), (0, 0, 0, 170))
        img.paste(bar_overlay.convert("RGB"), (0, bar_y), mask=bar_overlay.split()[3])

        # Left: "Nest" brand mark with accent dot
        draw.ellipse([56, bar_y + 28, 70, bar_y + 42], fill=(100, 140, 255))
        draw.text((80, bar_y + 22), "Nest", font=_font(28, bold=True), fill=(255, 255, 255))

        # Separator
        draw.line([(140, bar_y + 20), (140, bar_y + 60)], fill=(255, 255, 255, 50), width=1)

        # Right: lesson caption (module · lesson title snippet)
        caption_text = f"{module_title}  ·  {lesson_title[:60]}"
        cw = draw.textlength(caption_text, font=font_caption)
        draw.text((W - cw - 56, bar_y + 24), caption_text, font=font_caption,
                  fill=(180, 190, 220))

        img = img.convert("RGB")
        img.save(out_path, "JPEG", quality=95)
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
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
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


# ── Per-slide contextual image (Stability AI) ─────────────────────────────

IMAGE_SLIDE_TYPES = {"content", "example", "hook"}

SLIDE_IMAGE_STYLE = (
    "educational illustration, professional photography style, "
    "warm natural lighting, no text, no logos, no watermarks, "
    "clean background, high quality, realistic"
)

def generate_slide_image(heading: str, slide_type: str, out_path: str) -> bool:
    """Generate a contextual image for a single slide using Stability AI. Returns True on success."""
    if not STABILITY_API_KEY:
        return False
    try:
        style_map = {
            "hook":    f"person looking frustrated or overwhelmed with a task, {SLIDE_IMAGE_STYLE}",
            "content": f"person learning or working, topic: {heading}, {SLIDE_IMAGE_STYLE}",
            "example": f"person successfully completing a task, happy result, topic: {heading}, {SLIDE_IMAGE_STYLE}",
        }
        prompt = style_map.get(slide_type, f"{heading}, {SLIDE_IMAGE_STYLE}")

        resp = requests.post(
            "https://api.stability.ai/v2beta/stable-image/generate/core",
            headers={
                "Authorization": f"Bearer {STABILITY_API_KEY}",
                "Accept": "image/*",
            },
            files={"none": ""},
            data={
                "prompt": prompt,
                "output_format": "jpeg",
            },
            timeout=90,
        )
        if resp.status_code == 200:
            with open(out_path, "wb") as f:
                f.write(resp.content)
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


def api_upload_thumbnail(file_path: str) -> str:
    """Upload a thumbnail image to Supabase via the backend API. Returns public URL."""
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{NEST_API_URL}/api/videos/upload/thumbnail",
            files={"file": (Path(file_path).name, f, "image/jpeg")},
            headers={"Authorization": f"Bearer {NEST_TOKEN}"},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.json()["url"]


def api_create_video(
    module_id: str, title: str, video_url: str,
    duration: int, order_index: int,
    thumbnail_url: str | None = None,
) -> str:
    resp = requests.post(
        f"{NEST_API_URL}/api/videos",
        json={
            "module_id":        module_id,
            "title":            title,
            "video_url":        video_url,
            "duration_seconds": duration,
            "order_index":      order_index,
            "description":      "",
            "thumbnail_url":    thumbnail_url,
        },
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json()["id"]


# ── Main orchestrator ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="nest-gen: auto-generate courses for Nest")
    parser.add_argument("title",         help='Course title, e.g. "AI For Everyday Life"')
    parser.add_argument("--modules",     type=int, default=4,   help="Number of modules (default: 4)")
    parser.add_argument("--lessons",     type=int, default=4,   help="Lessons per module (default: 4)")
    parser.add_argument("--voice",       default=EDGE_VOICE,    help="edge-tts voice")
    parser.add_argument("--dry-run",     action="store_true",   help="Generate curriculum only, skip video rendering")
    parser.add_argument("--no-upload",   action="store_true",   help="Render videos but skip Nest API upload")
    parser.add_argument("--output",      default=str(OUT_DIR),  help="Output directory")
    parser.add_argument(
        "--from-files", metavar="FOLDER",
        help="Path to a folder of source documents (.pdf .docx .txt .md). "
             "Each file becomes one module (1 lesson). Ignores --modules and --lessons.",
    )
    args = parser.parse_args()

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    from_files = Path(args.from_files) if args.from_files else None
    if from_files and not from_files.is_dir():
        print(f"❌ --from-files path is not a directory: {from_files}")
        sys.exit(1)

    print(f"\n🎓 nest-gen")
    print(f"   Course : {args.title}")
    if from_files:
        print(f"   Mode   : from-files  ({from_files})")
    else:
        print(f"   Modules: {args.modules}  ·  Lessons/module: {args.lessons}")
    print(f"   Voice  : {args.voice}\n")

    # ── Step 1: Curriculum ────────────────────────────────────────────────
    curriculum_path = out_dir / "curriculum.json"
    if curriculum_path.exists():
        print("📋 Using cached curriculum.json")
        curriculum = json.loads(curriculum_path.read_text())
    else:
        if from_files:
            print("📋 Building curriculum from source files...")
            curriculum = generate_curriculum_from_files(args.title, from_files)
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
                thumb_url = None
                if thumb_path.exists():
                    try:
                        thumb_url = api_upload_thumbnail(str(thumb_path))
                        print(f"    ✓ Thumbnail uploaded")
                    except Exception as e:
                        print(f"    ⚠ Thumbnail upload failed ({e}) — continuing without")
                api_create_video(
                    module_id=module_id,
                    title=lesson["title"],
                    video_url=video_url,
                    duration=duration_sec,
                    order_index=l_idx,
                    thumbnail_url=thumb_url,
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
