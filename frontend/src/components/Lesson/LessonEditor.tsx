/**
 * LessonEditor — block-based editor for creators.
 * Used inside the admin module editor to build/edit lesson content.
 */
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, MoveUp, MoveDown, ImageIcon, AlignLeft,
  Save, Loader2, Upload,
} from 'lucide-react';
import api from '../../api/client';
import type { LessonBlock, Lesson } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  lesson: Lesson;
  onSaved?: (updated: Lesson) => void;
}

export default function LessonEditor({ lesson, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [blocks, setBlocks] = useState<LessonBlock[]>(lesson.content ?? []);
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForBlockId, setUploadingForBlockId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/lessons/${lesson.id}`, { title, description, content: blocks }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['module-lessons', lesson.module_id] });
      queryClient.invalidateQueries({ queryKey: ['lesson', lesson.id] });
      toast.success('Lesson saved');
      onSaved?.(res.data);
    },
    onError: () => toast.error('Failed to save lesson'),
  });

  // ── Block operations ──────────────────────────────────────────────────────

  function addTextBlock() {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'text', content: '' },
    ]);
  }

  function addImageBlock() {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'image', url: '', caption: '' },
    ]);
  }

  function updateBlock(id: string, patch: Partial<LessonBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function handleImageUpload(blockId: string, file: File) {
    setUploadingForBlockId(blockId);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(
        `/lessons/${lesson.id}/upload-image`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      updateBlock(blockId, { url: res.data.url });
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingForBlockId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    background: '#0b0c0f',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 14,
    color: '#e8e4dc',
    fontFamily: 'inherit',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        background: '#13141a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Meta fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: '#6b6b78',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Lesson Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter lesson title…"
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: '#6b6b78',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Description (optional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief intro shown to learners…"
            style={INPUT_STYLE}
          />
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.06)',
          margin: '0 -4px',
        }}
      />

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b6b78',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Content Blocks — {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </p>

        {blocks.length === 0 && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#6b6b78',
              fontSize: 13,
            }}
          >
            No blocks yet. Add a note or screenshot below.
          </div>
        )}

        {blocks.map((block, idx) => (
          <div
            key={block.id}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              background: '#1c1e27',
              overflow: 'hidden',
            }}
          >
            {/* Block header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {block.type === 'text' ? (
                <AlignLeft size={13} style={{ color: '#e8c97e' }} />
              ) : (
                <ImageIcon size={13} style={{ color: '#e8c97e' }} />
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {block.type === 'text' ? 'Text Note' : 'Screenshot'} #{idx + 1}
              </span>

              {/* Reorder + delete */}
              <div
                style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}
              >
                <button
                  onClick={() => moveBlock(block.id, 'up')}
                  disabled={idx === 0}
                  style={{
                    padding: '4px 6px',
                    background: 'none',
                    border: 'none',
                    color: idx === 0 ? '#3d3d47' : '#6b6b78',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move up"
                >
                  <MoveUp size={13} />
                </button>
                <button
                  onClick={() => moveBlock(block.id, 'down')}
                  disabled={idx === blocks.length - 1}
                  style={{
                    padding: '4px 6px',
                    background: 'none',
                    border: 'none',
                    color: idx === blocks.length - 1 ? '#3d3d47' : '#6b6b78',
                    cursor:
                      idx === blocks.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move down"
                >
                  <MoveDown size={13} />
                </button>
                <button
                  onClick={() => removeBlock(block.id)}
                  style={{
                    padding: '4px 6px',
                    background: 'none',
                    border: 'none',
                    color: '#c45c3c',
                    cursor: 'pointer',
                  }}
                  title="Delete block"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Block body */}
            <div style={{ padding: '14px' }}>
              {block.type === 'text' ? (
                <textarea
                  value={block.content ?? ''}
                  onChange={(e) =>
                    updateBlock(block.id, { content: e.target.value })
                  }
                  placeholder="Write your notes here…"
                  rows={5}
                  style={{
                    ...INPUT_STYLE,
                    resize: 'vertical',
                    minHeight: 100,
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Image preview */}
                  {block.url ? (
                    <div
                      style={{
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.07)',
                        background: '#13141a',
                      }}
                    >
                      <img
                        src={block.url}
                        alt="block preview"
                        style={{
                          width: '100%',
                          maxHeight: 280,
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 120,
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b6b78',
                        gap: 8,
                        fontSize: 13,
                      }}
                    >
                      <ImageIcon size={18} />
                      No image yet
                    </div>
                  )}

                  {/* Upload button */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(block.id, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => {
                        setUploadingForBlockId(block.id);
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadingForBlockId === block.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 14px',
                        borderRadius: 5,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#0b0c0f',
                        color: '#9ca3af',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {uploadingForBlockId === block.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                      {block.url ? 'Replace image' : 'Upload screenshot'}
                    </button>

                    {/* Or paste URL */}
                    <input
                      value={block.url ?? ''}
                      onChange={(e) =>
                        updateBlock(block.id, { url: e.target.value })
                      }
                      placeholder="Or paste image URL…"
                      style={{ ...INPUT_STYLE, flex: 1 }}
                    />
                  </div>

                  {/* Caption */}
                  <input
                    value={block.caption ?? ''}
                    onChange={(e) =>
                      updateBlock(block.id, { caption: e.target.value })
                    }
                    placeholder="Caption (optional)…"
                    style={INPUT_STYLE}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add block buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={addTextBlock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#1c1e27',
            color: '#9ca3af',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={13} />
          <AlignLeft size={13} />
          Add Note
        </button>
        <button
          onClick={addImageBlock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#1c1e27',
            color: '#9ca3af',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={13} />
          <ImageIcon size={13} />
          Add Screenshot
        </button>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !title.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 6,
            border: 'none',
            background: save.isPending ? 'rgba(232,201,126,0.4)' : '#e8c97e',
            color: '#0b0c0f',
            fontSize: 13,
            fontWeight: 700,
            cursor: save.isPending ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
          }}
        >
          {save.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save Lesson
        </button>
      </div>
    </div>
  );
}
