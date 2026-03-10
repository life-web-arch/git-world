"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
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
  sunset:   { sky: "#1a0800", horizon: "#cc3300", fog: "#1a0800", fogNear: 80, fogFar: 900, ambient: "#301008", ground: "#110400", grid: "#2a0e00", gridSection: "#401800", sunColor: "#ff6622", sunPos: [-300,55,-450] as [number,number,number] },
  midnight: { sky: "#020818", horizon: "#0a2a40", fog: "#020c1a", fogNear: 80, fogFar: 900, ambient: "#0d2040", ground: "#04111e", grid: "#0a2035", gridSection: "#0e3060", sunColor: "#b0d4ff", sunPos: [180,110,-350] as [number,number,number] },
  neon:     { sky: "#060012", horizon: "#330060", fog: "#060012", fogNear: 80, fogFar: 900, ambient: "#180030", ground: "#060010", grid: "#150035", gridSection: "#220055", sunColor: "#cc44ff", sunPos: [0,80,-300] as [number,number,number] },
  emerald:  { sky: "#001408", horizon: "#003820", fog: "#001408", fogNear: 80, fogFar: 900, ambient: "#002210", ground: "#000e06", grid: "#001e10", gridSection: "#002e18", sunColor: "#44ffaa", sunPos: [100,80,-300] as [number,number,number] },
};
export type ThemeName = keyof typeof THEMES;

function SceneFog({ theme }: { theme: ThemeName }) {
  const { scene } = useThree();
  const t = THEMES[theme];
  useEffect(() => {
    scene.fog = new THREE.Fog(t.fog, t.fogNear, t.fogFar);
    scene.background = new THREE.Color(t.sky);
    return () => { scene.fog = null; };
  }, [scene, theme]);
  return null;
}

