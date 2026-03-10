"use client";
import { useState } from 'react';
import { Settings, Users, Zap, X, Trophy } from 'lucide-react';
import { THEMES, ThemeName } from './WorldClient';

function getLevel(contributions: number, repos: number) {
  const xp = contributions * 2 + repos * 50;
  if (xp > 100000) return { level: 10, title: "LEGEND" };
  if (xp > 50000)  return { level: 9,  title: "ARCHITECT" };
  if (xp > 20000)  return { level: 8,  title: "PRINCIPAL" };
  if (xp > 10000)  return { level: 7,  title: "SENIOR" };
  if (xp > 5000)   return { level: 6,  title: "MID_DEV" };
  if (xp > 2000)   return { level: 5,  title: "BUILDER" };
  if (xp > 800)    return { level: 4,  title: "BUG_HUNTER" };
  if (xp > 300)    return { level: 3,  title: "HACKER" };
  if (xp > 100)    return { level: 2,  title: "CODER" };
  return           { level: 1,  title: "NEWBIE" };
}

export default function HUD({ username, playersCount, flyMode, setFlyMode, devs, theme, setTheme }: any) {
  const [menu, setMenu] = useState<string | null>(null);

  const glass: React.CSSProperties = {
    background: 'rgba(5, 8, 24, 0.82)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  };

  const Panel = ({ title, children }: any) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ ...glass, width: '340px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 3 }}>{title}</span>
          <button onClick={() => setMenu(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );

  const btn = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer',
    color: active ? '#22c55e' : '#666', padding: '10px',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  const sorted = devs ? [...devs].sort((a: any, b: any) => b.contributions - a.contributions) : [];

  return (
    <>
      {/* Top center nav */}
      <div style={{
        ...glass,
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, display: 'flex', alignItems: 'center', gap: 2, padding: '5px',
      }}>
        <button style={btn(menu === 'Leaderboard')} onClick={() => setMenu(menu === 'Leaderboard' ? null : 'Leaderboard')}>
          <Trophy size={17} color={menu === 'Leaderboard' ? '#f59e0b' : '#666'} />
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
        <button style={btn(menu === 'Players')} onClick={() => setMenu(menu === 'Players' ? null : 'Players')}>
          <Users size={17} color={menu === 'Players' ? '#22c55e' : '#666'} />
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
        <button style={btn(menu === 'Settings')} onClick={() => setMenu(menu === 'Settings' ? null : 'Settings')}>
          <Settings size={17} color={menu === 'Settings' ? '#3b82f6' : '#666'} />
        </button>
      </div>

      {/* Profile chip */}
      <div style={{
        ...glass, position: 'fixed', top: 20, left: 20, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px 8px 8px', borderRadius: '999px',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 11, color: '#000', fontFamily: 'monospace',
        }}>
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>DEVELOPER</div>
          <div style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{username}</div>
        </div>
      </div>

      {/* Fly mode */}
      <button onClick={() => setFlyMode(!flyMode)} style={{
        ...glass,
        position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50,
        border: flyMode ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
        background: flyMode ? 'rgba(59,130,246,0.2)' : 'rgba(5,8,24,0.82)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 24px', borderRadius: '999px',
        color: flyMode ? '#3b82f6' : '#666',
        fontFamily: 'monospace', fontWeight: 700, fontSize: 11, letterSpacing: 2,
        transition: 'all 0.3s',
      }}>
        <Zap size={14} fill={flyMode ? 'currentColor' : 'none'} />
        {flyMode ? 'FLY_MODE' : 'WALK_MODE'}
      </button>

      {/* LEADERBOARD */}
      {menu === 'Leaderboard' && (
        <Panel title="LEADERBOARD">
          <div style={{ color: '#444', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>
            TOP DEVELOPERS BY COMMITS
          </div>
          {sorted.slice(0, 20).map((dev: any, i: number) => {
            const { level, title } = getLevel(dev.contributions, dev.repos);
            const isMe = dev.username === username;
            return (
              <div key={dev.username} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', marginBottom: 4, borderRadius: 8,
                background: isMe ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                border: isMe ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
              }}>
                <span style={{
                  color: i < 3 ? ['#f59e0b','#9ca3af','#cd7c32'][i] : '#444',
                  fontFamily: 'monospace', fontSize: 11, fontWeight: 700, width: 20, textAlign: 'center'
                }}>
                  {i + 1}
                </span>
                {dev.avatar_url ? (
                  <img src={dev.avatar_url} style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1f2937', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dev.username}
                  </div>
                  <div style={{ color: '#444', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>
                    LV{level} {title}
                  </div>
                </div>
                <span style={{ color: '#22c55e', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {dev.contributions?.toLocaleString()}
                </span>
              </div>
            );
          })}
        </Panel>
      )}

      {/* PLAYERS */}
      {menu === 'Players' && (
        <Panel title="ONLINE DEVELOPERS">
          <div style={{ color: '#444', fontFamily: 'monospace', fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>
            ACTIVE: <span style={{ color: '#22c55e' }}>{playersCount}</span>
          </div>
          <div style={{
            padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: 10,
            border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>{username}</span>
            <span style={{ color: '#444', fontFamily: 'monospace', fontSize: 10, marginLeft: 'auto' }}>YOU</span>
          </div>
        </Panel>
      )}

      {/* SETTINGS */}
      {menu === 'Settings' && (
        <Panel title="SYSTEM CONFIG">
          {/* Theme switcher */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#444', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>THEME</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.keys(THEMES) as ThemeName[]).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  padding: '10px', background: theme === t ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme === t ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8, color: theme === t ? '#22c55e' : '#666',
                  fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, cursor: 'pointer',
                  textTransform: 'uppercase',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => window.location.reload()} style={{
              padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: '#aaa', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
            }}>RESPAWN_CHARACTER</button>
            <button onClick={() => window.location.href = '/api/auth/signout'} style={{
              padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, color: '#ef4444', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
            }}>DISCONNECT_GITHUB</button>
            <p style={{ color: '#333', fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, margin: 0 }}>
              BUILD: SIGMA-v3.0.0 // GIT_WORLD
            </p>
          </div>
        </Panel>
      )}
    </>
  );
}
