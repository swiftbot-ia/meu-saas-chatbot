/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Verde Neon (CTA Principal)
        'swiftbot-green': {
          DEFAULT: '#00FF99',
          light: '#1AF7B0',
          dark: '#00E88C',
          darker: '#00D97F'
        },
        // Backgrounds
        'swiftbot-bg': {
          primary: '#000000',
          secondary: '#0A0A0A',
          tertiary: '#121212',
          card: 'rgba(255, 255, 255, 0.05)',
          'card-hover': 'rgba(255, 255, 255, 0.07)'
        },
        // Borders
        'swiftbot-border': {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', fontWeight: '300' }],
        'hero-lg': ['5rem', { lineHeight: '1.1', fontWeight: '300' }],
        'hero-xl': ['6rem', { lineHeight: '1.05', fontWeight: '300' }]
      },
      borderRadius: {
        'swiftbot': '24px',
        'swiftbot-lg': '32px',
        'swiftbot-xl': '48px'
      },
      backdropBlur: {
        'swiftbot': '12px'
      },
      boxShadow: {
        'glow-green': '0 0 40px rgba(0, 255, 153, 0.4)',
        'glow-green-lg': '0 0 60px rgba(0, 255, 153, 0.6)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.3)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.3)'
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.8s ease-out forwards'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 153, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 153, 0.6)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-swiftbot': 'linear-gradient(135deg, #00FF99 0%, #00E88C 50%, #00D97F 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'gradient-cyan-blue': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'gradient-hero': 'linear-gradient(180deg, rgba(147, 51, 234, 0.2) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 1) 100%)'
      }
    },
  },
  plugins: [],
}