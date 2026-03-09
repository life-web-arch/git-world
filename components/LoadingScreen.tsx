"use client";
export default function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#22c55e', fontFamily: 'monospace'
    }}>
      <div style={{ width: '250px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '20px' }}>GIT WORLD</h1>
        
        <div style={{ height: '4px', width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', backgroundColor: '#22c55e', boxShadow: '0 0 15px #22c55e',
            width: `${progress}%`, transition: 'width 0.3s ease-out' 
          }} />
        </div>
        
        <p style={{ fontSize: '10px', marginTop: '10px', color: '#555', textTransform: 'uppercase' }}>
          Downloading Shaders: {Math.round(progress)}%
        </p>
        
        <div style={{ marginTop: '20px', fontSize: '9px', color: '#333', textAlign: 'left', height: '50px', overflow: 'hidden' }}>
          {progress > 10 && <div>[OK] WebGL Context Created</div>}
          {progress > 40 && <div>[OK] GitHub Data Stream Connected</div>}
          {progress > 80 && <div>[OK] 3D Physics Initialized</div>}
        </div>
      </div>
    </div>
  );
}
