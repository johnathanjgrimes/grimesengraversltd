/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,md,ts}', './public/js/**/*.js'],
  // Preflight is off because most existing markup uses inline styles migrated from the design.
  // New components can use Tailwind classes freely.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        navy: '#23263A', teal: '#3D5A5E', brand: '#C8202A', ink: '#1F2933', muted: '#4B5563', mist: '#F5F6F7',
      },
    },
  },
};