function ThemeSky({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[850, 32, 16]} />
        <meshBasicMaterial color={t.sky} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]} renderOrder={-1}>
        <ringGeometry args={[220, 780, 64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

function CelestialBody({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const isSunset = theme === 'sunset';
  const size = isSunset ? 18 : 9;
  return (
    <group position={t.sunPos}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={t.sunColor} emissive={t.sunColor} emissiveIntensity={isSunset ? 1.0 : 0.7} roughness={1} />
      </mesh>
      <pointLight color={t.sunColor} intensity={isSunset ? 700 : 500} distance={2000} decay={2} />
    </group>
  );
}

function Tree({ position, s = 1 }: { position: [number, number, number], s?: number }) {
  const seed = position[0] * 13.7 + position[2] * 7.3;
  const th = (1.2 + Math.abs(Math.sin(seed)) * 0.6) * s;
  const cr = (0.8 + Math.abs(Math.cos(seed)) * 0.6) * s;
  const hues = [145, 155, 130, 165];
  const hue = hues[Math.abs(Math.floor(seed * 3.7)) % 4];
  const g = `hsl(${hue},48%,14%)`;
  return (
    <group position={position}>
      <mesh position={[0, th / 2, 0]}>
        <cylinderGeometry args={[0.10, 0.16, th, 6]} />
        <meshStandardMaterial color="#160b04" roughness={1} />
      </mesh>
      <mesh position={[0, th + cr * 0.5, 0]}>
        <coneGeometry args={[cr, cr * 1.6, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} emissive={g} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0, th + cr * 1.1, 0]}>
        <coneGeometry args={[cr * 0.65, cr * 1.2, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} />
      </mesh>
      <mesh position={[0, th + cr * 1.65, 0]}>
        <coneGeometry args={[cr * 0.35, cr * 0.8, 7]} />
        <meshStandardMaterial color={g} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Roads() {
  return (
    <group position={[0, 0.015, 0]}>
      {([-75, -15, 45] as number[]).map(x => (
        <mesh key={`v${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]}>
          <planeGeometry args={[9, 800]} />
          <meshStandardMaterial color="#070707" roughness={0.98} />
        </mesh>
      ))}
      {([-110, -50, 10, 70, 130] as number[]).map(z => (
        <mesh key={`h${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <planeGeometry args={[800, 9]} />
          <meshStandardMaterial color="#070707" roughness={0.98} />
        </mesh>
      ))}
    </group>
  );
}

function StreetLamps() {
  const spots: [number, number, number][] = [];
  [-75, -15, 45].forEach(x => {
    for (let z = -180; z <= 180; z += 35) spots.push([x + 6, 0, z]);
  });
  return (
    <group>
      {spots.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 7, 5]} />
            <meshStandardMaterial color="#151515" roughness={0.9} />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <sphereGeometry args={[0.28, 8, 8]} />
            <meshStandardMaterial color="#ffdd66" emissive="#ffdd66" emissiveIntensity={4} />
          </mesh>
          <pointLight position={[0, 7, 0]} color="#ffcc44" intensity={16} distance={26} decay={2} />
        </group>
      ))}
    </group>
  );
}

function BackgroundSkyline({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const buildings = useMemo(() => {
    const result = [];
    for (let i = 0; i < 55; i++) {
      const x = ((i * 53.7) % 700) - 350;
      const z = -300 - Math.floor(i / 14) * 50;
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
          <meshStandardMaterial color="#040608" emissive={t.horizon} emissiveIntensity={0.05} roughness={0.15} metalness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

const PARK_TREES = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 185 + (i % 5) * 10;
    out.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }
  return out;
})();

function buildCityLayout(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
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

// Dedicated fly camera — no physics involved at all
function FlyController({ active }: { active: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; e.preventDefault(); };
    const up   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, [active]);

  useFrame((_, delta) => {
    if (!active) return;
    const k = keys.current;
    const speed = (k['ShiftLeft'] || k['ShiftRight']) ? 40 : 20;
    const d = speed * Math.min(delta, 0.05);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    const right = new THREE.Vector3().crossVectors(flat, new THREE.Vector3(0, 1, 0)).normalize();

    if (k['KeyW'] || k['ArrowUp'])    camera.position.addScaledVector(flat, d);
    if (k['KeyS'] || k['ArrowDown'])  camera.position.addScaledVector(flat, -d);
    if (k['KeyA'] || k['ArrowLeft'])  camera.position.addScaledVector(right, -d);
    if (k['KeyD'] || k['ArrowRight']) camera.position.addScaledVector(right, d);
    if (k['Space'])                   camera.position.y += d;
    if (k['KeyQ'])                    camera.position.y -= d;
  });

  return null;
}

// Ground — uses CuboidCollider directly, NOT planeGeometry collider
// This is the most reliable ground in Rapier
function Ground({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
      {/* The actual physics collider — 1500 wide, 10 tall, centered at y=-5 so top surface = y=0 */}
      <CuboidCollider args={[1500, 5, 1500]} position={[0, -5, 0]} />
      {/* Visual ground plane sits at y=0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color={t.ground} roughness={0.97} metalness={0.04} />
      </mesh>
    </RigidBody>
  );
}

function WorldScene({ devs, flyMode, theme }: { devs: any[], flyMode: boolean, theme: ThemeName }) {
  const t = THEMES[theme];
  const cityLayout = useMemo(() => devs ? buildCityLayout(devs.length) : [], [devs]);

  return (
    <>
      <SceneFog theme={theme} />
      <ThemeSky theme={theme} />
      <Stars radius={380} depth={55} count={theme === 'sunset' ? 1000 : 4500} factor={4.5} saturation={0.5} fade speed={0.08} />
      <CelestialBody theme={theme} />
      <BackgroundSkyline theme={theme} />

      <ambientLight intensity={0.55} color={t.ambient} />
      <directionalLight
        position={t.sunPos}
        intensity={theme === 'sunset' ? 1.6 : 1.3}
        color={t.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={600}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
      />
      <pointLight position={[0, 100, -100]} color={t.sunColor} intensity={220} distance={650} decay={2} />
      <pointLight position={[150, 70, -100]} color="#2244ee" intensity={160} distance={450} decay={2} />
      <pointLight position={[-150, 70, -100]} color="#00ccbb" intensity={160} distance={450} decay={2} />

      {/* Physics world — gravity only applies in walk mode */}
      <Physics
        gravity={[0, flyMode ? 0 : -25, 0]}
        timeStep="vary"
      >
        <Ground theme={theme} />

        {/* Only render Ecctrl in walk mode — spawn HIGH so ground is ready */}
        {!flyMode && (
          <Ecctrl
            animated={false}
            jumpVel={8}
            maxVelLimit={11}
            camInitDis={-9}
            camMinDis={-3}
            camMaxDis={-20}
            camInitDir={{ x: -0.12, y: 0 }}
            position={[0, 8, 115]}
            capsuleHalfHeight={0.4}
            capsuleRadius={0.22}
            floatHeight={0.15}
            autoBalance={true}
            autoBalanceSpringK={0.3}
            autoBalanceDampingC={0.03}
            autoBalanceSpringOnY={0.5}
          >
            <mesh castShadow>
              <capsuleGeometry args={[0.22, 0.44, 6, 12]} />
              <meshStandardMaterial
                color="#22c55e"
                emissive="#22c55e"
                emissiveIntensity={1.8}
                roughness={0.2}
                metalness={0.5}
              />
            </mesh>
          </Ecctrl>
        )}

        {devs?.map((dev: any, i: number) => (
          <DevBuilding
            key={dev.username || i}
            dev={dev}
            position={cityLayout[i] || [(i - devs.length / 2) * 20, 0, 0]}
            theme={theme}
          />
        ))}
      </Physics>

      <FlyController active={flyMode} />

      <Roads />
      <StreetLamps />

      <Grid
        position={[0, 0.02, 0]}
        args={[3000, 3000]}
        cellSize={10} cellThickness={0.3} cellColor={t.grid}
        sectionSize={60} sectionThickness={0.7} sectionColor={t.gridSection}
        fadeDistance={500} fadeStrength={1.0} infiniteGrid
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
  const [physicsReady, setPhysicsReady] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    // Give physics engine 800ms to fully initialize ground before spawning character
    const t = setTimeout(() => setPhysicsReady(true), 800);
    if (typeof window !== 'undefined') {
      try {
        room.current = supabase.channel('presence')
          .on('broadcast', { event: 'move' }, ({ payload }: any) => {
            if (payload?.username) setPlayers(p => ({ ...p, [payload.username]: payload }));
          }).subscribe();
      } catch (e) { console.error(e); }
    }
    return () => { room.current?.unsubscribe(); clearTimeout(t); };
  }, []);

  const isDataReady = mounted && devs && Array.isArray(devs) && physicsReady;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#100400', overflow: 'hidden' }}>
      {!isDataReady && <LoadingScreen progress={physicsReady ? (progress || 10) : Math.min(progress || 0, 85)} />}

      {/* Canvas always mounted so physics can warm up */}
      <ErrorBoundary>
        <Canvas
          shadows
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.25,
            powerPreference: "high-performance",
          }}
          camera={{ fov: 65, position: [0, 12, 120], near: 0.15, far: 1800 }}
          style={{ position: 'absolute', inset: 0, opacity: isDataReady ? 1 : 0 }}
          onCreated={({ gl }) => { gl.setClearColor(new THREE.Color('#1a0800')); }}
        >
          <Suspense fallback={null}>
            {mounted && devs && Array.isArray(devs) && (
              <WorldScene devs={devs} flyMode={flyMode} theme={theme} />
            )}
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {isDataReady && (
        <>
          <HUD
            username={username}
            playersCount={Object.keys(players).length + 1}
            flyMode={flyMode} setFlyMode={setFlyMode}
            devs={devs} theme={theme} setTheme={setTheme}
          />
          <Chat username={username} />
          <ActivityFeed devs={devs} />

          {isTouch && !flyMode && (
            <div style={{
              position: 'fixed', bottom: '34px', left: '8px', zIndex: 40,
              transform: 'scale(0.52)', transformOrigin: 'bottom left',
              opacity: 0.85, pointerEvents: 'auto',
            }}>
              <EcctrlJoystick />
            </div>
          )}

          {flyMode && (
            <div style={{
              position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)',
              pointerEvents: 'none', zIndex: 45,
              fontFamily: 'monospace', fontSize: 9, color: 'rgba(59,130,246,0.8)',
              letterSpacing: 2, background: 'rgba(0,0,0,0.5)',
              padding: '6px 14px', borderRadius: 8,
            }}>
              {isTouch ? 'USE JOYSTICK TO MOVE · PINCH TO CHANGE HEIGHT' : 'WASD · SPACE=UP · Q=DOWN · SHIFT=BOOST'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
