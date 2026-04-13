import { useState, useCallback, useRef, useEffect } from 'react';
import { MATCH_SERVER_URL } from '../utils/config';

const STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY = 1000; // 1s, 2s, 4s exponential backoff

export function useMatchConnection() {
  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  // Server-push events
  const [consentRequired, setConsentRequired] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [photosReady, setPhotosReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [results, setResults] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  const wsRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Use a ref for the message handler so the WebSocket always calls the latest version
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  // Reconnection state refs (stable across renders)
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const intentionalCloseRef = useRef(false);
  const tierTokenRef = useRef(null);

  const send = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Clear any pending reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Attempt auto-reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      // All retries exhausted
      setReconnecting(false);
      setStatus(STATUS.ERROR);
      setError('Connection lost \u2014 please rejoin the room');
      reconnectAttemptRef.current = 0;
      return;
    }

    const storedPlayerId = playerIdRef.current;
    const storedRoomCode = roomCodeRef.current;

    if (!storedPlayerId || !storedRoomCode) {
      // No room session to rejoin — just disconnect
      setReconnecting(false);
      setStatus(STATUS.DISCONNECTED);
      return;
    }

    setReconnecting(true);
    setStatus(STATUS.RECONNECTING);
    setError(null);

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, attempt); // 1s, 2s, 4s
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimerRef.current = setTimeout(() => {
      const url = tierTokenRef.current
        ? `${MATCH_SERVER_URL}?token=${encodeURIComponent(tierTokenRef.current)}`
        : MATCH_SERVER_URL;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        // Send rejoin immediately
        ws.send(JSON.stringify({
          type: 'rejoin_room',
          data: {
            player_id: storedPlayerId,
            room_code: storedRoomCode,
          },
        }));
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        // Will trigger onclose which handles retry
      };

      ws.onclose = () => {
        if (wsRef.current === ws && !intentionalCloseRef.current) {
          // Retry if we haven't exhausted attempts
          attemptReconnect();
        }
      };

      wsRef.current = ws;
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // handleMessage is stable (no deps), refs used for mutable values

  const handleMessage = useCallback((event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch { return; } // eslint-disable-line no-empty

    const { type, data } = msg;

    switch (type) {
      case 'room_created':
        setRoomCode(data.room_code);
        setPlayerId(data.player_id);
        setIsHost(true);
        setStatus(STATUS.CONNECTED);
        reconnectAttemptRef.current = 0;
        setReconnecting(false);
        break;

      case 'player_joined':
        setPlayers(data.players || []);
        if (data.player_id && !playerIdRef.current) {
          setPlayerId(data.player_id);
        }
        setStatus(STATUS.CONNECTED);
        reconnectAttemptRef.current = 0;
        setReconnecting(false);
        break;

      case 'rejoin_success':
        // Successfully reconnected — restore state
        setRoomCode(data.room_code);
        setPlayerId(data.player_id);
        setPlayers(data.players || []);
        setStatus(STATUS.CONNECTED);
        setReconnecting(false);
        setError(null);
        reconnectAttemptRef.current = 0;
        break;

      case 'player_reconnected':
        // Another player reconnected — update player list to include them
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === data.player_id);
          if (exists) return prev;
          return [...prev, { id: data.player_id, name: data.name }];
        });
        break;

      case 'player_left':
        setPlayers((prev) => prev.filter((p) => p.id !== data.player_id));
        break;

      case 'consent_required':
        setConsentRequired(true);
        break;

      case 'consent_granted':
        setGameStarted(true);
        break;

      case 'photo_received':
        break;

      case 'all_photos_in':
        setPhotosReady(true);
        break;

      case 'analyzing':
        setAnalyzing({ progress: data.progress, step: data.step });
        break;

      case 'countdown':
        setCountdown(data.seconds);
        break;

      case 'reveal':
      case 'group_reveal':
        setResults(data);
        setCountdown(null);
        setAnalyzing(null);
        break;

      case 'chat_message':
        setChatMessages(prev => [...prev.slice(-49), data]);
        break;

      case 'error':
        // If rejoin failed, stop reconnecting and show the error
        if (reconnectAttemptRef.current > 0 && data.message?.includes('Rejoin failed')) {
          setReconnecting(false);
          reconnectAttemptRef.current = 0;
          setStatus(STATUS.ERROR);
        }
        setError(data.message);
        break;

      default:
        break;
    }
  }, []); // No dependencies — uses refs for mutable values

  const connect = useCallback((onReady, tierToken) => {
    // Close previous connection cleanly
    intentionalCloseRef.current = true;
    clearReconnectTimer();
    if (wsRef.current) {
      const old = wsRef.current;
      wsRef.current = null;
      old.onclose = null; // Prevent stale onclose from firing
      old.close();
    }

    setStatus(STATUS.CONNECTING);
    setError(null);
    setReconnecting(false);
    reconnectAttemptRef.current = 0;
    intentionalCloseRef.current = false;

    // Store tier token for reconnection
    tierTokenRef.current = tierToken || null;

    // Append tier token to WebSocket URL if provided
    const url = tierToken
      ? `${MATCH_SERVER_URL}?token=${encodeURIComponent(tierToken)}`
      : MATCH_SERVER_URL;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus(STATUS.CONNECTED);
      if (onReady) onReady();
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      if (!intentionalCloseRef.current) {
        setStatus(STATUS.ERROR);
        setError('Connection error');
      }
    };

    ws.onclose = () => {
      // Only attempt reconnect if this is still the active WebSocket
      // and the close was not intentional (leave/unmount)
      if (wsRef.current === ws && !intentionalCloseRef.current) {
        // If we have a room session, try to reconnect
        if (playerIdRef.current && roomCodeRef.current) {
          attemptReconnect();
        } else {
          setStatus(STATUS.DISCONNECTED);
        }
      }
    };

    wsRef.current = ws;
  }, [handleMessage, attemptReconnect, clearReconnectTimer]);

  const createRoom = useCallback((name, roomType = 'duo') => {
    send('create_room', { name, room_type: roomType });
  }, [send]);

  const joinRoom = useCallback((name, code) => {
    send('join_room', { name, room_code: code });
  }, [send]);

  const grantConsent = useCallback(() => {
    send('grant_consent', {});
    setConsentRequired(false);
  }, [send]);

  const uploadPhoto = useCallback((photoBase64) => {
    const raw = photoBase64.includes(',')
      ? photoBase64.split(',')[1]
      : photoBase64;
    send('upload_photo', { photo: raw });
  }, [send]);

  const markReady = useCallback(() => {
    send('ready', {});
  }, [send]);

  const sendChat = useCallback((text) => {
    send('send_chat', { text });
  }, [send]);

  const leave = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimer();
    send('leave', {});
    setRoomCode(null);
    setPlayerId(null);
    setIsHost(false);
    setPlayers([]);
    setResults(null);
    setAnalyzing(null);
    setCountdown(null);
    setPhotosReady(false);
    setConsentRequired(false);
    setGameStarted(false);
    setReconnecting(false);
    setError(null);
    reconnectAttemptRef.current = 0;
    setStatus(STATUS.DISCONNECTED);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [send, clearReconnectTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clearReconnectTimer]);

  return {
    status,
    roomCode,
    playerId,
    isHost,
    players,
    error,
    reconnecting,
    consentRequired,
    gameStarted,
    photosReady,
    analyzing,
    countdown,
    results,
    connect,
    createRoom,
    joinRoom,
    grantConsent,
    uploadPhoto,
    markReady,
    sendChat,
    chatMessages,
    leave,
  };
}
