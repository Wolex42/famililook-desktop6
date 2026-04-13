/**
 * ResultsPage — standalone results view for FamiliMatch.
 *
 * Reached via navigation from RoomPage (Duo/Group) after comparison completes.
 * Reads results from useMatch().results (set by RoomPage before navigating here).
 *
 * - Solo mode: should not reach this page (SoloPage has inline ResultsStory)
 * - Duo mode: renders the 5-slide ResultsStory component
 * - Group mode: renders a chemistry matrix (pairwise grid) of all participants
 *
 * All data is backend-authoritative — NO frontend re-derivation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { useMatch } from '../state/MatchContext';
import ResultsStory from '../components/ResultsStory';
import ShareCard from '../components/ShareCard';

const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';

// ── Group mode: chemistry matrix ──────────────────────────────────
function ChemistryMatrix({ results }) {
  // Group results come as { pairs: [ { name_a, name_b, percentage, chemistry_label, chemistry_color, ... } ] }
  const pairs = results.pairs || results.results || [];
  if (!pairs.length) return null;

  // Extract unique names
  const nameSet = new Set();
  pairs.forEach((p) => {
    if (p.name_a) nameSet.add(p.name_a);
    if (p.name_b) nameSet.add(p.name_b);
  });
  const names = Array.from(nameSet);

  // Build lookup: key "nameA|nameB" -> pair result
  const lookup = {};
  pairs.forEach((p) => {
    lookup[`${p.name_a}|${p.name_b}`] = p;
    lookup[`${p.name_b}|${p.name_a}`] = p;
  });

  return (
    <div className="w-full">
      <p className="text-xs text-white/40 uppercase tracking-wider text-center mb-4">
        Chemistry Matrix
      </p>
      <table className="w-full border-collapse text-xs hidden sm:table">
        <thead>
          <tr>
            <th className="p-2 text-white/30 text-left" />
            {names.map((name) => (
              <th key={name} className="p-2 text-white/60 font-semibold text-center truncate max-w-[80px]">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((rowName) => (
            <tr key={rowName}>
              <td className="p-2 text-white/60 font-semibold truncate max-w-[80px]">{rowName}</td>
              {names.map((colName) => {
                if (rowName === colName) {
                  return (
                    <td key={colName} className="p-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-white/[0.03] flex items-center justify-center text-white/15">
                        --
                      </div>
                    </td>
                  );
                }
                const pair = lookup[`${rowName}|${colName}`];
                if (!pair) {
                  return (
                    <td key={colName} className="p-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-white/[0.03] flex items-center justify-center text-white/15">
                        ?
                      </div>
                    </td>
                  );
                }
                return (
                  <td key={colName} className="p-2 text-center">
                    <div
                      className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: `${pair.chemistry_color || '#5e5ce6'}30`,
                        border: `1px solid ${pair.chemistry_color || '#5e5ce6'}40`,
                      }}
                      title={`${pair.chemistry_label}: ${pair.percentage}%`}
                    >
                      {pair.percentage}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pair detail cards */}
      <div className="mt-6 space-y-3">
        {pairs.map((pair, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70 font-medium">{pair.name_a}</span>
              <span className="text-white/20">&</span>
              <span className="text-sm text-white/70 font-medium">{pair.name_b}</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  background: `${pair.chemistry_color || '#5e5ce6'}20`,
                  color: pair.chemistry_color || '#5e5ce6',
                }}
              >
                {pair.chemistry_label}
              </span>
              <span
                className="text-lg font-black"
                style={{
                  background: FAMILIMATCH_GRADIENT,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {pair.percentage}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { results, mode, resetMatch } = useMatch();
  const [showShare, setShowShare] = useState(false);

  const handleReset = () => {
    resetMatch();
    navigate('/');
  };

  // No results — show empty state
  if (!results) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🔍</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">No Results Yet</h1>
            <p className="text-sm text-white/40">
              Start a new comparison to see your match results here.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all active:scale-[0.97]"
            style={{
              minHeight: 44,
              background: FAMILIMATCH_GRADIENT,
            }}
          >
            <Home size={18} />
            Start a Comparison
          </button>
        </motion.div>
      </div>
    );
  }

  const isGroup = mode === 'group';

  // Group mode — chemistry matrix
  if (isGroup) {
    return (
      <div
        className="min-h-screen flex flex-col items-center px-4 py-8"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
      >
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Group Results</h1>
            <p className="text-sm text-white/35 mt-1">Everyone compared — here are the chemistry scores</p>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <ChemistryMatrix results={results} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
              style={{ minHeight: 44 }}
            >
              <Home size={16} />
              Home
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{
                minHeight: 44,
                background: FAMILIMATCH_GRADIENT,
              }}
            >
              <RotateCcw size={16} />
              New Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Duo mode — same 5-slide ResultsStory
  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Results</h1>
          <p className="text-sm text-white/35 mt-1">Duo comparison complete</p>
        </div>

        <ResultsStory
          results={results}
          nameA={results.name_a || undefined}
          onReset={handleReset}
        />

        {/* Share button */}
        <div className="text-center mt-4">
          <button
            onClick={() => setShowShare(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm transition-all active:scale-[0.97]"
            style={{
              minHeight: 44,
              background: FAMILIMATCH_GRADIENT,
            }}
          >
            <Share2 size={16} />
            Share Your Score
          </button>
        </div>
      </div>

      {showShare && <ShareCard result={results} onClose={() => setShowShare(false)} />}
    </div>
  );
}
