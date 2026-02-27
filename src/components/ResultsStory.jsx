import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import { FEATURE_ICONS, FEATURE_SHORT_LABELS } from '../utils/constants';
import { generateCommentary } from '../utils/commentary';
import FusionReveal from './FusionReveal';

const TOTAL_CARDS = 5;

/** Per-card background shifts */
const CARD_BG = [
  'from-violet-950 via-purple-950 to-black',   // 1: Score
  'from-green-950 via-emerald-950 to-black',   // 2: Strongest Match
  'from-rose-950 via-pink-950 to-black',       // 3: Biggest Contrast
  'from-slate-950 via-gray-950 to-black',      // 4: Full Breakdown
  'from-violet-950 via-purple-950 to-black',   // 5: Fusion
];

/** Progress dots */
function Dots({ total, current }) {
  return (
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current
              ? 'linear-gradient(90deg, #a78bfa, #ec4899)'
              : i < current
              ? 'rgba(167,139,250,0.5)'
              : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

/** Animated count-up number */
function CountUp({ target, color }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1800;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  return (
    <span style={{ color }} className="text-8xl font-extrabold tabular-nums">
      {display}%
    </span>
  );
}

/**
 * 5-card progressive results reveal.
 * Card 1: Score  |  Card 2: Strongest Match  |  Card 3: Biggest Contrast
 * Card 4: Full Breakdown  |  Card 5: Fusion Reveal
 */
export default function ResultsStory({ results, nameA, nameB, onReset }) {
  const [card, setCard] = useState(0);
  const commentary = generateCommentary(results);

  if (!results) return null;

  const { percentage, chemistry_label, chemistry_color, feature_comparisons = [], fusion_image } = results;
  const pct = percentage ?? 0;
  const matchCount = feature_comparisons.filter((f) => f.match).length;
  const n1 = nameA || 'Person A';
  const n2 = nameB || 'Person B';

  const next = () => setCard((c) => Math.min(c + 1, TOTAL_CARDS - 1));
  const isLast = card === TOTAL_CARDS - 1;

  const cardVariants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  };

  return (
    <div
      className={`min-h-[85vh] rounded-2xl bg-gradient-to-b ${CARD_BG[card]} flex flex-col transition-all duration-700 overflow-hidden`}
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Dots + card content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        <Dots total={TOTAL_CARDS} current={card} />

        <AnimatePresence mode="wait">
          {/* ── CARD 1: THE SCORE ── */}
          {card === 0 && (
            <motion.div
              key="score"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-6"
            >
              <CountUp target={pct} color={chemistry_color} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="space-y-3"
              >
                <p className="text-2xl font-bold" style={{ color: chemistry_color }}>
                  {chemistry_label}
                </p>
                {commentary?.tierComment && (
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {commentary.tierComment}
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ── CARD 2: STRONGEST MATCH ── */}
          {card === 1 && (
            <motion.div
              key="strongest"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-6"
            >
              <p className="text-sm font-semibold text-green-400 uppercase tracking-widest">
                Your closest feature match
              </p>

              {commentary?.strongestMatch ? (
                <>
                  <div className="text-6xl">
                    {FEATURE_ICONS[commentary.strongestMatch.feature] || '✓'}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {FEATURE_SHORT_LABELS[commentary.strongestMatch.feature] || commentary.strongestMatch.feature}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">{n1}</p>
                      <p className="text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {commentary.strongestMatch.label_a || '—'}
                      </p>
                    </div>
                    <div className="flex items-center text-green-400 text-lg font-bold">≈</div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">{n2}</p>
                      <p className="text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {commentary.strongestMatch.label_b || '—'}
                      </p>
                    </div>
                  </div>
                  {commentary.strongestMatchComment && (
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                      {commentary.strongestMatchComment}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No matching features found</p>
              )}
            </motion.div>
          )}

          {/* ── CARD 3: BIGGEST CONTRAST ── */}
          {card === 2 && (
            <motion.div
              key="contrast"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-6"
            >
              <p className="text-sm font-semibold text-rose-400 uppercase tracking-widest">
                Your most distinct difference
              </p>

              {commentary?.biggestContrast ? (
                <>
                  <div className="text-6xl">
                    {FEATURE_ICONS[commentary.biggestContrast.feature] || '≠'}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {FEATURE_SHORT_LABELS[commentary.biggestContrast.feature] || commentary.biggestContrast.feature}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">{n1}</p>
                      <p className="text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {commentary.biggestContrast.label_a || '—'}
                      </p>
                    </div>
                    <div className="flex items-center text-rose-400 text-lg font-bold">≠</div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">{n2}</p>
                      <p className="text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {commentary.biggestContrast.label_b || '—'}
                      </p>
                    </div>
                  </div>
                  {commentary.biggestContrastComment && (
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                      {commentary.biggestContrastComment}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No distinct contrasts found</p>
              )}
            </motion.div>
          )}

          {/* ── CARD 4: FULL BREAKDOWN ── */}
          {card === 3 && (
            <motion.div
              key="breakdown"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45 }}
              className="flex-1 flex flex-col gap-4"
            >
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
                Feature Breakdown
              </p>

              <div className="space-y-2">
                {feature_comparisons.map((f, i) => (
                  <motion.div
                    key={f.feature}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                      f.match
                        ? 'bg-green-900/20 border border-green-800/30'
                        : 'border border-gray-800/60'
                    }`}
                    style={f.match ? {} : { background: 'rgba(255,255,255,0.03)' }}
                  >
                    <span className="text-base">{FEATURE_ICONS[f.feature] || '?'}</span>
                    <span className="text-xs text-gray-400 w-12 shrink-0">
                      {FEATURE_SHORT_LABELS[f.feature] || f.feature}
                    </span>
                    <span className="text-xs text-gray-300 flex-1 text-right">{f.label_a || '—'}</span>
                    <span className={`text-xs font-bold ${f.match ? 'text-green-400' : 'text-gray-600'}`}>
                      {f.match ? '=' : '≠'}
                    </span>
                    <span className="text-xs text-gray-300 flex-1">{f.label_b || '—'}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                {matchCount} of {feature_comparisons.length} features match
              </p>
            </motion.div>
          )}

          {/* ── CARD 5: FUSION REVEAL ── */}
          {card === 4 && (
            <motion.div
              key="fusion"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="text-center mb-2">
                <Sparkles size={28} className="text-violet-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                  What would your combination look like?
                </p>
              </div>

              <FusionReveal fusionImage={fusion_image} />

              {/* End actions */}
              <div className="w-full space-y-3 mt-4">
                <button
                  onClick={onReset}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium"
                >
                  <RotateCcw size={15} />
                  Compare Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tap to continue */}
      {!isLast && (
        <div className="px-6 pb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
              boxShadow: '0 6px 24px rgba(139,92,246,0.30)',
            }}
          >
            Continue
            <ChevronRight size={18} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
