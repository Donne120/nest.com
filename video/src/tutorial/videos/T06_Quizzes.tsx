import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', active: true },
  { label: 'Quizzes',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: 'Team',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

export const T06_Quizzes: React.FC = () => (
  <TutorialTemplate
    moduleNumber={6}
    moduleTitle="Quizzes & Assessments"
    lessonTag="Lesson 06 · Assessment Tools"
    nextLesson="Assignments & Tasks"
    audioSrc="audio/T06_Quizzes.mp3"
    steps={[
      {
        title: 'Add a Quiz to a Video',
        instruction: 'Open any video, go to the Quiz tab, and click "+ Add Question" to create a question learners answer after watching.',
        durationInFrames: 200,
        render: (sf) => {
          const tabClicked = sf > 50;
          const addClicked = sf > 100;
          const formOp = interpolate(sf, [105, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 45, 90, 95], [400, 620, 620, 680], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 45, 90, 95], [200, 95, 95, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics/videos/1">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Introduction to Data Analytics" subtitle="Advanced Data Analytics" action={addClicked ? <GoldButton label="+ Add Question" glow /> : undefined} />
                    <div style={{ display: 'flex', borderBottom: `1px solid ${RULE}`, padding: '0 32px' }}>
                      {['Overview', 'Transcript', 'Q&A', 'Quiz'].map((tab, i) => (
                        <div key={i} style={{ padding: '10px 16px', fontFamily: 'sans-serif', fontSize: 12, color: (tabClicked && i === 3) ? GOLD : INK2, borderBottom: (tabClicked && i === 3) ? `2px solid ${GOLD}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>{tab}</div>
                      ))}
                    </div>
                    <div style={{ padding: '20px 32px' }}>
                      {addClicked ? (
                        <div style={{ opacity: formOp }}>
                          <div style={{ background: CARD, border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 10, padding: '20px 24px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>New Question</div>
                            <Input label="Question" value="What are the four types of data analytics?" />
                            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Answer Options</div>
                            {['Descriptive, Diagnostic, Predictive, Prescriptive', 'Quantitative, Qualitative, Mixed, Hybrid', 'Basic, Advanced, Expert, Master'].map((opt, i) => (
                              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${i === 0 ? GOLD : INK2}`, background: i === 0 ? GOLD : 'transparent', flexShrink: 0 }} />
                                <div style={{ flex: 1, padding: '7px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(200,169,110,0.3)' : RULE}`, borderRadius: 7, fontFamily: 'sans-serif', fontSize: 11, color: i === 0 ? INK : INK2 }}>{opt}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : tabClicked ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                          <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2 }}>No questions yet</span>
                          <GoldButton label="+ Add Question" glow />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Browser>
              {!tabClicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={607} y={78} w={70} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={(sf > 40 && sf < 58) || (sf > 90 && sf < 108)} />
            </div>
          );
        },
      },
      {
        title: 'Taking a Quiz as a Learner',
        instruction: 'Learners see the quiz at the end of the video. Each question appears one at a time with multiple-choice answers.',
        durationInFrames: 220,
        render: (sf) => {
          const answered = sf > 90;
          const resultOp = interpolate(sf, [130, 155], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const selectedOp = interpolate(sf, [92, 108], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 80], [500, 350], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 80], [200, 245], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const OPTIONS = [
            'Descriptive, Diagnostic, Predictive, Prescriptive',
            'Quantitative, Qualitative, Mixed, Hybrid',
            'Basic, Advanced, Expert, Master',
            'Primary, Secondary, Tertiary, Quaternary',
          ];
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/courses/advanced-data-analytics/videos/1/quiz">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS.map((n, i) => ({ ...n, active: false }))} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Quiz" subtitle="Introduction to Data Analytics · Question 1 of 3" />
                    {sf < 130 ? (
                      <div style={{ padding: '24px 32px' }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontStyle: 'italic', color: INK, marginBottom: 24, lineHeight: 1.5 }}>
                          What are the four types of data analytics?
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {OPTIONS.map((opt, i) => {
                            const isSelected = answered && i === 0;
                            return (
                              <div key={i} style={{
                                padding: '12px 16px', borderRadius: 10,
                                border: `1px solid ${isSelected ? GOLD : 'rgba(200,169,110,0.15)'}`,
                                background: isSelected ? 'rgba(200,169,110,0.1)' : CARD,
                                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                opacity: isSelected ? selectedOp + (1 - selectedOp) * 0 : (answered && i > 0 ? 0.5 : 1),
                              }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${isSelected ? GOLD : INK2}`, background: isSelected ? GOLD : 'transparent', flexShrink: 0 }} />
                                <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: isSelected ? INK : INK2 }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                        {answered && (
                          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                            <GoldButton label="Submit Answer" glow small />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '24px 32px', opacity: resultOp }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
                          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,154,106,0.1)', border: '2px solid #4a9a6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          </div>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontStyle: 'italic', color: INK }}>Correct!</div>
                          <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2, textAlign: 'center', maxWidth: 380 }}>
                            The four types are Descriptive, Diagnostic, Predictive, and Prescriptive analytics.
                          </div>
                          <GoldButton label="Next Question →" glow />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              <Cursor x={cursorX} y={cursorY} clicking={sf > 82 && sf < 98} />
            </div>
          );
        },
      },
    ]}
  />
);
