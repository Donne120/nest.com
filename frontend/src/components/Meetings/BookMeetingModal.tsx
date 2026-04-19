import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

interface Props {
  moduleId?: string;
  moduleTitle?: string;
  onClose: () => void;
}

export default function BookMeetingModal({ moduleId, moduleTitle, onClose }: Props) {
  const qc = useQueryClient();
  const [requestedAt, setRequestedAt] = useState('');
  const [note, setNote] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/meetings', {
        module_id: moduleId ?? null,
        requested_at: requestedAt ? new Date(requestedAt).toISOString() : null,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Meeting request sent! Your trainer will confirm shortly.');
      qc.invalidateQueries({ queryKey: ['meetings'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to send request. Please try again.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Book a 1-on-1</h2>
            {moduleTitle && (
              <p className="text-xs text-gray-400 mt-0.5">re: {moduleTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Preferred time */}
          <div>
            <label htmlFor="meeting-requested-at" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <Calendar size={13} className="text-gray-400" />
              Preferred date & time
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              id="meeting-requested-at"
              name="requested_at"
              type="datetime-local"
              value={requestedAt}
              onChange={e => setRequestedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="meeting-note" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <MessageSquare size={13} className="text-gray-400" />
              What would you like to discuss?
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              id="meeting-note"
              name="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. I'm stuck on the compliance section and need some guidance..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{note.length}/1000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
