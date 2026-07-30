/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f5',
          100: '#b3e8e2',
          500: '#1AAB97',
          600: '#158f7d',
          700: '#0f7363',
          900: '#0a4d42',
        },
      },
    },
  },
  plugins: [],
}
