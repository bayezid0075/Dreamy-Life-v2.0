/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#fcf9f8',
        outline: '#76777b',
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#45474b',
        'on-primary': '#ffffff',
        primary: '#5d5e64',
        tertiary: '#2d666d',
        'primary-container': '#f8f8ff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        error: '#ba1a1a',
        'surface-container-lowest': '#ffffff',
      },
    },
  },
  plugins: [],
};
