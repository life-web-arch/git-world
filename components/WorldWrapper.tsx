"use client";

import dynamic from "next/dynamic";

// Here inside a "use client" file, ssr: false is perfectly legal!
const WorldClient = dynamic(() => import("./WorldClient"), { ssr: false });

export default function WorldWrapper({ username }: { username: string }) {
  return <WorldClient username={username} />;
}
