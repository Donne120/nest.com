import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initTheme } from './hooks/useTheme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register the service worker so Nest is installable + resilient offline.
// Only in production builds and only over HTTPS/localhost (SW requirement).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    /* non-fatal: the app works fine without the SW */
  });
  // If the SW detects a stale chunk after a deploy (old cached shell pointing at
  // a deleted filename), it asks us to reload once for fresh code — with a guard
  // so a genuinely-down server can't cause a reload loop.
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'NEST_SW_STALE_RELOAD') {
      try {
        if (!sessionStorage.getItem('nest_sw_reloaded')) {
          sessionStorage.setItem('nest_sw_reloaded', '1');
          window.location.reload();
        }
      } catch { /* sessionStorage blocked — skip the auto-reload */ }
    }
  });
}
