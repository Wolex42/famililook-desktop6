import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Crown, ArrowLeft, Zap } from 'lucide-react';
import { useMatch } from '../state/MatchContext';

// ── Room name generator (deterministic from room code) ─────────────
const ADJECTIVES = ['Cosmic', 'Crystal', 'Electric', 'Golden', 'Magnetic', 'Stellar', 'Vivid', 'Radiant', 'Prism', 'Solar'];
const NOUNS      = ['Lab', 'Arena', 'Studio', 'Hub', 'Vault', 'Lounge', 'Chamber', 'Nexus', 'Forge', 'Realm'];

function getRoomName(code) {
  if (!code) return '';
  const n = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${ADJECTIVES[n % ADJECTIVES.length]} ${NOUNS[Math.floor(n / ADJECTIVES.length) % NOUNS.length]}`;
}

// ── Avatar gradient palette (deterministic from player name) ───────
const AVATAR_GRADIENTS = [
  'from-violet-500 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-500',
  'from-purple-400 to-indigo-500',
];

function getAvatarGradient(name = '') {
  const h = name.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

// ── Ambient tips shown while waiting in lobby ──────────────────────
const TIPS = [
  'The AI analyses 8 facial features — eyes, brows, smile, nose, face shape, skin, hair & ears',
  'Use a clear, well-lit photo facing forward for the most accurate results',
  'Every pair of players is compared — who will score the highest match?',
  'All results are revealed at the exact same moment — no spoilers!',
  'The face fusion shows what a blend of your features would look like',
];

// ── Input style (shared) ───────────────────────────────────────────
const inputCls = `
  w-full px-4 py-4 rounded-2xl
  bg-white/[0.05] border border-white/10
  text-white placeholder-white/20 text-base font-medium
  focus:border-violet-400/50 focus:bg-white/[0.07] focus:outline-none
  transition-all duration-200
`.trim();

// ── Gradient CTA button ────────────────────────────────────────────
function GradientBtn({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 rounded-2xl font-bold text-base text-white
        transition-all duration-200 active:scale-[0.97]
        ${disabled
          ? 'bg-white/[0.05] border border-white/10 text-white/25 cursor-not-allowed'
          : 'bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 shadow-lg shadow-violet-500/20'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default function RoomLobby({ connection, onRoomReady }) {
  const { mode, playerName, setPlayerName } = useMatch();
  const [lobbyMode, setLobbyMode]           = useState(null); // null | 'host' | 'join-input' | 'join'
  const [joinCode, setJoinCode]             = useState('');
  const [copied, setCopied]                 = useState(false);
  const [tipIndex, setTipIndex]             = useState(0);

  const isGroup   = mode === 'group';
  const minPlayers = isGroup ? 3 : 2;
  const canStart  = connection.players.length >= minPlayers;
  const roomName  = getRoomName(connection.roomCode);

  // Rotate tips every 6 s while in the in-room lobby
  useEffect(() => {
    if (!connection.roomCode) return;
    const id = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, [connection.roomCode]);

  const handleCopy = async () => {
    if (!connection.roomCode) return;
    await navigator.clipboard.writeText(connection.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Phase 1: Name entry + Create / Join choice ─────────────────
  if (!lobbyMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="space-y-6"
      >
        {/* Mode label */}
        <p className="text-center text-xs text-white/35 uppercase tracking-[0.2em] font-semibold">
          {isGroup ? 'Group  ·  3 – 6 Players' : 'Duo  ·  2 Players'}
        </p>

        {/* Name input */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2 font-semibold">
            What's your name?
          </label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && playerName.trim() && setLobbyMode('choose')}
            placeholder="Enter your first name"
            maxLength={20}
            autoFocus
            className={inputCls}
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <GradientBtn
            disabled={!playerName.trim()}
            onClick={() => {
              connection.connect();
              setTimeout(() => connection.createRoom(playerName.trim(), isGroup ? 'group' : 'duo'), 500);
              setLobbyMode('host');
            }}
          >
            Create Room
          </GradientBtn>

          <button
            disabled={!playerName.trim()}
            onClick={() => playerName.trim() && setLobbyMode('join-input')}
            className="
              py-4 rounded-2xl font-bold text-base
              border border-white/15 text-white/75
              hover:border-violet-400/50 hover:text-white hover:bg-white/[0.04]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-[0.97]
            "
          >
            Join Room
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Phase 2: Join code entry ───────────────────────────────────
  if (lobbyMode === 'join-input') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="space-y-5"
      >
        <button
          onClick={() => setLobbyMode(null)}
          className="flex items-center gap-1.5 min-h-[44px] py-3 text-white/35 hover:text-white/65 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-2 font-semibold">
            Room Code
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase())}
            onKeyDown={e => {
              if (e.key === 'Enter' && joinCode.length >= 4) {
                connection.connect();
                setTimeout(() => connection.joinRoom(playerName.trim(), joinCode.trim()), 500);
                setLobbyMode('join');
              }
            }}
            placeholder="0000"
            maxLength={4}
            autoFocus
            className={`${inputCls} text-center text-4xl tracking-[0.5em] font-black`}
          />
        </div>

        <GradientBtn
          disabled={joinCode.length < 4}
          onClick={() => {
            connection.connect();
            setTimeout(() => connection.joinRoom(playerName.trim(), joinCode.trim()), 500);
            setLobbyMode('join');
          }}
        >
          Join Room
        </GradientBtn>
      </motion.div>
    );
  }

  // ── Phase 3: In-room lobby (code shown, player list, CTA) ──────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="space-y-5"
    >
      {/* Room identity block */}
      {connection.roomCode && (
        <div className="text-center">
          <p className="text-white/85 font-bold text-lg tracking-tight">{roomName}</p>

          <div className="flex items-center justify-center gap-3 mt-2">
            {/* Room code */}
            <span className="text-3xl font-black tracking-[0.25em] text-gradient-violet">
              {connection.roomCode}
            </span>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="
                flex items-center gap-1.5 px-3 py-3 min-h-[44px] rounded-xl
                glass text-white/50 hover:text-white
                text-xs font-semibold transition-all duration-200
              "
            >
              {copied
                ? <><Check size={12} className="text-emerald-400" /> Copied</>
                : <><Copy size={12} /> Copy</>
              }
            </button>
          </div>

          <p className="text-xs text-white/25 mt-1.5">
            Share this code with {isGroup ? 'your group' : 'your friend'}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/[0.07]" />

      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            connection.status === 'connected'  ? 'bg-emerald-400' :
            connection.status === 'connecting' ? 'bg-amber-400 animate-pulse' :
                                                 'bg-white/20'
          }`} />
          <span className="text-xs text-white/35 capitalize">{connection.status}</span>
        </div>
        <span className="text-xs text-white/25 font-medium">
          {connection.players.length} / {isGroup ? 6 : 2} joined
        </span>
      </div>

      {/* Error */}
      {connection.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
          {connection.error}
        </div>
      )}

      {/* Player list */}
      <div className="space-y-2">
        {connection.players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl glass"
          >
            {/* Gradient avatar */}
            <div className={`
              w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
              bg-gradient-to-br ${getAvatarGradient(p.name)}
              text-sm font-bold text-white shadow-sm
            `}>
              {p.name?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Name */}
            <span className="flex-1 font-semibold text-white/90 text-sm truncate">{p.name}</span>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {i === 0 && (
                <span className="
                  flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  bg-amber-400/12 border border-amber-400/20 text-amber-300
                ">
                  <Crown size={9} /> Host
                </span>
              )}
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-semibold
                ${p.ready
                  ? 'bg-emerald-400/12 border border-emerald-400/20 text-emerald-300'
                  : 'bg-white/[0.05] border border-white/10 text-white/30'
                }
              `}>
                {p.ready ? 'Ready' : 'Joined'}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, minPlayers - connection.players.length) }).map((_, i) => (
          <motion.div
            key={`empty-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (connection.players.length + i) * 0.07 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-white/[0.09]"
          >
            <div className="w-9 h-9 rounded-full border border-dashed border-white/12 flex items-center justify-center flex-shrink-0">
              <Users size={13} className="text-white/18" />
            </div>
            <span className="text-sm text-white/22 italic">Waiting for player…</span>
          </motion.div>
        ))}
      </div>

      {/* Ambient tip */}
      {connection.roomCode && (
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-violet-500/[0.07] border border-violet-500/12"
          >
            <Zap size={12} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/45 leading-relaxed">{TIPS[tipIndex]}</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* CTA */}
      {connection.isHost ? (
        <GradientBtn disabled={!canStart} onClick={onRoomReady}>
          {canStart
            ? 'Everyone Upload Photos →'
            : `Waiting for ${minPlayers - connection.players.length} more player${minPlayers - connection.players.length !== 1 ? 's' : ''}…`
          }
        </GradientBtn>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400/60 dot-bounce"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-white/35">Waiting for the host to start…</p>
        </div>
      )}
    </motion.div>
  );
}
