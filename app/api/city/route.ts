import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { syncUserStats } from "@/lib/sync";

// This tells Vercel to not cache this API route, we handle our own caching.
export const revalidate = 0;

const FALLBACK_DEVS =['torvalds', 'srizzon', 'leerob', 'shadcn'];
const CACHE_DURATION_HOURS = 6; // How old data can be before triggering a background refresh.

export async function GET() {
  try {
    // 1. Fetch from our database first. This is ALWAYS fast.
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .order('contributions', { ascending: false })
      .limit(50); // Let's not load more than 50 devs at once for performance.

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error("Could not fetch developers from database.");
    }

    // If the database is empty (first time users), populate it with fallbacks.
    if (!developers || developers.length === 0) {
      console.log("No developers in DB, populating with fallbacks...");
      await Promise.all(FALLBACK_DEVS.map(dev => syncUserStats(dev)));
      // Re-fetch after populating
      const { data: populatedDevs } = await supabase.from('developers').select('*');
      return NextResponse.json(populatedDevs);
    }

    // 2. For existing data, trigger background updates for stale entries.
    developers.forEach(dev => {
      const now = new Date();
      // If stats_last_updated_at is null, treat it as very old.
      const lastUpdated = dev.stats_last_updated_at ? new Date(dev.stats_last_updated_at) : new Date(0);
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate > CACHE_DURATION_HOURS) {
        console.log(`[Cache] Stale data for ${dev.username}. Triggering background sync.`);
        // "Fire-and-Forget": We call the async function but DON'T await it.
        // The API will return a response long before this is finished.
        syncUserStats(dev.username).catch(console.error);
      }
    });

    // 3. Return the data from the database immediately.
    // This data might be slightly old, but it's delivered instantly.
    return NextResponse.json(developers);

  } catch (e: any) {
    console.error("Error in /api/city:", e.message);
    return NextResponse.json({ error: "Failed to load city data" }, { status: 500 });
  }
}
