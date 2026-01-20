/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vs-bg': '#1e1e1e',
        'vs-sidebar': '#252526',
        'vs-activity': '#333333',
        'vs-status': '#007acc',
        'vs-terminal': '#1e1e1e',
        'vs-text': '#cccccc',
        'vs-text-muted': '#858585',
        'vs-border': '#3c3c3c',
        'vs-accent': '#0e639c',
        'vs-success': '#4ec9b0',
        'vs-warning': '#dcdcaa',
        'vs-error': '#f14c4c',
        'vs-info': '#3794ff',
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
