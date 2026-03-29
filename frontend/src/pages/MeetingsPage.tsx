import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, ExternalLink, BookOpen, Plus, Video
} from 'lucide-react';
import api from '../api/client';
import type { Meeting, MeetingStatus } from '../types';
import { Skeleton } from '../components/UI/Skeleton';
import BookMeetingModal from '../components/Meetings/BookMeetingModal';
import { useWebSocket } from '../hooks/useWebSocket';

const STATUS_STYLES: Record<MeetingStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined:  'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABEL: Record<MeetingStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  declined:  'Declined',
  completed: 'Completed',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {meeting.module_title && (
              <span className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-0.5 font-medium">
                <BookOpen size={11} />
                {meeting.module_title}
              </span>
            )}
            <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[meeting.status]}`}>
              {STATUS_LABEL[meeting.status]}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-2">
            1-on-1 with {meeting.owner ? meeting.owner.full_name : 'your trainer'}
          </p>
        </div>
      </div>

      {/* Time info */}
      <div className="space-y-1.5 text-sm text-gray-500">
        {meeting.confirmed_at ? (
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <Calendar size={13} />
            {formatDateTime(meeting.confirmed_at)}
          </div>
        ) : meeting.requested_at ? (
          <div className="flex items-center gap-2">
            <Clock size={13} />
            Requested for {formatDateTime(meeting.requested_at)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={13} />
            No specific time requested
          </div>
        )}
      </div>

      {/* Employee note */}
      {meeting.note && (
        <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 line-clamp-2">
          "{meeting.note}"
        </p>
      )}

      {/* Decline reason */}
      {meeting.status === 'declined' && meeting.decline_reason && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
          {meeting.decline_reason}
        </p>
      )}

      {/* Meeting link */}
      {meeting.status === 'confirmed' && meeting.meeting_link && (
        <a
          href={meeting.meeting_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Video size={14} />
          Join Meeting
          <ExternalLink size={12} className="opacity-70" />
        </a>
      )}

      <p className="text-[11px] text-gray-400 mt-3">
        Requested {new Date(meeting.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function MeetingsPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  useWebSocket((msg) => {
    if (msg.event === 'meeting_confirmed' || msg.event === 'meeting_declined') {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then(r => r.data),
  });

  const pending   = meetings.filter(m => m.status === 'pending');
  const confirmed = meetings.filter(m => m.status === 'confirmed');
  const past      = meetings.filter(m => m.status === 'declined' || m.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My 1-on-1 Meetings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Book time with your trainer for personalised help</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={15} />
          Book a 1-on-1
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No meetings yet</p>
          <p className="text-sm text-gray-400 mt-1">Book a 1-on-1 with your trainer to get personalised support</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            Book now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {confirmed.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Upcoming</h2>
              <div className="space-y-3">
                {confirmed.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </section>
          )}
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pending</h2>
              <div className="space-y-3">
                {pending.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Past</h2>
              <div className="space-y-3">
                {past.map(m => <MeetingCard key={m.id} meeting={m} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {showModal && <BookMeetingModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
