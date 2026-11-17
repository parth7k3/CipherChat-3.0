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
        cipher: {
          950: '#070a0f',
          900: '#0c1017',
          850: '#111722',
          800: '#182030',
          700: '#222f46',
          600: '#2f4160',
          500: '#415a84',
          400: '#6482b0',
          300: '#94aed3',
          200: '#cbd8eb',
          100: '#e7eef7',
          50: '#f5f8fc',
        },
        shield: {
          verified: '#10b981', // Emerald green
          unverified: '#f59e0b', // Amber
          danger: '#ef4444', // Red
          neutral: '#64748b', // Slate
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
