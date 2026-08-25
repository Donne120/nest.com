import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import { applyBrandColor } from '../hooks/useBrandColor';

// Public shareable-clip page. NO auth. Anyone with the link watches the lesson
// free; "Ask your own question" is the sign-up wall, routing a newcomer into the
// tutor/school's space (with a graceful "or explore all of Nest" choice).

const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api';

const FLOOR = '#F6F4FD', SURF = '#FFFFFF', INK = '#1E1B2E', MUTE = '#6E6A85';
const ACC = '#6D4AE0', RULE = 'rgba(30,27,46,0.10)';
const DISP = "'Fraunces', Georgia, serif";
const UI = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

interface Clip {
  video_id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds: number;
  module_title?: string | null;
  org_name: string;
  org_slug?: string | null;
  org_logo_url?: string | null;
  org_brand_color?: string | null;
  join_token?: string | null;
}

export default function ClipPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [clip, setClip] = useState<Clip | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    // Retry on network errors (Render cold-start) — a shared link must be patient.
    async function load(attempt = 0) {
      try {
        const res = await fetch(`${API_BASE}/public/clip/${videoId}`, {
          headers: { Accept: 'application/json' },
        });
        if (!alive) return;
        if (res.status === 404) { setState('notfound'); return; }
        if (!res.ok) throw new Error('bad status');
        const data: Clip = await res.json();
        if (!alive) return;
        applyBrandColor(data.org_brand_color);
        setClip(data);
        setState('ok');
      } catch {
        if (!alive) return;
        if (attempt < 3) { setTimeout(() => load(attempt + 1), 1500); return; }
        setState('error');
      }
    }
    load();
    return () => { alive = false; };
  }, [videoId]);

  const loggedIn = (() => {
    try { return !!JSON.parse(localStorage.getItem('nest_auth') || '{}')?.state?.user; }
    catch { return false; }
  })();

  const onAsk = () => {
    if (loggedIn) { navigate('/login'); return; }        // logged in elsewhere: send to app
    setAskOpen(true);                                     // newcomer: show the join choice
  };

  if (state === 'loading') {
    return <Centered><Spinner /><p style={{ color: MUTE, marginTop: 16, fontFamily: UI }}>Loading the lesson…</p></Centered>;
  }
  if (state === 'notfound') {
    return <Centered>
      <h1 style={{ fontFamily: DISP, fontSize: 26, color: INK }}>This lesson isn't shared</h1>
      <p style={{ color: MUTE, marginTop: 8, fontFamily: UI }}>The link may be old, or the tutor turned off sharing.</p>
      <Link to="/explore" style={cta(true)}>Explore courses on Nest →</Link>
    </Centered>;
  }
  if (state === 'error' || !clip) {
    return <Centered>
      <h1 style={{ fontFamily: DISP, fontSize: 24, color: INK }}>Couldn't load the lesson</h1>
      <p style={{ color: MUTE, marginTop: 8, fontFamily: UI }}>The server may be waking up — try refreshing in a moment.</p>
      <button onClick={() => location.reload()} style={cta(true)}>Refresh</button>
    </Centered>;
  }

  return (
    <div style={{ minHeight: '100dvh', background: FLOOR, fontFamily: UI, color: INK }}>
      {/* Top bar — the space's identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px clamp(16px,4vw,32px)', borderBottom: `1px solid ${RULE}`, background: SURF, position: 'sticky', top: 0, zIndex: 10 }}>
        {clip.org_logo_url
          ? <img src={clip.org_logo_url} alt={clip.org_name} style={{ height: 30, width: 'auto', objectFit: 'contain', maxWidth: 130 }} />
          : <span style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600, color: ACC }}>{clip.org_name}</span>}
        <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTE }}>
          on Nest · answers back
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(16px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACC, marginBottom: 8 }}>
          A lesson from {clip.org_name}
        </p>
        <h1 style={{ fontFamily: DISP, fontWeight: 500, fontSize: 'clamp(24px,4.5vw,38px)', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: clip.module_title ? 4 : 20 }}>
          {clip.title}
        </h1>
        {clip.module_title && <p style={{ color: MUTE, marginBottom: 20 }}>{clip.module_title}</p>}

        {/* The video */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${RULE}`, background: '#000', boxShadow: '0 24px 60px -34px rgba(90,56,199,0.4)' }}>
          <VideoPlayer videoUrl={clip.video_url} videoId={clip.video_id} markers={[]} showIntro={false} />
        </div>

        {/* The hook — ask your own question */}
        <div style={{ marginTop: 26, background: SURF, border: `1px solid ${RULE}`, borderRadius: 18, padding: 'clamp(20px,4vw,30px)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: DISP, fontWeight: 500, fontSize: 'clamp(20px,3.4vw,28px)', marginBottom: 8 }}>
            Stuck on something? <span style={{ color: ACC, fontStyle: 'italic' }}>Ask this lesson.</span>
          </h2>
          <p style={{ color: MUTE, maxWidth: 460, margin: '0 auto 20px', fontSize: 15.5, lineHeight: 1.6 }}>
            Tap the exact second you're confused and get an answer from this lesson — not a random web search. That's Nest.
          </p>
          <button onClick={onAsk} style={cta(false)}>Ask your own question →</button>
        </div>
      </div>

      {/* Sign-up choice sheet (newcomer): join this space OR explore all of Nest */}
      {askOpen && (
        <div
          onClick={() => setAskOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,46,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: SURF, width: '100%', maxWidth: 460, borderRadius: '22px 22px 0 0', padding: 'clamp(22px,5vw,32px)', boxShadow: '0 -20px 60px rgba(30,27,46,0.3)' }}>
            <h3 style={{ fontFamily: DISP, fontWeight: 500, fontSize: 24, marginBottom: 6 }}>Create a free account to ask</h3>
            <p style={{ color: MUTE, fontSize: 14.5, lineHeight: 1.6, marginBottom: 22 }}>
              You're watching a lesson from <strong style={{ color: INK }}>{clip.org_name}</strong>. Choose where to start:
            </p>
            {clip.join_token && (
              <Link to={`/join/${clip.join_token}`} style={{ ...cta(false), display: 'block', textAlign: 'center', marginBottom: 12 }}>
                Join {clip.org_name}
              </Link>
            )}
            <Link to="/explore" style={{ ...cta(true), display: 'block', textAlign: 'center' }}>
              Explore all courses on Nest
            </Link>
            <button onClick={() => setAskOpen(false)} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: MUTE, fontFamily: UI, fontSize: 14, cursor: 'pointer' }}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── little helpers ──
function cta(secondary: boolean): React.CSSProperties {
  return secondary
    ? { fontFamily: UI, fontWeight: 700, fontSize: 15, color: ACC, background: '#F1ECFD', border: `1px solid ${ACC}33`, borderRadius: 12, padding: '13px 26px', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }
    : { fontFamily: UI, fontWeight: 700, fontSize: 15, color: '#fff', background: ACC, border: 'none', borderRadius: 12, padding: '14px 28px', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 8px 22px rgba(109,74,224,0.32)', display: 'inline-block' };
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', background: FLOOR, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>{children}</div>;
}
function Spinner() {
  return <div style={{ width: 34, height: 34, borderRadius: '50%', border: `3px solid rgba(109,74,224,0.18)`, borderTopColor: ACC, animation: 'clipspin 0.7s linear infinite' }}>
    <style>{`@keyframes clipspin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
