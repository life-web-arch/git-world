"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Stars, useProgress, Grid, Cloud, Float } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick } from "ecctrl";
import { useEffect, useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import HUD from "./HUD";
import Chat from "./Chat";
import LoadingScreen from "./LoadingScreen";
import DevBuilding from "./DevBuilding";
import { ErrorBoundary } from "./ErrorBoundary";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Moon ─────────────────────────────────────────────────────────────────────
function Moon() {
  return (
    <group position={[-120, 90, -300]}>
      <mesh>
        <sphereGeometry args={[12, 32, 32]} />
        <meshStandardMaterial color="#fffbe8" emissive="#fffbe8" emissiveIntensity={0.6} roughness={1} />
      </mesh>
      <pointLight color="#fff8d0" intensity={400} distance={1200} decay={2} />
    </group>
  );
}

// ── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  const trunkH = 2.5 + Math.random() * 1.5;
  const canopyR = 2 + Math.random() * 1.5;
  const green = `hsl(${120 + Math.random() * 30}, 60%, ${18 + Math.random() * 12}%)`;
  return (
    <group position={position}>
      {/* trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, trunkH, 6]} />
        <meshStandardMaterial color="#3d2010" roughness={1} />
      </mesh>
      {/* canopy layers */}
      <mesh position={[0, trunkH + canopyR * 0.5, 0]} castShadow>
        <coneGeometry args={[canopyR, canopyR * 1.4, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.1, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.7, canopyR * 1.1, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.6, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.4, canopyR * 0.8, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Water ─────────────────────────────────────────────────────────────────────
function WaterBody({ position, rx, rz }: { position: [number,number,number], rx: number, rz: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).roughness =
        0.05 + Math.sin(s.clock.elapsedTime * 0.4) * 0.03;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <ellipseGeometry args={[rx, rz, 48]} />
      <meshStandardMaterial
        color="#0a2a4a"
        emissive="#0a3060"
        emissiveIntensity={0.4}
        roughness={0.05}
        metalness={0.9}
        transparent opacity={0.92}
      />
    </mesh>
  );
}

// ── Grass patch ───────────────────────────────────────────────────────────────
function GrassPatch({ position, r }: { position: [number,number,number], r: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <circleGeometry args={[r, 32]} />
      <meshStandardMaterial color="#0d2a10" roughness={0.95} />
    </mesh>
  );
}

// ── Firefly ───────────────────────────────────────────────────────────────────
function Fireflies() {
  const count = 30;
  const positions = useRef(
    Array.from({ length: count }, () => [
      (Math.random() - 0.5) * 300,
      1 + Math.random() * 8,
      (Math.random() - 0.5) * 300,
    ])
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const pulse = Math.sin(t * 2 + i * 1.3) * 0.5 + 0.5;
      (m.material as THREE.MeshBasicMaterial).opacity = pulse * 0.9;
      m.position.y = positions.current[i][1] + Math.sin(t * 0.5 + i) * 0.8;
    });
  });
  return (
    <>
      {positions.current.map((p, i) => (
        <mesh
          key={i}
          ref={el => { refs.current[i] = el; }}
          position={p as [number,number,number]}
        >
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshBasicMaterial color="#aaff44" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

// ── Scene content (inside Canvas) ─────────────────────────────────────────────
function WorldScene({ devs, flyMode, username }: any) {
  // Deterministic tree ring around city
  const treePositions: [number, number, number][] = [];
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 220 + (i % 3) * 30 + Math.random() * 20;
    treePositions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  // Scattered inner trees
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 340;
    const z = (Math.random() - 0.5) * 340;
    if (Math.sqrt(x*x + z*z) > 80) treePositions.push([x, 0, z]);
  }

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[-0.5, -0.08, -1]}
        inclination={0.48}
        azimuth={0.28}
        mieCoefficient={0.004}
        rayleigh={0.4}
        turbidity={9}
      />
      <Stars radius={350} depth={100} count={6000} factor={7} saturation={0.6} fade speed={0.15} />

      {/* Volumetric clouds */}
      <Cloud position={[-80, 55, -180]} speed={0.1} opacity={0.25} color="#aabbff" scale={3} />
      <Cloud position={[120, 70, -250]} speed={0.08} opacity={0.2} color="#8899ee" scale={2.5} />
      <Cloud position={[0, 60, -300]} speed={0.12} opacity={0.15} color="#99aadd" scale={4} />

      <Moon />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#101828" />
      <directionalLight
        position={[-120, 90, -300]}
        intensity={0.9}
        color="#d0e4ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <pointLight position={[0, 5, -50]} intensity={600} color="#ff5500" distance={350} decay={2} />
      <pointLight position={[120, 30, -180]} intensity={300} color="#3355ff" distance={400} decay={2} />
      <pointLight position={[-120, 30, -180]} intensity={300} color="#00ffcc" distance={400} decay={2} />

      <Fireflies />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
        {/* Player */}
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
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]}>
            <ringGeometry args={[0.28, 0.55, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.5} />
          </mesh>
        </Ecctrl>

        {/* Buildings */}
        {devs?.map((dev: any, i: number) => (
          <DevBuilding
            key={dev.username || i}
            dev={dev}
            position={[
              (i % 8) * 45 - 160,
              0,
              Math.floor(i / 8) * 45 - 200,
            ]}
          />
        ))}

        {/* Ground — large dark plane */}
        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[3000, 3000]} />
            <meshStandardMaterial color="#060a14" roughness={0.98} />
          </mesh>
        </RigidBody>
      </Physics>

      {/* Cyberpunk grid */}
      <Grid
        position={[0, 0.02, 0]}
        args={[3000, 3000]}
        cellSize={10}
        cellThickness={0.3}
        cellColor="#091428"
        sectionSize={50}
        sectionThickness={0.8}
        sectionColor="#0c2050"
        fadeDistance={400}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Grass patches */}
      <GrassPatch position={[80, 0.03, 60]} r={35} />
      <GrassPatch position={[-90, 0.03, 90]} r={28} />
      <GrassPatch position={[150, 0.03, -80]} r={40} />
      <GrassPatch position={[-140, 0.03, -60]} r={32} />
      <GrassPatch position={[20, 0.03, 160]} r={50} />
      <GrassPatch position={[-30, 0.03, -180]} r={45} />

      {/* Water bodies */}
      <WaterBody position={[110, 0.04, 110]} rx={28} rz={18} />
      <WaterBody position={[-130, 0.04, 130]} rx={22} rz={15} />
      <WaterBody position={[0, 0.04, 200]} rx={40} rz={25} />
      <WaterBody position={[-160, 0.04, -140]} rx={20} rz={14} />

      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
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
            if (payload?.username) setPlayers(p => ({ ...p, [payload.username]: payload }));
          }).subscribe();
      } catch (e) { console.error(e); }
    }
    return () => { room.current?.unsubscribe(); };
  }, []);

  const isDataReady = mounted && devs;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', background: '#050818', overflow: 'hidden' }}>
      {!isDataReady && <LoadingScreen progress={progress || 10} />}

      {isDataReady && (
        <>
          {/* Canvas — truly fullscreen */}
          <ErrorBoundary>
            <Canvas
              shadows
              gl={{ antialias: false, alpha: false }}
              camera={{ fov: 65, position: [0, 8, 120], near: 0.1, far: 2000 }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              <Suspense fallback={null}>
                <WorldScene devs={devs} flyMode={flyMode} username={username} />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          {/* UI overlays */}
          <HUD
            username={username}
            playersCount={Object.keys(players).length + 1}
            flyMode={flyMode}
            setFlyMode={setFlyMode}
          />
          <Chat username={username} />

          {isTouch && (
            <div style={{
              position: 'fixed', bottom: '16px', left: '8px', zIndex: 40,
              transform: 'scale(0.58)', transformOrigin: 'bottom left',
              opacity: 0.78, pointerEvents: 'auto',
            }}>
              <EcctrlJoystick />
            </div>
          )}
        </>
      )}
    </div>
  );
}
