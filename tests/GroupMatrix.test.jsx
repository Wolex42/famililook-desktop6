import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import GroupMatrix from '../src/components/GroupMatrix';

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Step through fake timers to reveal all 3 pairs + winner.
 * Each act() flush ensures useEffect re-registers the next timer.
 */
async function revealAll() {
  await act(() => vi.advanceTimersByTime(500));   // pair 1 (400ms)
  await act(() => vi.advanceTimersByTime(1900));  // pair 2 (1800ms)
  await act(() => vi.advanceTimersByTime(1900));  // pair 3 (1800ms)
  await act(() => vi.advanceTimersByTime(2100));  // winner (2000ms after all pairs)
}

const mockMatrixData = {
  pairs: [
    {
      a_id: 'p1', a_name: 'Alice',
      b_id: 'p2', b_name: 'Bob',
      result: { percentage: 78, chemistry_label: 'Magnetic Match', chemistry_color: '#8B5CF6' },
    },
    {
      a_id: 'p1', a_name: 'Alice',
      b_id: 'p3', b_name: 'Carol',
      result: { percentage: 55, chemistry_label: 'Complementary Pair', chemistry_color: '#3B82F6' },
    },
    {
      a_id: 'p2', a_name: 'Bob',
      b_id: 'p3', b_name: 'Carol',
      result: { percentage: 42, chemistry_label: 'Interesting Contrast', chemistry_color: '#14B8A6' },
    },
  ],
  winner_pair: { a: 'Alice', b: 'Bob' },
  winner_score: 78,
  total_comparisons: 3,
};

describe('GroupMatrix', () => {
  it('returns null when no matrix data', () => {
    const { container } = render(<GroupMatrix matrixData={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all pairs after progressive reveal', async () => {
    vi.useFakeTimers();
    render(<GroupMatrix matrixData={mockMatrixData} />);
    await revealAll();
    // "Alice & Bob" appears once in the grid (winner pair)
    expect(screen.getAllByText('Alice & Bob').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Alice & Carol')).toBeTruthy();
    expect(screen.getByText('Bob & Carol')).toBeTruthy();
  });

  it('displays percentages for each pair after reveal', async () => {
    vi.useFakeTimers();
    render(<GroupMatrix matrixData={mockMatrixData} />);
    await revealAll();
    expect(screen.getAllByText('78%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('55%')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it('renders the winner card with Most Compatible heading after reveal', async () => {
    vi.useFakeTimers();
    render(<GroupMatrix matrixData={mockMatrixData} />);
    await revealAll();
    expect(screen.getByText('Most Compatible')).toBeTruthy();
  });

  it('shows nothing initially (progressive reveal starts with 0 visible)', () => {
    render(<GroupMatrix matrixData={mockMatrixData} />);
    // Before any timers fire, no pair names visible
    expect(screen.queryByText('Alice & Carol')).toBeNull();
    expect(screen.queryByText('Bob & Carol')).toBeNull();
  });

  it('shows reveal status label', () => {
    render(<GroupMatrix matrixData={mockMatrixData} />);
    expect(screen.getByText('Revealing results...')).toBeTruthy();
  });
});
