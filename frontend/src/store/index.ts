import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  setAuth: (user: User, token: string, organization: Organization | null) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organization: null,
      setAuth: (user, token, organization) => {
        localStorage.setItem('nest_token', token);
        set({ user, token, organization });
      },
      updateUser: (user) => set({ user }),
      clearAuth: () => {
        localStorage.removeItem('nest_token');
        set({ user: null, token: null, organization: null });
      },
    }),
    {
      name: 'nest_auth',
      partialize: (s) => ({ user: s.user, token: s.token, organization: s.organization }),
    }
  )
);

// ─── Player ───────────────────────────────────────────────────────────────────

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setPlaying: (p: boolean) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  seekTo: (t: number) => void;
  seekTarget: number | null;
  clearSeek: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  volume: 1,
  playbackRate: 1,
  seekTarget: null,
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setPlaying: (p) => set({ isPlaying: p }),
  setVolume: (v) => set({ volume: v }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  seekTo: (t) => set({ seekTarget: t }),
  clearSeek: () => set({ seekTarget: null }),
}));

// ─── UI ───────────────────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  activeQuestionId: string | null;
  showQuestionForm: boolean;
  questionFormTimestamp: number | null;
  whiteboardQuestionId: string | null;
  whiteboardQuestionText: string;
  // Direct AI ask (no Q&A, no DB, no admin)
  aiAskOpen: boolean;
  aiAskVideoId: string | null;
  aiAskTimestamp: number;
  setSidebarOpen: (o: boolean) => void;
  setActiveQuestion: (id: string | null) => void;
  openQuestionForm: (ts: number) => void;
  closeQuestionForm: () => void;
  openWhiteboard: (questionId: string, questionText?: string) => void;
  closeWhiteboard: () => void;
  openAIAsk: (videoId: string, timestamp?: number) => void;
  closeAIAsk: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeQuestionId: null,
  showQuestionForm: false,
  questionFormTimestamp: null,
  whiteboardQuestionId: null,
  whiteboardQuestionText: '',
  aiAskOpen: false,
  aiAskVideoId: null,
  aiAskTimestamp: 0,
  setSidebarOpen: (o) => set({ sidebarOpen: o }),
  setActiveQuestion: (id) => set({ activeQuestionId: id }),
  openQuestionForm: (ts) => set({ showQuestionForm: true, questionFormTimestamp: ts }),
  closeQuestionForm: () => set({ showQuestionForm: false, questionFormTimestamp: null }),
  openWhiteboard: (questionId, questionText = '') =>
    set({ whiteboardQuestionId: questionId, whiteboardQuestionText: questionText }),
  closeWhiteboard: () => set({ whiteboardQuestionId: null, whiteboardQuestionText: '' }),
  openAIAsk: (videoId, timestamp = 0) =>
    set({ aiAskOpen: true, aiAskVideoId: videoId, aiAskTimestamp: timestamp }),
  closeAIAsk: () => set({ aiAskOpen: false, aiAskVideoId: null, aiAskTimestamp: 0 }),
}));
