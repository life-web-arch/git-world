"use client";
import { useState } from 'react';
import { Settings, Users, Trophy, Zap, Map, X } from 'lucide-react';

export default function HUD({ username, playersCount, flyMode, setFlyMode }: any) {
  const [menu, setMenu] = useState<string | null>(null);

  const Panel = ({ title, children }: any) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 w-80 p-6 rounded-2xl shadow-2xl relative">
        <button onClick={() => setMenu(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          {title === 'Settings' && <Settings size={20} className="text-blue-400"/>}
          {title === 'Players' && <Users size={20} className="text-green-400"/>}
          {title === 'Stats' && <Trophy size={20} className="text-yellow-400"/>}
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Bar Navigation */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
        <button onClick={() => setMenu('Players')} className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-400 hover:text-green-400">
          <Users size={20} />
        </button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button onClick={() => setMenu('Stats')} className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-400 hover:text-yellow-400">
          <Trophy size={20} />
        </button>
        <div className="w-[1px] h-6 bg-white/10 mx-1" />
        <button onClick={() => setMenu('Settings')} className="p-3 hover:bg-white/5 rounded-xl transition-all text-zinc-400 hover:text-blue-400">
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Corner */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md p-2 pr-4 rounded-full border border-white/5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center font-bold text-black text-xs uppercase">
          {username.slice(0,2)}
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase leading-none">Developer</p>
          <p className="text-sm text-white font-medium">{username}</p>
        </div>
      </div>

      {/* Fly Mode Toggle (Zap Icon) */}
      <button 
        onClick={() => setFlyMode(!flyMode)}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-full transition-all shadow-xl flex items-center gap-2 font-bold text-xs ${flyMode ? 'bg-blue-500 text-white scale-110' : 'bg-zinc-800 text-zinc-400'}`}
      >
        <Zap size={18} fill={flyMode ? "currentColor" : "none"}/>
        {flyMode ? 'FLYING' : 'WALKING'}
      </button>

      {/* Panels Logic */}
      {menu === 'Settings' && (
        <Panel title="Settings">
          <div className="flex items-center justify-between text-zinc-300 text-sm">
            <span>High Quality Graphics</span>
            <input type="checkbox" checked readOnly className="accent-green-500" />
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 text-xs transition-all">Reset Character</button>
          <p className="text-[10px] text-zinc-500 mt-4">Vercel Build: Sigma-v2.0.1</p>
        </Panel>
      )}

      {menu === 'Players' && (
        <Panel title="Online Now">
          <div className="text-zinc-400 text-sm">Active Developers: <span className="text-white">{playersCount}</span></div>
          <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
            <div className="p-2 bg-white/5 rounded-lg text-xs text-white flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {username} (You)
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}
