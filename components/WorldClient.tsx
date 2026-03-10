"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Stars, Grid, useProgress } from "@react-three/drei";
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
  sunset:   { sky: "#1a0800", horizon: "#cc3300", fogNear: 60, fogFar: 850, ambient: "#301008", ground: "#110400", grid: "#2a0e00", gridSection: "#401800", sunColor: "#ff6622", sunPos: [-300,55,-450] as [number,number,number] },
  midnight: { sky: "#020818", horizon: "#0a2a40", fogNear: 60, fogFar: 850, ambient: "#0d2040", ground: "#04111e", grid: "#0a2035", gridSection: "#0e3060", sunColor: "#b0d4ff", sunPos: [180,110,-350] as [number,number,number] },
  neon:     { sky: "#060012", horizon: "#330060", fogNear: 60, fogFar: 850, ambient: "#180030", ground: "#060010", grid: "#150035", gridSection: "#220055", sunColor: "#cc44ff", sunPos: [0,80,-300] as [number,number,number] },
  emerald:  { sky: "#001408", horizon: "#003820", fogNear: 60, fogFar: 850, ambient: "#002210", ground: "#000e06", grid: "#001e10", gridSection: "#002e18", sunColor: "#44ffaa", sunPos: [100,80,-300] as [number,number,number] },
};
export type ThemeName = keyof typeof THEMES;

const SPAWN: [number,number,number] = [0, 6, 115];

function SceneFog({ theme }: { theme: ThemeName }) {
  const { scene } = useThree();
  const t = THEMES[theme];
  useEffect(() => {
    scene.fog = new THREE.Fog(t.sky, t.fogNear, t.fogFar);
    scene.background = new THREE.Color(t.sky);
    return () => { scene.fog = null; };
  }, [scene, theme]);
  return null;
}

function ThemeSky({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <>
      <mesh renderOrder={-2}>
        <sphereGeometry args={[820, 32, 16]} />
        <meshBasicMaterial color={t.sky} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,4,0]} renderOrder={-1}>
        <ringGeometry args={[200,750,64]} />
        <meshBasicMaterial color={t.horizon} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

