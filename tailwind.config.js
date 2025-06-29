/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'maroon': '#8B0000', // Dark red/maroon color
      },
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        autumn: {
          ...require("daisyui/src/theming/themes")["autumn"],
        },
      },
      "light",
      // "dark",
      // "corporate"
    ],
    darkMode: ["class", '[data-theme="autumn"]'],
    darkTheme: "autumn",
  }
}
