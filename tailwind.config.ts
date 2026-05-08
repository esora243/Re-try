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
      }
    }
  },
  plugins: []
};

export default config;
