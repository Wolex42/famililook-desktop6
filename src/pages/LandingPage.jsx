import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMatchHistory } from '../hooks/useMatchHistory';

const BRAND_HUB_URL = import.meta.env.VITE_BRAND_HUB_URL || 'http://localhost:5173';
const TIER_ORDER = { free: 0, plus: 1, pro: 2 };
const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';
import { Users, User, UsersRound, Sparkles, Zap, Heart, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConsent } from '../state/ConsentContext';
import { useMatch } from '../state/MatchContext';
import ConsentModal from '../components/ConsentModal';
import { analytics } from '../utils/analytics';
import { API_BASE, API_KEY } from '../utils/config';

const SUBSCRIBE_KEY = 'fl:email-captured';

function EmailCapture({ context, heading, subtext }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(() =>
    localStorage.getItem(SUBSCRIBE_KEY) ? 'already' : 'idle'
  );

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) { setStatus('invalid'); return; }
    setStatus('submitting');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST', headers,
        body: JSON.stringify({ email: trimmed, product: 'familimatch', context }),
      });
      if (res.ok) {
        setStatus('success');
        localStorage.setItem(SUBSCRIBE_KEY, JSON.stringify({ email: trimmed, ts: Date.now() }));
        analytics.trackEmailCaptured(context);
      } else { setStatus('error'); }
    } catch { setStatus('error'); } // eslint-disable-line no-empty
  }, [email, context]);

  if (status === 'already' || status === 'success') {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-gray-500">
          {status === 'success' ? "You're on the list!" : "You're already signed up."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <p className="text-sm font-semibold text-white mb-1">{heading}</p>
      <p className="text-xs text-gray-500 mb-3">{subtext}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email" placeholder="your@email.com" value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'invalid') setStatus('idle'); }}
          className={`flex-1 px-3 py-2.5 rounded-xl bg-white/5 text-white text-sm outline-none min-h-[44px] border ${status === 'invalid' ? 'border-red-500' : 'border-white/10'}`}
        />
        <button type="submit" disabled={status === 'submitting'}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-black min-h-[44px] whitespace-nowrap disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)' }}
        >
          {status === 'submitting' ? 'Joining...' : 'Join'}
        </button>
      </form>
      {status === 'invalid' && <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>}
      {status === 'error' && <p className="text-xs text-red-500 mt-1">Something went wrong — try again</p>}
    </div>
  );
}

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
    requiredTier: 'free',
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
    requiredTier: 'plus',
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
    requiredTier: 'plus',
  },
];

