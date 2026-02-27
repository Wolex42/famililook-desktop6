import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeatureComparison from '../src/components/FeatureComparison';

const mockFeatures = [
  { feature: 'eyes', label_a: 'Round', label_b: 'Round', match: true },
  { feature: 'eyebrows', label_a: 'Thick', label_b: 'Thin', match: false },
  { feature: 'smile', label_a: 'Wide', label_b: 'Wide', match: true },
  { feature: 'nose', label_a: 'Narrow', label_b: 'Wide', match: false },
  { feature: 'face_shape', label_a: 'Oval', label_b: 'Oval', match: true },
  { feature: 'skin', label_a: 'Fair', label_b: 'Medium', match: false },
  { feature: 'hair', label_a: 'Dark', label_b: 'Dark', match: true },
  { feature: 'ears', label_a: 'Small', label_b: 'Large', match: false },
];

describe('FeatureComparison', () => {
  it('renders all 8 features', () => {
    const { container } = render(<FeatureComparison features={mockFeatures} />);
    // 8 feature rows
    const rows = container.querySelectorAll('[class*="rounded-xl"]');
    expect(rows.length).toBeGreaterThanOrEqual(8);
  });

  it('shows match count summary', () => {
    render(<FeatureComparison features={mockFeatures} />);
    expect(screen.getByText('4 of 8 features match')).toBeTruthy();
  });

  it('shows = for matching features', () => {
    render(<FeatureComparison features={mockFeatures} />);
    // 4 matches should show =
    const equals = screen.getAllByText('=');
    expect(equals.length).toBe(4);
  });

  it('returns null for empty features', () => {
    const { container } = render(<FeatureComparison features={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for null features', () => {
    const { container } = render(<FeatureComparison features={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('displays label_a and label_b for each feature', () => {
    render(<FeatureComparison features={mockFeatures} />);
    // "Round" appears twice (label_a and label_b for eyes)
    expect(screen.getAllByText('Round').length).toBe(2);
    expect(screen.getByText('Thick')).toBeTruthy();
    expect(screen.getByText('Thin')).toBeTruthy();
  });

  it('highlights matching features with green', () => {
    const { container } = render(<FeatureComparison features={mockFeatures} />);
    const greenRows = container.querySelectorAll('[class*="bg-green"]');
    expect(greenRows.length).toBe(4);
  });
});
