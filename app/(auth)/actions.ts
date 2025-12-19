"use server";

import { signIn } from "./auth";

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed";
}

export const login = async (): Promise<LoginActionState> => {
  try {
    await signIn("google", {
      redirect: true,
      redirectTo: "/",
    });

    return { status: "success" };
  } catch (error: any) {
    // NEXT_REDIRECT is not a real error - it's how Next.js handles redirects
    // This is expected behavior when signIn redirects to OAuth provider
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      // Re-throw to let Next.js handle the redirect
      throw error;
    }
    console.error("Google sign-in error:", error);
    return { status: "failed" };
  }
};

