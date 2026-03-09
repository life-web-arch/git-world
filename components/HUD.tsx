"use client";
import { useState } from 'react';
import { Settings, Users, Zap, X, GitCommit, GitBranch } from 'lucide-react';

export default function HUD({ username, playersCount, flyMode, setFlyMode }: any) {
  const [menu, setMenu] = useState<string | null>(null);

  const glassStyle: React.CSSProperties = {
    background: 'rgba(5, 8, 24, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  const Panel = ({ title, children }: any) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ ...glassStyle, width: '320px', padding: '24px', position: 'relative' }}>
        <button
          onClick={() => setMenu(null)}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}
        >
          <X size={18} />
        </button>
        <h2 style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px', marginTop: 0 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );

  const btnStyle = (hoverColor: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    padding: '10px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s, background 0.2s',
  });

  return (
    <>
      {/* Top center nav */}
      <div style={{
        ...glassStyle,
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, display: 'flex', alignItems: 'center', gap: '4px', padding: '6px',
      }}>
        <button style={btnStyle('#22c55e')} onClick={() => setMenu('Players')}>
          <Users size={18} color={menu === 'Players' ? '#22c55e' : '#666'} />
        </button>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />
        <button style={btnStyle('#3b82f6')} onClick={() => setMenu('Settings')}>
          <Settings size={18} color={menu === 'Settings' ? '#3b82f6' : '#666'} />
        </button>
      </div>

      {/* Top-left profile chip */}
      <div style={{
        ...glassStyle,
        position: 'fixed', top: '20px', left: '20px', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 16px 8px 8px',
        borderRadius: '999px',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '11px', color: '#000', fontFamily: 'monospace',
          letterSpacing: '1px',
        }}>
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1 }}>DEVELOPER</div>
          <div style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>{username}</div>
        </div>
      </div>

      {/* Fly mode toggle — bottom center */}
      <button
        onClick={() => setFlyMode(!flyMode)}
        style={{
          ...glassStyle,
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, border: flyMode ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
          background: flyMode ? 'rgba(59,130,246,0.2)' : 'rgba(5,8,24,0.75)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '999px',
          color: flyMode ? '#3b82f6' : '#666',
          fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', letterSpacing: '2px',
          transition: 'all 0.3s',
          boxShadow: flyMode ? '0 0 20px rgba(59,130,246,0.4), 0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <Zap size={14} fill={flyMode ? 'currentColor' : 'none'} />
        {flyMode ? 'FLY_MODE' : 'WALK_MODE'}
      </button>

      {/* Players panel */}
      {menu === 'Players' && (
        <Panel title="Online Developers">
          <div style={{ color: '#444', fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px', letterSpacing: '1px' }}>
            ACTIVE: <span style={{ color: '#22c55e' }}>{playersCount}</span>
          </div>
          <div style={{
            padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px',
            border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '12px' }}>{username}</span>
            <span style={{ color: '#444', fontFamily: 'monospace', fontSize: '10px', marginLeft: 'auto' }}>YOU</span>
          </div>
        </Panel>
      )}

      {/* Settings panel */}
      {menu === 'Settings' && (
        <Panel title="System Config">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: '#aaa', fontFamily: 'monospace', fontSize: '11px',
                letterSpacing: '2px', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              RESPAWN_CHARACTER
            </button>
            <button
              onClick={() => window.location.href = '/api/auth/signout'}
              style={{
                padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', color: '#ef4444', fontFamily: 'monospace', fontSize: '11px',
                letterSpacing: '2px', cursor: 'pointer',
              }}
            >
              DISCONNECT_GITHUB
            </button>
            <p style={{ color: '#333', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px', margin: 0 }}>
              BUILD: SIGMA-v2.1.0 // GIT_WORLD
            </p>
          </div>
        </Panel>
      )}
    </>
  );
}
