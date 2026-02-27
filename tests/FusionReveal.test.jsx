import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FusionReveal from '../src/components/FusionReveal';

describe('FusionReveal', () => {
  it('returns null when no fusion image', () => {
    const { container } = render(<FusionReveal fusionImage={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows Reveal Fusion button initially', () => {
    render(<FusionReveal fusionImage="base64data" />);
    expect(screen.getByText('Reveal Fusion')).toBeTruthy();
  });

  it('does not show the image before reveal', () => {
    const { container } = render(<FusionReveal fusionImage="base64data" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the image after clicking reveal', () => {
    const { container } = render(<FusionReveal fusionImage="base64data" />);
    fireEvent.click(screen.getByText('Reveal Fusion'));
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('data:image/jpeg;base64,base64data');
  });

  it('handles data URL images correctly', () => {
    const dataUrl = 'data:image/png;base64,abc123';
    const { container } = render(<FusionReveal fusionImage={dataUrl} />);
    fireEvent.click(screen.getByText('Reveal Fusion'));
    const img = container.querySelector('img');
    expect(img.src).toBe(dataUrl);
  });

  it('hides the button after reveal', () => {
    render(<FusionReveal fusionImage="base64data" />);
    fireEvent.click(screen.getByText('Reveal Fusion'));
    expect(screen.queryByText('Reveal Fusion')).toBeNull();
  });
});
