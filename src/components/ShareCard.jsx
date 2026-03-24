// ShareCard.jsx — Shareable result card for FamiliMatch comparisons
// No real faces (privacy) — uses initials + score + chemistry label
// Captured via html2canvas for sharing

import { useRef, useState, useCallback } from 'react';
import { analytics } from '../utils/analytics';

const MATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';
const SHARE_URL = 'https://famililook-desktop6.vercel.app';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ShareCard({ result, onClose }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#000',
        useCORS: true,
      });
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'familimatch-result.png', { type: 'image/png' });

      const shareText = `We're ${result.percentage}% alike! ${result.chemistry_label} — Try FamiliMatch: ${SHARE_URL}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] });
        analytics.track('share_completed', { method: 'native_with_file', percentage: result.percentage });
      } else if (navigator.share) {
        await navigator.share({ text: shareText, url: SHARE_URL });
        analytics.track('share_completed', { method: 'native_url', percentage: result.percentage });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'familimatch-result.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    } finally {
      setSharing(false);
    }
  }, [result]);

  if (!result) return null;

  const { percentage, chemistry_label, chemistry_color, name_a, name_b, shared_features, feature_comparisons } = result;
  const matchCount = shared_features?.length || 0;
  const totalFeatures = feature_comparisons?.length || 8;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Share card (captured by html2canvas) */}
      <div
        ref={cardRef}
        style={{
          width: 320, padding: 32,
          background: '#0a0a0a',
          borderRadius: 24,
          border: `2px solid ${chemistry_color || '#5e5ce6'}40`,
          textAlign: 'center',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        {/* Initials */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          {[name_a, name_b].map((name, i) => (
            <div key={i} style={{
              width: 56, height: 56, borderRadius: '50%',
              background: i === 0 ? MATCH_GRADIENT : 'linear-gradient(145deg, #ec4899, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#fff',
            }}>
              {getInitials(name)}
            </div>
          ))}
        </div>

        {/* Names */}
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          {name_a || 'Person A'} & {name_b || 'Person B'}
        </div>

        {/* Percentage */}
        <div style={{
          fontSize: 56, fontWeight: 900, letterSpacing: '-2px',
          background: MATCH_GRADIENT,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}>
          {percentage}%
        </div>

        {/* Chemistry label */}
        <div style={{
          display: 'inline-block',
          padding: '6px 16px', borderRadius: 99,
          background: `${chemistry_color || '#5e5ce6'}20`,
          color: chemistry_color || '#5e5ce6',
          fontSize: 14, fontWeight: 700,
          marginBottom: 16,
        }}>
          {chemistry_label}
        </div>

        {/* Feature match count */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          {matchCount}/{totalFeatures} features match
        </div>

        {/* Branding */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
        }}>
          FamiliMatch — How alike are you really?
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', minHeight: 44,
          }}
        >
          Close
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            padding: '12px 24px', borderRadius: 12,
            background: MATCH_GRADIENT, border: 'none',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: sharing ? 'wait' : 'pointer', minHeight: 44,
            opacity: sharing ? 0.7 : 1,
          }}
        >
          {sharing ? 'Sharing...' : 'Share Result'}
        </button>
      </div>
    </div>
  );
}
