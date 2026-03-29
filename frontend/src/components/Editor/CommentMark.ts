import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentMark: {
      setComment: (comment: string, color?: string, commentId?: string) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'commentMark',

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      comment: {
        default: null,
        parseHTML: el => el.getAttribute('data-comment'),
        renderHTML: attrs => ({ 'data-comment': attrs.comment }),
      },
      color: {
        default: '#fef08a',
        parseHTML: el => el.getAttribute('data-color'),
        renderHTML: attrs => ({ 'data-color': attrs.color }),
      },
      commentId: {
        default: null,
        parseHTML: el => el.getAttribute('data-comment-id'),
        renderHTML: attrs => ({ 'data-comment-id': attrs.commentId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'mark[data-comment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `background-color: ${HTMLAttributes['data-color'] ?? '#fef08a'}; border-radius: 2px; padding: 0 1px; cursor: pointer;`,
        class: 'tiptap-comment',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (comment: string, color = '#fef08a', commentId = crypto.randomUUID()) =>
        ({ commands }) => {
          return commands.setMark(this.name, { comment, color, commentId });
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
