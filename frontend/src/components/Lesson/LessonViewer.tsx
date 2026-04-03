import { useState } from 'react';
import { Pin, ImageIcon, AlignLeft } from 'lucide-react';
import type { LessonBlock } from '../../types';

interface Props {
  blocks: LessonBlock[];
  /** Called when learner pins a block to ask a question */
  onPinBlock: (blockId: string, blockPreview: string) => void;
  /** IDs of blocks that already have questions (shows indicator) */
  pinnedBlockIds?: Set<string>;
  /** Currently highlighted block (scrolled-to from sidebar) */
  activeBlockId?: string | null;
}

export default function LessonViewer({
  blocks,
  onPinBlock,
  pinnedBlockIds = new Set(),
  activeBlockId = null,
}: Props) {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  if (!blocks.length) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#6b6b78',
          fontSize: 14,
          fontStyle: 'italic',
        }}
      >
        No content yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {blocks.map((block, idx) => {
        const isHovered = hoveredBlock === block.id;
        const isActive = activeBlockId === block.id;
        const hasPins = pinnedBlockIds.has(block.id);
        const preview =
          block.type === 'text'
            ? (block.content ?? '').slice(0, 80)
            : block.caption ?? `Image block ${idx + 1}`;

        return (
          <div
            key={block.id}
            id={`block-${block.id}`}
            onMouseEnter={() => setHoveredBlock(block.id)}
            onMouseLeave={() => setHoveredBlock(null)}
            style={{
              position: 'relative',
              padding: '20px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: isActive
                ? 'rgba(232,201,126,0.04)'
                : isHovered
                ? 'rgba(255,255,255,0.015)'
                : 'transparent',
              transition: 'background 0.2s',
              borderRadius: 4,
            }}
          >
            {/* Block type label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                fontFamily: 'monospace',
                fontSize: 9.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#3d3d47',
              }}
            >
              {block.type === 'text' ? (
                <AlignLeft size={10} />
              ) : (
                <ImageIcon size={10} />
              )}
              {block.type === 'text' ? 'Note' : 'Screenshot'}
              {hasPins && (
                <span
                  style={{
                    marginLeft: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    color: '#e8c97e',
                    opacity: 0.7,
                  }}
                >
                  <Pin size={9} fill="#e8c97e" />
                  pinned
                </span>
              )}
            </div>

            {/* Block content */}
            {block.type === 'text' ? (
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.85,
                  color: '#d4cfc9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {block.content}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#1c1e27',
                    maxWidth: 720,
                  }}
                >
                  {block.url ? (
                    <img
                      src={block.url}
                      alt={block.caption ?? 'Lesson screenshot'}
                      style={{
                        width: '100%',
                        display: 'block',
                        maxHeight: 500,
                        objectFit: 'contain',
                        background: '#13141a',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3d3d47',
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                  )}
                </div>
                {block.caption && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6b6b78',
                      fontStyle: 'italic',
                    }}
                  >
                    {block.caption}
                  </p>
                )}
              </div>
            )}

            {/* Pin-to-ask button — appears on hover */}
            <button
              onClick={() => onPinBlock(block.id, preview)}
              style={{
                position: 'absolute',
                top: 16,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 100,
                border: '1px solid rgba(232,201,126,0.3)',
                background: 'rgba(232,201,126,0.08)',
                color: '#e8c97e',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.04em',
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? 'auto' : 'none',
                transition: 'opacity 0.15s',
              }}
              title="Pin this section and ask a question"
            >
              <Pin size={11} />
              Ask about this
            </button>
          </div>
        );
      })}
    </div>
  );
}
