(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) {
    return;
  }
  const icon = toggle.querySelector('.theme-toggle__icon');

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    toggle.setAttribute('aria-pressed', theme === 'light');
    toggle.setAttribute('aria-label', theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro');
    if (icon) {
      icon.textContent = theme === 'light' ? 'light_mode' : 'dark_mode';
    }
  };

  const stored = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initialTheme = stored || (prefersLight ? 'light' : 'dark');
  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
})();
