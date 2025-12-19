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
          console.error(`[Auth] Domain mismatch: ${emailDomain} !== ${GOOGLE_WORKSPACE_DOMAIN}`);
          return false; // Reject sign-in if domain doesn't match
        }
      }

      // Create user in database if doesn't exist (graceful degradation if DB not configured)
      if (user.email) {
        try {
          const existingUsers = await getUser(user.email);
          if (existingUsers.length === 0) {
            // Create user without password (OAuth users don't need passwords)
            await createUser(user.email);
            console.log(`[Auth] Created user: ${user.email}`);
          } else {
            console.log(`[Auth] User exists: ${user.email}`);
          }
        } catch (error) {
          // Database not configured (PoC mode) - allow sign-in anyway
          // User will be authenticated but not persisted in DB
          console.warn(`[Auth] Database not available (PoC mode) - allowing sign-in for ${user.email}`);
          // Don't throw - allow sign-in to proceed
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Get user from database to get the ID (graceful degradation if DB not configured)
        try {
          const dbUsers = await getUser(user.email!);
          if (dbUsers.length > 0) {
            token.id = dbUsers[0].id;
          } else {
            // No DB user found - use email as fallback ID for PoC mode
            token.id = user.email || "unknown";
          }
        } catch (error) {
          // Database not configured (PoC mode) - use email as fallback ID
          console.warn(`[Auth] Database not available (PoC mode) - using email as ID for ${user.email}`);
          token.id = user.email || "unknown";
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
