import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, DataRow, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses',  icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', active: true },
  { label: 'Progress',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export const T07_Assignments: React.FC = () => (
  <TutorialTemplate
    moduleNumber={7}
    moduleTitle="Assignments & Tasks"
    lessonTag="Lesson 07 · Assignments"
    nextLesson="Progress Tracking"
    audioSrc="audio/T07_Assignments.mp3"
    steps={[
      {
        title: 'Create an Assignment',
        instruction: 'As an educator, go to Assignments and click "+ New Assignment". Set a title, description, and due date.',
        durationInFrames: 220,
        render: (sf) => {
          const modalOp = interpolate(sf, [55, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const titleLen = Math.floor(interpolate(sf, [85, 140], [0, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const descLen  = Math.floor(interpolate(sf, [145, 195], [0, 40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const fullTitle = 'Data Analysis Report — Week 3';
          const fullDesc  = 'Analyse the provided dataset and submit';
          const cursorX = interpolate(sf, [20, 50], [500, 750], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 50], [200, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showModal = sf > 52;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/assignments">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Assignments" subtitle="Manage and track learner tasks" action={<GoldButton label="+ New Assignment" glow={!showModal} />} />
                    <div style={{ padding: '20px 32px' }}>
                      {[
                        { title: 'Python Script Submission', due: 'Due Apr 15', status: 'active' },
                        { title: 'Data Visualisation Project', due: 'Due Apr 22', status: 'active' },
                      ].map((a, i) => (
                        <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '14px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 500 }}>{a.title}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, marginTop: 3 }}>{a.due}</div>
                          </div>
                          <Badge label="Active" color="gold" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', opacity: modalOp, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: '#1a1814', border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 14, padding: '28px 32px', width: 440 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: INK, marginBottom: 20 }}>New Assignment</div>
                    <Input label="Title" value={fullTitle.slice(0, titleLen)} focused={sf > 83 && sf < 143} placeholder="Assignment title" />
                    <Input label="Instructions" value={fullDesc.slice(0, descLen)} focused={sf >= 143} placeholder="What should learners do?" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <Input label="Due Date" value="April 30, 2026" />
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 6 }}>Course</div>
                        <div style={{ padding: '9px 14px', background: '#2a2620', border: `1px solid rgba(200,169,110,0.15)`, borderRadius: 6, fontFamily: 'sans-serif', fontSize: 12, color: INK }}>Advanced Data Analytics</div>
                      </div>
                    </div>
                    <GoldButton label="Create Assignment" glow={descLen > 10} />
                  </div>
                </div>
              )}
              {!showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={694} y={53} w={170} h={36} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 45 && sf < 60} />
            </div>
          );
        },
      },
      {
        title: 'Submit an Assignment',
        instruction: 'Learners click on an assignment, write their response or upload a file, then hit "Submit".',
        durationInFrames: 220,
        render: (sf) => {
          const textLen = Math.floor(interpolate(sf, [50, 160], [0, 80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const submitted = sf > 175;
          const submitOp = interpolate(sf, [178, 198], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fullText = 'Based on the dataset provided, I analysed the trends over Q1 2026. The data shows a 23% growth in engagement. Key findings include: peak activity on Tuesdays.';
          const cursorX = interpolate(sf, [20, 45], [400, 350], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 45], [300, 280], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/assignments/data-analysis-report">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    {submitted ? (
                      <div style={{ opacity: submitOp, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,154,106,0.1)', border: '2px solid #4a9a6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontStyle: 'italic', color: INK }}>Assignment submitted!</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2 }}>Your educator will review and provide feedback.</div>
                        <Badge label="Submitted · Apr 12" color="green" />
                      </div>
                    ) : (
                      <>
                        <PageHeader title="Data Analysis Report — Week 3" subtitle="Due April 30, 2026 · Advanced Data Analytics" action={<Badge label="Open" color="gold" />} />
                        <div style={{ padding: '20px 32px' }}>
                          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Instructions</div>
                            <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.7, margin: 0 }}>
                              Analyse the provided dataset and submit a brief report covering key trends, growth metrics, and your recommendations.
                            </p>
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Your Response</div>
                          <div style={{ background: '#2a2620', border: `1px solid rgba(200,169,110,0.15)`, borderRadius: 10, padding: '14px 16px', minHeight: 120, fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.7 }}>
                            {fullText.slice(0, textLen)}
                            {textLen < 80 && <span style={{ width: 2, height: 14, background: GOLD, display: 'inline-block', marginLeft: 1 }} />}
                          </div>
                          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                            <GoldButton label="Submit Assignment" glow={textLen > 40} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Browser>
              <Cursor x={cursorX} y={cursorY} clicking={sf > 162 && sf < 180} />
            </div>
          );
        },
      },
      {
        title: 'Review & Grade Submissions',
        instruction: 'As an educator, open the assignment to see all submissions. Click any submission to read it and leave feedback.',
        durationInFrames: 200,
        render: (sf) => {
          const submissionOp = interpolate(sf, [65, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const feedbackOp = interpolate(sf, [130, 155], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 310], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [200, 210], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showDetail = sf > 60;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/assignments/data-analysis-report">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    {showDetail ? (
                      <div style={{ opacity: submissionOp }}>
                        <PageHeader title="Amara Osei's Submission" subtitle="Data Analysis Report — Week 3" action={<Badge label="Pending Review" color="gray" />} />
                        <div style={{ padding: '16px 32px' }}>
                          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '14px 18px', marginBottom: 16, fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.7 }}>
                            Based on the dataset provided, I analysed the trends over Q1 2026. The data shows a 23% growth in engagement. Key findings include: peak activity on Tuesdays.
                          </div>
                          {sf > 125 && (
                            <div style={{ opacity: feedbackOp }}>
                              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Your Feedback</div>
                              <div style={{ background: '#2a2620', border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 10, padding: '12px 16px', fontFamily: 'sans-serif', fontSize: 12, color: INK, lineHeight: 1.7, marginBottom: 12 }}>
                                Great analysis! Your findings on Tuesday engagement are spot on. Try to include a recommendation section next time.
                              </div>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <GoldButton label="Approve" glow small />
                                <GoldButton label="Request Revision" small />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <PageHeader title="Data Analysis Report — Week 3" subtitle="3 submissions" />
                        <DataRow cols={['Learner', 'Submitted', 'Status']} header />
                        {['Amara Osei', 'Priya Nair', 'Tom Bauer'].map((name, i) => (
                          <DataRow key={i} highlight={i === 0} cols={[
                            <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>{name}</span>,
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>Apr 12, 2026</span>,
                            <Badge label={i === 0 ? 'Pending' : i === 1 ? 'Approved' : 'Pending'} color={i === 1 ? 'green' : 'gray'} />,
                          ]} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!showDetail && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={230} y={100} w={700} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 50 && sf < 68} />
            </div>
          );
        },
      },
    ]}
  />
);
