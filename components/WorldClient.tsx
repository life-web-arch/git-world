"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Text, Stars, useProgress } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick } from "ecctrl";
import EcctrlProvider from "ecctrl";
import { useEffect, useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import HUD from "./HUD";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";
import DevBuilding from "./DevBuilding";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const { progress, active } = useProgress();
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Failsafe: If after 10 seconds we are still loading, show a manual start button
    const timer = setTimeout(() => setTimedOut(true), 10000);

    if (typeof window !== 'undefined') {
      room.current = supabase.channel('presence').on('broadcast', { event: 'move' }, ({ payload }: any) => {
        if (payload?.username) setPlayers(prev => ({ ...prev, [payload.username]: payload }));
      }).subscribe();
    }
    return () => { 
      clearTimeout(timer);
      room.current?.unsubscribe(); 
    };
  }, []);

  // UI is visible only when data is here and mounting is done
  const canShowWorld = mounted && devs;
  const isFullyLoaded = !active && progress === 100;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      
      {/* Loader Overlays everything */}
      <LoadingScreen progress={progress} timedOut={timedOut} isLoaded={isFullyLoaded && devs} />

      {canShowWorld && (
        <EcctrlProvider>
          <div style={{ visibility: isFullyLoaded ? 'visible' : 'hidden' }}>
            <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
            <Chat username={username} />
            {isTouch && <div style={{ position: 'fixed', bottom: '40px', left: '40px', zIndex: 100, transform: 'scale(1.2)' }}><EcctrlJoystick /></div>}
          </div>

          <Canvas shadows camera={{ fov: 45, position: [0, 20, 50] }} dpr={[1, 1.5]}>
            <color attach="background" args={['#050505']} />
            <Suspense fallback={null}>
              <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0} azimuth={0.25} />
              <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
              <ambientLight intensity={1.5} />
              <pointLight position={[0, 50, 0]} intensity={2000} color="#4ade80" />
              
              <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
                <Ecctrl animated jumpVel={flyMode ? 0 : 8} maxVelLimit={flyMode ? 20 : 10}>
                  <mesh castShadow>
                     <capsuleGeometry args={[0.5, 1]} />
                     <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={5} />
                  </mesh>
                </Ecctrl>
                
                {devs?.map((dev: any, i: number) => (
                  <DevBuilding key={dev.username || i} dev={dev} position={[(i % 10) * 60 - 300, 0, Math.floor(i / 10) * 60 - 300]} />
                ))}

                <RigidBody type="fixed">
                  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[2000, 2000]} />
                    <meshStandardMaterial color="#0a0a0a" />
                  </mesh>
                </RigidBody>
              </Physics>
            </Suspense>
          </Canvas>
        </EcctrlProvider>
      )}
    </div>
  );
}
