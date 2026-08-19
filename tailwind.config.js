/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Green & Gold theme from image palette
        // 1: #0B1914 (Darkest charcoal forest green - Main background)
        // 2: #143028 (Dark pine green - Cards / Dark containers)
        // 3: #1B432C (Deep forest green - Elevated card / hover surface)
        // 4: #2C5E3B (Emerald green - Accent borders / highlights)
        // 5: #C69234 (Warm Amber Gold - Highlights / Primary CTAs)
        // 6: #A65D29 (Warm Copper Rust - Secondary accents / Badges)

        forest: {
          darkest: '#0B1914',
          dark: '#143028',
          DEFAULT: '#1B432C',
          light: '#2C5E3B',
          emerald: '#3A7D50',
          sage: '#A3C2B2',
          lightest: '#E8F3EE',
        },
        gold: {
          light: '#F5D77F',
          DEFAULT: '#C69234',
          dark: '#9E7220',
        },
        copper: {
          light: '#C77A44',
          DEFAULT: '#A65D29',
          dark: '#7D431B',
        },
        sage: '#A3C2B2',
        olive: '#2C5E3B',
        cream: '#E8F3EE',
        moss: '#1B432C',
        neon: {
          teal: '#C69234',
          gold: '#C69234',
          rose: '#A65D29',
        },
        // Mapping violet color classes used in components so they map smoothly to the green/gold design
        violet: {
          deep: '#0B1914',
          DEFAULT: '#C69234',
          mauve: '#2C5E3B',
          lavender: '#A3C2B2',
          light: '#E8F3EE',
          50: '#F0F7F4',
          100: '#E8F3EE',
          200: '#CBE0D6',
          300: '#A3C2B2',
          400: '#5C9672',
          500: '#2C5E3B',
          600: '#C69234',
          700: '#1B432C',
          750: '#A65D29',
          800: '#143028',
          900: '#A3C2B2',
          950: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in': 'slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(198, 146, 52, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(198, 146, 52, 0.7)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(60px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '4rem',
        '7xl': '5rem',
      },
    },
  },
  plugins: [],
}
