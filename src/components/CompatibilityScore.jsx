import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CompatibilityScore({ percentage, chemistryLabel, chemistryColor }) {
  const [displayPct, setDisplayPct] = useState(0);

  // Animate from 0 to final percentage
  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1500;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(eased * percentage));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPct / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={chemistryColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: chemistryColor }}>
            {displayPct}%
          </span>
        </div>
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="text-center"
      >
        <p
          className="text-xl font-bold"
          style={{ color: chemistryColor }}
        >
          {chemistryLabel}
        </p>
      </motion.div>
    </motion.div>
  );
}
