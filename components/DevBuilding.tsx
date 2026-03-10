"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Html } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function usernameToHue(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
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
      background: '#080b14', borderTop: `2px solid ${hex}`,
      borderRadius: '20px 20px 0 0', padding: '20px 20px 40px',
      fontFamily: 'monospace', boxShadow: `0 -12px 60px ${hex}55`,
      animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      maxHeight: '72vh', overflowY: 'auto',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <button onClick={onClose} style={{
        position: 'absolute', right: 16, top: 16,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#888', cursor: 'pointer', borderRadius: 8,
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>✕</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        {dev.avatar_url ? (
          <img src={dev.avatar_url} alt={dev.username} style={{
            width: 58, height: 58, borderRadius: '50%',
            border: `2px solid ${hex}`, boxShadow: `0 0 18px ${hex}88`, flexShrink: 0,
          }} />
        ) : (
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#000', flexShrink: 0 }}>
            {(dev.username||'?').slice(0,2).toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 900 }}>{dev.username}</div>
          <div style={{ color: hex, fontSize: 10, letterSpacing: 3, marginTop: 3 }}>@{dev.username}</div>
        </div>
      </div>
      <div style={{ background: '#0f1520', borderRadius: 12, padding: '12px 14px', border: `1px solid ${hex}33`, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: hex, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>LV {level} · {title}</span>
          <span style={{ color: '#444', fontSize: 9 }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background: '#1a2235', borderRadius: 4, height: 7, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${hex}cc,${hex})`, boxShadow: `0 0 10px ${hex}`, transition: 'width 1.2s ease' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'COMMITS', value: (dev.contributions||0).toLocaleString(), icon: '★' },
          { label: 'REPOS',   value: (dev.repos||0).toLocaleString(),          icon: '⬡' },
          { label: 'FOLLOWS', value: (dev.followers||0).toLocaleString(),      icon: '◎' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ background: '#0f1520', borderRadius: 10, padding: '12px 8px', textAlign: 'center', border: '1px solid #1a2235' }}>
            <div style={{ color: '#444', fontSize: 13, marginBottom: 4 }}>{icon}</div>
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
    const pulse = 0.5 + Math.sin(t * 1.8 + height) * 0.6;
    if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 6;
    if (lightRef.current) lightRef.current.intensity = pulse * 28;
  });
  const hex = `#${color.getHexString()}`;
  return (
    <group position={[0, height + 1.1, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={4} roughness={0} metalness={1} />
      </mesh>
      <pointLight ref={lightRef} color={hex} intensity={20} distance={30} decay={2} />
    </group>
  );
}

function BuildingWindows({ width, height, hex }: { width: number, height: number, hex: string }) {
  const winW = 1.0;
  const winH = 0.65;
  const gapX = 1.8;
  const gapY = 2.1;
  const cols = Math.max(1, Math.floor((width - 0.8) / gapX));
  const rows = Math.max(1, Math.floor((height - 1.2) / gapY));
  const startX = -(cols - 1) * gapX / 2;
  const startY = 1.4;

  // 4 faces: +z, -z, +x, -x
  const faceConfigs = [
    { nx: 1, nz: 0, offset: width / 2 + 0.03, ry: 0 },
    { nx: -1, nz: 0, offset: width / 2 + 0.03, ry: Math.PI },
    { nx: 0, nz: 1, offset: width / 2 + 0.03, ry: -Math.PI / 2 },
    { nx: 0, nz: -1, offset: width / 2 + 0.03, ry: Math.PI / 2 },
  ];

  const windows: JSX.Element[] = [];
  faceConfigs.forEach((face, fi) => {
    for (let ri = 0; ri < rows; ri++) {
      for (let ci = 0; ci < cols; ci++) {
        const seed = (fi * 997 + ri * 31 + ci * 7) % 100;
        if (seed <= 18) continue; // ~18% unlit
        const localX = startX + ci * gapX;
        const localY = startY + ri * gapY;
        // Project local coords onto face
        const px = face.nx !== 0 ? face.nx * face.offset : localX;
        const pz = face.nz !== 0 ? face.nz * face.offset : (face.nx !== 0 ? localX : face.nz * face.offset);
        // For +x/-x faces, we need to use localX for the z direction
        const finalPz = (face.nx !== 0) ? localX : (face.nz !== 0 ? face.nz * face.offset : localX);
        const finalPx = (face.nz !== 0) ? localX : face.nx * face.offset;

        windows.push(
          <mesh key={`${fi}-${ri}-${ci}`} position={[finalPx, localY, finalPz]} rotation={[0, face.ry, 0]}>
            <planeGeometry args={[winW, winH]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={4.5} transparent opacity={0.93} />
          </mesh>
        );
      }
    }
  });
  return <>{windows}</>;
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
  const height = Math.max(9, Math.min(75, 9 + (contributions / 22)));
  const width = Math.max(7, Math.min(16, 5 + repos / 2.8));
  const isElite = contributions > 500;

  return (
    <>
      <RigidBody type="fixed" position={position} colliders="cuboid">
        <mesh
          position={[0, height / 2, 0]}
          castShadow receiveShadow
          onClick={(e) => { e.stopPropagation(); setShowCard(true); }}
        >
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial
            color={colorDark}
            emissive={color}
            emissiveIntensity={isElite ? 0.26 : 0.13}
            roughness={0.12}
            metalness={0.96}
          />
        </mesh>

        <BuildingWindows width={width} height={height} hex={hex} />

        {/* Corner neon edges */}
        {([[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]).map(([sx,sz], ci) => (
          <mesh key={ci} position={[sx*(width/2+0.05), height/2, sz*(width/2+0.05)]}>
            <boxGeometry args={[0.09, height+0.15, 0.09]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 7 : 4.5} roughness={0} />
          </mesh>
        ))}

        {/* Rooftop ring */}
        <mesh position={[0, height+0.04, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[width*0.38, width*0.46, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.88} />
        </mesh>

        {/* Ground glow — flat rings only */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[width*0.52, width*0.92, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.22} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[width*0.52, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.08} />
        </mesh>

        <AnimatedBeacon height={height} color={color} />

        {dev.avatar_url && (
          <Html position={[0, height+4.0, 0]} transform distanceFactor={30} center occlude={false}>
            <img src={dev.avatar_url} alt={dev.username} style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `2px solid ${hex}`, boxShadow: `0 0 10px ${hex}`,
              pointerEvents: 'none',
            }} onError={e => { e.currentTarget.style.display='none'; }} />
          </Html>
        )}

        {/* Text always faces camera via billboard — use sizeAttenuation for consistency */}
        <Text
          position={[0, height+2.7, 0]}
          fontSize={0.88}
          color="white"
          outlineWidth={0.07}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
          billboard
        >
          {dev.username}
        </Text>
        <Text
          position={[0, height+1.85, 0]}
          fontSize={0.48}
          color={hex}
          outlineWidth={0.04}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
          billboard
        >
          {`★${contributions} · ${repos}repos`}
        </Text>
      </RigidBody>

      {showCard && <ProfileCard dev={dev} hex={hex} onClose={() => setShowCard(false)} />}
    </>
  );
}
