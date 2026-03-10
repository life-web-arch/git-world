"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Stars, useProgress, Grid, Cloud } from "@react-three/drei";
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
import { useFrame, useThree } from "@react-three/fiber";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Gradient sky using a large sphere with vertex colors
function NightSky() {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[800, 32, 32]} />
      <meshBasicMaterial side={THREE.BackSide} color="#020818" />
    </mesh>
  );
}

// Horizon glow band
function HorizonGlow() {
  return (
    <group>
      {/* Horizon band — cyan/teal city glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.5, 0]}>
        <ringGeometry args={[280, 600, 64]} />
        <meshBasicMaterial color="#0a2a40" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner closer glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <ringGeometry args={[80, 280, 64]} />
        <meshBasicMaterial color="#061828" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2("#020c1a", 0.0028);
    scene.background = new THREE.Color("#020818");
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

function Moon() {
  return (
    <group position={[180, 110, -350]}>
      <mesh>
        <sphereGeometry args={[9, 32, 32]} />
        <meshStandardMaterial color="#e8f4ff" emissive="#c8e0ff" emissiveIntensity={0.8} roughness={0.9} />
      </mesh>
      {/* Halo */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[13, 16, 16]} />
        <meshBasicMaterial color="#aaccff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#b0d4ff" intensity={600} distance={1400} decay={2} />
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  const seed = position[0] * 13.7 + position[2] * 7.3;
  const trunkH = 2.5 + (Math.abs(Math.sin(seed)) * 1.5);
  const canopyR = 1.8 + (Math.abs(Math.cos(seed)) * 1.4);
  // Varied dark greens and teals — no more pure black
  const hues = [145, 160, 130, 170, 120];
  const hue = hues[Math.abs(Math.floor(seed * 3.7)) % hues.length];
  const sat = 45 + (Math.abs(Math.sin(seed * 2)) * 20);
  const light = 14 + (Math.abs(Math.cos(seed * 3)) * 10);
  const green = `hsl(${hue}, ${sat}%, ${light}%)`;
  const trunkColor = "#1a0c06";
  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, trunkH, 6]} />
        <meshStandardMaterial color={trunkColor} roughness={1} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 0.5, 0]} castShadow>
        <coneGeometry args={[canopyR, canopyR * 1.5, 7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.1, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.68, canopyR * 1.2, 7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.65, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.38, canopyR * 0.85, 7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function WaterBody({ position, sx, sz }: { position: [number,number,number], sx: number, sz: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.45 + Math.sin(s.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  return (
    <group position={position} scale={[sx, 1, sz]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial
          color="#041220"
          emissive="#0a4070"
          emissiveIntensity={0.45}
          roughness={0.02}
          metalness={0.98}
          transparent opacity={0.92}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.9, 1.1, 48]} />
        <meshBasicMaterial color="#1a8090" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function GrassPatch({ position, r }: { position: [number,number,number], r: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <circleGeometry args={[r, 32]} />
      <meshStandardMaterial color="#0a2210" roughness={0.95} emissive="#0a2210" emissiveIntensity={0.05} />
    </mesh>
  );
}

function Fireflies() {
  const count = 30;
  const data = useRef(
    Array.from({ length: count }, (_, i) => ({
      pos: new THREE.Vector3(
        (((i * 137.5) % 300) - 150),
        1.2 + ((i * 73) % 9),
        (((i * 89.3) % 300) - 150)
      ),
      phase: i * 0.8,
    }))
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const d = data.current[i];
      const pulse = Math.sin(t * 2.2 + d.phase) * 0.5 + 0.5;
      (m.material as THREE.MeshBasicMaterial).opacity = pulse * 0.9;
      m.position.y = d.pos.y + Math.sin(t * 0.55 + d.phase) * 1.1;
      m.position.x = d.pos.x + Math.cos(t * 0.3 + d.phase * 0.5) * 0.8;
    });
  });

  return (
    <>
      {data.current.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={d.pos}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshBasicMaterial color="#88ffaa" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

function buildTreePositions(): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 220 + (i % 3) * 30 + (i * 7.3) % 20;
    positions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  for (let i = 0; i < 40; i++) {
    const x = (((i * 137.508) % 340) - 170);
    const z = (((i * 89.31) % 340) - 170);
    if (Math.sqrt(x * x + z * z) > 80) positions.push([x, 0, z]);
  }
  return positions;
}
const TREE_POSITIONS = buildTreePositions();

// City ambient fog pillars — rising light columns between buildings
function CityAtmosphere() {
  return (
    <group>
      {/* Ground fog layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, -80]}>
        <circleGeometry args={[180, 48]} />
        <meshBasicMaterial color="#041830" transparent opacity={0.35} />
      </mesh>
      {/* Central city glow from below */}
      <pointLight position={[0, 0.5, -80]} color="#0055aa" intensity={120} distance={300} decay={1.5} />
      <pointLight position={[-80, 0.5, -120]} color="#003366" intensity={80} distance={200} decay={1.5} />
      <pointLight position={[80, 0.5, -120]} color="#004455" intensity={80} distance={200} decay={1.5} />
    </group>
  );
}

function WorldScene({ devs, flyMode }: any) {
  return (
    <>
      <SceneFog />
      <NightSky />
      <HorizonGlow />

      <Stars radius={350} depth={80} count={7000} factor={6} saturation={0.7} fade speed={0.12} />

      <Cloud position={[-80, 55, -220]} speed={0.1} opacity={0.14} color="#1a3060" scale={4} />
      <Cloud position={[130, 70, -280]} speed={0.08} opacity={0.11} color="#112244" scale={3} />
      <Cloud position={[0, 65, -350]} speed={0.12} opacity={0.09} color="#0a1a33" scale={5} />

      <Moon />
      <Fireflies />
      <CityAtmosphere />

      {/* Stronger ambient — key fix for dullness */}
      <ambientLight intensity={0.55} color="#0d2040" />

      {/* Main moonlight — cooler, stronger */}
      <directionalLight
        position={[180, 110, -350]}
        intensity={1.4}
        color="#c0d8ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* City fill lights — colored bounced light from below */}
      <pointLight position={[0, 3, -50]} intensity={900} color="#ff4400" distance={400} decay={2} />
      <pointLight position={[130, 25, -180]} intensity={500} color="#2255ff" distance={450} decay={2} />
      <pointLight position={[-130, 25, -180]} intensity={500} color="#00ddbb" distance={450} decay={2} />
      <pointLight position={[0, 8, 60]} intensity={300} color="#22cc66" distance={250} decay={2} />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
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
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} roughness={0.2} metalness={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]}>
            <ringGeometry args={[0.28, 0.55, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
          </mesh>
        </Ecctrl>

        {devs?.map((dev: any, i: number) => (
          <DevBuilding
            key={dev.username || i}
            dev={dev}
            position={[(i % 8) * 45 - 160, 0, Math.floor(i / 8) * 45 - 200]}
          />
        ))}

        <RigidBody type="fixed">
          {/* Ground — dark teal instead of pure black */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 3000]} />
            <meshStandardMaterial color="#04111e" roughness={0.96} metalness={0.1} />
          </mesh>
        </RigidBody>
      </Physics>

      <Grid
        position={[0, 0.02, 0]}
        args={[3000, 3000]}
        cellSize={10}
        cellThickness={0.4}
        cellColor="#0a2035"
        sectionSize={50}
        sectionThickness={1.0}
        sectionColor="#0e3060"
        fadeDistance={500}
        fadeStrength={1.2}
        infiniteGrid
      />

      <GrassPatch position={[80, 0.03, 60]} r={35} />
      <GrassPatch position={[-90, 0.03, 90]} r={28} />
      <GrassPatch position={[150, 0.03, -80]} r={40} />
      <GrassPatch position={[-140, 0.03, -60]} r={32} />
      <GrassPatch position={[20, 0.03, 160]} r={50} />
      <GrassPatch position={[-30, 0.03, -180]} r={45} />

      <WaterBody position={[110, 0, 110]} sx={28} sz={18} />
      <WaterBody position={[-130, 0, 130]} sx={22} sz={15} />
      <WaterBody position={[0, 0, 200]} sx={40} sz={25} />
      <WaterBody position={[-160, 0, -140]} sx={20} sz={14} />

      {TREE_POSITIONS.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </>
  );
}

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
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', background: '#020818', overflow: 'hidden' }}>
      {!isDataReady && <LoadingScreen progress={progress || 10} />}
      {isDataReady && (
        <>
          <ErrorBoundary>
            <Canvas
              shadows
              gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
              camera={{ fov: 65, position: [0, 8, 120], near: 0.1, far: 2000 }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              <Suspense fallback={null}>
                <WorldScene devs={devs} flyMode={flyMode} username={username} />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <HUD username={username} playersCount={Object.keys(players).length + 1} flyMode={flyMode} setFlyMode={setFlyMode} />
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
