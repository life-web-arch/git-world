"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Stars, useProgress, Grid, Cloud } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick } from "ecctrl";
import { useEffect, useState, useRef, Suspense, useMemo } from "react";
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

// ── Moon ──────────────────────────────────────────────────────────────────────
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

// ── Tree (deterministic, no Math.random) ─────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  const seed = Math.abs(position[0] * 13.7 + position[2] * 7.3);
  const trunkH = 2.5 + (seed % 1.5);
  const canopyR = 2 + (seed % 1.5);
  const light = 18 + (seed % 12);
  const green = `hsl(125, 55%, ${light}%)`;
  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, trunkH, 6]} />
        <meshStandardMaterial color="#3d2010" roughness={1} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 0.5, 0]} castShadow>
        <coneGeometry args={[canopyR, canopyR * 1.5, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.1, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.65, canopyR * 1.1, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.6, 0]} castShadow>
        <coneGeometry args={[canopyR * 0.35, canopyR * 0.8, 7]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Water ─────────────────────────────────────────────────────────────────────
function WaterBody({ position, sx, sz }: { position: [number,number,number], sx: number, sz: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(s.clock.elapsedTime * 0.5) * 0.15;
    }
  });
  return (
    <group position={position} scale={[sx, 1, sz]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#061828" emissive="#0a3060" emissiveIntensity={0.3}
          roughness={0.05} metalness={0.95} transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.92, 1.06, 48]} />
        <meshBasicMaterial color="#1a8090" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ── Grass tile ────────────────────────────────────────────────────────────────
function GrassTile({ position, w, d }: { position: [number,number,number], w: number, d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#14421a" roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ── Road ──────────────────────────────────────────────────────────────────────
function Road({ position, w, d, dir = 'z' }: { position: [number,number,number], w: number, d: number, dir?: string }) {
  return (
    <group position={position}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#111318" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Centre dashes */}
      {Array.from({ length: Math.floor((dir === 'z' ? d : w) / 12) }).map((_, i) => {
        const offset = i * 12 - (dir === 'z' ? d : w) / 2 + 6;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, dir === 'x' ? Math.PI / 2 : 0]}
            position={dir === 'z' ? [0, 0.07, offset] : [offset, 0.07, 0]}
          >
            <planeGeometry args={[0.3, 5]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} />
          </mesh>
        );
      })}
      {/* Edge lines */}
      {[-1, 1].map(side => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={dir === 'z' ? [side * (w / 2 - 0.4), 0.07, 0] : [0, 0.07, side * (d / 2 - 0.4)]}
        >
          <planeGeometry args={dir === 'z' ? [0.25, d] : [w, 0.25]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Streetlight ───────────────────────────────────────────────────────────────
function Streetlight({ position }: { position: [number,number,number] }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (ref.current) ref.current.intensity = 20 + Math.sin(s.clock.elapsedTime * 3) * 1;
  });
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 6, 6]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 6.1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#fffacc" emissive="#fffacc" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={ref} position={[0.6, 6, 0]} color="#fff5aa" intensity={20} distance={25} decay={2} />
    </group>
  );
}

