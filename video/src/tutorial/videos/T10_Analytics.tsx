import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Cursor, Highlight, Badge, DataRow, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Team',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: true },
];

const BAR_DATA = [
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 78 },
  { label: 'Wed', value: 62 },
  { label: 'Thu', value: 91 },
  { label: 'Fri', value: 55 },
  { label: 'Sat', value: 30 },
  { label: 'Sun', value: 18 },
];

export const T10_Analytics: React.FC = () => (
  <TutorialTemplate
    moduleNumber={10}
    moduleTitle="Analytics & Reporting"
    lessonTag="Lesson 10 · Analytics"
    nextLesson="Certificates"
    audioSrc="audio/T10_Analytics.mp3"
    steps={[
      {
        title: 'Organisation Analytics Overview',
        instruction: 'Go to Analytics to see a full picture: video views, learner activity, top courses, and completion rates across your organisation.',
        durationInFrames: 220,
        render: (sf) => {
          const statsOp = interpolate(sf, [20, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const chartOp = interpolate(sf, [55, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const tableOp = interpolate(sf, [100, 135], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const barGrow = interpolate(sf, [58, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/analytics">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1, overflowY: 'hidden' }}>
                    <PageHeader title="Analytics" subtitle="Last 30 days · Nest Academy" action={<GoldButton label="Export CSV" small />} />
                    <div style={{ padding: '16px 32px' }}>
                      {/* Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20, opacity: statsOp }}>
                        {[
                          { label: 'Total Views',   value: '1,248', delta: '+18%' },
                          { label: 'Active Learners', value: '32',   delta: '+4' },
                          { label: 'Avg Completion', value: '67%',   delta: '+5%' },
                          { label: 'Quizzes Taken',  value: '156',   delta: '+22' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 300, color: GOLD }}>{s.value}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a9a6a', marginTop: 2 }}>{s.delta} vs last period</div>
                          </div>
                        ))}
                      </div>
                      {/* Bar chart */}
                      <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16, opacity: chartOp }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 14 }}>Daily Video Views</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                          {BAR_DATA.map((b, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: '100%', height: b.value * 0.7 * barGrow, background: `linear-gradient(to top, ${GOLD}, ${GOLD2})`, borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                              <span style={{ fontFamily: 'monospace', fontSize: 9, color: INK2 }}>{b.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Top courses table */}
                      <div style={{ opacity: tableOp }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>Top Courses by Views</div>
                        <DataRow cols={['Course', 'Views', 'Completion', 'Learners']} header />
                        {[
                          ['Introduction to Data Science', '542', '72%', '18'],
                          ['Python for Beginners',          '384', '65%', '12'],
                          ['Machine Learning Basics',        '322', '54%', '8'],
                        ].map((row, i) => (
                          <DataRow key={i} cols={row.map((v, j) => (
                            <span style={{ fontFamily: j === 0 ? 'sans-serif' : 'monospace', fontSize: j === 0 ? 12 : 10, color: j === 2 ? '#4a9a6a' : INK }}>{v}</span>
                          ))} />
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
        title: 'Course-Level Insights',
        instruction: 'Click on any course in the analytics table to drill down — see which videos are most watched and where learners drop off.',
        durationInFrames: 200,
        render: (sf) => {
          const contentOp = interpolate(sf, [65, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 55], [400, 310], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 55], [300, 345], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const drillDown = sf > 60;
          const highlightRow = interpolate(sf, [80, 115], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url={drillDown ? 'nest-com.vercel.app/analytics/intro-data-science' : 'nest-com.vercel.app/analytics'}>
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1, opacity: drillDown ? contentOp : 1 }}>
                    <PageHeader title="Introduction to Data Science" subtitle="Course analytics · Last 30 days" action={<Badge label="72% completion" color="gold" />} />
                    <div style={{ padding: '16px 32px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 10 }}>Video Performance</div>
                      <DataRow cols={['Video', 'Views', 'Avg Watch', 'Drop-off']} header />
                      {[
                        { title: 'What is Data Science?',       views: '142', watch: '95%', drop: '5%',  hot: true },
                        { title: 'Types of Data',               views: '138', watch: '88%', drop: '12%', hot: false },
                        { title: 'Introduction to Python',       views: '121', watch: '74%', drop: '26%', hot: false },
                        { title: 'Pandas & DataFrames',          views: '98',  watch: '62%', drop: '38%', hot: false },
                        { title: 'Data Visualisation',           views: '76',  watch: '55%', drop: '45%', hot: false },
                      ].map((v, i) => (
                        <DataRow key={i} highlight={i === 0 && sf > 80} cols={[
                          <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK }}>{v.title}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK }}>{v.views}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a9a6a' }}>{v.watch}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: parseFloat(v.drop) > 30 ? '#c45c2c' : INK2 }}>{v.drop}</span>,
                        ]} />
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {!drillDown && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={230} y={328} w={700} h={36} pulse />
                </div>
              )}
              {drillDown && sf > 80 && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: highlightRow }}>
                  <Highlight x={230} y={100} w={700} h={34} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 48 && sf < 68} />
            </div>
          );
        },
      },
    ]}
  />
);
