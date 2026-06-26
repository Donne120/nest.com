"""
nest-gen v2 — Utility Functions

Helper functions for:
- JSON parsing and validation
- Text analysis (word count, readability)
- Theme detection
- Lesson type validation
- File I/O
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List
import re

from v2_schemas import (
    VisualTheme, ExampleStyle, LessonType, SkillType,
    LESSON_TYPE_TEMPLATES, THEME_DEFINITIONS
)


# ═══════════════════════════════════════════════════════════════════════════
# TEXT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def word_count(text: str) -> int:
    """Count words in a string."""
    return len(text.split())


def char_count(text: str) -> int:
    """Count characters in a string."""
    return len(text)


def validate_narration_length(text: str, min_words: int, max_words: int) -> tuple[bool, Dict[str, Any]]:
    """
    Validate that narration meets word count requirements.
    Returns (is_valid, {'count': int, 'min': int, 'max': int, 'status': str})
    """
    count = word_count(text)
    is_valid = min_words <= count <= max_words
    
    status = "OK"
    if count < min_words:
        status = f"TOO_SHORT ({count} < {min_words})"
    elif count > max_words:
        status = f"TOO_LONG ({count} > {max_words})"
    
    return is_valid, {
        "count": count,
        "min": min_words,
        "max": max_words,
        "status": status
    }


def readability_score(text: str) -> Dict[str, float]:
    """
    Calculate basic readability metrics.
    Returns: avg_word_length, avg_sentence_length, complexity_score
    """
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    
    total_chars = sum(len(w) for w in words)
    avg_word_length = total_chars / len(words) if words else 0
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    
    # Rough complexity: longer words + longer sentences = harder
    complexity = (avg_word_length / 5.0) * (avg_sentence_length / 15.0)
    
    return {
        "avg_word_length": round(avg_word_length, 2),
        "avg_sentence_length": round(avg_sentence_length, 2),
        "complexity_score": round(complexity, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# THEME DETECTION
# ═══════════════════════════════════════════════════════════════════════════

_THEME_KEYWORDS: Dict[VisualTheme, List[str]] = {
    VisualTheme.BLUEPRINT: [
        "quantum", "physics", "engineering", "chemistry", "biology", "astronomy",
        "computing", "algorithm", "circuit", "electronics", "robotics", "aerospace",
        "architecture", "thermodynamics", "optics", "mechanics", "neuroscience",
        "cryptography", "encryption", "network", "cybersecurity", "database",
        "machine learning", "artificial intelligence", "data science", "signal",
        "semiconductor", "nanotechnology", "blockchain", "programming", "software",
    ],
    VisualTheme.CHALKBOARD: [
        "math", "mathematics", "calculus", "algebra", "geometry", "trigonometry",
        "statistics", "probability", "linear algebra", "differential", "integral",
        "number theory", "combinatorics", "derivative", "equation", "formula",
        "theorem", "proof", "vector", "matrix", "set theory", "arithmetic",
        "fraction", "polynomial", "logarithm", "series", "sequence",
    ],
    VisualTheme.KINETIC: [
        "business", "marketing", "sales", "finance", "investing", "entrepreneurship",
        "startup", "management", "leadership", "negotiation", "branding", "growth",
        "accounting", "economics", "strategy", "productivity", "communication",
        "persuasion", "influence", "decision", "career", "job", "interview",
        "money", "wealth", "stock", "trading", "venture", "corporate", "art of",
    ],
    VisualTheme.ORGANIC: [
        "health", "wellness", "nutrition", "meditation", "yoga", "fitness",
        "psychology", "mental health", "mindfulness", "therapy", "biology",
        "diet", "sleep", "stress", "anxiety", "habit", "happiness", "emotion",
        "breathing", "nature", "plant", "body", "brain", "memory", "focus",
        "self", "relationship", "parenting", "grief", "trauma", "healing",
    ],
    VisualTheme.CINEMATIC: [
        "history", "culture", "language", "literature", "arts", "music",
        "geography", "philosophy", "sociology", "anthropology", "film",
        "writing", "storytelling", "journalism", "war", "empire", "revolution",
        "ancient", "medieval", "roman", "greek", "republic", "civilization",
        "fall of", "rise of", "world war", "cold war", "colonial", "dynasty",
        "renaissance", "enlightenment", "mythology", "religion", "society",
    ],
}


def detect_theme(title: str) -> VisualTheme:
    """Detect the best visual theme based on course title keywords."""
    title_lower = title.lower()
    
    for theme, keywords in _THEME_KEYWORDS.items():
        for kw in keywords:
            if kw in title_lower:
                return theme
    
    return VisualTheme.NEURAL  # Default fallback


# ═══════════════════════════════════════════════════════════════════════════
# LESSON TYPE VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def validate_lesson_type_usage(lessons: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validate that lesson types follow rules:
    1. First lesson is AWAKENING
    2. Last lesson of each module is MILESTONE
    3. No two adjacent lessons have same type
    4. Sufficient variety within each module
    """
    issues = []
    
    if not lessons:
        return {"valid": True, "issues": []}
    
    # Check first lesson
    if lessons[0].get("lesson_type") != "awakening":
        issues.append("First lesson must be type 'awakening'")
    
    # Check adjacent duplicates
    for i in range(len(lessons) - 1):
        if lessons[i]["lesson_type"] == lessons[i+1]["lesson_type"]:
            issues.append(f"Lessons {i} and {i+1} have same type: {lessons[i]['lesson_type']}")
    
    # Count types
    type_counts = {}
    for lesson in lessons:
        lt = lesson.get("lesson_type")
        type_counts[lt] = type_counts.get(lt, 0) + 1
    
    unique_types = len(type_counts)
    if unique_types < 3:
        issues.append(f"Module has only {unique_types} different lesson types (minimum 3 recommended)")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "type_distribution": type_counts,
        "unique_types": unique_types
    }


