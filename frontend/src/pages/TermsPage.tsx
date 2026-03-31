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
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: `By accessing or using the Nest platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms apply to all users of the Service, including educators who create content and learners who access it. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    body: `Nest is an AI-powered education platform that enables educators and organisations to create video courses, run live sessions, issue certificates, and manage learner progress. Learners can ask timestamped questions answered by AI using actual course transcripts.

The Service is provided on a subscription basis. Features available depend on your subscription tier (Free, Pro, Business, Enterprise).`,
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    body: `You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.

You must be at least 16 years of age to use the Service. By creating an account, you represent that you meet this requirement.

You may not share your account credentials with others. Each account is for a single individual. Organisations wishing to enrol multiple users must do so through appropriate multi-seat plans.`,
  },
  {
    id: 'content',
    title: '4. Content & Intellectual Property',
    body: `Educators retain full ownership of all content they upload to the platform ("Educator Content"), including videos, materials, and course assets. By uploading Educator Content, you grant Nest a limited, non-exclusive licence to host, process, and display your content to enrolled learners.

Nest retains all rights to the platform's software, design, and AI functionality. You may not copy, reverse-engineer, or redistribute any part of the Nest platform without prior written consent.

Generated AI responses are derived from Educator Content. Educators are responsible for ensuring uploaded content does not infringe third-party intellectual property rights.`,
  },
  {
    id: 'prohibited',
    title: '5. Prohibited Uses',
    body: `You agree not to:
• Upload content that is illegal, harmful, abusive, defamatory, or violates any third-party rights.
• Use the Service to distribute spam, malware, or phishing material.
• Attempt to gain unauthorised access to other users' accounts or the platform's systems.
• Use automated scraping or bulk data extraction tools on the Service.
• Resell, sublicense, or commercially exploit any AI-generated responses from the platform.
• Use the Service to harass, bully, or intimidate other users.

Violation of these terms may result in immediate account suspension or termination.`,
  },
  {
    id: 'payments',
    title: '6. Payments & Subscriptions',
    body: `Subscription fees are billed monthly or annually as selected at sign-up. Nest currently accepts manual proof-of-payment via mobile money (MoMo) and bank transfer. Upon payment confirmation by our team, access is granted within one business day.

All fees are non-refundable except where required by applicable law. We reserve the right to change pricing with 30 days' notice to existing subscribers.

Free tier users may be subject to content or learner limits as described on our Pricing page.`,
  },
  {
    id: 'privacy-ref',
    title: '7. Privacy',
    body: `Your use of the Service is also governed by our Privacy Policy, available at nest-com.vercel.app/privacy. By using the Service, you consent to the collection and use of data as described therein.`,
  },
  {
    id: 'disclaimer',
    title: '8. Disclaimers & Limitation of Liability',
    body: `The Service is provided "as is" and "as available" without warranties of any kind, express or implied. Nest does not warrant that the Service will be uninterrupted, error-free, or that AI responses will always be accurate.

To the fullest extent permitted by law, Nest shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability to you shall not exceed the fees paid by you in the three months preceding the claim.`,
  },
  {
    id: 'termination',
    title: '9. Termination',
    body: `We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may close your account at any time from your profile settings. Upon termination, your access to courses and data may be revoked. Educators should download their content before requesting account deletion.`,
  },
  {
    id: 'governing',
    title: '10. Governing Law',
    body: `These Terms are governed by and construed in accordance with applicable law. Any disputes shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to binding arbitration.`,
  },
  {
    id: 'contact',
    title: '11. Contact',
    body: `For questions about these Terms, contact us at:\n\nEmail: ${META.email}\nWebsite: ${META.website}`,
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

export default function TermsPage() {
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
        <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Terms of Service</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, letterSpacing: '0.06em' }}>Updated {META.lastUpdated}</span>
      </header>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ padding: 'clamp(48px,6vw,80px) 0 clamp(32px,4vw,56px)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', color: INK, margin: '0 0 20px' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>
            Effective {META.effectiveDate}. Last updated {META.lastUpdated}.
            These Terms govern your access to and use of the {META.legalName} platform.
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
