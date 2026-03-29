import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Link as LinkIcon, Highlighter, RemoveFormatting, Quote, Minus
} from 'lucide-react';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';

const TEXT_COLORS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function Btn({ onClick, active, title, children, disabled }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={clsx(
        'p-1.5 rounded-md transition-colors text-sm leading-none',
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write a description…', minHeight = 200 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        link: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-600 underline cursor-pointer' } }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}px; padding: 12px 16px;`,
      },
    },
  });

  // Sync external value changes (e.g. loading existing module)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

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

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50/80">

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

        <Divider />

        {/* Lists */}
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

        {/* Text color */}
        <div className="relative group/color">
          <Btn onClick={() => {}} active={false} title="Text color">
            <span className="flex flex-col items-center gap-px">
              <span className="font-bold text-[11px] leading-none" style={{ color: editor.getAttributes('textStyle').color ?? '#111827' }}>A</span>
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: editor.getAttributes('textStyle').color ?? '#111827' }} />
            </span>
          </Btn>
          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/color:flex flex-col bg-white border border-gray-200 rounded-xl shadow-elevated p-2 gap-1 min-w-[120px]">
            {TEXT_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (c.value === 'inherit') {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(c.value).run();
                  }
                }}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 text-left text-xs text-gray-700 transition-colors"
              >
                <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.value === 'inherit' ? '#111827' : c.value }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight color */}
        <div className="relative group/hl">
          <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            active={editor.isActive('highlight')} title="Highlight">
            <Highlighter size={14} />
          </Btn>
          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/hl:flex flex-col bg-white border border-gray-200 rounded-xl shadow-elevated p-2 gap-1 min-w-[110px]">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().toggleHighlight({ color: c.value }).run();
                }}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 text-left text-xs text-gray-700 transition-colors"
              >
                <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.value }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Link */}
        <Btn onClick={setLink} active={editor.isActive('link')} title="Add/edit link">
          <LinkIcon size={14} />
        </Btn>

        {/* Clear formatting */}
        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          active={false} title="Clear formatting">
          <RemoveFormatting size={14} />
        </Btn>
      </div>

      {/* ─── Editor area ─── */}
      <div className="bg-white relative">
        {editor.isEmpty && (
          <p className="absolute top-3 left-4 text-gray-400 text-sm pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
