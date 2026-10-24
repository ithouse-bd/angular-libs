/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  // Prefix avoids conflicts with Bootstrap classes used by the demo app.
  prefix: 'tw-',
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // Keep Bootstrap's reset in charge of base styles.
    preflight: false,
  },
};
