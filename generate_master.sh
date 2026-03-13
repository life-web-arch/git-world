#!/bin/bash
OUTPUT="$HOME/storage/downloads/MASTER_PROMPT.txt"

# 1. ADD SYSTEM INSTRUCTIONS & GOALS
echo "==== SYSTEM INSTRUCTIONS FOR THE AI AGENT ====" > $OUTPUT
echo "You are an expert full-stack developer specializing in Next.js 15, React Three Fiber, and Rapier Physics. 
You are assisting me in building 'Git World' via Termux on Android.

STRICT RULES FOR YOUR RESPONSES:
1. Provide 'cat << 'EOF' > filename' commands for every file update so I can copy-paste directly into Termux.
2. After every set of changes, provide 'git add .', 'git commit -m \"...\"', and 'git push' commands.
3. Consider the mobile environment: keep code optimized and avoid heavy external assets.
4. If a file is large, only provide the update for that specific file using cat EOF to overwrite it completely.
5. For ANY database change (new table, new column, index, RLS policy, etc):
   - Always provide the SQL query in a cat EOF block targeting supabase/schema.sql
   - Use 'IF NOT EXISTS' and 'IF EXISTS' guards so queries are safe to re-run
   - Always append with >> not overwrite with > (except initial creation)
   - Always follow with: git add supabase/schema.sql && git commit && git push
6. Never suggest running SQL manually without also saving it to supabase/schema.sql in the repo.

PROJECT GOALS:
- Surpass thegitcity.com in aesthetics and interactivity.
- Create a Roblox/Minecraft/Social Hangout vibe for developers.
- Use GitHub stats (contributions, repos, followers) to procedurally generate a 3D city.
- Features: Multiplayer (Supabase), Chat, Fly Mode, Clickable buildings, Loading screens.
" >> $OUTPUT

echo -e "\n==== CURRENT PROJECT CONTEXT ====" >> $OUTPUT
echo "
- Tech Stack: Next.js (App Router), Three.js (R3F), Rapier (Physics), Ecctrl (Joystick), Supabase (Realtime), NextAuth.
- Deployment: Vercel (Production URL: https://git-world-sigma.vercel.app).
- Authentication: GitHub OAuth.
- Current Status: Stable build with HTML-first loader, Supabase background sync, and basic multiplayer.

DATABASE WORKFLOW RULES (IMPORTANT):
- All SQL migrations live in: supabase/schema.sql (tracked in git)
- SQL is written and tested in Supabase SQL Editor (browser), then immediately saved to supabase/schema.sql
- The schema.sql file is the single source of truth for the entire database structure
- To recreate the DB from scratch: run supabase/schema.sql top-to-bottom in the SQL Editor
- Never make DB changes without updating supabase/schema.sql in the same git commit
- All queries must use IF NOT EXISTS / IF EXISTS guards to be idempotent (safe to re-run)
" >> $OUTPUT

echo -e "\n==== PROJECT DIRECTORY STRUCTURE ====" >> $OUTPUT
find . -maxdepth 3 -not -path '*/.*' -not -path './node_modules*' -not -path './.next*' >> $OUTPUT

echo -e "\n==== ALL SOURCE CODE FILES ====" >> $OUTPUT

# 2. LOOP THROUGH ALL RELEVANT SOURCE FILES
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.json" -o -name "*.css" -o -name "*.md" \) \
-not -path '*/.*' \
-not -path './node_modules*' \
-not -path './.next*' \
-not -path './package-lock.json' | while read file; do
    echo -e "\n[FILE_START: $file]" >> $OUTPUT
    echo "----------------------------------------" >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo -e "\n----------------------------------------" >> $OUTPUT
    echo "[FILE_END: $file]" >> $OUTPUT
done

# 3. INCLUDE FULL SUPABASE SCHEMA (deduplicated — already caught above if .sql added,
#    but we explicitly call it out here for clarity and future .sql support)
echo -e "\n==== SUPABASE SCHEMA (supabase/schema.sql) ====" >> $OUTPUT
if [ -f "./supabase/schema.sql" ]; then
    echo "----------------------------------------" >> $OUTPUT
    cat "./supabase/schema.sql" >> $OUTPUT
    echo -e "\n----------------------------------------" >> $OUTPUT
else
    echo "WARNING: supabase/schema.sql not found! Create it and commit your SQL migrations." >> $OUTPUT
fi

# 4. SUPABASE CONTEXT SUMMARY
echo -e "\n==== SUPABASE DATABASE CONTEXT ====" >> $OUTPUT
echo "
Current known tables and columns (derived from supabase/schema.sql above):

TABLE: public.developers
  - username         TEXT PRIMARY KEY
  - avatar_url       TEXT
  - contributions    INTEGER DEFAULT 0
  - repos            INTEGER DEFAULT 0
  - followers        INTEGER DEFAULT 0
  - last_seen        TIMESTAMPTZ DEFAULT now()
  - stats_last_updated_at TIMESTAMPTZ

RLS: Make sure RLS is properly implemented across everything wherever needed for a very famous potential website, to keep it safe from prying hacking eyes
--> Make sure the best cyber-security measures are practiced
Realtime: Table used for live presence via Supabase channel broadcasts

HOW TO ADD A NEW COLUMN (example workflow):
  1. Write SQL: ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS new_col TYPE DEFAULT val;
  2. Test it in Supabase SQL Editor
  3. Save to repo:
     cat << 'SQLEOF' >> supabase/schema.sql
     -- Migration: add new_col
     ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS new_col TYPE DEFAULT val;
     SQLEOF
     git add supabase/schema.sql
     git commit -m \"chore: add new_col to developers table\"
     git push

HOW TO RECREATE DB FROM SCRATCH:
  1. Open Supabase SQL Editor
  2. Paste full contents of supabase/schema.sql
  3. Click Run
" >> $OUTPUT

echo "✅ Master Prompt created at: Downloads/MASTER_PROMPT.txt"
