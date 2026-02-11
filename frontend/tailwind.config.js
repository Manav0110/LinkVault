/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Space Mono"', 'monospace'],
        'body': ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        vault: {
          bg: '#0a0a0f',
          card: '#13131a',
          border: '#1e1e28',
          accent: '#00ff9d',
          'accent-dark': '#00cc7d',
          text: '#e8e8f0',
          'text-dim': '#a0a0b8',
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 157, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}