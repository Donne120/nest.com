// A stuck pre-fix service worker (nest-v1, shipped before this app knew how
// to recover from its own stale-chunk crashes) can keep controlling a tab
// indefinitely — SW self-update only runs on navigation and isn't guaranteed
// to complete on a device that never fully closes the PWA. If a controller is
// active and it isn't running nest-v2+, wipe it out once per session before
// the app bundle even loads. Loaded as an external file (not inline) so it
// runs under the site's CSP (script-src 'self'), which forbids inline script.
(function () {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  try {
    if (sessionStorage.getItem('nest_sw_bootstrap_wiped')) return;
  } catch (e) {
    return;
  }

  var chan = new MessageChannel();
  var answered = false;
  var timer = setTimeout(function () {
    if (answered) return;
    answered = true;
    wipe();
  }, 800);
  chan.port1.onmessage = function (e) {
    if (answered) return;
    answered = true;
    clearTimeout(timer);
    var m = e.data && /^nest-v(\d+)$/.exec(e.data.version || '');
    if (!m || Number(m[1]) < 2) wipe();
  };
  try {
    navigator.serviceWorker.controller.postMessage({ type: 'NEST_PING' }, [chan.port2]);
  } catch (e) {
    clearTimeout(timer);
    wipe();
  }

  function wipe() {
    try {
      sessionStorage.setItem('nest_sw_bootstrap_wiped', '1');
    } catch (e) {}
    navigator.serviceWorker
      .getRegistrations()
      .then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      })
      .then(function () {
        return 'caches' in window
          ? caches.keys().then(function (keys) {
              return Promise.all(keys.map(function (k) { return caches.delete(k); }));
            })
          : null;
      })
      .catch(function () {})
      .then(function () {
        window.location.reload();
      });
  }
})();
