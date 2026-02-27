import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useMatch } from '../state/MatchContext';

/**
 * Lightweight onboarding — one screen, name input only.
 * Name is stored in sessionStorage via MatchContext.setUserName.
 * Call onComplete() when the user is ready to proceed.
 */
export default function OnboardingScreen({ onComplete }) {
  const { setUserName } = useMatch();
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    onComplete?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center px-4 pt-[env(safe-area-inset-top,8px)] pb-[env(safe-area-inset-bottom,8px)]"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 80%, #0A0A0F 100%)' }}
    >
      {/* Ambient orb */}
      <div className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none bg-violet-600/12 top-24 right-8" />
      <div className="absolute w-48 h-48 rounded-full blur-3xl pointer-events-none bg-pink-500/10 bottom-32 left-4" />

      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            <Sparkles size={28} className="text-violet-400" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-extrabold text-white text-center mb-2">
          What should we call you?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          This is just for your results — we don&apos;t create accounts or store your data.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
            className="w-full px-4 py-4 rounded-xl text-white placeholder-gray-600 text-base outline-none focus:ring-2 focus:ring-violet-500/60 transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          />

          <motion.button
            type="submit"
            disabled={!name.trim()}
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.97 } : {}}
            className="w-full py-4 rounded-xl font-bold text-base text-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
              boxShadow: name.trim() ? '0 6px 24px rgba(139,92,246,0.35)' : 'none',
            }}
          >
            Let&apos;s Go
            <ArrowRight size={18} />
          </motion.button>
        </form>

        {/* Skip link */}
        <button
          type="button"
          onClick={() => {
            setUserName('');
            onComplete?.();
          }}
          className="w-full mt-4 text-xs text-gray-600 hover:text-gray-400 transition-colors text-center"
        >
          Skip for now
        </button>
      </motion.div>
    </motion.div>
  );
}
