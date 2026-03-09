"use client";
import { useProgress } from "@react-three/drei";

export default function LoadingScreen({ progress: apiProgress }: { progress: number }) {
  const { progress: activeProgress } = useProgress();
  
  // Use the higher of the two progress values
  const displayProgress = Math.max(apiProgress, activeProgress);
  const isFinished = displayProgress >= 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#22c55e', fontFamily: 'monospace',
      transition: 'transform 1s cubic-bezier(0.85, 0, 0.15, 1)',
      transform: isFinished ? 'translateY(-100%)' : 'translateY(0)'
    }}>
      <div style={{ width: '280px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '10px', color: '#fff' }}>GIT WORLD</h1>
        <p style={{ fontSize: '10px', color: '#22c55e', marginBottom: '20px', letterSpacing: '2px' }}>
            {isFinished ? 'SYSTEMS READY' : 'INITIALIZING ENGINE'}
        </p>
        
        <div style={{ height: '2px', width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', backgroundColor: '#22c55e', boxShadow: '0 0 15px #22c55e',
            width: `${displayProgress}%`, transition: 'width 0.4s ease-in-out' 
          }} />
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '9px', color: '#444', textAlign: 'left', lineHeight: '1.6' }}>
          <div>{">"} ASSET_STREAM... {displayProgress > 20 ? 'OK' : '...'}</div>
          <div>{">"} GPU_ALLOCATION... {displayProgress > 60 ? 'OK' : '...'}</div>
          <div>{">"} READY_FOR_DEBARKATION... {isFinished ? 'OK' : '...'}</div>
        </div>
      </div>
    </div>
  );
}