function CelestialBody({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const isSunset = theme === 'sunset';
  return (
    <group position={t.sunPos}>
      <mesh>
        <sphereGeometry args={[isSunset ? 18 : 9, 24, 24]} />
        <meshStandardMaterial color={t.sunColor} emissive={t.sunColor} emissiveIntensity={isSunset ? 1.0 : 0.7} roughness={1} />
      </mesh>
      <pointLight color={t.sunColor} intensity={isSunset ? 700 : 500} distance={2000} decay={2} />
    </group>
  );
}

function Tree({ position, s=1 }: { position:[number,number,number], s?:number }) {
  const seed = position[0]*13.7 + position[2]*7.3;
  const th = (1.2+Math.abs(Math.sin(seed))*0.6)*s;
  const cr = (0.8+Math.abs(Math.cos(seed))*0.6)*s;
  const hue = [145,155,130,165][Math.abs(Math.floor(seed*3.7))%4];
  const g = `hsl(${hue},48%,14%)`;
  return (
    <group position={position}>
      <mesh position={[0,th/2,0]}>
        <cylinderGeometry args={[0.10,0.16,th,6]}/>
        <meshStandardMaterial color="#160b04" roughness={1}/>
      </mesh>
      <mesh position={[0,th+cr*0.5,0]}>
        <coneGeometry args={[cr,cr*1.6,7]}/>
        <meshStandardMaterial color={g} roughness={0.85} emissive={g} emissiveIntensity={0.06}/>
      </mesh>
      <mesh position={[0,th+cr*1.1,0]}>
        <coneGeometry args={[cr*0.65,cr*1.2,7]}/>
        <meshStandardMaterial color={g} roughness={0.85}/>
      </mesh>
      <mesh position={[0,th+cr*1.65,0]}>
        <coneGeometry args={[cr*0.35,cr*0.8,7]}/>
        <meshStandardMaterial color={g} roughness={0.85}/>
      </mesh>
    </group>
  );
}

function Roads() {
  return (
    <group position={[0,0.015,0]}>
      {([-75,-15,45] as number[]).map(x=>(
        <mesh key={`v${x}`} rotation={[-Math.PI/2,0,0]} position={[x,0,0]}>
          <planeGeometry args={[9,800]}/>
          <meshStandardMaterial color="#070707" roughness={0.98}/>
        </mesh>
      ))}
      {([-110,-50,10,70,130] as number[]).map(z=>(
        <mesh key={`h${z}`} rotation={[-Math.PI/2,0,0]} position={[0,0,z]}>
          <planeGeometry args={[800,9]}/>
          <meshStandardMaterial color="#070707" roughness={0.98}/>
        </mesh>
      ))}
    </group>
  );
}

function StreetLamps() {
  const spots: [number,number,number][] = [];
  [-75,-15,45].forEach(x => {
    for(let z=-180;z<=180;z+=35) spots.push([x+6,0,z]);
  });
  return (
    <group>
      {spots.map((pos,i)=>(
        <group key={i} position={pos}>
          <mesh position={[0,3.5,0]}>
            <cylinderGeometry args={[0.06,0.09,7,5]}/>
            <meshStandardMaterial color="#151515" roughness={0.9}/>
          </mesh>
          <mesh position={[0,7.2,0]}>
            <sphereGeometry args={[0.28,8,8]}/>
            <meshStandardMaterial color="#ffdd66" emissive="#ffdd66" emissiveIntensity={4}/>
          </mesh>
          <pointLight position={[0,7,0]} color="#ffcc44" intensity={16} distance={26} decay={2}/>
        </group>
      ))}
    </group>
  );
}

function BackgroundSkyline({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  const buildings = useMemo(()=>{
    const r=[];
    for(let i=0;i<55;i++){
      r.push({ x:((i*53.7)%700)-350, z:-300-Math.floor(i/14)*50, h:25+(i*19.3%55), w:9+(i*7.1%12), key:i });
    }
    return r;
  },[]);
  return (
    <group>
      {buildings.map(b=>(
        <mesh key={b.key} position={[b.x,b.h/2,b.z]}>
          <boxGeometry args={[b.w,b.h,b.w*0.7]}/>
          <meshStandardMaterial color="#040608" emissive={t.horizon} emissiveIntensity={0.05} roughness={0.15} metalness={0.95}/>
        </mesh>
      ))}
    </group>
  );
}

const PARK_TREES = (()=>{
  const out:[number,number,number][]=[];
  for(let i=0;i<80;i++){
    const a=(i/80)*Math.PI*2, r=185+(i%5)*10;
    out.push([Math.cos(a)*r,0,Math.sin(a)*r]);
  }
  return out;
})();

function buildCityLayout(count:number):[number,number,number][]{
  const positions:[number,number,number][]=[];
  const cols=[-95,-45,5,55], rows=[-145,-85,-25,35,95];
  for(let i=0;i<count;i++){
    const col=i%cols.length, row=Math.floor(i/cols.length);
    if(row>=rows.length) break;
    positions.push([cols[col]+((i*6.3)%10)-5, 0, rows[row]+((i*9.7)%10)-5]);
  }
  return positions;
}

// Fly controller
function FlyController({ active }: { active: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string,boolean>>({});
  useEffect(()=>{
    if(!active) return;
    const d=(e:KeyboardEvent)=>{ keys.current[e.code]=true; };
    const u=(e:KeyboardEvent)=>{ keys.current[e.code]=false; };
    window.addEventListener('keydown',d);
    window.addEventListener('keyup',u);
    return ()=>{ window.removeEventListener('keydown',d); window.removeEventListener('keyup',u); keys.current={}; };
  },[active]);
  useFrame((_,delta)=>{
    if(!active) return;
    const k=keys.current;
    const spd=(k['ShiftLeft']||k['ShiftRight'])?40:20;
    const d=spd*Math.min(delta,0.05);
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir);
    const flat=new THREE.Vector3(dir.x,0,dir.z).normalize();
    const right=new THREE.Vector3().crossVectors(flat,new THREE.Vector3(0,1,0)).normalize();
    if(k['KeyW']||k['ArrowUp'])    camera.position.addScaledVector(flat,d);
    if(k['KeyS']||k['ArrowDown'])  camera.position.addScaledVector(flat,-d);
    if(k['KeyA']||k['ArrowLeft'])  camera.position.addScaledVector(right,-d);
    if(k['KeyD']||k['ArrowRight']) camera.position.addScaledVector(right,d);
    if(k['Space'])                 camera.position.y+=d;
    if(k['KeyQ'])                  camera.position.y-=d;
  });
  return null;
}

// Solid ground using only CuboidCollider — guaranteed no tunneling
function Ground({ theme }: { theme: ThemeName }) {
  const t = THEMES[theme];
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Thick slab: 3000 wide, 20 units tall, top surface at y=0 */}
      <CuboidCollider args={[1500, 10, 1500]} position={[0, -10, 0]} />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[3000,3000]}/>
        <meshStandardMaterial color={t.ground} roughness={0.97} metalness={0.04}/>
      </mesh>
    </RigidBody>
  );
}

