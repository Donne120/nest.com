import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, MessageCirclePlus, Settings } from 'lucide-react';
import { usePlayerStore } from '../../store';
import { useState } from 'react';
import clsx from 'clsx';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface Props {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onAskQuestion: () => void;
}

export default function Controls({ onToggleFullscreen, isFullscreen, onAskQuestion }: Props) {
  const { isPlaying, volume, playbackRate, setPlaying, setVolume, setPlaybackRate } = usePlayerStore();
  const [showSettings, setShowSettings] = useState(false);
  const isMuted = volume === 0;

  return (
    <div className="flex items-center gap-3 text-white">
      {/* Play/Pause */}
      <button
        onClick={() => setPlaying(!isPlaying)}
        className="p-1 hover:text-brand-300 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVolume(isMuted ? 1 : 0)}
          className="hover:text-brand-300 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0} max={1} step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 h-1 accent-brand-500"
          aria-label="Volume"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Ask Question */}
        <button
          onClick={onAskQuestion}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors backdrop-blur-sm"
        >
          <MessageCirclePlus size={14} />
          Ask Question
        </button>

        {/* Speed */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:text-brand-300 transition-colors"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
          {showSettings && (
            <div className="absolute bottom-8 right-0 bg-gray-900 rounded-lg overflow-hidden shadow-modal z-20 animate-fade-in min-w-[120px]">
              <p className="text-xs text-gray-400 px-3 py-1.5 border-b border-gray-700">Playback Speed</p>
              {RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => { setPlaybackRate(r); setShowSettings(false); }}
                  className={clsx(
                    'w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 transition-colors',
                    r === playbackRate ? 'text-brand-400 font-medium' : 'text-gray-200'
                  )}
                >
                  {r === 1 ? 'Normal' : `${r}×`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-1 hover:text-brand-300 transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
}
