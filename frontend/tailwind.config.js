/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Each token resolves through a CSS variable (see index.css) so the
        // `.dark` class can swap the whole palette without touching markup.
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        library: {
          DEFAULT: 'rgb(var(--color-library) / <alpha-value>)',
          soft: 'rgb(var(--color-library-soft) / <alpha-value>)',
          ink: 'rgb(var(--color-library-ink) / <alpha-value>)',
        },
        canteen: {
          DEFAULT: 'rgb(var(--color-canteen) / <alpha-value>)',
          soft: 'rgb(var(--color-canteen-soft) / <alpha-value>)',
          ink: 'rgb(var(--color-canteen-ink) / <alpha-value>)',
        },
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,27,46,0.04), 0 8px 24px -12px rgba(30,27,46,0.12)',
        pop: '0 12px 40px -8px rgba(30,27,46,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
