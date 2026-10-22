/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f7f3',
          100: '#e4eee6',
          200: '#d2e2d6',
          300: '#b7d0bf',
          400: '#9cbea9',
          500: '#86a994',
          600: '#6f9382',
          700: '#5d806f',
          800: '#496c5b',
          900: '#3a594a',
          950: '#263b30',
        },
      },
      fontFamily: {
        sans: ['Times New Roman', 'Times', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
