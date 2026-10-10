/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pitstop: {
          yellow: '#F7B928',
          'yellow-dark': '#D99B10',
          'yellow-light': '#FEF5DC',
          charcoal: '#202124',
          muted: '#686868',
          border: '#E3E5E8',
          bg: '#F4F6F8',
          white: '#FFFFFF',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(32, 33, 36, 0.06), 0 1px 2px rgba(32, 33, 36, 0.04)',
        card: '0 4px 6px -1px rgba(32, 33, 36, 0.06), 0 2px 4px -1px rgba(32, 33, 36, 0.03)',
      },
    },
  },
  plugins: [],
};
