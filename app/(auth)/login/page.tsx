"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { login, LoginActionState } from "../actions";

export default function Page() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await login();
      if (result.status === "failed") {
        toast.error("Failed to sign in with Google");
      }
    } catch (error) {
      toast.error("An error occurred during sign in");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Sign in with your Google Workspace account
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-600"
            type="button"
          >
            <svg
              className="mr-2 size-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
