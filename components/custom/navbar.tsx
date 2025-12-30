import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";

export const Navbar = async () => {
  const session = await auth();

  return (
    <>
      <div className="bg-tttr-beige-light absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <Link href="/" className="text-tttr-purple font-primary font-bold text-lg hover:text-tttr-purple-hover transition-colors">
              Impact Chat
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};








