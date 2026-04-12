import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Progress',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: true },
  { label: 'Meetings',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export const T08_Progress: React.FC = () => (
  <TutorialTemplate
    moduleNumber={8}
    moduleTitle="Progress Tracking"
    lessonTag="Lesson 08 · Progress & Stats"
    nextLesson="1-on-1 Meetings"
    audioSrc="audio/T08_Progress.mp3"
    steps={[
      {
        title: 'Your Progress Overview',
        instruction: 'The Progress page shows all your enrolled courses, how many videos you\'ve watched, and your overall completion rate.',
        durationInFrames: 200,
        render: (sf) => {
          const cardsOp = interpolate(sf, [30, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const barsOp = interpolate(sf, [70, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const COURSES = [
            { title: 'Introduction to Data Science', progress: 60, videos: 8, watched: 5 },
            { title: 'Python for Beginners',          progress: 20, videos: 5, watched: 1 },
            { title: 'Machine Learning Basics',        progress: 0,  videos: 12, watched: 0 },
          ];
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/progress">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="My Progress" subtitle="3 courses enrolled" />
                    <div style={{ padding: '20px 32px' }}>
                      {/* Summary stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24, opacity: cardsOp }}>
                        {[
                          { label: 'Overall Progress', value: '28%', sub: 'across all courses' },
                          { label: 'Videos Watched',   value: '6',   sub: 'of 25 total' },
                          { label: 'Time Spent',       value: '4.2h', sub: 'this month' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 300, color: GOLD }}>{s.value}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK2 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>
                      {/* Course progress bars */}
                      <div style={{ opacity: barsOp }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 12 }}>Course Breakdown</div>
                        {COURSES.map((c, i) => (
                          <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>{c.title}</span>
                              <span style={{ fontFamily: 'monospace', fontSize: 10, color: GOLD }}>{c.progress}%</span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
                              <div style={{ width: `${c.progress}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 3 }} />
                            </div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK2, marginTop: 4 }}>{c.watched} of {c.videos} videos watched</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
            </div>
          );
        },
      },
      {
        title: 'Educator Progress View',
        instruction: 'As an educator, go to any learner\'s profile under Team to see their individual progress across all courses.',
        durationInFrames: 200,
        render: (sf) => {
          const contentOp = interpolate(sf, [30, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 310], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [300, 200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const highlightOp = interpolate(sf, [100, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/team/amara-osei/progress">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={[
                    { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
                    { label: 'Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                    { label: 'Team',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', active: true },
                    { label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                  ]} />
                  <div style={{ flex: 1, opacity: contentOp }}>
                    <PageHeader title="Amara Osei — Progress" subtitle="Learner · Active since Jan 2025" action={<Badge label="60% avg" color="gold" />} />
                    <div style={{ padding: '20px 32px' }}>
                      {[
                        { title: 'Introduction to Data Science', progress: 60, lastSeen: '2 days ago' },
                        { title: 'Python for Beginners',          progress: 20, lastSeen: '1 week ago' },
                        { title: 'Machine Learning Basics',        progress: 0,  lastSeen: 'Not started' },
                      ].map((c, i) => (
                        <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 500, marginBottom: 6 }}>{c.title}</div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 4 }}>
                              <div style={{ width: `${c.progress}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 2 }} />
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 14, color: GOLD, fontWeight: 700 }}>{c.progress}%</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK2, marginTop: 2 }}>{c.lastSeen}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {sf > 95 && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: highlightOp }}>
                  <Highlight x={230} y={145} w={700} h={68} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} />
            </div>
          );
        },
      },
    ]}
  />
);
