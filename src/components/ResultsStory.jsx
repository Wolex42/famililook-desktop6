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
import { Home, RotateCcw, Check, X, Users, Sparkles, FlaskConical } from 'lucide-react';
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

function CompatibilityScore({ results, displayA, displayB }) {
  const { percentage, chemistry_label, chemistry_color, feature_comparisons } = results;
  const animatedPct = useAnimatedNumber(percentage);
  const [glowActive, setGlowActive] = useState(false);
  const matchCount = (feature_comparisons || []).filter(fc => fc.match).length;

  useEffect(() => {
    const timer = setTimeout(() => setGlowActive(true), 2400);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <CelebrationBurst score={percentage} threshold={70} chemistryLabel={chemistry_label} active={glowActive} />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <div className="text-sm text-white/60 mb-3">{displayA} & {displayB}</div>
        <div
          className="font-black tracking-tighter mb-2"
          style={{
            fontSize: 72, lineHeight: 1,
            background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            transition: 'filter 0.6s ease',
            filter: glowActive ? `drop-shadow(0 0 30px ${chemistry_color || '#5e5ce6'}60)` : 'none',
          }}
        >
          {animatedPct}%
        </div>
        <div className="text-sm text-white/40 mb-4">Match Score</div>
        <div className="text-xs text-white/30 mt-3">{matchCount} of {(feature_comparisons || []).length || 8} features match</div>
      </motion.div>
    </div>
  );
}

function ChemistryLabel({ results }) {
  const { chemistry_label, chemistry_color } = results;
  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="space-y-4"
      >
        <p className="text-xs text-white/40 uppercase tracking-wider">Your Chemistry</p>
        <div
          className="inline-block px-8 py-4 rounded-full text-2xl font-black"
          style={{
            background: `${chemistry_color || '#5e5ce6'}20`,
            color: chemistry_color || '#5e5ce6',
            textShadow: `0 0 40px ${chemistry_color || '#5e5ce6'}40`,
          }}
        >
          {chemistry_label}
        </div>
        <p className="text-sm text-white/40 max-w-xs">
          This is your unique chemistry profile based on 8 facial features analysed by AI.
        </p>
      </motion.div>
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

function ScienceExplainer() {
  return (
    <div className="text-center px-6 space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto">
        <FlaskConical size={28} className="text-blue-400" />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">The Science</p>
        <h3 className="text-xl font-bold text-white">How We Compare</h3>
      </div>
      <div className="text-sm text-white/50 max-w-xs mx-auto space-y-3">
        <p>We analyse 128-dimensional face embeddings and 8 distinct facial features using computer vision.</p>
        <p>Your score combines <strong className="text-white/70">60% structural similarity</strong> (face shape, proportions) with <strong className="text-white/70">40% feature matching</strong> (eyes, nose, smile).</p>
      </div>
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

function DuoUpgrade() {
  return (
    <div className="text-center px-6 space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto">
        <Users size={28} className="text-violet-400" />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">Go Further</p>
        <h3 className="text-xl font-bold text-white">Try Duo Mode</h3>
      </div>
      <p className="text-sm text-white/50 max-w-xs mx-auto">
        Compare in real-time with a friend. Both upload simultaneously and see your chemistry reveal together.
      </p>
      <div className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white/50 border border-white/10">
        Coming with Plus
      </div>
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
  ScienceExplainer,
  RareStat,
  ShareCard: ShareCardSlide,
  DuoUpgrade,
};

// ════════════════════════════════════════════
// Main export — feature flag switch
// ════════════════════════════════════════════
export default function ResultsStory({ results, nameA, onReset }) {
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
          cardProps={{ results, displayA, displayB, onReset }}
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