# ═══════════════════════════════════════════════════════════════════════════
# FILE I/O
# ═══════════════════════════════════════════════════════════════════════════

def save_json(data: Dict[str, Any], path: str, pretty: bool = True) -> Path:
    """Save data to JSON file."""
    path_obj = Path(path)
    path_obj.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path_obj, 'w') as f:
        if pretty:
            json.dump(data, f, indent=2, default=str)
        else:
            json.dump(data, f, default=str)
    
    return path_obj


def load_json(path: str) -> Dict[str, Any]:
    """Load data from JSON file."""
    with open(path, 'r') as f:
        return json.load(f)


# ═══════════════════════════════════════════════════════════════════════════
# COURSE STATISTICS
# ═══════════════════════════════════════════════════════════════════════════

def calculate_course_stats(course_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate statistics for a course."""
    modules = course_data.get("modules", [])
    
    total_lessons = 0
    total_slides = 0
    total_words = 0
    estimated_minutes = 0
    
    lesson_type_counts = {}
    
    for module in modules:
        for lesson in module.get("lessons", []):
            total_lessons += 1
            lesson_type = lesson.get("lesson_type", "unknown")
            lesson_type_counts[lesson_type] = lesson_type_counts.get(lesson_type, 0) + 1
            
            for slide in lesson.get("slides", []):
                total_slides += 1
                narration = slide.get("narration", "")
                words = word_count(narration)
                total_words += words
                # Estimate 130 words per minute
                estimated_minutes += words / 130.0
    
    return {
        "total_modules": len(modules),
        "total_lessons": total_lessons,
        "total_slides": total_slides,
        "total_words": total_words,
        "estimated_duration_minutes": round(estimated_minutes, 1),
        "estimated_duration_hours": round(estimated_minutes / 60, 1),
        "avg_words_per_lesson": round(total_words / total_lessons, 0) if total_lessons > 0 else 0,
        "avg_slides_per_lesson": round(total_slides / total_lessons, 1) if total_lessons > 0 else 0,
        "lesson_type_distribution": lesson_type_counts,
    }


# ═══════════════════════════════════════════════════════════════════════════
# COURSE QUALITY CHECKS
# ═══════════════════════════════════════════════════════════════════════════

def quality_check_course(course_data: Dict[str, Any]) -> Dict[str, Any]:
    """Run comprehensive quality checks on a course."""
    issues = []
    warnings = []
    passes = []
    
    # Check 1: All modules present
    if not course_data.get("modules"):
        issues.append("No modules in course")
    
    # Check 2: Each module has lessons
    for module_idx, module in enumerate(course_data.get("modules", [])):
        if not module.get("lessons"):
            issues.append(f"Module {module_idx} has no lessons")
    
    # Check 3: Narration lengths
    for module_idx, module in enumerate(course_data.get("modules", [])):
        for lesson_idx, lesson in enumerate(module.get("lessons", [])):
            lesson_type = lesson.get("lesson_type")
            
            for slide_idx, slide in enumerate(lesson.get("slides", [])):
                narration = slide.get("narration", "")
                slide_type = slide.get("type")
                
                # Determine expected word count range
                if slide_type == "walkthrough":
                    min_w, max_w = 200, 260
                elif slide_type in ["provocative_question", "revelation"]:
                    min_w, max_w = 80, 100
                else:
                    min_w, max_w = 120, 150
                
                is_valid, analysis = validate_narration_length(narration, min_w, max_w)
                
                if not is_valid:
                    warnings.append(
                        f"Module {module_idx+1}, Lesson {lesson_idx+1}, Slide {slide_idx+1} "
                        f"({slide_type}): {analysis['status']}"
                    )
                else:
                    passes.append(f"Slide {slide_idx+1} narration length OK")
    
    # Check 4: All lessons have key concept
    for module_idx, module in enumerate(course_data.get("modules", [])):
        for lesson_idx, lesson in enumerate(module.get("lessons", [])):
            if not lesson.get("key_concept"):
                warnings.append(f"Module {module_idx+1}, Lesson {lesson_idx+1} missing key_concept")
    
    # Check 5: Examples present
    for module_idx, module in enumerate(course_data.get("modules", [])):
        for lesson_idx, lesson in enumerate(module.get("lessons", [])):
            for slide_idx, slide in enumerate(lesson.get("slides", [])):
                if slide.get("type") in ["example_result", "story_hook", "case_study"]:
                    content = (slide.get("story") or slide.get("bullets") or "")
                    if not content or len(str(content)) < 20:
                        warnings.append(
                            f"Module {module_idx+1}, Lesson {lesson_idx+1}, Slide {slide_idx+1} "
                            f"needs more specific example content"
                        )
    
    return {
        "summary": {
            "issues": len(issues),
            "warnings": len(warnings),
            "passes": len(passes),
        },
        "issues": issues,
        "warnings": warnings,
        "passes": passes[:5],  # Show first 5 passes
        "overall_quality": "pass" if not issues else "fail" if issues else "warn"
    }


if __name__ == "__main__":
    # Example usage
    print("Testing utils...")
    
    text = "This is a test narration. It should be long enough to meet requirements. " * 3
    count = word_count(text)
    valid, analysis = validate_narration_length(text, 120, 150)
    
    print(f"Word count: {count}")
    print(f"Valid: {valid}")
    print(f"Analysis: {analysis}")
    
    print(f"\nTheme detection: {detect_theme('Quantum Mechanics and Physics')}")
