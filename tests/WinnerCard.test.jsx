import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WinnerCard from '../src/components/WinnerCard';

describe('WinnerCard', () => {
  it('renders winner names', () => {
    render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={85}
      />
    );
    expect(screen.getByText('Alice & Bob')).toBeTruthy();
  });

  it('displays percentage from winnerScore', () => {
    render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={78}
      />
    );
    expect(screen.getByText('78%')).toBeTruthy();
  });

  it('shows chemistry label', () => {
    render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={90}
      />
    );
    // 90% → Feature Twins
    expect(screen.getByText('Feature Twins')).toBeTruthy();
  });

  it('shows Most Compatible heading', () => {
    render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={50}
      />
    );
    expect(screen.getByText('Most Compatible')).toBeTruthy();
  });

  it('renders fusion image when provided', () => {
    const { container } = render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={70}
        fusionImage="base64data"
      />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('data:image/jpeg;base64,base64data');
  });

  it('does not render image when no fusion', () => {
    const { container } = render(
      <WinnerCard
        winnerPair={{ a: 'Alice', b: 'Bob' }}
        winnerScore={70}
      />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('handles 0 score gracefully', () => {
    render(
      <WinnerCard
        winnerPair={{ a: 'X', b: 'Y' }}
        winnerScore={0}
      />
    );
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('Opposites Attract')).toBeTruthy();
  });
});
