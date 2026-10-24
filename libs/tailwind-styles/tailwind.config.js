/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,js,jsx,tsx}',
    '../../apps/**/*.{html,ts,js,jsx,tsx}',
    '../../libs/**/*.{html,ts,js,jsx,tsx}',
  ],
  prefix: 'tw-', // Important: prefix to avoid conflicts with Bootstrap
  theme: {
    extend: {},
  },
  plugins: [],
  // Ensure Tailwind doesn't override Bootstrap's base styles aggressively
  corePlugins: {
    preflight: false, // Disable preflight to avoid conflicts with Bootstrap's reset
  },
}
