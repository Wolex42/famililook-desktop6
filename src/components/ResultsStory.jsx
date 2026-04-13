/**
 * ResultsStory — 5-slide swipeable story for FamiliMatch comparison results.
 *
 * Props:
 *   results: CompareResult  — backend-authoritative compare_faces.v1 response + fusion_image
 *   nameA: string | undefined — display name for person A
 *   onReset: () => void      — resets comparison for a fresh run
 *
 * Slides:
 *   1. Percentage reveal (animated number, chemistry_label, chemistry_color)
 *   2. Strongest match (first feature_comparison with match=true)
 *   3. Biggest contrast (first feature_comparison with match=false)
 *   4. Feature breakdown (all 8 feature_comparisons as table)
 *   5. Face fusion (morphed image if available) + share prompt
 *
 * All data comes from the results object — NO frontend re-derivation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Home, Check, X } from 'lucide-react';

const TOTAL_SLIDES = 5;

function useAnimatedNumber(target, duration = 1800, delay = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let timeout;
    let raf;
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

function DotIndicator({ total, current, onDotClick }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-blue-400'
              : 'w-2 h-2 bg-white/20 hover:bg-white/40'
          }`}
          style={{ minHeight: 16, minWidth: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

function SlideWrapper({ children }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] px-4 py-6">
      {children}
    </div>
  );
}

// Slide 1: Percentage reveal with confetti celebration
function PercentageSlide({ percentage, chemistry_label, chemistry_color, nameA, nameB, matchCount, totalFeatures }) {
  const animatedPct = useAnimatedNumber(percentage);
  const [glowActive, setGlowActive] = useState(false);

  useEffect(() => {
    // Trigger glow + confetti after count-up completes (~2.4s = 600ms delay + 1800ms animation)
    const timer = setTimeout(() => {
      setGlowActive(true);
      if (percentage >= 75) {
        import('canvas-confetti').then(({ default: confetti }) => {
          const colors = ['#0a84ff', '#5e5ce6', '#ec4899', '#a78bfa', '#fbbf24'];
          const count = percentage >= 90 ? 80 : 40;
          confetti({ particleCount: count, spread: 80, origin: { y: 0.3 }, colors, disableForReducedMotion: true });
          if (percentage >= 90) {
            setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.4 }, colors, disableForReducedMotion: true }), 1500);
          }
        });
      }
    }, 2400);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <SlideWrapper>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="text-center"
      >
        <div className="text-sm text-white/60 mb-3">
          {nameA} & {nameB}
        </div>
        <div
          className="font-black tracking-tighter mb-2"
          style={{
            fontSize: 72,
            lineHeight: 1,
            background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transition: 'filter 0.6s ease',
            filter: glowActive ? `drop-shadow(0 0 30px ${chemistry_color || '#5e5ce6'}60)` : 'none',
          }}
        >
          {animatedPct}%
        </div>
        <div className="text-sm text-white/40 mb-4">Match Score</div>
        <div
          className="inline-block px-5 py-2 rounded-full text-sm font-bold"
          style={{
            background: `${chemistry_color || '#5e5ce6'}20`,
            color: chemistry_color || '#5e5ce6',
          }}
        >
          {chemistry_label}
        </div>
        <div className="text-xs text-white/30 mt-3">
          {matchCount} of {totalFeatures} features match
        </div>
      </motion.div>
    </SlideWrapper>
  );
}

// Slide 2: Strongest match
function StrongestMatchSlide({ feature, nameA, nameB }) {
  if (!feature) {
    return (
      <SlideWrapper>
        <p className="text-white/40 text-sm">No matching features detected</p>
      </SlideWrapper>
    );
  }

  return (
    <SlideWrapper>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto">
          <Check size={28} className="text-green-400" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Strongest Match</p>
          <h2 className="text-2xl font-bold text-white capitalize">
            {feature.feature.replace('_', ' ')}
          </h2>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-white/40 text-xs mb-1">{nameA}</p>
            <p className="text-white font-medium">{feature.label_a}</p>
          </div>
          <div className="text-green-400 text-xs font-bold px-3 py-1 rounded-full bg-green-500/10">
            Match
          </div>
          <div className="text-center">
            <p className="text-white/40 text-xs mb-1">{nameB}</p>
            <p className="text-white font-medium">{feature.label_b}</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}

// Slide 3: Biggest contrast
function BiggestContrastSlide({ feature, nameA, nameB }) {
  if (!feature) {
    return (
      <SlideWrapper>
        <p className="text-white/40 text-sm">All features match!</p>
      </SlideWrapper>
    );
  }

  return (
    <SlideWrapper>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mx-auto">
          <X size={28} className="text-orange-400" />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Biggest Contrast</p>
          <h2 className="text-2xl font-bold text-white capitalize">
            {feature.feature.replace('_', ' ')}
          </h2>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-white/40 text-xs mb-1">{nameA}</p>
            <p className="text-white font-medium">{feature.label_a}</p>
          </div>
          <div className="text-orange-400 text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10">
            Different
          </div>
          <div className="text-center">
            <p className="text-white/40 text-xs mb-1">{nameB}</p>
            <p className="text-white font-medium">{feature.label_b}</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}

// Slide 4: Feature breakdown table
function FeatureBreakdownSlide({ featureComparisons, nameA, nameB }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <p className="text-xs text-white/40 uppercase tracking-wider text-center mb-4">
          Feature Breakdown
        </p>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_60px_32px] gap-2 px-3 py-2 text-xs text-white/30">
            <span>Feature</span>
            <span className="text-center">{nameA}</span>
            <span className="text-center">{nameB}</span>
            <span className="text-center">Match</span>
          </div>
          {/* Rows — always exactly 8 from backend */}
          {(featureComparisons || []).map((fc) => (
            <div
              key={fc.feature}
              className={`grid grid-cols-[1fr_60px_60px_32px] gap-2 px-3 py-2 rounded-lg text-xs ${
                fc.match ? 'bg-green-500/5' : 'bg-white/[0.02]'
              }`}
            >
              <span className="text-white/70 capitalize">{fc.feature.replace('_', ' ')}</span>
              <span className="text-white/50 text-center truncate">{fc.label_a}</span>
              <span className="text-white/50 text-center truncate">{fc.label_b}</span>
              <span className="text-center">
                {fc.match ? (
                  <Check size={14} className="inline text-green-400" />
                ) : (
                  <X size={14} className="inline text-white/20" />
                )}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  );
}

// Slide 5: Fusion image + CTA
function FusionSlide({ fusionImage }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <p className="text-xs text-white/40 uppercase tracking-wider">Face Fusion</p>
        {fusionImage ? (
          <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border border-white/10">
            <img
              src={fusionImage.startsWith('data:') ? fusionImage : `data:image/png;base64,${fusionImage}`}
              alt="Face fusion"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto w-48 h-48 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
            <p className="text-sm text-white/25">Fusion unavailable</p>
          </div>
        )}
        <p className="text-sm text-white/40 max-w-xs mx-auto">
          Share your result with friends and challenge them to beat your score!
        </p>
      </motion.div>
    </SlideWrapper>
  );
}

