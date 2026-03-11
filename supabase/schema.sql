-- ============================================================
-- Git World — Supabase Schema
-- Run these IN ORDER in the Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- 1. Create developers table
CREATE TABLE IF NOT EXISTS public.developers (
  username text PRIMARY KEY,
  avatar_url text,
  contributions integer DEFAULT 0,
  repos integer DEFAULT 0,
  last_seen timestamp with time zone DEFAULT now()
);

-- 2. Disable RLS for MVP
ALTER TABLE public.developers DISABLE ROW LEVEL SECURITY;

-- 3. Add stats_last_updated_at column
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS stats_last_updated_at TIMESTAMPTZ;

-- 4. Add followers column
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS followers integer DEFAULT 0;

-- 5. Add github_access_token column (for private contribution fetching)
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS github_access_token TEXT;

-- 6. Enable Realtime on developers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.developers;
