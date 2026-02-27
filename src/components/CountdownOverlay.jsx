import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Background gradient shifts per count number
const BG_GRADIENTS = [
  'from-violet-950 via-purple-950 to-black',   // 3
  'from-purple-950 via-pink-950 to-black',      // 2
  'from-pink-950 via-rose-950 to-black',        // 1
];

// Number text gradient per count
const NUM_GRADIENTS = [
  'from-violet-300 via-purple-200 to-pink-300',
  'from-pink-300 via-rose-200 to-orange-300',
  'from-rose-300 via-orange-200 to-amber-300',
];

export default function CountdownOverlay({ seconds, onComplete }) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) { onComplete?.(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  const bgIdx  = Math.max(0, Math.min(count - 1, BG_GRADIENTS.length - 1));
  const numIdx = Math.max(0, Math.min(count - 1, NUM_GRADIENTS.length - 1));

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center pt-[env(safe-area-inset-top,8px)] pb-[env(safe-area-inset-bottom,8px)] bg-gradient-to-b ${BG_GRADIENTS[bgIdx]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="popLayout">
          {count > 0 && [0, 1, 2].map(i => (
            <motion.div
              key={`${count}-ring-${i}`}
              className="absolute rounded-full border border-white/20"
              initial={{ width: 96, height: 96, opacity: 0.55 }}
              animate={{ width: 520, height: 520, opacity: 0 }}
              transition={{ duration: 1.4, delay: i * 0.22, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Number / Reveal */}
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            className="relative z-10 text-center select-none"
            initial={{ scale: 0.35, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{    scale: 1.7,  opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            {/* Glow layer */}
            <span
              aria-hidden
              className={`
                absolute inset-0 flex items-center justify-center
                text-[140px] font-black leading-none
                bg-gradient-to-b ${NUM_GRADIENTS[numIdx]} bg-clip-text text-transparent
                blur-2xl opacity-40 scale-110
              `}
            >
              {count}
            </span>

            {/* Sharp layer */}
            <span className={`
              relative block text-[140px] font-black leading-none
              bg-gradient-to-b ${NUM_GRADIENTS[numIdx]} bg-clip-text text-transparent
            `}>
              {count}
            </span>

            <p className="mt-3 text-xs text-white/30 uppercase tracking-[0.35em] font-semibold">
              Get Ready
            </p>
          </motion.div>

        ) : (
          <motion.div
            key="reveal"
            className="relative z-10 text-center select-none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
          >
            {/* Gold pulse glow */}
            <motion.span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-5xl font-black text-gradient-gold blur-xl opacity-60"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              REVEAL!
            </motion.span>

            <motion.span
              className="relative block text-5xl font-black text-gradient-gold"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              REVEAL!
            </motion.span>

            <p className="mt-4 text-xs text-white/30 uppercase tracking-[0.35em] font-semibold">
              Results incoming…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
