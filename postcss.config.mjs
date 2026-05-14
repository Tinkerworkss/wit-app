// @tailwindcss/postcss is a devDependency installed in CI via npm ci.
// This config enables Tailwind v4 PostCSS processing in production builds.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
