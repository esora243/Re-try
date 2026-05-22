import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1F3A8A',
          900: '#1B2A4A'
        },
        cream: {
          50: '#FFFCF5',
          100: '#FFF6E0'
        },
        gold: {
          50: '#FFF7E1',
          100: '#FCE8B6',
          200: '#F5D27A',
          900: '#7A5800'
        },
        sky: {
          50: '#EEF6FF',
          100: '#DBEAFE'
        }
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
        card: '0 4px 16px rgba(15, 23, 42, 0.06)'
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px'
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        ripple: {
          to: { transform: 'scale(2.5)', opacity: '0' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        ripple: 'ripple 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.35s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.25s ease-out'
      }
    }
  },
  plugins: []
};

export default config;
