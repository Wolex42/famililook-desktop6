import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock ConsentContext
vi.mock('../src/state/ConsentContext', () => ({
  useConsent: () => ({
    consent: { bipaConsented: true },
    grantBipaConsent: vi.fn(),
  }),
}));

// Mock matchClient
vi.mock('../src/api/matchClient', () => ({
  compareSolo: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock MatchContext — provide a userName so onboarding is skipped
vi.mock('../src/state/MatchContext', () => ({
  useMatch: () => ({
    userName: 'TestUser',
    setUserName: vi.fn(),
  }),
}));

import SoloPage from '../src/pages/SoloPage';

describe('SoloPage', () => {
  it('renders heading and photo upload areas', () => {
    render(
      <MemoryRouter>
        <SoloPage />
      </MemoryRouter>
    );
    // Heading uses userName if available
    expect(screen.getByText("TestUser's Compare")).toBeTruthy();
    expect(screen.getByText('Photo A')).toBeTruthy();
    expect(screen.getByText('Photo B')).toBeTruthy();
  });

  it('renders Compare Faces button', () => {
    render(
      <MemoryRouter>
        <SoloPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Compare Faces')).toBeTruthy();
  });

  it('Compare Faces button is disabled initially (no photos)', () => {
    render(
      <MemoryRouter>
        <SoloPage />
      </MemoryRouter>
    );
    const btn = screen.getByText('Compare Faces').closest('button');
    expect(btn.disabled).toBe(true);
  });

  it('renders Back button', () => {
    render(
      <MemoryRouter>
        <SoloPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Back')).toBeTruthy();
  });
});
