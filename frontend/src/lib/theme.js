const KEY = 'pustarasa_theme';

export function getTheme() {
  return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

/** Call once before the app renders to avoid a flash of the wrong theme. */
export function initTheme() {
  applyTheme(getTheme());
}
