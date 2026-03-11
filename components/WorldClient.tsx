"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
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
import { useFrame, useThree, extend } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const THEMES = {
  sunset:   { sky: "#1a0a00", horizon: "#c0440a", fog: "#2a0f00", fogDensity: 0.0022, ambient: "#3a1a0a", ground: "#120800", grid: "#2a1000", gridSection: "#3a1800" },
  midnight: { sky: "#020818", horizon: "#0a2a40", fog: "#020c1a", fogDensity: 0.0028, ambient: "#0d2040", ground: "#04111e", grid: "#0a2035", gridSection: "#0e3060" },
  neon:     { sky: "#080012", horizon: "#2a0050", fog: "#0d0018", fogDensity: 0.0025, ambient: "#1a0030", ground: "#0a0018", grid: "#1a0040", gridSection: "#2a0060" },
  emerald:  { sky: "#001a0a", horizon: "#004020", fog: "#001a08", fogDensity: 0.0026, ambient: "#002a10", ground: "#001208", grid: "#002a14", gridSection: "#003a1c" },
};
export type ThemeName = keyof typeof THEMES;

// ── Pure Three.js fog/bg — no drei dependency ──
function SceneFog({ theme }: { theme: ThemeName }) {
  const { scene } = useThree();
  const t = THEMES[theme];
  useEffect(() => {
    scene.fog = new THREE.FogExp2(new THREE.Color(t.fog), t.fogDensity);
    scene.background = new THREE.Color(t.sky);
    return () => { scene.fog = null; scene.background = null; };
  }, [scene, theme]);
  return null;
}

// ── Manual star field — no drei Stars ──
function StarField({ count = 4000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 350 + Math.random() * 100;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    if (ref.current) {
      ref.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, [count]);

  return (
    <points ref={ref}>
      <bufferGeometry />
      <pointsMaterial color="#ffffff" size={0.7} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

// ── Manual grid — no drei Grid ──
function ManualGrid({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const helper = useRef<THREE.GridHelper | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    const grid = new THREE.GridHelper(3000, 300, new THREE.Color(t.gridSection), new THREE.Color(t.grid));
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.4;
    grid.position.y = 0.02;
    helper.current = grid;
    scene.add(grid);
    return () => { scene.remove(grid); grid.dispose(); };
  }, [scene, theme]);

  return null;
}

function SunsetSky({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[790, 32, 32]} />
        <meshBasicMaterial color={t.sky} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <ringGeometry args={[300, 800, 64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Moon({ theme }: { theme: ThemeName }) {
  if (theme === 'sunset') {
    return (
      <group position={[-200, 40, -400]}>
        <mesh>
          <sphereGeometry args={[18, 32, 32]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff5500" emissiveIntensity={1.5} roughness={1} />
        </mesh>
        <pointLight color="#ff6600" intensity={800} distance={1600} decay={2} />
      </group>
    );
  }
  return (
    <group position={[180, 110, -350]}>
      <mesh>
        <sphereGeometry args={[9, 32, 32]} />
        <meshStandardMaterial color="#e8f4ff" emissive="#c8e0ff" emissiveIntensity={0.8} roughness={0.9} />
      </mesh>
      <pointLight color="#b0d4ff" intensity={600} distance={1400} decay={2} />
    </group>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  const seed = position[0] * 13.7 + position[2] * 7.3;
  const trunkH = 2.5 + (Math.abs(Math.sin(seed)) * 1.5);
  const canopyR = 1.8 + (Math.abs(Math.cos(seed)) * 1.4);
  const hues = [145, 160, 130, 170, 120];
  const hue = hues[Math.abs(Math.floor(seed * 3.7)) % hues.length];
  const green = `hsl(${hue}, 50%, 15%)`;
  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.32, trunkH, 6]} />
        <meshStandardMaterial color="#1a0c06" roughness={1} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 0.5, 0]}>
        <coneGeometry args={[canopyR, canopyR * 1.5, 7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, trunkH + canopyR * 1.1, 0]}>
        <coneGeometry args={[canopyR * 0.68, canopyR * 1.2, 7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.12} />
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
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[1, 48]} />
        <meshStandardMaterial color="#041220" emissive="#0a4070" emissiveIntensity={0.45} roughness={0.02} metalness={0.98} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

function Fireflies() {
  const count = 20;
  const data = useRef(Array.from({ length: count }, (_, i) => ({
    pos: new THREE.Vector3((((i * 137.5) % 300) - 150), 1.2 + ((i * 73) % 9), (((i * 89.3) % 300) - 150)),
    phase: i * 0.8,
  })));
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
    <group>
      {data.current.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={d.pos}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshBasicMaterial color="#88ffaa" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function buildTreePositions(): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const r = 220 + (i % 3) * 30;
    positions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  return positions;
}
const TREE_POSITIONS = buildTreePositions();

function buildCityLayout(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const cols = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const offsetX = ((i * 7.3) % 8) - 4;
    const offsetZ = ((i * 11.7) % 8) - 4;
    const x = (col - cols / 2) * 22 + offsetX;
    const z = (row - cols / 2) * 22 + offsetZ - 60;
    positions.push([x, 0, z]);
  }
  return positions;
}

function WorldScene({ devs, flyMode, theme }: { devs: any[], flyMode: boolean, theme: ThemeName }) {
  const t = THEMES[theme];
  const cityLayout = devs ? buildCityLayout(devs.length) : [];

  return (
    <group>
      <SceneFog theme={theme} />
      <ManualGrid theme={theme} />
      <StarField count={theme === 'sunset' ? 2000 : 5000} />
      <SunsetSky theme={theme} />
      <Moon theme={theme} />
      <Fireflies />

      <ambientLight intensity={0.6} color={t.ambient} />
      <directionalLight
        position={theme === 'sunset' ? [-200, 40, -400] : [180, 110, -350]}
        intensity={theme === 'sunset' ? 1.8 : 1.4}
        color={theme === 'sunset' ? "#ff8844" : "#c0d8ff"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <pointLight position={[0, 3, -50]} intensity={700} color="#ff4400" distance={400} decay={2} />
      <pointLight position={[130, 25, -180]} intensity={400} color={theme === 'sunset' ? "#ff8800" : "#2255ff"} distance={450} decay={2} />
      <pointLight position={[-130, 25, -180]} intensity={400} color={theme === 'sunset' ? "#ffaa00" : "#00ddbb"} distance={450} decay={2} />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
        <Ecctrl
          animated={false}
          jumpVel={flyMode ? 0 : 8}
          maxVelLimit={flyMode ? 20 : 10}
          camInitDis={-8} camMinDis={-3} camMaxDis={-15}
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
            position={cityLayout[i] || [i * 20, 0, 0]}
            theme={theme}
          />
        ))}

        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 3000]} />
            <meshStandardMaterial color={t.ground} roughness={0.96} metalness={0.1} />
          </mesh>
        </RigidBody>
      </Physics>

      <WaterBody position={[110, 0, 110]} sx={28} sz={18} />
      <WaterBody position={[-130, 0, 130]} sx={22} sz={15} />

      {TREE_POSITIONS.map((pos, i) => <Tree key={i} position={pos} />)}
    </group>
  );
}