// ── Fireflies ─────────────────────────────────────────────────────────────────
function Fireflies() {
  const data = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      pos: new THREE.Vector3(
        ((i * 137.5) % 300) - 150,
        1 + ((i * 73) % 8),
        ((i * 89.3) % 300) - 150
      ),
      phase: i * 0.8,
    }))
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const pulse = Math.sin(t * 2 + data.current[i].phase) * 0.5 + 0.5;
      (m.material as THREE.MeshBasicMaterial).opacity = pulse * 0.85;
      m.position.y = data.current[i].pos.y + Math.sin(t * 0.5 + data.current[i].phase) * 0.9;
    });
  });
  return (
    <>
      {data.current.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={d.pos.clone()}>
          <sphereGeometry args={[0.07, 4, 4]} />
          <meshBasicMaterial color="#aaff44" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
}

// ── Tree ring positions ───────────────────────────────────────────────────────
function buildTreePositions(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 220 + (i % 3) * 30 + (i * 7.3) % 20;
    out.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  for (let i = 0; i < 40; i++) {
    const x = ((i * 137.508) % 340) - 170;
    const z = ((i * 89.31) % 340) - 170;
    if (Math.sqrt(x * x + z * z) > 80) out.push([x, 0, z]);
  }
  return out;
}
const TREE_POSITIONS = buildTreePositions();

// ── Streetlight positions ─────────────────────────────────────────────────────
const LIGHT_POSITIONS: [number,number,number][] = [];
for (let i = -3; i <= 3; i++) {
  LIGHT_POSITIONS.push([i * 45 - 22, 0, 35]);
  LIGHT_POSITIONS.push([i * 45 - 22, 0, -215]);
  LIGHT_POSITIONS.push([185, 0, i * 45 - 90]);
  LIGHT_POSITIONS.push([-185, 0, i * 45 - 90]);
}

// ── WorldScene ────────────────────────────────────────────────────────────────
function WorldScene({ devs, flyMode, spawnPos }: any) {
  return (
    <>
      <Sky distance={450000} sunPosition={[-0.5, -0.08, -1]}
        inclination={0.48} azimuth={0.28} mieCoefficient={0.004} rayleigh={0.4} turbidity={9} />
      <Stars radius={350} depth={100} count={6000} factor={7} saturation={0.6} fade speed={0.15} />
      <Cloud position={[-80, 55, -180]} speed={0.1} opacity={0.22} color="#aabbff" scale={3} />
      <Cloud position={[120, 70, -250]} speed={0.08} opacity={0.18} color="#8899ee" scale={2.5} />
      <Moon />
      <Fireflies />

      <ambientLight intensity={0.4} color="#101828" />
      <directionalLight position={[-120, 90, -300]} intensity={0.9} color="#d0e4ff"
        castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-far={600} shadow-camera-left={-200} shadow-camera-right={200}
        shadow-camera-top={200} shadow-camera-bottom={-200} />
      <pointLight position={[0, 5, -80]} intensity={600} color="#ff5500" distance={350} decay={2} />
      <pointLight position={[120, 30, -180]} intensity={300} color="#3355ff" distance={400} decay={2} />
      <pointLight position={[-120, 30, -180]} intensity={300} color="#00ffcc" distance={400} decay={2} />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
        {/* Player — spawns near own building */}
        <Ecctrl
          animated={false}
          jumpVel={flyMode ? 0 : 8}
          maxVelLimit={flyMode ? 20 : 10}
          camInitDis={-8}
          camMinDis={-3}
          camMaxDis={-15}
          camInitDir={{ x: -0.15, y: 0 }}
          position={spawnPos}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e"
              emissiveIntensity={1.5} roughness={0.3} metalness={0.6} />
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
            position={[(i % 8) * 45 - 160, 0, Math.floor(i / 8) * 45 - 200]}
          />
        ))}

        {/* Ground base */}
        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 3000]} />
            <meshStandardMaterial color="#060a14" roughness={0.98} />
          </mesh>
        </RigidBody>
      </Physics>

      {/* Subtle grid */}
      <Grid position={[0, 0.02, 0]} args={[3000, 3000]}
        cellSize={10} cellThickness={0.2} cellColor="#080f20"
        sectionSize={50} sectionThickness={0.6} sectionColor="#0a1a3a"
        fadeDistance={350} fadeStrength={1.5} infiniteGrid />

      {/* ── GRASS TILES ── large rectangular green fields */}
      <GrassTile position={[80,  0.03,  70]}  w={70} d={60} />
      <GrassTile position={[-95, 0.03,  95]}  w={55} d={50} />
      <GrassTile position={[155, 0.03, -70]}  w={80} d={65} />
      <GrassTile position={[-145,0.03, -55]}  w={65} d={55} />
      <GrassTile position={[20,  0.03, 170]}  w={100} d={80} />
      <GrassTile position={[-25, 0.03, -190]} w={90} d={70} />
      <GrassTile position={[0,   0.03, 280]}  w={180} d={100} />
      <GrassTile position={[-200,0.03,  0]}   w={60}  d={120} />
      <GrassTile position={[200, 0.03,  0]}   w={60}  d={120} />

      {/* ── ROADS ── main arteries through city */}
      {/* Main N-S spine */}
      <Road position={[0, 0, -90]}   w={12} d={400} dir="z" />
      {/* Main E-W */}
      <Road position={[0, 0, -90]}   w={400} d={12} dir="x" />
      {/* Secondary N-S */}
      <Road position={[-90, 0, -90]} w={8} d={350} dir="z" />
      <Road position={[90,  0, -90]} w={8} d={350} dir="z" />
      {/* Secondary E-W */}
      <Road position={[0, 0, -180]}  w={350} d={8} dir="x" />
      <Road position={[0, 0,   30]}  w={350} d={8} dir="x" />
      {/* Perimeter ring road */}
      <Road position={[0, 0, -200]}  w={400} d={10} dir="x" />
      <Road position={[0, 0,   60]}  w={400} d={10} dir="x" />
      <Road position={[-180,0, -80]} w={10} d={320} dir="z" />
      <Road position={[180, 0, -80]} w={10} d={320} dir="z" />

      {/* ── WATER ── */}
      <WaterBody position={[110, 0, 110]}  sx={28} sz={18} />
      <WaterBody position={[-130,0, 130]}  sx={22} sz={15} />
      <WaterBody position={[0,   0, 200]}  sx={40} sz={25} />
      <WaterBody position={[-160,0,-140]}  sx={20} sz={14} />

      {/* ── STREETLIGHTS ── */}
      {LIGHT_POSITIONS.map((p, i) => <Streetlight key={i} position={p} />)}

      {/* ── TREES ── */}
      {TREE_POSITIONS.map((pos, i) => <Tree key={i} position={pos} />)}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const { progress } = useProgress();
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const room = useRef<any>(null);

  // Find this user's building index → compute spawn position next to it
  const spawnPos = useMemo((): [number, number, number] => {
    if (!devs || !username) return [0, 4, 60];
    const idx = devs.findIndex((d: any) =>
      d.username?.toLowerCase() === username.toLowerCase()
    );
    if (idx === -1) return [0, 4, 60];
    const bx = (idx % 8) * 45 - 160;
    const bz = Math.floor(idx / 8) * 45 - 200;
    return [bx + 12, 4, bz + 12]; // slightly offset from building corner
  }, [devs, username]);

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
    // CRITICAL: use vh units AND min-height to fight mobile browser chrome
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh',
      background: '#050818', overflow: 'hidden',
      // Force GPU compositing layer — prevents half-black on mobile
      transform: 'translateZ(0)', willChange: 'transform',
    }}>
      {!isDataReady && <LoadingScreen progress={progress || 10} />}

      {isDataReady && (
        <>
          <ErrorBoundary>
            <Canvas
              shadows
              gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
              camera={{ fov: 65, position: [0, 8, 80], near: 0.1, far: 2000 }}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%', display: 'block',
                touchAction: 'none', // prevents scroll hijacking on mobile
              }}
            >
              <Suspense fallback={null}>
                <WorldScene devs={devs} flyMode={flyMode} spawnPos={spawnPos} />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <HUD username={username} playersCount={Object.keys(players).length + 1}
            flyMode={flyMode} setFlyMode={setFlyMode} />
          <Chat username={username} />

          {/* Joystick — normal size, bottom-left, no scale trick */}
          {isTouch && (
            <div style={{
              position: 'fixed', bottom: '80px', left: '20px',
              zIndex: 40, pointerEvents: 'auto',
            }}>
              <EcctrlJoystick />
            </div>
          )}
        </>
      )}
    </div>
  );
}
