import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getChemistryLabel } from '../utils/constants';

export default function WinnerCard({ winnerPair, winnerScore, fusionImage }) {
  const pct = winnerScore ?? 0;
  const { label, color } = getChemistryLabel(pct);

  const fusionSrc = fusionImage
    ? fusionImage.startsWith('data:')
      ? fusionImage
      : `data:image/jpeg;base64,${fusionImage}`
    : null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl p-6 border border-accent/30 text-center"
    >
      <Trophy size={32} className="text-accent mx-auto mb-3" />
      <h3 className="text-lg font-bold mb-1">Most Compatible</h3>
      <p className="text-xl font-bold text-accent">
        {winnerPair?.a} & {winnerPair?.b}
      </p>
      <p className="text-3xl font-bold mt-2" style={{ color }}>
        {pct}%
      </p>
      <p className="text-sm" style={{ color }}>
        {label}
      </p>

      {fusionSrc && (
        <img
          src={fusionSrc}
          alt="Winner fusion"
          className="w-32 h-32 rounded-xl object-cover mx-auto mt-4 border-2 border-accent/40"
        />
      )}
    </motion.div>
  );
}
