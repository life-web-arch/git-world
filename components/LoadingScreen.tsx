"use client";
import { useState } from 'react';

export default function LoadingScreen({ progress, timedOut, isLoaded }: any) {
  const [manualEntry, setManualEntry] = useState(false);
  
  if (isLoaded || manualEntry) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#22c55e', fontFamily: 'monospace'
    }}>
      <div style={{ width: '280px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '10px', color: '#fff' }}>GIT WORLD</h1>
        <p style={{ fontSize: '10px', color: '#22c55e', marginBottom: '20px', letterSpacing: '2px' }}>
            {progress < 100 ? 'CONNECTING_GRID' : 'STABILIZING_REALITY'}
        </p>
        
        <div style={{ height: '2px', width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', backgroundColor: '#22c55e', boxShadow: '0 0 15px #22c55e',
            width: `${Math.max(progress, 10)}%`, transition: 'width 0.5s ease-in-out' 
          }} />
        </div>

        {timedOut && !isLoaded && (
          <button 
            onClick={() => setManualEntry(true)}
            style={{
              marginTop: '40px', padding: '12px 24px', backgroundColor: '#22c55e', color: '#000',
              border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '12px', letterSpacing: '1px'
            }}
          >
            ENTER MANUALLY
          </button>
        )}
        
        <div style={{ marginTop: '30px', fontSize: '9px', color: '#444', textAlign: 'left', lineHeight: '1.6' }}>
          <div>{">"} DATA_SOURCE... {progress > 10 ? 'OK' : '...'}</div>
          <div>{">"} GPU_PIPE... {progress > 60 ? 'OK' : '...'}</div>
          <div>{">"} SHADER_CACHE... {progress === 100 ? 'OK' : '...'}</div>
        </div>
      </div>
    </div>
  );
}
