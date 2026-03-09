"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Html } from "@react-three/drei";
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
    const pulse = 0.8 + Math.sin(t * 1.5 + height) * 0.5;
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 3;
    }
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 15;
    }
  });
  const hex = `#${color.getHexString()}`;
  return (
    <group position={[0, height + 1.2, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={2} roughness={0} metalness={1} />
      </mesh>
      <pointLight ref={lightRef} color={hex} intensity={10} distance={30} decay={2} />
    </group>
  );
}

export default function DevBuilding({ dev, position }: any) {
  if (!dev) return null;

  const hue = usernameToHue(dev.username || "dev");
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.85, 0.55), [hue]);
  const colorDark = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.85, 0.15), [hue]);
  const hex = `#${color.getHexString()}`;

  const contributions = dev.contributions || 10;
  const repos = dev.repos || 3;
  const height = Math.max(5, Math.min(60, contributions / 70));
  const width = Math.max(4, Math.min(16, repos / 1.2));
  const isElite = contributions > 300;
  const floors = Math.max(1, Math.floor(height / 3.5));

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      {/* Main tower */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow
        onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}
      >
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color={colorDark}
          emissive={color}
          emissiveIntensity={isElite ? 0.2 : 0.08}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Window rows — horizontal glowing strips */}
      {Array.from({ length: floors }).map((_, fi) => (
        <group key={fi}>
          {/* Front face windows */}
          <mesh position={[0, fi * 3.5 + 2, width / 2 + 0.02]}>
            <planeGeometry args={[width * 0.75, 0.5]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 4 : 2} transparent opacity={0.95} />
          </mesh>
          {/* Back face */}
          <mesh position={[0, fi * 3.5 + 2, -(width / 2 + 0.02)]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[width * 0.75, 0.5]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 4 : 2} transparent opacity={0.95} />
          </mesh>
          {/* Side faces */}
          <mesh position={[width / 2 + 0.02, fi * 3.5 + 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[width * 0.75, 0.5]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 4 : 2} transparent opacity={0.95} />
          </mesh>
          <mesh position={[-(width / 2 + 0.02), fi * 3.5 + 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[width * 0.75, 0.5]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 4 : 2} transparent opacity={0.95} />
          </mesh>
        </group>
      ))}

      {/* 4 Vertical neon corner edges */}
      {([ [-1,-1], [-1,1], [1,-1], [1,1] ] as [number,number][]).map(([sx,sz], ci) => (
        <mesh key={ci} position={[sx * (width/2 + 0.05), height/2, sz * (width/2 + 0.05)]}>
          <boxGeometry args={[0.1, height + 0.2, 0.1]} />
          <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 6 : 3} roughness={0} />
        </mesh>
      ))}

      {/* Ground glow pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[width * 0.9, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[width / 2, width * 0.9, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.25} />
      </mesh>

      {/* Animated beacon */}
      <AnimatedBeacon height={height} color={color} />

      {/* Avatar */}
      {dev.avatar_url && (
        <Html position={[0, height + 4.2, 0]} transform distanceFactor={25} center occlude={false}>
          <img
            src={dev.avatar_url}
            alt={dev.username}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: `2px solid ${hex}`,
              boxShadow: `0 0 10px ${hex}, 0 0 20px ${hex}44`,
              pointerEvents: 'none', display: 'block',
            }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </Html>
      )}

      {/* Username */}
      <Text position={[0, height + 2.8, 0]} fontSize={0.9} color="white"
        outlineWidth={0.07} outlineColor="#000" anchorX="center" anchorY="middle">
        {dev.username}
      </Text>

      {/* Stats */}
      <Text position={[0, height + 1.8, 0]} fontSize={0.5} color={hex}
        outlineWidth={0.04} outlineColor="#000" anchorX="center" anchorY="middle">
        {`★ ${contributions} commits · ${repos} repos`}
      </Text>
    </RigidBody>
  );
}
