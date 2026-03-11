import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { syncUserStats } from "@/lib/sync";

export const revalidate = 0;

const FALLBACK_DEVS = ['torvalds', 'srizzon', 'leerob', 'shadcn'];
const CACHE_DURATION_HOURS = 6;
const STAGGER_MS = 2000; // 2s between each background sync

export async function GET() {
  try {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .order('contributions', { ascending: false })
      .limit(50);

    if (error) throw new Error("Could not fetch developers from database.");

    if (!developers || developers.length === 0) {
      console.log("No developers in DB, populating with fallbacks...");
      for (const dev of FALLBACK_DEVS) {
        await syncUserStats(dev);
      }
      const { data: populatedDevs } = await supabase.from('developers').select('*');
      return NextResponse.json(populatedDevs);
    }

    // Staggered fire-and-forget: only sync stale devs, one at a time with delay
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
          syncUserStats(dev.username).catch(console.error);
        }, i * STAGGER_MS);
      });
    }

    return NextResponse.json(developers);

  } catch (e: any) {
    console.error("Error in /api/city:", e.message);
    return NextResponse.json({ error: "Failed to load city data" }, { status: 500 });
  }
}
