import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RichText from '../UI/RichText';
import CheckpointBlock from './CheckpointBlock';
import { extractCheckpoints } from '../../utils/checkpoints';
import type { LessonBlock, LessonCheckpointAnswer } from '../../types';

interface Props {
  lessonId: string;
  block: LessonBlock;
  myAnswers: LessonCheckpointAnswer[];
  tone?: 'auto' | 'on-dark';
  style?: React.CSSProperties;
}

/** Wraps RichText for lesson notes specifically: finds the inert
 * `[data-checkpoint-key]` placeholders RichText emits for tutor-authored
 * "[!checkpoint]" prompts and portals a real, interactive <CheckpointBlock>
 * into each one. RichText itself stays context-free (it's also used for
 * AI-panel output with no lesson/student around) — all lesson-specific wiring
 * lives here instead. */
export default function LessonRichText({ lessonId, block, myAnswers, tone, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<{ node: HTMLElement; domKey: string }[]>([]);

  const content = block.content ?? '';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) { setSlots([]); return; }
    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>('[data-checkpoint-key]')
    );
    setSlots(nodes.map((node) => ({ node, domKey: node.dataset.checkpointKey! })));
  }, [content]);

  const checkpoints = extractCheckpoints([block]);
  const answersByKey = new Map(myAnswers.map((a) => [a.checkpoint_key, a]));

  return (
    <>
      <RichText tone={tone} style={style} containerRef={containerRef}>
        {content}
      </RichText>
      {slots.map(({ node, domKey }) => {
        const cp = checkpoints.find((c) => c.domKey === domKey);
        if (!cp) return null;
        return createPortal(
          <CheckpointBlock
            lessonId={lessonId}
            blockId={cp.blockId}
            checkpointKey={cp.checkpointKey}
            title={cp.title}
            body={cp.body}
            myAnswer={answersByKey.get(cp.checkpointKey)}
          />,
          node,
          cp.checkpointKey
        );
      })}
    </>
  );
}
