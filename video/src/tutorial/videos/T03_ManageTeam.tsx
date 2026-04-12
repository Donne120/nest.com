import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, DataRow, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'My Courses', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Team',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', active: true },
  { label: 'Settings',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const MEMBERS = [
  { name: 'Amara Osei', email: 'amara@nestacademy.com', role: 'Learner',  status: 'active' },
  { name: 'David Kim',  email: 'david@nestacademy.com', role: 'Educator', status: 'active' },
  { name: 'Priya Nair', email: 'priya@nestacademy.com', role: 'Learner',  status: 'active' },
  { name: 'Tom Bauer',  email: 'tom@nestacademy.com',   role: 'Learner',  status: 'pending' },
];

export const T03_ManageTeam: React.FC = () => (
  <TutorialTemplate
    moduleNumber={3}
    moduleTitle="Managing Your Team"
    lessonTag="Lesson 03 · Team Management"
    nextLesson="Creating Courses & Videos"
    audioSrc="audio/T03_ManageTeam.mp3"
    steps={[
      {
        title: 'View Your Team',
        instruction: 'Click "Team" in the sidebar to see all members of your organisation — learners, educators, and owners.',
        durationInFrames: 180,
        render: (sf) => {
          const listOp = interpolate(sf, [70, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [250, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const clicked = sf > 60;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/team">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Team" subtitle="4 members" action={<Badge label="4 members" color="gold" />} />
                    <div style={{ opacity: clicked ? listOp : 0 }}>
                      <DataRow cols={['Name', 'Email', 'Role', 'Status']} header />
                      {MEMBERS.map((m, i) => (
                        <DataRow key={i} cols={[
                          <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>{m.name}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{m.email}</span>,
                          <Badge label={m.role} color={m.role === 'Educator' ? 'gold' : 'gray'} />,
                          <Badge label={m.status} color={m.status === 'active' ? 'green' : 'gray'} />,
                        ]} />
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {!clicked && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={10} y={200} w={200} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 50 && sf < 68} />
            </div>
          );
        },
      },
      {
        title: 'Invite a New Member',
        instruction: 'Click "Invite Member" and enter their email address. They\'ll receive an invitation link to join your organisation.',
        durationInFrames: 220,
        render: (sf) => {
          const modalOp = interpolate(sf, [55, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const typedLen = Math.floor(interpolate(sf, [90, 150], [0, 25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
          const fullEmail = 'sarah@nestacademy.com';
          const typedEmail = fullEmail.slice(0, typedLen);
          const cursorX = interpolate(sf, [20, 50], [700, 800], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 50], [100, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const sentOp = interpolate(sf, [165, 185], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showModal = sf > 55;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/team">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Team" subtitle="4 members" action={<GoldButton label="+ Invite Member" glow />} />
                    <div>
                      <DataRow cols={['Name', 'Email', 'Role', 'Status']} header />
                      {MEMBERS.map((m, i) => (
                        <DataRow key={i} cols={[
                          <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>{m.name}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{m.email}</span>,
                          <Badge label={m.role} color={m.role === 'Educator' ? 'gold' : 'gray'} />,
                          <Badge label={m.status} color={m.status === 'active' ? 'green' : 'gray'} />,
                        ]} />
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {/* Invite modal */}
              {showModal && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.6)', opacity: modalOp,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{ background: '#1a1814', border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 14, padding: '28px 32px', width: 380 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: INK, marginBottom: 20 }}>Invite to Nest Academy</div>
                    <Input label="Email Address" value={typedEmail} focused={sf > 85 && sf < 165} placeholder="colleague@company.com" />
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Role</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Learner', 'Educator'].map((r, i) => (
                          <div key={i} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${i === 0 ? GOLD : 'rgba(200,169,110,0.2)'}`, background: i === 0 ? 'rgba(200,169,110,0.1)' : 'transparent', fontFamily: 'sans-serif', fontSize: 12, color: i === 0 ? GOLD : INK2, textAlign: 'center', cursor: 'pointer' }}>{r}</div>
                        ))}
                      </div>
                    </div>
                    {sf > 160 ? (
                      <div style={{ opacity: sentOp, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(74,154,106,0.1)', border: '1px solid rgba(74,154,106,0.3)', borderRadius: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#4a9a6a' }}>Invitation sent to {fullEmail}</span>
                      </div>
                    ) : (
                      <GoldButton label="Send Invitation" glow={typedLen === 25} />
                    )}
                  </div>
                </div>
              )}
              {!showModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={764} y={53} w={160} h={36} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 45 && sf < 60} />
            </div>
          );
        },
      },
      {
        title: 'Change a Member\'s Role',
        instruction: 'Click on any member to open their profile. You can change their role between Learner, Educator, or Owner.',
        durationInFrames: 200,
        render: (sf) => {
          const profileOp = interpolate(sf, [65, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 310], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [200, 165], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const roleChanged = sf > 120;
          const roleOp = interpolate(sf, [120, 145], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const showProfile = sf > 60;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/team">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    {showProfile ? (
                      <div style={{ opacity: profileOp }}>
                        <PageHeader title="Amara Osei" subtitle="Member since Jan 2025" action={<Badge label="Active" color="green" />} />
                        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 12 }}>Role</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['Learner', 'Educator', 'Owner'].map((r, i) => {
                                const isSelected = roleChanged ? (i === 1) : (i === 0);
                                return (
                                  <div key={i} style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${isSelected ? GOLD : 'rgba(200,169,110,0.15)'}`, background: isSelected ? 'rgba(200,169,110,0.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${isSelected ? GOLD : INK2}`, background: isSelected ? GOLD : 'transparent' }} />
                                    <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: isSelected ? INK : INK2 }}>{r}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {roleChanged && (
                              <div style={{ opacity: roleOp, marginTop: 14 }}>
                                <GoldButton label="Save Role" glow small />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK2, marginBottom: 12 }}>Enrolled Courses</div>
                            {['Introduction to Data Science', 'Python for Beginners'].map((c, i) => (
                              <div key={i} style={{ padding: '8px 12px', background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, marginBottom: 6, fontFamily: 'sans-serif', fontSize: 11, color: INK2 }}>{c}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <PageHeader title="Team" subtitle="4 members" />
                        <DataRow cols={['Name', 'Email', 'Role', 'Status']} header />
                        {MEMBERS.map((m, i) => (
                          <DataRow key={i} highlight={i === 0} cols={[
                            <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK, fontWeight: 500 }}>{m.name}</span>,
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{m.email}</span>,
                            <Badge label={m.role} color={m.role === 'Educator' ? 'gold' : 'gray'} />,
                            <Badge label={m.status} color={m.status === 'active' ? 'green' : 'gray'} />,
                          ]} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Browser>
              {!showProfile && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={230} y={100} w={700} h={36} pulse />
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
