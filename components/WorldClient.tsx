"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Environment, Text, Grid, Stars, Image, Float } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick, EcctrlProvider } from "ecctrl";
import { useEffect, useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import HUD from "./HUD";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function DevBuilding({ dev, position }: any) {
  const height = Math.max(5, (dev.contributions || 0) / 100);
  const width = Math.max(4, Math.min(20, (dev.repos || 0) / 2));
  const isTopDev = dev.contributions > 1000;

  return (
    <RigidBody type="fixed" position={position} colliders="cuboid" onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial 
            color={`hsl(${(dev.username.length * 40) % 360}, 60%, 15%)`} 
            emissive={`hsl(${(dev.username.length * 40) % 360}, 60%, 40%)`}
            emissiveIntensity={isTopDev ? 2 : 0.4}
        />
      </mesh>
      {dev.avatar_url && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Image url={dev.avatar_url} scale={[width * 0.7, width * 0.7]} position={[0, height / 2, width / 2 + 0.1]} />
        </Float>
      )}
      <Text position={[0, height + 1.5, 0]} fontSize={1.2} color="white">
        {dev.username.toUpperCase()}
      </Text>
    </RigidBody>
  );
}

function City({ devs }: { devs: any[] }) {
  if (!devs) return null;
  return (
    <group>
      {devs.map((dev, i) => {
        const spacing = 45;
        const x = (i % 10) * spacing - 225;
        const z = Math.floor(i / 10) * spacing - 225;
        return <DevBuilding key={dev.username} dev={dev} position={[x, 0, z]} />;
      })}
    </group>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    room.current = supabase.channel('presence').on('broadcast', { event: 'move' }, ({ payload }: any) => {
      setPlayers(prev => ({ ...prev, [payload.username]: payload }));
    }).subscribe();
  }, []);

  return (
    <EcctrlProvider>
      <div className="w-screen h-screen bg-black overflow-hidden fixed inset-0">
        {/* Loading Screen shows until BOTH data and 3D assets are ready */}
        <Suspense fallback={<LoadingScreen devs={devs || []} />}>
          {!devs && <LoadingScreen devs={[]} />}
          
          <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
          <Chat username={username} />
          
          {isTouch && <div className="fixed bottom-10 left-10 z-[200] opacity-60"><EcctrlJoystick /></div>}

          <Canvas shadows camera={{ fov: 50, position: [0, 20, 50] }}>
            <fog attach="fog" args={['#09090b', 30, 250]} />
            <Sky sunPosition={[100, 10, 100]} />
            <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} />
            <Environment preset="night" />
            <ambientLight intensity={0.2} />
            <directionalLight position={[50, 50, 50]} intensity={1} castShadow />

            <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
              <Ecctrl animated jumpVel={flyMode ? 0 : 8} maxVelLimit={flyMode ? 20 : 10}>
                <mesh position={[0, 1, 0]} castShadow>
                  <capsuleGeometry args={[0.4, 0.8, 4]} />
                  <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} />
                </mesh>
              </Ecctrl>
              <City devs={devs} />
              <RigidBody type="fixed">
                <Grid infiniteGrid fadeDistance={300} sectionColor="#1e293b" cellColor="#0f172a" />
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[2000, 2000]} />
                  <meshStandardMaterial color="#09090b" />
                </mesh>
              </RigidBody>
            </Physics>
          </Canvas>
        </Suspense>
      </div>
    </EcctrlProvider>
  );
}
