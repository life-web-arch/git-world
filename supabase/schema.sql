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

-- Migration: Enable RLS with idempotent policy creation
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developers' AND policyname = 'Public read access') THEN
    CREATE POLICY "Public read access" ON public.developers FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developers' AND policyname = 'Block anon insert') THEN
    CREATE POLICY "Block anon insert" ON public.developers FOR INSERT WITH CHECK (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developers' AND policyname = 'Block anon update') THEN
    CREATE POLICY "Block anon update" ON public.developers FOR UPDATE USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'developers' AND policyname = 'Block anon delete') THEN
    CREATE POLICY "Block anon delete" ON public.developers FOR DELETE USING (false);
  END IF;
END $$;
