// ── Shared types across all themes ────────────────────────────────────────

export interface GraphPoint { x: number; y: number; }
export interface KeyPoint   { x: number; y: number; label: string; }
export interface GraphData {
  x_range:        [number, number];
  y_range:        [number, number];
  points:         GraphPoint[];
  key_points?:    KeyPoint[];
  function_label?: string;
  x_label?:       string;
  y_label?:       string;
  shade_under?:   boolean;
}
export interface QuizOption { text: string; correct: boolean; }

export interface MathStep {
  expression: string;
  annotation?: string;
  highlight?: boolean;
}

export interface Caption {
  text: string;
  start_ms: number;
  duration_ms: number;
}

export interface SlideData {
  type: 'title' | 'hook' | 'content' | 'walkthrough' | 'example' | 'practice' | 'summary' | 'worked_example' | 'quiz';
  heading: string;
  subheading?: string;
  bullets?: string[];
  steps?: string[];
  math_steps?: MathStep[];
  captions?: Caption[];
  story?: string;
  task?: string;
  example_prompt?: string;
  ai_response?: string;
  nest_question?: string;
  timer_seconds?: number;
  code?: string;
  visual_hint?: 'timeline' | 'cycle' | 'stats' | 'graph' | 'default';
  graph_data?: GraphData;
  quiz_options?: QuizOption[];
  // ── Documentary / cinematic scene data ────────────────────────────
  scene_type?:     'portrait' | 'map' | 'building' | 'event' | 'crowd';
  scene_caption?:  string;   // "Isaac Newton · 1643–1727"
  scene_era?:      string;   // "1687" | "17th Century"
  scene_location?: string;   // "Cambridge, England"
  audio_key: string;
  image_key?: string;
  start_frame: number;
  duration_frames: number;
}

export interface LessonVideoProps {
  course_title: string;
  module_title: string;
  lesson_title: string;
  lesson_number: number;
  total_frames: number;
  theme?: string;
  slides: SlideData[];
}

// ── Theme contract — every theme must export this shape ────────────────────

export interface ThemeComponents {
  SlideBackground: React.FC;
  TitleSlide: React.FC<{ slide: SlideData }>;
  HookSlide: React.FC<{ slide: SlideData }>;
  ContentSlide: React.FC<{ slide: SlideData }>;
  WalkthroughSlide: React.FC<{ slide: SlideData }>;
  ExampleSlide: React.FC<{ slide: SlideData }>;
  PracticeSlide: React.FC<{ slide: SlideData }>;
  SummarySlide: React.FC<{ slide: SlideData }>;
  WorkedExampleSlide: React.FC<{ slide: SlideData }>;
  CaptionBar: React.FC<{ captions: Caption[]; frame: number; fps: number }>;
  LessonIntro: React.FC<{ moduleTitle: string; lessonTitle: string; lessonNumber: number }>;
}
