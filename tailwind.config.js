/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mobile-first breakpoints (default is mobile, scale up)
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        // Quantum Theme Colors
        quantum: {
          black: '#0a0a0f',
          dark: '#13141f',
          darker: '#1a1b28',
          card: '#1e1f2e',
          border: '#2a2b3d',
          cyan: '#00ffff',
          blue: '#0080ff',
          purple: '#8b5cf6',
          pink: '#ff0080',
          green: '#00ff88',
          gold: '#ffd700',
          red: '#ff0040',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.3)',
          cyan: 'rgba(0, 255, 255, 0.1)',
          purple: 'rgba(139, 92, 246, 0.1)',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        jetbrains: ['JetBrains Mono', 'monospace'],
        exo: ['Exo 2', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-quantum': 'linear-gradient(135deg, #00ffff, #0080ff, #8b5cf6)',
        'gradient-glow': 'linear-gradient(45deg, rgba(0,255,255,0.1), rgba(139,92,246,0.1))',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'gradient-5d': 'linear-gradient(180deg, rgba(0,255,255,0.05) 0%, rgba(139,92,246,0.05) 50%, rgba(255,0,128,0.05) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 255, 255, 0.1)',
        'glass-lg': '0 16px 64px 0 rgba(0, 255, 255, 0.15)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
        'quantum': '0 0 20px rgba(0, 255, 255, 0.5)',
        'quantum-lg': '0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(139, 92, 246, 0.5)',
        'neon-cyan': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        'neon-purple': '0 0 10px #8b5cf6, 0 0 20px #8b5cf6, 0 0 30px #8b5cf6',
        '5d': '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 255, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
        '5d': '40px',
      },
      animation: {
        'quantum-pulse': 'quantumPulse 2s ease-in-out infinite',
        'quantum-spin': 'quantumSpin 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'gradient-shift': 'gradientShift 10s ease-in-out infinite',
        'particle': 'particle 20s linear infinite',
        'holographic': 'holographic 3s ease-in-out infinite',
      },
      keyframes: {
        quantumPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        quantumSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(139, 92, 246, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        particle: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
        },
        holographic: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(30deg)',
          },
        },
      },
      // Mobile-first touch targets
      spacing: {
        'touch': '44px', // Apple's recommended touch target
        'touch-lg': '48px',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
