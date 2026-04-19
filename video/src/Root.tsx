import React from 'react';
import { Composition, Still } from 'remotion';
import { TutorialThumbnail } from './tutorial/TutorialThumbnail';
import { NestPromo } from './NestPromo';
import { NestCourseIntro } from './NestCourseIntro';
import { LessonVideo } from './LessonVideo';
import type { LessonVideoProps } from './LessonVideo';
import { Onboarding01 } from './onboarding/Onboarding01';
import { Onboarding02 } from './onboarding/Onboarding02';
import { Onboarding03 } from './onboarding/Onboarding03';
import { Onboarding04 } from './onboarding/Onboarding04';
import { Onboarding05 } from './onboarding/Onboarding05';
import { Onboarding06 } from './onboarding/Onboarding06';
import { Onboarding07 } from './onboarding/Onboarding07';
import { Onboarding08 } from './onboarding/Onboarding08';
import { Onboarding09 } from './onboarding/Onboarding09';
import { Onboarding10 } from './onboarding/Onboarding10';
import { Onboarding11 } from './onboarding/Onboarding11';
import { Onboarding12 } from './onboarding/Onboarding12';
import { T01_Welcome }      from './tutorial/videos/T01_Welcome';
import { T02_OrgSetup }     from './tutorial/videos/T02_OrgSetup';
import { T03_ManageTeam }   from './tutorial/videos/T03_ManageTeam';
import { T04_CreateCourse } from './tutorial/videos/T04_CreateCourse';
import { T05_Transcription } from './tutorial/videos/T05_Transcription';
import { T06_Quizzes }      from './tutorial/videos/T06_Quizzes';
import { T07_Assignments }  from './tutorial/videos/T07_Assignments';
import { T08_Progress }     from './tutorial/videos/T08_Progress';
import { T09_Meetings }     from './tutorial/videos/T09_Meetings';
import { T10_Analytics }    from './tutorial/videos/T10_Analytics';
import { T11_Certificates } from './tutorial/videos/T11_Certificates';
import { T12_Payments }     from './tutorial/videos/T12_Payments';

const ONBOARDING_TITLES = [
  'Welcome to Nest',
  'Setting Up Your Organisation',
  'Managing Your Team',
  'Creating Courses & Videos',
  'Transcription & AI Q&A',
  'Quizzes & Assessments',
  'Assignments & Tasks',
  'Progress Tracking',
  '1-on-1 Meetings',
  'Analytics & Reporting',
  'Certificates',
  'Payments & Billing',
];

const ONBOARDING_COMPONENTS = [
  Onboarding01, Onboarding02, Onboarding03, Onboarding04,
  Onboarding05, Onboarding06, Onboarding07, Onboarding08,
  Onboarding09, Onboarding10, Onboarding11, Onboarding12,
];

const TUTORIAL_COMPONENTS = [
  { id: 'T01', title: 'Welcome-to-Nest',              component: T01_Welcome },
  { id: 'T02', title: 'Setting-Up-Your-Organisation', component: T02_OrgSetup },
  { id: 'T03', title: 'Managing-Your-Team',            component: T03_ManageTeam },
  { id: 'T04', title: 'Creating-Courses-and-Videos',  component: T04_CreateCourse },
  { id: 'T05', title: 'Transcription-and-AI-QA',      component: T05_Transcription },
  { id: 'T06', title: 'Quizzes-and-Assessments',      component: T06_Quizzes },
  { id: 'T07', title: 'Assignments-and-Tasks',         component: T07_Assignments },
  { id: 'T08', title: 'Progress-Tracking',             component: T08_Progress },
  { id: 'T09', title: 'One-on-One-Meetings',           component: T09_Meetings },
  { id: 'T10', title: 'Analytics-and-Reporting',       component: T10_Analytics },
  { id: 'T11', title: 'Certificates',                  component: T11_Certificates },
  { id: 'T12', title: 'Payments-and-Billing',          component: T12_Payments },
];

