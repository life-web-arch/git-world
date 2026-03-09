"use client";
import { RigidBody } from "@react-three/rapier";
import { Text, Image, Float } from "@react-three/drei";
import { useState } from "react";

export default function DevBuilding({ dev, position }: any) {
  const [imgError, setImgError] = useState(false);
  if (!dev) return null;
  const height = Math.max(5, (dev.contributions || 0) / 100);
  const width = Math.max(4, Math.min(18, (dev.repos || 0) / 2));

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid" onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial 
            color="#050505"
            emissive={`hsl(${(dev.username.length * 30) % 360}, 80%, 50%)`}
            emissiveIntensity={dev.contributions > 500 ? 2 : 0.5}
        />
      </mesh>
      {dev.avatar_url && !imgError && (
        <Float speed={1} floatIntensity={0.2}>
            <Image 
              url={dev.avatar_url} 
              scale={[width * 0.7, width * 0.7]} 
              position={[0, height / 2, width / 2 + 0.1]} 
              onError={() => setImgError(true)}
            />
        </Float>
      )}
      <Text position={[0, height + 1.2, 0]} fontSize={1.2} color="white">
        {dev.username}
      </Text>
    </RigidBody>
  );
}
