import { supabase } from "./supabase";

export async function getDevStats(username: string, accessToken?: string) {
  const token = accessToken || process.env.GITHUB_PAT;

  const query = `
    query($username: String!) {
      user(login: $username) {
        avatarUrl
        followers { totalCount }
        contributionsCollection {
          contributionCalendar { totalContributions }
          restrictedContributionsCount
        }
        ownedRepos: repositories(
          first: 1,
          ownerAffiliations: OWNER,
          isFork: false
        ) {
          totalCount
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { username } })
    });
    const json = await res.json();
    const user = json.data?.user;

    const publicContribs = user?.contributionsCollection?.contributionCalendar?.totalContributions || 10;
    // Private contributions only counted when using the user's own token
    const privateContribs = accessToken
      ? (user?.contributionsCollection?.restrictedContributionsCount || 0)
      : 0;

    return {
      contributions: publicContribs + privateContribs,
      // Only repos they actually created — forks don't count
      repos: user?.ownedRepos?.totalCount || 5,
      followers: user?.followers?.totalCount || 0,
      avatarUrl: user?.avatarUrl || null,
    };
  } catch (e) {
    return { contributions: 50, repos: 5, followers: 0, avatarUrl: null };
  }
}

export async function syncUserStats(username: string, accessToken?: string) {
  const stats = await getDevStats(username, accessToken);

  await supabase.from('developers').upsert({
    username,
    avatar_url: stats.avatarUrl,
    contributions: stats.contributions,
    repos: stats.repos,
    followers: stats.followers,
    stats_last_updated_at: new Date().toISOString(),
    ...(accessToken ? { github_access_token: accessToken } : {}),
  });
}
