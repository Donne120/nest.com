import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink, Shield, Link2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import type { Certificate } from '../types';

// Nest certificate palette
const INK    = '#0B0A0F';
const PAPER  = '#F7F3EC';   // warm cream card
const CHAR   = '#1f1f24';
const MUTE   = '#5c5764';
const FAINT  = '#9b96a3';
const ACC    = '#7b2d8e';   // brand purple
const GOLD   = '#C98A2E';   // seal gold
const DISP   = "'Cormorant Garamond', Georgia, serif";
const UI     = "'Inter Tight','Inter',system-ui,sans-serif";
const MONO   = "'DM Mono',ui-monospace,monospace";

function LinkedInShareButton({ cert }: { cert: Certificate }) {
  const certUrl = `${window.location.origin}/certificate/${cert.id}`;
  const year = new Date(cert.issued_at).getFullYear();
  const month = new Date(cert.issued_at).getMonth() + 1;
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.module.title,
    organizationName: cert.organization.name,
    issueYear: String(year),
    issueMonth: String(month),
    certUrl,
    certId: cert.cert_number,
  });
  return (
    <a
      href={`https://www.linkedin.com/profile/add?${params}`}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
      style={{ fontFamily: UI, background: '#0077b5' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#006097')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#0077b5')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Add to LinkedIn
      <ExternalLink size={12} />
    </a>
  );
}

const pageBg = `radial-gradient(ellipse 900px 600px at 50% 0%, rgba(74,29,84,0.5), transparent 65%), radial-gradient(ellipse 700px 500px at 50% 100%, rgba(123,45,142,0.25), transparent 60%), ${INK}`;
const ghostBtn: React.CSSProperties = {
  fontFamily: UI, fontSize: 14, color: '#ECE8F0',
  border: '1px solid rgba(255,255,255,0.18)', background: 'transparent',
  padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s',
};

export default function CertificatePage() {
  const { certId } = useParams<{ certId: string }>();
  const { data: cert, isLoading, isError } = useQuery<Certificate>({
    queryKey: ['certificate', certId],
    queryFn: () => api.get(`/certificates/${certId}`).then(r => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <h1 style={{ fontFamily: DISP, fontSize: 28, color: '#fff', marginBottom: 8 }}>Certificate not found</h1>
          <p style={{ fontFamily: UI, color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 24 }}>This certificate may have been removed or the link is invalid.</p>
          <Link to="/" style={{ fontFamily: UI, color: GOLD, textDecoration: 'none', fontSize: 14 }}>← Back to Nest</Link>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Certificate card */}
        <div style={{ background: PAPER, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.8)', border: '1px solid rgba(201,138,46,0.25)' }}>
          {/* Gold top band */}
          <div style={{ height: 6, background: `linear-gradient(90deg, ${GOLD}, #E8B04B, ${GOLD})` }} />

          <div style={{ padding: 'clamp(32px,6vw,56px) clamp(24px,5vw,48px)', textAlign: 'center', position: 'relative' }}>
            {/* Watermark */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, pointerEvents: 'none', userSelect: 'none' }}>
              <Award size={340} style={{ color: ACC }} />
            </div>

            {/* Org brand */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              {cert.organization.logo_url ? (
                <img src={cert.organization.logo_url} alt={cert.organization.name} style={{ height: 40, objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: UI }}>{cert.organization.name[0]}</span>
                  </div>
                  <span style={{ fontFamily: DISP, fontWeight: 600, color: CHAR, fontSize: 22 }}>{cert.organization.name}</span>
                </div>
              )}
            </div>

            <p style={{ position: 'relative', fontFamily: MONO, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.24em', color: GOLD, marginBottom: 18 }}>
              Certificate of Completion
            </p>

            <p style={{ position: 'relative', fontFamily: UI, fontSize: 14, color: MUTE, marginBottom: 12 }}>This is to certify that</p>

            <h1 style={{ position: 'relative', fontFamily: DISP, fontSize: 'clamp(38px,7vw,58px)', fontWeight: 600, color: CHAR, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              {cert.user.full_name}
            </h1>

            <p style={{ position: 'relative', fontFamily: UI, fontSize: 14, color: MUTE, marginBottom: 18 }}>has successfully completed</p>

            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(123,45,142,0.07)', border: '1px solid rgba(123,45,142,0.2)', borderRadius: 100, padding: '10px 20px', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACC }} />
              <span style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, color: ACC }}>{cert.module.title}</span>
            </div>

            <p style={{ position: 'relative', fontFamily: UI, fontSize: 14, color: MUTE, marginBottom: 32 }}>
              Issued on <strong style={{ color: CHAR }}>{issuedDate}</strong>
            </p>

            {/* Gold seal divider */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(31,31,36,0.14))' }} />
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, flexShrink: 0 }}>
                <Award size={20} />
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(31,31,36,0.14))' }} />
            </div>

            {/* Footer: cert number + verify */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={12} style={{ color: '#4f8a2e' }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}>{cert.cert_number}</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}>Verified · Nest</span>
            </div>
          </div>

          <div style={{ height: 6, background: `linear-gradient(90deg, ${GOLD}, #E8B04B, ${GOLD})` }} />
        </div>

        {/* Action bar */}
        <div className="cert-actions" style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <LinkedInShareButton cert={cert} />
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Certificate link copied'))}
            style={ghostBtn} aria-label="Copy certificate link"
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)')}
          >
            <Link2 size={15} /> Copy link
          </button>
          <button
            onClick={() => window.print()}
            style={ghostBtn} aria-label="Print or save certificate as PDF"
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)')}
          >
            <Printer size={15} /> Save as PDF
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 11, color: FAINT, marginTop: 20, letterSpacing: '0.04em' }}>
          Powered by{' '}
          <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Nest</a>
        </p>
      </div>
    </div>
  );
}
