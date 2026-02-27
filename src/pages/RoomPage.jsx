import { useState, useEffect } from 'react';

const BRAND_HUB_URL = import.meta.env.VITE_BRAND_HUB_URL || 'http://localhost:5173';
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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, ChevronLeft } from 'lucide-react';
import { useMatch } from '../state/MatchContext';
import { useConsent } from '../state/ConsentContext';
import { useMatchConnection } from '../hooks/useMatchConnection';
import RoomLobby from '../components/RoomLobby';
import PhotoUpload from '../components/PhotoUpload';
import ConsentModal from '../components/ConsentModal';
import CountdownOverlay from '../components/CountdownOverlay';

// ── Waiting dots component ─────────────────────────────────────────
function WaitingDots({ label }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400/70 dot-bounce"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

// ── Gradient progress bar ──────────────────────────────────────────
function AnalysisProgress({ step, progress }) {
  return (
    <div className="py-6 space-y-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <p className="text-sm font-semibold text-violet-300">
          {step || 'Analysing…'}
        </p>
      </div>

      {progress != null && (
        <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}

export default function RoomPage() {
  const navigate    = useNavigate();
  const { mode, setResults: setMatchResults } = useMatch();
  const { consent } = useConsent();
  const connection  = useMatchConnection();

  const [phase, setPhase]           = useState('lobby');
  const [showConsent, setShowConsent] = useState(false);

  // React to server events
  useEffect(() => {
    if (connection.consentRequired && !consent.bipaConsented) setShowConsent(true);
  }, [connection.consentRequired, consent.bipaConsented]);

  useEffect(() => {
    if (connection.analyzing) setPhase('analyzing');
  }, [connection.analyzing]);

  useEffect(() => {
    if (connection.countdown !== null) setPhase('countdown');
  }, [connection.countdown]);

  useEffect(() => {
    if (connection.results) {
      setMatchResults(connection.results);
      navigate('/results');
    }
  }, [connection.results, setMatchResults, navigate]);

  const handleRoomReady = () => {
    if (!consent.bipaConsented) { setShowConsent(true); return; }
    connection.grantConsent();
    setPhase('upload');
  };

  const handleConsented = () => {
    setShowConsent(false);
    connection.grantConsent();
    setPhase('upload');
  };

  const handlePhotoReady = (dataUrl) => {
    if (dataUrl) { connection.uploadPhoto(dataUrl); setPhase('waiting'); }
  };

  const handleLeave = () => { connection.leave(); navigate('/'); };

  const isGroup = mode === 'group';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)' }}>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Branded header bar */}
          <header
            style={{
              position: 'sticky', top: 0, zIndex: 20, width: '100%',
              padding: '8px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
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
              onClick={handleLeave}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Leave Room
            </button>
          </header>

          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isGroup ? 'Group Room' : 'Duo Room'}
            </h1>
            <p className="text-sm text-white/35 mt-1">
              {isGroup
                ? 'Compare faces with 3 – 6 people in real time'
                : 'Compare faces with a friend in real time'}
            </p>
          </div>

          {/* Phase card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="glass rounded-3xl p-6"
            >
              {/* LOBBY */}
              {phase === 'lobby' && (
                <RoomLobby connection={connection} onRoomReady={handleRoomReady} />
              )}

              {/* UPLOAD */}
              {phase === 'upload' && (
                <div className="space-y-6 text-center">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                      <Camera size={22} className="text-violet-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Upload Your Photo</h2>
                    <p className="text-sm text-white/40 mt-1">
                      Use a clear, well-lit photo facing forward
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <PhotoUpload label="" onPhotoReady={handlePhotoReady} />
                  </div>

                  <p className="text-xs text-white/25">
                    Your photo is processed in memory only — never stored
                  </p>
                </div>
              )}

              {/* WAITING */}
              {phase === 'waiting' && (
                <div className="space-y-4">
                  <WaitingDots label="Waiting for everyone to upload…" />
                  <button
                    onClick={() => { connection.markReady(); setPhase('waiting'); }}
                    className="
                      w-full py-3.5 rounded-2xl font-bold text-base text-white
                      bg-gradient-to-r from-violet-500 to-pink-500
                      hover:from-violet-400 hover:to-pink-400
                      transition-all duration-200 active:scale-[0.97]
                    "
                  >
                    I'm Ready
                  </button>
                </div>
              )}

              {/* ANALYZING */}
              {phase === 'analyzing' && (
                <AnalysisProgress
                  step={connection.analyzing?.step}
                  progress={connection.analyzing?.progress}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error banner */}
          {connection.error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-300"
            >
              {connection.error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Consent modal */}
      {showConsent && <ConsentModal onConsented={handleConsented} />}

      {/* Countdown overlay */}
      {phase === 'countdown' && connection.countdown !== null && (
        <CountdownOverlay
          seconds={connection.countdown}
          onComplete={() => setPhase('done')}
        />
      )}
    </div>
  );
}
