import { supabase } from "./supabase";

export async function getDevStats(username: string) {
  const query = `
    query($username: String!) {
      user(login: $username) {
        avatarUrl
        followers { totalCount }
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
    const json = await res.json();
    const user = json.data?.user;
    return {
      contributions: user?.contributionsCollection?.contributionCalendar?.totalContributions || 10,
      repos: user?.repositories?.totalCount || 5,
      followers: user?.followers?.totalCount || 0,
      avatarUrl: user?.avatarUrl || null,
    };
  } catch (e) { return { contributions: 50, repos: 5, followers: 0, avatarUrl: null }; }
}

export async function syncUserStats(username: string) {
  const stats = await getDevStats(username);
  await supabase.from('developers').upsert({
    username,
    avatar_url: stats.avatarUrl,
    contributions: stats.contributions,
    repos: stats.repos,
    followers: stats.followers,
    stats_last_updated_at: new Date().toISOString()
  });
}
