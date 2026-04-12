import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Progress',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Meetings',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', active: true },
];

export const T09_Meetings: React.FC = () => (
  <TutorialTemplate
    moduleNumber={9}
    moduleTitle="1-on-1 Meetings"
    lessonTag="Lesson 09 · Meetings"
    nextLesson="Analytics & Reporting"
    audioSrc="audio/T09_Meetings.mp3"
    steps={[
      {
        title: 'Schedule a Meeting',
        instruction: 'Go to Meetings and click "+ Schedule Meeting" to book a 1-on-1 session with your educator or a learner.',
        durationInFrames: 220,
        render: (sf) => {
          const modalOp = interpolate(sf, [55, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 50], [400, 740], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 50], [200, 68], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showModal = sf > 52;
          const selectedSlot = sf > 120 ? 2 : -1;
          const confirmed = sf > 170;
          const confirmedOp = interpolate(sf, [172, 195], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const SLOTS = ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'];
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/meetings">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Meetings" subtitle="Upcoming & past sessions" action={<GoldButton label="+ Schedule Meeting" glow={!showModal} />} />
                    <div style={{ padding: '16px 32px' }}>
                      {['David Kim — Python Help', 'Office Hours — Open'].map((m, i) => (
                        <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 500 }}>{m}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, marginTop: 3 }}>{['Apr 14, 10:30 AM', 'Apr 16, 02:00 PM'][i]}</div>
                          </div>
                          <Badge label="Upcoming" color="gold" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', opacity: modalOp, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: '#1a1814', border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 14, padding: '28px 32px', width: 440 }}>
                    {confirmed ? (
                      <div style={{ opacity: confirmedOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(74,154,106,0.1)', border: '2px solid #4a9a6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: INK }}>Meeting scheduled!</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2 }}>Apr 15 · 02:00 PM · 30 min</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK2 }}>A calendar invite has been sent.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: INK, marginBottom: 20 }}>Schedule with David Kim</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 10 }}>Pick a date</div>
                        <div style={{ background: '#111008', border: `1px solid ${RULE}`, borderRadius: 8, padding: '14px', marginBottom: 16, textAlign: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2, marginBottom: 8 }}>APRIL 2026</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                              <div key={d} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, color: d === 15 ? BG : INK2, background: d === 15 ? GOLD : 'transparent', cursor: 'pointer', margin: 'auto' }}>{d}</div>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 10 }}>Available slots · Apr 15</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                          {SLOTS.map((s, i) => (
                            <div key={i} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${selectedSlot === i ? GOLD : 'rgba(200,169,110,0.15)'}`, background: selectedSlot === i ? 'rgba(200,169,110,0.1)' : 'transparent', fontFamily: 'monospace', fontSize: 11, color: selectedSlot === i ? INK : INK2, textAlign: 'center', cursor: 'pointer' }}>{s}</div>
                          ))}
                        </div>
                        <GoldButton label="Confirm Meeting" glow={selectedSlot >= 0} />
                      </>
                    )}
                  </div>
                </div>
              )}
              {!showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={694} y={53} w={185} h={36} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 45 && sf < 60} />
            </div>
          );
        },
      },
      {
        title: 'Join a Meeting',
        instruction: 'On the day of your meeting, click "Join" next to any upcoming session. Nest opens a video call directly in your browser.',
        durationInFrames: 200,
        render: (sf) => {
          const joinOp = interpolate(sf, [80, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 65], [500, 800], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 65], [200, 165], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const joined = sf > 75;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url={joined ? 'nest-com.vercel.app/meetings/room/abc123' : 'nest-com.vercel.app/meetings'}>
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    {joined ? (
                      <div style={{ opacity: joinOp, height: '100%', background: '#0d0b08', display: 'flex', flexDirection: 'column' }}>
                        {/* Video call UI */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 16 }}>
                          {[{ name: 'Amara Osei', initials: 'AO' }, { name: 'David Kim', initials: 'DK' }].map((p, i) => (
                            <div key={i} style={{ background: '#1a1814', border: `1px solid ${RULE}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
                              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `rgba(200,169,110,${i === 0 ? 0.15 : 0.08})`, border: `2px solid rgba(200,169,110,${i === 0 ? 0.4 : 0.2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 300, color: GOLD }}>{p.initials}</span>
                              </div>
                              <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK }}>{p.name}</span>
                              {i === 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a9a6a', boxShadow: '0 0 6px #4a9a6a' }} />}
                            </div>
                          ))}
                        </div>
                        {/* Controls */}
                        <div style={{ height: 64, borderTop: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                          {[
                            { icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', label: 'Mute' },
                            { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', label: 'Video' },
                            { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Share' },
                          ].map((ctrl, i) => (
                            <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: CARD, border: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.8"><path d={ctrl.icon}/></svg>
                            </div>
                          ))}
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(196,92,44,0.15)', border: '1px solid rgba(196,92,44,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c45c2c" strokeWidth="1.8"><path d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/></svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <PageHeader title="Meetings" subtitle="1 upcoming today" />
                        <div style={{ padding: '16px 32px' }}>
                          <div style={{ background: 'rgba(200,169,110,0.06)', border: `1px solid rgba(200,169,110,0.25)`, borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK, fontWeight: 600 }}>David Kim — Python Help</div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: GOLD, marginTop: 3 }}>Today · 02:00 PM · Starting in 5 min</div>
                            </div>
                            <GoldButton label="Join" glow />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!joined && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={800} y={145} w={80} h={36} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 60 && sf < 82} />
            </div>
          );
        },
      },
    ]}
  />
);
