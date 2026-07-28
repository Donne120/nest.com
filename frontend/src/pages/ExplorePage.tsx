import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, BookOpen, MessageCircle, Phone, Mail, Globe, X, ArrowLeft, GraduationCap } from 'lucide-react';

// ── Tokens — dark cinematic, matches the landing page ───────────────────────
const INK    = '#0B0A0F';
const INK2   = '#141219';
const RAISE  = '#1C1922';
const HAIR   = 'rgba(255,255,255,0.09)';
const TEXT   = '#F2F0F5';
const MUTE   = '#A8A3B2';
const FAINT  = '#6F6A7A';
const ACC    = '#C77DDA';   // orchid
const GOLD   = '#EBB95C';
const LIME   = '#A9DC6A';
const DISP   = "'Cormorant Garamond', Georgia, serif";
const UI     = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO   = "'DM Mono', ui-monospace, monospace";

const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : '/api';

type PublicCourse = {
  id: string; title: string; thumbnail_url: string | null;
  lesson_count: number; duration_seconds: number;
};
type PublicOrg = {
  name: string; slug: string;
  logo_url: string | null; brand_color: string | null;
  tagline: string | null; description: string | null;
  public_email: string | null; public_phone: string | null;
  public_whatsapp: string | null; website_url: string | null;
  country: string | null; city: string | null;
  course_count: number; courses: PublicCourse[];
  join_token: string | null;
};

