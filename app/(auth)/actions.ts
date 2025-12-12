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
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { status: "failed" };
  }
};

