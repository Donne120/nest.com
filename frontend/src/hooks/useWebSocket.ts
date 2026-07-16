import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

type WSMessage = {
  event: string;
  [key: string]: unknown;
};

type Handler = (msg: WSMessage) => void;

/**
 * Single live WebSocket per user, with backoff reconnect.
 *
 * Previously this hook subscribed to the WHOLE auth store (no selector) and
 * put `onMessage` in `connect`'s deps, so any store change re-created `connect`,
 * which tore down and reopened the socket. Each close scheduled a reconnect
 * timer that was never cleared, so timers/sockets piled up and hammered the API
 * — burning CPU, battery and mobile data. Now: narrow selector, handler kept in
 * a ref, and every timer cleaned up.
 */
export function useWebSocket(onMessage?: Handler) {
  // Narrow selector — only re-run when the user id actually changes.
  const userId = useAuthStore((s) => s.user?.id);

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const attemptsRef = useRef(0);

  // Keep the latest handler without making it a reconnect trigger.
  const handlerRef = useRef<Handler | undefined>(onMessage);
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    if (!userId) return;
    unmountedRef.current = false;
    attemptsRef.current = 0;

    const clearTimers = () => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
    };

    const connect = () => {
      if (unmountedRef.current) return;
      // Never stack sockets.
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

      const wsBase = import.meta.env.VITE_WS_URL
        ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
      const ws = new WebSocket(`${wsBase}/ws/${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptsRef.current = 0;
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);
      };

      ws.onmessage = (e) => {
        if (e.data === 'pong') return;
        try {
          const msg = JSON.parse(e.data) as WSMessage;
          handlerRef.current?.(msg);

          if (msg.event === 'new_question') {
            toast('New question submitted', { icon: '❓' });
          } else if (msg.event === 'question_answered') {
            toast.success('Your question has been answered!');
          } else if (msg.event === 'meeting_confirmed') {
            toast.success('Your 1-on-1 meeting has been confirmed! Check your Meetings page for the link.', { duration: 6000 });
          } else if (msg.event === 'meeting_declined') {
            toast('Your meeting request was declined.', { icon: '📅', duration: 5000 });
          } else if (msg.event === 'meeting_request') {
            toast('New 1-on-1 meeting request received.', { icon: '📅' });
          }
        } catch { /* ignore malformed frames */ }
      };

      ws.onclose = () => {
        if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
        if (wsRef.current === ws) wsRef.current = null;
        if (unmountedRef.current) return;
        // Exponential backoff (3s → 48s cap) instead of a fixed 3s hammer.
        const delay = Math.min(3000 * 2 ** attemptsRef.current, 48000);
        attemptsRef.current += 1;
        if (retryRef.current) clearTimeout(retryRef.current);
        retryRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => { /* onclose handles the retry */ };
    };

    connect();

    return () => {
      unmountedRef.current = true;
      clearTimers();
      const ws = wsRef.current;
      wsRef.current = null;
      if (!ws) return;
      ws.onclose = null;   // don't schedule a reconnect from our own teardown
      ws.onmessage = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);
}