function ActivityFeed({ devs }: { devs: any[] }) {
  const items = devs?.slice(0, 20).map(d =>
    `⬡ ${d.username} · ${d.contributions} commits · ${d.repos} repos`
  ) || [];
  const doubled = [...items, ...items];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 28, background: 'rgba(0,0,0,0.7)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', gap: 60, whiteSpace: 'nowrap',
        animation: 'ticker 40s linear infinite',
        fontSize: 10, color: '#22c55e', fontFamily: 'monospace', letterSpacing: 1,
      }}>
        {doubled.map((item, i) => <span key={i}>{item}</span>)}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs, isLoading } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('sunset');
  const [sceneReady, setSceneReady] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    try {
      room.current = supabase.channel('presence')
        .on('broadcast', { event: 'move' }, ({ payload }: any) => {
          if (payload?.username) setPlayers(p => ({ ...p, [payload.username]: payload }));
        }).subscribe();
    } catch (e) { console.error(e); }
    return () => { room.current?.unsubscribe(); };
  }, []);

  const isDataReady = mounted && devs && !isLoading;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', background: '#020818', overflow: 'hidden' }}>
      {!isDataReady && (
        <LoadingScreen progress={isLoading ? 30 : 80} />
      )}

      {/* Canvas always mounts but scene only renders when data ready */}
      {mounted && (
        <ErrorBoundary>
          <Canvas
            shadows
            gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
            camera={{ fov: 65, position: [0, 8, 120], near: 0.1, far: 2000 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            onCreated={() => setSceneReady(true)}
          >
            <Suspense fallback={null}>
              {isDataReady && (
                <WorldScene devs={devs} flyMode={flyMode} theme={theme} />
              )}
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      )}

      {isDataReady && (
        <>
          <HUD
            username={username}
            playersCount={Object.keys(players).length + 1}
            flyMode={flyMode}
            setFlyMode={setFlyMode}
            devs={devs}
            theme={theme}
            setTheme={setTheme}
          />
          <Chat username={username} />
          <ActivityFeed devs={devs} />
          {isTouch && (
            <div style={{
              position: 'fixed', bottom: '36px', left: '8px', zIndex: 40,
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
