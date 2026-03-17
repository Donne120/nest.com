/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven brand palette — overridden at runtime per org
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        // Layered, realistic shadows
        'card':     '0 1px 2px rgba(80,40,10,0.07), 0 1px 3px rgba(80,40,10,0.1)',
        'card-md':  '0 2px 4px rgba(80,40,10,0.06), 0 4px 12px rgba(80,40,10,0.08)',
        'elevated': '0 4px 6px rgba(80,40,10,0.05), 0 10px 20px rgba(80,40,10,0.08)',
        'float':    '0 8px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.06)',
        'modal':    '0 0 0 1px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.1), 0 24px 60px rgba(0,0,0,0.12)',
        'glow':     '0 0 0 3px rgb(var(--brand-500) / 0.15)',
        'glow-lg':  '0 0 20px rgb(var(--brand-500) / 0.25), 0 0 60px rgb(var(--brand-500) / 0.1)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.08)',
        'brand':    '0 4px 14px rgb(var(--brand-600) / 0.35)',
      },
      animation: {
        'pulse-once':  'pulse 0.6s ease-in-out 1',
        'fade-in':     'fadeIn 0.2s ease-out',
        'fade-in-up':  'fadeInUp 0.3s ease-out',
        'slide-in':    'slideIn 0.25s ease-out',
        'slide-up':    'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':     'shimmer 1.6s infinite linear',
        'float':       'float 3s ease-in-out infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgb(var(--brand-500) / 0.2)' },
          '50%':      { boxShadow: '0 0 20px rgb(var(--brand-500) / 0.4)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
