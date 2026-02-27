import { useState, useEffect } from 'react';

const BRAND_HUB_URL = import.meta.env.VITE_BRAND_HUB_URL || 'http://localhost:5173';
const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';

function reversePortalTransition(gradient, onNavigate) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '9999', pointerEvents: 'none',
    background: `radial-gradient(ellipse at 50% 44%, rgba(255,255,255,0.16) 0%, transparent 62%), ${gradient}`,
    opacity: '0', transform: 'scale(1)', borderRadius: '0',
    willChange: 'opacity, transform, border-radius',
    transition: 'opacity 0.12s ease',
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
  setTimeout(() => {
    Object.assign(overlay.style, {
      transition: [
        'opacity 0.4s ease-out',
        'transform 0.45s cubic-bezier(0, 0, 0.6, 1)',
        'border-radius 0.45s ease',
      ].join(', '),
      opacity: '0', transform: 'scale(0)', borderRadius: '50%',
    });
    setTimeout(() => { onNavigate(); setTimeout(() => overlay.remove(), 100); }, 430);
  }, 120);
}
import { useNavigate } from 'react-router-dom';
import { Users, User, UsersRound, Sparkles, Zap, Heart, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConsent } from '../state/ConsentContext';
import { useMatch } from '../state/MatchContext';
import ConsentModal from '../components/ConsentModal';
import { analytics } from '../utils/analytics';

const MODE_CARDS = [
  {
    id: 'solo',
    title: 'Solo',
    description: 'Upload two photos, see your compatibility instantly',
    icon: User,
    path: '/solo',
    color: '#8B5CF6',
    gradient: 'from-violet-600/20 to-violet-900/10',
    badge: 'Instant',
  },
  {
    id: 'duo',
    title: 'Duo',
    description: 'Compare face-to-face in real-time with a friend',
    icon: Users,
    path: '/room',
    color: '#EC4899',
    gradient: 'from-pink-600/20 to-pink-900/10',
    badge: 'Live',
  },
  {
    id: 'group',
    title: 'Group',
    description: '3-6 players — find who is the closest match',
    icon: UsersRound,
    path: '/room',
    color: '#FFD700',
    gradient: 'from-yellow-500/20 to-yellow-900/10',
    badge: 'Party',
  },
];

const SEED = 12847;
function useComparisonCount() {
  const [count, setCount] = useState(SEED);
  useEffect(() => {
    const tick = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(tick);
  }, []);
  return count.toLocaleString();
}

function Orb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { consent } = useConsent();
  const { setMode } = useMatch();
  const [showConsent, setShowConsent] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const count = useComparisonCount();

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  const handleSelect = (card) => {
    if (!consent.bipaConsented) {
      setPendingMode(card);
      setShowConsent(true);
      return;
    }
    setMode(card.id);
    navigate(card.path);
  };

  const handleConsented = () => {
    setShowConsent(false);
    if (pendingMode) {
      setMode(pendingMode.id);
      navigate(pendingMode.path);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
    >
      {/* Branded header bar */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 20, width: '100%',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0A0F',
        }}
      >
        <button
          onClick={() => reversePortalTransition(FAMILIMATCH_GRADIENT, () => { window.location.href = BRAND_HUB_URL; })}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ffffff', padding: 0,
          }}
        >
          <ChevronLeft size={20} color="rgba(255,255,255,0.6)" />
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: FAMILIMATCH_GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>
            FamiliMatch
          </div>
        </button>
      </header>

      <Orb className="w-96 h-96 bg-violet-600/10 top-[-80px] left-[-60px]" />
      <Orb className="w-64 h-64 bg-pink-500/10 top-32 right-[-40px]" />

      {/* ── ABOVE FOLD ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full mt-8">

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10"
        >
          <Sparkles size={13} className="text-violet-400" />
          <span className="text-xs text-violet-300 font-medium tracking-wide">AI Facial Compatibility</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-4xl md:text-5xl font-extrabold leading-tight mb-4"
        >
          <span className="text-gradient-violet">How Compatible</span>
          <br />
          <span className="text-white">Are You?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-400 text-base md:text-lg mb-8 max-w-sm leading-relaxed"
        >
          Our AI analyses 8 facial features to discover your facial compatibility in seconds.
        </motion.p>

        {/* Illustration cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="flex gap-4 mb-8"
        >
          {['A', 'B'].map((letter) => (
            <div
              key={letter}
              className="w-28 h-28 rounded-2xl flex items-center justify-center border border-violet-500/20"
              style={{ background: 'rgba(139,92,246,0.08)' }}
            >
              <User size={36} className="text-violet-400/40" />
            </div>
          ))}
          <div
            className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center border border-pink-500/20 gap-1"
            style={{ background: 'rgba(236,72,153,0.08)' }}
          >
            <Heart size={22} className="text-pink-400/50" />
            <span className="text-xs text-pink-400/60 font-bold">78%</span>
            <span className="text-[9px] text-pink-400/40">Magnetic Match</span>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelect(MODE_CARDS[0])}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg text-black flex items-center justify-center gap-2 mb-4"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
            boxShadow: '0 8px 32px rgba(139,92,246,0.40)',
          }}
        >
          <Zap size={20} />
          Try It Now — Free
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-xs text-gray-600"
        >
          {count} comparisons made
        </motion.p>
      </div>

      {/* ── BELOW FOLD — MODE CARDS ── */}
      <div className="relative z-10 w-full max-w-2xl mt-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center mb-6"
        >
          Choose your mode
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + 0.1 * i, duration: 0.45 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(card)}
                className={`relative rounded-2xl p-5 text-left border transition-all duration-200 bg-gradient-to-br ${card.gradient} border-gray-800 group overflow-hidden`}
              >
                <span
                  className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${card.color}22`, color: card.color }}
                >
                  {card.badge}
                </span>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}18` }}
                >
                  <Icon size={22} style={{ color: card.color }} />
                </div>
                <h3 className="text-base font-bold mb-1 text-white">{card.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{card.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-12 flex gap-6 text-xs text-gray-700">
        <a href="/privacy" className="hover:text-gray-500 transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-gray-500 transition-colors">Terms</a>
      </div>

      {showConsent && <ConsentModal onConsented={handleConsented} />}
    </div>
  );
}
