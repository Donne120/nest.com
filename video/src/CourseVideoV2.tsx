import React, { useState, useEffect, useRef } from 'react';
import { AbsoluteFill, Sequence, staticFile, delayRender, continueRender } from 'remotion';
import { LessonVideo } from './LessonVideo';
import type { LessonVideoProps, SlideData } from './LessonVideo';

export interface CourseVideoV2Props {
  courseDataPath: string;
  moduleIndex?: number;
  lessonIndex?: number;
}

interface V2Slide {
  type: string;
  heading: string;
  narration?: string;
  audio_path?: string;
  image_path?: string;
  [key: string]: unknown;
}

interface V2Lesson {
  title: string;
  lesson_type: string;
  slides: V2Slide[];
}

interface V2Module {
  title: string;
  lessons: V2Lesson[];
}

interface V2Course {
  title: string;
  visual_theme: string;
  modules: V2Module[];
}

const FPS = 30;
const WPM = 130;
const MIN_FRAMES = 180; // 6 seconds minimum per slide

function wordsToFrames(narration: string): number {
  const words = narration ? narration.split(/\s+/).length : 0;
  const seconds = Math.max(6, (words / WPM) * 60);
  return Math.round(seconds * FPS);
}

function v2SlideToLessonSlide(v2: V2Slide, startFrame: number): SlideData {
  const durationFrames = wordsToFrames(v2.narration ?? '');
  // v2 LLM output may use 'title' instead of 'heading' — normalize
  const heading = (v2.heading as string | undefined) ?? (v2.title as string | undefined) ?? '';
  return {
    ...v2,
    type: v2.type as SlideData['type'],
    heading,
    narration: v2.narration,
    audio_path: v2.audio_path,
    image_path: v2.image_path,
    start_frame: startFrame,
    duration_frames: durationFrames,
  } as SlideData;
}

const INTRO_FRAMES = 90; // must match LessonVideo's intro Sequence duration

function buildLessonProps(
  course: V2Course,
  module: V2Module,
  lesson: V2Lesson,
  lessonNumber: number,
): LessonVideoProps {
  let frame = INTRO_FRAMES; // slides start after the intro
  const slides: SlideData[] = lesson.slides.map((v2) => {
    const slide = v2SlideToLessonSlide(v2, frame);
    frame += Math.max(MIN_FRAMES, wordsToFrames(v2.narration ?? ''));
    return slide;
  });

  return {
    course_title: course.title,
    module_title: module.title,
    lesson_title: lesson.title,
    lesson_number: lessonNumber,
    total_frames: frame,
    theme: course.visual_theme,
    slides,
  };
}

export const CourseVideoV2: React.FC<CourseVideoV2Props> = ({
  courseDataPath,
  moduleIndex = 0,
  lessonIndex = 0,
}) => {
  const [courseData, setCourseData] = useState<V2Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handle = useRef<number | null>(null);

  useEffect(() => {
    handle.current = delayRender('Loading course JSON');
    fetch(staticFile(courseDataPath))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setCourseData(data);
        continueRender(handle.current!);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        continueRender(handle.current!);
      });
  }, [courseDataPath]);

  if (error) {
    return (
      <AbsoluteFill style={{ background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#ff6b6b', fontSize: 24, textAlign: 'center', padding: 40 }}>
          <div>Error loading course</div>
          <div style={{ fontSize: 16, marginTop: 16, color: '#aaa' }}>{error}</div>
          <div style={{ fontSize: 14, marginTop: 8, color: '#777' }}>{courseDataPath}</div>
        </div>
      </AbsoluteFill>
    );
  }

  if (!courseData) {
    return (
      <AbsoluteFill style={{ background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: 28 }}>Loading…</div>
      </AbsoluteFill>
    );
  }

  const module = courseData.modules[moduleIndex];
  if (!module) {
    return (
      <AbsoluteFill style={{ background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#f87171', fontSize: 24 }}>Module {moduleIndex} not found</div>
      </AbsoluteFill>
    );
  }

  const lesson = module.lessons[lessonIndex];
  if (!lesson) {
    return (
      <AbsoluteFill style={{ background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#f87171', fontSize: 24 }}>Lesson {lessonIndex} not found</div>
      </AbsoluteFill>
    );
  }

  const lessonNumber = moduleIndex * (courseData.modules[0]?.lessons.length ?? 1) + lessonIndex + 1;
  const props = buildLessonProps(courseData, module, lesson, lessonNumber);

  return (
    <Sequence from={0} durationInFrames={props.total_frames} name={lesson.title}>
      <LessonVideo {...props} />
    </Sequence>
  );
};
