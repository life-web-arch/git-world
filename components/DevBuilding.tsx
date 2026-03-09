"use client";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Text, Image, Float } from "@react-three/drei";
import * as THREE from "three";

export default function DevBuilding({ dev, position }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  
  const height = Math.max(5, (dev.contributions || 0) / 100);
  const width = Math.max(4, Math.min(18, (dev.repos || 0) / 2));

  // Lazy Loading Logic: Only "activate" the building if player is within 150 units
  useFrame(({ camera }) => {
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    if (distance < 150 && !visible) setVisible(true);
    if (distance > 150 && visible) setVisible(false);
  });

  if (!visible) return null; // Component isn't even in the React tree if far away

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid" onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial 
            color="#0a0a0a"
            emissive={`hsl(${(dev.username.length * 30) % 360}, 80%, 50%)`}
            emissiveIntensity={dev.contributions > 500 ? 1.5 : 0.4}
        />
      </mesh>
      {dev.avatar_url && (
        <Float speed={1} floatIntensity={0.2}>
            <Image url={dev.avatar_url} scale={[width * 0.7, width * 0.7]} position={[0, height / 2, width / 2 + 0.1]} />
        </Float>
      )}
      <Text position={[0, height + 1.2, 0]} fontSize={1.2} color="white" font="/fonts/Inter-Bold.ttf">
        {dev.username}
      </Text>
    </RigidBody>
  );
}
