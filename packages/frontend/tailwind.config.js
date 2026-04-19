/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0f3460',
          light: '#16213e',
          dark: '#0a2540',
        },
        danger: '#e94560',
        success: '#27ae60',
        warning: '#f39c12',
        surface: '#f8f9fa',
      },
    },
  },
  plugins: [],
};
