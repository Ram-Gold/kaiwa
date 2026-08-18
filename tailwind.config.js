/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      /* ── KAIwa original palette (preserved) ───────────────── */
      colors: {
        paper: '#FAF7F0',
        ink: '#1C1C1C',
        shu: '#D6432B',
        correction: '#D6432B',
        ai: '#2F4858',
        aizome: '#2F4858',
        mustard: '#F2C14E',
        moss: '#4A7A63',
        'soft-blue': '#9FD3C7',
        blush: '#F7B7A3',

        /* ── Neobrutalism semantic tokens ──────────────────── */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        main: 'var(--main)',
        'main-foreground': 'var(--main-foreground)',
        'secondary-background': 'var(--secondary-background)',
        overlay: 'var(--overlay)',

        /* ── Neubrutal Card colors ────────────────────────── */
        nbYellow: '#F2C14E',
        nbGreen: '#86EFAC',
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
        sans: ['"Atkinson Hyperlegible"', '"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        jp: ['"Noto Sans JP"', '"Hiragino Sans"', 'sans-serif'],
      },
      keyframes: {
        'stamp-slam': {
          '0%': { transform: 'scale(3)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'stamp-slam': 'stamp-slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
