import Image from "next/image";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";
import { SlashIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = async () => {
  const session = await auth();

  return (
    <>
      <div className="bg-background absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <Image
              src="/images/gemini-logo.png"
              height={20}
              width={20}
              alt="Impact Chad logo"
            />
            <div className="text-zinc-500">
              <SlashIcon size={16} />
            </div>
            <div className="text-sm dark:text-zinc-300 truncate w-28 md:w-fit">
              Impact Chad PoC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">PoC Mode</span>
        </div>
      </div>
    </>
  );
};








