// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ v4-compatible PostCSS plugin
    autoprefixer: {},
  },
};
