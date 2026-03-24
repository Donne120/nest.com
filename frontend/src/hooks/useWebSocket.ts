import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

type WSMessage = {
  event: string;
  [key: string]: unknown;
};

type Handler = (msg: WSMessage) => void;

export function useWebSocket(onMessage?: Handler) {
  const { user } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (!user || unmountedRef.current) return;

    const wsBase = import.meta.env.VITE_WS_URL
      ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws/${user.id}`);

    ws.onopen = () => {
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);
    };

    ws.onmessage = (e) => {
      if (e.data === 'pong') return;
      try {
        const msg = JSON.parse(e.data) as WSMessage;
        onMessage?.(msg);

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
      } catch {}
    };

    ws.onclose = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      // Only reconnect if component is still mounted
      if (!unmountedRef.current) {
        setTimeout(connect, 3000);
      }
    };

    wsRef.current = ws;
  }, [user, onMessage]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (pingRef.current) clearInterval(pingRef.current);
      const ws = wsRef.current;
      if (!ws) return;
      if (ws.readyState === WebSocket.CONNECTING) {
        // Can't close while connecting — mark as done and let onopen close it
        ws.onopen = () => ws.close();
      } else {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [connect]);
}
