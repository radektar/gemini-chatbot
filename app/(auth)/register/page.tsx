"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since registration is automatic with Google OAuth
    router.replace("/login");
  }, [router]);

  return null;
}
