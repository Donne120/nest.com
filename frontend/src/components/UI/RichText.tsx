import { useMemo, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

// KaTeX (the math renderer) is ~250KB — most lesson/notes views have no math.
// Load it LAZILY: only when content actually contains a `$`. Until loaded, math
// shows as a subtle placeholder; once loaded, RichText re-renders with the real
// equations. Pages with no math never download it.
let katexLib: typeof import('katex')['default'] | null = null;
let katexLoading: Promise<void> | null = null;
function ensureKatex(): Promise<void> {
  if (katexLib) return Promise.resolve();
  if (!katexLoading) {
    katexLoading = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([m]) => { katexLib = m.default; });
  }
  return katexLoading;
}
export function hasMath(s: string): boolean { return typeof s === 'string' && (s.includes('$') || s.includes('\[') || s.includes('\(')); }

/**
 * Renders markdown + LaTeX math to safe HTML.
 *
 * Nest teaches maths, but lesson text was previously dumped raw into a div
 * (`{block.content}` with white-space:pre-wrap), so a lesson written as
 * "## Why factoring works" / "$x^2+5x+6$" showed those characters literally.
 * This is the same renderer the Nest AI panel uses, extracted so lessons and
 * AI answers stay identical.
 *
 * Styling is by CSS class (see the `.nest-rich` rules below) rather than
 * inline hex, so it follows the learner's light/dark theme. Pass
 * `tone="on-dark"` for surfaces that are dark in BOTH themes (the video page,
 * the AI panels).
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li',
  'code', 'pre', 'div', 'span', 'a', 'blockquote', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub',
  'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'munderover', 'mspace',
  'mtable', 'mtr', 'mtd', 'mtext', 'annotation',
  'svg', 'path', 'line', 'rect', 'g',
];
const ALLOWED_ATTR = [
  'style', 'class', 'xmlns', 'd', 'viewBox', 'fill', 'href', 'target', 'rel',
  'stroke', 'stroke-width', 'x1', 'y1', 'x2', 'y2',
  'display', 'encoding', 'x', 'y', 'width', 'height', 'aria-hidden',
  'data-checkpoint-key',
];

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Inline math ($ / $$) + bold, for table cells and callout bodies (detected
// before / outside the global math pass).
function renderInline(s: string): string {
  // display math $$...$$ first
  let t = s.replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => {
    try {
      return katexLib
        ? `<div class="rt-math-block">${katexLib.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
        : `<div class="rt-math-block rt-math-pending">${escapeHtml(math.trim())}</div>`;
    } catch { return `<code class="rt-code">$$${math}$$</code>`; }
  });
  // inline math $...$
  t = t.replace(/\$([^$\n]+?)\$/g, (_m, math) => {
    try { return katexLib ? katexLib.renderToString(math, { displayMode: false, throwOnError: false }) : `<span class="rt-math-pending">${escapeHtml(math)}</span>`; }
    catch { return `<code class="rt-code">$${math}$</code>`; }
  });
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Academic callout cards. Recognised types map to an icon + label + accent
// class; unknown types fall back to a neutral "note". The card body is rendered
// through the same inline pass (math + bold) so formulas work inside callouts.
const CALLOUTS: Record<string, { label: string; icon: string; cls: string }> = {
  definition: { label: 'Definition', icon: '📘', cls: 'rt-co-def' },
  example:    { label: 'Worked example', icon: '✏️', cls: 'rt-co-ex' },
  warning:    { label: 'Common mistake', icon: '⚠️', cls: 'rt-co-warn' },
  formula:    { label: 'Key formula', icon: '🧮', cls: 'rt-co-formula' },
  remember:   { label: 'Remember', icon: '⭐', cls: 'rt-co-remember' },
  note:       { label: 'Note', icon: '💡', cls: 'rt-co-note' },
  tip:        { label: 'Tip', icon: '💡', cls: 'rt-co-note' },
};

function renderCallouts(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;
  let checkpointOrdinal = 0;
  // NB: escapeHtml has already run, so a leading '>' is now '&gt;'.
  const re = /^&gt;\s*\[!(\w+)\]\s*(.*)$/i;
  while (i < lines.length) {
    const m = lines[i].match(re);
    if (m) {
      const type = m[1].toLowerCase();
      const title = m[2].trim();
      const body: string[] = [];
      i++;
      // consume subsequent '&gt;' lines as the card body
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^&gt;\s?/, ''));
        i++;
      }
      const inner = body.join('\n').trim();

      if (type === 'checkpoint') {
        // A tutor-authored interactive prompt, NOT a static card. RichText has
        // no lesson/student context (it's also used for AI-panel output), so it
        // only emits an inert placeholder — LessonRichText finds it post-render
        // and portals in the real, interactive <CheckpointBlock>. The ordinal
        // here must match extractCheckpoints()'s independent parse exactly
        // (frontend/src/utils/checkpoints.ts) — both scan the same source text
        // in the same order, so they agree on the key without shared state.
        const key = `checkpoint-${checkpointOrdinal++}`;
        out.push(`<div class="rt-checkpoint-slot" data-checkpoint-key="${key}"></div>`);
        continue;
      }

      const meta = CALLOUTS[type] || CALLOUTS.note;
      const cardTitle = title || meta.label;
      out.push(
        `<div class="rt-callout ${meta.cls}">` +
        `<div class="rt-co-head"><span class="rt-co-ico">${meta.icon}</span>` +
        `<span class="rt-co-title">${cardTitle}</span></div>` +
        `<div class="rt-co-body">RTCOBODY${calloutBodies.push(inner) - 1}RTCOBODY</div>` +
        `</div>`
      );
      continue;
    }
    out.push(lines[i]);
    i++;
  }
  return out.join('\n');
}
// Callout bodies are held out during the block passes, then re-injected +
// rendered inline at the end (so math/bold/lists inside a callout still work).
let calloutBodies: string[] = [];

export function renderRichText(input: string): string {
  calloutBodies = [];
  if (!input) return '';
  // If this content needs math and KaTeX isn't loaded yet, start loading it now
  // so ANY caller (not just the React component) triggers the fetch.
  if (!katexLib && hasMath(input)) { ensureKatex(); }
  // Author text is untrusted — escape first, then build our own markup.
  let text = escapeHtml(input);

  // Normalise alternative LaTeX delimiters to the $/$$ the passes below handle:
  //   \[ ... \]  ->  $$ ... $$   (display)      \( ... \)  ->  $ ... $  (inline)
  // (escapeHtml leaves backslashes intact, so we match them here.)
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, m2) => `$$${m2}$$`);
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_m, m2) => `$${m2}$`);

  // Callout study cards — extract BEFORE the loose-paste table detector, or a
  //   > [!example]
  // block of short lines would be misread as table cells. Bodies are held out
  // as placeholders and rendered inline at the very end.
  text = renderCallouts(text);

  // Fenced code blocks first (so their contents aren't treated as markdown)
  const codeBlocks: string[] = [];
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    codeBlocks.push(`<pre class="rt-pre"><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `CODE${codeBlocks.length - 1}`;
  });

  // "Loose paste" tables — run BEFORE the global math pass, while each cell is
  // still short raw text (after math a cell like $+1$ becomes a long KaTeX span
  // and the length heuristic would reject it). Copying a table off a web page
  // gives one CELL per line and a BLANK line between rows. Detect a run of
  // blank-line-separated blocks that all have the SAME count of short lines
  // (≥2 = columns); prose is left alone (varying lengths / long lines).
  const tableBlocks: string[] = [];
  {
    const blocks = text.split(/\n{2,}/);
    const out: string[] = [];
    const linesOf = (b: string) => b.split('\n').map(s => s.trim()).filter(Boolean);
    const looksLikeCells = (ls: string[]) =>
      ls.length >= 2 && ls.length <= 8 &&
      ls.every(l => l.replace(/\$[^$]*\$/g, 'x').length <= 45 && !l.startsWith('#') && !/^[-•*]\s/.test(l));
    let i = 0;
    while (i < blocks.length) {
      const first = linesOf(blocks[i]);
      if (looksLikeCells(first)) {
        const cols = first.length;
        const rows: string[][] = [];
        let j = i + 1;
        while (j < blocks.length) {
          const ls = linesOf(blocks[j]);
          if (ls.length === cols && looksLikeCells(ls)) { rows.push(ls); j++; } else break;
        }
        if (rows.length >= 1) {
          const thead = `<thead><tr>${first.map(c => `<th class="rt-th">${renderInline(c)}</th>`).join('')}</tr></thead>`;
          const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td class="rt-td">${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
          out.push(` TABLE${tableBlocks.length} `);
          tableBlocks.push(`<div class="rt-table-wrap"><table class="rt-table">${thead}${tbody}</table></div>`);
          i = j;
          continue;
        }
      }
      out.push(blocks[i]); i++;
    }
    text = out.join('\n\n');
  }

  // Block math  $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => {
    try {
      return katexLib
        ? `<div class="rt-math-block">${katexLib.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`
        : `<div class="rt-math-block rt-math-pending">${escapeHtml(math.trim())}</div>`;
    } catch { return `<code class="rt-code">$$${math}$$</code>`; }
  });
  // Inline math  $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_m, math) => {
    try { return katexLib ? katexLib.renderToString(math, { displayMode: false, throwOnError: false }) : `<span class="rt-math-pending">${escapeHtml(math)}</span>`; }
    catch { return `<code class="rt-code">$${math}$</code>`; }
  });

  // Headings (#### h4 added)
  text = text.replace(/^#### (.+)$/gm, '<h4 class="rt-h4">$1</h4>');
  text = text.replace(/^### (.+)$/gm, '<h3 class="rt-h3">$1</h3>');
  text = text.replace(/^## (.+)$/gm,  '<h2 class="rt-h2">$1</h2>');
  text = text.replace(/^# (.+)$/gm,   '<h1 class="rt-h1">$1</h1>');

  // Horizontal rule: --- or *** on its own line
  text = text.replace(/^\s*([-*_])\1{2,}\s*$/gm, '<hr class="rt-hr"/>');

  // Blockquotes (plain > lines that weren't consumed as callouts; escaped to &gt;)
  text = text.replace(/(?:^&gt; ?.*$\n?)+/gm, (block) => {
    const inner = block.replace(/^&gt; ?/gm, '').trim();
    return `<blockquote class="rt-quote">${inner.replace(/\n/g, '<br/>')}</blockquote>\n`;
  });

  // Emphasis
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');

  // Links
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a class="rt-a" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Inline code
  text = text.replace(/`([^`]+?)`/g, '<code class="rt-code">$1</code>');

  // Markdown tables — a header row, a |---|---| separator, then body rows.
  // Runs before paragraph-splitting so the multi-line block stays intact.
  {
    const lines = text.split('\n');
    const out: string[] = [];
    const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    const isSep = (l: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-');
    const cells = (l: string) =>
      l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    let i = 0;
    while (i < lines.length) {
      if (isRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
        const head = cells(lines[i]);
        i += 2;
        const body: string[][] = [];
        while (i < lines.length && isRow(lines[i]) && !isSep(lines[i])) {
          body.push(cells(lines[i])); i++;
        }
        const thead = `<thead><tr>${head.map(c => `<th class="rt-th">${c}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${body.map(r => `<tr>${r.map(c => `<td class="rt-td">${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
        out.push(`<div class="rt-table-wrap"><table class="rt-table">${thead}${tbody}</table></div>`);
      } else {
        out.push(lines[i]); i++;
      }
    }
    text = out.join('\n');
  }

  // Lists
  text = text.replace(/^[-•*] (.+)$/gm, '<li class="rt-li">$1</li>');
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="rt-li rt-li-num">$1</li>');
  text = text.replace(/(<li class="rt-li"[\s\S]*?<\/li>)(?![\s\S]*?<li class="rt-li")/g, '<ul class="rt-ul">$1</ul>');

  // Paragraphs
  text = text.split(/\n{2,}/).map(chunk => {
    const t = chunk.trim();
    if (!t) return '';
    // don't wrap things that are already blocks
    if (/^<(h1|h2|h3|ul|ol|pre|div|blockquote)/.test(t)) return t;
    return `<p class="rt-p">${t.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  // Re-inject callout bodies, rendered inline (math + bold + line breaks) so
  // formulas and emphasis work inside a study card.
  text = text.replace(/RTCOBODY(\d+)RTCOBODY/g, (_m, i) => {
    const body = calloutBodies[Number(i)] ?? '';
    return renderInline(body).replace(/\n/g, '<br/>');
  });

  // Restore code blocks
  text = text.replace(/CODE(\d+)/g, (_m, i) => codeBlocks[Number(i)] ?? '');
  text = text.replace(/<p class="rt-p">\s*TABLE(\d+)\s*<\/p>/g, (_m, i) => tableBlocks[Number(i)] ?? '');
  text = text.replace(/\s?TABLE(\d+)\s?/g, (_m, i) => tableBlocks[Number(i)] ?? '');

  return String(DOMPurify.sanitize(text, { ALLOWED_TAGS, ALLOWED_ATTR, FORCE_BODY: true }));
}

interface Props {
  children: string;
  /** Use on surfaces that are dark in BOTH themes (video page, AI panels). */
  tone?: 'auto' | 'on-dark';
  className?: string;
  style?: React.CSSProperties;
  /** Root-div ref — lets a wrapper (e.g. LessonRichText) find `[data-checkpoint-key]`
   * placeholders after render and portal in interactive content. RichText itself
   * stays context-free; it doesn't know or care what uses this ref. */
  containerRef?: React.Ref<HTMLDivElement>;
}

export default function RichText({ children, tone = 'auto', className = '', style, containerRef }: Props) {
  // Math is lazy: on first render KaTeX may not be loaded yet, so equations
  // show as a subtle placeholder. When the content has math and KaTeX isn't
  // ready, kick off the load and re-render once it lands — otherwise the math
  // would stay pending forever (never showing the real equations).
  const [mathReady, setMathReady] = useState<boolean>(() => !!katexLib);
  useEffect(() => {
    if (!mathReady && hasMath(children)) {
      let alive = true;
      ensureKatex().then(() => { if (alive) setMathReady(true); });
      return () => { alive = false; };
    }
  }, [children, mathReady]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => renderRichText(children), [children, mathReady]);
  return (
    <div
      ref={containerRef}
      className={`nest-rich ${tone === 'on-dark' ? 'nest-rich-dark' : ''} ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
