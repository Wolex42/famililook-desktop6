import { motion } from 'framer-motion';
import { FEATURE_ICONS, FEATURE_SHORT_LABELS } from '../utils/constants';

export default function FeatureComparison({ features }) {
  if (!features || features.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Feature Breakdown
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {features.map((f, i) => {
          const icon = FEATURE_ICONS[f.feature] || '?';
          const label = FEATURE_SHORT_LABELS[f.feature] || f.feature;

          return (
            <motion.div
              key={f.feature}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                f.match
                  ? 'bg-green-900/20 border-green-800/40'
                  : 'bg-surface-light border-gray-800'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-medium flex-1 text-sm">{label}</span>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-surface text-gray-300">
                  {f.label_a || '—'}
                </span>
                <span className={`px-1 ${f.match ? 'text-green-400' : 'text-gray-600'}`}>
                  {f.match ? '=' : '≠'}
                </span>
                <span className="px-2 py-1 rounded bg-surface text-gray-300">
                  {f.label_b || '—'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center">
        {features.filter((f) => f.match).length} of {features.length} features match
      </p>
    </div>
  );
}
