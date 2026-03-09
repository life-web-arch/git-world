"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Text, Grid, Stars, Image, Float, useProgress } from "@react-three/drei";
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
  const width = Math.max(4, Math.min(18, (dev.repos || 0) / 2));
  
  return (
    <RigidBody type="fixed" position={position} onClick={() => window.open(`https://github.com/${dev.username}`, "_blank")}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial 
            color="#0a0a0a"
            emissive={`hsl(${(dev.username.length * 30) % 360}, 80%, 50%)`}
            emissiveIntensity={dev.contributions > 500 ? 1.5 : 0.4}
        />
      </mesh>
      {dev.avatar_url && (
        <Float speed={2} floatIntensity={0.5}>
            <Image url={dev.avatar_url} scale={[width * 0.7, width * 0.7]} position={[0, height / 2, width / 2 + 0.1]} />
        </Float>
      )}
      <Text position={[0, height + 1.2, 0]} fontSize={1.2} color="white" outlineWidth={0.05}>{dev.username}</Text>
    </RigidBody>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const { data: devs, isLoading } = useSWR('/api/city', fetcher);
  const { progress, active } = useProgress();
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
        
        {/* Loader stays on top until everything is 100% */}
        <LoadingScreen devs={devs || []} active={isLoading || active} />

        <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
        <Chat username={username} />
        
        {isTouch && <div className="fixed bottom-10 left-10 z-[100] scale-125"><EcctrlJoystick /></div>}

        <Canvas shadows camera={{ fov: 50, position: [0, 20, 50] }} dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 20, 200]} />
          
          <Suspense fallback={null}>
            <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#4ade80" />
            
            <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
              <Ecctrl animated jumpVel={flyMode ? 0 : 8} maxVelLimit={flyMode ? 20 : 10}>
                <mesh castShadow>
                   <capsuleGeometry args={[0.5, 1]} />
                   <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
                </mesh>
              </Ecctrl>
              
              {devs?.map((dev: any, i: number) => (
                <DevBuilding key={dev.username} dev={dev} position={[(i % 8) * 40 - 160, 0, Math.floor(i / 8) * 40 - 160]} />
              ))}

              <RigidBody type="fixed">
                <Grid infiniteGrid fadeDistance={200} sectionColor="#111" cellColor="#222" />
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[1000, 1000]} />
                  <meshStandardMaterial color="#050505" />
                </mesh>
              </RigidBody>
            </Physics>
          </Suspense>
        </Canvas>
      </div>
    </EcctrlProvider>
  );
}
