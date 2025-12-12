import NextAuth, { User, Session } from "next-auth";
import Google from "next-auth/providers/google";

import { getUser, createUser } from "@/db/queries";

import { authConfig } from "./auth.config";

interface ExtendedSession extends Session {
  user: User;
}

// Get Google Workspace domain restriction from env (optional)
const GOOGLE_WORKSPACE_DOMAIN = process.env.GOOGLE_WORKSPACE_DOMAIN;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Restrict to Google Workspace domain if configured
          ...(GOOGLE_WORKSPACE_DOMAIN && {
            hd: GOOGLE_WORKSPACE_DOMAIN, // Hosted domain restriction
          }),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Verify domain restriction if configured
      if (GOOGLE_WORKSPACE_DOMAIN && user.email) {
        const emailDomain = user.email.split("@")[1];
        if (emailDomain !== GOOGLE_WORKSPACE_DOMAIN) {
          return false; // Reject sign-in if domain doesn't match
        }
      }

      // Create user in database if doesn't exist
      if (user.email) {
        const existingUsers = await getUser(user.email);
        if (existingUsers.length === 0) {
          // Create user without password (OAuth users don't need passwords)
          await createUser(user.email);
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Get user from database to get the ID
        const dbUsers = await getUser(user.email!);
        if (dbUsers.length > 0) {
          token.id = dbUsers[0].id;
        }
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
