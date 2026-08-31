/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: 'rgba(255, 255, 255, 0.4)',
        border: 'rgba(255, 255, 255, 0.9)',
        ink: '#1D1D1F',
        muted: '#6E6E73',
        accent: '#C9A66B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        glass: '48px',
      },
      boxShadow: {
        glass:
          '0 20px 60px rgba(29, 29, 31, 0.10), inset 0 1px 1px rgba(255,255,255,1), inset 0 0 0 1px rgba(255,255,255,0.6)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -30px) scale(1.05)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        driftA: 'drift 14s ease-in-out infinite',
        driftB: 'drift 18s ease-in-out infinite reverse',
        wobble: 'wobble 0.15s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}