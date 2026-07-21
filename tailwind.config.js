/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /* ── KAIwa original palette (preserved) ───────────────── */
      colors: {
        paper: '#FAF7F0',
        ink: '#1C1C1C',
        shu: '#D6432B',
        ai: '#2F4858',
        mustard: '#F2C14E',
        moss: '#4A7A63',

        /* ── Neobrutalism semantic tokens ──────────────────── */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        main: 'var(--main)',
        'main-foreground': 'var(--main-foreground)',
        'secondary-background': 'var(--secondary-background)',
        overlay: 'var(--overlay)',
      },

      borderColor: {
        border: 'var(--border)',
      },

      ringColor: {
        ring: 'var(--ring)',
      },

      borderRadius: {
        base: 'var(--border-radius)',
      },

      boxShadow: {
        brutal: '8px 8px 0 #1C1C1C',
        red: '8px 8px 0 #D6432B',
        indigo: '8px 8px 0 #2F4858',
        mustard: '8px 8px 0 #F2C14E',
        shadow: 'var(--box-shadow-x) var(--box-shadow-y) 0px 0px var(--border)',
        nav: '3px 3px 0px 0px var(--border)',
      },

      translate: {
        boxShadowX: 'var(--box-shadow-x)',
        boxShadowY: 'var(--box-shadow-y)',
        reverseBoxShadowX: 'var(--reverse-box-shadow-x)',
        reverseBoxShadowY: 'var(--reverse-box-shadow-y)',
      },

      fontWeight: {
        heading: 'var(--heading-font-weight)',
        base: 'var(--base-font-weight)',
      },

      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