// Watches character Y position and respawns if fallen below -8
function FallGuard({ ecctrlRef }: { ecctrlRef: React.MutableRefObject<any> }) {
  useFrame(()=>{
    if(!ecctrlRef.current) return;
    const rb = ecctrlRef.current?.characterRef?.current;
    if(rb){
      const pos = rb.translation();
      if(pos.y < -8){
        rb.setTranslation({ x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] }, true);
        rb.setLinvel({ x:0, y:0, z:0 }, true);
        rb.setAngvel({ x:0, y:0, z:0 }, true);
      }
    }
  });
  return null;
}

function WorldScene({ devs, flyMode, theme, ecctrlRef }: { devs:any[], flyMode:boolean, theme:ThemeName, ecctrlRef:React.MutableRefObject<any> }) {
  const t = THEMES[theme];
  const cityLayout = useMemo(()=> devs ? buildCityLayout(devs.length) : [], [devs]);

  return (
    <>
      <SceneFog theme={theme}/>
      <ThemeSky theme={theme}/>
      <Stars radius={380} depth={55} count={theme==='sunset'?1000:4500} factor={4.5} saturation={0.5} fade speed={0.08}/>
      <CelestialBody theme={theme}/>
      <BackgroundSkyline theme={theme}/>

      <ambientLight intensity={0.55} color={t.ambient}/>
      <directionalLight
        position={t.sunPos}
        intensity={theme==='sunset'?1.6:1.3}
        color={t.sunColor}
        castShadow
        shadow-mapSize={[1024,1024]}
        shadow-camera-far={600}
        shadow-camera-left={-220} shadow-camera-right={220}
        shadow-camera-top={220} shadow-camera-bottom={-220}
      />
      <pointLight position={[0,100,-100]} color={t.sunColor} intensity={220} distance={650} decay={2}/>
      <pointLight position={[150,70,-100]} color="#2244ee" intensity={160} distance={450} decay={2}/>
      <pointLight position={[-150,70,-100]} color="#00ccbb" intensity={160} distance={450} decay={2}/>

      <Physics gravity={[0, flyMode ? 0 : -25, 0]} timeStep="vary">
        {/* Ground FIRST — must be first child so collider exists before character */}
        <Ground theme={theme}/>

        {!flyMode && (
          <>
            <Ecctrl
              ref={ecctrlRef}
              animated={false}
              jumpVel={8}
              maxVelLimit={11}
              camInitDis={-9}
              camMinDis={-3}
              camMaxDis={-20}
              camInitDir={{ x:-0.12, y:0 }}
              position={SPAWN}
              capsuleHalfHeight={0.4}
              capsuleRadius={0.22}
              floatHeight={0.15}
              autoBalance={true}
              autoBalanceSpringK={0.3}
              autoBalanceDampingC={0.03}
            >
              <mesh castShadow>
                <capsuleGeometry args={[0.22,0.44,6,12]}/>
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.8} roughness={0.2} metalness={0.5}/>
              </mesh>
            </Ecctrl>
            <FallGuard ecctrlRef={ecctrlRef}/>
          </>
        )}

        {devs?.map((dev:any,i:number)=>(
          <DevBuilding
            key={dev.username||i}
            dev={dev}
            position={cityLayout[i]||[(i-devs.length/2)*20,0,0]}
            theme={theme}
          />
        ))}
      </Physics>

      <FlyController active={flyMode}/>
      <Roads/>
      <StreetLamps/>
      <Grid
        position={[0,0.02,0]} args={[3000,3000]}
        cellSize={10} cellThickness={0.3} cellColor={t.grid}
        sectionSize={60} sectionThickness={0.7} sectionColor={t.gridSection}
        fadeDistance={500} fadeStrength={1.0} infiniteGrid
      />
      {PARK_TREES.map((pos,i)=><Tree key={i} position={pos} s={0.75}/>)}
    </>
  );
}

