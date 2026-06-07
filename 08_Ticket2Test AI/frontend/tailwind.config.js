/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable dark mode manually
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-bright': 'rgb(var(--color-surface-bright) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--color-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--color-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--color-surface-container-highest) / <alpha-value>)',
        
        on_surface: 'rgb(var(--color-on-surface) / <alpha-value>)',
        on_surface_variant: 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primary_container: 'rgb(var(--color-primary-container) / <alpha-value>)',
        on_primary: 'rgb(var(--color-on-primary) / <alpha-value>)',
        
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        secondary_container: 'rgb(var(--color-secondary-container) / <alpha-value>)',
        on_secondary_container: 'rgb(var(--color-on-secondary-container) / <alpha-value>)',
        
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        
        error: 'rgb(var(--color-error) / <alpha-value>)',
        error_container: 'rgb(var(--color-error-container) / <alpha-value>)',
        
        outline_variant: 'rgb(var(--color-outline-variant) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 12px 24px -4px rgba(4, 27, 60, 0.04)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-container)) 100%)',
      }
    },
  },
  plugins: [],
}