function waLink(num: string) { return `https://wa.me/${num.replace(/[^\d]/g, '')}`; }
function fmtDur(s: number) {
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function ExplorePage() {
  const [orgs, setOrgs]     = useState<PublicOrg[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery]   = useState('');
  const [country, setCountry] = useState<string>('all');

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/organizations/public`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: PublicOrg[]) => { if (alive) setOrgs(data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const countries = useMemo(() => {
    const set = new Set<string>();
    (orgs ?? []).forEach(o => o.country && set.add(o.country));
    return Array.from(set).sort();
  }, [orgs]);

  const filtered = useMemo(() => {
    let list = orgs ?? [];
    if (country !== 'all') list = list.filter(o => o.country === country);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q)
        || (o.tagline ?? '').toLowerCase().includes(q)
        || (o.description ?? '').toLowerCase().includes(q)
        || [o.city, o.country].filter(Boolean).join(' ').toLowerCase().includes(q)
        || o.courses.some(c => c.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orgs, query, country]);

  const totalCourses = (orgs ?? []).reduce((n, o) => n + o.course_count, 0);

  return (
    <div style={{ background: INK, color: TEXT, minHeight: '100vh', fontFamily: UI }}>
      {/* Slim top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,44px)',
        borderBottom: `1px solid ${HAIR}`,
        background: 'rgba(11,10,15,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <Link to="/" className="press" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${GOLD}, #C98A2E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: INK, fontFamily: DISP }}>N</div>
          <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: TEXT }}>Nest</span>
        </Link>
        <Link to="/login" className="press" style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: INK, background: GOLD, padding: '9px 18px', borderRadius: 8, textDecoration: 'none' }}>
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(36px,6vw,72px) clamp(16px,4vw,44px) clamp(20px,3vw,32px)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTE, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={13} /> Back to Nest
        </Link>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>
          Find a course · Find a teacher
        </p>
        <h1 style={{ fontFamily: DISP, fontSize: 'clamp(38px,7vw,68px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
          The people already<br /><em style={{ fontStyle: 'italic', color: GOLD }}>teaching on Nest.</em>
        </h1>
        <p style={{ fontFamily: UI, fontSize: 'clamp(16px,2vw,18px)', color: MUTE, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          Real schools, tutors and professors hosting their courses here. Browse what
          they teach, then reach out directly — WhatsApp, call or email — to join.
        </p>
      </section>

      {/* Filter bar */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 15,
        borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}`,
        background: 'rgba(11,10,15,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div className="exp-filters" style={{ maxWidth: 1080, margin: '0 auto', padding: '12px clamp(16px,4vw,44px)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: FAINT, pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search a teacher, subject or course…"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 44,
                paddingLeft: 40, paddingRight: query ? 40 : 16,
                fontSize: 15, fontFamily: 'inherit',
                background: INK2, border: `1px solid ${HAIR}`, borderRadius: 10, color: TEXT, outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(199,125,218,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = HAIR)}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: MUTE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} />
              </button>
            )}
          </div>
          {countries.length > 1 && (
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="exp-country"
              style={{
                minHeight: 44, padding: '0 14px', fontSize: 14, fontFamily: 'inherit',
                background: INK2, border: `1px solid ${HAIR}`, borderRadius: 10, color: TEXT, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <option value="all">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Results */}
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(20px,4vw,36px) clamp(16px,4vw,44px) 64px' }}>
        {orgs && orgs.length > 0 && (
          <p style={{ fontFamily: MONO, fontSize: 11, color: FAINT, letterSpacing: '0.06em', marginBottom: 20 }}>
            {filtered.length} teacher{filtered.length !== 1 ? 's' : ''} · {totalCourses} course{totalCourses !== 1 ? 's' : ''}
          </p>
        )}

        {failed ? (
          <EmptyState title="Couldn't load the directory" body="Please check your connection and try again." />
        ) : !orgs ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: MONO, fontSize: 12, color: FAINT, letterSpacing: '0.1em' }}>Loading…</div>
        ) : orgs.length === 0 ? (
          <EmptyState title="No one's listed yet" body="Teachers are just getting started here. Check back soon — or list your own school." cta />
        ) : filtered.length === 0 ? (
          <EmptyState title={`Nothing matches “${query}”`} body="Try fewer words, or clear the filters." onClear={() => { setQuery(''); setCountry('all'); }} />
        ) : (
          <div className="exp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {filtered.map(org => <CreatorCard key={org.slug} org={org} />)}
          </div>
        )}

        {/* List-your-org CTA */}
        {orgs && orgs.length > 0 && (
          <div style={{ marginTop: 40, textAlign: 'center', borderTop: `1px solid ${HAIR}`, paddingTop: 32 }}>
            <p style={{ fontFamily: UI, fontSize: 15, color: MUTE, marginBottom: 12 }}>Run a school or teach online?</p>
            <Link to="/signup" className="press" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: UI, fontSize: 13.5, fontWeight: 700, color: INK, background: GOLD, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>
              List your courses on Nest →
            </Link>
          </div>
        )}
      </main>

      <style>{`
        .exp-country { appearance:none; -webkit-appearance:none; }
        @media (max-width: 560px) {
          .exp-filters { flex-wrap: wrap; }
          .exp-country { width: 100%; }
          .exp-grid { grid-template-columns: 1fr !important; }
        }
        .press { transition: transform 90ms cubic-bezier(0.16,1,0.3,1); -webkit-tap-highlight-color: transparent; }
        .press:active { transform: scale(0.985); }
        @media (prefers-reduced-motion: reduce) { .press,.press:active { transition:none; transform:none; } }
      `}</style>
    </div>
  );
}

