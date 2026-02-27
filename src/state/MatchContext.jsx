import { createContext, useContext, useReducer, useCallback } from 'react';

const MatchContext = createContext(null);

const initialState = {
  mode: null,        // 'solo' | 'duo' | 'group'
  roomCode: null,
  isHost: false,
  playerId: null,
  playerName: '',
  userName: sessionStorage.getItem('fm:username') || '',  // persisted display name
  players: [],       // [{ id, name, hasPhoto }]
  myPhoto: null,     // base64 data URL
  status: 'idle',    // idle | connecting | lobby | uploading | waiting | analyzing | countdown | results
  results: null,     // CompatibilityResult or group matrix
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...initialState, mode: action.mode };
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.name };
    case 'SET_USERNAME':
      sessionStorage.setItem('fm:username', action.name);
      return { ...state, userName: action.name };
    case 'SET_ROOM':
      return {
        ...state,
        roomCode: action.roomCode,
        isHost: action.isHost,
        playerId: action.playerId,
        status: 'lobby',
      };
    case 'SET_STATUS':
      return { ...state, status: action.status, error: null };
    case 'SET_PHOTO':
      return { ...state, myPhoto: action.photo };
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.players };
    case 'SET_RESULTS':
      return { ...state, results: action.results, status: 'results' };
    case 'SET_ERROR':
      return { ...state, error: action.error, status: 'idle' };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setMode = useCallback((mode) => dispatch({ type: 'SET_MODE', mode }), []);
  const setPlayerName = useCallback((name) => dispatch({ type: 'SET_PLAYER_NAME', name }), []);
  const setUserName = useCallback((name) => dispatch({ type: 'SET_USERNAME', name }), []);
  const setRoom = useCallback((roomCode, isHost, playerId) =>
    dispatch({ type: 'SET_ROOM', roomCode, isHost, playerId }), []);
  const setStatus = useCallback((status) => dispatch({ type: 'SET_STATUS', status }), []);
  const setPhoto = useCallback((photo) => dispatch({ type: 'SET_PHOTO', photo }), []);
  const updatePlayers = useCallback((players) => dispatch({ type: 'UPDATE_PLAYERS', players }), []);
  const setResults = useCallback((results) => dispatch({ type: 'SET_RESULTS', results }), []);
  const setError = useCallback((error) => dispatch({ type: 'SET_ERROR', error }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <MatchContext.Provider
      value={{
        ...state,
        setMode,
        setPlayerName,
        setUserName,
        setRoom,
        setStatus,
        setPhoto,
        updatePlayers,
        setResults,
        setError,
        reset,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be inside MatchProvider');
  return ctx;
}
