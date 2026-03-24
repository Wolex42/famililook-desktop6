// ChatPanel.jsx — Real-time chat for Duo/Group rooms
// Collapsible panel, auto-scroll, rate-limit aware

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

const MAX_DISPLAYED = 50;
const MAX_LENGTH = 200;

export default function ChatPanel({ messages = [], onSend, myPlayerId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const unreadRef = useRef(0);

  // Track unread when closed
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (!isOpen && messages.length > prevCountRef.current) {
      unreadRef.current += messages.length - prevCountRef.current;
    }
    prevCountRef.current = messages.length;
  }, [messages.length, isOpen]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  // Reset unread when opened
  useEffect(() => {
    if (isOpen) unreadRef.current = 0;
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH) return;
    onSend?.(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const displayed = messages.slice(-MAX_DISPLAYED);
  const unread = unreadRef.current;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 80,
      maxWidth: 480, margin: '0 auto',
      transition: 'transform 0.25s ease',
      transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
    }}>
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
          border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px 16px 0 0',
          color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', minHeight: 48,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} />
          Chat
          {!isOpen && unread > 0 && (
            <span style={{
              background: '#0a84ff', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '2px 7px', borderRadius: 99,
              minWidth: 20, textAlign: 'center',
            }}>
              {unread}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {/* Chat body */}
      <div style={{
        background: 'rgba(0,0,0,0.95)',
        height: 280,
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Messages */}
        <div
          ref={listRef}
          style={{
            flex: 1, overflowY: 'auto', padding: '8px 12px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: 20 }}>
              No messages yet — say hello!
            </div>
          )}
          {displayed.map((msg, i) => {
            const isMe = msg.sender_id === myPlayerId;
            return (
              <div
                key={`${msg.timestamp}-${i}`}
                style={{
                  marginBottom: 6,
                  textAlign: isMe ? 'right' : 'left',
                }}
              >
                <div style={{
                  display: 'inline-block',
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isMe ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isMe ? 'rgba(10,132,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {!isMe && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0a84ff', marginBottom: 2 }}>
                      {msg.sender_name}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8, padding: '8px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', fontSize: 14,
              outline: 'none', minHeight: 44,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: text.trim() ? 'linear-gradient(135deg, #0a84ff, #5e5ce6)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: text.trim() ? 'pointer' : 'default',
              opacity: text.trim() ? 1 : 0.4,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