export default function ResultsStory({ results, nameA, onReset }) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  if (!results) return null;

  const {
    percentage,
    chemistry_label,
    chemistry_color,
    feature_comparisons,
    fusion_image,
    name_a,
    name_b,
  } = results;

  const displayA = nameA || name_a || 'Person A';
  const displayB = name_b || 'Person B';

  const strongestMatch = (feature_comparisons || []).find((fc) => fc.match);
  const biggestContrast = (feature_comparisons || []).find((fc) => !fc.match);

  const goTo = useCallback((idx) => {
    setSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, idx)));
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      goTo(delta > 0 ? slide - 1 : slide + 1);
    }
    touchStartX.current = null;
  };

  const slides = [
    <PercentageSlide
      key="pct"
      percentage={percentage}
      chemistry_label={chemistry_label}
      chemistry_color={chemistry_color}
      nameA={displayA}
      nameB={displayB}
      matchCount={(feature_comparisons || []).filter(fc => fc.match).length}
      totalFeatures={(feature_comparisons || []).length || 8}
    />,
    <StrongestMatchSlide key="match" feature={strongestMatch} nameA={displayA} nameB={displayB} />,
    <BiggestContrastSlide key="contrast" feature={biggestContrast} nameA={displayA} nameB={displayB} />,
    <FeatureBreakdownSlide
      key="breakdown"
      featureComparisons={feature_comparisons}
      nameA={displayA}
      nameB={displayB}
    />,
    <FusionSlide key="fusion" fusionImage={fusion_image} />,
  ];

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full"
    >
      {/* Slide content */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {slides[slide]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between px-2 mt-2">
        <button
          onClick={() => goTo(slide - 1)}
          disabled={slide === 0}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/40 hover:text-white disabled:opacity-20 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} />
        </button>

        <DotIndicator total={TOTAL_SLIDES} current={slide} onDotClick={goTo} />

        <button
          onClick={() => goTo(slide + 1)}
          disabled={slide === TOTAL_SLIDES - 1}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white/40 hover:text-white disabled:opacity-20 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
          style={{ minHeight: 44 }}
        >
          <Home size={16} />
          Go Back
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{
            minHeight: 44,
            background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
          }}
        >
          <RotateCcw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
