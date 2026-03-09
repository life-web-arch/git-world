import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Github } from "lucide-react";
import WorldWrapper from "@/components/WorldWrapper";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-white font-mono p-4">
        <div className="max-w-md w-full p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Github className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Git World</h1>
          <p className="text-zinc-400 mb-8 text-sm">Every dev gets a base. <br/>Commits = Height. Repos = Width.<br/>Explore, jump, hangout.</p>
          <a 
            href="/api/auth/signin" 
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-xl font-semibold hover:bg-zinc-200 transition-all active:scale-95"
          >
            <Github className="w-5 h-5" />
            Connect GitHub to Enter
          </a>
        </div>
      </div>
    );
  }

  return <WorldWrapper username={(session.user as any).username || "Dev"} />;
}
