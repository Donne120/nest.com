import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Gauge } from 'lucide-react';
import { usePlayerStore } from '../../store';
import { useState } from 'react';
import clsx from 'clsx';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface Props {
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onAskQuestion: () => void;
}

// 44px min touch target — comfortable on phones
const btn = 'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-white hover:text-brand-300 hover:bg-white/10 transition-colors';

export default function Controls({ onToggleFullscreen, isFullscreen, onAskQuestion: _onAskQuestion }: Props) {
  const { isPlaying, volume, playbackRate, setPlaying, setVolume, setPlaybackRate } = usePlayerStore();
  const [showSettings, setShowSettings] = useState(false);
  const isMuted = volume === 0;

  return (
    <div className="flex items-center gap-1 text-white">
      {/* Play/Pause */}
      <button onClick={() => setPlaying(!isPlaying)} className={btn} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>

      {/* Volume */}
      <button onClick={() => setVolume(isMuted ? 1 : 0)} className={btn} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <input
        type="range"
        min={0} max={1} step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-16 sm:w-24 h-1.5 accent-brand-500"
        aria-label="Volume"
      />

      <div className="ml-auto flex items-center gap-1">
        {/* Speed */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx(btn, 'gap-1 px-2 min-w-0 font-mono text-xs')}
            aria-label="Playback speed"
          >
            <Gauge size={18} />
            <span>{playbackRate === 1 ? '1×' : `${playbackRate}×`}</span>
          </button>
          {showSettings && (
            <>
              {/* tap-away backdrop */}
              <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-xl overflow-hidden shadow-modal z-40 animate-fade-in min-w-[140px] border border-white/10">
                <p className="text-[11px] text-gray-400 px-3 py-2 border-b border-gray-700 font-mono uppercase tracking-wide">Speed</p>
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setPlaybackRate(r); setShowSettings(false); }}
                    className={clsx(
                      'w-full text-left px-3 min-h-[40px] text-sm hover:bg-gray-800 transition-colors',
                      r === playbackRate ? 'text-brand-400 font-semibold' : 'text-gray-200'
                    )}
                  >
                    {r === 1 ? 'Normal' : `${r}×`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fullscreen */}
        <button onClick={onToggleFullscreen} className={btn} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
}
