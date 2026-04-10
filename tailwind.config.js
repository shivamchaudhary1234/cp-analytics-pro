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
        bg: {
          primary: '#0D1117',
          secondary: '#161B22',
          tertiary: '#1C2128',
          card: '#21262D',
          hover: '#30363D',
        },
        accent: {
          cyan: '#00D4FF',
          purple: '#7B2FBE',
          blue: '#1F6FEB',
          green: '#3FB950',
          orange: '#F0883E',
          red: '#F85149',
          yellow: '#D29922',
        },
        border: {
          default: '#30363D',
          muted: '#21262D',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#6E7681',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-cyan-purple': 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 100%)',
        'gradient-blue-cyan': 'linear-gradient(135deg, #1F6FEB 0%, #00D4FF 100%)',
        'gradient-dark': 'linear-gradient(135deg, #161B22 0%, #0D1117 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(33,38,45,0.8) 0%, rgba(22,27,34,0.8) 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-purple': '0 0 20px rgba(123, 47, 190, 0.15)',
        'card': '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 15px rgba(0,212,255,0.3)' }, '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.6)' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
