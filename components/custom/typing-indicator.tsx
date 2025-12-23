"use client";

import { motion } from "framer-motion";
import { BotIcon } from "./icons";

type Phase = "analyzing" | "fetching" | "preparing";

export const TypingIndicator = ({ phase = "analyzing" }: { phase?: Phase }) => {
  const phaseLabels: Record<Phase, string> = {
    analyzing: "Analizuję zapytanie...",
    fetching: "Pobieram dane...",
    preparing: "Przygotowuję odpowiedź...",
  };

  return (
    <motion.div
      className="flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <BotIcon />
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <motion.span
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {phaseLabels[phase]}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

