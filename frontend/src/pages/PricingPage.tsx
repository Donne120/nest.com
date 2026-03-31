import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

// Design tokens — exact match with the rest of Nest
const INK   = '#1a1714';
const INK2  = '#6b6460';
const INK3  = '#a09990';
const RULE  = '#d4cdc6';
const SURF  = '#fffcf8';
const BG    = '#f2ede8';
const BG2   = '#e8e2db';
const ACC   = '#c94f2c';
const GO    = '#2a7a4b';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 9,
    currency: 'USD',
    rwf: '13,000',
    description: 'Perfect for individual tutors just getting started.',
    features: [
      'Up to 5 modules',
      'Unlimited students',
      'AI Q&A on videos',
      'Certificates',
      'Email support',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 29,
    currency: 'USD',
    rwf: '42,000',
    description: 'For active educators building a serious learning business.',
    features: [
      'Unlimited modules',
      'Unlimited students',
      'AI Q&A on videos',
      'Certificates',
      'Assignments & quizzes',
      'Analytics dashboard',
      'Priority support',
    ],
    highlight: true,
  },
  {
    key: 'enterprise',
    name: 'School / Institution',
    price: 79,
    currency: 'USD',
    rwf: '115,000',
    description: 'For schools, academies, and institutions with multiple teachers.',
    features: [
      'Everything in Professional',
      'Multiple teacher accounts',
      'Custom branding',
      'Dedicated onboarding',
      'Invoice & PO billing',
      'SLA support',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Syne', 'Inter', sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '72px 24px 48px' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: "'Inconsolata', monospace",
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: ACC, background: 'rgba(201,79,44,0.08)',
          border: '1px solid rgba(201,79,44,0.18)',
          borderRadius: 100, padding: '4px 14px', marginBottom: 20,
        }}>
          Transparent pricing · No hidden fees
        </div>

        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 300, fontStyle: 'italic',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          color: INK, marginBottom: 16,
        }}>
          Teach. Earn.{' '}
          <span style={{ color: ACC, fontWeight: 400, fontStyle: 'normal' }}>Change lives.</span>
        </h1>

        <p style={{ fontSize: 16, color: INK2, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Subscribe once. Keep 100% of what your students pay.
          No commissions. No surprises.
        </p>
      </div>

      {/* ── Plans grid ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 2, background: RULE,
        border: `1px solid ${RULE}`,
        maxWidth: 960, margin: '0 auto 64px',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {PLANS.map(plan => (
          <div
            key={plan.key}
            style={{
              background: plan.highlight ? INK : SURF,
              padding: '36px 32px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {plan.highlight && (
              <div style={{
                fontFamily: "'Inconsolata', monospace",
                fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: ACC, marginBottom: 16,
              }}>
                ★ Most popular
              </div>
            )}

            <div style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: plan.highlight ? 'rgba(255,255,255,0.4)' : INK3,
              marginBottom: 10,
            }}>
              {plan.name}
            </div>

            <div style={{ marginBottom: 4 }}>
              <span style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 48, fontWeight: 400,
                color: plan.highlight ? '#f2ede8' : INK,
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                ${plan.price}
              </span>
              <span style={{
                fontFamily: "'Inconsolata', monospace",
                fontSize: 12, color: plan.highlight ? 'rgba(255,255,255,0.35)' : INK3,
                marginLeft: 6,
              }}>
                /month
              </span>
            </div>

            <div style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, color: plan.highlight ? 'rgba(255,255,255,0.3)' : INK3,
              marginBottom: 20,
            }}>
              ≈ {plan.rwf} RWF/month
            </div>

            <p style={{
              fontSize: 13, lineHeight: 1.55,
              color: plan.highlight ? 'rgba(255,255,255,0.55)' : INK2,
              marginBottom: 28,
            }}>
              {plan.description}
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.75)' : INK2,
                  marginBottom: 10,
                }}>
                  <span style={{ color: plan.highlight ? '#6fcf97' : GO, flexShrink: 0, fontSize: 15 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(`/pay/submit?plan=${plan.key}&amount=${plan.price}&currency=USD`)}
              style={{
                background: plan.highlight ? ACC : 'transparent',
                color: plan.highlight ? '#fff' : INK,
                border: plan.highlight ? 'none' : `1.5px solid ${RULE}`,
                borderRadius: 4,
                padding: '12px 0',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'opacity 0.2s, background 0.2s',
                width: '100%',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.82')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              Get started →
            </button>
          </div>
        ))}
      </div>

      {/* ── How to pay ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 700, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          background: SURF, border: `1px solid ${RULE}`,
          borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 28px', borderBottom: `1px solid ${RULE}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>How to pay</div>
            <div style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 10, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2,
            }}>
              Simple 3-step process · Access in under 24 hours
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            {[
              {
                step: '01',
                title: 'Choose a plan above',
                desc: 'Pick Starter, Professional, or School depending on your needs.',
              },
              {
                step: '02',
                title: 'Send payment via MoMo or bank',
                desc: (
                  <span>
                    MTN MoMo · <strong style={{ color: INK }}>0792104982</strong> · Ngum Dieudonne<br />
                    <span style={{ fontSize: 12, color: INK3 }}>Orange Money & bank transfer also accepted — contact us.</span>
                  </span>
                ),
              },
              {
                step: '03',
                title: 'Submit your payment proof',
                desc: 'Take a screenshot of your MoMo confirmation and upload it. We verify and activate your account within 24 hours.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                display: 'flex', gap: 20, marginBottom: 24,
              }}>
                <div style={{
                  fontFamily: "'Inconsolata', monospace",
                  fontSize: 24, fontWeight: 700, color: BG2,
                  flexShrink: 0, lineHeight: 1.2, minWidth: 32,
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: INK2, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/pay/submit')}
              style={{
                marginTop: 8,
                background: ACC, color: '#fff',
                border: 'none', borderRadius: 4,
                padding: '12px 28px',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.82')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              Submit payment proof →
            </button>

            {token && (
              <button
                onClick={() => navigate('/pay/status')}
                style={{
                  marginTop: 8, marginLeft: 12,
                  background: 'transparent', color: INK2,
                  border: `1px solid ${RULE}`, borderRadius: 4,
                  padding: '12px 24px',
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer', letterSpacing: '0.01em',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
              >
                View my payments
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
