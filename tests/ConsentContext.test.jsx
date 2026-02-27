import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentProvider, useConsent } from '../src/state/ConsentContext';

function TestConsumer() {
  const { consent, grantConsent, revokeConsent } = useConsent();
  return (
    <div>
      <span data-testid="status">{consent.bipaConsented ? 'yes' : 'no'}</span>
      <button onClick={grantConsent}>Grant</button>
      <button onClick={revokeConsent}>Revoke</button>
    </div>
  );
}

describe('ConsentContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to not consented', () => {
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>
    );
    expect(screen.getByTestId('status').textContent).toBe('no');
  });

  it('grants consent', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>
    );

    await user.click(screen.getByText('Grant'));
    expect(screen.getByTestId('status').textContent).toBe('yes');
  });

  it('persists consent to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>
    );

    await user.click(screen.getByText('Grant'));
    const stored = JSON.parse(localStorage.getItem('fl:bipa-consent'));
    expect(stored.bipaConsented).toBe(true);
    expect(stored.timestamp).toBeGreaterThan(0);
  });

  it('revokes consent', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <TestConsumer />
      </ConsentProvider>
    );

    await user.click(screen.getByText('Grant'));
    expect(screen.getByTestId('status').textContent).toBe('yes');

    await user.click(screen.getByText('Revoke'));
    expect(screen.getByTestId('status').textContent).toBe('no');
  });

  it('throws when used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useConsent must be inside ConsentProvider'
    );
  });
});
