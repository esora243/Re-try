import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          50: '#f3f6fb',
          100: '#dfe8f6',
          200: '#bfd1ed',
          300: '#8cb0df',
          400: '#598aca',
          500: '#3b70b3',
          600: '#2d578d',
          700: '#23436d',
          800: '#1B2A4A',
          900: '#0F1D35'
        },
        gold: {
          DEFAULT: '#C8A951',
          50: '#fff9ea',
          100: '#fdf0c8',
          200: '#f8df8b',
          300: '#f1cb61',
          400: '#deb244',
          500: '#C8A951',
          600: '#a88831',
          700: '#866a26',
          800: '#66501f',
          900: '#433516'
        },
        beige: '#FFF8F0'
      },
      boxShadow: {
        soft: '0 10px 35px rgba(15, 29, 53, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
