"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Stars, useProgress, Grid, Text } from "@react-three/drei";
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
import { useFrame, useThree } from "@react-three/fiber";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const THEMES = {
  sunset:   { sky: "#130600", horizon: "#aa2800", fog: "#130600", fogDensity: 0.0016, ambient: "#251005", ground: "#0c0500", grid: "#220c00", gridSection: "#331200", sunColor: "#ff7722", sunPos: [-300,55,-450] as [number,number,number] },
  midnight: { sky: "#020818", horizon: "#0a2a40", fog: "#020c1a", fogDensity: 0.0020, ambient: "#0d2040", ground: "#04111e", grid: "#0a2035", gridSection: "#0e3060", sunColor: "#b0d4ff", sunPos: [180,110,-350] as [number,number,number] },
  neon:     { sky: "#060012", horizon: "#330060", fog: "#060012", fogDensity: 0.0018, ambient: "#180030", ground: "#060010", grid: "#150035", gridSection: "#220055", sunColor: "#cc44ff", sunPos: [0,80,-300] as [number,number,number] },
  emerald:  { sky: "#001408", horizon: "#003820", fog: "#001408", fogDensity: 0.0018, ambient: "#002210", ground: "#000e06", grid: "#001e10", gridSection: "#002e18", sunColor: "#44ffaa", sunPos: [100,80,-300] as [number,number,number] },
};
export type ThemeName = keyof typeof THEMES;

function SceneFog({ theme }: { theme: ThemeName }) {
  const { scene } = useThree();
  const t = THEMES[theme];
  useEffect(() => {
    scene.fog = new THREE.FogExp2(t.fog, t.fogDensity);
    scene.background = new THREE.Color(t.sky);
    return () => { scene.fog = null; };
  }, [scene, theme]);
  return null;
}

