import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import RichText from '../UI/RichText';

interface Props {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  rows?: number;
  disabled?: boolean;
}

// A plain markdown/LaTeX textarea with an Edit/Preview toggle. Unlike the WYSIWYG
// RichTextEditor, this preserves raw $…$ / $$…$$ math, tables, and pasted content
// exactly, and Preview shows how learners will see it (via the RichText renderer).
export default function MarkdownField({ label, value, onChange, placeholder, hint, rows = 8, disabled }: Props) {
  const [preview, setPreview] = useState(false);
  const inputCls =
    'w-full rounded-xl px-3.5 py-3 text-[13px] font-mono bg-[var(--c-bg2)] border border-[var(--c-rule)] text-[var(--c-ink)] placeholder-[var(--c-ink3)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-y';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-[var(--c-ink2)]">{label}</label>
        <div className="flex rounded-lg overflow-hidden border border-[var(--c-rule)] text-[11px] font-semibold">
          <button type="button" onClick={() => setPreview(false)}
            className={`px-2.5 py-1 flex items-center gap-1 ${!preview ? 'bg-brand-500/15 text-brand-400' : 'text-[var(--c-ink3)]'}`}>
            <Pencil size={11} /> Edit
          </button>
          <button type="button" onClick={() => setPreview(true)}
            className={`px-2.5 py-1 flex items-center gap-1 ${preview ? 'bg-brand-500/15 text-brand-400' : 'text-[var(--c-ink3)]'}`}>
            <Eye size={11} /> Preview
          </button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-xl border border-[var(--c-rule)] bg-[var(--c-bg2)] p-4" style={{ minHeight: rows * 22 }}>
          {value.trim()
            ? <RichText>{value}</RichText>
            : <p className="text-xs text-[var(--c-ink3)] italic">Nothing to preview yet — write or paste some content.</p>}
        </div>
      ) : (
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputCls}
          style={{ lineHeight: 1.6 }}
        />
      )}
      {hint && <p className="text-[11px] text-[var(--c-ink3)] mt-1">{hint}</p>}
    </div>
  );
}
