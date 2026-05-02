export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        vault: {
          black: '#05050a',
          dark: '#0d0d1a',
          card: '#0f1020',
          blue: '#3b82f6',
          purple: '#7c3aed',
          cyan: '#06b6d4',
          green: '#10b981',
        }
      },
      animation: {
        'orb-1': 'orb1 20s ease-in-out infinite',
        'orb-2': 'orb2 25s ease-in-out infinite',
        'orb-3': 'orb3 18s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'scan': 'scan 4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
      },
      keyframes: {
        orb1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(60px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.95)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-80px, 50px) scale(1.15)' },
        },
        orb3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '40%': { transform: 'translate(50px, -60px) scale(0.9)' },
          '80%': { transform: 'translate(-20px, 40px) scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%, 90%': { opacity: '1' },
          '50%': { transform: 'translateY(400px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: []
};