function Orb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { consent } = useConsent();
  const { setMode, setTierToken: setContextTierToken } = useMatch();
  const [showConsent, setShowConsent] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [showUpgradeFor, setShowUpgradeFor] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const { history, clearHistory } = useMatchHistory();

  // Signed tier token from URL param — used for backend WebSocket auth
  const tierToken = useMemo(() => searchParams.get('token') || '', [searchParams]);

  // Derive display tier from token payload (base64 JSON before the dot)
  const userTier = useMemo(() => {
    if (!tierToken) return 'free';
    try {
      const payloadB64 = tierToken.split('.')[0];
      const payload = JSON.parse(atob(payloadB64));
      const t = payload.tier;
      return (t && TIER_ORDER[t] !== undefined) ? t : 'free';
    } catch { return 'free'; } // eslint-disable-line no-empty
  }, [tierToken]);

  const isLocked = useCallback((card) => {
    return (TIER_ORDER[card.requiredTier] ?? 0) > (TIER_ORDER[userTier] ?? 0);
  }, [userTier]);

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  // Auto-navigate if Trail sent a specific mode that's unlocked
  useEffect(() => {
    const inboundMode = searchParams.get('mode');
    if (!inboundMode) return;
    const card = MODE_CARDS.find(c => c.id === inboundMode);
    if (card && !isLocked(card)) {
      if (!consent.bipaConsented) {
        setPendingMode(card);
        setShowConsent(true);
        return;
      }
      setMode(card.id);
      setContextTierToken(tierToken);
      navigate(card.path, { replace: true });
    }
  }, [searchParams, isLocked, setMode, navigate, consent.bipaConsented]);

  const handleSelect = (card) => {
    if (isLocked(card)) {
      setShowUpgradeFor(card);
      analytics.trackAction('mode_locked_tap', { mode: card.id, userTier });
      return;
    }
    if (!consent.bipaConsented) {
      setPendingMode(card);
      setShowConsent(true);
      return;
    }
    setMode(card.id);
    setContextTierToken(tierToken);
    navigate(card.path);
  };

  const handleUpgradeCheckout = async () => {
    setUpgradeLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      const resp = await fetch(`${API_BASE}/payments/create-subscription-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          priceId: 'price_1T8FigPClYbZfOAq4g2rmnXD',
          email: upgradeEmail.trim(),
          successUrl: `${window.location.origin}/?upgraded=plus`,
          cancelUrl: window.location.href,
        }),
      });
      const data = await resp.json();
      if (data.checkoutUrl) {
        analytics.track('upgrade_checkout_started', { mode: showUpgradeFor?.id, tier: 'plus' });
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.warn('Checkout failed:', err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleConsented = () => {
    setShowConsent(false);
    if (pendingMode) {
      setMode(pendingMode.id);
      setContextTierToken(tierToken);
      navigate(pendingMode.path);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
    >
      {/* Branded header */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 20, width: '100%',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0A0F',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', color: '#ffffff' }}>
            FamiliMatch
          </div>
        </div>
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
          <span className="text-xs text-violet-300 font-medium tracking-wide">Face Chemistry</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-4xl md:text-5xl font-extrabold leading-tight mb-4"
        >
          <span className="text-gradient-violet">How Alike Are You,</span>
          <br />
          <span className="text-white">Really?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-400 text-base md:text-lg mb-8 max-w-sm leading-relaxed"
        >
          Compare 8 facial features with anyone — friends, couples, siblings. Results in 10 seconds.
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
              className="w-24 h-24 rounded-2xl flex items-center justify-center border border-violet-500/20"
              style={{ background: 'rgba(139,92,246,0.08)' }}
            >
              <User size={36} className="text-violet-400/40" />
            </div>
          ))}
          <div
            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center border border-pink-500/20 gap-1"
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
          Compare Now — Free
        </motion.button>

        {/* Trust signals */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-400 text-sm text-center mt-4 max-w-xs leading-relaxed"
        >
          Your photos are gone 10 seconds after your score appears.
          <br />
          <span className="text-gray-500">Never stored, never seen by anyone. No account.</span>
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
            const locked = isLocked(card);
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + 0.1 * i, duration: 0.45 }}
                whileHover={locked ? {} : { scale: 1.03, y: -2 }}
                whileTap={locked ? {} : { scale: 0.97 }}
                onClick={() => handleSelect(card)}
                className={`relative rounded-2xl p-5 text-left border transition-all duration-200 bg-gradient-to-br ${card.gradient} border-gray-800 group overflow-hidden`}
                style={locked ? { opacity: 0.55, cursor: 'default' } : {}}
              >
                {locked ? (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: '#a855f722', color: '#a855f7' }}
                  >
                    <Lock size={10} /> Plus
                  </span>
                ) : (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${card.color}22`, color: card.color }}
                  >
                    {card.badge}
                  </span>
                )}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}18` }}
                >
                  {locked ? (
                    <Lock size={22} style={{ color: card.color, opacity: 0.5 }} />
                  ) : (
                    <Icon size={22} style={{ color: card.color }} />
                  )}
                </div>
                <h3 className="text-base font-bold mb-1 text-white">{card.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{card.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recent Matches */}
      {history.length > 0 && (
        <div className="relative z-10 w-full max-w-md mt-12">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Recent Matches</h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <div className="text-sm font-semibold text-white">
                    {entry.name_a} & {entry.name_b}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: entry.chemistry_color || '#5e5ce6' }}>
                    {entry.percentage}%
                  </div>
                  <div className="text-xs" style={{ color: entry.chemistry_color || '#5e5ce6' }}>
                    {entry.chemistry_label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Capture */}
      <div className="relative z-10 w-full max-w-2xl mt-12">
        <EmailCapture
          context="match_tournaments_waitlist"
          heading="Coming soon: tournaments & challenges"
          subtext="Join the waitlist for competitive modes and leaderboards"
        />
      </div>

      <div className="relative z-10 mt-12 flex gap-6 text-xs text-gray-700">
        <a href="/privacy" className="hover:text-gray-500 transition-colors min-h-[44px] flex items-center px-3">Privacy</a>
        <a href="/terms" className="hover:text-gray-500 transition-colors min-h-[44px] flex items-center px-3">Terms</a>
      </div>

      {showConsent && <ConsentModal onConsented={handleConsented} />}

      {/* Upgrade prompt for locked modes */}
      {showUpgradeFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowUpgradeFor(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-6 max-w-xs w-full text-center"
            style={{ background: 'linear-gradient(180deg, #1a1028 0%, #0f0a1a 100%)', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#a855f718' }}
            >
              <Lock size={24} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Unlock {showUpgradeFor.title} Mode
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              Compare face-to-face with friends in real time.
            </p>
            <div className="text-2xl font-black text-white mb-1">
              £3.99<span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-xs text-gray-600 mb-4">Cancel anytime. Covers all FamiliLook products.</p>
            <input
              type="email" placeholder="your@email.com" value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
              style={{ minHeight: 44 }}
            />
            <button
              onClick={handleUpgradeCheckout}
              disabled={upgradeLoading || !upgradeEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(upgradeEmail)}
              className="block w-full py-3 rounded-xl font-bold text-sm text-white mb-3"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', opacity: upgradeLoading ? 0.6 : 1, cursor: upgradeLoading ? 'wait' : 'pointer', minHeight: 44 }}
            >
              {upgradeLoading ? 'Redirecting to checkout...' : 'Upgrade to Plus'}
            </button>
            <button
              onClick={() => setShowUpgradeFor(null)}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors min-h-[44px]"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
