import { useConsent } from '../state/ConsentContext';

const BIPA_TEXT =
  'This app processes your facial features for comparison purposes only. ' +
  'Photos are held in memory during your session and automatically deleted when you leave. ' +
  'No biometric data is stored permanently. By consenting, you acknowledge this processing ' +
  'under applicable biometric privacy laws (BIPA/GDPR).';

export default function ConsentModal({ onConsented }) {
  const { grantConsent } = useConsent();

  const handleAccept = () => {
    grantConsent();
    onConsented?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl pb-[env(safe-area-inset-bottom,8px)]">
        <h2 className="text-xl font-bold mb-4">Privacy Consent</h2>

        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          {BIPA_TEXT}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-4 rounded-xl border border-gray-600 text-gray-300 hover:bg-surface-light transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            I Consent
          </button>
        </div>

        <p className="text-xs text-text-muted mt-4 text-center">
          You can revoke consent at any time from the privacy page.
        </p>
      </div>
    </div>
  );
}
