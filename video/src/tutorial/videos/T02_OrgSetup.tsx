import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',     icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses',    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Progress',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Settings',      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', active: true },
];

export const T02_OrgSetup: React.FC = () => (
  <TutorialTemplate
    moduleNumber={2}
    moduleTitle="Setting Up Your Organisation"
    lessonTag="Lesson 02 · Organisation Setup"
    nextLesson="Managing Your Team"
    audioSrc="audio/T02_OrgSetup.mp3"
    steps={[
      {
        title: 'Go to Settings',
        instruction: 'From the sidebar, click "Settings" to access your organisation configuration.',
        durationInFrames: 180,
        render: (sf) => {
          const cursorX = interpolate(sf, [20, 60], [400, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 60], [300, 330], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const highlightOp = interpolate(sf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const contentOp = interpolate(sf, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const clicked = sf > 65;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/settings">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1, opacity: clicked ? contentOp : 1 }}>
                    <PageHeader title="Organisation Settings" subtitle="Manage your Nest workspace" />
                    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '20px 24px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 14 }}>General</div>
                        <Input label="Organisation Name" value="Nest Academy" />
                        <Input label="Website" value="nestacademy.com" />
                        <Input label="Industry" value="Education & Training" />
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              {!clicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, opacity: highlightOp, pointerEvents: 'none' }}>
                  <Highlight x={10} y={310} w={200} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 60 && sf < 75} />
            </div>
          );
        },
      },
      {
        title: 'Upload Your Logo',
        instruction: 'Click the logo area to upload your organisation\'s logo. This appears on all learner-facing pages.',
        durationInFrames: 200,
        render: (sf) => {
          const uploadOp = interpolate(sf, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 310], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [200, 195], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const uploaded = sf > 70;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/settings/branding">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Branding" subtitle="Customise how Nest looks for your learners" />
                    <div style={{ padding: '24px 32px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 100, height: 100, borderRadius: 16,
                          border: `2px dashed ${uploaded ? GOLD : 'rgba(200,169,110,0.3)'}`,
                          background: uploaded ? 'rgba(200,169,110,0.1)' : 'rgba(200,169,110,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}>
                          {uploaded ? (
                            <div style={{ opacity: uploadOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontFamily: 'Georgia', fontSize: 36, fontWeight: 700, color: GOLD }}>N</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.5"><path d="M12 16V8m-4 4l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                              <span style={{ fontFamily: 'sans-serif', fontSize: 9, color: INK2 }}>Upload</span>
                            </div>
                          )}
                        </div>
                        {uploaded && (
                          <div style={{ opacity: uploadOp }}>
                            <Badge label="Logo saved" color="green" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 4 }}>Brand Colour</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {['#c8a96e', '#6a8fc8', '#64b482', '#be6e64', '#9b7ecb'].map((c, i) => (
                            <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: i === 0 ? `2px solid ${INK}` : '2px solid transparent', cursor: 'pointer' }} />
                          ))}
                        </div>
                        <Input label="Custom hex" value="#c8a96e" />
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              {!uploaded && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={257} y={155} w={120} h={120} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 50 && sf < 75} />
            </div>
          );
        },
      },
      {
        title: 'Save Your Settings',
        instruction: 'Click "Save Changes" to apply your settings. Changes take effect immediately across your workspace.',
        durationInFrames: 180,
        render: (sf) => {
          const saved = sf > 80;
          const savedOp = interpolate(sf, [80, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 70], [300, 450], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 70], [300, 430], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/settings">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Organisation Settings" subtitle="Manage your Nest workspace" />
                    <div style={{ padding: '24px 32px' }}>
                      <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
                        <Input label="Organisation Name" value="Nest Academy" />
                        <Input label="Website" value="nestacademy.com" />
                        <Input label="Industry" value="Education & Training" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
                        {saved && (
                          <div style={{ opacity: savedOp, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#4a9a6a' }}>Settings saved</span>
                          </div>
                        )}
                        <GoldButton label="Save Changes" glow={!saved} />
                      </div>
                    </div>
                  </div>
                </div>
              </Browser>
              {!saved && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={780} y={390} w={140} h={38} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 72 && sf < 88} />
            </div>
          );
        },
      },
    ]}
  />
);
