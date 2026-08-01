// Shared YouTube helpers — used by both the desktop VideoPlayer and the mobile
// immersive (TikTok) player so they agree on parsing + the IFrame API.

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?.*v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// ── YouTube IFrame API loader (module-level singleton) ──────────────────────
let ytApiLoading = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

export function loadYouTubeAPI(callback: () => void) {
  if (ytApiReady && (window as any).YT?.Player) { callback(); return; }
  ytReadyCallbacks.push(callback);
  if (!ytApiLoading) {
    ytApiLoading = true;
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') { try { prev(); } catch { /* ignore */ } }
      ytApiReady = true;
      ytReadyCallbacks.forEach((cb) => cb());
      ytReadyCallbacks.length = 0;
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
}
