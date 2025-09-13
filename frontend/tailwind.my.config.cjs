// tailwind.config.cjs  (GLOBAL, includes Flowbite)
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js", // 👈 Flowbite components
  ],
  theme: { extend: {} },
  plugins: [], // Flowbite v2 w/ Tailwind v4 works via CSS @import "flowbite"
};