export const Root: React.FC = () => (
  <>
    {/* ── Auto-generated lesson videos (3–5 min, data-driven) ── */}
    <Composition
      id="LessonVideo"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'How to Study Effectively',
        module_title: 'Module 1 · Foundations',
        lesson_title: 'Mastering Effective Study Habits',
        lesson_number: 1,
        total_frames: 2250,
        slides: [
          {
            type: 'title',
            heading: 'Mastering Effective Study Habits',
            subheading: 'Module 1 · Lesson 1',
            captions: [
              { text: 'Welcome',    start_ms: 300,  duration_ms: 260 },
              { text: 'to',         start_ms: 580,  duration_ms: 120 },
              { text: 'this',       start_ms: 720,  duration_ms: 160 },
              { text: 'lesson',     start_ms: 900,  duration_ms: 260 },
              { text: 'on',         start_ms: 1180, duration_ms: 120 },
              { text: 'mastering',  start_ms: 1320, duration_ms: 360 },
              { text: 'effective',  start_ms: 1700, duration_ms: 300 },
              { text: 'study',      start_ms: 2020, duration_ms: 240 },
              { text: 'habits.',    start_ms: 2280, duration_ms: 340 },
              { text: 'By',         start_ms: 2900, duration_ms: 140 },
              { text: 'the',        start_ms: 3060, duration_ms: 120 },
              { text: 'end',        start_ms: 3200, duration_ms: 180 },
              { text: 'you',        start_ms: 3400, duration_ms: 140 },
              { text: 'will',       start_ms: 3560, duration_ms: 160 },
              { text: 'study',      start_ms: 3740, duration_ms: 220 },
              { text: 'smarter,',   start_ms: 3980, duration_ms: 280 },
              { text: 'not',        start_ms: 4280, duration_ms: 160 },
              { text: 'harder.',    start_ms: 4460, duration_ms: 320 },
            ],
            audio_key: '',
            start_frame: 90,
            duration_frames: 240,
          },
          {
            type: 'hook',
            heading: 'Still studying for hours and remembering nothing?',
            story: 'Picture a student who re-reads the same chapter three times, highlights everything, and still fails the test — wasting 4 hours every night.',
            captions: [
              { text: 'Picture',    start_ms: 200,  duration_ms: 260 },
              { text: 'a',          start_ms: 480,  duration_ms: 100 },
              { text: 'student',    start_ms: 600,  duration_ms: 260 },
              { text: 'who',        start_ms: 880,  duration_ms: 160 },
              { text: 're-reads',   start_ms: 1060, duration_ms: 320 },
              { text: 'the',        start_ms: 1400, duration_ms: 120 },
              { text: 'same',       start_ms: 1540, duration_ms: 200 },
              { text: 'chapter',    start_ms: 1760, duration_ms: 280 },
              { text: 'three',      start_ms: 2060, duration_ms: 200 },
              { text: 'times,',     start_ms: 2280, duration_ms: 280 },
              { text: 'highlights', start_ms: 2740, duration_ms: 360 },
              { text: 'everything,',start_ms: 3120, duration_ms: 420 },
              { text: 'and',        start_ms: 3560, duration_ms: 140 },
              { text: 'still',      start_ms: 3720, duration_ms: 200 },
              { text: 'fails',      start_ms: 3940, duration_ms: 220 },
              { text: 'the',        start_ms: 4180, duration_ms: 120 },
              { text: 'test.',      start_ms: 4320, duration_ms: 300 },
            ],
            audio_key: '',
            start_frame: 330,
            duration_frames: 300,
          },
          {
            type: 'content',
            heading: 'What Effective Studying Does For You',
            bullets: [
              'Retains information longer with less effort',
              'Builds real understanding, not just memory',
              'Frees up hours every week for other things',
              'Turns exam stress into quiet confidence',
            ],
            captions: [
              { text: 'Most',       start_ms: 200,  duration_ms: 200 },
              { text: 'students',   start_ms: 420,  duration_ms: 260 },
              { text: 'study',      start_ms: 700,  duration_ms: 200 },
              { text: 'harder',     start_ms: 920,  duration_ms: 220 },
              { text: 'not',        start_ms: 1160, duration_ms: 160 },
              { text: 'smarter.',   start_ms: 1340, duration_ms: 280 },
              { text: 'Today',      start_ms: 1900, duration_ms: 200 },
              { text: 'you',        start_ms: 2120, duration_ms: 140 },
              { text: 'will',       start_ms: 2280, duration_ms: 160 },
              { text: 'learn',      start_ms: 2460, duration_ms: 200 },
              { text: 'the',        start_ms: 2680, duration_ms: 120 },
              { text: 'exact',      start_ms: 2820, duration_ms: 200 },
              { text: 'method',     start_ms: 3040, duration_ms: 240 },
              { text: 'that',       start_ms: 3300, duration_ms: 160 },
              { text: 'saves',      start_ms: 3480, duration_ms: 200 },
              { text: 'hours',      start_ms: 3700, duration_ms: 220 },
              { text: 'every',      start_ms: 3940, duration_ms: 180 },
              { text: 'week.',      start_ms: 4140, duration_ms: 280 },
              { text: 'No',         start_ms: 4700, duration_ms: 160 },
              { text: 'more',       start_ms: 4880, duration_ms: 180 },
              { text: 're-reading', start_ms: 5080, duration_ms: 360 },
              { text: 'the',        start_ms: 5460, duration_ms: 120 },
              { text: 'same',       start_ms: 5600, duration_ms: 180 },
              { text: 'page',       start_ms: 5800, duration_ms: 200 },
              { text: 'twice.',     start_ms: 6020, duration_ms: 280 },
            ],
            audio_key: '',
            start_frame: 630,
            duration_frames: 300,
            visual_hint: 'stats',
          },
          {
            type: 'walkthrough',
            heading: 'Step By Step — Let us Do It Together',
            steps: [
              'Step 1: Pick ONE topic you need to learn today',
              'Step 2: Set a 25-minute focused timer (no phone)',
              'Step 3: Read once, then close the book and write what you remember',
              'Step 4: Check what you missed and review only those parts',
              'Step 5: Repeat tomorrow — spaced repetition locks it in',
            ],
            example_prompt: 'I need to learn the water cycle for my geography exam tomorrow.',
            ai_response: 'Great! Here is a quick summary: Water evaporates from oceans, rises as vapour, condenses into clouds, falls as precipitation, and flows back to the ocean. Test yourself: can you draw this cycle from memory right now?',
            audio_key: '',
            start_frame: 930,
            duration_frames: 300,
          },
          {
            type: 'example',
            heading: "A Real Example — See It Working",
            bullets: [
              'Before: Spent 3 hours re-reading notes, failed the quiz',
              'After: 45-minute active recall session, scored 92%',
              'Time saved: 2+ hours per study session recovered',
              'Next step: Applied the same method to every subject',
            ],
            audio_key: '',
            start_frame: 1230,
            duration_frames: 300,
          },
          {
            type: 'practice',
            heading: 'Your Turn — Do It Right Now',
            task: 'Open a notebook and write down everything you remember from the last lesson you studied — without looking.',
            example_prompt: 'I studied [your topic]. From memory I can recall: [write it out]. What am I likely missing?',
            timer_seconds: 120,
            audio_key: '',
            start_frame: 1530,
            duration_frames: 240,
          },
          {
            type: 'worked_example',
            heading: 'Solving x² + 5x + 6 = 0 — Step By Step',
            math_steps: [
              { expression: 'x² + 5x + 6 = 0',          annotation: 'Start with the equation' },
              { expression: 'Find two numbers: 2 and 3',  annotation: 'Multiply to 6, add to 5' },
              { expression: '(x + 2)(x + 3) = 0',        annotation: 'Factorise' },
              { expression: 'x + 2 = 0  or  x + 3 = 0',  annotation: 'Set each factor to zero' },
              { expression: 'x = −2  or  x = −3',         annotation: 'Final answers', highlight: true },
            ],
            audio_key: '',
            start_frame: 1770,
            duration_frames: 240,
          },
          {
            type: 'summary',
            heading: 'What You Learned Today',
            bullets: [
              'You can now use active recall instead of passive re-reading',
              'You know the 5-step study method that fits any subject',
              'You have a ready-to-use prompt to check your own gaps',
              'Your next step: use this method tonight before you sleep',
            ],
            audio_key: '',
            start_frame: 2010,
            duration_frames: 240,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Blueprint theme preview ── */}
    <Composition
      id="LessonVideo-Blueprint"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'Quantum Computing: From Qubits to Algorithms',
        module_title: 'Module 1 · Foundations',
        lesson_title: 'Introduction to Quantum Computing',
        lesson_number: 1,
        theme: 'blueprint',
        total_frames: 2400,
        slides: [
          {
            type: 'title',
            heading: 'Introduction to Quantum Computing',
            subheading: 'Module 1 · Lesson 1',
            captions: [
              { text: 'Welcome',   start_ms: 300,  duration_ms: 240 },
              { text: 'to',        start_ms: 560,  duration_ms: 120 },
              { text: 'quantum',   start_ms: 700,  duration_ms: 300 },
              { text: 'computing', start_ms: 1020, duration_ms: 380 },
              { text: '—',         start_ms: 1420, duration_ms: 100 },
              { text: 'where',     start_ms: 1540, duration_ms: 220 },
              { text: 'the',       start_ms: 1780, duration_ms: 120 },
              { text: 'rules',     start_ms: 1920, duration_ms: 220 },
              { text: 'of',        start_ms: 2160, duration_ms: 100 },
              { text: 'physics',   start_ms: 2280, duration_ms: 280 },
              { text: 'change',    start_ms: 2580, duration_ms: 260 },
              { text: 'everything.', start_ms: 2860, duration_ms: 400 },
            ],
            audio_key: '',
            start_frame: 90,
            duration_frames: 300,
          },
          {
            type: 'hook',
            heading: 'Classical computers failing your hardest problems?',
            story: 'A cryptographer runs a simulation that would take 10,000 years on a classical supercomputer — quantum computing solves it in minutes.',
            captions: [
              { text: 'Classical', start_ms: 200,  duration_ms: 280 },
              { text: 'computers', start_ms: 500,  duration_ms: 300 },
              { text: 'hit',       start_ms: 820,  duration_ms: 160 },
              { text: 'a',         start_ms: 1000, duration_ms: 100 },
              { text: 'wall.',     start_ms: 1120, duration_ms: 280 },
              { text: 'Quantum',   start_ms: 1680, duration_ms: 280 },
              { text: 'breaks',    start_ms: 1980, duration_ms: 240 },
              { text: 'through',   start_ms: 2240, duration_ms: 260 },
              { text: 'it.',       start_ms: 2520, duration_ms: 200 },
            ],
            audio_key: '',
            start_frame: 390,
            duration_frames: 360,
          },
          {
            type: 'content',
            heading: 'What Quantum Computing Unlocks',
            bullets: [
              'Solves problems in minutes that take classical machines millennia',
              'Processes exponentially more states simultaneously via superposition',
              'Breaks and builds next-generation cryptography systems',
              'Simulates molecular structures for drug and material discovery',
            ],
            audio_key: '',
            start_frame: 750,
            duration_frames: 360,
            visual_hint: 'default',
          },
          {
            type: 'walkthrough',
            heading: 'Step By Step — Let us Do It Together',
            steps: [
              'Step 1: Understand qubits — they are 0, 1, or both at once (superposition)',
              'Step 2: Learn quantum gates — they rotate qubit states like logical operators',
              'Step 3: Build a simple circuit — connect gates to create a quantum operation',
              'Step 4: Run on a simulator — use IBM Quantum or Google Cirq to test it',
              'Step 5: Measure the output — collapse superposition into a real result',
            ],
            example_prompt: 'Create a Bell state circuit that entangles two qubits',
            ai_response: 'Apply a Hadamard gate to qubit 0, then a CNOT gate with qubit 0 as control and qubit 1 as target. Measure both qubits — you will always get 00 or 11, never 01 or 10. This is quantum entanglement.',
            audio_key: '',
            start_frame: 1110,
            duration_frames: 600,
          },
          {
            type: 'summary',
            heading: 'What You Learned Today',
            bullets: [
              'You can now explain qubits, superposition, and entanglement clearly',
              'You understand how quantum gates manipulate qubit states',
              'You know how to build and test a basic quantum circuit on a simulator',
              'Your next step: run a Bell state experiment on IBM Quantum today',
            ],
            audio_key: '',
            start_frame: 1710,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Kinetic theme preview — editorial/business ── */}
    <Composition
      id="LessonVideo-Kinetic"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'Leadership Fundamentals',
        module_title: 'Module 2 · Decision Making',
        lesson_title: 'How Great Leaders Decide',
        lesson_number: 3,
        theme: 'kinetic',
        total_frames: 1800,
        slides: [
          {
            type: 'title',
            heading: 'How Great Leaders Decide',
            subheading: 'Module 2 · Lesson 3',
            captions: [{ text: 'How', start_ms: 200, duration_ms: 200 }, { text: 'great', start_ms: 420, duration_ms: 240 }, { text: 'leaders', start_ms: 680, duration_ms: 300 }, { text: 'decide.', start_ms: 1000, duration_ms: 380 }],
            audio_key: '',
            start_frame: 60,
            duration_frames: 240,
          },
          {
            type: 'hook',
            heading: 'One bad decision. Company gone.',
            story: 'In 2000, Blockbuster passed on buying Netflix for $50 million. One decision. Twenty years later — bankruptcy.',
            captions: [{ text: 'One', start_ms: 200, duration_ms: 200 }, { text: 'bad', start_ms: 420, duration_ms: 200 }, { text: 'decision', start_ms: 640, duration_ms: 320 }, { text: 'can', start_ms: 980, duration_ms: 180 }, { text: 'end', start_ms: 1180, duration_ms: 200 }, { text: 'everything.', start_ms: 1400, duration_ms: 380 }],
            audio_key: '',
            start_frame: 300,
            duration_frames: 300,
          },
          {
            type: 'walkthrough',
            heading: 'The 5-Step Decision Framework',
            steps: [
              'Step 1: Define the real decision — not the surface problem',
              'Step 2: Set success criteria before you evaluate any options',
              'Step 3: Generate at least 3 genuine alternatives',
              'Step 4: Test each against your criteria without anchoring bias',
              'Step 5: Commit fully — or schedule a review date',
            ],
            audio_key: '',
            start_frame: 600,
            duration_frames: 600,
          },
          {
            type: 'summary',
            heading: 'What You Decide Next',
            bullets: [
              'You have a repeatable 5-step framework for hard decisions',
              'You know how to separate the real decision from the noise',
              'Bias-free evaluation means better outcomes every time',
            ],
            audio_key: '',
            start_frame: 1200,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Chalkboard theme preview — math/science ── */}
    <Composition
      id="LessonVideo-Chalkboard"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'Calculus for Engineers',
        module_title: 'Module 3 · Integration',
        lesson_title: 'Integration by Parts',
        lesson_number: 7,
        theme: 'chalkboard',
        total_frames: 1800,
        slides: [
          {
            type: 'title',
            heading: 'Integration by Parts',
            subheading: 'Module 3 · Lesson 7',
            captions: [{ text: 'When', start_ms: 200, duration_ms: 200 }, { text: 'substitution', start_ms: 420, duration_ms: 380 }, { text: 'fails,', start_ms: 820, duration_ms: 240 }, { text: 'parts', start_ms: 1080, duration_ms: 220 }, { text: 'saves', start_ms: 1320, duration_ms: 220 }, { text: 'you.', start_ms: 1560, duration_ms: 300 }],
            audio_key: '',
            start_frame: 60,
            duration_frames: 240,
          },
          {
            type: 'worked_example',
            heading: 'Solve: ∫ x·eˣ dx',
            math_steps: [
              { expression: '∫ x·eˣ dx',              annotation: 'Cannot substitute — try IBP' },
              { expression: 'u = x,  dv = eˣ dx',     annotation: 'Choose u and dv using LIATE' },
              { expression: 'du = dx,  v = eˣ',       annotation: 'Differentiate u, integrate dv' },
              { expression: '= x·eˣ − ∫ eˣ dx',      annotation: 'Apply the IBP formula' },
              { expression: '= x·eˣ − eˣ + C',       annotation: 'Integrate the remainder', highlight: true },
            ],
            audio_key: '',
            start_frame: 300,
            duration_frames: 600,
          },
          {
            type: 'summary',
            heading: 'Integration by Parts — Key Rules',
            bullets: [
              'Use LIATE to choose u: Log, Inverse trig, Algebraic, Trig, Exponential',
              'Formula: ∫ u dv = uv − ∫ v du',
              'Sometimes you need to apply IBP twice',
              'If you get the original integral back, solve algebraically',
            ],
            audio_key: '',
            start_frame: 900,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Organic theme preview — wellness/mindfulness ── */}
    <Composition
      id="LessonVideo-Organic"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'The Science of Mindfulness',
        module_title: 'Module 1 · Foundations',
        lesson_title: 'Why Your Brain Needs Rest',
        lesson_number: 2,
        theme: 'organic',
        total_frames: 1800,
        slides: [
          {
            type: 'title',
            heading: 'Why Your Brain Needs Rest',
            subheading: 'Module 1 · Lesson 2',
            captions: [{ text: 'Rest', start_ms: 200, duration_ms: 240 }, { text: 'is', start_ms: 460, duration_ms: 140 }, { text: 'not', start_ms: 620, duration_ms: 180 }, { text: 'wasted', start_ms: 820, duration_ms: 280 }, { text: 'time.', start_ms: 1120, duration_ms: 320 }],
            audio_key: '',
            start_frame: 60,
            duration_frames: 240,
          },
          {
            type: 'content',
            heading: 'What Happens When You Rest',
            bullets: [
              'The glymphatic system flushes neural toxins during deep rest',
              'Default mode network consolidates memories and insights',
              'Cortisol drops — your nervous system resets its baseline',
              'Creative connections form between previously unlinked ideas',
            ],
            audio_key: '',
            start_frame: 300,
            duration_frames: 360,
          },
          {
            type: 'walkthrough',
            heading: 'A Simple Daily Rest Practice',
            steps: [
              'Step 1: After focused work, set a 10-minute no-screen rest',
              'Step 2: Lie down or sit — let your mind wander freely',
              'Step 3: Notice thoughts without chasing them — just observe',
              'Step 4: Return gently if distracted — no judgment',
              'Step 5: Journal one insight that surfaced before returning to work',
            ],
            audio_key: '',
            start_frame: 660,
            duration_frames: 600,
          },
          {
            type: 'summary',
            heading: 'What You Learned',
            bullets: [
              'Your brain does critical work during rest — not just during focus',
              'A 10-minute daily rest practice reshapes your cognitive capacity',
              'Rest is a skill, not a luxury — and it can be practiced',
            ],
            audio_key: '',
            start_frame: 1260,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Cinematic theme preview — documentary/film ── */}
    <Composition
      id="LessonVideo-Cinematic"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'History of Modern Science',
        module_title: 'Module 4 · Revolution',
        lesson_title: 'The Night Einstein Changed Physics',
        lesson_number: 9,
        theme: 'cinematic',
        total_frames: 1800,
        slides: [
          {
            type: 'title',
            heading: 'The Night Einstein Changed Physics',
            subheading: 'Module 4 · Lesson 9',
            captions: [{ text: 'One', start_ms: 400, duration_ms: 220 }, { text: 'thought', start_ms: 640, duration_ms: 260 }, { text: 'experiment', start_ms: 920, duration_ms: 360 }, { text: 'rewrote', start_ms: 1300, duration_ms: 300 }, { text: 'reality.', start_ms: 1620, duration_ms: 380 }],
            audio_key: '',
            start_frame: 60,
            duration_frames: 300,
          },
          {
            type: 'hook',
            heading: 'What if light never changed speed — no matter what?',
            story: 'In 1905, a 26-year-old patent clerk asked one question that shattered 300 years of Newtonian certainty: what would the world look like if you rode alongside a beam of light?',
            captions: [{ text: 'A', start_ms: 300, duration_ms: 140 }, { text: 'single', start_ms: 460, duration_ms: 240 }, { text: 'question', start_ms: 720, duration_ms: 320 }, { text: 'changed', start_ms: 1060, duration_ms: 280 }, { text: 'everything', start_ms: 1360, duration_ms: 380 }, { text: 'we', start_ms: 1760, duration_ms: 140 }, { text: 'know.', start_ms: 1920, duration_ms: 340 }],
            audio_key: '',
            start_frame: 360,
            duration_frames: 360,
          },
          {
            type: 'walkthrough',
            heading: 'The Road to Special Relativity',
            steps: [
              'Step 1: Michelson-Morley 1887 — light speed is constant regardless of direction',
              'Step 2: Lorentz & Poincaré derive transformation equations — but cannot explain them',
              'Step 3: Einstein rejects the ether — declares the speed of light a universal constant',
              'Step 4: Time and space become relative — simultaneity depends on the observer',
              'Step 5: E = mc² follows — mass and energy are the same thing, convertible',
            ],
            audio_key: '',
            start_frame: 720,
            duration_frames: 600,
          },
          {
            type: 'summary',
            heading: 'The Legacy',
            bullets: [
              'Special relativity unified space and time into spacetime',
              'GPS satellites require relativistic corrections to give accurate positions',
              'Nuclear energy and particle physics trace directly to E = mc²',
              'One thought experiment rewrote humanity\'s understanding of the cosmos',
            ],
            audio_key: '',
            start_frame: 1320,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Math demo — graph + quiz + push transitions ── */}
    <Composition
      id="LessonVideo-MathDemo"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'Algebra — Quadratic Functions',
        module_title: 'Module 1 · Parabolas',
        lesson_title: 'Understanding y = x²',
        lesson_number: 1,
        theme: 'neural',
        total_frames: 2700,
        slides: [
          {
            type: 'title',
            heading: 'Understanding y = x²',
            subheading: 'Module 1 · Lesson 1',
            captions: [
              { text: 'Welcome',    start_ms: 300,  duration_ms: 260 },
              { text: 'to',         start_ms: 580,  duration_ms: 120 },
              { text: 'the',        start_ms: 720,  duration_ms: 140 },
              { text: 'parabola.',  start_ms: 880,  duration_ms: 380 },
              { text: 'Today',      start_ms: 1500, duration_ms: 220 },
              { text: 'we',         start_ms: 1740, duration_ms: 120 },
              { text: 'graph',      start_ms: 1880, duration_ms: 240 },
              { text: 'y = x²',     start_ms: 2140, duration_ms: 380 },
            ],
            audio_key: '',
            start_frame: 90,
            duration_frames: 240,
          },
          {
            type: 'content',
            heading: 'The Parabola — y = x²',
            bullets: [
              'Symmetric around the y-axis — perfect mirror shape',
              'Vertex at the origin (0, 0) — the minimum point',
              'Opens upward — y is always zero or positive',
              'Every input x has the same y-value as −x',
            ],
            visual_hint: 'graph',
            graph_data: {
              x_range: [-3.2, 3.2],
              y_range: [-0.5, 10],
              points: [
                { x: -3.2, y: 10.24 }, { x: -3.0, y: 9.0 },  { x: -2.7, y: 7.29 },
                { x: -2.4, y: 5.76 },  { x: -2.1, y: 4.41 }, { x: -1.8, y: 3.24 },
                { x: -1.5, y: 2.25 },  { x: -1.2, y: 1.44 }, { x: -0.9, y: 0.81 },
                { x: -0.6, y: 0.36 },  { x: -0.3, y: 0.09 }, { x: 0.0,  y: 0.0  },
                { x: 0.3,  y: 0.09 },  { x: 0.6,  y: 0.36 }, { x: 0.9,  y: 0.81 },
                { x: 1.2,  y: 1.44 },  { x: 1.5,  y: 2.25 }, { x: 1.8,  y: 3.24 },
                { x: 2.1,  y: 4.41 },  { x: 2.4,  y: 5.76 }, { x: 2.7,  y: 7.29 },
                { x: 3.0,  y: 9.0  },  { x: 3.2,  y: 10.24 },
              ],
              key_points: [
                { x: 0,  y: 0,  label: 'Vertex (0, 0)' },
                { x: -2, y: 4,  label: '(-2, 4)' },
                { x: 2,  y: 4,  label: '(2, 4)' },
              ],
              function_label: 'y = x²',
              x_label: 'x',
              y_label: 'y',
              shade_under: false,
            },
            captions: [
              { text: 'The',       start_ms: 200,  duration_ms: 180 },
              { text: 'parabola',  start_ms: 400,  duration_ms: 320 },
              { text: 'y = x²',    start_ms: 740,  duration_ms: 360 },
              { text: 'is',        start_ms: 1120, duration_ms: 140 },
              { text: 'one',       start_ms: 1280, duration_ms: 180 },
              { text: 'of',        start_ms: 1480, duration_ms: 120 },
              { text: 'the',       start_ms: 1620, duration_ms: 140 },
              { text: 'most',      start_ms: 1780, duration_ms: 200 },
              { text: 'beautiful', start_ms: 2000, duration_ms: 360 },
              { text: 'shapes',    start_ms: 2380, duration_ms: 280 },
              { text: 'in',        start_ms: 2680, duration_ms: 140 },
              { text: 'maths.',    start_ms: 2840, duration_ms: 360 },
            ],
            audio_key: '',
            start_frame: 330,
            duration_frames: 360,
          },
          {
            type: 'worked_example',
            heading: 'Let Us Solve It — Step By Step',
            math_steps: [
              { expression: 'y = x²',              annotation: 'Our function' },
              { expression: 'When x = 3:',          annotation: 'Substitute x = 3' },
              { expression: 'y = 3² = 9',           annotation: 'Square the input' },
              { expression: 'When x = −3:',         annotation: 'Negative input' },
              { expression: 'y = (−3)² = 9',        annotation: 'Same result — symmetry!', highlight: true },
            ],
            captions: [
              { text: 'Let',    start_ms: 200, duration_ms: 200 },
              { text: 'us',     start_ms: 420, duration_ms: 140 },
              { text: 'solve',  start_ms: 580, duration_ms: 240 },
              { text: 'step',   start_ms: 840, duration_ms: 200 },
              { text: 'by',     start_ms: 1060, duration_ms: 140 },
              { text: 'step.',  start_ms: 1220, duration_ms: 280 },
            ],
            audio_key: '',
            start_frame: 690,
            duration_frames: 420,
          },
          {
            type: 'quiz',
            heading: 'If x = 4, what is y = x²?',
            quiz_options: [
              { text: '16', correct: true  },
              { text: '8',  correct: false },
              { text: '12', correct: false },
              { text: '20', correct: false },
            ],
            captions: [
              { text: 'Here',    start_ms: 200,  duration_ms: 220 },
              { text: 'is',      start_ms: 440,  duration_ms: 140 },
              { text: 'your',    start_ms: 600,  duration_ms: 180 },
              { text: 'checkpoint.', start_ms: 800, duration_ms: 400 },
              { text: 'If',      start_ms: 1500, duration_ms: 160 },
              { text: 'x = 4,',  start_ms: 1680, duration_ms: 340 },
              { text: 'what',    start_ms: 2040, duration_ms: 180 },
              { text: 'is',      start_ms: 2240, duration_ms: 140 },
              { text: 'y = x²?', start_ms: 2400, duration_ms: 420 },
              { text: '4² = 16.',start_ms: 4000, duration_ms: 460 },
            ],
            audio_key: '',
            start_frame: 1110,
            duration_frames: 660,
          },
          {
            type: 'example',
            heading: 'A Real Example — See It Working',
            bullets: [
              'Before: guessed y = 8 by multiplying 4 × 2',
              'After: understood squaring means 4 × 4, not 4 × 2',
              'Insight: x² always means x times itself — not x times 2',
              'Next step: try negative inputs and see the symmetry yourself',
            ],
            captions: [
              { text: 'The',    start_ms: 200, duration_ms: 180 },
              { text: 'most',   start_ms: 400, duration_ms: 200 },
              { text: 'common', start_ms: 620, duration_ms: 280 },
              { text: 'mistake', start_ms: 920, duration_ms: 300 },
              { text: 'is',     start_ms: 1240, duration_ms: 140 },
              { text: 'mixing', start_ms: 1400, duration_ms: 260 },
              { text: 'x²',     start_ms: 1680, duration_ms: 260 },
              { text: 'with',   start_ms: 1960, duration_ms: 180 },
              { text: '2x.',    start_ms: 2160, duration_ms: 320 },
            ],
            audio_key: '',
            start_frame: 1770,
            duration_frames: 300,
          },
          {
            type: 'summary',
            heading: 'What You Learned Today',
            bullets: [
              'You can now graph y = x² and identify its vertex at (0, 0)',
              'You know x² means x × x — not x × 2',
              'You understand the parabola is symmetric around the y-axis',
              'Your next step: plot y = x² − 4 and find where it crosses the x-axis',
            ],
            captions: [
              { text: 'You',      start_ms: 200, duration_ms: 200 },
              { text: 'now',      start_ms: 420, duration_ms: 180 },
              { text: 'own',      start_ms: 620, duration_ms: 200 },
              { text: 'the',      start_ms: 840, duration_ms: 140 },
              { text: 'parabola.', start_ms: 1000, duration_ms: 400 },
            ],
            audio_key: '',
            start_frame: 2070,
            duration_frames: 300,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* ── Cinematic documentary demo — historical visuals on every slide ── */}
    <Composition
      id="LessonVideo-CinematicHistoryDemo"
      component={LessonVideo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        course_title: 'The Age of Enlightenment',
        module_title: 'Module 1 · The Scientific Revolution',
        lesson_title: 'Newton and the Laws of Nature',
        lesson_number: 1,
        theme: 'cinematic',
        total_frames: 2700,
        slides: [
          {
            type: 'title',
            heading: 'Newton and the Laws of Nature',
            subheading: 'Module 1 · Lesson 1',
            scene_type: 'portrait',
            scene_caption: 'Isaac Newton · 1643–1727',
            scene_era: '17th Century',
            scene_location: 'Cambridge, England',
            captions: [
              { text: 'In',        start_ms: 300,  duration_ms: 160 },
              { text: '1687,',     start_ms: 480,  duration_ms: 320 },
              { text: 'one',       start_ms: 820,  duration_ms: 180 },
              { text: 'book',      start_ms: 1020, duration_ms: 220 },
              { text: 'changed',   start_ms: 1260, duration_ms: 280 },
              { text: 'science',   start_ms: 1560, duration_ms: 300 },
              { text: 'forever.',  start_ms: 1880, duration_ms: 400 },
            ],
            audio_key: '',
            start_frame: 90,
            duration_frames: 240,
          },
          {
            type: 'hook',
            heading: 'A Universe Governed by Laws',
            story: 'Before Newton, the heavens and the Earth seemed to follow different rules. He proved they did not. A single equation — F = ma — described a falling apple and the orbit of the Moon.',
            scene_type: 'event',
            scene_caption: 'The Principia Mathematica, 1687',
            scene_era: '1687',
            scene_location: 'London, England',
            captions: [
              { text: 'Before',    start_ms: 300, duration_ms: 260 },
              { text: 'Newton,',   start_ms: 580, duration_ms: 340 },
              { text: 'the',       start_ms: 940, duration_ms: 140 },
              { text: 'heavens',   start_ms: 1100, duration_ms: 280 },
              { text: 'and',       start_ms: 1400, duration_ms: 140 },
              { text: 'the',       start_ms: 1560, duration_ms: 140 },
              { text: 'Earth',     start_ms: 1720, duration_ms: 260 },
              { text: 'obeyed',    start_ms: 2000, duration_ms: 280 },
              { text: 'different', start_ms: 2300, duration_ms: 320 },
              { text: 'rules.',    start_ms: 2640, duration_ms: 360 },
            ],
            audio_key: '',
            start_frame: 330,
            duration_frames: 360,
          },
          {
            type: 'content',
            heading: 'The Three Laws of Motion',
            bullets: [
              'First Law — an object at rest stays at rest unless a force acts on it',
              'Second Law — force equals mass times acceleration: F = ma',
              'Third Law — for every action there is an equal and opposite reaction',
              'Together, these three laws describe all motion in the universe',
            ],
            scene_type: 'building',
            scene_caption: 'The Royal Society, London',
            scene_era: '1660–1700',
            scene_location: 'London, England',
            captions: [
              { text: 'Newton',   start_ms: 200,  duration_ms: 260 },
              { text: 'gave',     start_ms: 480,  duration_ms: 180 },
              { text: 'us',       start_ms: 680,  duration_ms: 120 },
              { text: 'three',    start_ms: 820,  duration_ms: 200 },
              { text: 'laws',     start_ms: 1040, duration_ms: 220 },
              { text: 'that',     start_ms: 1280, duration_ms: 160 },
              { text: 'explain',  start_ms: 1460, duration_ms: 280 },
              { text: 'everything.', start_ms: 1760, duration_ms: 440 },
            ],
            audio_key: '',
            start_frame: 690,
            duration_frames: 420,
          },
          {
            type: 'walkthrough',
            heading: 'How the Apple Became a Legend',
            steps: [
              'Newton sits beneath an apple tree in Woolsthorpe — the plague has closed Cambridge',
              'An apple falls — he asks: why does it not fall sideways, or upward?',
              'He realises the Earth pulls the apple — and must pull the Moon too',
              'He calculates: the Moon falls toward Earth at exactly the rate his law predicts',
              'He writes it all in the Principia — published in 1687',
            ],
            scene_type: 'map',
            scene_caption: 'Woolsthorpe Manor, Lincolnshire',
            scene_era: '1666',
            scene_location: 'Lincolnshire, England',
            captions: [
              { text: 'The',       start_ms: 200,  duration_ms: 160 },
              { text: 'story',     start_ms: 380,  duration_ms: 240 },
              { text: 'of',        start_ms: 640,  duration_ms: 120 },
              { text: 'the',       start_ms: 780,  duration_ms: 140 },
              { text: 'apple',     start_ms: 940,  duration_ms: 260 },
              { text: 'is',        start_ms: 1220, duration_ms: 140 },
              { text: 'not',       start_ms: 1380, duration_ms: 180 },
              { text: 'a',         start_ms: 1580, duration_ms: 100 },
              { text: 'myth.',     start_ms: 1700, duration_ms: 340 },
            ],
            audio_key: '',
            start_frame: 1110,
            duration_frames: 600,
          },
          {
            type: 'example',
            heading: 'From Cambridge to the Moon',
            example_prompt: 'If the Moon is 384,000 km away and Newton\'s law holds, what keeps it in orbit?',
            ai_response: 'Gravity. The same force pulling an apple down pulls the Moon inward — keeping it in a perfect circular path around Earth forever.',
            scene_type: 'crowd',
            scene_caption: 'The Enlightenment Spreads Across Europe',
            scene_era: '18th Century',
            scene_location: 'Europe',
            captions: [
              { text: 'Gravity',   start_ms: 200,  duration_ms: 280 },
              { text: 'does',      start_ms: 500,  duration_ms: 180 },
              { text: 'not',       start_ms: 700,  duration_ms: 160 },
              { text: 'stop',      start_ms: 880,  duration_ms: 220 },
              { text: 'at',        start_ms: 1120, duration_ms: 120 },
              { text: 'the',       start_ms: 1260, duration_ms: 140 },
              { text: 'sky.',      start_ms: 1420, duration_ms: 340 },
            ],
            audio_key: '',
            start_frame: 1710,
            duration_frames: 360,
          },
          {
            type: 'summary',
            heading: 'What You Learned Today',
            bullets: [
              'Newton unified Earth and sky under a single law of gravity',
              'His three laws of motion describe every push, pull, and orbit',
              'The Principia (1687) is still one of the greatest books ever written',
              'Next lesson: how Faraday and Maxwell built on Newton\'s foundation',
            ],
            scene_type: 'portrait',
            scene_caption: 'Isaac Newton · Knighted 1705',
            scene_era: '1705',
            scene_location: 'London, England',
            captions: [
              { text: 'Newton',   start_ms: 200,  duration_ms: 280 },
              { text: 'showed',   start_ms: 500,  duration_ms: 260 },
              { text: 'us',       start_ms: 780,  duration_ms: 140 },
              { text: 'the',      start_ms: 940,  duration_ms: 140 },
              { text: 'universe', start_ms: 1100, duration_ms: 340 },
              { text: 'runs',     start_ms: 1460, duration_ms: 220 },
              { text: 'on',       start_ms: 1700, duration_ms: 140 },
              { text: 'rules.',   start_ms: 1860, duration_ms: 360 },
            ],
            audio_key: '',
            start_frame: 2070,
            duration_frames: 360,
          },
        ],
      } satisfies LessonVideoProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as LessonVideoProps).total_frames || 300,
      })}
    />

    {/* Course pre-roll intro — 10 seconds, 1920×1080 */}
    <Composition
      id="NestCourseIntro"
      component={NestCourseIntro}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />

    {/* Promo video */}
    <Composition
      id="NestPromo"
      component={NestPromo}
      durationInFrames={900}
      fps={30}
      width={1280}
      height={720}
    />

    {/* Onboarding overview videos — 30s each */}
    {ONBOARDING_COMPONENTS.map((Component, i) => (
      <Composition
        key={i + 1}
        id={`Onboarding${String(i + 1).padStart(2, '0')}-${ONBOARDING_TITLES[i].replace(/[^a-zA-Z0-9]/g, '-')}`}
        component={Component}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
    ))}

    {/* Tutorial step-by-step videos — dynamic duration from steps */}
    {TUTORIAL_COMPONENTS.map(({ id, title, component: Component }) => (
      <Composition
        key={id}
        id={`Tutorial-${id}-${title}`}
        component={Component}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
    ))}

    {/* Tutorial thumbnails — 1280×720 PNG stills */}
    <Still id="Thumb-T01-Welcome"            component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 1,  title: 'Welcome to Nest',                steps: ['The Learner Dashboard', 'Navigating to My Courses', 'Opening a Course'],          icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T02-OrgSetup"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 2,  title: 'Setting Up Your Organisation',   steps: ['Go to Settings', 'Upload Your Logo', 'Save Your Settings'],                      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }} />
    <Still id="Thumb-T03-ManageTeam"         component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 3,  title: 'Managing Your Team',             steps: ['View Your Team', 'Invite a New Member', 'Change a Member\'s Role'],             icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }} />
    <Still id="Thumb-T04-CreateCourse"       component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 4,  title: 'Creating Courses & Videos',      steps: ['Create a New Course', 'Upload a Video', 'Set Video Details'],                   icon: 'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' }} />
    <Still id="Thumb-T05-Transcription"      component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 5,  title: 'Transcription & AI Q&A',         steps: ['View Auto-Generated Transcript', 'Ask the AI a Question'],                      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }} />
    <Still id="Thumb-T06-Quizzes"            component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 6,  title: 'Quizzes & Assessments',          steps: ['Add a Quiz to a Video', 'Taking a Quiz as a Learner'],                          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }} />
    <Still id="Thumb-T07-Assignments"        component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 7,  title: 'Assignments & Tasks',            steps: ['Create an Assignment', 'Submit an Assignment', 'Review & Grade Submissions'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }} />
    <Still id="Thumb-T08-Progress"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 8,  title: 'Progress Tracking',              steps: ['Your Progress Overview', 'Educator Progress View'],                              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T09-Meetings"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 9,  title: '1-on-1 Meetings',                steps: ['Schedule a Meeting', 'Join a Meeting'],                                          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }} />
    <Still id="Thumb-T10-Analytics"          component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 10, title: 'Analytics & Reporting',          steps: ['Organisation Analytics Overview', 'Course-Level Insights'],                    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }} />
    <Still id="Thumb-T11-Certificates"       component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 11, title: 'Certificates',                   steps: ['Earn a Certificate', 'Download or Share Your Certificate'],                     icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }} />
    <Still id="Thumb-T12-Payments"           component={TutorialThumbnail} width={1280} height={720} defaultProps={{ lessonNumber: 12, title: 'Payments & Billing',             steps: ['Purchase Learner Access', 'Submit Payment Proof', 'Billing History'],          icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }} />
  </>
);
