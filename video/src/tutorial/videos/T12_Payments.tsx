import React from 'react';
import { interpolate } from 'remotion';
import { TutorialTemplate } from '../TutorialTemplate';
import { Browser, Sidebar, PageHeader, GoldButton, Input, Cursor, Highlight, Badge, DataRow, GOLD, GOLD2, INK, INK2, CARD, RULE, BG } from '../NestUI';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Courses',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { label: 'Team',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Billing',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', active: true },
];

export const T12_Payments: React.FC = () => (
  <TutorialTemplate
    moduleNumber={12}
    moduleTitle="Payments & Billing"
    lessonTag="Lesson 12 · Payments"
    audioSrc="audio/T12_Payments.mp3"
    steps={[
      {
        title: 'Purchase Learner Access',
        instruction: 'To enrol learners, go to Billing and select a plan. You\'ll pay per learner seat, and they get instant access once approved.',
        durationInFrames: 220,
        render: (sf) => {
          const plansOp = interpolate(sf, [30, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const selectedOp = interpolate(sf, [105, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const selected = sf > 100;
          const cursorX = interpolate(sf, [20, 95], [400, 480], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 95], [200, 265], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const PLANS = [
            { name: 'Starter',      price: '$29/mo',  seats: 'Up to 10 learners',    features: ['Unlimited courses', 'AI Q&A', 'Certificates'] },
            { name: 'Professional', price: '$79/mo',  seats: 'Up to 50 learners',    features: ['Everything in Starter', 'Analytics', 'Meetings', 'Assignments'] },
            { name: 'Enterprise',   price: 'Custom',  seats: 'Unlimited learners',   features: ['Everything in Pro', 'Custom branding', 'SLA', 'Priority support'] },
          ];
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/billing">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Billing & Plans" subtitle="Choose what works for your organisation" />
                    <div style={{ padding: '16px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, opacity: plansOp }}>
                      {PLANS.map((plan, i) => {
                        const isSelected = selected && i === 1;
                        return (
                          <div key={i} style={{
                            background: isSelected ? 'rgba(200,169,110,0.07)' : CARD,
                            border: `1px solid ${isSelected ? GOLD : 'rgba(200,169,110,0.15)'}`,
                            borderRadius: 12, padding: '20px 18px', cursor: 'pointer',
                            opacity: isSelected ? selectedOp + (1 - selectedOp) * 0 : 1,
                            position: 'relative',
                          }}>
                            {i === 1 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: GOLD, borderRadius: 100, padding: '3px 12px', fontFamily: 'monospace', fontSize: 9, color: BG, fontWeight: 700 }}>POPULAR</div>}
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: INK, marginBottom: 4 }}>{plan.name}</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 300, color: GOLD, marginBottom: 4 }}>{plan.price}</div>
                            <div style={{ fontFamily: 'sans-serif', fontSize: 10, color: INK2, marginBottom: 14 }}>{plan.seats}</div>
                            {plan.features.map((f, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: INK2 }}>{f}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: 14 }}>
                              <GoldButton label={i === 2 ? 'Contact Sales' : 'Choose Plan'} glow={isSelected} small />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Browser>
              {sf > 95 && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: selectedOp }}>
                  <Highlight x={407} y={115} w={218} h={310} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 90 && sf < 108} />
            </div>
          );
        },
      },
      {
        title: 'Submit Payment Proof',
        instruction: 'After paying, upload your payment receipt. Your admin reviews it and activates your plan — usually within minutes.',
        durationInFrames: 220,
        render: (sf) => {
          const uploadProgress = interpolate(sf, [80, 160], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const doneOp = interpolate(sf, [163, 185], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorX = interpolate(sf, [20, 65], [400, 480], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const cursorY = interpolate(sf, [20, 65], [200, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const uploading = sf > 65;
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/billing/payment">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Submit Payment" subtitle="Professional Plan · $79/mo" action={<Badge label="Pending" color="gray" />} />
                    <div style={{ padding: '20px 32px' }}>
                      <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 10 }}>Bank Transfer Details</div>
                        {[
                          { label: 'Bank', value: 'First National Bank' },
                          { label: 'Account', value: '1234 5678 9012' },
                          { label: 'Reference', value: 'NEST-PRO-7841' },
                          { label: 'Amount', value: '$79.00' },
                        ].map((row, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 3 ? `1px solid ${RULE}` : 'none' }}>
                            <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2 }}>{row.label}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: INK }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 10 }}>Upload Proof of Payment</div>
                      {uploading ? (
                        <div style={{ border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 10, padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(200,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK }}>payment-receipt.pdf</div>
                              <div style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{uploadProgress < 100 ? `${Math.round(uploadProgress)}%` : 'Uploaded'}</div>
                            </div>
                            {uploadProgress >= 100 && (
                              <div style={{ opacity: doneOp }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a9a6a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                              </div>
                            )}
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 2 }} />
                          </div>
                          {uploadProgress >= 100 && (
                            <div style={{ marginTop: 14, opacity: doneOp }}>
                              <GoldButton label="Submit for Review" glow />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ border: `2px dashed rgba(200,169,110,0.2)`, borderRadius: 10, padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="1.2"><path d="M12 16V8m-4 4l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                          <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK2 }}>Upload receipt (PDF, JPG, PNG)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Browser>
              {!uploading && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                  <Highlight x={257} y={260} w={680} h={100} pulse />
                </div>
              )}
              <Cursor x={cursorX} y={cursorY} clicking={sf > 55 && sf < 72} />
            </div>
          );
        },
      },
      {
        title: 'Billing History',
        instruction: 'Under Billing, the History tab shows all past payments, their status, and lets you download invoices for your records.',
        durationInFrames: 180,
        render: (sf) => {
          const tableOp = interpolate(sf, [30, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const highlightOp = interpolate(sf, [80, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div style={{ position: 'relative' }}>
              <Browser url="nest-com.vercel.app/billing/history">
                <div style={{ display: 'flex', height: 500 }}>
                  <Sidebar items={NAV_ITEMS} />
                  <div style={{ flex: 1 }}>
                    <PageHeader title="Billing History" subtitle="All transactions" action={<GoldButton label="Download All" small />} />
                    <div style={{ display: 'flex', borderBottom: `1px solid ${RULE}`, padding: '0 32px' }}>
                      {['Current Plan', 'History', 'Invoices'].map((tab, i) => (
                        <div key={i} style={{ padding: '10px 16px', fontFamily: 'sans-serif', fontSize: 12, color: i === 1 ? GOLD : INK2, borderBottom: i === 1 ? `2px solid ${GOLD}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>{tab}</div>
                      ))}
                    </div>
                    <div style={{ opacity: tableOp }}>
                      <DataRow cols={['Date', 'Plan', 'Amount', 'Status', '']} header />
                      {[
                        { date: 'Apr 1, 2026',  plan: 'Professional',  amount: '$79.00', status: 'Paid' },
                        { date: 'Mar 1, 2026',  plan: 'Professional',  amount: '$79.00', status: 'Paid' },
                        { date: 'Feb 1, 2026',  plan: 'Starter',       amount: '$29.00', status: 'Paid' },
                        { date: 'Jan 1, 2026',  plan: 'Starter',       amount: '$29.00', status: 'Paid' },
                      ].map((row, i) => (
                        <DataRow key={i} highlight={i === 0 && sf > 75} cols={[
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: INK2 }}>{row.date}</span>,
                          <span style={{ fontFamily: 'sans-serif', fontSize: 12, color: INK }}>{row.plan}</span>,
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: GOLD }}>{row.amount}</span>,
                          <Badge label={row.status} color="green" />,
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: GOLD, cursor: 'pointer' }}>PDF ↓</span>,
                        ]} />
                      ))}
                    </div>
                  </div>
                </div>
              </Browser>
              {sf > 75 && (
                <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', opacity: highlightOp }}>
                  <Highlight x={230} y={100} w={700} h={36} pulse />
                </div>
              )}
            </div>
          );
        },
      },
    ]}
  />
);
