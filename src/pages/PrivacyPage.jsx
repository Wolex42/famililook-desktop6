import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

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

export default function PrivacyPage() {
  const navigate = useNavigate();

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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </header>

      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>

        <div className="bg-surface rounded-2xl p-6 border border-gray-800 space-y-4 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Photo Processing</h2>
            <p>
              All photos are processed in memory only. They are never written to disk and are
              automatically deleted when your session ends or when you leave a room.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Biometric Data</h2>
            <p>
              Facial embeddings and feature analysis are computed during your session for
              comparison purposes. No biometric data is stored permanently or shared with
              third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Your Rights</h2>
            <p>
              You can revoke consent at any time. Under BIPA and GDPR, you have the right
              to request deletion of any data associated with your session.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
