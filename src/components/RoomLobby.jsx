/**
 * RoomLobby — lobby screen for Duo/Group rooms in FamiliMatch.
 *
 * Props:
 *   connection: object  — from useMatchConnection() hook
 *   onRoomReady: () => void — called when host starts the game
 *
 * Host flow: "Create Room" -> shows room code + player list + "Start" button
 * Guest flow: enter room code + "Join" button
 * Displays connected players as they join.
 * "Start" button is host-only, enabled when enough players are connected.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Loader2, LogIn, Play } from 'lucide-react';
import { useMatch } from '../state/MatchContext';

const MIN_PLAYERS_DUO  = 2;
const MIN_PLAYERS_GROUP = 3;

function PlayerChip({ player, isYou }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: 'linear-gradient(145deg, #0a84ff, #5e5ce6)' }}
      >
        {(player.name || '?')[0].toUpperCase()}
      </div>
      <span className="text-sm text-white/80 font-medium">
        {player.name || 'Player'}
      </span>
      {isYou && (
        <span className="text-xs text-blue-400 font-semibold">(You)</span>
      )}
    </motion.div>
  );
}

function RoomCodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + copy
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="text-center space-y-2">
      <p className="text-xs text-white/40 uppercase tracking-wider">Room Code</p>
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 mx-auto px-6 py-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] transition-all"
        style={{ minHeight: 44 }}
      >
        <span className="text-2xl font-mono font-black tracking-[0.3em] text-white">
          {code}
        </span>
        {copied ? (
          <Check size={18} className="text-green-400" />
        ) : (
          <Copy size={18} className="text-white/40" />
        )}
      </button>
      <p className="text-xs text-white/25">
        {copied ? 'Copied!' : 'Tap to copy'}
      </p>
      {/* GAP-08: Room code expiry notice */}
      <p className="text-xs text-white/30 mt-1">
        Code expires in 15 minutes
      </p>
    </div>
  );
}

export default function RoomLobby({ connection, onRoomReady }) {
  const { mode, userName, tierToken } = useMatch();
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState('choose'); // 'choose' | 'host' | 'guest'

  const {
    status,
    roomCode,
    playerId,
    isHost,
    players,
    error,
    connect,
    createRoom,
    joinRoom,
  } = connection;

  // GAP-08: Detect room-not-found / expired errors
  const isRoomExpiredError = error && (
    error.toLowerCase().includes('not found') ||
    error.toLowerCase().includes('expired') ||
    error.toLowerCase().includes('invalid room')
  );

  const isGroup = mode === 'group';
  const minPlayers = isGroup ? MIN_PLAYERS_GROUP : MIN_PLAYERS_DUO;
  const canStart = isHost && players.length >= minPlayers;

  const handleCreateRoom = useCallback(() => {
    setView('host');
    connect(() => {
      createRoom(userName || 'Host', isGroup ? 'group' : 'duo');
    }, tierToken);
  }, [connect, createRoom, userName, isGroup, tierToken]);

  const handleJoinRoom = useCallback(() => {
    if (!joinCode.trim()) return;
    connect(() => {
      joinRoom(userName || 'Guest', joinCode.trim().toUpperCase());
    }, tierToken);
  }, [connect, joinRoom, userName, joinCode, tierToken]);

  const handleStart = useCallback(() => {
    onRoomReady();
  }, [onRoomReady]);

  const isConnecting = status === 'connecting';

  // Initial choice: Create or Join
  if (view === 'choose' && !roomCode) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto">
          <Users size={26} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            {isGroup ? 'Group Room' : 'Duo Room'}
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {isGroup
              ? 'Create or join a room for 3-6 players'
              : 'Create or join a room for 2 players'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCreateRoom}
            disabled={isConnecting}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              minHeight: 44,
              background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
            }}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Connecting...
              </span>
            ) : (
              'Create Room'
            )}
          </button>

          <button
            onClick={() => setView('guest')}
            className="w-full py-3.5 rounded-2xl font-bold text-base text-white/70 bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] transition-all active:scale-[0.97]"
            style={{ minHeight: 44 }}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // Guest join view (before connected)
  if (view === 'guest' && !roomCode) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto">
          <LogIn size={26} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Join a Room</h2>
          <p className="text-sm text-white/40 mt-1">
            Enter the room code shared by the host
          </p>
        </div>

        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ROOM CODE"
          maxLength={6}
          className="w-full text-center text-2xl font-mono font-black tracking-[0.3em] py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50"
          style={{ minHeight: 44 }}
          autoFocus
        />

        {/* GAP-08: Room expired / not found error message */}
        {isRoomExpiredError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 text-center">
            This room may have expired &mdash; ask the host to create a new one.
          </div>
        )}
        {error && !isRoomExpiredError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setView('choose'); setJoinCode(''); }}
            className="flex-1 py-3.5 rounded-2xl font-bold text-base text-white/50 bg-white/[0.04] border border-white/10 transition-all active:scale-[0.97]"
            style={{ minHeight: 44 }}
          >
            Back
          </button>
          <button
            onClick={handleJoinRoom}
            disabled={joinCode.length < 4 || isConnecting}
            className="flex-1 py-3.5 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              minHeight: 44,
              background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
            }}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Joining...
              </span>
            ) : (
              'Join'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Connected — show room code + player list + start button (host)
  return (
    <div className="space-y-6">
      {roomCode && <RoomCodeDisplay code={roomCode} />}

      {/* Player list */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
          Players ({players.length}{isGroup ? '/6' : '/2'})
        </p>
        <div className="space-y-2">
          <AnimatePresence>
            {players.map((p) => (
              <PlayerChip key={p.id} player={p} isYou={p.id === playerId} />
            ))}
          </AnimatePresence>
        </div>
        {players.length < minPlayers && (
          <p className="text-xs text-white/25 mt-3 text-center">
            Waiting for {minPlayers - players.length} more player{minPlayers - players.length > 1 ? 's' : ''}...
          </p>
        )}
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            minHeight: 44,
            background: canStart
              ? 'linear-gradient(135deg, #0a84ff, #5e5ce6)'
              : 'rgba(255,255,255,0.06)',
          }}
        >
          <Play size={18} />
          Start {isGroup ? 'Group' : 'Duo'} Match
        </button>
      )}

      {/* Guest waiting message */}
      {!isHost && (
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400/70 dot-bounce"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-white/40">Waiting for host to start...</p>
        </div>
      )}
    </div>
  );
}
