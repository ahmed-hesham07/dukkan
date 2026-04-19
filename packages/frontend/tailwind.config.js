/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Cairo', 'sans-serif'],
        arabic: ['Cairo', 'Inter', 'sans-serif'],
      },
      colors: {
        // Core dark surfaces
        bg:       '#080810',
        surface:  '#0f0f1e',
        card:     '#14142a',
        border:   '#1e1e3a',
        // Brand gradient stops
        primary: {
          DEFAULT: '#7c3aed',
          light:   '#a855f7',
          dark:    '#5b21b6',
        },
        accent:   '#06b6d4',
        pink:     '#f72585',
        // Semantic
        danger:   '#f72585',
        success:  '#10b981',
        warning:  '#f59e0b',
        // Text
        ink:      '#ffffff',
        muted:    'rgba(255,255,255,0.45)',
        subtle:   'rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        'grad-primary':  'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #06b6d4 100%)',
        'grad-danger':   'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
        'grad-success':  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'grad-card':     'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        'grad-header':   'linear-gradient(135deg, #1a0533 0%, #0d0d2b 50%, #001133 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)',
        'glow-accent':  '0 0 20px rgba(6,182,212,0.4)',
        'glow-danger':  '0 0 20px rgba(247,37,133,0.4)',
        'glow-success': '0 0 20px rgba(16,185,129,0.4)',
        'glow-sm':      '0 0 10px rgba(124,58,237,0.25)',
        'glass':        '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-hover':  '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        'card':         '0 4px 24px rgba(0,0,0,0.35)',
        'card-hover':   '0 8px 32px rgba(124,58,237,0.2)',
      },
      borderRadius: {
        '2xl':  '16px',
        '3xl':  '20px',
        '4xl':  '28px',
      },
      animation: {
        'slide-down':   'slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up':     'slideUp 0.3s ease-out',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
        'fade-in':      'fadeIn 0.25s ease-out',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
