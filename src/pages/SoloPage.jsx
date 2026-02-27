import { useState } from 'react';

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
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Camera, Lock, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsent } from '../state/ConsentContext';
import { useMatch } from '../state/MatchContext';
import PhotoUpload from '../components/PhotoUpload';
import ConsentModal from '../components/ConsentModal';
import OnboardingScreen from '../components/OnboardingScreen';
import FeatureScanAnimation from '../components/FeatureScanAnimation';
import ResultsStory from '../components/ResultsStory';
import { compareSolo } from '../api/matchClient';
import { analytics } from '../utils/analytics';

export default function SoloPage() {
  const navigate = useNavigate();
  const { consent } = useConsent();
  const { userName } = useMatch();
  const [photoA, setPhotoA] = useState(null);
  const [photoB, setPhotoB] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!userName);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!consent.bipaConsented) {
      setShowConsent(true);
      return;
    }
    await runComparison();
  };

  const handleConsented = () => {
    setShowConsent(false);
    runComparison();
  };

  const runComparison = async () => {
    if (!photoA || !photoB) return;
    setAnalyzing(true);
    setError(null);
    setResults(null);

    analytics.trackUpload('photo', 2, 0);
    analytics.trackButtonClick('compare_faces', { mode: 'solo' });

    // Enforce minimum 8s experience (pad if API is faster)
    const started = Date.now();
    try {
      const result = await compareSolo(photoA, photoB, (step, pct) => {
        setProgress({ step, pct });
      });
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, 8000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      analytics.trackComparison('solo', result.percentage, result.chemistry_label);
      setResults(result);
    } catch (err) {
      analytics.trackError('comparison_error', err.message || 'Comparison failed', { mode: 'solo' });
      setError(err.message || 'Comparison failed');
    } finally {
      setAnalyzing(false);
      setProgress(null);
    }
  };

  const handleReset = () => {
    setPhotoA(null);
    setPhotoB(null);
    setResults(null);
    setError(null);
  };

  const canCompare = photoA && photoB && !analyzing;

  return (
    <>
      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div
        className="min-h-screen flex flex-col items-center px-4 py-8 relative"
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
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </header>

        <div className="w-full max-w-lg relative z-10">

          <AnimatePresence mode="wait">
            {/* ── UPLOAD PHASE ── */}
            {!analyzing && !results && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.15)' }}
                  >
                    <Camera size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {userName ? `${userName}'s Compare` : 'Solo Compare'}
                    </h1>
                    <p className="text-xs text-gray-500">Upload two photos to compare</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <PhotoUpload label="Photo A" onPhotoReady={setPhotoA} />
                  <PhotoUpload label="Photo B" onPhotoReady={setPhotoB} />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-sm text-red-300 text-center">
                    {error}
                  </div>
                )}

                <motion.button
                  onClick={handleCompare}
                  disabled={!canCompare}
                  whileHover={canCompare ? { scale: 1.02 } : {}}
                  whileTap={canCompare ? { scale: 0.97 } : {}}
                  className="w-full py-4 rounded-xl font-bold text-lg text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                    boxShadow: canCompare ? '0 6px 24px rgba(139,92,246,0.35)' : 'none',
                  }}
                >
                  <Zap size={20} />
                  Compare Faces
                </motion.button>

                {/* Privacy note */}
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                  <Lock size={10} />
                  Photos are processed in memory only — never stored
                </p>
              </motion.div>
            )}

            {/* ── ANALYSIS PHASE ── */}
            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="py-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '1.5rem',
                }}
              >
                <FeatureScanAnimation
                  progress={progress || { step: 'Starting...', pct: 0 }}
                  nameA={userName || 'A'}
                  nameB="B"
                />
              </motion.div>
            )}

            {/* ── RESULTS PHASE ── */}
            {results && !analyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ResultsStory
                  results={results}
                  nameA={userName || undefined}
                  onReset={handleReset}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showConsent && <ConsentModal onConsented={handleConsented} />}
    </>
  );
}
