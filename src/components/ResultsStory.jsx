/**
 * ResultsStory — Feature-flagged wrapper.
 * VITE_USE_SHARED_JOURNEY=true  → SwipeJourney from @famililook/shared
 * VITE_USE_SHARED_JOURNEY=false → Legacy 5-slide component
 *
 * All 3 consumers (SoloPage, ResultsPage, ChallengePage) import this file.
 * No consumer changes required for the flag.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Check, X, Users, Sparkles, FlaskConical, ChevronUp, Zap } from 'lucide-react';
import { SharpIcon, featureIconMap } from '@famililook/shared/icons';
import { CelebrationBurst, StatHighlight } from '@famililook/shared/rewards';
import { SwipeJourney, familimatchJourney } from '@famililook/shared/journey';

const USE_SHARED_JOURNEY = import.meta.env.VITE_USE_SHARED_JOURNEY === 'true';

// ── Shared helpers ──
function FeatureIconResolved({ feature, size = 24, className }) {
  const Icon = featureIconMap[feature];
  if (!Icon) return null;
  return <SharpIcon><Icon size={size} className={className} /></SharpIcon>;
}

function useAnimatedNumber(target, duration = 1800, delay = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let timeout, raf;
    timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

// ════════════════════════════════════════════
// componentMap entries — product components
// Each receives { results, displayA, displayB, onReset }
// via SwipeJourney's cardProps
// ════════════════════════════════════════════

function CompatibilityScore({ results, displayA, displayB, photoA, photoB }) {
  const { percentage, chemistry_label, chemistry_color } = results;
  const animatedPct = useAnimatedNumber(percentage, 1800, 1000);
  const [glowActive, setGlowActive] = useState(false);
  const [showReaction, setShowReaction] = useState(false);
  const color = chemistry_color || '#5e5ce6';

  const reaction = percentage >= 85 ? 'No way.'
    : percentage >= 70 ? 'Woah.'
    : percentage >= 55 ? 'Not bad at all.'
    : percentage >= 40 ? 'Interesting...'
    : 'Opposites, huh?';

  useEffect(() => {
    const glowTimer = setTimeout(() => setGlowActive(true), 2800);
    const reactionTimer = setTimeout(() => setShowReaction(true), 3200);
    return () => { clearTimeout(glowTimer); clearTimeout(reactionTimer); };
  }, [percentage]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <CelebrationBurst score={percentage} threshold={70} chemistryLabel={chemistry_label} active={glowActive} />
      {/* Names */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-sm text-white/60 mb-5"
      >
        {displayA} & {displayB}
      </motion.div>
      {/* Face avatars flanking score */}
      <div className="flex items-center justify-center gap-6 mb-4" style={{ minHeight: 80 }}>
        {/* Left face */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${color}66`,
            animation: glowActive ? 'pulseRing 2s ease-in-out infinite' : 'none',
          }}>
            {photoA ? (
              <img src={typeof photoA === 'string' ? photoA : URL.createObjectURL(photoA)} alt={displayA} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
                {displayA.charAt(0)}
              </div>
            )}
          </div>
        </motion.div>
        {/* Percentage */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 120, damping: 12 }}
        >
          <div
            className="font-black tracking-tighter"
            style={{
              fontSize: 64, lineHeight: 1,
              background: `linear-gradient(145deg, ${color}, #5e5ce6)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              transition: 'filter 0.6s ease',
              filter: glowActive ? `drop-shadow(0 0 30px ${color}60)` : 'none',
            }}
          >
            {animatedPct}%
          </div>
        </motion.div>
        {/* Right face */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${color}66`,
            animation: glowActive ? 'pulseRing 2s ease-in-out infinite' : 'none',
          }}>
            {photoB ? (
              <img src={typeof photoB === 'string' ? photoB : URL.createObjectURL(photoB)} alt={displayB} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
                {displayB.charAt(0)}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* Reactive headline */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: showReaction ? 1 : 0, y: showReaction ? 0 : 4 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-white/60 mt-2"
      >
        {reaction}
      </motion.div>
    </div>
  );
}

function ChemistryLabel({ results, displayA, displayB, photoA, photoB }) {
  const { chemistry_label } = results;

  const GRADIENT_MAP = {
    'Feature Twins': 'radial-gradient(ellipse at 50% 38%, #FFD700 0%, #B8860B 55%, #0D0F1A 100%)',
    'Magnetic Match': 'radial-gradient(ellipse at 50% 38%, #8B5CF6 0%, #5B21B6 55%, #0D0F1A 100%)',
    'Complementary Pair': 'radial-gradient(ellipse at 50% 38%, #3B82F6 0%, #1E3A8A 55%, #0D0F1A 100%)',
    'Interesting Contrast': 'radial-gradient(ellipse at 50% 38%, #14B8A6 0%, #065F53 55%, #0D0F1A 100%)',
    'Opposites Attract': 'radial-gradient(ellipse at 50% 38%, #F97316 0%, #9A3412 55%, #0D0F1A 100%)',
  };

  const IDENTITY_MAP = {
    'Feature Twins': 'You two are basically the same person.',
    'Magnetic Match': 'Something about you two just clicks.',
    'Complementary Pair': 'Different in all the right ways.',
    'Interesting Contrast': 'You keep each other guessing.',
    'Opposites Attract': 'Proof that differences pull you together.',
  };

  const gradient = GRADIENT_MAP[chemistry_label] || GRADIENT_MAP['Magnetic Match'];
  const subtext = IDENTITY_MAP[chemistry_label] || '';

  const renderFace = (photo, name, delay) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid rgba(255,255,255,0.6)',
      }}>
        {photo ? (
          <img src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
            {name.charAt(0)}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, background: gradient,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      textAlign: 'center', paddingTop: '25vh', paddingLeft: 24, paddingRight: 24,
    }}>
      {/* Face avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {renderFace(photoA, displayA, 0.2)}
        {renderFace(photoB, displayB, 0.2)}
      </div>
      {/* Chemistry label headline */}
      <motion.h2
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 18 }}
        className="font-black text-white"
        style={{ fontSize: 32, lineHeight: 1.1, marginBottom: 12 }}
      >
        {chemistry_label}
      </motion.h2>
      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', maxWidth: 280 }}
      >
        {subtext}
      </motion.p>
    </div>
  );
}

function FeatureBreakdown({ results, displayA, displayB }) {
  const { feature_comparisons } = results;
  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <p className="text-xs text-white/40 uppercase tracking-wider text-center mb-4">Feature Breakdown</p>
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_60px_60px_32px] gap-2 px-3 py-2 text-xs text-white/30">
          <span>Feature</span>
          <span className="text-center">{displayA}</span>
          <span className="text-center">{displayB}</span>
          <span className="text-center">Match</span>
        </div>
        {(feature_comparisons || []).map((fc) => (
          <div
            key={fc.feature}
            className={`grid grid-cols-[1fr_60px_60px_32px] gap-2 px-3 py-2 rounded-lg text-xs ${fc.match ? 'bg-green-500/5' : 'bg-white/[0.02]'}`}
          >
            <span className="text-white/70 capitalize flex items-center gap-1.5">
              <FeatureIconResolved feature={fc.feature} size={14} />
              {fc.feature.replace('_', ' ')}
            </span>
            <span className="text-white/50 text-center truncate">{fc.label_a}</span>
            <span className="text-white/50 text-center truncate">{fc.label_b}</span>
            <span className="text-center">
              {fc.match ? <Check size={14} className="inline text-green-400" /> : <X size={14} className="inline text-white/20" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharedFeatures({ results, displayA, displayB }) {
  const shared = (results.feature_comparisons || []).filter(fc => fc.match);
  if (shared.length === 0) {
    return <div className="text-center text-white/40 text-sm px-6">No shared features detected — you complement each other!</div>;
  }
  return (
    <div className="text-center px-6 space-y-4">
      <p className="text-xs text-white/40 uppercase tracking-wider">What You Share</p>
      <div className="flex flex-wrap justify-center gap-3">
        {shared.map(fc => (
          <div key={fc.feature} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <FeatureIconResolved feature={fc.feature} size={16} className="text-green-400" />
            <span className="text-white text-sm capitalize">{fc.feature.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/30">{displayA} and {displayB} share {shared.length} of 8 features</p>
    </div>
  );
}

function SocialProof() {
  const BASELINE = 2847;
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(BASELINE);
  const [entered, setEntered] = useState(false);
  const [shimmerDone, setShimmerDone] = useState(false);

  // Count-up animation on entry
  useEffect(() => {
    setEntered(true);
    const start = performance.now();
    const duration = 800;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * BASELINE));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Live tick: +1 every 3-8s
  useEffect(() => {
    const tick = () => {
      setTargetCount(prev => prev + 1);
      setCount(prev => prev + 1);
      const next = 3000 + Math.random() * 5000;
      timer = setTimeout(tick, next);
    };
    let timer = setTimeout(tick, 3000 + Math.random() * 5000);
    return () => clearTimeout(timer);
  }, []);

  // Shimmer once after 1.2s
  useEffect(() => {
    const t = setTimeout(() => setShimmerDone(true), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(10,132,255,0.08) 0%, transparent 60%), #161828',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 24px', gap: 32,
    }}>
      {/* Live counter */}
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: entered ? 1 : 0, scale: entered ? 1 : 0.9 }}
          transition={{ duration: 0.4 }}
          className="font-black text-white"
          style={{ fontSize: 28 }}
        >
          {count.toLocaleString()}
        </motion.div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
          comparisons today
        </p>
      </div>
      {/* Rarity teaser with shimmer */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <p className="font-semibold" style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>
          Your match is rarer than you think.
        </p>
        {!shimmerDone && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, ease: 'linear' }}
            style={{
              position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      {/* Upward chevron */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
      </motion.div>
    </div>
  );
}

function RareStat({ results }) {
  const { percentage, feature_comparisons } = results;
  const matchCount = (feature_comparisons || []).filter(fc => fc.match).length;
  const rarity = matchCount >= 7
    ? 'mythic'
    : matchCount >= 6
      ? 'legendary'
      : matchCount >= 5
        ? 'epic'
        : matchCount >= 4
          ? 'rare'
          : matchCount >= 3
            ? 'uncommon'
            : 'common';
  const rarityNote = matchCount >= 6
    ? 'Sharing 6+ features is exceptionally rare — only ~5% of pairs achieve this.'
    : matchCount >= 4
      ? 'With 4-5 shared features, you have an above-average connection.'
      : 'Your unique differences make you a complementary pair.';

  return (
    <div className="text-center px-6 space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto">
        <Sparkles size={28} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">Did You Know?</p>
        <h3 className="text-xl font-bold text-white">{matchCount} of 8 Features Match</h3>
      </div>
      <p className="text-sm text-white/50 max-w-xs mx-auto">{rarityNote}</p>
      <StatHighlight
        reward={{ type: 'stat', label: `${matchCount}/8 features match`, value: percentage, rarity }}
        productId="familimatch"
      />
    </div>
  );
}

function ShareCardSlide({ results }) {
  const { fusion_image } = results;
  return (
    <div className="text-center px-6 space-y-4">
      <p className="text-xs text-white/40 uppercase tracking-wider">Face Fusion</p>
      {fusion_image ? (
        <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border border-white/10">
          <img
            src={fusion_image.startsWith('data:') ? fusion_image : `data:image/png;base64,${fusion_image}`}
            alt="Face fusion"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="mx-auto w-48 h-48 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
          <p className="text-sm text-white/25">Fusion unavailable</p>
        </div>
      )}
      <p className="text-sm text-white/40 max-w-xs mx-auto">Share your result with friends and challenge them to beat your score!</p>
    </div>
  );
}

function DuoUpgrade({ results, photoA, photoB }) {
  const navigate = useNavigate();
  const { chemistry_color, percentage } = results || {};
  const color = chemistry_color || '#5e5ce6';
  const displayA = results?.name_a || 'Person A';
  const displayB = results?.name_b || 'Person B';

  const renderFace = (photo, name) => (
    <div style={{
      width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
      border: `2px solid ${color}4D`,
    }}>
      {photo ? (
        <img src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
          {name.charAt(0)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse at 50% 30%, ${color}15 0%, transparent 70%), #161828`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 24px', gap: 16,
    }}>
      {/* Face avatars with Zap icon between */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {renderFace(photoA, displayA)}
        <Zap size={16} style={{ color }} />
        {renderFace(photoB, displayB)}
      </div>
      {/* Loading bar */}
      <div style={{ width: '100%', maxWidth: 200, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999, background: color,
          animation: 'fillBar 2s ease-out forwards',
        }} />
      </div>
      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="font-black text-white"
        style={{ fontSize: 24, lineHeight: 1.15, maxWidth: 280 }}
      >
        See their face when the score drops.
      </motion.h2>
      {/* Body */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 280 }}
      >
        Upload together, chat while you wait, watch the score drop at the same moment.
      </motion.p>
      {/* CTA button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        onClick={() => navigate('/?upgrade=plus')}
        style={{
          width: '100%', maxWidth: 320, padding: '14px 24px', borderRadius: 14,
          background: `linear-gradient(135deg, ${color}, #5e5ce6)`,
          border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', minHeight: 44,
        }}
      >
        Get Plus
      </motion.button>
      {/* Price */}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
        £3.99/mo · cancel anytime
      </p>
      {/* Sub-line */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
        Includes Duo, Group, and all FamiliLook products.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════
// componentMap for SwipeJourney
// ════════════════════════════════════════════
const COMPONENT_MAP = {
  CompatibilityScore,
  ChemistryLabel,
  FeatureBreakdown,
  SharedFeatures,
  ScienceExplainer: SocialProof,
  RareStat,
  ShareCard: ShareCardSlide,
  DuoUpgrade,
};

// ════════════════════════════════════════════
// Main export — feature flag switch
// ════════════════════════════════════════════
export default function ResultsStory({ results, nameA, onReset, photoA, photoB }) {
  const navigate = useNavigate();

  if (!results) return null;

  const displayA = nameA || results.name_a || 'Person A';
  const displayB = results.name_b || 'Person B';

  if (USE_SHARED_JOURNEY) {
    return (
      <div style={{ backgroundColor: '#0A0A0F' }}>
        <SwipeJourney
          cards={familimatchJourney}
          componentMap={COMPONENT_MAP}
          productId="familimatch"
          cardProps={{ results, displayA, displayB, onReset, photoA, photoB }}
          onComplete={() => {}}
          height="calc(100dvh - 92px)"
        />
        {/* Action buttons below journey */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
            style={{ minHeight: 44 }}
          >
            <Home size={16} /> Go Back
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ minHeight: 44, background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)' }}
          >
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Legacy fallback (VITE_USE_SHARED_JOURNEY !== 'true') ──
  const LegacyResultsStory = React.lazy(() => import('./ResultsStory.legacy.jsx'));
  return (
    <React.Suspense fallback={null}>
      <LegacyResultsStory results={results} nameA={nameA} onReset={onReset} />
    </React.Suspense>
  );
}
