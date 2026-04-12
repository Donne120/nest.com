import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Progress',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Certificates', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', active: true },
];

export const T11_Certificates: React.FC = () => (
  <TutorialTemplate
    moduleNumber={11}
    moduleTitle="Certificates"
    lessonTag="Lesson 11 · Certificates"
    nextLesson="Payments & Billing"
    audioSrc="audio/T11_Certificates.mp3"
    steps={[
      {
        title: 'Earn a Certificate',
        instruction: 'Complete all videos in a course and pass any quizzes. Nest automatically issues you a certificate.',
        durationInFrames: 220,
        render: (sf) => {
          const certOp = interpolate(sf, [60, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [250, 405], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const clicked = sf > 55;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/certificates">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="My Certificates" subtitle="Certificates you've earned" />
                    {clicked ? (
                      <div style={{ padding: '24px 32px', opacity: certOp }}>
                        {/* Certificate card */}
                        <div style={{
                          background: 'linear-gradient(135deg, #1a1610 0%, #0f0d08 100%)',
                          border: `1px solid rgba(200,169,110,0.35)`,
                          borderRadius: 16, padding: '32px 36px',
                          position: 'relative', overflow: 'hidden',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}>
                          {/* Decorative corner */}
                          <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle at top right, rgba(200,169,110,0.08), transparent 70%)' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid rgba(200,169,110,0.5)`, background: 'rgba(200,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'Georgia', fontSize: 16, fontWeight: 700, color: GOLD }}>N</span>
                              </div>
                              <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontStyle: 'italic', color: INK2 }}>Nest Academy</span>
                            </div>
                            <Badge label="Verified" color="gold" />
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Certificate of Completion</div>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 6 }}>Introduction to Data Science</div>
                          <div style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2, marginBottom: 24 }}>Awarded to <strong style={{ color: INK }}>Amara Osei</strong> · Completed April 12, 2026</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <GoldButton label="Download PDF" glow small />
                            <GoldButton label="Share" small />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.2"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                        <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: INK2 }}>No certificates yet — complete a course to earn one</span>
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!clicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={10} y={385} w={200} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 48 && sf < 63} />
            </div>
          );
        },
      },
      {
        title: 'Download or Share Your Certificate',
        instruction: 'Click "Download PDF" to save your certificate, or "Share" to get a public link you can add to your LinkedIn profile.',
        durationInFrames: 200,
        render: (sf) => {
          const downloadOp = interpolate(sf, [85, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 65], [400, 305], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 65], [200, 375], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const downloaded = sf > 80;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/certificates/intro-data-science">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Certificate" subtitle="Introduction to Data Science" />
                    <div style={{ padding: '24px 32px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #1a1610 0%, #0f0d08 100%)', border: `1px solid rgba(200,169,110,0.35)`, borderRadius: 16, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'radial-gradient(circle at top right, rgba(200,169,110,0.08), transparent 70%)' }} />
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Certificate of Completion</div>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 4 }}>Introduction to Data Science</div>
                        <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2, marginBottom: 20 }}>Awarded to <strong style={{ color: INK }}>Amara Osei</strong> · April 12, 2026</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <GoldButton label="Download PDF" glow small />
                          <GoldButton label="Share Link" small />
                          {downloaded && (
                            <div style={{ opacity: downloadOp, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                              <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#4a9a6a' }}>Downloading…</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* LinkedIn tip */}
                      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(100,140,200,0.06)', border: '1px solid rgba(100,140,200,0.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#6a8fc8"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
                        <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#6a8fc8' }}>Use "Share Link" to add this certificate to your LinkedIn profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              {!downloaded && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={267} y={357} w={140} h={32} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 60 && sf < 85} />
            </div>
          );
        },
      },
    ]}
  />
);
