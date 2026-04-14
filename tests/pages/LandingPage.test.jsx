/**
 * FM-006 — LandingPage tests.
 * Verifies mode card rendering, tier gating, and consent modal trigger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConsentProvider } from '../../src/state/ConsentContext';
import { MatchProvider } from '../../src/state/MatchContext';
import LandingPage from '../../src/pages/LandingPage';

// ── Mock dependencies ───────────────────────────────────────────────────────

vi.mock('../../src/utils/config', () => ({
  API_BASE: 'http://test-api:8008',
  API_KEY: '',
}));

vi.mock('../../src/utils/analytics', () => ({
  analytics: {
    trackPageView: vi.fn(),
    trackAction: vi.fn(),
    trackButtonClick: vi.fn(),
    trackModeSelected: vi.fn(),
    track: vi.fn(),
    fireSessionStart: vi.fn(),
  },
}));

vi.mock('../../src/hooks/useMatchHistory', () => ({
  useMatchHistory: () => ({
    history: [],
    addEntry: vi.fn(),
    clearHistory: vi.fn(),
  }),
}));

// Stub framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    p: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
    h1: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <h1 {...rest}>{children}</h1>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderLanding(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ConsentProvider>
        <MatchProvider>
          <LandingPage />
        </MatchProvider>
      </ConsentProvider>
    </MemoryRouter>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('mode card rendering', () => {
    it('renders 3 mode cards: Solo, Duo, Group', () => {
      renderLanding();

      expect(screen.getByText('Solo')).toBeInTheDocument();
      expect(screen.getByText('Duo')).toBeInTheDocument();
      expect(screen.getByText('Group')).toBeInTheDocument();
    });

    it('renders description for each mode', () => {
      renderLanding();

      expect(
        screen.getByText('Upload two photos, see your compatibility instantly'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Compare face-to-face in real-time with a friend'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/3-6 players/),
      ).toBeInTheDocument();
    });
  });

  describe('tier gating (free tier)', () => {
    it('Solo card does NOT show lock badge on free tier', () => {
      renderLanding();

      // Solo should show "Instant" badge, not "Plus"
      expect(screen.getByText('Instant')).toBeInTheDocument();
    });

    it('Duo card shows Plus lock badge on free tier', () => {
      renderLanding();

      // Duo and Group should show "Plus" lock badges
      const plusBadges = screen.getAllByText('Plus');
      expect(plusBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('Group card shows Plus lock badge on free tier', () => {
      renderLanding();

      // Both Duo and Group are locked, each shows "Plus"
      const plusBadges = screen.getAllByText('Plus');
      expect(plusBadges.length).toBe(2);
    });
  });

  describe('tier gating (plus tier)', () => {
    it('all modes are unlocked when a valid plus token is provided', () => {
      // Create a fake token with base64-encoded payload (signature not validated client-side)
      const payload = btoa(JSON.stringify({ tier: 'plus', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const fakeToken = `${payload}.fakesig`;
      renderLanding(`/?token=${encodeURIComponent(fakeToken)}`);

      // Should show badges Instant, Live, Party (not Plus lock)
      expect(screen.getByText('Instant')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Party')).toBeInTheDocument();
      expect(screen.queryAllByText('Plus')).toHaveLength(0);
    });
  });

  describe('consent modal', () => {
    it('shows consent modal when selecting Solo without prior consent', () => {
      renderLanding();

      // Click the primary CTA button (Try It Now)
      const ctaButton = screen.getByText(/Compare Now/);
      fireEvent.click(ctaButton);

      // Consent modal should appear
      expect(screen.getByText('Biometric Data Consent')).toBeInTheDocument();
    });

    it('shows consent modal when clicking a Solo mode card without consent', () => {
      renderLanding();

      // Click the Solo mode card
      const soloCard = screen.getByText('Solo').closest('button');
      fireEvent.click(soloCard);

      expect(screen.getByText('Biometric Data Consent')).toBeInTheDocument();
    });

    it('does NOT show consent modal if consent was already given', () => {
      localStorage.setItem(
        'fl:bipa-consent',
        JSON.stringify({ bipaConsented: true, timestamp: '2026-01-01T00:00:00.000Z' }),
      );

      renderLanding();

      const soloCard = screen.getByText('Solo').closest('button');
      fireEvent.click(soloCard);

      // Consent modal should NOT appear
      expect(screen.queryByText('Biometric Data Consent')).not.toBeInTheDocument();
    });

    it('shows upgrade prompt when clicking a locked mode', () => {
      renderLanding();

      // Click the Duo card (locked on free tier)
      const duoCard = screen.getByText('Duo').closest('button');
      fireEvent.click(duoCard);

      // Should show upgrade prompt, NOT consent modal
      expect(screen.getByText(/Unlock .+ Mode/)).toBeInTheDocument();
      expect(screen.queryByText('Biometric Data Consent')).not.toBeInTheDocument();
    });
  });
});
