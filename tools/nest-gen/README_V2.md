# nest-gen v2: Universal Educational Video Engine

**The most powerful, intelligent AI course generator ever built.**

Create professional educational video courses on ANY topic from a single title. Every course feels hand-designed by a subject-matter expert because the engine actually understands what each topic needs.

---

## The Philosophy

A course on "Quantum Mechanics" and a course on "How to Negotiate a Raise" should feel like they were taught by different expert teachers — because they WERE.

nest-gen v2 doesn't use templates. It uses **intelligence**.

---

## Four-Stage Pipeline

### 1. COURSE INTELLIGENCE (Analyze)
Analyzes the course title and determines:
- Who this course is for (specific learner profile, not generic)
- What transformation the learner makes (before → after)
- What skill types are involved (conceptual, procedural, analytical, creative, physical, interpersonal, metacognitive)
- Difficulty level and progression curve
- Visual theme that matches the subject
- Emotional arc across the course

**Output:** Course blueprint (2,000 tokens)

### 2. COURSE ARCHITECTURE (Design)
Uses the blueprint to design the full course structure:
- Module titles and descriptions
- Lesson titles within each module
- **Lesson TYPE for each lesson** (10 distinct types, not 1 template for all)
- Difficulty rating per lesson
- How each lesson connects to the next (narrative flow)

**Key innovation:** Each lesson gets a TYPE (e.g., AWAKENING, SKILL_BUILD, CASE_STUDY, DEBATE) that determines its entire structure, pacing, and teaching approach.

**Output:** Course architecture (4,000 tokens)

### 3. LESSON GENERATION (Create)
For each module, generates the complete slide-by-slide content:
- Uses the lesson type to select the correct slide structure
- Fills every slide with rich, specific, example-driven content
- Writes narration with the correct voice for that lesson type
- Includes concrete, contextual examples
- Follows the emotional arc

**Output:** Full lesson JSON per module (6,000 tokens per module)

### 4. PRODUCTION (Build)
Deterministic pipeline (no LLM calls):
- **Images:** Contextual slide images via Stability AI
- **TTS:** Narration audio with prosody control
- **Audio:** Mix narration with background music
- **Video:** Compose in Remotion
- **Metadata:** Thumbnail, course summary, timestamps
- **Upload:** Push to Nest API

**Output:** Production-ready video package

---

## The 10 Lesson Types

Each lesson type is a complete teaching architecture, not just a different name:

| Type | Purpose | Feel | Slides | When |
|------|---------|------|--------|------|
| **AWAKENING** | Hook the learner's interest | Curiosity, "I need to learn this" | 6 | First lesson of course |
| **FOUNDATION** | Build core understanding | Clarity, "Now I get it" | 7 | Early in module for new concepts |
| **SKILL_BUILD** | Step-by-step skill acquisition | Guided confidence, "I can do this" | 8 | Core procedural lessons |
| **DEEP_DIVE** | Explore complexity and nuance | Intellectual depth | 7 | After basics are established |
| **CASE_STUDY** | Real-world application story | Storytelling, "I see how this works" | 7 | After skill_build or foundation |
| **CHALLENGE** | Problem-solving with minimal hand-holding | Productive struggle, "I figured it out" | 6 | Late in module when ready |
| **LAB** | Extended hands-on practice | Workshop energy, "Getting better" | 8 | For procedural/analytical courses |
| **MILESTONE** | Module completion, celebrate, bridge forward | Accomplishment, "Look how far I came" | 5 | ALWAYS last lesson of module |
| **WORKED_EXAMPLE** | Complete solved problem (math/science) | Clarity, "I can follow every step" | 7 | Math, science, analytical courses |
| **DEBATE** | Multiple perspectives, critical thinking | Critical thinking, "I can form my own view" | 7 | Philosophy, ethics, strategy |

---

## The 20+ Slide Types

Building blocks that compose lesson types. Each type has a specific purpose and narration length:

