"use client";
import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

export default function LoadingScreen({ devs }: { devs: any[] }) {
  const { progress } = useProgress();
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    if (devs && devs.length > 0) {
      const interval = setInterval(() => {
        setBootLogs(prev => {
          const nextDev = devs[prev.length % devs.length]?.username || "Unknown";
          return [...prev, `Mapped: ${nextDev}... OK`].slice(-8);
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [devs]);

  return (
    <div className="fixed inset-0 z-[500] bg-[#09090b] flex flex-col items-center justify-center font-mono">
      <div className="w-80 space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"
              style={{ animationDuration: '0.8s' }}
            ></div>
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-1">
          <h2 className="text-green-500 text-sm font-bold tracking-widest text-center uppercase">
            Synchronizing World
          </h2>
          <p className="text-zinc-500 text-[10px] text-center uppercase">
            Assets: {Math.round(progress)}% Loaded
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Boot Logs */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-3 h-32 overflow-hidden shadow-inner">
          {bootLogs.map((log, i) => (
            <div key={i} className="text-[9px] text-zinc-400 leading-tight">
              <span className="text-green-900 pr-2">[{new Date().toLocaleTimeString()}]</span>
              {log}
            </div>
          ))}
          {bootLogs.length === 0 && <div className="text-[9px] text-zinc-600 italic">Connecting to GitHub Grid...</div>}
        </div>
      </div>
    </div>
  );
}
