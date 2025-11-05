/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#d9eaff",
          200: "#b0d3ff",
          300: "#84b8ff",
          400: "#5697ff",
          500: "#377dff",
          600: "#245eff",
          700: "#1d4de6",
          800: "#173db5",
          900: "#112c82",
        },
      },
    },
  },
  plugins: [],
};
