import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CommentMark } from './CommentMark';
import { sanitizeTiptap } from './sanitize';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3,
  Link as LinkIcon, Code, Quote, Minus,
  Table as TableIcon, Image as ImageIcon,
} from 'lucide-react';

// ─── Toolbar helpers ───────────────────────────────────────────────────────────

function Btn({
  onClick, active, title, children, disabled,
}: {
  onClick: () => void; active?: boolean; title: string;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={clsx(
        'p-1.5 rounded-md transition-colors text-sm leading-none',
        active
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-slate-700',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-0.5 self-center" />;
}

// ─── Word count ────────────────────────────────────────────────────────────────

function countWords(editor: Editor): number {
  const text = editor.getText();
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (json: any) => void;
  onAutoSave?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
  autoSaveInterval?: number; // ms, default 30000
}

export default function AssignmentEditor({
  value,
  onChange,
  onAutoSave,
  readOnly = false,
  placeholder = 'Start writing…',
  minHeight = 400,
  autoSaveInterval = 30_000,
}: Props) {
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: { languageClassPrefix: 'language-' },
        // Disable StarterKit's bundled link so our explicit Link extension is the only one
        link: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-brand-600 underline cursor-pointer' },
      }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CommentMark,
    ],
    content: value ? sanitizeTiptap(value) : null,
    editable: !readOnly,
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
      setWordCount(countWords(e));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
        style: `min-height: ${minHeight}px; padding: 16px 20px;`,
      },
    },
  });

  // Sync external value when loaded from server.
  // Compare by stringify; skip if editor already matches or value is empty.
  useEffect(() => {
    if (!editor || !value) return;
    const incoming = JSON.stringify(value);
    const current = JSON.stringify(editor.getJSON());
    // Always apply when editor is empty (first load) or content genuinely changed
    const editorIsEmpty = editor.isEmpty;
    if (editorIsEmpty || current !== incoming) {
      editor.commands.setContent(sanitizeTiptap(value));
      setWordCount(countWords(editor));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Auto-save timer
  useEffect(() => {
    if (!onAutoSave || readOnly) return;
    autoSaveTimer.current = setInterval(() => {
      onAutoSave();
      setLastSaved(new Date());
    }, autoSaveInterval);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [onAutoSave, autoSaveInterval, readOnly]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const insertImageUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL:');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition bg-white dark:bg-slate-900">

      {/* ─── Toolbar ─────────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">

          {/* Headings */}
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 size={15} />
          </Btn>

          <Divider />

          {/* Inline marks */}
          <Btn onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <Bold size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <Italic size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')} title="Inline code">
            <Code size={14} />
          </Btn>

          <Divider />

          {/* Lists & blocks */}
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')} title="Bullet list">
            <List size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')} title="Numbered list">
            <ListOrdered size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')} title="Blockquote">
            <Quote size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')} title="Code block">
            <span className="font-mono text-[11px] leading-none px-0.5">{'</>'}</span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()}
            active={false} title="Horizontal divider">
            <Minus size={14} />
          </Btn>

          <Divider />

          {/* Alignment */}
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <AlignLeft size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <AlignCenter size={14} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <AlignRight size={14} />
          </Btn>

          <Divider />

          {/* Table */}
          <Btn
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            active={editor.isActive('table')} title="Insert table">
            <TableIcon size={14} />
          </Btn>

          {/* Image */}
          <Btn onClick={insertImageUrl} active={false} title="Insert image (URL)">
            <ImageIcon size={14} />
          </Btn>

          {/* Link */}
          <Btn onClick={setLink} active={editor.isActive('link')} title="Add/edit link">
            <LinkIcon size={14} />
          </Btn>
        </div>
      )}

      {/* ─── Editor area ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {editor.isEmpty && !readOnly && (
          <p className="absolute top-4 left-5 text-gray-400 dark:text-slate-500 text-sm pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* ─── Status bar ──────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {lastSaved && (
            <span className="text-xs text-green-500 dark:text-green-400">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
