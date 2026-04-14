/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF6B00',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        secondary: {
          50: 'rgb(var(--c-s-50) / <alpha-value>)',
          100: 'rgb(var(--c-s-100) / <alpha-value>)',
          200: 'rgb(var(--c-s-200) / <alpha-value>)',
          300: 'rgb(var(--c-s-300) / <alpha-value>)',
          400: 'rgb(var(--c-s-400) / <alpha-value>)',
          500: 'rgb(var(--c-s-500) / <alpha-value>)',
          600: 'rgb(var(--c-s-600) / <alpha-value>)',
          700: 'rgb(var(--c-s-700) / <alpha-value>)',
          800: 'rgb(var(--c-s-800) / <alpha-value>)',
          900: 'rgb(var(--c-s-900) / <alpha-value>)',
          950: 'rgb(var(--c-s-950) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--c-fg) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
