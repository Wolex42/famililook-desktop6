import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getChemistryLabel } from '../utils/constants';
import WinnerCard from './WinnerCard';

/**
 * Progressive pair-by-pair reveal — lowest to highest score.
 * Each pair revealed every 1.8s. Winner celebrated last.
 */
export default function GroupMatrix({ matrixData }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showWinner, setShowWinner] = useState(false);

  if (!matrixData) return null;

  const { pairs = [], winner_pair, winner_score, winner_fusion } = matrixData;

  // Sort pairs lowest to highest (winner last)
  const sorted = [...pairs].sort(
    (a, b) => (a.result?.percentage ?? 0) - (b.result?.percentage ?? 0),
  );
  const total = sorted.length;

  // Progressive reveal: first pair after 400ms, then every 1.8s
  useEffect(() => {
    if (revealedCount >= total) return;
    const timer = setTimeout(
      () => setRevealedCount((c) => c + 1),
      revealedCount === 0 ? 400 : 1800,
    );
    return () => clearTimeout(timer);
  }, [revealedCount, total]);

  // Winner celebration 2s after all pairs revealed
  useEffect(() => {
    if (revealedCount >= total && total > 0 && !showWinner) {
      const timer = setTimeout(() => setShowWinner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, total, showWinner]);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 text-center">
        {revealedCount < total ? 'Revealing results...' : 'All results revealed'}
      </p>

      <div className="space-y-3">
        {sorted.map((pair, i) => {
          const pct = pair.result?.percentage ?? 0;
          const { label, color } = getChemistryLabel(pct);
          const isWinner =
            winner_pair &&
            pair.a_name === winner_pair.a &&
            pair.b_name === winner_pair.b;

          return (
            <AnimatePresence key={`${pair.a_name}-${pair.b_name}`}>
              {i < revealedCount && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="rounded-xl p-4 border"
                  style={{
                    background:
                      isWinner && showWinner
                        ? 'rgba(255,215,0,0.08)'
                        : 'rgba(255,255,255,0.04)',
                    borderColor:
                      isWinner && showWinner
                        ? 'rgba(255,215,0,0.40)'
                        : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      {isWinner && showWinner && (
                        <Trophy size={14} className="text-yellow-400" />
                      )}
                      {pair.a_name} &amp; {pair.b_name}
                    </span>
                    <span className="text-lg font-bold" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs" style={{ color }}>{label}</p>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Winner celebration — appears after all pairs + 2s */}
      <AnimatePresence>
        {showWinner && winner_pair && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <WinnerCard
              winnerPair={winner_pair}
              winnerScore={winner_score}
              fusionImage={winner_fusion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
