// ShareCard.jsx — 9:16 shareable result card for Stories/TikTok
// Captured via html2canvas at 1080x1920, previewed at 270x480
// Uses inline styles throughout (html2canvas strips Tailwind)

import { useRef, useState, useCallback } from 'react';
import { analytics } from '../utils/analytics';

const MATCH_GRADIENT = 'linear-gradient(145deg, #0a84ff 0%, #5e5ce6 100%)';
const SHARE_URL = 'https://familimatch.com/?ref=share';

function getInitials(name) {
  if (!name) return null;
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Simple SVG person icon for html2canvas (Lucide icons don't survive capture)
const PERSON_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>')}`;

export default function ShareCard({ result, onClose }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    analytics.track('share_initiated', { percentage: result.percentage });

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0F',
        useCORS: true,
        width: 1080,
        height: 1920,
      });
      // html2canvas output → Blob for navigator.share()
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'familimatch-result.png', { type: 'image/png' });

      const shareText = `We're ${result.percentage}% alike! ${result.chemistry_label} — Try FamiliMatch: ${SHARE_URL}`;

      // Priority 1: Native share with Blob image file
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] });
        analytics.track('share_completed', { method: 'native_with_file', percentage: result.percentage });
      } else if (navigator.clipboard?.write) {
        // Priority 2: Desktop fallback — copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        analytics.track('share_completed', { method: 'clipboard', percentage: result.percentage });
        alert('Image copied to clipboard!');
      } else {
        // Priority 3: Final fallback — download PNG
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'familimatch-result.png';
        a.click();
        URL.revokeObjectURL(url);
        analytics.track('share_completed', { method: 'download', percentage: result.percentage });
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
  const initialsA = getInitials(name_a);
  const initialsB = getInitials(name_b);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* 9:16 Share card — rendered at 1080x1920, previewed at 270x480 */}
      <div style={{ width: 270, height: 480, overflow: 'hidden', borderRadius: 16, position: 'relative' }}>
        <div
          ref={cardRef}
          style={{
            width: 1080, height: 1920,
            transform: 'scale(0.25)', transformOrigin: 'top left',
            background: 'linear-gradient(180deg, #0A0A0F 0%, #0D0820 60%, #0A0A0F 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '120px 48px 80px',
            boxSizing: 'border-box',
            position: 'absolute', top: 0, left: 0,
          }}
        >
          {/* Brand */}
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ffffff', marginBottom: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>&#10024;</span> FamiliMatch
          </div>

          {/* Initials circles — fallback to person icon if no name */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            {[{ name: name_a, initials: initialsA, bg: MATCH_GRADIENT }, { name: name_b, initials: initialsB, bg: 'linear-gradient(145deg, #ec4899, #f97316)' }].map((person, i) => (
              <div key={i} style={{
                width: 96, height: 96, borderRadius: '50%',
                background: person.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: '#fff',
              }}>
                {person.initials || <img src={PERSON_SVG} alt="" style={{ width: 40, height: 40 }} />}
              </div>
            ))}
          </div>

          {/* Names */}
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 48 }}>
            {name_a || 'Person A'} & {name_b || 'Person B'}
          </div>

          {/* Percentage */}
          <div style={{
            fontSize: 96, fontWeight: 800, letterSpacing: '-3px', lineHeight: 1,
            background: MATCH_GRADIENT,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 12,
          }}>
            {percentage}%
          </div>

          {/* Chemistry label */}
          <div style={{
            display: 'inline-block',
            padding: '10px 28px', borderRadius: 99,
            background: `${chemistry_color || '#5e5ce6'}20`,
            color: chemistry_color || '#5e5ce6',
            fontSize: 18, fontWeight: 700,
            marginBottom: 40,
          }}>
            {chemistry_label}
          </div>

          {/* Feature section */}
          <div style={{ width: '100%', maxWidth: 600 }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20 }}>
              {matchCount} of {totalFeatures} features match
            </div>

            {/* Feature grid — 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 40px' }}>
              {(feature_comparisons || []).map((fc) => (
                <div key={fc.feature} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 14, fontWeight: 500,
                  color: fc.match ? '#22c55e' : 'rgba(255,255,255,0.25)',
                }}>
                  <span style={{ fontSize: 16 }}>{fc.match ? '\u2713' : '\u2717'}</span>
                  <span style={{ textTransform: 'capitalize' }}>{fc.feature.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer CTA */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              How alike are you really?
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#60a5fa' }}>
              familimatch.com
            </div>
          </div>
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
          {sharing ? 'Sharing...' : 'Share Your Score'}
        </button>
      </div>
    </div>
  );
}
