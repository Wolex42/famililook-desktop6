import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConsentProvider } from './state/ConsentContext';
import { MatchProvider } from './state/MatchContext';
import ErrorToast from './components/ui/ErrorToast';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const SoloPage    = lazy(() => import('./pages/SoloPage'));
const RoomPage    = lazy(() => import('./pages/RoomPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage   = lazy(() => import('./pages/TermsPage'));

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0A0A0F' }}
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400/70 dot-bounce"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConsentProvider>
        <MatchProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/solo"    element={<SoloPage />} />
              <Route path="/room"    element={<RoomPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms"   element={<TermsPage />} />
            </Routes>
          </Suspense>
          <ErrorToast />
        </MatchProvider>
      </ConsentProvider>
    </BrowserRouter>
  );
}
