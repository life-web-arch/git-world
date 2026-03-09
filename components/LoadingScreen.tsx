"use client";
export default function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#050505',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#22c55e', fontFamily: 'monospace'
    }}>
      <div style={{ width: '280px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '10px', color: '#fff' }}>GIT WORLD</h1>
        <p style={{ fontSize: '10px', color: '#22c55e', marginBottom: '20px', letterSpacing: '2px' }}>INITIALIZING ENGINE</p>
        
        <div style={{ height: '2px', width: '100%', backgroundColor: '#111', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', backgroundColor: '#22c55e', boxShadow: '0 0 15px #22c55e',
            width: `${progress || 5}%`, transition: 'width 0.4s ease-in-out' 
          }} />
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '9px', color: '#444', textAlign: 'left', lineHeight: '1.6' }}>
          <div>{">"} FETCHING_CITY_DATA... {progress > 0 ? 'DONE' : 'WAIT'}</div>
          <div>{">"} ALLOCATING_GPU_BUFFERS... {progress > 30 ? 'DONE' : '...'}</div>
          <div>{">"} SYNCHRONIZING_PLAYERS... {progress > 80 ? 'DONE' : '...'}</div>
        </div>
      </div>
    </div>
  );
}
