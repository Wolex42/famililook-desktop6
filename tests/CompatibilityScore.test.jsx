import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompatibilityScore from '../src/components/CompatibilityScore';

describe('CompatibilityScore', () => {
  it('renders the chemistry label', () => {
    render(
      <CompatibilityScore
        percentage={78}
        chemistryLabel="Magnetic Match"
        chemistryColor="#8B5CF6"
      />
    );
    expect(screen.getByText('Magnetic Match')).toBeTruthy();
  });

  it('renders an SVG circle', () => {
    const { container } = render(
      <CompatibilityScore
        percentage={50}
        chemistryLabel="Complementary Pair"
        chemistryColor="#3B82F6"
      />
    );
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('circle').length).toBe(2);
  });

  it('starts animation from 0', () => {
    render(
      <CompatibilityScore
        percentage={90}
        chemistryLabel="Feature Twins"
        chemistryColor="#FFD700"
      />
    );
    // Initially shows 0% before animation kicks in
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('applies the chemistry color to the label', () => {
    render(
      <CompatibilityScore
        percentage={45}
        chemistryLabel="Interesting Contrast"
        chemistryColor="#14B8A6"
      />
    );
    const label = screen.getByText('Interesting Contrast');
    expect(label.style.color).toBeTruthy();
  });
});
