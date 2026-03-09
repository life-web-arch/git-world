"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, X } from 'lucide-react';

export default function Chat({ username }: { username: string }) {
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false); // CLOSED by default
  const [unread, setUnread] = useState(0);
  const room = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    room.current = supabase.channel('chat-room');
    room.current.on('broadcast', { event: 'msg' }, ({ payload }: any) => {
      setMessages(prev => [...prev, payload].slice(-20));
      if (!isOpen) setUnread(n => n + 1);
    }).subscribe();
    return () => { room.current?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { user: username, text: input };
    room.current?.send({ type: 'broadcast', event: 'msg', payload: msg });
    setMessages(prev => [...prev, msg].slice(-20));
    setInput('');
  };

  const glassStyle: React.CSSProperties = {
    background: 'rgba(5, 8, 24, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '16px', zIndex: 60, fontFamily: 'monospace' }}>
      {isOpen ? (
        <div style={{ ...glassStyle, width: '260px', height: '300px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#22c55e', fontSize: '10px', letterSpacing: '3px', fontWeight: 700 }}>WORLD_CHAT</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {messages.length === 0 && (
              <div style={{ color: '#333', fontSize: '10px', textAlign: 'center', marginTop: '20px' }}>
                No messages yet.<br />Say hello!
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ fontSize: '11px', lineHeight: 1.4 }}>
                <span style={{ color: '#3b82f6' }}>{m.user}: </span>
                <span style={{ color: '#ccc' }}>{m.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} style={{
            padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '6px', alignItems: 'center',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '11px',
                outline: 'none', fontFamily: 'monospace',
              }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '4px' }}>
              <Send size={13} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            ...glassStyle,
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', color: '#666',
          }}
        >
          <MessageSquare size={18} />
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#22c55e', borderRadius: '50%', width: '16px', height: '16px',
              fontSize: '9px', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}>
              {unread}
            </div>
          )}
        </button>
      )}
    </div>
  );
}