function ActivityFeed({ devs }: { devs:any[] }) {
  const items = devs?.slice(0,30).map(d=>`⬡ ${d.username}  ★ ${d.contributions} commits  ◎ ${d.repos} repos`) || [];
  const doubled = [...items,...items];
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, height:26, background:'rgba(0,0,0,0.88)', borderTop:'1px solid rgba(255,255,255,0.05)', overflow:'hidden', display:'flex', alignItems:'center' }}>
      <div style={{ display:'flex', gap:80, whiteSpace:'nowrap', animation:'ticker 60s linear infinite', fontSize:9, color:'#22c55e', fontFamily:'monospace', letterSpacing:1.5 }}>
        {doubled.map((item,i)=><span key={i}>{item}</span>)}
      </div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const [mounted, setMounted] = useState(false);
  const { data: devs } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const { progress } = useProgress();
  const [players, setPlayers] = useState<Record<string,any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('sunset');
  const [sceneReady, setSceneReady] = useState(false);
  const room = useRef<any>(null);
  const ecctrlRef = useRef<any>(null);

  useEffect(()=>{
    setMounted(true);
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    // Wait 1.2s for Rapier to fully init ground collider before revealing scene
    const t = setTimeout(()=> setSceneReady(true), 1200);
    try {
      room.current = supabase.channel('presence')
        .on('broadcast',{ event:'move' },({ payload }:any)=>{
          if(payload?.username) setPlayers(p=>({...p,[payload.username]:payload}));
        }).subscribe();
    } catch(e){ console.error(e); }
    return ()=>{ room.current?.unsubscribe(); clearTimeout(t); };
  },[]);

  const dataReady = mounted && devs && Array.isArray(devs);
  const showWorld = dataReady && sceneReady;

  return (
    <div style={{ position:'fixed', inset:0, background:'#1a0800', overflow:'hidden' }}>
      {/* Loading screen — shown until both data AND physics are ready */}
      {!showWorld && (
        <LoadingScreen progress={sceneReady ? (progress||10) : Math.min(progress||5, 80)}/>
      )}

      {/* Canvas always mounted — physics warms up invisibly */}
      {dataReady && (
        <ErrorBoundary>
          <Canvas
            shadows
            gl={{
              antialias: true,
              alpha: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2,
              powerPreference: "high-performance",
            }}
            camera={{ fov:65, position:[0,10,115], near:0.2, far:1600 }}
            style={{ position:'absolute', inset:0, visibility: showWorld ? 'visible' : 'hidden' }}
            onCreated={({ gl })=>{ gl.setClearColor(new THREE.Color('#1a0800')); }}
          >
            <Suspense fallback={null}>
              <WorldScene
                devs={devs}
                flyMode={flyMode}
                theme={theme}
                ecctrlRef={ecctrlRef}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      )}

      {showWorld && (
        <>
          <HUD
            username={username}
            playersCount={Object.keys(players).length+1}
            flyMode={flyMode} setFlyMode={setFlyMode}
            devs={devs} theme={theme} setTheme={setTheme}
          />
          <Chat username={username}/>
          <ActivityFeed devs={devs}/>

          {isTouch && !flyMode && (
            <div style={{
              position:'fixed', bottom:'34px', left:'8px', zIndex:40,
              transform:'scale(0.52)', transformOrigin:'bottom left',
              opacity:0.85, pointerEvents:'auto',
            }}>
              <EcctrlJoystick/>
            </div>
          )}

          {flyMode && (
            <div style={{
              position:'fixed', bottom:36, left:'50%', transform:'translateX(-50%)',
              pointerEvents:'none', zIndex:45,
              fontFamily:'monospace', fontSize:9, color:'rgba(59,130,246,0.9)',
              letterSpacing:2, background:'rgba(0,0,0,0.55)',
              padding:'6px 14px', borderRadius:8,
            }}>
              {isTouch ? 'JOYSTICK=MOVE · PINCH=HEIGHT' : 'WASD=MOVE · SPACE=UP · Q=DOWN · SHIFT=BOOST'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
