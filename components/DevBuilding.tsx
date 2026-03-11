"use client";
import { RigidBody } from "@react-three/rapier";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function usernameToHue(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
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
    { rot: [0, 0, 0] as [number,number,number],          pos: [0, 0, width/2+0.02] as [number,number,number] },
    { rot: [0, Math.PI, 0] as [number,number,number],    pos: [0, 0, -(width/2+0.02)] as [number,number,number] },
    { rot: [0, Math.PI/2, 0] as [number,number,number],  pos: [width/2+0.02, 0, 0] as [number,number,number] },
    { rot: [0, -Math.PI/2, 0] as [number,number,number], pos: [-(width/2+0.02), 0, 0] as [number,number,number] },
  ];
  return (
    <group>
      {faces.map((face, fi) =>
        Array.from({ length: rows }).map((_, ri) =>
          Array.from({ length: cols }).map((_, ci) => {
            const seed = fi * 1000 + ri * 100 + ci;
            const isLit = (seed * 2654435761) % 100 > 25;
            if (!isLit) return null;
            const xOffset = (ci - (cols-1)/2) * (width * 0.7 / cols);
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

function AvatarBillboard({ url, height, onSelect }: { url: string, height: number, onSelect: () => void }) {
  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [url]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh
      ref={ref}
      position={[0, height + 4.5, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <circleGeometry args={[1.0, 32]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function NameLabel({ username, stats, height, hex, onSelect }: {
  username: string, stats: string, height: number, hex: string, onSelect: () => void
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText(username, 256, 54);
    ctx.font = '30px monospace';
    ctx.fillStyle = hex;
    ctx.shadowBlur = 6;
    ctx.fillText(stats, 256, 98);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [username, stats, hex]);

  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh
      ref={ref}
      position={[0, height + 2.2, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <planeGeometry args={[8, 2]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function DevBuilding({ dev, position, theme, onSelect }: any) {
  if (!dev) return null;

  const hue = usernameToHue(dev.username || "dev");
  const themeColors: Record<string, number> = { sunset: 30, neon: 280, emerald: 140, midnight: 210 };
  const effectiveHue = theme && themeColors[theme] ? (hue + themeColors[theme]) % 360 : hue;

  const color     = useMemo(() => new THREE.Color().setHSL(effectiveHue / 360, 0.9, 0.62), [effectiveHue]);
  const colorDark = useMemo(() => new THREE.Color().setHSL(effectiveHue / 360, 0.7, 0.09), [effectiveHue]);
  const hex = `#${color.getHexString()}`;

  const contributions = dev.contributions || 10;
  const repos   = dev.repos || 3;
  const height  = Math.max(6, Math.min(55, contributions / 60));
  const width   = Math.max(5, Math.min(14, 4 + repos / 4));
  const isElite = contributions > 300;
  const stats   = `★ ${contributions} · ${repos} repos`;

  // Single handler passed to all clickable elements
  const handleSelect = () => onSelect(dev, hex);

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">

      {/* Main tower */}
      <mesh
        position={[0, height / 2, 0]}
        castShadow receiveShadow
        onClick={(e) => { e.stopPropagation(); handleSelect(); }}
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

      {/* ✅ Avatar — clickable */}
      {dev.avatar_url && (
        <AvatarBillboard url={dev.avatar_url} height={height} onSelect={handleSelect} />
      )}

      {/* ✅ Name + stats label — clickable */}
      <NameLabel
        username={dev.username}
        stats={stats}
        height={height}
        hex={hex}
        onSelect={handleSelect}
      />

    </RigidBody>
  );
}
