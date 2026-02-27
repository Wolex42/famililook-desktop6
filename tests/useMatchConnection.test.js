import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchConnection } from '../src/hooks/useMatchConnection';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.OPEN;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    MockWebSocket.instances.push(this);
    // Auto-trigger onopen
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  // Test helper: simulate server message
  _receive(msg) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe('useMatchConnection', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts disconnected', () => {
    const { result } = renderHook(() => useMatchConnection());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.roomCode).toBeNull();
    expect(result.current.players).toEqual([]);
  });

  it('connects and creates a WebSocket', async () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(result.current.status).toBe('connecting');
  });

  it('sends create_room message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    act(() => {
      result.current.createRoom('Alice', 'duo');
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.sent).toHaveLength(1);
    expect(ws.sent[0].type).toBe('create_room');
    expect(ws.sent[0].data.name).toBe('Alice');
    expect(ws.sent[0].data.room_type).toBe('duo');
  });

  it('sends join_room message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    act(() => {
      result.current.joinRoom('Bob', '1234');
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.sent[0].type).toBe('join_room');
    expect(ws.sent[0].data.room_code).toBe('1234');
  });

  it('handles room_created server message', async () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({
        type: 'room_created',
        data: { room_code: '5678', player_id: 'p_1', room_type: 'duo' },
      });
    });

    expect(result.current.roomCode).toBe('5678');
    expect(result.current.playerId).toBe('p_1');
    expect(result.current.isHost).toBe(true);
  });

  it('handles player_joined server message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({
        type: 'player_joined',
        data: {
          player_id: 'p_2',
          players: [
            { id: 'p_1', name: 'Alice' },
            { id: 'p_2', name: 'Bob' },
          ],
        },
      });
    });

    expect(result.current.players).toHaveLength(2);
  });

  it('handles error server message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({
        type: 'error',
        data: { message: 'Room not found' },
      });
    });

    expect(result.current.error).toBe('Room not found');
  });

  it('sends upload_photo with stripped base64', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    act(() => {
      result.current.uploadPhoto('data:image/jpeg;base64,abc123');
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.sent[0].type).toBe('upload_photo');
    expect(ws.sent[0].data.photo).toBe('abc123'); // prefix stripped
  });

  it('leave resets all state', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({
        type: 'room_created',
        data: { room_code: '1234', player_id: 'p_1', room_type: 'duo' },
      });
    });

    expect(result.current.roomCode).toBe('1234');

    act(() => {
      result.current.leave();
    });

    expect(result.current.roomCode).toBeNull();
    expect(result.current.playerId).toBeNull();
    expect(result.current.status).toBe('disconnected');
  });

  it('handles countdown message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({ type: 'countdown', data: { seconds: 3 } });
    });

    expect(result.current.countdown).toBe(3);
  });

  it('handles reveal message', () => {
    const { result } = renderHook(() => useMatchConnection());

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];

    act(() => {
      ws._receive({
        type: 'reveal',
        data: { score: 0.78, percentage: 78, chemistry_label: 'Magnetic Match' },
      });
    });

    expect(result.current.results).toBeDefined();
    expect(result.current.results.percentage).toBe(78);
    expect(result.current.countdown).toBeNull();
  });
});
