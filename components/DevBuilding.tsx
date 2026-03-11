"use client";
import { RigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createPortal } from "react-dom";

if (typeof document !== 'undefined') {
  const id = 'git-world-styles';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`;
    document.head.appendChild(s);
  }
}

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

// Load avatar as a Three.js texture — no Html/div needed
function useAvatarTexture(url: string | null) {
  const texture = useMemo(() => {
    if (!url) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [url]);
  return texture;
}

// Circular avatar rendered as a billboard mesh in the 3D scene
function AvatarBillboard({ url, height, hex }: { url: string, height: number, hex: string }) {
  const texture = useAvatarTexture(url);
  const ref = useRef<THREE.Mesh>(null);

  // Always face camera
  useFrame(({ camera }) => {
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion);
    }
  });

  if (!texture) return null;

  return (
    <mesh ref={ref} position={[0, height + 4.5, 0]}>
      <circleGeometry args={[1.0, 32]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function ProfileCard({ dev, hex, onClose }: { dev: any, hex: string, onClose: () => void }) {
  const { level, title, xp } = getLevel(dev.contributions || 0, dev.repos || 0);
  const nextXp = [100,300,800,2000,5000,10000,20000,50000,100000,999999][level - 1];
  const progress = Math.min(100, (xp / nextXp) * 100);

  const card = (
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
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
            {dev.username?.toUpperCase()}
          </div>
          <div style={{ color: hex, fontSize: 11, letterSpacing: 3, marginTop: 2 }}>
            @{dev.username}
          </div>
        </div>
      </div>
      <div style={{
        background: '#111827', borderRadius: 10, padding: '10px 14px',
        border: `1px solid ${hex}44`, marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: hex, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>LV {level} · {title}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background: '#1f2937', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${hex}, ${hex}aa)`,
            transition: 'width 1s ease',
          }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'COMMITS',   value: (dev.contributions || 0).toLocaleString() },
          { label: 'REPOS',     value: (dev.repos || 0).toLocaleString() },
          { label: 'FOLLOWERS', value: (dev.followers || 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: '#111827', borderRadius: 8, padding: '10px 8px', textAlign: 'center',
            border: '1px solid #1f2937'
          }}>
            <div style={{ color: hex, fontSize: 15, fontWeight: 900 }}>{value}</div>
            <div style={{ color: '#444', fontSize: 8, letterSpacing: 2, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => window.open(`https://github.com/${dev.username}`, '_blank')}
          style={{
            flex: 1, padding: '12px', background: hex, color: '#000',
            border: 'none', borderRadius: 8, fontFamily: 'monospace',
            fontSize: 11, fontWeight: 900, letterSpacing: 2, cursor: 'pointer',
          }}
        >VIEW GITHUB →</button>
        <button onClick={onClose} style={{
          flex: 1, padding: '12px', background: 'transparent',
          border: `1px solid ${hex}44`, color: '#666', borderRadius: 8,
          fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, cursor: 'pointer',
        }}>CLOSE</button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(card, document.body);
}

function AnimatedBeacon({ height, color }: { height: number; color: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.7 + Math.sin(t * 1.5 + height) * 0.6;
    if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 5;
    if (lightRef.current) lightRef.current.intensity = pulse * 25;
  });
  const hex = `#${color.getHexString()}`;
  return (
    <group position={[0, height + 1.4, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.38, 8, 8]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={3} roughness={0} metalness={1} />
      </mesh>
      <pointLight ref={lightRef} color={hex} intensity={20} distance={40} decay={2} />
    </group>
  );
}

