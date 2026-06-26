# nest-gen v2 — Quick Start Guide

Get up and running in 5 minutes.

---

## 1. Install Dependencies

```bash
cd tools/nest-gen
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 2. Set Up API Keys

Create `.env` file:

```bash
cat > .env << 'EOF'
# Required for LLM (Stages 1-3)
NVIDIA_API_KEY=your_nvidia_key_here

# Optional for production (Stage 4)
STABILITY_API_KEY=your_stability_key_here
NEST_API_URL=http://localhost:8000
NEST_TOKEN=your_nest_token_here

# Optional tuning
LLM_CALL_INTERVAL=1.5
EOF
```

Get API keys:
- **NVIDIA API Key:** https://console.api.nvidia.com/
- **Stability AI Key:** https://platform.stability.ai/

---

## 3. Test the Pipeline

### Option A: Dry Run (No LLM Calls for Content)

```bash
python nest_gen_v2.py "AI For Everyday Life" --dry-run --save-stages
```

**Output:**
- `output/01_course_intelligence.json` — Blueprint analysis
- `output/02_course_architecture.json` — Course structure

Review these files to see how the system thinks about your course BEFORE generating content.

### Option B: Full Generation

```bash
python nest_gen_v2.py "Basic Photography Skills"
```

**Output:**
- `output/course_complete.json` — Full course with all slides (4-6 MB JSON)

This runs all 4 stages:
1. Analyzes title → blueprint
2. Designs structure → modules/lessons
3. Generates all slides → full content
4. (Stage 4 skipped unless you run production.py separately)

---

## 4. Inspect the Output

```bash
# See the structure
python -m json.tool output/course_complete.json | head -100

# Count modules/lessons/slides
python << 'EOF'
import json
with open('output/course_complete.json') as f:
    data = json.load(f)
    modules = len(data['modules'])
    lessons = sum(len(m['lessons']) for m in data['modules'])
    slides = sum(len(s) for m in data['modules'] for s in [l['slides'] for l in m['lessons']])
    print(f"Modules: {modules}")
    print(f"Lessons: {lessons}")
    print(f"Slides: {slides}")
EOF
```

---

## 5. Test a Quick Course

Try these titles to see different approaches:

```bash
# Technology-focused → "neural" theme
python nest_gen_v2.py "Introduction to ChatGPT" --modules 3 --lessons 2 --dry-run

# Math/science → "chalkboard" theme
python nest_gen_v2.py "Basic Algebra" --modules 3 --lessons 2 --dry-run

# Business → "kinetic" theme
python nest_gen_v2.py "Negotiation Skills for Sales" --modules 3 --lessons 2 --dry-run

# Health → "organic" theme
python nest_gen_v2.py "Sleep Optimization for Busy Professionals" --modules 3 --lessons 2 --dry-run
```

---

## 6. Run Stage 4: Production (Optional)

Requires: ffmpeg, Stability AI key

```bash
# Generate images, audio, and video composition
python production.py output/course_complete.json --theme neural

# Output:
# - Slide images (Stability AI)
# - Audio files (TTS)
# - remotion_composition.json (for video rendering)
# - production_manifest.json (metadata)
```

---

## 7. Validate Course Quality

```bash
python << 'EOF'
import json
from utils import quality_check_course, calculate_course_stats

with open('output/course_complete.json') as f:
    course = json.load(f)

# Quality checks
checks = quality_check_course(course)
print("\n=== QUALITY CHECK ===")
print(f"Issues: {checks['summary']['issues']}")
print(f"Warnings: {checks['summary']['warnings']}")
print(f"Status: {checks['overall_quality']}")

if checks['issues']:
    print("\nIssues:")
    for issue in checks['issues']:
        print(f"  - {issue}")

if checks['warnings']:
    print("\nWarnings (first 5):")
    for warning in checks['warnings'][:5]:
        print(f"  - {warning}")

