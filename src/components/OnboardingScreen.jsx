import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMatch } from '../state/MatchContext';

/**
 * OnboardingScreen — full-screen "What's your name?" overlay for FamiliMatch.
 *
 * Props:
 *   onComplete: () => void — called after the user submits their name.
 *
 * Wraps in <motion.div> so parent can use <AnimatePresence> for exit animation.
 */
export default function OnboardingScreen({ onComplete }) {
  const { setUserName } = useMatch();
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    onComplete();
  };

  const canContinue = name.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        {/* Brand mark */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)' }}
        >
          ✨
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          What's your name?
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          We'll use it to personalise your results
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            className="
              w-full px-4 py-3.5 rounded-xl text-center text-lg font-semibold
              text-white placeholder-gray-600 outline-none
              transition-all duration-200
              focus:ring-2 focus:ring-brand-blue/50
            "
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              minHeight: '44px',
            }}
          />

          <button
            type="submit"
            disabled={!canContinue}
            className="
              w-full py-3.5 rounded-xl font-bold text-base text-white
              transition-all duration-200 active:scale-[0.97]
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            style={{
              background: canContinue
                ? 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)'
                : 'rgba(255,255,255,0.08)',
              minHeight: '44px',
            }}
          >
            Continue
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
