// Registers the service worker that makes Companion installable on a phone
// and usable without a signal. See pwa/sw.template.js.

const singleFile = import.meta.env.VITE_SINGLE_FILE === '1';

function editing() {
  return /\/edit(\b|$)/.test(location.hash);
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || singleFile || !('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  navigator.serviceWorker.register('./sw.js').then(
    (registration) => {
      // An installed app can sit in the background for days, so look for a
      // new version whenever it comes back to the front.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    },
    () => {},
  );

  // When a new version takes over, switch to it the next time the app is out
  // of sight, so nothing reloads under her fingers. The Codex editor keeps no
  // drafts, so an open editor is never reloaded.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let pending = false;
  const reloadIfHidden = () => {
    if (pending && document.visibilityState === 'hidden' && !editing()) location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // first install, already on the newest version
    pending = true;
    reloadIfHidden();
  });
  document.addEventListener('visibilitychange', reloadIfHidden);
}

export function forgetCachedData() {
  navigator.serviceWorker?.controller?.postMessage('signed-out');
}