- **provocative_question**: Open with tension or curiosity (80-100 words)
- **story_hook**: Vivid specific story, builds empathy (120-150 words)
- **concept**: Explain one idea clearly with analogy (120-150 words)
- **why_it_works**: Explain the reasoning and logic (120-150 words)
- **walkthrough**: Step-by-step guided procedure (200-260 words, MOST IMPORTANT)
- **example_result**: Before/after transformation via character (120-150 words)
- **common_mistakes**: Name problems and how to fix them (120-150 words)
- **practice**: Give learner a task to do right now (120-150 words)
- **summary**: Celebrate, consolidate, bridge forward (120-150 words)
- **revelation**: The "aha moment" that changes thinking (120-150 words)
- **scenario**: Present a realistic situation (120-150 words)
- **analysis**: Break down what happened and why (120-150 words)
- **perspective**: Present one viewpoint in a debate (120-150 words)
- **reflection**: Ask learner to connect to their life (100-120 words)
- **worked_problem**: Step through solved problem (200-260 words)
- **quiz**: Multiple choice checkpoint (60-90 words)
- **lab_exercise**: Hands-on practice task (120-150 words)
- **comparison**: Compare two approaches side-by-side (120-150 words)
- **timeline**: Historical or process sequence (120-150 words)

---

## Visual Themes

Each theme applies to color, typography, and visual language:

| Theme | Best For | Colors | Feel |
|-------|----------|--------|------|
| **neural** | Technology, AI, digital | Dark navy + neon green | Modern, glowing |
| **blueprint** | Science, engineering, technical | Blueprint blue + cyan | Precise, grid-based |
| **chalkboard** | Mathematics, equations | Dark green + chalk white | Classroom, classic |
| **kinetic** | Business, marketing, leadership | Hot pink + bright yellow | Dynamic, bold |
| **organic** | Health, wellness, psychology | Soft green + mint | Natural, rounded |
| **cinematic** | History, culture, documentary | Dark gray + warm tan | Film, storytelling |
| **studio** | Creative arts, design, music | Gallery white + accent colors | Minimal, elegant |
| **workshop** | Hands-on skills, cooking, craft | Warm wood tones | Tactile, warm |

---

## Example Voices (Narration Tone)

The narrator adapts to the lesson type:

- **AWAKENING**: Enthusiastic, drawing the learner in
- **FOUNDATION**: Clear, patient, building understanding
- **SKILL_BUILD**: Encouraging, "we're doing this together"
- **DEEP_DIVE**: Thoughtful, analytical, "let's look closer"
- **CASE_STUDY**: Narrative, storytelling, bringing characters to life
- **CHALLENGE**: Direct, motivating, "you're ready for this"
- **LAB**: Energetic, workshop-style, "let's keep practicing"
- **MILESTONE**: Celebratory, reflective, proud of the learner
- **WORKED_EXAMPLE**: Precise, methodical, "follow along with me"
- **DEBATE**: Balanced, thought-provoking, "what do you think?"

---

## Installation

```bash
# Clone or navigate to the nest-gen directory
cd tools/nest-gen

# Create virtual environment (Python 3.10+)
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your NVIDIA_API_KEY, STABILITY_API_KEY, etc.
```

**System requirements:**
- Python 3.10+
- ffmpeg (for audio/video processing): `brew install ffmpeg` or `apt install ffmpeg`
- Node.js + npm (optional, for Remotion video rendering)

---

## Usage

### Quick Start: Generate a Course

```bash
python nest_gen_v2.py "AI For Everyday Life"
```

This runs Stages 1–3 and saves:
- `course_complete.json` — Full course structure with all slides

### With Options

```bash
# 5 modules × 4 lessons each
python nest_gen_v2.py "Quantum Physics" --modules 5 --lessons 4

# Dry run: stop after Stage 2 (see architecture before generating content)
python nest_gen_v2.py "Negotiation Skills" --dry-run

# Save intermediate stages as separate files
python nest_gen_v2.py "Photography Basics" --save-stages
```

