import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      colors: {
        brutal: {
          bg: '#0a0a0a',
          fg: '#e5e5e5',
          accent: '#00ff00', // Terminal Green
          danger: '#ff003c', // Cyber Red
          warn: '#fcee0a',   // Hazard Yellow
          border: '#ffffff',
        }
      },
      boxShadow: {
        'brutal': '6px 6px 0px 0px #ffffff',
        'brutal-red': '6px 6px 0px 0px #ff003c',
        'brutal-green': '6px 6px 0px 0px #00ff00',
      }
    },
  },
  plugins: [],
};
export default config;
