module.exports = {
  content: ["./*.html", "./_includes/**/*.html", "./_layouts/**/*.html", "./_pages/*.md", "./_posts/**/*.md"],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    // require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    // require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