**Output files:**
- `01_course_intelligence.json` — Stage 1 blueprint (if `--save-stages`)
- `02_course_architecture.json` — Stage 2 structure (if `--save-stages`)
- `course_complete.json` — Full course ready for production

### Production: Generate Videos

```bash
python production.py course_complete.json --theme neural --upload
```

This runs Stage 4:
- Generates images for each slide (Stability AI)
- Generates narration audio (edge-tts)
- Creates Remotion composition
- Generates thumbnail
- Uploads to Nest API (if `--upload`)

---

## Course JSON Schema

### Stage 1: Course Intelligence

```json
{
  "course_title": "...",
  "learner_profile": "2-3 sentences describing the learner",
  "transformation": {
    "before": "What learner cannot do",
    "after": "What learner can do"
  },
  "skill_mix": {
    "conceptual": 8,
    "procedural": 7,
    "analytical": 5,
    "creative": 2,
    "physical": 0,
    "interpersonal": 6,
    "metacognitive": 4
  },
  "primary_skill_types": ["conceptual", "procedural"],
  "difficulty": {
    "overall": 6,
    "progression": "steady_climb",
    "description": "..."
  },
  "visual_theme": "neural",
  "emotional_arc": [
    {"module": 1, "feeling": "Excited and curious"},
    {"module": 2, "feeling": "Building confidence"}
  ],
  "example_style": "workplace",
  "prerequisites": ["Basic computer literacy"],
  "course_description": "..."
}
```

### Stage 3: Full Course

```json
{
  "title": "...",
  "description": "...",
  "modules": [
    {
      "title": "...",
      "order_index": 0,
      "lessons": [
        {
          "title": "...",
          "lesson_type": "skill_build",
          "slides": [
            {
              "type": "story_hook",
              "heading": "...",
              "story": "...",
              "narration": "..."
            },
            {
              "type": "walkthrough",
              "heading": "...",
              "steps": ["Step 1", "Step 2", ...],
              "example_prompt": "...",
              "ai_response": "...",
              "narration": "..."
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Key Differences: v1 → v2

| Aspect | v1 | v2 |
|--------|----|----|
| **Planning** | None — jumps to slides | Two planning stages first |
| **Content Variety** | One template for all lessons | 10 lesson types with unique structures |
| **Slide Types** | 8 fixed | 20+ composable types |
| **Slide Order** | Always the same | Varies by lesson type |
| **Examples** | Generic or generic | Concrete, topic-specific, varied |
| **Narration** | Same tone throughout | Adapts to lesson type and position |
| **Difficulty** | Flat | Designed progression curve |
| **Emotional Arc** | None | Planned across full course |
| **Intelligence** | Generates content immediately | Analyzes first, then designs |

---

## Narration Word Counts

These are HARD MINIMUMS to ensure videos are long enough:

| Slide Type | Words | Time (at 130 wpm) |
|-----------|-------|------------------|
| Standard concept | 120–150 | 55–70 sec |
| Walkthrough (detailed) | 200–260 | 95–120 sec |
| Short/provocative | 80–100 | 37–46 sec |

**Example:** A 7-slide lesson = 7 × 130 words ≈ 910 words ÷ 130 wpm = **7 minutes**

---

## Pro Tips

### 1. Course Titles Matter
More specific titles → more specialized courses. Compare:
- "AI" → Generic, for everyone
- "Using ChatGPT to Write Your Resume" → Specific, targeted teaching

### 2. Module Count Affects Depth
- 3 modules × 4 lessons: Quick introduction (2-3 hours)
- 4 modules × 3 lessons: Balanced foundation (3-4 hours)
- 5 modules × 4 lessons: Deep comprehensive (5-6 hours)

### 3. Use `--dry-run` First
Always check the architecture before generating all content:
```bash
python nest_gen_v2.py "Your Title" --dry-run --save-stages
```

Then review `02_course_architecture.json` to see:
- Are the lesson types varied?
- Does the progression make sense?
- Is the difficulty curve right?

### 4. Theme Selection
The system auto-selects theme keywords, but you can override:
- "Quantum Mechanics" → blueprint (auto)
- "Personal Finance" → kinetic (auto)
- "Photography" → studio (auto)

### 5. Examples Are Critical
The LLM will generate examples. For best results:
- Use titles that clearly signal the domain
- Include context in your project description
- Review `course_complete.json` and edit examples if needed

---

## Troubleshooting

### "NVIDIA_API_KEY not found"
```bash
# Check your .env file
cat .env
# Should contain: NVIDIA_API_KEY=...
```

### "Invalid JSON response from LLM"
The LLM sometimes returns markdown-wrapped JSON. The system tries to auto-unwrap, but if it fails:
- Check NVIDIA API status
- Verify your prompt length (shouldn't exceed model limits)
- Try again — LLM generation can be non-deterministic

### "edge-tts not working"
```bash
# Reinstall edge-tts
pip install --upgrade edge-tts

