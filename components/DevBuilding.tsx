"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Html } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function usernameToHue(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

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

function ProfileCard({ dev, hex, onClose }: { dev: any, hex: string, onClose: () => void }) {
  const { level, title, xp } = getLevel(dev.contributions || 0, dev.repos || 0);
  const XP_THRESHOLDS = [100,300,800,2000,5000,10000,20000,50000,100000,999999];
  const nextXp = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)];
  const progress = Math.min(100, (xp / nextXp) * 100);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#080b14',
      borderTop: `2px solid ${hex}`,
      borderRadius: '20px 20px 0 0',
      padding: '20px 20px 40px',
      fontFamily: 'monospace',
      boxShadow: `0 -12px 60px ${hex}55`,
      animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      maxHeight: '75vh',
      overflowY: 'auto',
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <button onClick={onClose} style={{
        position: 'absolute', right: 16, top: 16,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#888', fontSize: 14, cursor: 'pointer', borderRadius: 8,
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        {dev.avatar_url ? (
          <img src={dev.avatar_url} alt={dev.username} style={{
            width: 60, height: 60, borderRadius: '50%',
            border: `2px solid ${hex}`, boxShadow: `0 0 20px ${hex}88`,
            flexShrink: 0,
          }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#000', flexShrink: 0 }}>
            {(dev.username || '?').slice(0,2).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: 0.5 }}>{dev.username}</div>
          <div style={{ color: hex, fontSize: 10, letterSpacing: 3, marginTop: 3, textTransform: 'uppercase' }}>@{dev.username}</div>
        </div>
      </div>

      <div style={{ background: '#0f1520', borderRadius: 12, padding: '12px 14px', border: `1px solid ${hex}33`, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <span style={{ color: hex, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>LV {level}</span>
            <span style={{ color: '#555', fontSize: 10, marginLeft: 8, letterSpacing: 2 }}>{title}</span>
          </div>
          <span style={{ color: '#444', fontSize: 9 }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background: '#1a2235', borderRadius: 4, height: 7, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${hex}cc, ${hex})`,
            boxShadow: `0 0 10px ${hex}`,
            transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'COMMITS', value: (dev.contributions||0).toLocaleString(), icon: '★' },
          { label: 'REPOS', value: (dev.repos||0).toLocaleString(), icon: '⬡' },
          { label: 'FOLLOWERS', value: (dev.followers||0).toLocaleString(), icon: '◎' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: '#0f1520', borderRadius: 10, padding: '12px 8px', textAlign: 'center',
            border: '1px solid #1a2235',
          }}>
            <div style={{ color: '#444', fontSize: 14, marginBottom: 4 }}>{icon}</div>
            <div style={{ color: hex, fontSize: 14, fontWeight: 900 }}>{value}</div>
            <div style={{ color: '#333', fontSize: 8, letterSpacing: 2, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => window.open(`https://github.com/${dev.username}`, '_blank')} style={{
          flex: 1, padding: '13px', background: hex, color: '#000',
          border: 'none', borderRadius: 10, fontFamily: 'monospace',
          fontSize: 11, fontWeight: 900, letterSpacing: 2, cursor: 'pointer',
        }}>VIEW GITHUB →</button>
        <button onClick={onClose} style={{
          flex: 1, padding: '13px', background: 'transparent',
          border: `1px solid ${hex}33`, color: '#555', borderRadius: 10,
          fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
        }}>CLOSE</button>
      </div>
    </div>
  );
}

function AnimatedBeacon({ height, color }: { height: number; color: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const pulse = 0.6 + Math.sin(t * 1.8 + height) * 0.6;
    if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 6;
    if (lightRef.current) lightRef.current.intensity = pulse * 30;
  });
  const hex = `#${color.getHexString()}`;
  return (
    <group position={[0, height + 1.2, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={4} roughness={0} metalness={1} />
      </mesh>
      <pointLight ref={lightRef} color={hex} intensity={20} distance={35} decay={2} />
    </group>
  );
}

// Proper per-face window grid — orange-lit squares like Git City
function BuildingWindows({ width, height, hex }: { width: number, height: number, hex: string }) {
  const winW = 1.1;
  const winH = 0.7;
  const gapX = 1.9;
  const gapY = 2.2;
  const cols = Math.max(1, Math.floor((width - 1) / gapX));
  const rows = Math.max(1, Math.floor((height - 1) / gapY));
  const startX = -(cols - 1) * gapX / 2;
  const startY = 1.5;

  const faces = [
    { axis: 'z' as const, sign: 1 },
    { axis: 'z' as const, sign: -1 },
    { axis: 'x' as const, sign: 1 },
    { axis: 'x' as const, sign: -1 },
  ];

  return (
    <>
      {faces.map((face, fi) =>
        Array.from({ length: rows }, (_, ri) =>
          Array.from({ length: cols }, (_, ci) => {
            const seed = (fi * 997 + ri * 31 + ci * 7) % 100;
            const isLit = seed > 20;
            if (!isLit) return null;
            const xOff = startX + ci * gapX;
            const yPos = startY + ri * gapY;
            const offset = width / 2 + 0.03;

            let px = 0, py = yPos, pz = 0;
            let rx = 0, ry = 0;

            if (face.axis === 'z') {
              px = xOff; pz = face.sign * offset; ry = face.sign > 0 ? 0 : Math.PI;
            } else {
              pz = xOff; px = face.sign * offset; ry = face.sign > 0 ? Math.PI / 2 : -Math.PI / 2;
            }

            return (
              <mesh key={`${fi}-${ri}-${ci}`} position={[px, py, pz]} rotation={[0, ry, 0]}>
                <planeGeometry args={[winW, winH]} />
                <meshStandardMaterial
                  color={hex}
                  emissive={hex}
                  emissiveIntensity={4}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            );
          })
        )
      )}
    </>
  );
}

export default function DevBuilding({ dev, position, theme }: any) {
  const [showCard, setShowCard] = useState(false);
  if (!dev) return null;

  const hue = usernameToHue(dev.username || "dev");
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.88, 0.58), [hue]);
  const colorDark = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.6, 0.07), [hue]);
  const hex = `#${color.getHexString()}`;

  const contributions = dev.contributions || 10;
  const repos = dev.repos || 3;

  // Much more dramatic height scaling — like a real city
  const height = Math.max(8, Math.min(80, 8 + (contributions / 25)));
  const width = Math.max(6, Math.min(18, 5 + repos / 3));
  const isElite = contributions > 500;

  return (
    <>
      <RigidBody type="fixed" position={position} colliders="cuboid">
        {/* Main tower */}
        <mesh
          position={[0, height / 2, 0]}
          castShadow receiveShadow
          onClick={(e) => { e.stopPropagation(); setShowCard(true); }}
        >
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial
            color={colorDark}
            emissive={color}
            emissiveIntensity={isElite ? 0.28 : 0.14}
            roughness={0.12}
            metalness={0.96}
          />
        </mesh>

        {/* Windows */}
        <BuildingWindows width={width} height={height} hex={hex} />

        {/* Neon corner edges */}
        {([ [-1,-1], [-1,1], [1,-1], [1,1] ] as [number,number][]).map(([sx,sz], ci) => (
          <mesh key={ci} position={[sx*(width/2+0.05), height/2, sz*(width/2+0.05)]}>
            <boxGeometry args={[0.09, height+0.2, 0.09]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 8 : 5} roughness={0} />
          </mesh>
        ))}

        {/* Rooftop accent */}
        <mesh position={[0, height+0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[width*0.4, width*0.48, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.9} />
        </mesh>

        {/* Ground glow — no pedestal, just a flat glow ring */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[width*0.5, width*0.95, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.25} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[width*0.5, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.1} />
        </mesh>

        <AnimatedBeacon height={height} color={color} />

        {dev.avatar_url && (
          <Html position={[0, height+4.2, 0]} transform distanceFactor={30} center occlude={false}>
            <img src={dev.avatar_url} alt={dev.username} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${hex}`, boxShadow: `0 0 10px ${hex}`,
              pointerEvents: 'none',
            }} onError={e => { e.currentTarget.style.display='none'; }} />
          </Html>
        )}

        <Text position={[0, height+2.8, 0]} fontSize={0.85} color="white"
          outlineWidth={0.07} outlineColor="#000" anchorX="center" anchorY="middle">
          {dev.username}
        </Text>
        <Text position={[0, height+1.9, 0]} fontSize={0.48} color={hex}
          outlineWidth={0.04} outlineColor="#000" anchorX="center" anchorY="middle">
          {`★${contributions} · ${repos}repos`}
        </Text>
      </RigidBody>

      {showCard && <ProfileCard dev={dev} hex={hex} onClose={() => setShowCard(false)} />}
    </>
  );
}
