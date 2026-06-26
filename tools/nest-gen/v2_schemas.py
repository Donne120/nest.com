"""
nest-gen v2 — Complete Schema Definitions (FULL REBUILD)

All lesson type templates match rebuild.md exactly.
All slide types defined with field schemas for LLM prompts.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict, field
from datetime import datetime
import json


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════

class SkillType(Enum):
    CONCEPTUAL    = "conceptual"
    PROCEDURAL    = "procedural"
    ANALYTICAL    = "analytical"
    CREATIVE      = "creative"
    PHYSICAL      = "physical"
    INTERPERSONAL = "interpersonal"
    METACOGNITIVE = "metacognitive"


class DifficultyProgression(Enum):
    STEADY_CLIMB    = "steady_climb"
    PLATEAU_AND_JUMP = "plateau_and_jump"
    WAVE            = "wave"
    FRONT_LOADED    = "front_loaded"
    BACK_LOADED     = "back_loaded"


class VisualTheme(Enum):
    NEURAL     = "neural"
    BLUEPRINT  = "blueprint"
    CHALKBOARD = "chalkboard"
    KINETIC    = "kinetic"
    ORGANIC    = "organic"
    CINEMATIC  = "cinematic"
    STUDIO     = "studio"
    WORKSHOP   = "workshop"


class ExampleStyle(Enum):
    WORKPLACE  = "workplace"
    EVERYDAY   = "everyday"
    STUDENT    = "student"
    CREATIVE   = "creative"
    TECHNICAL  = "technical"
    MIXED      = "mixed"


class LessonType(Enum):
    AWAKENING     = "awakening"
    FOUNDATION    = "foundation"
    SKILL_BUILD   = "skill_build"
    DEEP_DIVE     = "deep_dive"
    CASE_STUDY    = "case_study"
    CHALLENGE     = "challenge"
    LAB           = "lab"
    MILESTONE     = "milestone"
    WORKED_EXAMPLE = "worked_example"
    DEBATE        = "debate"


# ═══════════════════════════════════════════════════════════════════════════
# LESSON TYPE TEMPLATES — exact spec from rebuild.md appendix
# ═══════════════════════════════════════════════════════════════════════════

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

LESSON_TYPE_PURPOSE = {
    "awakening":      "Make the learner care about this topic before teaching anything. Feel: Curiosity, relevance, 'I need to learn this.'",
    "foundation":     "Build core understanding of a concept, theory, or framework. Feel: Clarity, 'now I understand how this works.'",
    "skill_build":    "Step-by-step skill acquisition. The learner follows along and does something. Feel: Guided confidence, 'I just did it myself.'",
    "deep_dive":      "Explore complexity, nuance, edge cases, and advanced considerations. Feel: Intellectual depth, 'there is more to this than I thought.'",
    "case_study":     "Learn through a real-world story. Show how knowledge applies in practice. Feel: Storytelling, 'I can see how this works in real life.'",
    "challenge":      "Learner solves a problem with minimal hand-holding. Feel: Productive struggle, 'I figured it out myself.'",
    "lab":            "Extended hands-on practice with multiple exercises and feedback. Feel: Workshop energy, 'I am getting faster and better.'",
    "milestone":      "Combine skills from the module, celebrate progress, bridge to next module. Feel: Accomplishment, 'look how far I have come.'",
    "worked_example": "Step through a complete solved problem showing all working. Feel: Clarity, 'I can follow every step.'",
    "debate":         "Explore multiple perspectives on a question. No single right answer. Feel: Critical thinking, 'I can form my own view.'",
}

NARRATION_VOICE_BY_LESSON = {
    "awakening":      "enthusiastic, storytelling, drawing the learner in — build curiosity and urgency",
    "foundation":     "clear, patient, building understanding brick by brick — use analogies",
    "skill_build":    "encouraging, step-by-step, 'we are doing this together' — slow down during walkthrough",
    "deep_dive":      "thoughtful, analytical, 'let us look closer' — acknowledge complexity",
    "case_study":     "narrative, storytelling, bringing characters to life — use present tense for immediacy",
    "challenge":      "direct, motivating, 'you are ready for this' — less hand-holding, celebrate after",
    "lab":            "energetic, workshop-style, 'let us keep practising' — build momentum",
    "milestone":      "celebratory, reflective, proud of the learner — 'look at what you can do now'",
    "worked_example": "precise, methodical, 'follow along with me' — pause at each step",
    "debate":         "balanced, thought-provoking, 'what do you think?' — present each side fairly",
}


# ═══════════════════════════════════════════════════════════════════════════
# TTS PROSODY — per slide type (for edge-tts)
# ═══════════════════════════════════════════════════════════════════════════

TTS_PROSODY = {
    # slide_type:               (rate,   pitch)
    "provocative_question":     ("-12%", "-3Hz"),
    "story_hook":               ("-10%", "-2Hz"),
    "concept":                  ("-8%",  "+0Hz"),
    "why_it_works":             ("-8%",  "+0Hz"),
    "revelation":               ("-15%", "+2Hz"),
    "walkthrough":              ("-15%", "-3Hz"),
    "example_result":           ("-8%",  "+0Hz"),
    "common_mistakes":          ("-10%", "-2Hz"),
    "practice":                 ("+0%",  "+3Hz"),
    "summary":                  ("-7%",  "+0Hz"),
    "quiz":                     ("-10%", "+2Hz"),
    "level_up":                 ("-5%",  "+3Hz"),
    "scenario":                 ("-10%", "-2Hz"),
    "analysis":                 ("-8%",  "+0Hz"),
    "perspective":              ("-8%",  "+0Hz"),
    "reflection":               ("-12%", "-2Hz"),
    "character_intro":          ("-10%", "-2Hz"),
    "decision_point":           ("-12%", "-3Hz"),
    "comparison":               ("-8%",  "+0Hz"),
    "multi_exercise":           ("-5%",  "+2Hz"),
    "worked_problem":           ("-15%", "-3Hz"),
    "graph":                    ("-10%", "+0Hz"),
}

DEFAULT_PROSODY = ("-8%", "+0Hz")


# ═══════════════════════════════════════════════════════════════════════════
# VOICE BY THEME
# ═══════════════════════════════════════════════════════════════════════════

VOICE_BY_THEME = {
    "neural":     "en-GB-RyanNeural",
    "blueprint":  "en-GB-RyanNeural",
    "chalkboard": "en-US-GuyNeural",
    "kinetic":    "en-US-JennyNeural",
    "organic":    "en-GB-SoniaNeural",
    "cinematic":  "en-GB-RyanNeural",
    "studio":     "en-US-JennyNeural",
    "workshop":   "en-AU-WilliamNeural",
}

DEFAULT_VOICE = "en-GB-RyanNeural"


# ═══════════════════════════════════════════════════════════════════════════
# NARRATION WORD COUNT LIMITS — hard constraints
# ═══════════════════════════════════════════════════════════════════════════

NARRATION_LIMITS = {
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


# ═══════════════════════════════════════════════════════════════════════════
# SLIDE REQUIRED FIELDS — used in validation
# ═══════════════════════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════════════════════
# IMAGE GENERATION RULES
# ═══════════════════════════════════════════════════════════════════════════

IMAGE_SLIDE_TYPES = {"story_hook", "example_result", "character_intro", "scenario", "concept"}
NO_IMAGE_TYPES = {"walkthrough", "worked_problem", "graph", "quiz", "multi_exercise", "comparison", "level_up"}


# ═══════════════════════════════════════════════════════════════════════════
# SLIDE JSON SCHEMAS — shown to LLM in Stage 3 prompt
# ═══════════════════════════════════════════════════════════════════════════

SLIDE_JSON_SCHEMAS = {
    "provocative_question": """\
{
  "type": "provocative_question",
  "heading": "<question — direct, personal, slightly uncomfortable>",
  "subtext": "<one sentence making the question feel urgent>",
  "narration": "<80-100 words: pose question, let it sit, hint at answer>"
}""",

    "story_hook": """\
{
  "type": "story_hook",
  "heading": "<problem this story illustrates — phrased as a struggle>",
  "story": "<2-3 sentences: named character, specific situation, cost of the problem>",
  "narration": "<120-150 words: tell story vividly, build empathy, promise a solution>"
}""",

    "revelation": """\
{
  "type": "revelation",
  "heading": "<the key insight — stated as a surprising truth>",
  "explanation": "<2-3 sentences unpacking why this insight matters>",
  "narration": "<120-150 words: build to the insight, deliver it clearly, explain why it changes everything>"
}""",

    "concept": """\
{
  "type": "concept",
  "heading": "<name of the concept — simple, clear>",
  "bullets": ["<4 short statements explaining what it IS — plain language>"],
  "visual_hint": "<default | timeline | cycle | stats | comparison>",
  "narration": "<120-150 words: explain with one memorable analogy>"
}""",

    "why_it_works": """\
{
  "type": "why_it_works",
  "heading": "Why This Works",
  "bullets": ["<4 bullets explaining the LOGIC — not just what, but WHY>"],
  "visual_hint": "<default | stats>",
  "narration": "<120-150 words: use real-world comparison, help learner feel confident in the reasoning>"
}""",

    "walkthrough": """\
{
  "type": "walkthrough",
  "heading": "Step By Step — Let Us Do It Together",
  "steps": ["<5 numbered action-first instructions — specific, what to click/type/do>"],
  "example_prompt": "<exact text to type or action to take — ready to copy>",
  "ai_response": "<realistic result — 2-4 sentences, specific and useful>",
  "narration": "<200-260 words: walk through EACH step slowly, describe what learner sees, pause between steps>"
}""",

    "example_result": """\
{
  "type": "example_result",
  "heading": "<Character Name>'s Result",
  "bullets": [
    "Situation: <who they are and what they needed>",
    "Action: <exactly what they did>",
    "Result: <specific outcome — time, money, quality>",
    "What changed: <how their work or life improved>"
  ],
  "narration": "<120-150 words: tell story concretely, make result feel achievable>"
}""",

    "common_mistakes": """\
{
  "type": "common_mistakes",
  "heading": "What Goes Wrong — And How to Fix It",
  "bullets": [
    "Mistake: <specific> → Fix: <specific>",
    "Mistake: <specific> → Fix: <specific>",
    "Mistake: <specific> → Fix: <specific>",
    "Mistake: <specific> → Fix: <specific>"
  ],
  "narration": "<120-150 words: walk through each mistake conversationally, be reassuring>"
}""",

    "practice": """\
{
  "type": "practice",
  "heading": "Your Turn — Do It Right Now",
  "task": "<one clear instruction — exactly what to open and do>",
  "example_prompt": "<ready-to-use prompt or task with [placeholders] for personalisation>",
  "timer_seconds": 120,
  "narration": "<120-150 words: tell them to pause, walk through what to do, reassure imperfect is fine>"
}""",

    "summary": """\
{
  "type": "summary",
  "heading": "What You Can Do Now",
  "bullets": [
    "You can now <specific skill>.",
    "You understand <specific concept>.",
    "You know <specific knowledge>.",
    "Your next step: <specific action to take today>."
  ],
  "narration": "<120-150 words: celebrate, name the skill, give one action for today, tease next lesson>"
}""",

    "quiz": """\
{
  "type": "quiz",
  "heading": "Quick Check",
  "question": "<clear question testing the lesson's key concept>",
  "quiz_options": [
    {"text": "<option A>", "correct": false},
    {"text": "<correct answer>", "correct": true},
    {"text": "<option C>", "correct": false},
    {"text": "<option D>", "correct": false}
  ],
  "narration": "<80-100 words: pose question, pause, reveal answer, explain why>"
}""",

    "level_up": """\
{
  "type": "level_up",
  "heading": "Level Up — You Just <Specific Achievement>",
  "achievement": "<one sentence naming exactly what the learner can now do>",
  "stats": {
    "skills_learned": <number>,
    "lessons_completed": <number>,
    "next_module": "<next module title or 'Course Complete'>"
  },
  "narration": "<80-100 words: celebrate warmly, name the achievement, build excitement for what is next>"
}""",

    "scenario": """\
{
  "type": "scenario",
  "heading": "The Situation",
  "scenario_text": "<3-5 sentences describing a realistic situation with enough detail to make decisions>",
  "question": "<What would you do? — the specific decision the learner must consider>",
  "narration": "<120-150 words: paint the scenario vividly, pose the question, tell them to think before continuing>"
}""",

    "analysis": """\
{
  "type": "analysis",
  "heading": "What Actually Happened — And Why",
  "bullets": [
    "Key decision: <what was chosen and why>",
    "What worked: <the effective parts>",
    "What could improve: <the missed opportunities>",
    "Takeaway: <the principle to remember>"
  ],
  "narration": "<120-150 words: analytical, fair, drawing out the lesson>"
}""",

    "perspective": """\
{
  "type": "perspective",
  "heading": "Perspective: <Name of viewpoint>",
  "argument": "<2-3 sentences presenting this perspective's core argument>",
  "evidence": "<1-2 sentences of supporting evidence or reasoning>",
  "weakness": "<1 sentence acknowledging the limitation of this view>",
  "narration": "<120-150 words: present fairly and compellingly, acknowledge strengths and limits>"
}""",

    "reflection": """\
{
  "type": "reflection",
  "heading": "Think About This",
  "question": "<thoughtful question connecting the lesson to the learner's own experience>",
  "prompts": ["<sub-question 1>", "<sub-question 2>", "<sub-question 3>"],
  "narration": "<100-120 words: ask the question, give space, suggest thinking time>"
}""",

    "character_intro": """\
{
  "type": "character_intro",
  "heading": "<Name> — <their role/situation in 5 words>",
  "background": "<3-4 sentences: who they are, what they do, what problem they face>",
  "stakes": "<1 sentence: what happens if they do not solve this problem>",
  "narration": "<120-150 words: bring this person to life, make the learner care about their outcome>"
}""",

    "decision_point": """\
{
  "type": "decision_point",
  "heading": "The Moment of Decision",
  "context": "<2 sentences: what led to this point>",
  "options": ["<Option A: what they could do>", "<Option B: what they could do>", "<Option C: what they could do>"],
  "chosen": "<which option was chosen and why>",
  "narration": "<120-150 words: build tension, present options, reveal the choice>"
}""",

    "comparison": """\
{
  "type": "comparison",
  "heading": "Comparing <A> vs <B>",
  "option_a": {"name": "<name>", "points": ["<strength 1>", "<strength 2>", "<weakness>"]},
  "option_b": {"name": "<name>", "points": ["<strength 1>", "<strength 2>", "<weakness>"]},
  "verdict": "<one sentence on when to use each>",
  "narration": "<120-150 words: walk through both fairly, give a clear recommendation>"
}""",

    "multi_exercise": """\
{
  "type": "multi_exercise",
  "heading": "Exercise <N>: <Task name>",
  "instruction": "<what to do — specific and complete>",
  "example_input": "<the exact input to use>",
  "expected_output": "<what a good result looks like>",
  "tip": "<one sentence of guidance>",
  "narration": "<120-150 words: guide through the exercise, describe expected results>"
}""",

    "worked_problem": """\
{
  "type": "worked_problem",
  "heading": "Let Us Solve It — Step By Step",
  "math_steps": [
    {"expression": "<step 1 expression>", "annotation": "<what this step does>", "highlight": false},
    {"expression": "<step 2 expression>", "annotation": "<what this step does>", "highlight": false},
    {"expression": "<final answer>", "annotation": "<final answer label>", "highlight": true}
  ],
  "narration": "<200-260 words: talk through every step as if writing on a board>"
}""",

    "graph": """\
{
  "type": "graph",
  "heading": "Visualising <Function Name>",
  "graph_data": {
    "x_range": [<min>, <max>],
    "y_range": [<min>, <max>],
    "points": [{"x": <x>, "y": <y>}],
    "key_points": [{"x": <x>, "y": <y>, "label": "<label>"}],
    "function_label": "<y = expression>",
    "x_label": "x",
    "y_label": "y",
    "shade_under": false
  },
  "narration": "<120-150 words: describe what the graph shows, point out key features>"
}""",
}


# ═══════════════════════════════════════════════════════════════════════════
# VISUAL THEME DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

THEME_DEFINITIONS = {
    "neural":     {"primary": "#0a0e27", "accent": "#00ff88",  "text": "#ffffff", "desc": "Technology, AI, digital — dark backgrounds, glowing accents"},
    "blueprint":  {"primary": "#003d82", "accent": "#00d4ff",  "text": "#ffffff", "desc": "Science, engineering — grid patterns, precise lines"},
    "chalkboard": {"primary": "#1b4332", "accent": "#f1faee",  "text": "#f1faee", "desc": "Mathematics — dark green, chalk-white text"},
    "kinetic":    {"primary": "#ff006e", "accent": "#ffbe0b",  "text": "#ffffff", "desc": "Business, leadership — bold colours, dynamic shapes"},
    "organic":    {"primary": "#52b788", "accent": "#d8f3dc",  "text": "#1b4332", "desc": "Health, wellness — soft greens, rounded shapes"},
    "cinematic":  {"primary": "#2a2a2a", "accent": "#d4a574",  "text": "#ffffff", "desc": "History, culture — film grain, warm tones"},
    "studio":     {"primary": "#f8f8f8", "accent": "#ff0000",  "text": "#000000", "desc": "Creative arts — minimal, gallery-white, accent pops"},
    "workshop":   {"primary": "#8b5a3c", "accent": "#d4a574",  "text": "#ffffff", "desc": "Hands-on skills — warm wood tones, tactile textures"},
}

THEME_KEYWORDS = {
    "neural":     ["ai", "artificial intelligence", "machine learning", "chatgpt", "prompt", "automation", "digital", "technology", "tech", "software", "coding", "programming"],
    "blueprint":  ["physics", "engineering", "chemistry", "biology", "electronics", "robotics", "mechanics", "science", "laboratory", "experiment"],
    "chalkboard": ["math", "algebra", "calculus", "geometry", "statistics", "equation", "formula", "theorem", "probability", "trigonometry"],
    "kinetic":    ["business", "marketing", "sales", "finance", "investing", "management", "leadership", "negotiation", "career", "money", "strategy"],
    "organic":    ["health", "wellness", "nutrition", "meditation", "fitness", "psychology", "mental health", "mindfulness", "sleep", "habit"],
    "cinematic":  ["history", "culture", "language", "literature", "philosophy", "geography", "war", "ancient", "civilisation", "religion"],
    "studio":     ["art", "design", "music", "photography", "film", "animation", "illustration", "typography", "creative", "drawing", "painting"],
    "workshop":   ["cooking", "baking", "woodworking", "sewing", "gardening", "repair", "diy", "build", "make", "recipe", "pottery"],
}


def detect_theme(title: str) -> str:
    title_lower = title.lower()
    for theme, keywords in THEME_KEYWORDS.items():
        if any(kw in title_lower for kw in keywords):
            return theme
    return "neural"  # default


# ═══════════════════════════════════════════════════════════════════════════
# STAGE 1, 2, 3 DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Transformation:
    before: str
    after: str


@dataclass
class SkillMix:
    conceptual: int = 0
    procedural: int = 0
    analytical: int = 0
    creative: int = 0
    physical: int = 0
    interpersonal: int = 0
    metacognitive: int = 0


@dataclass
class Difficulty:
    overall: int
    progression: DifficultyProgression
    description: str


@dataclass
class EmotionalArcModule:
    module: int
    feeling: str


@dataclass
class CourseIntelligence:
    course_title: str
    learner_profile: str
    transformation: Transformation
    skill_mix: SkillMix
    primary_skill_types: List[SkillType]
    difficulty: Difficulty
    visual_theme: VisualTheme
    emotional_arc: List[EmotionalArcModule]
    example_style: ExampleStyle
    prerequisites: List[str]
    course_description: str
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "course_title": self.course_title,
            "learner_profile": self.learner_profile,
            "transformation": {"before": self.transformation.before, "after": self.transformation.after},
            "skill_mix": asdict(self.skill_mix),
            "primary_skill_types": [s.value for s in self.primary_skill_types],
            "difficulty": {
                "overall": self.difficulty.overall,
                "progression": self.difficulty.progression.value,
                "description": self.difficulty.description,
            },
            "visual_theme": self.visual_theme.value,
            "emotional_arc": [asdict(a) for a in self.emotional_arc],
            "example_style": self.example_style.value,
            "prerequisites": self.prerequisites,
            "course_description": self.course_description,
            "generated_at": self.generated_at,
        }


@dataclass
class LessonArchitecture:
    title: str
    order_index: int
    lesson_type: LessonType
    difficulty: int
    key_concept: str
    connects_to_next: str
    example_context: str


@dataclass
class ModuleArchitecture:
    title: str
    description: str
    order_index: int
    emotional_tone: str
    lessons: List[LessonArchitecture]


@dataclass
class CourseArchitecture:
    course_title: str
    course_description: str
    n_modules: int
    n_lessons_per_module: int
    modules: List[ModuleArchitecture]
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "course_title": self.course_title,
            "course_description": self.course_description,
            "n_modules": self.n_modules,
            "n_lessons_per_module": self.n_lessons_per_module,
            "modules": [
                {
                    "title": mod.title,
                    "description": mod.description,
                    "order_index": mod.order_index,
                    "emotional_tone": mod.emotional_tone,
                    "lessons": [
                        {
                            "title": l.title,
                            "order_index": l.order_index,
                            "lesson_type": l.lesson_type.value,
                            "difficulty": l.difficulty,
                            "key_concept": l.key_concept,
                            "connects_to_next": l.connects_to_next,
                            "example_context": l.example_context,
                        }
                        for l in mod.lessons
                    ],
                }
                for mod in self.modules
            ],
            "generated_at": self.generated_at,
        }


# ═══════════════════════════════════════════════════════════════════════════
# POST-GENERATION VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def validate_module(module: dict) -> list:
    """Validate a generated module dict. Returns list of issue strings. Empty = valid."""
    issues = []

    lessons = module.get("lessons", [])

    for lesson in lessons:
        lesson_type = lesson.get("lesson_type", "").lower()
        slides = lesson.get("slides", [])
        title = lesson.get("title", "?")

        expected_count = LESSON_TYPE_SLIDE_COUNTS.get(lesson_type)
        if expected_count is None:
            issues.append(f"Lesson '{title}': unknown lesson_type '{lesson_type}'")
            continue

        if len(slides) != expected_count:
            issues.append(f"Lesson '{title}': expected {expected_count} slides for '{lesson_type}', got {len(slides)}")

        expected_types = LESSON_TYPE_TEMPLATES.get(lesson_type, [])
        actual_types = [s.get("type", "") for s in slides]
        if actual_types != expected_types:
            issues.append(f"Lesson '{title}': slide types mismatch. Expected {expected_types}, got {actual_types}")

        for i, slide in enumerate(slides):
            stype = slide.get("type", "")
            narration = slide.get("narration", "")
            word_count = len(narration.split())
            limits = NARRATION_LIMITS.get(stype, (100, 160))
            if word_count < limits[0]:
                issues.append(f"Lesson '{title}', slide {i} ({stype}): narration too short ({word_count} words, min {limits[0]})")
            elif word_count > limits[1] + 30:
                issues.append(f"Lesson '{title}', slide {i} ({stype}): narration too long ({word_count} words, max {limits[1]})")

            required = SLIDE_REQUIRED_FIELDS.get(stype, [])
            for f_name in required:
                if not slide.get(f_name):
                    issues.append(f"Lesson '{title}', slide {i} ({stype}): missing field '{f_name}'")

    types_used = set(l.get("lesson_type") for l in lessons)
    if len(types_used) < min(3, len(lessons)):
        issues.append(f"Module '{module.get('title', '?')}': only {len(types_used)} lesson type(s) — need variety")

    for i in range(len(lessons) - 1):
        if lessons[i].get("lesson_type") == lessons[i + 1].get("lesson_type"):
            issues.append(f"Module '{module.get('title', '?')}': lessons {i} and {i+1} both '{lessons[i].get('lesson_type')}' — adjacent must differ")

    return issues


# ═══════════════════════════════════════════════════════════════════════════
# JSON SERIALIZATION HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def course_intelligence_to_json(obj: CourseIntelligence) -> str:
    return json.dumps(obj.to_dict(), indent=2, default=str)


def course_architecture_to_json(obj: CourseArchitecture) -> str:
    return json.dumps(obj.to_dict(), indent=2, default=str)
