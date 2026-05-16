/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#dac7be',
          400: '#c7a392',
          500: '#b48169',
          600: '#a3745f',
          700: '#87604f',
          800: '#6d4e40',
          900: '#594035',
          950: '#2f211c',
        },
        accent: {
          50: '#fffafb',
          100: '#feeff3',
          200: '#fde0e9',
          300: '#fbc2d4',
          400: '#f891b0',
          500: '#f1628d',
          600: '#de3d6e',
          700: '#ba2b56',
          800: '#9a274a',
          900: '#822442',
          950: '#491021',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