# Statistics
stats = calculate_course_stats(course)
print("\n=== COURSE STATS ===")
print(f"Modules: {stats['total_modules']}")
print(f"Lessons: {stats['total_lessons']}")
print(f"Slides: {stats['total_slides']}")
print(f"Total words: {stats['total_words']}")
print(f"Duration: {stats['estimated_duration_hours']} hours")
print(f"Lesson types: {stats['lesson_type_distribution']}")
EOF
```

---

## Common Commands

```bash
# Generate a course with specific structure
python nest_gen_v2.py "Your Title" --modules 4 --lessons 3

# Save intermediate files for review
python nest_gen_v2.py "Your Title" --save-stages

# Quick test (no content generation)
python nest_gen_v2.py "Your Title" --dry-run

# Custom theme
python production.py output/course_complete.json --theme blueprint

# Upload to Nest (requires NEST_TOKEN)
python production.py output/course_complete.json --upload
```

---

## What Each Stage Does

### Stage 1: Course Intelligence (2 min)
```
Input:  "AI For Everyday Life"
Output: Blueprint analysis
  - Learner profile
  - Skill mix (conceptual, procedural, etc.)
  - Visual theme
  - Emotional arc
  - Prerequisites
```

### Stage 2: Course Architecture (3 min)
```
Input:  Blueprint + course title
Output: Module and lesson structure
  - 4 modules with titles
  - 3+ lessons per module
  - Lesson TYPE for each (awakening, skill_build, case_study, etc.)
  - Connections between lessons
```

### Stage 3: Lesson Generation (5–10 min)
```
Input:  Architecture + blueprint
Output: Full course JSON
  - All slides for all lessons
  - Narration for every slide
  - Examples embedded
  - Proper word counts
```

### Stage 4: Production
```
Input:  course_complete.json
Output: Production assets
  - Images (Stability AI)
  - Audio (TTS)
  - Remotion composition
  - Metadata & manifests
```

---

## Troubleshooting

### "NVIDIA_API_KEY not found"
```bash
echo $NVIDIA_API_KEY
# Should not be empty. Check your .env file
cat .env
```

### "Invalid JSON from LLM"
This happens occasionally. The system tries to auto-unwrap markdown, but if it fails:
- Check that LLM returned valid JSON
- Try again (non-deterministic)
- Increase `LLM_CALL_INTERVAL` in .env

### "edge-tts fails"
```bash
pip install --upgrade edge-tts
python -c "import edge_tts; print('OK')"
```

### "No Stability API key"
Set `STABILITY_API_KEY` in .env to enable image generation. Without it:
- Images are skipped (Stage 4)
- Slides can still render without images

---

## Example Output (First Few Modules)

```json
{
  "title": "AI For Everyday Life",
  "description": "Master ChatGPT and AI tools...",
  "modules": [
    {
      "title": "Module 1: Why AI Matters To You",
      "order_index": 0,
      "lessons": [
        {
          "title": "Why You Need to Learn This Today",
          "lesson_type": "awakening",
          "slides": [
            {
              "type": "provocative_question",
              "heading": "What if you could save 5 hours per week?",
              "narration": "Imagine this: you have a stack of emails..."
            },
            {
              "type": "story_hook",
              "heading": "Meet Sarah",
              "story": "Sarah runs a small business. Every morning..."
            }
          ]
        },
        {
          "title": "How AI Works (The Simple Version)",
          "lesson_type": "foundation",
          "slides": [...]
        }
      ]
    }
  ]
}
```

---

## Next: Extend the System

Once you're comfortable with the basics:

1. **Custom lesson types:** Add new types in `v2_schemas.py`
2. **Override prompts:** Edit `STAGE1_PROMPT`, `STAGE2_PROMPT`, etc.
3. **Custom themes:** Add new themes in `v2_schemas.py`
4. **Quality rules:** Modify validation logic in `utils.py`
5. **Batch generation:** Wrap the CLI in a loop to generate multiple courses

---

## Questions?

See detailed docs:
- [README_V2.md](README_V2.md) — Complete user guide
- [V2_REBUILD_SUMMARY.md](V2_REBUILD_SUMMARY.md) — Architecture overview
- [rebuild.md](rebuild.md) — Full specification

---

**You're ready. Go generate amazing courses! 🚀**