function WindowGrid({ width, height, hex, isElite }: { width: number, height: number, hex: string, isElite: boolean }) {
  const cols = Math.max(2, Math.floor(width / 2.2));
  const rows = Math.max(2, Math.floor(height / 2.5));
  const winW = (width * 0.7) / cols;
  const faces = [
    { rot: [0, 0, 0] as [number,number,number],           pos: [0, 0, width/2+0.02] as [number,number,number] },
    { rot: [0, Math.PI, 0] as [number,number,number],     pos: [0, 0, -(width/2+0.02)] as [number,number,number] },
    { rot: [0, Math.PI/2, 0] as [number,number,number],   pos: [width/2+0.02, 0, 0] as [number,number,number] },
    { rot: [0, -Math.PI/2, 0] as [number,number,number],  pos: [-(width/2+0.02), 0, 0] as [number,number,number] },
  ];
  return (
    <group>
      {faces.map((face, fi) =>
        Array.from({ length: rows }).map((_, ri) =>
          Array.from({ length: cols }).map((_, ci) => {
            const seed = fi * 1000 + ri * 100 + ci;
            const isLit = (seed * 2654435761) % 100 > 25;
            if (!isLit) return null;
            const xOffset = (ci - (cols - 1) / 2) * (width * 0.7 / cols);
            const yPos = ri * 2.5 + 1.8;
            return (
              <mesh
                key={`${fi}-${ri}-${ci}`}
                position={[
                  face.pos[0] + (fi < 2 ? xOffset : 0),
                  yPos,
                  face.pos[2] + (fi >= 2 ? xOffset : 0),
                ]}
                rotation={face.rot}
              >
                <planeGeometry args={[winW * 0.65, 0.52]} />
                <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 5 : 3} transparent opacity={0.9} />
              </mesh>
            );
          })
        )
      )}
    </group>
  );
}

export default function DevBuilding({ dev, position, theme }: any) {
  const [showCard, setShowCard] = useState(false);
  if (!dev) return null;

  const hue = usernameToHue(dev.username || "dev");
  const themeColors: Record<string, number> = { sunset: 30, neon: 280, emerald: 140, midnight: 210 };
  const effectiveHue = theme && themeColors[theme] ? (hue + themeColors[theme]) % 360 : hue;

  const color    = useMemo(() => new THREE.Color().setHSL(effectiveHue / 360, 0.9, 0.62), [effectiveHue]);
  const colorDark = useMemo(() => new THREE.Color().setHSL(effectiveHue / 360, 0.7, 0.09), [effectiveHue]);
  const hex = `#${color.getHexString()}`;

  const contributions = dev.contributions || 10;
  const repos   = dev.repos || 3;
  const height  = Math.max(6, Math.min(55, contributions / 60));
  const width   = Math.max(5, Math.min(14, 4 + repos / 4));
  const isElite = contributions > 300;

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
            color={colorDark} emissive={color}
            emissiveIntensity={isElite ? 0.32 : 0.16}
            roughness={0.15} metalness={0.95}
          />
        </mesh>

        <WindowGrid width={width} height={height} hex={hex} isElite={isElite} />

        {/* Corner edges */}
        {([ [-1,-1], [-1,1], [1,-1], [1,1] ] as [number,number][]).map(([sx,sz], ci) => (
          <mesh key={ci} position={[sx*(width/2+0.06), height/2, sz*(width/2+0.06)]}>
            <boxGeometry args={[0.1, height+0.3, 0.1]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 7 : 4} roughness={0} />
          </mesh>
        ))}

        {/* Rooftop ring */}
        <mesh position={[0, height+0.08, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[width*0.45, width*0.52, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.9} />
        </mesh>

        {/* Ground glow */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.06, 0]}>
          <circleGeometry args={[width*1.1, 32]} />
          <meshBasicMaterial color={hex} transparent opacity={0.15} />
        </mesh>

        <pointLight position={[0, 1, 0]} color={hex} intensity={25} distance={width*3} decay={2} />
        <AnimatedBeacon height={height} color={color} />

        {/* ✅ Avatar as billboard mesh — NO Html/div */}
        {dev.avatar_url && (
          <AvatarBillboard url={dev.avatar_url} height={height} hex={hex} />
        )}

        <Text
          position={[0, height+3.0, 0]} fontSize={0.88} color="white"
          outlineWidth={0.08} outlineColor="#000" anchorX="center" anchorY="middle"
        >
          {dev.username}
        </Text>
        <Text
          position={[0, height+2.0, 0]} fontSize={0.48} color={hex}
          outlineWidth={0.04} outlineColor="#000" anchorX="center" anchorY="middle"
        >
          {`★ ${contributions} · ${repos} repos`}
        </Text>

      </RigidBody>

      {/* Profile card portaled to document.body */}
      {showCard && <ProfileCard dev={dev} hex={hex} onClose={() => setShowCard(false)} />}
    </>
  );
}
