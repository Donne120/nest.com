import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Courses',    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', active: true },
  { label: 'Team',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Analytics',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export const T04_CreateCourse: React.FC = () => (
  <TutorialTemplate
    moduleNumber={4}
    moduleTitle="Creating Courses & Videos"
    lessonTag="Lesson 04 · Course Creation"
    nextLesson="Transcription & AI Q&A"
    audioSrc="audio/T04_CreateCourse.mp3"
    steps={[
      {
        title: 'Create a New Course',
        instruction: 'Go to Courses and click "+ New Course". Give it a title and description — this is what your learners will see.',
        durationInFrames: 220,
        render: (sf) => {
          const modalOp = interpolate(sf, [60, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const titleLen = Math.floor(interpolate(sf, [90, 150], [0, 28], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const descLen  = Math.floor(interpolate(sf, [155, 200], [0, 38], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const fullTitle = 'Advanced Data Analytics';
          const fullDesc  = 'Learn to analyse and visualise data';
          const cursorX = interpolate(sf, [20, 55], [300, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [100, 70], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showModal = sf > 58;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Courses" subtitle="3 courses" action={<GoldButton label="+ New Course" glow={!showModal} />} />
                    <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {['Introduction to Data Science', 'Python for Beginners', 'Machine Learning Basics'].map((t, i) => (
                        <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px' }}>
                          <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 600 }}>{t}</div>
                          <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK2, marginTop: 4 }}>{[8, 5, 12][i]} videos</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', opacity: modalOp, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: '#1a1814', border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 14, padding: '28px 32px', width: 420 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: INK, marginBottom: 20 }}>New Course</div>
                    <Input label="Course Title" value={fullTitle.slice(0, titleLen)} focused={sf > 88 && sf < 153} placeholder="e.g. Introduction to Marketing" />
                    <Input label="Description" value={fullDesc.slice(0, descLen)} focused={sf > 154} placeholder="What will learners achieve?" />
                    <div style={{ marginTop: 8 }}>
                      <GoldButton label="Create Course" glow={descLen > 10} />
                    </div>
                  </div>
                </div>
              )}
              {!showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={764} y={53} w={140} h={36} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 50 && sf < 65} />
            </div>
          );
        },
      },
      {
        title: 'Upload a Video',
        instruction: 'Inside your course, click "+ Add Video" and drag or select your MP4 file. Videos are processed automatically.',
        durationInFrames: 220,
        render: (sf) => {
          const uploadProgress = interpolate(sf, [90, 175], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const doneOp = interpolate(sf, [178, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 60], [500, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 60], [300, 350], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const uploading = sf > 70;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Advanced Data Analytics" subtitle="0 videos · just created" action={<GoldButton label="+ Add Video" glow={!uploading} />} />
                    <div style={{ padding: '24px 32px' }}>
                      {!uploading ? (
                        <div style={{ border: `2px dashed rgba(200,169,110,0.2)`, borderRadius: 12, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.2"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                          <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2 }}>Drop your video here, or <span style={{ color: GOLD }}>browse files</span></span>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>MP4, MOV, AVI up to 2GB</span>
                        </div>
                      ) : (
                        <div style={{ border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>intro-to-analytics.mp4</div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, marginTop: 2 }}>
                                {uploadProgress < 100 ? `${Math.round(uploadProgress)}% · uploading…` : 'Processing complete'}
                              </div>
                            </div>
                            {uploadProgress >= 100 && (
                              <div style={{ opacity: doneOp }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                              </div>
                            )}
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 2, transition: 'width 0.1s' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Browser>
              {!uploading && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={257} y={290} w={680} h={140} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 55 && sf < 75} />
            </div>
          );
        },
      },
      {
        title: 'Set Video Details',
        instruction: 'After uploading, add a title and description for the video. These help learners find and understand the content.',
        durationInFrames: 200,
        render: (sf) => {
          const titleLen = Math.floor(interpolate(sf, [40, 110], [0, 32], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const savedOp = interpolate(sf, [155, 175], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fullTitle = 'Introduction to Data Analytics';
          const cursorX = interpolate(sf, [20, 35], [500, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 35], [250, 230], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics/videos/1">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Video Details" subtitle="Advanced Data Analytics" />
                    <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <Input label="Video Title" value={fullTitle.slice(0, titleLen)} focused={sf < 115} placeholder="Enter video title" />
                        <Input label="Description" value={sf > 115 ? 'An overview of key analytics concepts' : ''} focused={sf >= 115 && sf < 155} placeholder="What does this video cover?" />
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                          <GoldButton label="Save" glow small />
                          {sf > 150 && (
                            <div style={{ opacity: savedOp, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                              <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#4a9a6a' }}>Saved</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ height: 160, background: '#111008', borderRadius: 10, border: `1px solid rgba(200,169,110,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid rgba(200,169,110,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 20 20" fill={GOLD}><path d="M5 4l12 6-12 6V4z"/></svg>
                          </div>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, marginTop: 8, textAlign: 'center' }}>intro-to-analytics.mp4 · 00:14:22</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              <Cursor x={cursorX} y={cursorY} clicking={sf > 30 && sf < 45} />
            </div>
          );
        },
      },
    ]}
  />
);
