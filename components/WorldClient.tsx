"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Stars, useProgress, Grid } from "@react-three/drei";
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
import { useMemo } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const THEMES = {
  sunset:   { sky: "#160800", horizon: "#cc3300", fog: "#1a0800", fogDensity: 0.0018, ambient: "#2a1005", ground: "#0e0600", grid: "#2a0e00", gridSection: "#3d1500", sunColor: "#ff6600", sunPos: [-300,60,-500] as [number,number,number] },
  midnight: { sky: "#020818", horizon: "#0a2a40", fog: "#020c1a", fogDensity: 0.0022, ambient: "#0d2040", ground: "#04111e", grid: "#0a2035", gridSection: "#0e3060", sunColor: "#b0d4ff", sunPos: [180,110,-350] as [number,number,number] },
  neon:     { sky: "#060012", horizon: "#330060", fog: "#080018", fogDensity: 0.002,  ambient: "#180030", ground: "#080014", grid: "#1a0040", gridSection: "#280060", sunColor: "#aa44ff", sunPos: [0,80,-300] as [number,number,number] },
  emerald:  { sky: "#001408", horizon: "#003820", fog: "#001408", fogDensity: 0.002,  ambient: "#002210", ground: "#000e06", grid: "#002218", gridSection: "#003020", sunColor: "#44ffaa", sunPos: [100,80,-300] as [number,number,number] },
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

function Sky({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <>
      <mesh scale={[-1,1,1]}>
        <sphereGeometry args={[790,32,32]} />
        <meshBasicMaterial color={t.sky} side={THREE.BackSide} />
      </mesh>
      {/* Horizon band */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,2,0]}>
        <ringGeometry args={[250,700,64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,1.5,0]}>
        <ringGeometry args={[80,250,64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function CelestialBody({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const isSunset = theme === 'sunset';
  const size = isSunset ? 22 : 10;
  return (
    <group position={t.sunPos}>
      <mesh>
        <sphereGeometry args={[size,32,32]} />
        <meshStandardMaterial color={t.sunColor} emissive={t.sunColor} emissiveIntensity={isSunset ? 1.2 : 0.8} roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size*1.5,16,16]} />
        <meshBasicMaterial color={t.sunColor} transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
      <pointLight color={t.sunColor} intensity={isSunset ? 1000 : 700} distance={2000} decay={2} />
    </group>
  );
}

// Properly scaled trees — SMALL, like city park trees
function Tree({ position, scale = 1 }: { position: [number,number,number], scale?: number }) {
  const seed = position[0] * 13.7 + position[2] * 7.3;
  const trunkH = (1.5 + (Math.abs(Math.sin(seed)) * 0.8)) * scale;
  const canopyR = (1.0 + (Math.abs(Math.cos(seed)) * 0.8)) * scale;
  const hues = [145,155,130,165];
  const hue = hues[Math.abs(Math.floor(seed*3.7)) % hues.length];
  const green = `hsl(${hue}, 50%, 16%)`;
  return (
    <group position={position}>
      <mesh position={[0,trunkH/2,0]} castShadow>
        <cylinderGeometry args={[0.15,0.2,trunkH,6]} />
        <meshStandardMaterial color="#1a0c06" roughness={1} />
      </mesh>
      <mesh position={[0,trunkH+canopyR*0.5,0]} castShadow>
        <coneGeometry args={[canopyR,canopyR*1.6,7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0,trunkH+canopyR*1.15,0]} castShadow>
        <coneGeometry args={[canopyR*0.65,canopyR*1.2,7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0,trunkH+canopyR*1.7,0]} castShadow>
        <coneGeometry args={[canopyR*0.35,canopyR*0.8,7]} />
        <meshStandardMaterial color={green} roughness={0.85} emissive={green} emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

// Road network
function Roads() {
  const mat = <meshStandardMaterial color="#0a0a0a" roughness={0.95} />;
  return (
    <group position={[0, 0.02, 0]}>
      {/* Main avenues */}
      {[-60,0,60].map(x => (
        <mesh key={`v${x}`} rotation={[-Math.PI/2,0,0]} position={[x,0,0]}>
          <planeGeometry args={[8,600]} />
          {mat}
        </mesh>
      ))}
      {[-120,-60,0,60,120].map(z => (
        <mesh key={`h${z}`} rotation={[-Math.PI/2,0,0]} position={[0,0,z]}>
          <planeGeometry args={[600,8]} />
          {mat}
        </mesh>
      ))}
      {/* Road lines */}
      {[-60,0,60].map(x =>
        [-2,-1,0,1,2].map(seg => (
          <mesh key={`vl${x}${seg}`} rotation={[-Math.PI/2,0,0]} position={[x,0.01,seg*100]}>
            <planeGeometry args={[0.3,40]} />
            <meshBasicMaterial color="#333" />
          </mesh>
        ))
      )}
    </group>
  );
}

// Background skyline silhouette — fake distant buildings for depth
function BackgroundSkyline({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const buildings = useMemo(() => {
    const result = [];
    for (let i = 0; i < 60; i++) {
      const x = (i * 47.3 % 600) - 300;
      const z = -280 - (i % 4) * 40;
      const h = 20 + (i * 17.7 % 60);
      const w = 8 + (i * 7.3 % 14);
      result.push({ x, z, h, w });
    }
    return result;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h/2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.w*0.8]} />
          <meshStandardMaterial
            color="#050810"
            emissive={t.horizon}
            emissiveIntensity={0.04}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// Dense park trees — small, surrounding city
const PARK_TREES = (() => {
  const out: [number,number,number][] = [];
  // Outer perimeter belt
  for (let i = 0; i < 120; i++) {
    const angle = (i/120)*Math.PI*2;
    const r = 180 + (i%5)*15 + (i*3.7)%12;
    out.push([Math.cos(angle)*r, 0, Math.sin(angle)*r]);
  }
  // Park clusters between buildings
  const parkSpots = [[80,0,60],[-80,0,60],[120,0,-40],[-120,0,-40],[0,0,120]];
  parkSpots.forEach(([x,,z], pi) => {
    for (let j=0; j<8; j++) {
      const a = (j/8)*Math.PI*2;
      const r = 10 + (j*3.1)%8;
      out.push([x+Math.cos(a)*r, 0, z+Math.sin(a)*r]);
    }
  });
  return out;
})();

function CityLights({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  // Street lamps along roads
  const lamps: [number,number,number][] = [];
  [-60,0,60].forEach(x => {
    for (let z=-150; z<=150; z+=30) lamps.push([x+5, 0, z]);
  });
  return (
    <group>
      {lamps.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 8, 6]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 8.2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[0, 8, 0]} color="#ffcc44" intensity={15} distance={25} decay={2} />
        </group>
      ))}
    </group>
  );
}

// Dense city grid — tight spacing
function buildCityLayout(count: number): [number,number,number][] {
  const positions: [number,number,number][] = [];
  // Block-based layout with road gaps
  const blockW = 22;
  const roadGap = 8;
  const blocksPerRow = 5;
  for (let i = 0; i < count; i++) {
    const col = i % blocksPerRow;
    const row = Math.floor(i / blocksPerRow);
    const blockX = col * (blockW + roadGap) - (blocksPerRow/2)*(blockW+roadGap);
    const blockZ = row * (blockW + roadGap) - 80;
    // Slight deterministic jitter within block
    const jx = ((i * 7.3) % 8) - 4;
    const jz = ((i * 11.7) % 8) - 4;
    positions.push([blockX + jx, 0, blockZ + jz]);
  }
  return positions;
}

// removed
  const ref = useRef<any>(undefined);
  const depsRef = useRef<any[]>([]);
  if (!ref.current || deps.some((d, i) => d !== depsRef.current[i])) {
    ref.current = fn();
    depsRef.current = deps;
  }
  return ref.current;
};

function WorldScene({ devs, flyMode, theme }: { devs: any[], flyMode: boolean, theme: ThemeName }) {
  const t = THEMES[theme];
  const cityLayout = devs ? buildCityLayout(devs.length) : [];

  return (
    <>
      <SceneFog theme={theme} />
      <Sky theme={theme} />
      <Stars
        radius={400} depth={60}
        count={theme === 'sunset' ? 1500 : 6000}
        factor={5} saturation={0.6} fade speed={0.1}
      />

      <CelestialBody theme={theme} />
      <BackgroundSkyline theme={theme} />
      <CityLights theme={theme} />

      {/* Lighting — NO red ground blob */}
      <ambientLight intensity={0.55} color={t.ambient} />
      <directionalLight
        position={t.sunPos}
        intensity={theme === 'sunset' ? 2.0 : 1.5}
        color={t.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={700}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
      />
      {/* City bounce lights — positioned HIGH, not at ground */}
      <pointLight position={[0, 80, -100]} color={t.sunColor} intensity={300} distance={600} decay={2} />
      <pointLight position={[120, 60, -80]} color="#2255ff" intensity={200} distance={400} decay={2} />
      <pointLight position={[-120, 60, -80]} color="#00ddbb" intensity={200} distance={400} decay={2} />

      <Physics gravity={[0, flyMode ? 0 : -20, 0]}>
        <Ecctrl
          animated={false}
          jumpVel={flyMode ? 0 : 8}
          maxVelLimit={flyMode ? 25 : 10}
          camInitDis={-10}
          camMinDis={-4}
          camMaxDis={-20}
          camInitDir={{ x: -0.2, y: 0 }}
          position={[0, 5, 110]}
        >
          <mesh castShadow>
            <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} roughness={0.2} metalness={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.7,0]}>
            <ringGeometry args={[0.32,0.6,16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.7} />
          </mesh>
        </Ecctrl>

        {devs?.map((dev: any, i: number) => (
          <DevBuilding
            key={dev.username || i}
            dev={dev}
            position={cityLayout[i] || [i*20, 0, 0]}
            theme={theme}
          />
        ))}

        <RigidBody type="fixed">
          <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
            <planeGeometry args={[3000,3000]} />
            <meshStandardMaterial color={t.ground} roughness={0.96} metalness={0.05} />
          </mesh>
        </RigidBody>
      </Physics>

      <Roads />

      <Grid
        position={[0, 0.025, 0]}
        args={[3000,3000]}
        cellSize={10} cellThickness={0.3} cellColor={t.grid}
        sectionSize={60} sectionThickness={0.8} sectionColor={t.gridSection}
        fadeDistance={600} fadeStrength={1.0} infiniteGrid
      />

      {PARK_TREES.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.8} />
      ))}
    </>
  );
}

function ActivityFeed({ devs }: { devs: any[] }) {
  const items = devs?.slice(0,30).map(d =>
    `⬡ ${d.username}  ★ ${d.contributions} commits  ◎ ${d.repos} repos`
  ) || [];
  const doubled = [...items, ...items];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 26, background: 'rgba(0,0,0,0.85)',
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
      <style>{`@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
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
    <div style={{ position: 'fixed', inset: 0, background: '#050204', overflow: 'hidden' }}>
      {!isDataReady && <LoadingScreen progress={progress || 10} />}
      {isDataReady && (
        <>
          <ErrorBoundary>
            <Canvas
              shadows
              gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
              camera={{ fov: 60, position: [0, 12, 120], near: 0.1, far: 2000 }}
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
