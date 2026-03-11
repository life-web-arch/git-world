import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { syncUserStats } from "@/lib/sync";

export const revalidate = 0;

const FALLBACK_DEVS = ['torvalds', 'srizzon', 'leerob', 'shadcn'];
const CACHE_DURATION_HOURS = 6;
const STAGGER_MS = 2000;

export async function GET() {
  try {
    const { data: developers, error } = await supabaseServer
      .from('developers')
      .select('*')
      .order('contributions', { ascending: false })
      .limit(50);

    if (error) throw new Error("Could not fetch developers from database.");

    if (!developers || developers.length === 0) {
      for (const dev of FALLBACK_DEVS) {
        await syncUserStats(dev);
      }
      const { data: populatedDevs } = await supabaseServer
        .from('developers')
        .select('*');
      // Strip tokens before sending to browser
      const safe = (populatedDevs || []).map(({ github_access_token, ...rest }) => rest);
      return NextResponse.json(safe);
    }

    const stale = developers.filter(dev => {
      const lastUpdated = dev.stats_last_updated_at
        ? new Date(dev.stats_last_updated_at)
        : new Date(0);
      const hoursSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      return hoursSince > CACHE_DURATION_HOURS;
    });

    if (stale.length > 0) {
      console.log(`[Cache] ${stale.length} stale devs — staggering background syncs...`);
      stale.forEach((dev, i) => {
        setTimeout(() => {
          syncUserStats(dev.username, dev.github_access_token || undefined)
            .catch(console.error);
        }, i * STAGGER_MS);
      });
    }

    // Strip token before sending to frontend — never expose to browser
    const safe = developers.map(({ github_access_token, ...rest }) => rest);
    return NextResponse.json(safe);

  } catch (e: any) {
    console.error("Error in /api/city:", e.message);
    return NextResponse.json({ error: "Failed to load city data" }, { status: 500 });
  }
}
