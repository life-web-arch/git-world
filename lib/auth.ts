import GithubProvider from "next-auth/providers/github";
import { syncUserStats } from "./sync";
import { supabase } from "./supabase";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      const username = profile?.login;
      const accessToken = account?.access_token;
      if (username) {
        // Sync stats using the user's OWN token — gets private contributions too
        await syncUserStats(username, accessToken).catch(console.error);
      }
      return true;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.username = token.name || session.user.name;
      }
      return session;
    }
  }
};
