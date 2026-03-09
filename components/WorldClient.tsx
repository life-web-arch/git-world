"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Grid, Stars, useProgress } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick, EcctrlProvider } from "ecctrl";
import { useEffect, useState, useRef, Suspense, lazy } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import HUD from "./HUD";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";

// Lazy load the building component to split the JS bundle
const DevBuilding = lazy(() => import("./DevBuilding"));

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WorldClient({ username }: { username: string }) {
  const { data: devs, isLoading } = useSWR('/api/city', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 60000 
  });
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
      <div className="w-screen h-screen bg-[#050505] overflow-hidden fixed inset-0">
        
        <LoadingScreen devs={devs || []} active={isLoading || active} />
        
        <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
        <Chat username={username} />
        
        {isTouch && <div className="fixed bottom-10 left-10 z-[100] scale-125"><EcctrlJoystick /></div>}

        <Canvas shadows camera={{ fov: 45, position: [0, 20, 50] }} dpr={[1, 1.5]}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', 50, 250]} />
          
          <Suspense fallback={null}>
            <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
            
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 50, 10]} intensity={1.5} color="#4ade80" />
            
            <Physics gravity={[0, flyMode ? 0 : -20, 0]} paused={isLoading}>
              <Ecctrl animated jumpVel={flyMode ? 0 : 8} maxVelLimit={flyMode ? 20 : 10}>
                <mesh castShadow>
                   <capsuleGeometry args={[0.5, 1]} />
                   <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={flyMode ? 5 : 1} />
                </mesh>
              </Ecctrl>
              
              {devs?.map((dev: any, i: number) => {
                const x = (i % 10) * 50 - 250;
                const z = Math.floor(i / 10) * 50 - 250;
                return (
                  <Suspense key={dev.username} fallback={null}>
                    <DevBuilding dev={dev} position={[x, 0, z]} />
                  </Suspense>
                );
              })}

              <RigidBody type="fixed">
                <Grid infiniteGrid fadeDistance={300} sectionColor="#111" cellColor="#222" sectionSize={10} cellSize={1} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[5000, 5000]} />
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
