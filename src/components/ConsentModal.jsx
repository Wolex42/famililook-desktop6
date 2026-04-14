import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useConsent } from '../state/ConsentContext';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

/**
 * ConsentModal — full-screen BIPA consent overlay for FamiliMatch.
 *
 * Props:
 *   onConsented: () => void — called after the user agrees and consent is stored.
 */
export default function ConsentModal({ onConsented }) {
  const navigate = useNavigate();
  const { grantConsent } = useConsent();
  const trapRef = useFocusTrap(true);

  const handleAgree = useCallback(() => {
    grantConsent();
    onConsented();
  }, [grantConsent, onConsented]);

  const handleDecline = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Escape key declines consent (GAP-11)
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleDecline(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleDecline]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Biometric Data Consent"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'linear-gradient(180deg, #141024 0%, #0d0a18 100%)',
          border: '1px solid rgba(94,92,230,0.25)',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(10,132,255,0.12)' }}
          >
            <ShieldCheck size={28} style={{ color: '#0a84ff' }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-4">
          Biometric Data Consent
        </h2>

        {/* Consent text */}
        <div
          className="rounded-xl p-4 mb-6 text-sm text-gray-300 leading-relaxed space-y-3 max-h-60 overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p>
            FamiliMatch uses AI to analyse facial features from photos you upload.
            Under the Illinois Biometric Information Privacy Act (BIPA) and similar
            laws, we need your informed consent before processing biometric data.
          </p>
          <p>
            <strong className="text-white">What we collect:</strong> Facial geometry
            measurements (eye spacing, face shape, feature proportions) derived from
            your uploaded photos.
          </p>
          <p>
            <strong className="text-white">How it is used:</strong> Solely to compute
            facial compatibility scores. Your data is processed on EU-based servers
            and is never stored after the session ends.
          </p>
          <p>
            <strong className="text-white">Your rights:</strong> You may revoke
            consent at any time, and all associated biometric data will be deleted.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAgree}
            className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-transform active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)',
              minHeight: '44px',
            }}
          >
            I Agree
          </button>

          <button
            onClick={handleDecline}
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-gray-200 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              minHeight: '44px',
            }}
          >
            No Thanks
          </button>
        </div>
      </motion.div>
    </div>
  );
}
