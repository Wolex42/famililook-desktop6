import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CountdownOverlay — full-screen countdown (3… 2… 1…) for FamiliMatch rooms.
 *
 * Props:
 *   seconds:    number         — starting countdown value (e.g. 3)
 *   onComplete: () => void     — called when countdown reaches 0
 *
 * FMEA-FM-008 fix: always renders a visible number (never a blank card).
 * The component maintains its own internal count so it never shows an empty state.
 */
export default function CountdownOverlay({ seconds, onComplete }) {
  const [count, setCount] = useState(Math.max(1, seconds));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count]);

  // Sync with external seconds prop (e.g. server-driven countdown)
  useEffect(() => {
    if (seconds > 0) setCount(seconds);
  }, [seconds]);

  // FMEA-FM-008: always show at least "1" — never render blank
  const displayNumber = Math.max(1, count);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={displayNumber}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
          <span
            className="font-extrabold tabular-nums"
            style={{
              fontSize: '120px',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {displayNumber}
          </span>
          <span className="text-sm font-medium text-white/40 tracking-wide uppercase">
            Get ready
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
