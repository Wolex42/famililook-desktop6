import { useNavigate } from 'react-router-dom';

const BRAND_HUB_URL = import.meta.env.VITE_BRAND_HUB_URL || 'http://localhost:5175';
const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';

function reversePortalTransition(gradient, onNavigate) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '9999', pointerEvents: 'none',
    background: `radial-gradient(ellipse at 50% 44%, rgba(255,255,255,0.16) 0%, transparent 62%), ${gradient}`,
    opacity: '0', transform: 'scale(1)', borderRadius: '0',
    willChange: 'opacity, transform, border-radius',
    transition: 'opacity 0.12s ease',
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
  setTimeout(() => {
    Object.assign(overlay.style, {
      transition: [
        'opacity 0.4s ease-out',
        'transform 0.45s cubic-bezier(0, 0, 0.6, 1)',
        'border-radius 0.45s ease',
      ].join(', '),
      opacity: '0', transform: 'scale(0)', borderRadius: '50%',
    });
    setTimeout(() => { onNavigate(); setTimeout(() => overlay.remove(), 100); }, 430);
  }, 120);
}
import { ArrowLeft, RotateCcw, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMatch } from '../state/MatchContext';
import ResultsStory from '../components/ResultsStory';
import GroupMatrix from '../components/GroupMatrix';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { mode, results, reset, players } = useMatch();

  const handlePlayAgain = () => {
    reset();
    navigate('/');
  };

  const isGroup = mode === 'group';
  const playerNames = results?.players
    ? Object.values(results.players)
    : players?.map((p) => p.name) || [];

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
    >
      {/* Branded header bar */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 20, width: '100%',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0A0F',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => reversePortalTransition(FAMILIMATCH_GRADIENT, () => { window.location.href = BRAND_HUB_URL; })}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ffffff', padding: 0,
          }}
        >
          <ChevronLeft size={20} color="rgba(255,255,255,0.6)" />
          <div
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: FAMILIMATCH_GRADIENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px' }}>
            FamiliMatch
          </div>
        </button>
        <button
          onClick={handlePlayAgain}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Home
        </button>
      </header>

      <div className="w-full max-w-lg">

        {results ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Duo — 5-card story */}
            {!isGroup && (
              <ResultsStory
                results={results}
                nameA={playerNames[0]}
                nameB={playerNames[1]}
                onReset={handlePlayAgain}
              />
            )}

            {/* Group — progressive matrix */}
            {isGroup && (
              <div className="space-y-6">
                <GroupMatrix matrixData={results} />
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handlePlayAgain}
                    className="flex items-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw size={16} /> Play Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-gray-500 mb-4">No results yet</p>
            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 mx-auto px-4 py-4 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <RotateCcw size={16} /> Start a comparison
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
