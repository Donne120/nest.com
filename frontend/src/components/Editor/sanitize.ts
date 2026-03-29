// Shared TipTap JSON sanitizer — removes empty text nodes that cause RangeError

function sanitizeNode(node: any): any | null {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'text') {
    return typeof node.text === 'string' && node.text.length > 0 ? node : null;
  }
  if (Array.isArray(node.content)) {
    const clean = node.content
      .map(sanitizeNode)
      .filter((n: any) => n !== null);
    const blockTypes = ['paragraph', 'heading', 'blockquote', 'listItem'];
    if (clean.length === 0 && blockTypes.includes(node.type)) return null;
    return { ...node, content: clean };
  }
  return node;
}

export function sanitizeTiptap(doc: any): any {
  if (!doc || doc.type !== 'doc') return doc;
  const content = (doc.content ?? [])
    .map(sanitizeNode)
    .filter((n: any) => n !== null);
  return { ...doc, content };
}
