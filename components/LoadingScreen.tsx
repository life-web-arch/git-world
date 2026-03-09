"use client";
import { useProgress } from "@react-three/drei";

export default function LoadingScreen({ devs, active }: { devs: any[], active: boolean }) {
  const { progress } = useProgress();

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center font-mono p-6">
      <div className="max-w-xs w-full space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-green-500 text-2xl font-black tracking-tighter">GIT WORLD</h1>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 shadow-[0_0_15px_#22c55e] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest pt-2">
            Compiling Reality: {Math.round(progress)}%
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 h-40 overflow-hidden text-[9px] space-y-1">
           <div className="text-green-800">[SYS] Initializing WebGL 2.0...</div>
           <div className="text-green-700">[SYS] Connecting to GitHub GraphQL...</div>
           {devs.slice(0, 10).map((d, i) => (
             <div key={i} className="text-zinc-500 animate-pulse">
               [DATA] Mapping {d.username}... <span className="text-green-500">READY</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
