-- ============================================================
-- Git World — Supabase Schema
-- Run these IN ORDER in the Supabase SQL Editor
-- ============================================================

-- 1. Create developers table
CREATE TABLE public.developers (
  username text PRIMARY KEY,
  avatar_url text,
  contributions integer DEFAULT 0,
  repos integer DEFAULT 0,
  last_seen timestamp with time zone DEFAULT now()
);

-- Turn off RLS temporarily for MVP so NextAuth server actions can upsert safely
ALTER TABLE public.developers DISABLE ROW LEVEL SECURITY;

-- 2. Add stats_last_updated_at column
ALTER TABLE public.developers
ADD COLUMN stats_last_updated_at TIMESTAMPTZ;

-- 3. Add followers column (safe — skips if already exists)
ALTER TABLE public.developers
ADD COLUMN IF NOT EXISTS followers integer DEFAULT 0;

