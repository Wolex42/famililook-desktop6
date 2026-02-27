import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock MatchContext
const mockReset = vi.fn();
const mockMatchState = {
  mode: 'duo',
  results: null,
  reset: mockReset,
};

vi.mock('../src/state/MatchContext', () => ({
  useMatch: () => mockMatchState,
}));

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ResultsPage from '../src/pages/ResultsPage';

describe('ResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchState.mode = 'duo';
    mockMatchState.results = null;
  });

  it('shows no results message when results is null', () => {
    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('No results yet')).toBeTruthy();
  });

  it('shows Start a comparison button when no results', () => {
    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Start a comparison')).toBeTruthy();
  });

  it('navigates home on Play Again click', () => {
    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Start a comparison'));
    expect(mockReset).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders duo results — shows chemistry label on score card', () => {
    mockMatchState.results = {
      percentage: 72,
      chemistry_label: 'Magnetic Match',
      chemistry_color: '#8B5CF6',
      feature_comparisons: [
        { feature: 'eyes', label_a: 'Round', label_b: 'Round', match: true },
      ],
      fusion_image: null,
      players: { p1: 'Alice', p2: 'Bob' },
    };

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    // ResultsStory Card 1 shows chemistry label (in DOM even if animated)
    expect(screen.getByText('Magnetic Match')).toBeTruthy();
    // Continue button visible on card 1
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('renders group results with progressive matrix and Play Again', () => {
    mockMatchState.mode = 'group';
    mockMatchState.results = {
      pairs: [
        {
          a_id: 'p1', a_name: 'Alice',
          b_id: 'p2', b_name: 'Bob',
          result: { percentage: 78, chemistry_label: 'Magnetic Match', chemistry_color: '#8B5CF6' },
        },
      ],
      winner_pair: { a: 'Alice', b: 'Bob' },
      winner_score: 78,
      total_comparisons: 1,
    };

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    // GroupMatrix renders reveal label immediately
    expect(screen.getByText('Revealing results...')).toBeTruthy();
    // Play Again button visible for group mode
    expect(screen.getByText('Play Again')).toBeTruthy();
  });

  it('shows ResultsStory (chemistry label) when duo results exist', () => {
    mockMatchState.results = {
      percentage: 50,
      chemistry_label: 'Complementary Pair',
      chemistry_color: '#3B82F6',
      feature_comparisons: [],
      players: {},
    };

    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Complementary Pair')).toBeTruthy();
  });
});
