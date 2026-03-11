import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    has_pat: !!process.env.GITHUB_PAT,
    pat_prefix: process.env.GITHUB_PAT?.slice(0, 8) || "MISSING",
    has_github_id: !!process.env.GITHUB_ID,
    has_supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
