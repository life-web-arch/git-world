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
" >> $OUTPUT

echo -e "\n==== PROJECT DIRECTORY STRUCTURE ====" >> $OUTPUT
find . -maxdepth 3 -not -path '*/.*' -not -path './node_modules*' -not -path './.next*' >> $OUTPUT

echo -e "\n==== ALL SOURCE CODE FILES ====" >> $OUTPUT

# 2. LOOP THROUGH ALL RELEVANT FILES
# We exclude binaries, lockfiles, and git folders
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

echo "Master Prompt created at: Downloads/MASTER_PROMPT.txt"
