"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Html } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Deterministic color from username string
function usernameToColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 90%, 55%)`;
}

function usernameToHSL(username: string): [number, number, number] {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return [hue / 360, 0.9, 0.55];
}

// Animated neon top beacon
function Beacon({ height, color }: { height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.5 + Math.sin(t * 2) * 1.0;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, height + 1.5, 0]} castShadow>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        roughness={0}
        metalness={1}
      />
    </mesh>
  );
}

export default function DevBuilding({ dev, position }: any) {
  if (!dev) return null;

  const height = Math.max(6, Math.min(80, (dev.contributions || 0) / 80));
  const width = Math.max(5, Math.min(20, (dev.repos || 0) / 1.5));
  const color = usernameToColor(dev.username || "dev");
  const [h, s, l] = usernameToHSL(dev.username || "dev");
  const threeColor = new THREE.Color().setHSL(h, s, l);
  const colorStr = `#${threeColor.getHexString()}`;

  const isElite = (dev.contributions || 0) > 500;
  const floors = Math.floor(height / 3);

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      {/* Main building body */}
      <mesh
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}
      >
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial
          color="#0d1117"
          emissive={colorStr}
          emissiveIntensity={isElite ? 0.15 : 0.08}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Glowing window strips — horizontal bands every 3 units */}
      {Array.from({ length: floors }).map((_, fi) => (
        <mesh key={fi} position={[0, fi * 3 + 2, width / 2 + 0.05]} castShadow>
          <planeGeometry args={[width * 0.8, 0.4]} />
          <meshStandardMaterial
            color={colorStr}
            emissive={colorStr}
            emissiveIntensity={isElite ? 3 : 1.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* Edge neon trim — 4 vertical corners */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], ci) => (
        <mesh key={ci} position={[sx * (width / 2), height / 2, sz * (width / 2)]}>
          <boxGeometry args={[0.12, height, 0.12]} />
          <meshStandardMaterial
            color={colorStr}
            emissive={colorStr}
            emissiveIntensity={isElite ? 4 : 2}
            roughness={0}
          />
        </mesh>
      ))}

      {/* Ground glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[width / 2, width / 2 + 1.5, 32]} />
        <meshBasicMaterial color={colorStr} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Animated beacon on top */}
      <Beacon height={height} color={colorStr} />

      {/* Avatar — small, positioned above beacon */}
      {dev.avatar_url && (
        <Html
          position={[0, height + 4.5, 0]}
          transform
          distanceFactor={20}
          occlude={false}
          center
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            <img
              src={dev.avatar_url}
              alt={dev.username}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `2px solid ${color}`,
                boxShadow: `0 0 12px ${color}`,
                display: 'block',
              }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </Html>
      )}

      {/* Username label */}
      <Text
        position={[0, height + 3.2, 0]}
        fontSize={1.0}
        color="white"
        outlineWidth={0.08}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {dev.username}
      </Text>

      {/* Stats sub-label */}
      <Text
        position={[0, height + 2.0, 0]}
        fontSize={0.55}
        color={colorStr}
        outlineWidth={0.05}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {`${dev.contributions || 0} commits · ${dev.repos || 0} repos`}
      </Text>
    </RigidBody>
  );
}
