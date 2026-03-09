"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Stars, useProgress, Grid } from "@react-three/drei";
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
    <>
      {/* Full screen black base — no half-black bug */}
      <div style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        backgroundColor: '#050818', overflow: 'hidden',
      }}>
        {!isDataReady && <LoadingScreen progress={progress || 10} />}

        {isDataReady && (
          <>
            {/* Canvas fills ENTIRE screen */}
            <ErrorBoundary>
              <Canvas
                shadows
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', display: 'block',
                }}
                camera={{ fov: 65, position: [0, 8, 120], near: 0.1, far: 2000 }}
                gl={{ antialias: true, alpha: false }}
              >
                <color attach="background" args={['#050818']} />
                <fog attach="fog" args={['#050818', 80, 600]} />

                <Suspense fallback={null}>
                  <Sky
                    distance={450000}
                    sunPosition={[-1, -0.05, -0.5]}
                    inclination={0.48}
                    azimuth={0.3}
                    mieCoefficient={0.003}
                    rayleigh={0.3}
                    turbidity={8}
                  />
                  <Stars radius={300} depth={80} count={5000} factor={6} saturation={0.5} fade speed={0.2} />

                  {/* Rich lighting */}
                  <ambientLight intensity={0.5} color="#1a2050" />
                  <directionalLight position={[-40, 60, -20]} intensity={1.2} color="#c0d0ff" castShadow
                    shadow-mapSize={[1024, 1024]} shadow-camera-far={400}
                    shadow-camera-left={-150} shadow-camera-right={150}
                    shadow-camera-top={150} shadow-camera-bottom={-150}
                  />
                  {/* City warm glow */}
                  <pointLight position={[0, 5, -100]} intensity={800} color="#ff4400" distance={400} decay={2} />
                  {/* Cool blue fill from far */}
                  <pointLight position={[150, 40, -200]} intensity={500} color="#2244ff" distance={500} decay={2} />
                  <pointLight position={[-150, 40, -200]} intensity={500} color="#00ffaa" distance={500} decay={2} />
                  {/* Atmospheric haze lights near ground */}
                  <pointLight position={[0, 1, 50]} intensity={60} color="#ff6600" distance={120} decay={2} />

                  <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
                    {/* Player — visible capsule, small, correct camera */}
                    <Ecctrl
                      animated={false}
                      jumpVel={flyMode ? 0 : 8}
                      maxVelLimit={flyMode ? 20 : 10}
                      camInitDis={-8}
                      camMinDis={-3}
                      camMaxDis={-15}
                      camInitDir={{ x: -0.15, y: 0 }}
                      position={[0, 4, 80]}
                    >
                      {/* Visible capsule — human scale */}
                      <mesh castShadow>
                        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
                        <meshStandardMaterial
                          color="#22c55e"
                          emissive="#22c55e"
                          emissiveIntensity={1.5}
                          roughness={0.3}
                          metalness={0.6}
                        />
                      </mesh>
                      {/* Glow ring at feet */}
                      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]}>
                        <ringGeometry args={[0.3, 0.6, 16]} />
                        <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
                      </mesh>
                    </Ecctrl>

                    {/* Buildings — tighter grid, closer together */}
                    {devs?.map((dev: any, i: number) => (
                      <DevBuilding
                        key={dev.username || i}
                        dev={dev}
                        position={[
                          (i % 8) * 45 - 160,
                          0,
                          Math.floor(i / 8) * 45 - 200
                        ]}
                      />
                    ))}

                    {/* Ground with grid */}
                    <RigidBody type="fixed">
                      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
                        <planeGeometry args={[2000, 2000]} />
                        <meshStandardMaterial color="#070b1a" roughness={0.95} metalness={0.05} />
                      </mesh>
                    </RigidBody>

                    {/* Cyberpunk grid overlay */}
                    <Grid
                      position={[0, 0.02, 0]}
                      args={[2000, 2000]}
                      cellSize={10}
                      cellThickness={0.3}
                      cellColor="#0a1a3a"
                      sectionSize={50}
                      sectionThickness={0.8}
                      sectionColor="#0d2a5a"
                      fadeDistance={300}
                      fadeStrength={1.5}
                      infiniteGrid
                    />
                  </Physics>
                </Suspense>
              </Canvas>
            </ErrorBoundary>

            {/* HUD overlays on top of canvas */}
            <HUD
              username={username}
              playersCount={Object.keys(players).length + 1}
              flyMode={flyMode}
              setFlyMode={setFlyMode}
            />
            <Chat username={username} />

            {/* Joystick — small, bottom-left, above ground */}
            {isTouch && (
              <div style={{
                position: 'fixed', bottom: '16px', left: '8px',
                zIndex: 40,
                transform: 'scale(0.6)',
                transformOrigin: 'bottom left',
                opacity: 0.8,
                pointerEvents: 'auto',
              }}>
                <EcctrlJoystick />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
