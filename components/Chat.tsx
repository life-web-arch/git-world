"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send } from 'lucide-react';

export default function Chat({ username }: { username: string }) {
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    room.current = supabase.channel('chat-room');
    room.current.on('broadcast', { event: 'msg' }, ({ payload }: any) => {
      setMessages(prev => [...prev, payload].slice(-10)); // Keep last 10
    }).subscribe();
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { user: username, text: input };
    room.current.send({ type: 'broadcast', event: 'msg', payload: msg });
    setMessages(prev => [...prev, msg].slice(-10));
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] font-mono">
      {isOpen && (
        <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 w-72 h-80 rounded-t-xl flex flex-col shadow-2xl">
          <div className="p-3 border-b border-white/10 text-green-400 font-bold text-xs flex justify-between">
            <span>WORLD CHAT</span>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="text-xs">
                <span className="text-blue-400">[{m.user}]:</span> <span className="text-zinc-200">{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-2 bg-black/50 flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white flex-1"
              placeholder="Type message..."
            />
            <button type="submit text-green-400"><Send size={14}/></button>
          </form>
        </div>
      )}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-zinc-900/90 p-3 rounded-full border border-white/10 text-white shadow-xl animate-bounce"
        >
          <MessageSquare size={20} />
        </button>
      )}
    </div>
  );
}
