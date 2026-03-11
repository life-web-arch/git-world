"use client";
import { createPortal } from "react-dom";

function getLevel(contributions: number, repos: number) {
  const xp = contributions * 2 + repos * 50;
  if (xp > 100000) return { level: 10, title: "LEGEND", xp };
  if (xp > 50000)  return { level: 9,  title: "ARCHITECT", xp };
  if (xp > 20000)  return { level: 8,  title: "PRINCIPAL", xp };
  if (xp > 10000)  return { level: 7,  title: "SENIOR", xp };
  if (xp > 5000)   return { level: 6,  title: "MID_DEV", xp };
  if (xp > 2000)   return { level: 5,  title: "BUILDER", xp };
  if (xp > 800)    return { level: 4,  title: "BUG_HUNTER", xp };
  if (xp > 300)    return { level: 3,  title: "HACKER", xp };
  if (xp > 100)    return { level: 2,  title: "CODER", xp };
  return           { level: 1,  title: "NEWBIE", xp };
}

export default function ProfileCard({ dev, hex, onClose }: { dev: any, hex: string, onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  const { level, title, xp } = getLevel(dev.contributions || 0, dev.repos || 0);
  const nextXp = [100,300,800,2000,5000,10000,20000,50000,100000,999999][level - 1];
  const progress = Math.min(100, (xp / nextXp) * 100);

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0a0d14',
      borderTop: `2px solid ${hex}`,
      borderRadius: '20px 20px 0 0',
      padding: '20px 20px 32px',
      fontFamily: 'monospace',
      boxShadow: `0 -8px 40px ${hex}44`,
      animation: 'slideUp 0.3s ease-out',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto' }} />
        <button onClick={onClose} style={{
          position: 'absolute', right: 16, top: 16,
          background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer'
        }}>✕</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {dev.avatar_url && (
          <img src={dev.avatar_url} alt={dev.username} style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `2px solid ${hex}`, boxShadow: `0 0 16px ${hex}88`
          }} />
        )}
        <div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{dev.username?.toUpperCase()}</div>
          <div style={{ color: hex, fontSize: 11, letterSpacing: 3, marginTop: 2 }}>@{dev.username}</div>
        </div>
      </div>

      <div style={{ background: '#111827', borderRadius: 10, padding: '10px 14px', border: `1px solid ${hex}44`, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: hex, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>LV {level} · {title}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background: '#1f2937', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${hex}, ${hex}aa)`, transition: 'width 1s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'COMMITS',   value: (dev.contributions || 0).toLocaleString() },
          { label: 'REPOS',     value: (dev.repos || 0).toLocaleString() },
          { label: 'FOLLOWERS', value: (dev.followers || 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#111827', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: '1px solid #1f2937' }}>
            <div style={{ color: hex, fontSize: 15, fontWeight: 900 }}>{value}</div>
            <div style={{ color: '#444', fontSize: 8, letterSpacing: 2, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => window.open(`https://github.com/${dev.username}`, '_blank')}
          style={{ flex: 1, padding: '12px', background: hex, color: '#000', border: 'none', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, fontWeight: 900, letterSpacing: 2, cursor: 'pointer' }}
        >VIEW GITHUB →</button>
        <button onClick={onClose}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${hex}44`, color: '#666', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer' }}
        >CLOSE</button>
      </div>
    </div>,
    document.body
  );
}
