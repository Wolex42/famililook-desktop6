/**
 * ChallengePage — Landing page for challenge links.
 *
 * Route: /challenge/:id
 * Flow:
 *   1. Fetch challenge metadata (name, score)
 *   2. Show "[Name] challenged you!" with their score
 *   3. "Accept Challenge" → consent → photo upload → comparison
 *   4. Show results + "Challenge Someone Else" loop
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Lock } from 'lucide-react';
import { useConsent } from '../state/ConsentContext';
import ConsentModal from '../components/ConsentModal';
import PhotoUpload from '../components/PhotoUpload';
import FeatureScanAnimation from '../components/FeatureScanAnimation';
import ResultsStory from '../components/ResultsStory';
import ShareCard from '../components/ShareCard';
import { analytics } from '../utils/analytics';

const FAMILIMATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';

export default function ChallengePage() {
  const { id: challengeId } = useParams();
  const navigate = useNavigate();
  const { consent } = useConsent();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [phase, setPhase] = useState('landing'); // landing | upload | analyzing | results
  const [showConsent, setShowConsent] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [userName, setUserName] = useState('');
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [showShare, setShowShare] = useState(false);

  // Fetch challenge metadata on mount
  useEffect(() => {
    analytics.trackPageView('challenge');
    let cancelled = false;
    (async () => {
      try {
        const { getChallenge } = await import('../api/matchClient');
        const data = await getChallenge(challengeId);
        if (cancelled) return;
        if (!data) {
          setError('This challenge has expired or does not exist.');
        } else {
          setChallenge(data);
          analytics.track('challenge_opened', { challenge_id: challengeId });
        }
      } catch {
        if (!cancelled) setError('Failed to load challenge.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [challengeId]);

  const handleAccept = () => {
    if (!consent.bipaConsented) {
      setShowConsent(true);
      return;
    }
    setPhase('upload');
  };

  const handleConsented = () => {
    setShowConsent(false);
    setPhase('upload');
  };

  const handleCompare = async () => {
    if (!photo) return;
    setPhase('analyzing');
    setProgress({ step: 'Analyzing faces...', pct: 20 });

    try {
      const { acceptChallenge } = await import('../api/matchClient');
      setProgress({ step: 'Comparing faces...', pct: 60 });

      const started = Date.now();
      const result = await acceptChallenge(challengeId, photo, userName || 'Challenger');
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, 6000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      setProgress({ step: 'Done!', pct: 100 });
      setResults(result);
      setPhase('results');
      analytics.track('challenge_completed', {
        challenge_id: challengeId,
        percentage: result.percentage,
        beat_challenger: result.percentage > (challenge?.percentage || 0),
      });
    } catch (err) {
      setError(err.message || 'Comparison failed');
      setPhase('landing');
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setResults(null);
    setPhase('landing');
    setError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
      >
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-violet-400/70 dot-bounce" style={{ animationDelay: `${i * 0.16}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // Error / expired
  if (error && !results) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-4xl">😕</div>
          <p className="text-white/60 text-sm">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
            style={{ minHeight: 44, background: FAMILIMATCH_GRADIENT }}
          >
            Start Your Own
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8 relative"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 20, width: '100%',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0A0F', marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: FAMILIMATCH_GRADIENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✨</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', color: '#fff' }}>FamiliMatch</div>
        </div>
      </header>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">

          {/* ── LANDING PHASE ── */}
          {phase === 'landing' && challenge && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="text-center space-y-6"
            >
              {/* Challenger avatar */}
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{ background: FAMILIMATCH_GRADIENT, fontSize: 32, fontWeight: 800, color: '#fff' }}
              >
                {challenge.name?.[0]?.toUpperCase() || '?'}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {challenge.name} challenged you!
                </h1>
                <p className="text-base text-white/50">
                  They scored <span className="text-white font-bold">{challenge.percentage}%</span> with someone.
                  <br />Can you beat it?
                </p>
              </div>

              {/* Accept CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className="w-full max-w-xs mx-auto py-4 rounded-2xl font-bold text-lg text-black flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.40)',
                  minHeight: 48,
                }}
              >
                <Zap size={20} />
                Accept Challenge 🎯
              </motion.button>

              {/* Trust signal */}
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                <Lock size={10} />
                Photos are processed securely on EU servers — never stored
              </p>
            </motion.div>
          )}

          {/* ── UPLOAD PHASE ── */}
          {phase === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">Upload your photo</h2>
                <p className="text-sm text-gray-500">We'll compare you against {challenge.name}</p>
              </div>

              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[44px]"
              />

              <PhotoUpload label={userName || 'Your photo'} onPhotoReady={setPhoto} />

              <motion.button
                onClick={handleCompare}
                disabled={!photo}
                whileHover={photo ? { scale: 1.02 } : {}}
                whileTap={photo ? { scale: 0.97 } : {}}
                className="w-full py-4 rounded-xl font-bold text-lg text-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                  boxShadow: photo ? '0 6px 24px rgba(139,92,246,0.35)' : 'none',
                  minHeight: 48,
                }}
              >
                <Zap size={20} />
                Compare Faces
              </motion.button>

              <button
                onClick={() => setPhase('landing')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-300 min-h-[44px]"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── ANALYZING PHASE ── */}
          {phase === 'analyzing' && (
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
                borderRadius: 20, padding: '1.5rem',
              }}
            >
              <FeatureScanAnimation
                progress={progress || { step: 'Starting...', pct: 0 }}
                nameA={challenge.name}
                nameB={userName || 'You'}
              />
            </motion.div>
          )}

          {/* ── RESULTS PHASE ── */}
          {phase === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Beat / Didn't beat banner */}
              <div className="text-center mb-4">
                {results.percentage > (challenge?.percentage || 0) ? (
                  <div className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                    You beat {challenge.name}'s score! 🎉
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
                    {challenge.name} wins this round! 💪
                  </div>
                )}
              </div>

              {/* CRITICAL: deep-link forward primitive — do NOT delete (see SPEC_A_HOTFIX_VISUAL_FIX_MOBILE_UX_ADDENDUM_2026_04_25.md §1).
                  ChallengePage recipients arrive via external link with no app-internal history.
                  Removing "Challenge Someone Else" leaves browser-back as the only exit,
                  which on iOS Safari can close the tab (history.length === 1). See FM-X5-10. */}
              <ResultsStory
                results={results}
                nameA={challenge.name}
                onReset={handleReset}
                extraAction={{
                  label: 'Challenge Someone Else 🎯',
                  onClick: () => navigate('/'),
                }}
              />
              {/* "Share Your Score" removed (A-HOTFIX 2026-04-25): duplicate of ShareCardSlide.
                  "Challenge Someone Else" lifted into ResultsStory fixed action bar via extraAction.
                  setShowShare + ShareCard modal kept untouched. */}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {showConsent && <ConsentModal onConsented={handleConsented} />}
      {showShare && results && <ShareCard result={results} onClose={() => setShowShare(false)} />}
    </div>
  );
}
