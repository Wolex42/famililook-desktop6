import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function FusionReveal({ fusionImage }) {
  const [revealed, setRevealed] = useState(false);

  if (!fusionImage) return null;

  const src = fusionImage.startsWith('data:')
    ? fusionImage
    : `data:image/jpeg;base64,${fusionImage}`;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Sparkles size={14} /> Face Fusion
      </h3>

      {!revealed ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setRevealed(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent
            text-black font-bold text-lg hover:opacity-90 transition-opacity"
        >
          Reveal Fusion
        </motion.button>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex justify-center"
        >
          <img
            src={src}
            alt="Face fusion"
            className="w-48 h-48 rounded-2xl object-cover border-2 border-primary/40 shadow-lg shadow-primary/20"
          />
        </motion.div>
      )}
    </div>
  );
}
