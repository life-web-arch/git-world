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
    const pulse = 0.7 + Math.sin(t * 1.5 + height) * 0.6;
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 25;
    }
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

export default function DevBuilding({ dev, position }: any) {
  if (!dev) return null;

  const hue = usernameToHue(dev.username || "dev");
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.9, 0.6), [hue]);
  // Darker base — but not TOO dark so moonlight can reveal form
  const colorDark = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.7, 0.1), [hue]);
  const colorMid = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.8, 0.2), [hue]);
  const hex = `#${color.getHexString()}`;
  const hexMid = `#${colorMid.getHexString()}`;

  const contributions = dev.contributions || 10;
  const repos = dev.repos || 3;
  const height = Math.max(5, Math.min(60, contributions / 70));
  const width = Math.max(4, Math.min(16, repos / 1.2));
  const isElite = contributions > 300;
  const floors = Math.max(1, Math.floor(height / 3.5));

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      {/* Main tower — metalness up, emissive up */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow
        onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}
      >
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color={colorDark}
          emissive={color}
          emissiveIntensity={isElite ? 0.35 : 0.18}
          roughness={0.15}
          metalness={0.95}
        />
      </mesh>

      {/* Window strips — brighter */}
      {Array.from({ length: floors }).map((_, fi) => (
        <group key={fi}>
          <mesh position={[0, fi * 3.5 + 2, width / 2 + 0.02]}>
            <planeGeometry args={[width * 0.78, 0.55]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 6 : 3.5} transparent opacity={0.98} />
          </mesh>
          <mesh position={[0, fi * 3.5 + 2, -(width / 2 + 0.02)]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[width * 0.78, 0.55]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 6 : 3.5} transparent opacity={0.98} />
          </mesh>
          <mesh position={[width / 2 + 0.02, fi * 3.5 + 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[width * 0.78, 0.55]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 6 : 3.5} transparent opacity={0.98} />
          </mesh>
          <mesh position={[-(width / 2 + 0.02), fi * 3.5 + 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[width * 0.78, 0.55]} />
            <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 6 : 3.5} transparent opacity={0.98} />
          </mesh>
        </group>
      ))}

      {/* Neon corner edges — brighter */}
      {([ [-1,-1], [-1,1], [1,-1], [1,1] ] as [number,number][]).map(([sx,sz], ci) => (
        <mesh key={ci} position={[sx * (width/2 + 0.06), height/2, sz * (width/2 + 0.06)]}>
          <boxGeometry args={[0.12, height + 0.3, 0.12]} />
          <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={isElite ? 8 : 5} roughness={0} />
        </mesh>
      ))}

      {/* Rooftop accent ring */}
      <mesh position={[0, height + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[width * 0.45, width * 0.52, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.9} />
      </mesh>

      {/* Ground glow pool — stronger */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[width * 1.0, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[width / 2, width * 1.0, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.32} />
      </mesh>

      {/* Building base light */}
      <pointLight position={[0, 1, 0]} color={hex} intensity={30} distance={width * 3} decay={2} />

      <AnimatedBeacon height={height} color={color} />

      {dev.avatar_url && (
        <Html position={[0, height + 4.5, 0]} transform distanceFactor={25} center occlude={false}>
          <img
            src={dev.avatar_url}
            alt={dev.username}
            style={{
              width: '38px', height: '38px', borderRadius: '50%',
              border: `2px solid ${hex}`,
              boxShadow: `0 0 12px ${hex}, 0 0 24px ${hex}66`,
              pointerEvents: 'none', display: 'block',
            }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </Html>
      )}

      <Text position={[0, height + 3.0, 0]} fontSize={0.92} color="white"
        outlineWidth={0.08} outlineColor="#000" anchorX="center" anchorY="middle">
        {dev.username}
      </Text>

      <Text position={[0, height + 2.0, 0]} fontSize={0.52} color={hex}
        outlineWidth={0.05} outlineColor="#000" anchorX="center" anchorY="middle">
        {`★ ${contributions} commits · ${repos} repos`}
      </Text>
    </RigidBody>
  );
}
