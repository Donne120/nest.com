import { Link } from 'react-router-dom';

// ── EDITABLE CONTENT ────────────────────────────────────────────────────────
const META = {
  company:      'Nest',
  legalName:    'Nest Fledge',
  email:        'ngummdieudonne4@gmail.com',
  website:      'https://nest-com.vercel.app',
  lastUpdated:  'March 31, 2026',
  effectiveDate:'March 31, 2026',
};

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    body: `Nest Fledge ("Nest", "we", "us") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store and protect personal information when you use our platform.

By using Nest, you consent to the data practices described in this policy. If you do not agree, please do not use our Service.`,
  },
  {
    id: 'what-we-collect',
    title: '2. Information We Collect',
    body: `We collect information you provide directly:
• Account data: name, email address, and password (hashed) when you register.
• Profile data: organisation, role, profile picture (optional).
• Payment data: proof-of-payment images and transaction details (we do not store card numbers).
• Course content: videos, materials, and notes you upload as an educator.

We also collect data automatically:
• Usage data: pages visited, videos watched, questions asked, time spent.
• Device data: IP address, browser type, operating system.
• Cookies: session tokens and preference cookies (see Section 7).`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    body: `We use collected information to:
• Provide, operate, and improve the Nest platform.
• Process payments and grant appropriate access to courses.
• Generate AI responses from course transcripts to answer learner questions.
• Send transactional emails (account confirmation, payment status, certificates).
• Analyse aggregate usage patterns to improve the product.
• Comply with legal obligations.

We do not sell your personal data to third parties.`,
  },
  {
    id: 'data-sharing',
    title: '4. Data Sharing',
    body: `We share data only in the following limited cases:

• Service providers: Supabase (database and file storage), SendGrid (transactional email), Render (backend hosting), Vercel (frontend hosting). These processors handle data solely on our behalf under data processing agreements.

• Legal requirements: We may disclose data if required by law, regulation, court order, or to protect the rights and safety of Nest and its users.

• Business transfers: In the event of a merger, acquisition, or sale of assets, user data may be transferred. We will notify users in advance.

We never share your data for advertising or marketing purposes with third parties.`,
  },
  {
    id: 'data-retention',
    title: '5. Data Retention',
    body: `We retain your personal data for as long as your account is active. If you delete your account:
• Account and profile data is deleted within 30 days.
• Uploaded course content is retained for 90 days before permanent deletion (to allow recovery).
• Aggregated, anonymised usage data may be retained indefinitely.
• Legal and payment records may be retained for up to 7 years as required by applicable law.`,
  },
  {
    id: 'security',
    title: '6. Security',
    body: `We implement technical and organisational measures to protect your data:
• Passwords are hashed using bcrypt.
• All data is transmitted over HTTPS/TLS.
• Database access is restricted and authenticated.
• File storage (Supabase) uses signed URLs with expiry.

No system is 100% secure. In the event of a data breach that affects your rights, we will notify you within 72 hours of becoming aware.`,
  },
  {
    id: 'cookies',
    title: '7. Cookies',
    body: `Nest uses the following cookies:
• Session cookies: required for authentication. These expire when you close your browser.
• Preference cookies: store UI settings (e.g., dark mode). No personal data.

We do not use tracking cookies, advertising cookies, or third-party analytics cookies.

You can disable cookies in your browser settings, but this may affect platform functionality.`,
  },
  {
    id: 'rights',
    title: '8. Your Rights',
    body: `Depending on your location, you may have the following rights regarding your personal data:
• Access: request a copy of the data we hold about you.
• Correction: request correction of inaccurate data.
• Deletion: request deletion of your account and personal data.
• Portability: request an export of your data in a machine-readable format.
• Objection: object to processing of your data in certain circumstances.

To exercise any of these rights, email us at ${META.email}. We will respond within 30 days.`,
  },
  {
    id: 'children',
    title: '9. Children\'s Privacy',
    body: `The Nest platform is not intended for users under the age of 16. We do not knowingly collect personal data from children under 16. If we become aware that a user under 16 has registered, we will delete their account promptly.`,
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top and, for material changes, notify you by email or prominent notice on the platform.`,
  },
  {
    id: 'contact',
    title: '11. Contact',
    body: `For privacy questions, data requests, or concerns:\n\nEmail: ${META.email}\nWebsite: ${META.website}`,
  },
];

// ── Tokens ───────────────────────────────────────────────────────────────────
const BG   = '#0a0907';
const INK  = '#f0ebe2';
const INK2 = '#8a8070';
const INK3 = '#4a4238';
const RULE = 'rgba(255,255,255,0.07)';
const GOLD = '#c8a96e';
const DISP = "'Cormorant Garamond', Georgia, serif";
const UI   = "'Syne', sans-serif";
const MONO = "'DM Mono', monospace";

export default function PrivacyPage() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: UI, fontSize: 15, lineHeight: 1.65, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}
      `}</style>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,48px)',
        borderBottom: `1px solid ${RULE}`,
        background: 'rgba(10,9,7,0.95)', backdropFilter: 'blur(20px)',
        fontFamily: UI,
      }}>
        <Link to="/" style={{ fontFamily: MONO, fontSize: 10, color: INK3, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}>
          ← nest.com
        </Link>
        <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Privacy Policy</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, letterSpacing: '0.06em' }}>Updated {META.lastUpdated}</span>
      </header>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ padding: 'clamp(48px,6vw,80px) 0 clamp(32px,4vw,56px)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', color: INK, margin: '0 0 20px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>
            Effective {META.effectiveDate}. Last updated {META.lastUpdated}.
            This policy explains how {META.legalName} handles your personal data.
          </p>
        </div>

        {/* Table of contents */}
        <nav style={{ background: '#161410', border: `1px solid ${RULE}`, borderRadius: 12, padding: '20px 24px', marginBottom: 48 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>Contents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ fontSize: 13, color: INK2, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
              >{s.title}</a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} style={{ borderTop: i === 0 ? `1px solid ${RULE}` : 'none', paddingTop: 40, marginBottom: 40 }}>
            <h2 style={{ fontFamily: DISP, fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400, color: INK, marginBottom: 16 }}>{s.title}</h2>
            <p style={{ fontSize: 14.5, color: INK2, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{s.body}</p>
          </section>
        ))}

        <div style={{ borderTop: `1px solid ${RULE}`, padding: '24px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>© {new Date().getFullYear()} {META.company}. All rights reserved.</span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>{META.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}
