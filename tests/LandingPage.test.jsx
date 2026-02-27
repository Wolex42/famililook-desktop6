import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConsentProvider } from '../src/state/ConsentContext';
import { MatchProvider } from '../src/state/MatchContext';
import LandingPage from '../src/pages/LandingPage';

const renderLanding = () => {
  render(
    <MemoryRouter>
      <ConsentProvider>
        <MatchProvider>
          <LandingPage />
        </MatchProvider>
      </ConsentProvider>
    </MemoryRouter>
  );
};

describe('LandingPage', () => {
  it('renders the headline', () => {
    renderLanding();
    expect(screen.getByText('How Compatible')).toBeInTheDocument();
    expect(screen.getByText('Are You?')).toBeInTheDocument();
  });

  it('shows three mode cards', () => {
    renderLanding();
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('Duo')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('shows mode descriptions', () => {
    renderLanding();
    expect(screen.getByText('Upload two photos, see your compatibility instantly')).toBeInTheDocument();
    expect(screen.getByText('Compare face-to-face in real-time with a friend')).toBeInTheDocument();
    expect(screen.getByText(/3-6 players/)).toBeInTheDocument();
  });

  it('shows consent modal when clicking without consent', async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByText('Solo'));
    expect(screen.getByText('Privacy Consent')).toBeInTheDocument();
    expect(screen.getByText('I Consent')).toBeInTheDocument();
  });

  it('has privacy and terms links', () => {
    renderLanding();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
  });
});
