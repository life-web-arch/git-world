import GithubProvider from "next-auth/providers/github";
import { syncUserStats } from "./sync";

export const authOptions = {
  providers:[
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }: any) {
      const username = profile?.login;
      if (username) {
        // We ALWAYS await the sync for the person signing in.
        // This ensures their own building is immediately up-to-date.
        await syncUserStats(username).catch(console.error);
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
