"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Stars, useProgress, Environment } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick } from "ecctrl";
import { useEffect, useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import HUD from "./HUD";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";
import DevBuilding from "./DevBuilding";
import { ErrorBoundary } from "./ErrorBoundary";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const { progress } = useProgress();
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (typeof window !== 'undefined') {
      try {
        room.current = supabase.channel('presence')
          .on('broadcast', { event: 'move' }, ({ payload }: any) => {
            if (payload?.username) setPlayers(prev => ({ ...prev, [payload.username]: payload }));
          }).subscribe();
      } catch (e) { console.error(e); }
    }
    return () => { room.current?.unsubscribe(); };
  }, []);

  const isDataReady = mounted && devs;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050818', position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {!isDataReady && <LoadingScreen progress={progress || 10} />}

      {isDataReady && (
        <>
          <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
          <Chat username={username} />
          {isTouch && (
            <div style={{ position: 'fixed', bottom: '40px', left: '40px', zIndex: 100, transform: 'scale(1.2)' }}>
              <EcctrlJoystick />
            </div>
          )}

          <ErrorBoundary>
            <Canvas
              shadows
              camera={{ fov: 60, position: [0, 8, 20], near: 0.1, far: 1000 }}
              style={{ display: 'block', width: '100vw', height: '100vh' }}
            >
              <color attach="background" args={['#050818']} />
              <fog attach="fog" args={['#050818', 80, 400]} />

              <Suspense fallback={null}>
                {/* Night sky with faint stars */}
                <Sky
                  distance={450000}
                  sunPosition={[0, -0.1, -1]}
                  inclination={0.49}
                  azimuth={0.25}
                  mieCoefficient={0.005}
                  mieDirectionalG={0.8}
                  rayleigh={0.5}
                  turbidity={10}
                />
                <Stars radius={200} depth={60} count={3000} factor={5} saturation={0.3} fade speed={0.3} />

                {/* Rich lighting setup */}
                <ambientLight intensity={0.3} color="#1a2040" />
                {/* Moon-like directional */}
                <directionalLight
                  position={[-50, 80, -30]}
                  intensity={0.8}
                  color="#b0c4ff"
                  castShadow
                  shadow-mapSize={[2048, 2048]}
                  shadow-camera-far={500}
                  shadow-camera-left={-200}
                  shadow-camera-right={200}
                  shadow-camera-top={200}
                  shadow-camera-bottom={-200}
                />
                {/* Warm city glow from below */}
                <pointLight position={[0, 2, 0]} intensity={30} color="#ff6030" distance={80} />
                {/* Cool accent fill */}
                <pointLight position={[100, 30, 100]} intensity={200} color="#4060ff" distance={300} />
                <pointLight position={[-100, 30, -100]} intensity={200} color="#00ffaa" distance={300} />

                <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
                  {/* Player — SMALL capsule, correct scale */}
                  <Ecctrl
                    animated
                    jumpVel={flyMode ? 0 : 8}
                    maxVelLimit={flyMode ? 20 : 10}
                    camInitDis={-6}
                    camMinDis={-2}
                    camMaxDis={-12}
                  >
                    <mesh castShadow>
                      <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
                      <meshStandardMaterial
                        color="#22c55e"
                        emissive="#22c55e"
                        emissiveIntensity={2}
                        roughness={0.2}
                        metalness={0.8}
                      />
                    </mesh>
                  </Ecctrl>

                  {devs?.map((dev: any, i: number) => (
                    <DevBuilding
                      key={dev.username || i}
                      dev={dev}
                      position={[(i % 10) * 60 - 270, 0, Math.floor(i / 10) * 60 - 270]}
                    />
                  ))}

                  {/* Ground — dark reflective surface with grid lines feel */}
                  <RigidBody type="fixed">
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
                      <planeGeometry args={[2000, 2000, 80, 80]} />
                      <meshStandardMaterial
                        color="#080c18"
                        roughness={0.8}
                        metalness={0.2}
                      />
                    </mesh>
                  </RigidBody>

                  {/* Grid lines on ground for cyberpunk feel */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[2000, 2000]} />
                    <meshBasicMaterial color="#0a1628" wireframe={false} transparent opacity={0.6} />
                  </mesh>
                </Physics>
              </Suspense>
            </Canvas>
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
