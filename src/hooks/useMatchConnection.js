import { useState, useCallback, useRef, useEffect } from 'react';
import { MATCH_SERVER_URL } from '../utils/config';

const STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
};

export function useMatchConnection() {
  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);

  // Server-push events
  const [consentRequired, setConsentRequired] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [photosReady, setPhotosReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [results, setResults] = useState(null);

  const wsRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Use a ref for the message handler so the WebSocket always calls the latest version
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  const send = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const handleMessage = useCallback((event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    const { type, data } = msg;

    switch (type) {
      case 'room_created':
        setRoomCode(data.room_code);
        setPlayerId(data.player_id);
        setIsHost(true);
        setStatus(STATUS.CONNECTED);
        break;

      case 'player_joined':
        setPlayers(data.players || []);
        if (data.player_id && !playerIdRef.current) {
          setPlayerId(data.player_id);
        }
        setStatus(STATUS.CONNECTED);
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

      case 'error':
        setError(data.message);
        break;

      default:
        break;
    }
  }, []); // No dependencies — uses refs for mutable values

  const connect = useCallback((onReady) => {
    // Close previous connection cleanly
    if (wsRef.current) {
      const old = wsRef.current;
      wsRef.current = null;
      old.onclose = null; // Prevent stale onclose from firing
      old.close();
    }

    setStatus(STATUS.CONNECTING);
    setError(null);

    const ws = new WebSocket(MATCH_SERVER_URL);

    ws.onopen = () => {
      setStatus(STATUS.CONNECTED);
      if (onReady) onReady();
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      setStatus(STATUS.ERROR);
      setError('Connection error');
    };

    ws.onclose = () => {
      // Only update status if this is still the active WebSocket
      if (wsRef.current === ws) {
        setStatus(STATUS.DISCONNECTED);
      }
    };

    wsRef.current = ws;
  }, [handleMessage]);

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

  const leave = useCallback(() => {
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
    setStatus(STATUS.DISCONNECTED);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    status,
    roomCode,
    playerId,
    isHost,
    players,
    error,
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
    leave,
  };
}
