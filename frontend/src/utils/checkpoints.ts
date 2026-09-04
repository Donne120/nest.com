import type { LessonBlock } from '../types';

export interface Checkpoint {
  /** Block-local DOM key ("checkpoint-N") — matches RichText's placeholder
   * data-checkpoint-key exactly, since one RichText instance renders one block. */
  domKey: string;
  /** Globally-unique key sent to the backend: `${blockId}:${domKey}`. */
  checkpointKey: string;
  blockId: string;
  title: string;
  body: string;
}

// Mirrors RichText.tsx's renderCallouts() checkpoint branch: both scan a
// block's raw text for `> [!checkpoint] Title` / `> body` runs, in the same
// order, and agree on the Nth-checkpoint-in-this-block ordinal without any
// shared state — that's what lets LessonRichText match a rendered placeholder
// node back to its prompt text.
const CHECKPOINT_RE = /^>\s*\[!checkpoint\]\s*(.*)$/i;

export function extractCheckpoints(blocks: LessonBlock[]): Checkpoint[] {
  const out: Checkpoint[] = [];
  for (const block of blocks) {
    if (block.type !== 'text' || !block.content) continue;
    const lines = block.content.split('\n');
    let ordinal = 0;
    let i = 0;
    while (i < lines.length) {
      const m = lines[i].match(CHECKPOINT_RE);
      if (m) {
        const title = m[1].trim();
        const body: string[] = [];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          body.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        const domKey = `checkpoint-${ordinal++}`;
        out.push({
          domKey,
          checkpointKey: `${block.id}:${domKey}`,
          blockId: block.id,
          title,
          body: body.join('\n').trim(),
        });
        continue;
      }
      i++;
    }
  }
  return out;
}
