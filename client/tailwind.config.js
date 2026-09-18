/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0a0a0c',
          card: '#121216',
          elevated: '#18181e',
          hover: '#22222a',
          border: '#1f1f26',
          'border-subtle': '#16161b',
          'border-highlight': '#2e2e38',
        },
        linear: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'speaking-ring': 'speakingRing 1.4s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'tile-in': 'tileIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        speakingRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6,182,212,0.7)' },
          '50%': { boxShadow: '0 0 0 4px rgba(6,182,212,0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tileIn: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'video-tile': '0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
