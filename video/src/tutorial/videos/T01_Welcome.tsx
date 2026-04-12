import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Cursor, Highlight, Badge, VideoCard, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', active: true },
  { label: 'My Courses',  icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Progress',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Meetings',    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Certificates',icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
];

export const T01_Welcome: React.FC = () => (
  <TutorialTemplate
    moduleNumber={1}
    moduleTitle="Welcome to Nest"
    lessonTag="Lesson 01 · Getting Started"
    nextLesson="Setting Up Your Organisation"
    audioSrc="audio/T01_Welcome.mp3"
    steps={[
      {
        title: 'The Learner Dashboard',
        instruction: 'After logging in, this is your home. It shows your enrolled courses, recent activity, and progress at a glance.',
        durationInFrames: 200,
        render: (sf) => {
          const cursorX = interpolate(sf, [40, 90], [600, 260], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [40, 90], [80, 180], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const highlight1Op = interpolate(sf, [90, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const statsOp = interpolate(sf, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/dashboard">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <PageHeader title="Good morning, Amara 👋" subtitle="Here's where you left off" />
                    <div style={{ padding: '20px 32px' }}>
                      {/* Stats row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24, opacity: statsOp }}>
                        {[
                          { label: 'Courses Enrolled', value: '3', sub: '1 in progress' },
                          { label: 'Videos Watched',   value: '12', sub: 'this week' },
                          { label: 'Certificates',     value: '1', sub: 'earned' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 300, color: GOLD }}>{s.value}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK2 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>
                      {/* Continue learning */}
                      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 12 }}>Continue Learning</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                        <VideoCard title="Introduction to Data Science" duration="45:00" progress={60} />
                        <VideoCard title="Python for Beginners" duration="30:00" progress={20} />
                        <VideoCard title="Machine Learning Basics" duration="1:02:00" progress={0} />
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              <div style={{ position: 'absolute', top: 0, left: 0, opacity: highlight1Op, pointerEvents: 'none' }}>
                <Highlight x={230} y={56} w={260} h={36} pulse />
              </div>
              <Cursor x={cursorX} y={cursorY} />
            </div>
          );
        },
      },
      {
        title: 'Navigating to My Courses',
        instruction: 'Click "My Courses" in the sidebar to see all courses available to you in your organisation.',
        durationInFrames: 200,
        render: (sf) => {
          const clicked = sf > 60;
          const highlightOp = interpolate(sf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const newContentOp = interpolate(sf, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [140, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [200, 155], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const updatedNav = NAV_ITEMS.map((n, i) => ({ ...n, active: i === 1 && clicked }));
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/modules">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={updatedNav} />
                  <div style={{ flex: 1 }}>
                    {clicked ? (
                      <div style={{ opacity: newContentOp }}>
                        <PageHeader title="My Courses" subtitle="3 courses available in your organisation" action={<Badge label="3 available" color="gold" />} />
                        <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {[
                            { title: 'Introduction to Data Science', videos: 8, progress: 60 },
                            { title: 'Python for Beginners', videos: 5, progress: 20 },
                            { title: 'Machine Learning Basics', videos: 12, progress: 0 },
                          ].map((c, i) => (
                            <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 600 }}>{c.title}</div>
                                <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK2, marginTop: 3 }}>{c.videos} videos</div>
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8 }}>
                                  <div style={{ width: `${c.progress}%`, height: '100%', background: GOLD, borderRadius: 2 }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <PageHeader title="Good morning, Amara 👋" subtitle="Here's where you left off" />
                    )}
                  </div>
                </div>
              </Browser>
              <div style={{ position: 'absolute', top: 0, left: 0, opacity: highlightOp * (clicked ? 0 : 1), pointerEvents: 'none' }}>
                <Highlight x={10} y={136} w={200} h={34} pulse />
              </div>
              <Cursor x={cursorX} y={cursorY} clicking={sf > 55 && sf < 70} />
            </div>
          );
        },
      },
      {
        title: 'Opening a Course',
        instruction: 'Click any course to open it. You\'ll see all the videos inside, your progress, and any quizzes attached.',
        durationInFrames: 200,
        render: (sf) => {
          const courseClicked = sf > 70;
          const newContentOp = interpolate(sf, [75, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 60], [340, 240], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 60], [200, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url={courseClicked ? 'nest-com.vercel.app/modules/intro-data-science' : 'nest-com.vercel.app/modules'}>
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS.map((n, i) => ({ ...n, active: i === 1 }))} />
                  <div style={{ flex: 1 }}>
                    {courseClicked ? (
                      <div style={{ opacity: newContentOp }}>
                        <PageHeader title="Introduction to Data Science" subtitle="8 videos · 60% complete" action={<Badge label="In Progress" color="gold" />} />
                        <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[
                            { title: 'What is Data Science?', duration: '8:20', done: true },
                            { title: 'Types of Data', duration: '12:10', done: true },
                            { title: 'Introduction to Python', duration: '15:44', done: false, active: true },
                            { title: 'Pandas & DataFrames', duration: '18:30', done: false },
                            { title: 'Data Visualisation', duration: '14:22', done: false },
                          ].map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: v.active ? 'rgba(200,169,110,0.08)' : CARD, border: `1px solid ${v.active ? 'rgba(200,169,110,0.25)' : RULE}`, borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${v.done ? '#4a9a6a' : 'rgba(200,169,110,0.3)'}`, background: v.done ? 'rgba(74,154,106,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {v.done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> : <svg width="8" height="8" viewBox="0 0 20 20" fill={v.active ? GOLD : INK2}><path d="M5 4l12 6-12 6V4z"/></svg>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: v.active ? INK : (v.done ? INK2 : INK), fontWeight: v.active ? 600 : 400 }}>{v.title}</div>
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{v.duration}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <PageHeader title="My Courses" subtitle="3 courses available" />
                        <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div style={{ background: CARD, border: `1px solid rgba(200,169,110,0.25)`, borderRadius: 10, padding: '16px 20px', cursor: 'pointer' }}>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 600 }}>Introduction to Data Science</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK2, marginTop: 4 }}>8 videos · 60% complete</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!courseClicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={230} y={125} w={260} h={52} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 65 && sf < 80} />
            </div>
          );
        },
      },
    ]}
  />
);
