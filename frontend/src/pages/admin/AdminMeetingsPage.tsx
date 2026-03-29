import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, ExternalLink, Check, X, BookOpen,
  Video, ChevronDown, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Meeting, MeetingStatus } from '../../types';
import { Skeleton } from '../../components/UI/Skeleton';
import Avatar from '../../components/UI/Avatar';

const STATUS_STYLES: Record<MeetingStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined:  'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-gray-100 text-gray-500 border-gray-200',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ConfirmForm({ meeting, onDone }: { meeting: Meeting; onDone: () => void }) {
  const qc = useQueryClient();
  const [confirmedAt, setConfirmedAt] = useState(
    meeting.requested_at
      ? new Date(meeting.requested_at).toISOString().slice(0, 16)
      : ''
  );
  const [link, setLink] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/meetings/${meeting.id}/confirm`, {
        confirmed_at: new Date(confirmedAt).toISOString(),
        meeting_link: link.trim(),
      }),
    onSuccess: () => {
      toast.success('Meeting confirmed!');
      qc.invalidateQueries({ queryKey: ['meetings'] });
      onDone();
    },
    onError: () => toast.error('Failed to confirm meeting.'),
  });

  return (
    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-emerald-800">Confirm meeting</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Date & time</label>
          <input
            type="datetime-local"
            value={confirmedAt}
            onChange={e => setConfirmedAt(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Meeting link (Zoom / Meet)</label>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
          Cancel
        </button>
        <button
          onClick={() => mutate()}
          disabled={isPending || !confirmedAt || !link.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Confirm
        </button>
      </div>
    </div>
  );
}

function DeclineForm({ meeting, onDone }: { meeting: Meeting; onDone: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/meetings/${meeting.id}/decline`, { decline_reason: reason.trim() || null }),
    onSuccess: () => {
      toast.success('Meeting declined.');
      qc.invalidateQueries({ queryKey: ['meetings'] });
      onDone();
    },
    onError: () => toast.error('Failed to decline meeting.'),
  });

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-red-800">Decline reason</p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={2}
        placeholder="Optional — let the employee know why..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
      />
      <div className="flex items-center gap-2 justify-end">
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
          Cancel
        </button>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Decline
        </button>
      </div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<'confirm' | 'decline' | null>(null);

  const { mutate: markComplete, isPending: completing } = useMutation({
    mutationFn: () => api.patch(`/meetings/${meeting.id}/complete`, {}),
    onSuccess: () => {
      toast.success('Marked as completed.');
      qc.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: () => toast.error('Failed to update.'),
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <Avatar name={meeting.learner.full_name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{meeting.learner.full_name}</p>
            <span className="text-xs text-gray-400">{meeting.learner.email}</span>
            <span className={`ml-auto text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[meeting.status]}`}>
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </span>
          </div>

          {meeting.module_title && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-0.5 font-medium">
              <BookOpen size={11} /> {meeting.module_title}
            </span>
          )}

          <div className="mt-2 space-y-1 text-sm text-gray-500">
            {meeting.requested_at && (
              <div className="flex items-center gap-2">
                <Clock size={13} /> Preferred: {formatDateTime(meeting.requested_at)}
              </div>
            )}
            {meeting.confirmed_at && (
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Calendar size={13} /> Confirmed: {formatDateTime(meeting.confirmed_at)}
              </div>
            )}
          </div>

          {meeting.note && (
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              "{meeting.note}"
            </p>
          )}

          {meeting.meeting_link && (
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Video size={12} /> {meeting.meeting_link}
              <ExternalLink size={11} />
            </a>
          )}

          {meeting.decline_reason && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              {meeting.decline_reason}
            </p>
          )}

          {/* Actions for pending */}
          {meeting.status === 'pending' && !form && (
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setForm('confirm')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Check size={13} /> Confirm
              </button>
              <button
                onClick={() => setForm('decline')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                <X size={13} /> Decline
              </button>
            </div>
          )}

          {/* Actions for confirmed */}
          {meeting.status === 'confirmed' && (
            <button
              onClick={() => markComplete()}
              disabled={completing}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {completing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Mark as completed
            </button>
          )}

          {/* Inline forms */}
          {form === 'confirm' && <ConfirmForm meeting={meeting} onDone={() => setForm(null)} />}
          {form === 'decline' && <DeclineForm meeting={meeting} onDone={() => setForm(null)} />}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3">
        Requested {new Date(meeting.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

type Filter = 'all' | MeetingStatus;

export default function AdminMeetingsPage() {
  const [filter, setFilter] = useState<Filter>('pending');

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then(r => r.data),
    refetchInterval: 30000,
  });

  const counts: Record<Filter, number> = {
    all: meetings.length,
    pending:   meetings.filter(m => m.status === 'pending').length,
    confirmed: meetings.filter(m => m.status === 'confirmed').length,
    declined:  meetings.filter(m => m.status === 'declined').length,
    completed: meetings.filter(m => m.status === 'completed').length,
  };

  const filtered = filter === 'all' ? meetings : meetings.filter(m => m.status === filter);

  const tabs: { key: Filter; label: string }[] = [
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined',  label: 'Declined' },
    { key: 'all',       label: 'All' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">1-on-1 Meetings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage employee meeting requests</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 pb-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? 'text-brand-700'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                filter === key
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[key]}
              </span>
            )}
            {filter === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} meetings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => <MeetingRow key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  );
}