# Test TTS directly
python -c "
import edge_tts
import asyncio
async def test():
    await edge_tts.Communicate('Hello world', 'en-US-AriaNeural').save('test.mp3')
asyncio.run(test())
"
```

### "Stability API rate limited"
Image generation fails if you exceed Stability API rate limits. Either:
- Add `time.sleep(2)` between image requests
- Use pre-generated placeholder images
- Skip image generation for now (slides can work without images)

---

## Advanced: Customizing the Pipeline

### 1. Override a Specific Stage

Edit the prompts in the source:

```python
# In nest_gen_v2.py
STAGE1_PROMPT = """... your custom prompt ..."""

from nest_gen_v2 import build_course
course = build_course("My Title")
```

### 2. Use Your Own Examples

After generation, edit `course_complete.json` directly:

```json
{
  "type": "example_result",
  "heading": "Sarah's Result",
  "bullets": [
    "Before: ...",
    "After: ...",
    "Time saved: 3 hours per week",
    "What changed: ..."
  ]
}
```

### 3. Add Custom Images

Skip generation and reference your own:

```json
{
  "type": "story_hook",
  "image_path": "/path/to/my_image.jpg",
  "narration": "..."
}
```

---

## Architecture

```
nest-gen v2/
├── nest_gen_v2.py          # Main orchestration (4-stage pipeline)
├── v2_schemas.py           # Data structures + lesson types + themes
├── production.py           # Stage 4: TTS, images, video, upload
├── output/                 # Generated files
│   ├── 01_course_intelligence.json
│   ├── 02_course_architecture.json
│   └── course_complete.json
└── requirements.txt
```

**Key modules:**
- `v2_schemas.py`: Defines CourseIntelligence, CourseArchitecture, Course, Lesson, Slide, plus 10 lesson types and 20+ slide types
- `nest_gen_v2.py`: Orchestrates the 4-stage LLM pipeline
- `production.py`: Handles TTS, image generation, video composition, uploads

---

## Future Enhancements

- [ ] Video synthesis with AI presenters (e.g., Synthesia)
- [ ] Automatic quiz generation (Stage 3.5)
- [ ] Course localization/translation
- [ ] Interactive elements (branching, choose-your-own-path)
- [ ] Subtitles in 10+ languages
- [ ] Integration with LMS platforms (Canvas, Moodle, Blackboard)
- [ ] Analytics dashboard integration
- [ ] Student feedback loop → course updates

---

## Questions?

See [rebuild.md](rebuild.md) for the complete specification including:
- All slide type definitions
- Voice guide details
- Mathematical course specialization
- Quality validation rules

---

**Made with ❤️ by the Nest team**
