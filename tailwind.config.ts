/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f7f3ec',
        parchment: '#efe9de',
        ink: '#16130f',
        graphite: '#57514a',
        muted: '#8a8279',
        hairline: '#e2dad0',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': '#ffffff',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: { shell: '80rem' },
      letterSpacing: { tightest: '-0.045em' },
      boxShadow: {
        lift: '0 18px 40px -24px rgba(22, 19, 15, 0.45)',
        card: '0 1px 0 0 rgba(22,19,15,0.04)',
      },
    },
  },
  plugins: [],
};
