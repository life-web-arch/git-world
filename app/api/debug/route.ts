import { NextResponse } from "next/server";
import { getDevStats } from "@/lib/sync";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Test 1: Check env
  const envCheck = {
    has_pat: !!process.env.GITHUB_PAT,
    pat_prefix: process.env.GITHUB_PAT?.slice(0, 8) || "MISSING",
  };

  // Test 2: Actually call GitHub API and return raw result
  let githubResult: any = null;
  let githubError: any = null;
  try {
    githubResult = await getDevStats("life-web-arch");
  } catch (e: any) {
    githubError = e.message;
  }

  // Test 3: Check what's in DB right now
  const { data: dbData, error: dbError } = await supabase
    .from('developers')
    .select('username, contributions, repos, stats_last_updated_at')
    .eq('username', 'life-web-arch')
    .single();

  // Test 4: Try a direct upsert
  let upsertError: any = null;
  try {
    const { error } = await supabase.from('developers').upsert({
      username: 'life-web-arch',
      contributions: githubResult?.contributions ?? 0,
      repos: githubResult?.repos ?? 0,
      followers: githubResult?.followers ?? 0,
      avatar_url: githubResult?.avatarUrl ?? null,
      stats_last_updated_at: new Date().toISOString(),
    });
    upsertError = error;
  } catch (e: any) {
    upsertError = e.message;
  }

  return NextResponse.json({
    envCheck,
    githubResult,
    githubError,
    dbBefore: dbData,
    dbError: dbError?.message,
    upsertError,
  });
}
