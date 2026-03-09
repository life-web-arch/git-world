import { supabase } from "./supabase";

// getDevStats function remains unchanged...
export async function getDevStats(username: string) {
  console.log(`[GitHub API] Fetching stats for: ${username}`);
  const query = `
    query($username: String!) {
      user(login: $username) {
        avatarUrl
        contributionsCollection {
          contributionCalendar { totalContributions }
        }
        repositories(first: 1, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          totalCount
        }
      }
    }
  `;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { username } })
    });
    if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
    const user = json.data?.user;
    if (!user) throw new Error(`No data for user: ${username}`);
    console.log(`[GitHub API] Success for ${username}`);
    return {
      contributions: user.contributionsCollection?.contributionCalendar?.totalContributions || 10,
      repos: user.repositories?.totalCount || 5,
      avatarUrl: user.avatarUrl || null,
    };
  } catch (e: any) {
    console.error(`[GitHub API] Fatal fetch error for ${username}:`, e.message);
    return { contributions: 50, repos: 10, avatarUrl: null };
  }
}


export async function syncUserStats(username: string) {
  console.log(`[Sync Service] Starting for ${username}`);
  const stats = await getDevStats(username);
  const { error } = await supabase.from('developers').upsert({
    username,
    avatar_url: stats.avatarUrl,
    contributions: stats.contributions,
    repos: stats.repos,
    last_seen: new Date().toISOString(),
    // This is the crucial new line!
    stats_last_updated_at: new Date().toISOString()
  });

  if (error) {
    console.error(`[Supabase Sync Error] for ${username}:`, error);
  } else {
    console.log(`[Sync Service] Completed for ${username}`);
  }
}
