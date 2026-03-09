"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Html } from "@react-three/drei";

export default function DevBuilding({ dev, position }: any) {
  if (!dev) return null;
  const height = Math.max(5, (dev.contributions || 0) / 100);
  const width = Math.max(4, Math.min(18, (dev.repos || 0) / 2));

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh 
        position={[0, height / 2, 0]} 
        castShadow 
        receiveShadow 
        onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}
      >
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial 
            color="#0a0a0a"
            emissive={`hsl(${(dev.username.length * 30) % 360}, 80%, 40%)`}
            emissiveIntensity={dev.contributions > 500 ? 1.5 : 0.5}
        />
      </mesh>
      
      {/* SAFE HTML AVATAR: This cannot crash the WebGL engine */}
      {dev.avatar_url && (
        <Html position={[0, height / 2 + 1, width / 2 + 0.1]} transform distanceFactor={15}>
          <img 
            src={dev.avatar_url} 
            alt={dev.username}
            style={{ width: '80px', height: '80px', borderRadius: '12px', border: '3px solid #fff', pointerEvents: 'none' }}
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </Html>
      )}

      <Text position={[0, height + 1.2, 0]} fontSize={1.2} color="white" outlineWidth={0.05} outlineColor="#000">
        {dev.username}
      </Text>
    </RigidBody>
  );
}
