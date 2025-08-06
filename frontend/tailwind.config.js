/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f0f2f5',
      },
      boxShadow: {
        neu: '8px 8px 15px #d1d9e6, -8px -8px 15px #ffffff',
        'neu-sm': '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
        'neu-inset': 'inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff',
        'neu-hover': '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
      },
      borderColor: {
        neu: 'rgba(209, 217, 230, 0.5)',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        nunito: ['var(--font-nunito)'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
