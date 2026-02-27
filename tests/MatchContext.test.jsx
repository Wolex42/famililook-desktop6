import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchProvider, useMatch } from '../src/state/MatchContext';

function TestConsumer() {
  const state = useMatch();
  return (
    <div>
      <span data-testid="mode">{state.mode || 'null'}</span>
      <span data-testid="status">{state.status}</span>
      <span data-testid="roomCode">{state.roomCode || 'null'}</span>
      <span data-testid="isHost">{String(state.isHost)}</span>
      <span data-testid="players">{state.players.length}</span>
      <span data-testid="error">{state.error || 'null'}</span>
      <button onClick={() => state.setMode('solo')}>Solo</button>
      <button onClick={() => state.setMode('duo')}>Duo</button>
      <button onClick={() => state.setRoom('ABCD', true, 'p1')}>SetRoom</button>
      <button onClick={() => state.setStatus('analyzing')}>Analyze</button>
      <button onClick={() => state.setPhoto('data:image/jpeg;base64,abc')}>Photo</button>
      <button onClick={() => state.updatePlayers([{ id: 'p1', name: 'A' }])}>AddPlayer</button>
      <button onClick={() => state.setResults({ score: 75 })}>Results</button>
      <button onClick={() => state.setError('Connection lost')}>Error</button>
      <button onClick={() => state.reset()}>Reset</button>
    </div>
  );
}

describe('MatchContext', () => {
  const renderWithProvider = () => {
    const user = userEvent.setup();
    render(
      <MatchProvider>
        <TestConsumer />
      </MatchProvider>
    );
    return user;
  };

  it('starts with idle state', () => {
    renderWithProvider();
    expect(screen.getByTestId('mode').textContent).toBe('null');
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('sets mode', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('Solo'));
    expect(screen.getByTestId('mode').textContent).toBe('solo');
  });

  it('sets room info', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('SetRoom'));
    expect(screen.getByTestId('roomCode').textContent).toBe('ABCD');
    expect(screen.getByTestId('isHost').textContent).toBe('true');
    expect(screen.getByTestId('status').textContent).toBe('lobby');
  });

  it('updates players', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('AddPlayer'));
    expect(screen.getByTestId('players').textContent).toBe('1');
  });

  it('sets results and switches to results status', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('Results'));
    expect(screen.getByTestId('status').textContent).toBe('results');
  });

  it('sets error and resets status to idle', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('Analyze'));
    expect(screen.getByTestId('status').textContent).toBe('analyzing');

    await user.click(screen.getByText('Error'));
    expect(screen.getByTestId('error').textContent).toBe('Connection lost');
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('resets all state', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('Duo'));
    await user.click(screen.getByText('SetRoom'));
    expect(screen.getByTestId('mode').textContent).toBe('duo');

    await user.click(screen.getByText('Reset'));
    expect(screen.getByTestId('mode').textContent).toBe('null');
    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(screen.getByTestId('roomCode').textContent).toBe('null');
  });

  it('SET_MODE resets to initial state with new mode', async () => {
    const user = renderWithProvider();
    await user.click(screen.getByText('Duo'));
    await user.click(screen.getByText('SetRoom'));
    await user.click(screen.getByText('Solo'));
    // Setting mode resets everything
    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(screen.getByTestId('roomCode').textContent).toBe('null');
  });

  it('throws when used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useMatch must be inside MatchProvider'
    );
  });
});
