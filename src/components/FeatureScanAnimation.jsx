/**
 * FeatureScanAnimation — full analysis progress overlay for FamiliMatch.
 *
 * Props:
 *   progress: { step: string, pct: number }  — driven by compareSolo onProgress callback
 *   nameA: string                             — first person's display name
 *   nameB: string                             — second person's display name
 *
 * Steps cycle through: Detecting faces -> Extracting features -> Comparing -> Building result
 * Progress bar driven by pct (0-100). All data is backend-authoritative.
 */

import { motion } from 'framer-motion';
import { COMPARE_FEATURES } from '../utils/constants';

const SCAN_STEPS = [
  'Detecting faces...',
  'Extracting features...',
  'Comparing...',
  'Building result...',
];

function getStepIndex(step) {
  const idx = SCAN_STEPS.findIndex((s) => s.toLowerCase().includes((step || '').toLowerCase().slice(0, 8)));
  return idx >= 0 ? idx : 0;
}

function ScanDot({ delay }) {
  return (
    <motion.span
      className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
      transition={{ duration: 1.2, repeat: Infinity, delay }}
    />
  );
}

export default function FeatureScanAnimation({ progress, nameA, nameB }) {
  const { step, pct } = progress || { step: 'Starting...', pct: 0 };
  const stepIdx = getStepIndex(step);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Name badges */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)' }}
          >
            {(nameA || 'A')[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white/80">{nameA || 'A'}</span>
        </div>

        {/* Animated connector */}
        <div className="flex items-center gap-1">
          <ScanDot delay={0} />
          <ScanDot delay={0.2} />
          <ScanDot delay={0.4} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/80">{nameB || 'B'}</span>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(145deg, #ec4899, #f59e0b)' }}
          >
            {(nameB || 'B')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Scanning feature list */}
      <div className="w-full max-w-xs space-y-1">
        {COMPARE_FEATURES.map((feature, i) => {
          const featureProgress = (pct / 100) * COMPARE_FEATURES.length;
          const isScanned = i < featureProgress;
          const isActive = Math.floor(featureProgress) === i;

          return (
            <motion.div
              key={feature}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
              animate={{
                backgroundColor: isActive
                  ? 'rgba(10, 132, 255, 0.15)'
                  : isScanned
                    ? 'rgba(94, 92, 230, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
              }}
              transition={{ duration: 0.3 }}
            >
              <span className={isScanned ? 'text-white/70' : 'text-white/25'}>
                {feature.replace('_', ' ')}
              </span>
              {isScanned && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 text-xs"
                >
                  Scanned
                </motion.span>
              )}
              {isActive && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-blue-400 text-xs"
                >
                  Scanning...
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Step label */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-blue-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <p className="text-sm font-semibold text-blue-300">{step}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {SCAN_STEPS.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i <= stepIdx ? 'bg-blue-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #0a84ff, #5e5ce6)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Percentage */}
      <p className="text-xs text-white/30">{Math.round(pct)}% complete</p>
    </div>
  );
}
