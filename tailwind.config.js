/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'lab-bg': '#1a1a2e',
        'lab-panel': '#16213e',
        'lab-accent': '#0f3460',
        'lab-danger': '#e94560',
        'lab-success': '#4ecca3',
        'lab-graph-bg': '#0a0a1a',
      },
    },
  },
  plugins: [],
};
