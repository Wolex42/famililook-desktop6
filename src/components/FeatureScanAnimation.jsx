import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader } from 'lucide-react';
import { FEATURE_ICONS, FEATURE_SHORT_LABELS } from '../utils/constants';

const FEATURES = ['eyes', 'eyebrows', 'smile', 'nose', 'face_shape', 'skin', 'hair', 'ears'];

/**
 * Three-phase discovery animation shown during analysis.
 * Phase 1 (0-60%):  feature-by-feature discovery
 * Phase 2 (60-85%): comparison side-by-side
 * Phase 3 (85-100%): creating fusion
 *
 * Props:
 *   progress: { step: string, pct: number }
 *   nameA, nameB: optional display names (string)
 */
export default function FeatureScanAnimation({ progress, nameA, nameB }) {
  const pct = progress?.pct ?? 0;
  const [discoveredCount, setDiscoveredCount] = useState(0);

  // Phase boundaries
  const phase = pct < 60 ? 1 : pct < 85 ? 2 : 3;

  // Reveal features one by one during phase 1
  useEffect(() => {
    if (phase !== 1) {
      setDiscoveredCount(FEATURES.length);
      return;
    }
    const target = Math.min(Math.floor((pct / 60) * FEATURES.length), FEATURES.length);
    if (target > discoveredCount) {
      const timer = setTimeout(() => setDiscoveredCount(target), 200);
      return () => clearTimeout(timer);
    }
  }, [pct, phase, discoveredCount]);

  return (
    <div className="w-full space-y-6">
      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-violet-300">
            {phase === 1 && 'Discovering your features...'}
            {phase === 2 && 'Comparing features...'}
            {phase === 3 && 'Creating your face fusion...'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
            width: `${pct}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Phase 1: Feature discovery list */}
      {phase === 1 && (
        <div className="space-y-2">
          {FEATURES.map((feature, i) => {
            const done = i < discoveredCount;
            const scanning = i === discoveredCount;
            return (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: done || scanning ? 1 : 0.25, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 py-1"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    done
                      ? 'bg-green-500/20'
                      : scanning
                      ? 'bg-violet-500/20'
                      : 'bg-gray-800'
                  }`}
                >
                  {done ? (
                    <Check size={11} className="text-green-400" />
                  ) : scanning ? (
                    <Loader size={11} className="text-violet-400 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                  )}
                </div>
                <span className="text-lg leading-none">{FEATURE_ICONS[feature]}</span>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    done
                      ? 'text-white font-medium'
                      : scanning
                      ? 'text-violet-300'
                      : 'text-gray-700'
                  }`}
                >
                  {FEATURE_SHORT_LABELS[feature]}
                </span>
                {scanning && (
                  <span className="text-xs text-violet-400 ml-1">scanning...</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Phase 2: Comparison table */}
      {phase === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <span className="text-base">{FEATURE_ICONS[feature]}</span>
              <span className="text-gray-400 flex-1">{FEATURE_SHORT_LABELS[feature]}</span>
              <span className="text-violet-300">{nameA || 'A'}</span>
              <span className="text-gray-600 mx-1">vs</span>
              <span className="text-pink-300">{nameB || 'B'}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Phase 3: Fusion creation */}
      {phase === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-violet-300"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              {(nameA || 'A')[0]}
            </div>
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="text-xl"
              >
                ✨
              </motion.div>
            </div>
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-pink-300"
              style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.25)' }}
            >
              {(nameB || 'B')[0]}
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Blending facial features...
          </p>
        </motion.div>
      )}
    </div>
  );
}
