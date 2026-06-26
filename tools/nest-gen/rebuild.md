# nest-gen v2 — Universal Educational Video Engine

## Architecture & Prompt Specification

**Purpose:** Generate professional-quality educational video courses on ANY topic from a single title input. Every course should feel hand-designed by a subject-matter expert, not assembled by a template.

**Core principle:** A course on "Quantum Mechanics" and a course on "How to Negotiate a Raise" must feel like they were designed by different expert teachers — because the engine understood what each topic needed.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Stage 1: Course Intelligence](#2-stage-1-course-intelligence)
3. [Stage 2: Course Architecture](#3-stage-2-course-architecture)
4. [Stage 3: Lesson Generation](#4-stage-3-lesson-generation)
5. [The Slide Type Library](#5-the-slide-type-library)
6. [Lesson Type Definitions](#6-lesson-type-definitions)
7. [Narration Voice Guide](#7-narration-voice-guide)
8. [Visual Theme System](#8-visual-theme-system)
9. [JSON Schemas](#9-json-schemas)
10. [Production Pipeline Notes](#10-production-pipeline-notes)
11. [Quality Validation](#11-quality-validation)

---

## 1. System Overview

### Pipeline

```
TITLE IN (e.g. "Basic AI Skills for Everyday Life")
   │
   ▼
┌─────────────────────────────────────────────┐
│  STAGE 1: COURSE INTELLIGENCE               │
│  1 LLM call · ~2,000 tokens out             │
│                                             │
│  Analyses the title and determines:         │
│  • Who this course is for                   │
│  • What transformation the learner makes    │
│  • What skill types are involved            │
│  • Difficulty level and progression curve   │
│  • Visual theme                             │
│  • Emotional arc across the course          │
│                                             │
│  Output: COURSE BLUEPRINT (JSON)            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  STAGE 2: COURSE ARCHITECTURE               │
│  1 LLM call · ~4,000 tokens out             │
│                                             │
│  Takes the blueprint and designs:           │
│  • Module titles and descriptions           │
│  • Lesson titles within each module         │
│  • Lesson TYPE for each lesson              │
│  • Difficulty rating per lesson             │
│  • How each lesson connects to the next     │
│                                             │
│  Output: COURSE ARCHITECTURE (JSON)         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  STAGE 3: LESSON GENERATION                 │
│  1 LLM call per module · ~6,000 tokens each │
│                                             │
│  For each lesson, using its assigned type:  │
│  • Selects slide template for that type     │
│  • Generates all slide content              │
│  • Writes narration with correct voice      │
│  • Includes concrete examples               │
│  • Follows the emotional arc position       │
│                                             │
│  Output: FULL LESSON JSON per module        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  STAGE 4: PRODUCTION                        │
│  (No LLM calls — deterministic pipeline)    │
│                                             │
│  • TTS with per-slide prosody               │
│  • Contextual slide images                  │
│  • Thumbnail generation                     │
│  • Remotion video render                    │
│  • Background music mix                     │
│  • Upload to Nest API                       │
└─────────────────────────────────────────────┘
```

### Key Differences from v1

| Aspect | v1 (current) | v2 (redesign) |
|--------|-------------|---------------|
| Planning | None — jumps straight to slide generation | Two planning stages before any content |
| Lesson variety | One template for all lessons | 10 lesson types, each with unique structure |
| Slide types | 8 fixed types | 20+ slide types in an extensible library |
| Slide order | Always the same | Varies by lesson type and position |
| Examples | Generic or Africa-specific | Concrete, topic-specific, varied characters |
| Narration | Same tone throughout | Voice adapts to lesson type and position |
| Difficulty | Flat | Designed progression curve |
| Emotional arc | None | Planned across the full course |

---

## 2. Stage 1: Course Intelligence

### Purpose
Analyse the course title and determine everything the engine needs to know BEFORE generating any content. This is the "expert teacher thinking about the course for 30 minutes before writing anything" step.

### PROMPT: COURSE_INTELLIGENCE

```
You are the world's best curriculum designer. You have designed courses for MIT OpenCourseWare,
Coursera, MasterClass, and Khan Academy. Given a course title, you analyse everything about
how this course should be taught.

Output valid JSON ONLY. No markdown fences. Start with { and end with }.

Course title: "{title}"
Requested structure: {n_modules} modules, {n_lessons} lessons per module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANALYSE THE FOLLOWING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. LEARNER PROFILE
   Who would take this course? Be specific — age range, background, what they already know,
   what they are trying to achieve. Not "anyone interested in X" — real people with real goals.

2. TRANSFORMATION
   What can the learner do AFTER this course that they could not do BEFORE?
   Write this as a single clear sentence: "Before: [state]. After: [state]."

3. SKILL TYPE MIX
   Every course teaches a mix of skill types. Rate each 0-10 for how much this course uses it:
   - conceptual: understanding ideas, theories, how things work
   - procedural: following steps to do something, using tools
   - analytical: breaking down problems, evaluating, calculating
   - creative: producing something new, designing, writing
   - physical: body-based skills, movement, hands-on craft
   - interpersonal: communication, persuasion, collaboration, empathy
   - metacognitive: learning how to learn, self-reflection, strategy

   The top 1-2 scores determine the PRIMARY teaching approach.

4. DIFFICULTY PROGRESSION
   Rate overall difficulty 1-10 (1 = anyone can learn this, 10 = requires years of prerequisites).
   Then describe how difficulty should progress across modules:
   - "steady_climb": each module harder than the last
   - "plateau_and_jump": easy start, plateau, then significant jump
   - "wave": alternating challenge and consolidation
   - "front_loaded": hardest concepts first, then application
   - "back_loaded": easy foundations, complexity builds at end

5. VISUAL THEME
   Choose ONE theme that best matches the course's subject matter and mood:
   - "neural": technology, AI, digital, modern — dark backgrounds, glowing accents
   - "blueprint": science, engineering, technical — grid patterns, precise lines
   - "chalkboard": mathematics, equations, proofs — dark green, chalk-white text
   - "kinetic": business, marketing, leadership — bold colours, dynamic shapes
   - "organic": health, wellness, psychology, nature — soft greens, rounded shapes
   - "cinematic": history, culture, documentary — film grain, warm tones, letterbox
   - "studio": creative arts, design, music — minimal, gallery-white, accent pops
   - "workshop": hands-on skills, cooking, craft — warm wood tones, tactile textures

6. EMOTIONAL ARC
   How should the learner FEEL as they progress through the course?
   Describe the emotional journey across modules. Example:
   Module 1: "Excited and curious — this is accessible, I can do this"
   Module 2: "Building confidence — I am actually learning real skills"
   Module 3: "Challenged but supported — this is harder but I am growing"
   Module 4: "Empowered and independent — I own these skills now"

7. EXAMPLE STYLE
   What kind of examples will resonate? Choose the most appropriate:
   - "workplace": office, business, professional scenarios
   - "everyday": home, family, personal life, shopping, health
   - "student": school, university, studying, exams
   - "creative": art, writing, design, content creation
   - "technical": code, systems, engineering, data
   - "mixed": blend of multiple contexts

8. PREREQUISITE KNOWLEDGE
   List 0-5 things the learner MUST already know or have before starting.
   If none, say "none — this course starts from zero."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "course_title": "...",
  "learner_profile": "2-3 sentences describing the target learner specifically",
  "transformation": {
    "before": "What the learner cannot do before this course",
    "after": "What the learner can confidently do after this course"
  },
  "skill_mix": {
    "conceptual": 0,
    "procedural": 0,
    "analytical": 0,
    "creative": 0,
    "physical": 0,
    "interpersonal": 0,
    "metacognitive": 0
  },
  "primary_skill_types": ["the top 1-2 from skill_mix"],
  "difficulty": {
    "overall": 5,
    "progression": "steady_climb",
    "description": "One sentence explaining the difficulty curve"
  },
  "visual_theme": "neural",
  "emotional_arc": [
    {"module": 1, "feeling": "Description of how the learner should feel"},
    {"module": 2, "feeling": "..."},
    {"module": 3, "feeling": "..."},
    {"module": 4, "feeling": "..."}
  ],
  "example_style": "everyday",
  "prerequisites": ["List of prerequisites or empty array"],
  "course_description": "A compelling 2-3 sentence course description for the catalogue"
}
```

---

## 3. Stage 2: Course Architecture

### Purpose
Using the blueprint from Stage 1, design the full course structure — modules, lessons, and critically, the LESSON TYPE for each lesson. This is where variety is engineered.

### PROMPT: COURSE_ARCHITECTURE

```
You are designing the structure of a video course. You have already analysed the course
and produced a blueprint (provided below). Now you must design the full architecture:
modules, lessons, and the TYPE of each lesson.

Output valid JSON ONLY. No markdown fences. Start with { and end with }.

Course title: "{title}"
Structure: {n_modules} modules, {n_lessons} lessons per module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE BLUEPRINT (from Stage 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{blueprint_json}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON TYPES — choose from this list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each lesson must be assigned exactly ONE type. The type determines the slide structure,
pacing, and teaching approach for that lesson.

AWAKENING
  Purpose: Make the learner care about this topic before teaching anything.
  When to use: First lesson of the course. Optionally first lesson of a new module that
  introduces a significantly different sub-topic.
  Feel: Curiosity, relevance, "I need to learn this."
  Slide count: 6

FOUNDATION
  Purpose: Build core understanding of a concept, theory, or framework.
  When to use: Early in a module when introducing a new idea that later lessons build on.
  Feel: Clarity, "now I understand how this works."
  Slide count: 7

SKILL_BUILD
  Purpose: Step-by-step skill acquisition. The learner follows along and does something.
  When to use: Core lessons where the learner needs to learn a specific procedure or technique.
  Feel: Guided confidence, "I just did it myself."
  Slide count: 8

DEEP_DIVE
  Purpose: Explore complexity, nuance, edge cases, and advanced considerations.
  When to use: Mid-module after basics are established. For topics that reward deeper analysis.
  Feel: Intellectual depth, "there is more to this than I thought."
  Slide count: 7

CASE_STUDY
  Purpose: Learn through a real-world story. Show how knowledge applies in practice.
  When to use: After a skill_build or foundation lesson to make the learning concrete.
  Feel: Storytelling, "I can see how this works in real life."
  Slide count: 7

CHALLENGE
  Purpose: Learner solves a problem with minimal hand-holding.
  When to use: Late in a module when the learner has enough skill to work independently.
  Feel: Productive struggle, "I figured it out myself."
  Slide count: 6

LAB
  Purpose: Extended hands-on practice with multiple exercises and feedback.
  When to use: For procedural or analytical courses that need practice repetition.
  Feel: Workshop energy, "I am getting faster and better."
  Slide count: 8

MILESTONE
  Purpose: Combine skills from the module, celebrate progress, bridge to next module.
  When to use: Last lesson of each module. Always.
  Feel: Accomplishment, "look how far I have come."
  Slide count: 6

WORKED_EXAMPLE
  Purpose: Step through a complete solved problem showing all working.
  When to use: Mathematical, scientific, or analytical courses.
  Feel: Clarity, "I can follow every step."
  Slide count: 8

DEBATE
  Purpose: Explore multiple perspectives on a question. No single right answer.
  When to use: Philosophy, ethics, social sciences, strategy, any topic with legitimate disagreement.
  Feel: Critical thinking, "I can form my own view."
  Slide count: 7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES FOR ASSIGNING LESSON TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. The FIRST lesson of the entire course MUST be type "awakening".
2. The LAST lesson of every module MUST be type "milestone".
3. No two adjacent lessons should have the same type. Variety is mandatory.
4. If the course's primary_skill_types include "analytical", at least 30% of
   lessons should be "worked_example" or "lab".
5. If primary_skill_types include "procedural", at least 40% should be
   "skill_build" or "lab".
6. If primary_skill_types include "conceptual", include at least one
   "case_study" or "debate" per module.
7. Each module should have at least 3 different lesson types.
8. "challenge" lessons should only appear after at least one "skill_build"
   or "foundation" lesson in the same module.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LESSON CONNECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each lesson, write a "connects_to_next" sentence explaining how this lesson
sets up the next one. This creates narrative flow so the course feels like a journey,
not a list. Example:
  "Now that you can write a basic prompt, the next lesson will show you how to
   make the AI's response much more specific and useful."

The last lesson's connects_to_next should be a course completion statement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "course_title": "...",
  "course_description": "...",
  "modules": [
    {
      "title": "Module title",
      "description": "What this module covers and what the learner achieves",
      "order_index": 0,
      "emotional_tone": "The feeling from the emotional_arc for this module",
      "lessons": [
        {
          "title": "Lesson title — benefit-focused, specific",
          "order_index": 0,
          "lesson_type": "awakening",
          "difficulty": 2,
          "key_concept": "The single most important idea in this lesson",
          "connects_to_next": "How this lesson sets up the next one",
          "example_context": "Brief note on what kind of example this lesson should use"
        }
      ]
    }
  ]
}
```

---

## 4. Stage 3: Lesson Generation

### Purpose
Generate the full slide-by-slide content for every lesson in a module. Each lesson uses the slide template defined by its lesson_type.

### How It Works
Stage 3 makes one LLM call per module. The prompt includes:
1. The course blueprint (from Stage 1)
2. The module architecture (from Stage 2) — lesson titles, types, connections
3. The slide template for each lesson type used in this module
4. Narration voice guidelines

The LLM generates all lessons for that module in one call.

### PROMPT: MODULE_GENERATION

```
You are generating the complete slide-by-slide content for one module of a video course.
You have the course blueprint, the module architecture, and the slide templates for each
lesson type. Your job is to fill in every slide with rich, specific, example-driven content.

Output valid JSON ONLY. No markdown fences. Start with { and end with }.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COURSE CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title: "{course_title}"
Learner profile: {learner_profile}
Transformation: Before — {before} → After — {after}
Example style: {example_style}
Visual theme: {visual_theme}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIS MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module {module_num} of {n_modules}: "{module_title}"
Module description: {module_description}
Emotional tone: {emotional_tone}

Lessons in this module:
{lessons_list}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — NARRATION LENGTH (most critical rule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard slides: 120-150 words per narration.
Walkthrough/guided slides: 200-260 words per narration.
Short slides (provocative_question, level_up): 80-100 words.

These are HARD MINIMUMS. A 7-slide lesson needs ~130 words per slide average
to reach 6 minutes at normal speaking pace. Short narrations = short unwatchable videos.

CORRECT example (130 words):
"Welcome to this lesson. Today we are going to cover something that will genuinely save
you time and help you get better results in everything you do. A lot of people struggle
with this topic not because it is hard, but because nobody ever showed them the right
approach. By the time this lesson is over, you will have a clear method you can use
immediately — no waiting, no guessing. We are going to walk through it step by step
together. I will explain what it is, show you exactly how to do it, give you a real
example so you can see it working, and then give you a chance to try it yourself right
now. Let us get started — this is going to be a good one."

WRONG (18 words — NEVER do this):
"Welcome to this lesson. Today you will learn how to use this skill effectively."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — EXAMPLES ARE MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every lesson MUST include at least TWO concrete, specific examples. Not generic placeholders.

WRONG: "For example, you could use this in your business."
WRONG: "A user might type a prompt and get a useful response."

RIGHT: "Sarah runs a small bakery and needs to write Instagram captions for her daily
specials. She opens ChatGPT and types: 'I am a bakery owner. Today I have fresh
croissants, sourdough bread, and blueberry muffins. Write me 3 short Instagram
captions with emojis that sound friendly and local.' Within 10 seconds, she has
three captions ready to post."

RIGHT: "A university student has a 40-page research paper to read before tomorrow.
She pastes the introduction and conclusion into Claude and asks: 'Summarise the
main argument of this paper in 4 bullet points, using simple language.' She gets
a clear summary and uses it to guide her reading of the full paper."

Examples must:
• Name a specific person or describe them concretely ("a bakery owner", "a second-year medical student")
• State their specific situation or need
• Show the EXACT action they take (what they type, click, or do)
• Show the EXACT result they get
• Be relevant to the lesson topic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — NARRATION VOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The narrator is a knowledgeable, warm, encouraging teacher. NOT a textbook. NOT a script.

Voice characteristics:
• Uses "you" and "we" constantly — "You are going to love this" not "The learner will..."
• Uses conversational transitions — "Here is the thing..." / "Now watch this..." / "Ready?"
• Pauses for emphasis — use commas and periods to create breathing room
• Gets genuinely excited about breakthroughs — "This is the part that changes everything."
• Slows down for hard parts — "Take a moment with this. It is important."
• Addresses doubt directly — "If this feels confusing, that is completely normal."
• Uses simple analogies — "Think of it like a recipe — the ingredients matter, but so does the order."
• Never sounds robotic, formal, or like a corporate training video.

Adapt voice to lesson type:
• awakening: enthusiastic, storytelling, drawing the learner in
• foundation: clear, patient, building understanding brick by brick
• skill_build: encouraging, step-by-step, "we are doing this together"
• deep_dive: thoughtful, analytical, "let us look closer"
• case_study: narrative, storytelling, bringing characters to life
• challenge: direct, motivating, "you are ready for this"
• lab: energetic, workshop-style, "let us keep practising"
• milestone: celebratory, reflective, proud of the learner
• worked_example: precise, methodical, "follow along with me"
• debate: balanced, thought-provoking, "what do you think?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — CONNECTIONS BETWEEN LESSONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each lesson's FIRST slide narration must briefly reference what came before
(except the very first lesson of the course).

Examples:
• "In the last lesson, you learned how to write a basic prompt. Now we are going
   to take that skill and make it much more powerful."
• "You now understand what AI is and how it works at a basic level. This lesson
   is about putting that knowledge into practice for the first time."

Each lesson's LAST slide narration must tease what comes next
(except the very last lesson of the course).

Examples:
• "Next up, we are going to tackle something that trips most people up — but now
   that you have this foundation, you are going to handle it easily."
• "In the next lesson, you will learn how to spot when AI gets things wrong —
   and that is going to make everything you have learned so far even more powerful."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE TEMPLATES BY LESSON TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{slide_templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "title": "Module title",
  "description": "Module description",
  "order_index": 0,
  "lessons": [
    {
      "title": "Lesson title",
      "order_index": 0,
      "lesson_type": "skill_build",
      "slides": [
        ... slides matching the template for this lesson_type ...
      ]
    }
  ]
}
```

---

## 5. The Slide Type Library

Each slide type is a building block. Lesson types assemble these blocks in different orders.

### CORE SLIDE TYPES

---

#### `provocative_question`
**Purpose:** Open with a question that creates tension or curiosity.
**Fields:**
```json
{
  "type": "provocative_question",
  "heading": "The question — direct, personal, slightly uncomfortable",
  "subtext": "A one-sentence expansion that makes the question feel urgent",
  "narration": "80-100 words — pose the question, let it sit, then hint at the answer"
}
```
**Example heading:** "What if everything you think you know about productivity is making you slower?"
**Narration length:** 80-100 words (shorter — let the question breathe)

---

#### `story_hook`
**Purpose:** Draw the learner in through a vivid, specific story.
**Fields:**
```json
{
  "type": "story_hook",
  "heading": "The problem this story illustrates — phrased as a struggle",
  "story": "2-3 sentences. A named character, their specific situation, and the cost of the problem.",
  "narration": "120-150 words — tell the story with vivid detail, build empathy, promise a solution"
}
```
**Example story:** "Maria runs a small online clothing store. Every evening, she spends two hours writing individual replies to customer questions — the same questions, over and over. By the time she finishes, she is too tired to work on growing her business."

---

#### `concept`
**Purpose:** Explain one idea, theory, or framework clearly.
**Fields:**
```json
{
  "type": "concept",
  "heading": "Name of the concept — simple, clear",
  "bullets": ["4 short statements explaining what it IS — plain language, no jargon"],
  "visual_hint": "default | timeline | cycle | stats | comparison",
  "narration": "120-150 words — explain with one memorable analogy, connect to what learner already knows"
}
```

---

#### `why_it_works`
**Purpose:** Explain the reasoning behind a concept or approach.
**Fields:**
```json
{
  "type": "why_it_works",
  "heading": "Why This Works",
  "bullets": ["4 bullets explaining the LOGIC — not just what, but why"],
  "visual_hint": "default | stats",
  "narration": "120-150 words — use a real-world comparison, help learner feel confident in the reasoning"
}
```

---

#### `walkthrough`
**Purpose:** Step-by-step guided procedure. The most important slide type for procedural learning.
**Fields:**
```json
{
  "type": "walkthrough",
  "heading": "Step By Step — Let Us Do It Together",
  "steps": ["5 numbered action-first instructions — specific, concrete, what to click/type/do"],
  "example_prompt": "The exact text to type or action to take — ready to copy",
  "ai_response": "The realistic result — 2-4 sentences, specific and useful",
  "narration": "200-260 words — walk through EACH step slowly, describe what the learner sees, pause between steps"
}
```
**Critical:** This is the slide where skills are actually built. The narration must describe every step as if sitting next to the learner. Never rush.

---

#### `example_result`
**Purpose:** Show a concrete before/after transformation using a specific character.
**Fields:**
```json
{
  "type": "example_result",
  "heading": "[Character Name]'s Result",
  "bullets": [
    "Situation: who they are and what they needed",
    "Action: exactly what they did",
    "Result: specific outcome — time, money, quality",
    "What changed: how their work or life improved"
  ],
  "narration": "120-150 words — tell the story concretely, make the result feel achievable"
}
```

---

#### `common_mistakes`
**Purpose:** Name the things that go wrong and how to fix them.
**Fields:**
```json
{
  "type": "common_mistakes",
  "heading": "What Goes Wrong — And How to Fix It",
  "bullets": [
    "Mistake: [specific] → Fix: [specific]",
    "Mistake: [specific] → Fix: [specific]",
    "Mistake: [specific] → Fix: [specific]",
    "Mistake: [specific] → Fix: [specific]"
  ],
  "narration": "120-150 words — walk through each mistake conversationally, be reassuring"
}
```

---

#### `practice`
**Purpose:** Give the learner a specific task to do RIGHT NOW.
**Fields:**
```json
{
  "type": "practice",
  "heading": "Your Turn — Do It Right Now",
  "task": "One clear instruction — exactly what to open and do",
  "example_prompt": "A ready-to-use prompt or task with [placeholders] for personalisation",
  "timer_seconds": 120,
  "narration": "120-150 words — tell them to pause, walk through exactly what to do, reassure imperfect is fine"
}
```

---

#### `summary`
**Purpose:** Celebrate learning, consolidate takeaways, bridge to next lesson.
**Fields:**
```json
{
  "type": "summary",
  "heading": "What You Can Do Now",
  "bullets": [
    "You can now [specific skill].",
    "You understand [specific concept].",
    "You know [specific knowledge].",
    "Your next step: [specific action to take today]."
  ],
  "narration": "120-150 words — celebrate, name the skill, give one action for today, tease next lesson"
}
```

---

#### `revelation`
**Purpose:** The "aha moment" — present the key insight that changes the learner's thinking.
**Fields:**
```json
{
  "type": "revelation",
  "heading": "The key insight — stated as a surprising truth",
  "explanation": "2-3 sentences unpacking why this insight matters",
  "narration": "120-150 words — build to the insight, deliver it clearly, let it land, explain why it changes everything"
}
```
**Example heading:** "You do not need to write perfectly — you need to EDIT perfectly."

---

#### `scenario`
**Purpose:** Present a realistic situation the learner must respond to.
**Fields:**
```json
{
  "type": "scenario",
  "heading": "The Situation",
  "scenario_text": "3-5 sentences describing a realistic situation with enough detail to make decisions",
  "question": "What would you do? (the specific decision the learner must consider)",
  "narration": "120-150 words — paint the scenario vividly, pose the question, tell them to think before continuing"
}
```

---

#### `analysis`
**Purpose:** Break down what happened in a scenario, case study, or example.
**Fields:**
```json
{
  "type": "analysis",
  "heading": "What Actually Happened — And Why",
  "bullets": [
    "Key decision: what was chosen and why",
    "What worked: the effective parts",
    "What could improve: the missed opportunities",
    "Takeaway: the principle to remember"
  ],
  "narration": "120-150 words — analytical, fair, drawing out the lesson"
}
```

---

#### `perspective`
**Purpose:** Present one viewpoint in a debate or multi-perspective topic.
**Fields:**
```json
{
  "type": "perspective",
  "heading": "Perspective: [Name of viewpoint]",
  "argument": "2-3 sentences presenting this perspective's core argument",
  "evidence": "1-2 sentences of supporting evidence or reasoning",
  "weakness": "1 sentence acknowledging the limitation of this view",
  "narration": "120-150 words — present fairly and compellingly, acknowledge strengths and limits"
}
```

---

#### `reflection`
**Purpose:** Ask the learner to connect what they learned to their own life.
**Fields:**
```json
{
  "type": "reflection",
  "heading": "Think About This",
  "question": "A thoughtful question connecting the lesson to the learner's own experience",
  "prompts": ["3 specific sub-questions to guide their thinking"],
  "narration": "100-120 words — ask the question, give space, suggest journaling or thinking time"
}
```

---

#### `worked_problem`
**Purpose:** Step through a solved problem showing all mathematical/analytical working.
**Fields:**
```json
{
  "type": "worked_problem",
  "heading": "Let Us Solve It — Step By Step",
  "math_steps": [
    {"expression": "x² + 5x + 6 = 0", "annotation": "Start with the equation"},
    {"expression": "(x + 2)(x + 3) = 0", "annotation": "Factorise", "highlight": false},
    {"expression": "x = -2 or x = -3", "annotation": "Final answers", "highlight": true}
  ],
  "narration": "200-260 words — talk through every step as if writing on a board"
}
```

---

#### `quiz`
**Purpose:** Test understanding with a multiple-choice question.
**Fields:**
```json
{
  "type": "quiz",
  "heading": "Quick Check",
  "question": "A clear question testing the lesson's key concept",
  "quiz_options": [
    {"text": "Option A", "correct": false},
    {"text": "Option B", "correct": true},
    {"text": "Option C", "correct": false},
    {"text": "Option D", "correct": false}
  ],
  "narration": "80-100 words — pose question, pause, reveal answer, explain why"
}
```

---

#### `level_up`
**Purpose:** Celebrate completion and show progress. Used in milestone and challenge lessons.
**Fields:**
```json
{
  "type": "level_up",
  "heading": "Level Up — You Just [Specific Achievement]",
  "achievement": "One sentence naming exactly what the learner can now do",
  "stats": {
    "skills_learned": 3,
    "lessons_completed": 4,
    "next_module": "Module title"
  },
  "narration": "80-100 words — celebrate warmly, name the achievement, build excitement for what is next"
}
```

---

#### `comparison`
**Purpose:** Show two approaches, tools, or ideas side by side.
**Fields:**
```json
{
  "type": "comparison",
  "heading": "Comparing [A] vs [B]",
  "option_a": {"name": "...", "points": ["strength 1", "strength 2", "weakness 1"]},
  "option_b": {"name": "...", "points": ["strength 1", "strength 2", "weakness 1"]},
  "verdict": "One sentence on when to use each",
  "narration": "120-150 words — walk through both fairly, give a clear recommendation"
}
```

---

#### `character_intro`
**Purpose:** Introduce a character whose story will drive a case study.
**Fields:**
```json
{
  "type": "character_intro",
  "heading": "[Name] — [Their role/situation in 5 words]",
  "background": "3-4 sentences: who they are, what they do, what problem they face",
  "stakes": "1 sentence: what happens if they do not solve this problem",
  "narration": "120-150 words — bring this person to life, make the learner care about their outcome"
}
```

---

#### `decision_point`
**Purpose:** The moment in a case study where a critical choice was made.
**Fields:**
```json
{
  "type": "decision_point",
  "heading": "The Moment of Decision",
  "context": "2 sentences: what led to this point",
  "options": ["Option A: what they could do", "Option B: what they could do", "Option C: what they could do"],
  "chosen": "Which option was chosen and why",
  "narration": "120-150 words — build tension, present options, reveal the choice"
}
```

---

#### `multi_exercise`
**Purpose:** Multiple practice exercises in sequence. Used in lab lessons.
**Fields:**
```json
{
  "type": "multi_exercise",
  "heading": "Exercise [N]: [Task name]",
  "instruction": "What to do — specific and complete",
  "example_input": "The exact input to use",
  "expected_output": "What a good result looks like",
  "tip": "One sentence of guidance",
  "narration": "120-150 words — guide through the exercise, describe expected results"
}
```

---

#### `graph`
**Purpose:** Display a mathematical function with animated plotting (math courses only).
**Fields:**
```json
{
  "type": "graph",
  "heading": "Visualising [Function Name]",
  "graph_data": {
    "x_range": [-3, 3],
    "y_range": [-1, 10],
    "points": [{"x": -3, "y": 9}, {"x": 0, "y": 0}, {"x": 3, "y": 9}],
    "key_points": [{"x": 0, "y": 0, "label": "Vertex"}],
    "function_label": "y = x²",
    "x_label": "x",
    "y_label": "y",
    "shade_under": false
  },
  "narration": "120-150 words — describe what the graph shows, point out key features"
}
```

---

## 6. Lesson Type Definitions

Each lesson type defines which slides to use, in what order. This is the core of what makes different lessons feel different.

---

### AWAKENING (6 slides)
**Purpose:** First lesson of the course or major module shift. Make the learner care.

```
Slide 1: provocative_question
Slide 2: story_hook
Slide 3: revelation
Slide 4: concept
Slide 5: practice (lightweight — "try this one thing right now")
Slide 6: summary
```

**Narration voice:** Enthusiastic, storytelling, drawing the learner in. Use vivid language. Build curiosity and urgency. The learner should finish thinking "I NEED to keep going."

---

### FOUNDATION (7 slides)
**Purpose:** Build core understanding of a concept that later lessons depend on.

```
Slide 1: story_hook
Slide 2: concept
Slide 3: why_it_works
Slide 4: example_result
Slide 5: common_mistakes
Slide 6: practice
Slide 7: summary
```

**Narration voice:** Clear, patient, building understanding brick by brick. Use analogies. Check understanding verbally — "Does that make sense? Let me put it another way."

---

### SKILL_BUILD (8 slides)
**Purpose:** Step-by-step skill acquisition. The core "how to" lesson.

```
Slide 1: story_hook
Slide 2: concept
Slide 3: walkthrough
Slide 4: example_result
Slide 5: common_mistakes
Slide 6: quiz
Slide 7: practice
Slide 8: summary
```

**Narration voice:** Encouraging, step-by-step, "we are doing this together." Slow down during the walkthrough. Speed up slightly during examples. Celebrate at the end.

---

### DEEP_DIVE (7 slides)
**Purpose:** Explore complexity, nuance, edge cases after basics are established.

```
Slide 1: provocative_question
Slide 2: concept
Slide 3: why_it_works
Slide 4: comparison
Slide 5: example_result
Slide 6: reflection
Slide 7: summary
```

**Narration voice:** Thoughtful, analytical, "let us look closer." Acknowledge complexity. Use phrases like "most people stop here, but there is more" and "this is where it gets interesting."

---

### CASE_STUDY (7 slides)
**Purpose:** Learn through a real-world story.

```
Slide 1: character_intro
Slide 2: concept (the skill/knowledge the character needs)
Slide 3: decision_point
Slide 4: walkthrough (what the character actually did — step by step)
Slide 5: example_result (the outcome)
Slide 6: analysis
Slide 7: summary
```

**Narration voice:** Narrative, storytelling, bringing characters to life. Use present tense for immediacy — "She opens her laptop. She types the prompt. And here is what comes back..."

---

### CHALLENGE (6 slides)
**Purpose:** Learner solves a problem with minimal hand-holding.

```
Slide 1: scenario
Slide 2: concept (brief reminder of the relevant knowledge)
Slide 3: practice (the challenge itself — more complex than usual, less guidance)
Slide 4: walkthrough (the solution — revealed AFTER the practice)
Slide 5: analysis (what made this challenging and how to handle similar situations)
Slide 6: summary (with level_up energy)
```

**Narration voice:** Direct, motivating, "you are ready for this." Less hand-holding. More "figure it out" energy. Celebrate afterward — "Did you get it? Even if your answer was different, the thinking process is what matters."

---

### LAB (8 slides)
**Purpose:** Extended hands-on practice with multiple exercises.

```
Slide 1: story_hook (why practice matters for this specific skill)
Slide 2: concept (quick review of the key technique)
Slide 3: multi_exercise (Exercise 1 — guided, easier)
Slide 4: multi_exercise (Exercise 2 — less guidance, moderate)
Slide 5: multi_exercise (Exercise 3 — minimal guidance, harder)
Slide 6: common_mistakes
Slide 7: practice (a final open-ended exercise the learner designs themselves)
Slide 8: summary
```

**Narration voice:** Energetic, workshop-style. "Let us keep going." "You are getting faster." Build momentum through the exercises. Each exercise narration should feel slightly more confident than the last.

---

### MILESTONE (6 slides)
**Purpose:** End of module. Combine skills, celebrate, bridge to next module.

```
Slide 1: story_hook (a character who uses ALL the skills from this module together)
Slide 2: walkthrough (showing the combined workflow — how skills chain together)
Slide 3: example_result (the combined result — more impressive than any single lesson)
Slide 4: quiz (testing the module's most important concept)
Slide 5: reflection
Slide 6: level_up
```

**Narration voice:** Celebratory, reflective, proud of the learner. "Look at what you can do now that you could not do at the start of this module." Build anticipation for the next module.

---

### WORKED_EXAMPLE (8 slides)
**Purpose:** Step through a solved problem (math/science/analytical).

```
Slide 1: story_hook (why this type of problem matters in real life)
Slide 2: concept (the key formula, theorem, or framework)
Slide 3: graph (if applicable — visualise the function/data)
Slide 4: worked_problem
Slide 5: quiz (test with a similar problem)
Slide 6: common_mistakes (calculation errors, sign errors, conceptual traps)
Slide 7: practice
Slide 8: summary
```

**Narration voice:** Precise, methodical, "follow along with me." Write on the board mentally. Pause at each step. Say "notice that" and "the reason we do this is."

---

### DEBATE (7 slides)
**Purpose:** Explore multiple perspectives. No single right answer.

```
Slide 1: provocative_question (framing the debate)
Slide 2: perspective (Perspective A — presented fairly and compellingly)
Slide 3: perspective (Perspective B — presented fairly and compellingly)
Slide 4: perspective (Perspective C — if applicable, or a synthesis)
Slide 5: analysis (comparing the perspectives — what each gets right and wrong)
Slide 6: reflection (where does the learner stand and why?)
Slide 7: summary
```

**Narration voice:** Balanced, thought-provoking. Present each side fairly. Use phrases like "people who hold this view argue that..." and "on the other hand..." Never declare a winner — let the learner decide.

---

## 7. Narration Voice Guide

### Per-Slide-Type Prosody Settings (for edge-tts)

```python
TTS_PROSODY = {
    # Slide type           (rate,     pitch)
    "provocative_question": ("-12%",  "-3Hz"),   # Slow, slightly lower — contemplative
    "story_hook":           ("-10%",  "-2Hz"),   # Slow, warm — storytelling
    "concept":              ("-8%",   "+0Hz"),   # Moderate — clear teaching
    "why_it_works":         ("-8%",   "+0Hz"),   # Moderate — clear teaching
    "revelation":           ("-15%",  "+2Hz"),   # Slow with slight lift — "aha" energy
    "walkthrough":          ("-15%",  "-3Hz"),   # Slowest — step by step
    "example_result":       ("-8%",   "+0Hz"),   # Moderate — showing results
    "common_mistakes":      ("-10%",  "-2Hz"),   # Slightly slow — cautionary
    "practice":             ("+0%",   "+3Hz"),   # Normal pace, slightly higher — energising
    "summary":              ("-7%",   "+0Hz"),   # Slightly slow — reflective
    "quiz":                 ("-10%",  "+2Hz"),   # Slow, slightly higher — questioning
    "level_up":             ("-5%",   "+3Hz"),   # Near normal, higher — celebratory
    "scenario":             ("-10%",  "-2Hz"),   # Slow — setting the scene
    "analysis":             ("-8%",   "+0Hz"),   # Moderate — analytical
    "perspective":          ("-8%",   "+0Hz"),   # Moderate — balanced
    "reflection":           ("-12%",  "-2Hz"),   # Slow — contemplative
    "character_intro":      ("-10%",  "-2Hz"),   # Slow — introducing someone
    "decision_point":       ("-12%",  "-3Hz"),   # Slow — building tension
    "comparison":           ("-8%",   "+0Hz"),   # Moderate — balanced analysis
    "multi_exercise":       ("-5%",   "+2Hz"),   # Slightly faster — workshop energy
    "worked_problem":       ("-15%",  "-3Hz"),   # Slowest — mathematical precision
    "graph":                ("-10%",  "+0Hz"),   # Slow — describing visuals
}
```

### Voice Selection Guide

```python
VOICE_BY_THEME = {
    "neural":     "en-GB-RyanNeural",      # British male — tech/professional
    "blueprint":  "en-GB-RyanNeural",      # British male — scientific authority
    "chalkboard": "en-US-GuyNeural",       # American male — academic
    "kinetic":    "en-US-JennyNeural",     # American female — business energy
    "organic":    "en-GB-SoniaNeural",     # British female — warm, calming
    "cinematic":  "en-GB-RyanNeural",      # British male — documentary
    "studio":     "en-US-JennyNeural",     # American female — creative
    "workshop":   "en-AU-WilliamNeural",   # Australian male — hands-on, approachable
}
```

---

## 8. Visual Theme System

### Theme Detection (Enhanced)

```python
THEME_KEYWORDS = {
    "neural": [
        "ai", "artificial intelligence", "machine learning", "deep learning",
        "chatgpt", "prompt", "automation", "digital", "technology", "tech",
        "software", "app", "data", "computer", "coding", "programming",
    ],
    "blueprint": [
        "physics", "engineering", "chemistry", "biology", "astronomy",
        "electronics", "robotics", "circuit", "mechanics", "thermodynamics",
        "science", "laboratory", "experiment", "research",
    ],
    "chalkboard": [
        "math", "algebra", "calculus", "geometry", "statistics", "equation",
        "formula", "theorem", "probability", "trigonometry",
    ],
    "kinetic": [
        "business", "marketing", "sales", "finance", "investing", "startup",
        "management", "leadership", "negotiation", "entrepreneurship",
        "career", "interview", "money", "wealth", "strategy", "growth",
    ],
    "organic": [
        "health", "wellness", "nutrition", "meditation", "yoga", "fitness",
        "psychology", "mental health", "mindfulness", "sleep", "stress",
        "habit", "brain", "body", "healing", "self-care",
    ],
    "cinematic": [
        "history", "culture", "language", "literature", "philosophy",
        "geography", "war", "empire", "revolution", "ancient", "medieval",
        "civilisation", "documentary", "biography", "religion", "mythology",
    ],
    "studio": [
        "art", "design", "music", "photography", "film", "animation",
        "illustration", "typography", "colour", "composition", "creative",
        "drawing", "painting", "sculpture", "craft",
    ],
    "workshop": [
        "cooking", "baking", "woodworking", "sewing", "knitting", "gardening",
        "repair", "diy", "build", "make", "hands-on", "recipe", "craft",
        "pottery", "metalwork", "electronics project",
    ],
}
```

### Theme Fallback
If no keywords match, let the LLM choose in Stage 1. The `visual_theme` field in the Course Intelligence output serves as the override.

---

## 9. JSON Schemas

### Stage 1 Output: Course Blueprint

```json
{
  "course_title": "Basic AI Skills for Everyday Life",
  "learner_profile": "Adults with no technical background who use smartphones and computers daily but have never used AI tools deliberately. They want to save time, work smarter, and feel confident with new technology.",
  "transformation": {
    "before": "Feels confused or intimidated by AI, has never used ChatGPT or similar tools, does not know how to get useful results from AI",
    "after": "Confidently uses 3-5 AI tools daily for writing, research, creativity, and productivity, and knows how to verify AI output and protect their privacy"
  },
  "skill_mix": {
    "conceptual": 6,
    "procedural": 9,
    "analytical": 4,
    "creative": 5,
    "physical": 0,
    "interpersonal": 2,
    "metacognitive": 5
  },
  "primary_skill_types": ["procedural", "conceptual"],
  "difficulty": {
    "overall": 3,
    "progression": "steady_climb",
    "description": "Starts with zero assumptions, builds gradually from understanding to using to evaluating AI tools"
  },
  "visual_theme": "neural",
  "emotional_arc": [
    {"module": 1, "feeling": "Curious and reassured — AI is not scary, I can do this"},
    {"module": 2, "feeling": "Excited and capable — I am actually using AI to get real results"},
    {"module": 3, "feeling": "Creative and ambitious — I can do more than I thought"},
    {"module": 4, "feeling": "Confident and independent — I own these skills and can keep growing"}
  ],
  "example_style": "mixed",
  "prerequisites": [],
  "course_description": "A hands-on course that takes you from AI-curious to AI-confident. Learn to use tools like ChatGPT, Gemini, and Canva to write faster, research smarter, and create more — with no technical background required."
}
```

### Stage 2 Output: Course Architecture

```json
{
  "course_title": "Basic AI Skills for Everyday Life",
  "course_description": "...",
  "modules": [
    {
      "title": "Understanding AI — What It Is and Why It Matters to You",
      "description": "Build a clear mental model of what AI is, what it can do, and how it already shows up in your daily life.",
      "order_index": 0,
      "emotional_tone": "Curious and reassured — AI is not scary, I can do this",
      "lessons": [
        {
          "title": "The AI Revolution Is Already in Your Pocket",
          "order_index": 0,
          "lesson_type": "awakening",
          "difficulty": 1,
          "key_concept": "AI is pattern recognition software you already use daily without realising it",
          "connects_to_next": "Now that you see AI is everywhere, the next lesson will explain exactly how it works — in plain language, no jargon.",
          "example_context": "Show AI features in apps people already use: autocorrect, Netflix, Google Maps, spam filters"
        },
        {
          "title": "How AI Actually Works — The Simple Version",
          "order_index": 1,
          "lesson_type": "foundation",
          "difficulty": 2,
          "key_concept": "AI learns from patterns in data and predicts what comes next — like a very fast, very well-read assistant",
          "connects_to_next": "You understand what AI is. Next, you are going to have your first real conversation with one.",
          "example_context": "Use the analogy of autocomplete on steroids — predicting the next word based on billions of sentences"
        },
        {
          "title": "Your First AI Conversation — Talk to ChatGPT Right Now",
          "order_index": 2,
          "lesson_type": "skill_build",
          "difficulty": 2,
          "key_concept": "Opening ChatGPT, typing a prompt, reading and using the response",
          "connects_to_next": "You just had your first AI conversation. In the next lesson, you will bring together everything from this module and see how powerful even basic AI skills can be.",
          "example_context": "Walk through opening ChatGPT on a phone, creating an account, typing a first prompt, using the response"
        },
        {
          "title": "Module 1 Complete — You Are Already Ahead of Most People",
          "order_index": 3,
          "lesson_type": "milestone",
          "difficulty": 2,
          "key_concept": "Combining awareness of AI with the ability to use it makes you more capable than 90% of people",
          "connects_to_next": "Module 2 will teach you the one skill that separates people who get amazing results from AI from people who get mediocre results — the art of asking the right question.",
          "example_context": "A character who went from never having used AI to confidently using it for a real task in one session"
        }
      ]
    }
  ]
}
```

### Stage 3 Output: Full Lesson JSON (per module)

```json
{
  "title": "Understanding AI — What It Is and Why It Matters to You",
  "description": "Build a clear mental model of what AI is and how it already shows up in your daily life.",
  "order_index": 0,
  "lessons": [
    {
      "title": "The AI Revolution Is Already in Your Pocket",
      "order_index": 0,
      "lesson_type": "awakening",
      "slides": [
        {
          "type": "provocative_question",
          "heading": "What If You Have Been Using Artificial Intelligence Every Day Without Knowing It?",
          "subtext": "The answer might change how you think about your phone, your apps, and your future.",
          "narration": "Here is a question that might surprise you. What if I told you that you have been using artificial intelligence every single day — probably dozens of times — without even realising it? I am not talking about robots or science fiction. I am talking about the apps on your phone right now. The ones you opened this morning. The ones you will open again tonight. Most people think AI is something complicated, something for tech experts, something from the future. But the truth is, AI is already woven into your daily life. And once you see it, you cannot unsee it. That is what this lesson is about. By the end, you will spot AI everywhere — and more importantly, you will understand how to use it on purpose."
        },
        {
          "type": "story_hook",
          "heading": "James Thought AI Had Nothing to Do With His Life",
          "story": "James is a 42-year-old project manager who considers himself 'not a tech person.' He uses his phone for email, maps, and messaging — nothing fancy. He had no idea that every time Google Maps rerouted him around traffic, every time Gmail suggested a reply, and every time Netflix recommended a show, AI was making those decisions for him.",
          "narration": "Let me tell you about James. He is 42, works as a project manager, and if you asked him about artificial intelligence, he would say it has nothing to do with his life. He is not a tech person. He uses his phone for the basics — email, maps, messaging, maybe some YouTube. Nothing fancy. But here is what James did not realise. Every single morning, when Google Maps told him to take a different route to avoid traffic — that was AI, analysing millions of drivers in real time. When Gmail suggested 'Sounds good, thanks!' as a quick reply — that was AI, predicting what he wanted to say. When Netflix showed him a thriller he ended up loving — that was AI, studying his viewing patterns. James was using AI a dozen times a day. He just did not know it. And that is exactly where most people are right now. The question is — what happens when you start using it on purpose?"
        }
      ]
    }
  ]
}
```

---

## 10. Production Pipeline Notes

### Minimum Slide Duration Overrides (by slide type)

```python
MIN_SLIDE_FRAMES = {
    "provocative_question": 8  * FPS,   # Let the question breathe
    "story_hook":           12 * FPS,   # Story needs time
    "concept":              12 * FPS,   # Explanation needs time
    "why_it_works":         12 * FPS,
    "revelation":           10 * FPS,   # Shorter — impact comes from delivery
    "walkthrough":          50 * FPS,   # Long — each step needs 10+ seconds
    "example_result":       12 * FPS,
    "common_mistakes":      12 * FPS,
    "practice":             15 * FPS,   # Includes timer pause
    "summary":              10 * FPS,
    "quiz":                 22 * FPS,   # Thinking time + reveal
    "level_up":             8  * FPS,   # Celebration is brief
    "scenario":             12 * FPS,
    "analysis":             12 * FPS,
    "perspective":          12 * FPS,
    "reflection":           10 * FPS,
    "character_intro":      12 * FPS,
    "decision_point":       12 * FPS,
    "comparison":           14 * FPS,
    "multi_exercise":       15 * FPS,
    "worked_problem":       14 * FPS,
    "graph":                12 * FPS,
}
```

### Narration Validation

```python
NARRATION_LIMITS = {
    # slide_type:           (min_words, max_words)
    "provocative_question": (80,  110),
    "story_hook":           (120, 160),
    "concept":              (120, 160),
    "why_it_works":         (120, 160),
    "revelation":           (120, 160),
    "walkthrough":          (200, 270),
    "example_result":       (120, 160),
    "common_mistakes":      (120, 160),
    "practice":             (120, 160),
    "summary":              (120, 160),
    "quiz":                 (80,  110),
    "level_up":             (80,  110),
    "scenario":             (120, 160),
    "analysis":             (120, 160),
    "perspective":          (120, 160),
    "reflection":           (100, 130),
    "character_intro":      (120, 160),
    "decision_point":       (120, 160),
    "comparison":           (120, 160),
    "multi_exercise":       (120, 160),
    "worked_problem":       (200, 270),
    "graph":                (120, 160),
}
```

### Image Generation Per Slide Type

```python
# Which slide types get contextual AI-generated images
IMAGE_SLIDE_TYPES = {
    "story_hook",
    "example_result",
    "character_intro",
    "scenario",
    "concept",         # Only if visual_hint is not "default"
}

# Slide types that should NEVER get images (visual is handled by Remotion components)
NO_IMAGE_TYPES = {
    "walkthrough",     # Step list is the visual
    "worked_problem",  # Math rendering is the visual
    "graph",           # Graph component is the visual
    "quiz",            # Quiz UI is the visual
    "multi_exercise",  # Exercise UI is the visual
    "comparison",      # Comparison layout is the visual
    "level_up",        # Achievement animation is the visual
}
```

---

## 11. Quality Validation

### Post-Generation Checks

After Stage 3 generates a module, run these validation checks before proceeding to production:

```python
def validate_module(module: dict, architecture: dict) -> list[str]:
    """Returns a list of issues found. Empty list = valid."""
    issues = []

    for lesson in module["lessons"]:
        lesson_type = lesson["lesson_type"]
        slides = lesson["slides"]

        # 1. Check slide count matches lesson type definition
        expected_count = LESSON_TYPE_SLIDE_COUNTS[lesson_type]
        if len(slides) != expected_count:
            issues.append(
                f"Lesson '{lesson['title']}': expected {expected_count} slides "
                f"for type '{lesson_type}', got {len(slides)}"
            )

        # 2. Check slide types match template
        expected_types = LESSON_TYPE_TEMPLATES[lesson_type]
        actual_types = [s["type"] for s in slides]
        if actual_types != expected_types:
            issues.append(
                f"Lesson '{lesson['title']}': slide types don't match "
                f"'{lesson_type}' template. Expected {expected_types}, got {actual_types}"
            )

        # 3. Check narration lengths
        for i, slide in enumerate(slides):
            narration = slide.get("narration", "")
            word_count = len(narration.split())
            min_w, max_w = NARRATION_LIMITS.get(slide["type"], (100, 160))
            if word_count < min_w:
                issues.append(
                    f"Lesson '{lesson['title']}', slide {i} ({slide['type']}): "
                    f"narration too short ({word_count} words, minimum {min_w})"
                )
            if word_count > max_w + 30:  # Allow small overflow
                issues.append(
                    f"Lesson '{lesson['title']}', slide {i} ({slide['type']}): "
                    f"narration too long ({word_count} words, maximum {max_w})"
                )

        # 4. Check required fields per slide type
        for i, slide in enumerate(slides):
            required = SLIDE_REQUIRED_FIELDS.get(slide["type"], [])
            for field in required:
                if not slide.get(field):
                    issues.append(
                        f"Lesson '{lesson['title']}', slide {i} ({slide['type']}): "
                        f"missing required field '{field}'"
                    )

        # 5. Check examples exist
        example_slides = [s for s in slides if s["type"] in
                         ("example_result", "walkthrough", "story_hook", "character_intro")]
        if len(example_slides) < 1:
            issues.append(
                f"Lesson '{lesson['title']}': no example or story slides found"
            )

        # 6. Check walkthrough has example_prompt and ai_response
        for slide in slides:
            if slide["type"] == "walkthrough":
                if not slide.get("example_prompt"):
                    issues.append(f"Lesson '{lesson['title']}': walkthrough missing example_prompt")
                if not slide.get("ai_response"):
                    issues.append(f"Lesson '{lesson['title']}': walkthrough missing ai_response")

    # 7. Check lesson type variety within module
    types_used = set(l["lesson_type"] for l in module["lessons"])
    if len(types_used) < 3:
        issues.append(
            f"Module '{module['title']}': only {len(types_used)} lesson types used — "
            f"need at least 3 for variety"
        )

    # 8. Check no two adjacent lessons have same type
    for i in range(len(module["lessons"]) - 1):
        if module["lessons"][i]["lesson_type"] == module["lessons"][i+1]["lesson_type"]:
            issues.append(
                f"Module '{module['title']}': lessons {i} and {i+1} are both "
                f"'{module['lessons'][i]['lesson_type']}' — adjacent lessons must differ"
            )

    return issues
```

### Required Fields Per Slide Type

```python
SLIDE_REQUIRED_FIELDS = {
    "provocative_question": ["heading", "subtext", "narration"],
    "story_hook":           ["heading", "story", "narration"],
    "concept":              ["heading", "bullets", "narration"],
    "why_it_works":         ["heading", "bullets", "narration"],
    "revelation":           ["heading", "explanation", "narration"],
    "walkthrough":          ["heading", "steps", "example_prompt", "ai_response", "narration"],
    "example_result":       ["heading", "bullets", "narration"],
    "common_mistakes":      ["heading", "bullets", "narration"],
    "practice":             ["heading", "task", "example_prompt", "narration"],
    "summary":              ["heading", "bullets", "narration"],
    "quiz":                 ["heading", "question", "quiz_options", "narration"],
    "level_up":             ["heading", "achievement", "narration"],
    "scenario":             ["heading", "scenario_text", "question", "narration"],
    "analysis":             ["heading", "bullets", "narration"],
    "perspective":          ["heading", "argument", "evidence", "narration"],
    "reflection":           ["heading", "question", "prompts", "narration"],
    "character_intro":      ["heading", "background", "stakes", "narration"],
    "decision_point":       ["heading", "context", "options", "chosen", "narration"],
    "comparison":           ["heading", "option_a", "option_b", "verdict", "narration"],
    "multi_exercise":       ["heading", "instruction", "example_input", "expected_output", "narration"],
    "worked_problem":       ["heading", "math_steps", "narration"],
    "graph":                ["heading", "graph_data", "narration"],
}
```

---

## Appendix: Lesson Type Quick Reference

```python
LESSON_TYPE_TEMPLATES = {
    "awakening":      ["provocative_question", "story_hook", "revelation", "concept", "practice", "summary"],
    "foundation":     ["story_hook", "concept", "why_it_works", "example_result", "common_mistakes", "practice", "summary"],
    "skill_build":    ["story_hook", "concept", "walkthrough", "example_result", "common_mistakes", "quiz", "practice", "summary"],
    "deep_dive":      ["provocative_question", "concept", "why_it_works", "comparison", "example_result", "reflection", "summary"],
    "case_study":     ["character_intro", "concept", "decision_point", "walkthrough", "example_result", "analysis", "summary"],
    "challenge":      ["scenario", "concept", "practice", "walkthrough", "analysis", "summary"],
    "lab":            ["story_hook", "concept", "multi_exercise", "multi_exercise", "multi_exercise", "common_mistakes", "practice", "summary"],
    "milestone":      ["story_hook", "walkthrough", "example_result", "quiz", "reflection", "level_up"],
    "worked_example": ["story_hook", "concept", "graph", "worked_problem", "quiz", "common_mistakes", "practice", "summary"],
    "debate":         ["provocative_question", "perspective", "perspective", "perspective", "analysis", "reflection", "summary"],
}

LESSON_TYPE_SLIDE_COUNTS = {k: len(v) for k, v in LESSON_TYPE_TEMPLATES.items()}
```

---

*End of architecture specification.*
*Version: 2.0*
*Engine: nest-gen v2 — Universal Educational Video Engine*