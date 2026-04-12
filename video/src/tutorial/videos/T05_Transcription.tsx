import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', active: true },
  { label: 'Q&A',       icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Team',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

const TRANSCRIPT_LINES = [
  { time: '0:00', text: 'Welcome to Introduction to Data Analytics.' },
  { time: '0:06', text: 'In this video we\'ll cover the core concepts of data analysis.' },
  { time: '0:14', text: 'Data analytics is the process of examining datasets to draw conclusions.' },
  { time: '0:22', text: 'There are four main types: descriptive, diagnostic, predictive, and prescriptive.' },
  { time: '0:34', text: 'Let\'s start with descriptive analytics — what happened in the past.' },
];

export const T05_Transcription: React.FC = () => (
  <TutorialTemplate
    moduleNumber={5}
    moduleTitle="Transcription & AI Q&A"
    lessonTag="Lesson 05 · AI Features"
    nextLesson="Quizzes & Assessments"
    audioSrc="audio/T05_Transcription.mp3"
    steps={[
      {
        title: 'View Auto-Generated Transcript',
        instruction: 'After a video is uploaded, Nest automatically generates a transcript. Click the "Transcript" tab to view it.',
        durationInFrames: 200,
        render: (sf) => {
          const tabClicked = sf > 60;
          const transcriptOp = interpolate(sf, [65, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 550], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [200, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const visibleLines = Math.floor(interpolate(sf, [95, 175], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics/videos/1">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Introduction to Data Analytics" subtitle="Advanced Data Analytics · 14:22" />
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: `1px solid ${RULE}`, padding: '0 32px' }}>
                      {['Overview', 'Transcript', 'Q&A', 'Notes'].map((tab, i) => (
                        <div key={i} style={{
                          padding: '10px 16px', fontFamily: 'sans-serif', fontSize: 12,
                          color: (tabClicked && i === 1) ? GOLD : INK2,
                          borderBottom: (tabClicked && i === 1) ? `2px solid ${GOLD}` : '2px solid transparent',
                          cursor: 'pointer', marginBottom: -1,
                        }}>{tab}</div>
                      ))}
                    </div>
                    {tabClicked ? (
                      <div style={{ padding: '20px 32px', opacity: transcriptOp }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD }}>AI Generated</span>
                          </div>
                          <GoldButton label="Download .txt" small />
                        </div>
                        {TRANSCRIPT_LINES.slice(0, visibleLines).map((line, i) => (
                          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12, opacity: Math.min(1, (visibleLines - i) * 0.5) }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: GOLD, flexShrink: 0, marginTop: 2 }}>{line.time}</span>
                            <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.6 }}>{line.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px 32px' }}>
                        <div style={{ height: 200, background: '#111008', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="40" height="40" viewBox="0 0 20 20" fill={INK2}><path d="M5 4l12 6-12 6V4z"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!tabClicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={512} y={78} w={90} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 50 && sf < 68} />
            </div>
          );
        },
      },
      {
        title: 'Ask the AI a Question',
        instruction: 'Switch to the Q&A tab and type a question about the video. The AI reads the transcript to give you a precise answer.',
        durationInFrames: 240,
        render: (sf) => {
          const questionLen = Math.floor(interpolate(sf, [70, 140], [0, 42], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const answerOp = interpolate(sf, [160, 185], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const thinkingOp = interpolate(sf, [145, 162], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fullQuestion = 'What are the four types of data analytics?';
          const cursorX = interpolate(sf, [20, 60], [500, 440], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 60], [200, 380], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics/videos/1">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Introduction to Data Analytics" subtitle="Q&A · Ask anything about this video" />
                    <div style={{ display: 'flex', borderBottom: `1px solid ${RULE}`, padding: '0 32px' }}>
                      {['Overview', 'Transcript', 'Q&A', 'Notes'].map((tab, i) => (
                        <div key={i} style={{ padding: '10px 16px', fontFamily: 'sans-serif', fontSize: 12, color: i === 2 ? GOLD : INK2, borderBottom: i === 2 ? `2px solid ${GOLD}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>{tab}</div>
                      ))}
                    </div>
                    <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', height: 340, justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        {sf > 140 && sf < 160 && (
                          <div style={{ opacity: thinkingOp, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'Georgia', fontSize: 14, fontWeight: 700, color: GOLD }}>N</span>
                            </div>
                            <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: '0 10px 10px 10px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: INK2, opacity: 0.5 + 0.5 * Math.sin(Date.now() / 300 + i) }} />)}
                            </div>
                          </div>
                        )}
                        {sf >= 160 && (
                          <div style={{ opacity: answerOp }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200,169,110,0.1)', border: `1px solid rgba(200,169,110,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontFamily: 'Georgia', fontSize: 14, fontWeight: 700, color: GOLD }}>N</span>
                              </div>
                              <div style={{ background: CARD, border: `1px solid rgba(200,169,110,0.15)`, borderRadius: '0 10px 10px 10px', padding: '12px 16px', maxWidth: 500 }}>
                                <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.7, margin: 0 }}>
                                  According to the video, there are <strong style={{ color: GOLD }}>four types</strong> of data analytics:
                                  <br />1. <strong>Descriptive</strong> — what happened
                                  <br />2. <strong>Diagnostic</strong> — why it happened
                                  <br />3. <strong>Predictive</strong> — what will happen
                                  <br />4. <strong>Prescriptive</strong> — what should we do
                                </p>
                                <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 9, color: INK2 }}>Referenced from 0:22 in transcript</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '8px 14px' }}>
                        <input
                          readOnly
                          value={fullQuestion.slice(0, questionLen)}
                          placeholder="Ask a question about this video…"
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'sans-serif', fontSize: 12, color: INK }}
                        />
                        <GoldButton label="Ask" small glow={questionLen === 42} />
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              <Cursor x={cursorX} y={cursorY} clicking={sf > 60 && sf < 75} />
            </div>
          );
        },
      },
    ]}
  />
);
