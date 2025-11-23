/**
 * CLUES Property Dashboard - Loading Screen
 * Quantum-themed loading animation
 */

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-quantum-black">
      <div className="flex flex-col items-center gap-6">
        {/* Quantum Loader Rings */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-quantum-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent border-t-quantum-blue"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-transparent border-t-quantum-purple"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center dot */}
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-quantum"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Loading text */}
        <motion.p
          className="font-orbitron text-sm uppercase tracking-widest text-quantum-cyan"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          Quantum Loading...
        </motion.p>
      </div>
    </div>
  );
}
