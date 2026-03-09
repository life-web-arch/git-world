"use client";
import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Sky, Environment, Text, Grid, Stars, Image } from "@react-three/drei";
import Ecctrl, { EcctrlJoystick } from "ecctrl";
import { useEffect, useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Rocket } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-[1000]">
      <div className="text-center text-white font-mono">
        <div className="text-3xl font-bold text-green-400 mb-2">Entering Git World</div>
        <div className="text-zinc-400">Fetching developer data...</div>
        <div className="mt-4 flex justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse delay-0"></div>
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse delay-200 mx-2"></div>
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse delay-400"></div>
        </div>
      </div>
    </div>
  );
}

function PlayerTracker({ username, room }: { username: string, room: any }) {
  const ref = useRef<THREE.Group>(null);
  let lastSend = 0;
  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastSend > 0.1 && ref.current && room) {
      const pos = ref.current.getWorldPosition(new THREE.Vector3());
      const rot = ref.current.getWorldQuaternion(new THREE.Quaternion());
      room.send({ type: 'broadcast', event: 'move', payload: { username, position: [pos.x, pos.y, pos.z], rotation:[rot.x, rot.y, rot.z, rot.w] } });
      lastSend = clock.elapsedTime;
    }
  });
  return <group ref={ref} />;
}

function OtherPlayer({ position, rotation, username }: any) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.lerp(new THREE.Vector3(...position), 0.1);
      ref.current.quaternion.slerp(new THREE.Quaternion(...rotation), 0.1);
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 1, 0]}><capsuleGeometry args={[0.5, 1, 4]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      <Text position={[0, 2.8, 0]} fontSize={0.6} outlineWidth={0.05} outlineColor="black">{username}</Text>
    </group>
  );
}

function DevBuilding({ dev, position }: { dev: any, position:[number, number, number] }) {
  const height = Math.max(5, (dev.contributions || 10) / 100);
  const width = Math.max(4, Math.min(25, (dev.repos || 5) / 2));
  return (
    <RigidBody type="fixed" position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={`hsl(${(dev.username.length * 25) % 360}, 70%, 20%)`} emissive={`hsl(${(dev.username.length * 25) % 360}, 70%, 40%)`} emissiveIntensity={0.5} />
      </mesh>
      {dev.avatar_url && <Image url={dev.avatar_url} transparent scale={[width * 0.8, width * 0.8, 1]} position={[0, height/2, width/2 + 0.1]} />}
      <Text position={[0, height + 2, 0]} fontSize={2} outlineWidth={0.08} outlineColor="#000000">{dev.username}</Text>
    </RigidBody>
  );
}

function City() {
  const { data: devs } = useSWR('/api/city');
  if (!devs || !Array.isArray(devs)) return null;
  return (
    <group>
      {devs.map((dev: any, i: number) => {
        const cols = Math.max(2, Math.ceil(Math.sqrt(devs.length)));
        const spacing = 40;
        const x = (i % cols) * spacing - (cols * spacing) / 2;
        const z = Math.floor(i / cols) * spacing - (cols * spacing) / 2;
        return <DevBuilding key={dev.username || i} dev={dev} position={[x, 0, z]} />;
      })}
    </group>
  );
}

export default function WorldClient({ username }: { username: string }) {
  const { data: devs, error, isLoading } = useSWR('/api/city', fetcher, { revalidateOnFocus: false });
  const [isTouch, setIsTouch] = useState(false);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [flyMode, setFlyMode] = useState(false);
  const room = useRef<any>(null);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    try {
      room.current = supabase.channel('git-world-live', { config: { broadcast: { self: false } } });
      room.current.on('broadcast', { event: 'move' }, ({ payload }: { payload: any }) => {
        setPlayers(prev => ({ ...prev, [payload.username]: payload }));
      }).subscribe();
    } catch (e) { console.warn("Multiplayer disabled/error:", e); }
    return () => { room.current?.unsubscribe(); };
  },[]);

  if (isLoading) return <FullScreenLoader />;
  if (error) return <div className="fixed inset-0 bg-red-950 text-white flex items-center justify-center font-mono">Error: Could not load city data.</div>;

  return (
    <div className="w-screen h-screen bg-black fixed inset-0">
      <div className="fixed top-4 left-4 z-50 text-white font-mono bg-zinc-900/80 p-4 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl w-auto max-w-xs">
        <h1 className="text-xl font-bold text-green-400 border-b border-green-400/20 pb-2">Git World</h1>
        <div className="mt-2 text-sm text-zinc-300">Connected as: <span className="text-white font-bold">{username}</span></div>
        <div className="text-sm text-purple-300">Online Players: {Object.keys(players).length + 1}</div>
        <div className="mt-3 pt-3 border-t border-zinc-700">
            <button 
                onClick={() => setFlyMode(!flyMode)}
                className={`flex items-center justify-center gap-2 w-full text-sm py-2 rounded-lg transition-colors ${flyMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            >
                <Rocket size={16} /> Fly Mode: {flyMode ? 'ON' : 'OFF'}
            </button>
        </div>
      </div>

      {isTouch && <EcctrlJoystick />}
      
      <Canvas shadows camera={{ fov: 60 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <fog attach="fog" args={['#17171c', 0, 200]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow shadow-mapSize={2048} />
          <Physics debug={false}>
            <Ecctrl animated jumpVel={flyMode ? 0 : 6} maxVelLimit={flyMode ? 15 : 8} gravityScale={flyMode ? 0 : 1} camCollision={!flyMode} autoBalance={!flyMode}>
              <PlayerTracker username={username} room={room.current} />
              <mesh position={[0, 1, 0]}>
                <capsuleGeometry args={[0.5, 1, 4]} />
                <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.5} />
              </mesh>
            </Ecctrl>
            <City />
            {Object.values(players).map((p: any) => p.username !== username && <OtherPlayer key={p.username} {...p} /> )}
            <RigidBody type="fixed">
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1000, 1000]} /><meshStandardMaterial color="#111827" /></mesh>
              <Grid infiniteGrid fadeDistance={200} sectionColor="#4ade80" cellColor="#059669" position={[0, 0.01, 0]} />
            </RigidBody>
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
