module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: '#0a0f1e',
        card: '#0d1526',
        elevated: '#111827',
        border: '#1e2d45',
        accent: '#00d4aa',
        'accent-dim': 'rgba(0,212,170,0.15)',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'system-ui'],
      },
    }
  },
  plugins: []
}