function ThemeSky({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[790, 32, 32]} />
        <meshBasicMaterial color={t.sky} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <ringGeometry args={[200, 700, 64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.5, 0]}>
        <ringGeometry args={[60, 200, 64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function CelestialBody({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const isSunset = theme === 'sunset';
  const size = isSunset ? 20 : 10;
  return (
    <group position={t.sunPos}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={t.sunColor} emissive={t.sunColor} emissiveIntensity={isSunset ? 1.0 : 0.7} roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 1.6, 16, 16]} />
        <meshBasicMaterial color={t.sunColor} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <pointLight color={t.sunColor} intensity={isSunset ? 800 : 600} distance={2000} decay={2} />
    </group>
  );
}

function Tree({ position, s = 1 }: { position: [number, number, number], s?: number }) {
  const seed = position[0] * 13.7 + position[2] * 7.3;
  const th = (1.2 + Math.abs(Math.sin(seed)) * 0.6) * s;
  const cr = (0.8 + Math.abs(Math.cos(seed)) * 0.6) * s;
  const hues = [145, 155, 130, 165];
  const hue = hues[Math.abs(Math.floor(seed * 3.7)) % 4];
  const g = `hsl(${hue},48%,15%)`;
  return (
    <group position={position}>
      <mesh position={[0, th / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.18, th, 6]} />
        <meshStandardMaterial color="#180c05" roughness={1} />
      </mesh>
      <mesh position={[0, th + cr * 0.5, 0]}>
        <coneGeometry args={[cr, cr * 1.6, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} emissive={g} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, th + cr * 1.1, 0]}>
        <coneGeometry args={[cr * 0.65, cr * 1.2, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} emissive={g} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, th + cr * 1.65, 0]}>
        <coneGeometry args={[cr * 0.35, cr * 0.8, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} emissive={g} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

// Roads — no JSX variable trick, inline materials only
function Roads() {
  return (
    <group position={[0, 0.018, 0]}>
      {/* Vertical avenues */}
      {([-75, -15, 45] as number[]).map(x => (
        <mesh key={`v${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
          <planeGeometry args={[9, 800]} />
          <meshStandardMaterial color="#080808" roughness={0.98} />
        </mesh>
      ))}
      {/* Horizontal streets */}
      {([-110, -50, 10, 70, 130] as number[]).map(z => (
        <mesh key={`h${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <planeGeometry args={[800, 9]} />
          <meshStandardMaterial color="#080808" roughness={0.98} />
        </mesh>
      ))}
      {/* Center line dashes — vertical */}
      {([-75, -15, 45] as number[]).map(x =>
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(seg => (
          <mesh key={`vd${x}${seg}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, seg * 60]}>
            <planeGeometry args={[0.25, 30]} />
            <meshBasicMaterial color="#2a2a2a" />
          </mesh>
        ))
      )}
    </group>
  );
}

// Street lamps — simplified, no JSX mat variable
function StreetLamps() {
  const spots: [number, number, number][] = [];
  const roadXs = [-75, -15, 45];
  roadXs.forEach(x => {
    for (let z = -180; z <= 180; z += 35) {
      spots.push([x + 6, 0, z]);
    }
  });
  return (
    <group>
      {spots.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Pole */}
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 7, 5]} />
            <meshStandardMaterial color="#151515" roughness={0.9} />
          </mesh>
          {/* Lamp head */}
          <mesh position={[0, 7.2, 0]}>
            <sphereGeometry args={[0.28, 8, 8]} />
            <meshStandardMaterial color="#ffdd66" emissive="#ffdd66" emissiveIntensity={4} />
          </mesh>
          <pointLight position={[0, 7, 0]} color="#ffcc44" intensity={18} distance={28} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Background silhouette skyline — fixed positioning
function BackgroundSkyline({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const buildings = useMemo(() => {
    const result = [];
    for (let i = 0; i < 55; i++) {
      const x = ((i * 53.7) % 700) - 350;
      const zRow = Math.floor(i / 14);
      const z = -300 - zRow * 50;
      const h = 25 + (i * 19.3 % 55);
      const w = 9 + (i * 7.1 % 12);
      result.push({ x, z, h, w, key: i });
    }
    return result;
  }, []);

  return (
    <group>
      {buildings.map(b => (
        <mesh key={b.key} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.w * 0.7]} />
          <meshStandardMaterial
            color="#040608"
            emissive={t.horizon}
            emissiveIntensity={0.06}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

const PARK_TREES = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const r = 190 + (i % 5) * 12 + (i * 3.3) % 10;
    out.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  // Clusters between building blocks
  [[90, 30], [-95, 30], [90, -60], [-95, -60], [0, 140], [-20, -140]].forEach(([bx, bz], pi) => {
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      const r = 9 + (j * 2.9) % 7;
      out.push([bx + Math.cos(a) * r, 0, bz + Math.sin(a) * r]);
    }
  });
  return out;
})();

// City layout: block grid with road gaps matching road positions
function buildCityLayout(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  // Two columns of blocks: left block (-95 to -20), right block (20 to 95 approx)
  // Roads at x=-75,-15,45 and z=-110,-50,10,70,130
  const blockCols = [-95, -45, 5, 55];
  const blockRows = [-145, -85, -25, 35, 95];
  for (let i = 0; i < count; i++) {
    const col = i % blockCols.length;
    const row = Math.floor(i / blockCols.length);
    if (row >= blockRows.length) break;
    const jx = ((i * 6.3) % 10) - 5;
    const jz = ((i * 9.7) % 10) - 5;
    positions.push([blockCols[col] + jx, 0, blockRows[row] + jz]);
  }
  return positions;
}

function WorldScene({ devs, flyMode, theme }: { devs: any[], flyMode: boolean, theme: ThemeName }) {
  const t = THEMES[theme];
  const cityLayout = useMemo(() => devs ? buildCityLayout(devs.length) : [], [devs]);

  return (
    <>
      <SceneFog theme={theme} />
      <ThemeSky theme={theme} />

      <Stars
        radius={400} depth={60}
        count={theme === 'sunset' ? 1200 : 5500}
        factor={5} saturation={0.5} fade speed={0.1}
      />

      <CelestialBody theme={theme} />
      <BackgroundSkyline theme={theme} />

      {/* Lighting — all high up, nothing at ground */}
      <ambientLight intensity={0.5} color={t.ambient} />
      <directionalLight
        position={t.sunPos}
        intensity={theme === 'sunset' ? 1.8 : 1.4}
        color={t.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={700}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
      />
      {/* Elevated fill lights only — no ground blobs */}
      <pointLight position={[0, 100, -100]} color={t.sunColor} intensity={250} distance={700} decay={2} />
      <pointLight position={[150, 70, -100]} color="#2244ee" intensity={180} distance={500} decay={2} />
      <pointLight position={[-150, 70, -100]} color="#00ccbb" intensity={180} distance={500} decay={2} />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
        <Ecctrl
          animated={false}
          jumpVel={flyMode ? 0 : 8}
          maxVelLimit={flyMode ? 25 : 10}
          camInitDis={-10}
          camMinDis={-4}
          camMaxDis={-22}
          camInitDir={{ x: -0.18, y: 0 }}
          position={[0, 5, 120]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.28, 0.65, 8, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Small shadow ring — not huge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}>
            <ringGeometry args={[0.3, 0.52, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.5} />
          </mesh>
        </Ecctrl>

        {devs?.map((dev: any, i: number) => (
          <DevBuilding
            key={dev.username || i}
            dev={dev}
            position={cityLayout[i] || [(i - devs.length / 2) * 20, 0, 0]}
            theme={theme}
          />
        ))}

        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 3000]} />
            <meshStandardMaterial color={t.ground} roughness={0.97} metalness={0.04} />
          </mesh>
        </RigidBody>
      </Physics>

      <Roads />
      <StreetLamps />

      <Grid
        position={[0, 0.022, 0]}
        args={[3000, 3000]}
        cellSize={10} cellThickness={0.3} cellColor={t.grid}
        sectionSize={60} sectionThickness={0.7} sectionColor={t.gridSection}
        fadeDistance={550} fadeStrength={1.1} infiniteGrid
      />

      {PARK_TREES.map((pos, i) => (
        <Tree key={i} position={pos} s={0.75} />
      ))}
    </>
  );
}

function ActivityFeed({ devs }: { devs: any[] }) {
  const items = devs?.slice(0, 30).map(d =>
    `⬡ ${d.username}  ★ ${d.contributions} commits  ◎ ${d.repos} repos`
  ) || [];
  const doubled = [...items, ...items];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 26, background: 'rgba(0,0,0,0.88)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', gap: 80, whiteSpace: 'nowrap',
        animation: 'ticker 60s linear infinite',
        fontSize: 9, color: '#22c55e', fontFamily: 'monospace', letterSpacing: 1.5,
      }}>
        {doubled.map((item, i) => <span key={i}>{item}</span>)}
      </div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const { progress } = useProgress();
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('sunset');
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
    <div style={{ position: 'fixed', inset: 0, background: '#080400', overflow: 'hidden' }}>
      {!isDataReady && <LoadingScreen progress={progress || 10} />}
      {isDataReady && (
        <>
          <ErrorBoundary>
            <Canvas
              shadows
              gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35 }}
              camera={{ fov: 60, position: [0, 14, 125], near: 0.1, far: 2000 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Suspense fallback={null}>
                <WorldScene devs={devs} flyMode={flyMode} theme={theme} />
              </Suspense>
            </Canvas>
          </ErrorBoundary>

          <HUD
            username={username}
            playersCount={Object.keys(players).length + 1}
            flyMode={flyMode} setFlyMode={setFlyMode}
            devs={devs} theme={theme} setTheme={setTheme}
          />
          <Chat username={username} />
          <ActivityFeed devs={devs} />

          {isTouch && (
            <div style={{
              position: 'fixed', bottom: '34px', left: '8px', zIndex: 40,
              transform: 'scale(0.55)', transformOrigin: 'bottom left',
              opacity: 0.8, pointerEvents: 'auto',
            }}>
              <EcctrlJoystick />
            </div>
          )}
        </>
      )}
    </div>
  );
}
