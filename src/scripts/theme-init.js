// Inlined in <head>: resolve appearance before CSS/first paint, without hydration.
(() => {
  const root = document.documentElement;
  const key = 'knowledge-atlas:theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  const valid = (value) => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try {
    const stored = localStorage.getItem(key);
    if (valid(stored)) preference = stored;
  } catch { /* System appearance also works when storage is unavailable. */ }

  const apply = () => {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', theme === 'dark' ? '#1b1d22' : '#ffffff');
    });
    document.dispatchEvent(new Event('atlas:themechange'));
  };
  document.addEventListener('atlas:themechoose', (event) => {
    if (!valid(event.detail)) return;
    preference = event.detail;
    try {
      localStorage.setItem(key, preference);
      delete root.dataset.themeTemporary;
    } catch { root.dataset.themeTemporary = 'true'; }
    apply();
  });
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    delete root.dataset.themeTemporary;
    apply();
  });
  apply();
})();
