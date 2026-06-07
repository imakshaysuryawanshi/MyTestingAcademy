/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        jp: {
          cyan: '#22d3ee',
          purple: '#818cf8',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
