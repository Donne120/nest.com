import { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * SafeHtml — render server-authored HTML that must NOT be trusted.
 *
 * Course descriptions, assignment briefs, worked examples etc. are authored by
 * educators/owners and stored on the server. Injecting them raw via
 * dangerouslySetInnerHTML is a stored-XSS hole: a course author could embed
 * `<img src=x onerror=…>` that runs for every learner. This component runs the
 * HTML through DOMPurify with a strict allowlist (mirrors the one in RichText)
 * before it ever touches the DOM, so scripts/handlers/unknown tags are stripped.
 *
 * Use this anywhere HTML from the API is rendered. For markdown-ish content that
 * needs formatting, prefer the RichText component (which also sanitizes).
 */

// Keep in sync with RichText's allowlist. Notably: no <script>, no <iframe>,
// and DOMPurify strips all on* event-handler attributes by default.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'code', 'pre', 'div', 'span', 'a', 'blockquote', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
  'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub',
  'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'munderover', 'mspace',
  'mtable', 'mtr', 'mtd', 'mtext', 'annotation',
  'svg', 'path', 'line', 'rect', 'g',
];

const ALLOWED_ATTR = [
  'style', 'class', 'xmlns', 'd', 'viewBox', 'fill', 'href', 'target', 'rel',
  'stroke', 'stroke-width', 'x1', 'y1', 'x2', 'y2',
  'display', 'encoding', 'x', 'y', 'width', 'height', 'aria-hidden',
  'src', 'alt', 'title',
];

interface Props {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SafeHtml({ html, className, style }: Props) {
  const clean = useMemo(
    () =>
      String(
        DOMPurify.sanitize(html ?? '', {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
          // Block javascript:/data: URIs on links; allow https/http/mailto/tel.
          ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
          FORCE_BODY: true,
        }),
      ),
    [html],
  );
  return (
    <div className={className} style={style} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
