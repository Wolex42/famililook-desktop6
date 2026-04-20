import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchHistory } from '../hooks/useMatchHistory';
import ShareCard from '../components/ShareCard';
const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';
import { ArrowLeft, Zap, Camera, Lock } from 'lucide-react';
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
  const [showShare, setShowShare] = useState(false);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [personBName, setPersonBName] = useState('');
  const { addEntry } = useMatchHistory();

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
      }, userName || 'You', personBName || 'Them');
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, 8000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      analytics.trackComparison('solo', result.percentage, result.chemistry_label);
      setResults(result);
      addEntry(result);
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

  const handleCreateChallenge = async () => {
    if (!results || !photoA) return;
    setCreatingChallenge(true);
    try {
      const { createChallenge } = await import('../api/matchClient');
      const res = await createChallenge(
        photoA, userName || 'Someone',
        results.percentage, results.chemistry_label, results.chemistry_color
      );
      if (res?.challenge_id) {
        const url = `${window.location.origin}/challenge/${res.challenge_id}`;
        const text = `${userName || 'Someone'} scored ${results.percentage}% on FamiliMatch. Think you can beat it?\n${url}`;
        if (navigator.share) {
          await navigator.share({ text });
        } else {
          await navigator.clipboard?.writeText(url);
          alert('Challenge link copied!');
        }
        analytics.track('challenge_created', { challenge_id: res.challenge_id, percentage: results.percentage });
      }
    } catch (err) {
      console.warn('Challenge creation failed:', err);
    } finally {
      setCreatingChallenge(false);
    }
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
        {/* Branded header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', color: '#ffffff' }}>
              FamiliMatch
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] px-3 py-2"
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
                  <PhotoUpload label={userName || 'Photo A'} onPhotoReady={setPhotoA} />
                  <div className="flex flex-col gap-2">
                    <PhotoUpload label={personBName || 'Photo B'} onPhotoReady={setPhotoB} />
                    <input
                      type="text"
                      placeholder="Their name"
                      value={personBName}
                      onChange={(e) => setPersonBName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[44px]"
                    />
                  </div>
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
                  Photos are processed securely on EU servers — never stored
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
                  nameB={personBName || 'B'}
                />
              </motion.div>
            )}

            {/* ── ERROR PHASE ── */}
            {error && !analyzing && !results && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-red-400 text-center font-medium">{error}</p>
                <button
                  onClick={() => { setError(null); }}
                  className="px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)', minHeight: 44 }}
                >
                  Try Again
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── RESULTS PHASE — outside AnimatePresence to avoid nesting conflict with SwipeJourney ── */}
          {results && !analyzing && (
            <div>
              <ResultsStory
                results={results}
                nameA={userName || undefined}
                onReset={handleReset}
                photoA={photoA}
                photoB={photoB}
              />
              {/* Share + Challenge buttons */}
              <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setShowShare(true)}
                  style={{
                    padding: '12px 28px', borderRadius: 99, width: '100%', maxWidth: 320,
                    background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
                    border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', minHeight: 44,
                  }}
                >
                  Share Your Score
                </button>
                <button
                  onClick={handleCreateChallenge}
                  disabled={creatingChallenge}
                  style={{
                    padding: '12px 28px', borderRadius: 99, width: '100%', maxWidth: 320,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
                    fontSize: 15, fontWeight: 600,
                    cursor: creatingChallenge ? 'wait' : 'pointer', minHeight: 44,
                    opacity: creatingChallenge ? 0.6 : 1,
                  }}
                >
                  {creatingChallenge ? 'Creating...' : `Challenge ${results?.name_b || 'a Friend'} 🎯`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConsent && <ConsentModal onConsented={handleConsented} />}
      {showShare && <ShareCard result={results} onClose={() => setShowShare(false)} />}
    </>
  );
}