// ── Creator card — profile + what they teach + contact ──────────────────────
function CreatorCard({ org }: { org: PublicOrg }) {
  const accent = org.brand_color && /^#([0-9a-f]{6})$/i.test(org.brand_color) ? org.brand_color : ACC;
  const initials = org.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const place = [org.city, org.country].filter(Boolean).join(', ');
  const shown = org.courses.slice(0, 3);
  const more = org.course_count - shown.length;

  const contactBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: UI, fontSize: 12.5, fontWeight: 600, color: MUTE,
    border: `1px solid ${HAIR}`, minHeight: 38, padding: '0 13px',
    borderRadius: 9, textDecoration: 'none',
  };

  return (
    <article style={{ background: INK2, border: `1px solid ${HAIR}`, borderRadius: 16, padding: '24px 22px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, border: `1px solid ${accent}44`, background: `${accent}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <span style={{ fontFamily: UI, fontSize: 17, fontWeight: 800, color: accent }}>{initials}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: TEXT, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>
          {place && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <MapPin size={11} style={{ color: FAINT }} />
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: FAINT }}>{place}</span>
            </div>
          )}
        </div>
      </div>

      {(org.tagline || org.description) && (
        <p style={{ fontFamily: UI, fontSize: 13.5, color: MUTE, lineHeight: 1.6, marginBottom: 18 }}>
          {org.tagline || org.description}
        </p>
      )}

      {/* What they teach */}
      {shown.length > 0 ? (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: FAINT, marginBottom: 10 }}>Teaching</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shown.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: RAISE, border: `1px solid ${HAIR}`, borderRadius: 10, padding: '9px 12px', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, overflow: 'hidden', background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={14} style={{ color: accent }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: FAINT }}>
                    {c.lesson_count > 0 ? `${c.lesson_count} lesson${c.lesson_count !== 1 ? 's' : ''}` : 'New'}{c.duration_seconds > 0 ? ` · ${fmtDur(c.duration_seconds)}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {more > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTE }}>+ {more} more course{more !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: MONO, fontSize: 11, color: FAINT, marginBottom: 18 }}>Courses coming soon.</p>
      )}

      {/* Actions */}
      <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 16, marginTop: 'auto' }}>
        {/* Primary: enroll — the real front door. Only shown when they've opened one. */}
        {org.join_token && org.course_count > 0 && (
          <Link
            to={`/join/${org.join_token}`}
            className="press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', minHeight: 46, marginBottom: 12,
              background: GOLD, color: INK, border: 'none', borderRadius: 11,
              textDecoration: 'none', fontFamily: UI, fontSize: 14.5, fontWeight: 800,
              boxShadow: '0 8px 22px -10px rgba(235,185,92,0.7)',
            }}
          >
            <GraduationCap size={17} /> Enroll now
          </Link>
        )}

      {/* Contact — direct channels (ask first / message the creator) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {org.public_whatsapp && (
          <a href={waLink(org.public_whatsapp)} target="_blank" rel="noreferrer" className="press" style={{ ...contactBtn, color: INK, background: LIME, border: 'none', fontWeight: 700 }}>
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
        {org.public_phone && (
          <a href={`tel:${org.public_phone.replace(/\s+/g, '')}`} className="press" style={contactBtn}>
            <Phone size={13} /> Call
          </a>
        )}
        {org.public_email && (
          <a href={`mailto:${org.public_email}?subject=${encodeURIComponent('Course enquiry via Nest')}`} className="press" style={contactBtn}>
            <Mail size={13} /> Email
          </a>
        )}
        {org.website_url && (
          <a href={org.website_url} target="_blank" rel="noreferrer" className="press" style={contactBtn}>
            <Globe size={13} /> Visit
          </a>
        )}
        {!org.public_whatsapp && !org.public_phone && !org.public_email && !org.website_url && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT }}>No contact details shared yet.</span>
        )}
      </div>
      </div>
    </article>
  );
}

function EmptyState({ title, body, cta, onClear }: { title: string; body: string; cta?: boolean; onClear?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: INK2, border: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <Search size={22} style={{ color: FAINT }} />
      </div>
      <p style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{title}</p>
      <p style={{ fontFamily: UI, fontSize: 14.5, color: MUTE, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>{body}</p>
      {onClear && (
        <button onClick={onClear} className="press" style={{ marginTop: 18, minHeight: 42, padding: '0 20px', background: GOLD, color: INK, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: UI, fontSize: 13.5, fontWeight: 700 }}>
          Clear filters
        </button>
      )}
      {cta && (
        <Link to="/signup" className="press" style={{ display: 'inline-flex', marginTop: 18, minHeight: 42, alignItems: 'center', padding: '0 20px', background: GOLD, color: INK, borderRadius: 10, textDecoration: 'none', fontFamily: UI, fontSize: 13.5, fontWeight: 700 }}>
          List your courses →
        </Link>
      )}
    </div>
  );
}
