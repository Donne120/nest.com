import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * Share a shareable lesson: copies the public /c/:id link and offers a WhatsApp
 * share intent. Renders nothing unless the lesson is marked shareable, so it
 * only appears where sharing is actually allowed.
 */
export default function ShareLessonButton({
  videoId,
  title,
  shareable,
  compact = false,
}: {
  videoId: string;
  title: string;
  shareable?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!shareable) return null;

  const url = `${window.location.origin}/c/${videoId}`;
  const msg = `📚 "${title}" — watch this quick lesson on Nest, it answers your questions: ${url}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard blocked — the WhatsApp button still works */ }
  };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');

  return (
    <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={whatsapp}
        title="Share to WhatsApp"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 600,
          fontSize: compact ? 12.5 : 13.5, color: '#fff', background: '#25D366',
          border: 'none', borderRadius: 10, padding: compact ? '7px 12px' : '9px 16px',
          cursor: 'pointer',
        }}
      >
        <Share2 size={compact ? 14 : 15} /> Share
      </button>
      <button
        onClick={copy}
        title="Copy link"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 600,
          fontSize: compact ? 12.5 : 13.5,
          color: copied ? '#1a9e54' : 'var(--c-acc)',
          background: 'var(--c-acc-wash, #F1ECFD)',
          border: '1px solid var(--c-rule)', borderRadius: 10,
          padding: compact ? '7px 12px' : '9px 14px', cursor: 'pointer',
        }}
      >
        {copied ? <><Check size={14} /> Copied</> : 'Copy link'}
      </button>
    </div>
  );
}
