/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // MindBeat brand palette — keep these names, used everywhere in the app
        violet: {
          DEFAULT: '#6C3CE9',
          dark: '#4E24BE',
          light: '#EFE8FF'
        },
        sun: '#FFC93C',
        mint: '#2DD4A7',
        coral: '#FF6B5B',
        ink: '#1E1B2E',
        paper: '#FAF9FF'
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['Manrope', 'sans-serif']
      },
      borderRadius: {
        blob: '2rem 2rem 2rem 0.5rem'
      }
    }
  },
  plugins: []
}
