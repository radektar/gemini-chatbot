"use client";

import { motion } from "framer-motion";
import { CreateMessage } from "ai";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  emoji: string;
  triggerPrompt: string;
}

const quickActions: QuickAction[] = [
  {
    id: "UC-01",
    label: "Find Project Story",
    description: "Get project for your next meeting",
    emoji: "📖",
    triggerPrompt: "I need to find a project story for a donor meeting",
  },
  {
    id: "UC-02",
    label: "Search Data",
    description: "Quick analytics from Monday",
    emoji: "📊",
    triggerPrompt: "I want to search for operational data and metrics",
  },
  {
    id: "UC-03",
    label: "Draft Donor Email",
    description: "Personalized fundraising message",
    emoji: "✉️",
    triggerPrompt: "I need to draft a personalized email for a donor",
  },
  {
    id: "UC-05",
    label: "Get Market Stats",
    description: "Enrich narrative with external data",
    emoji: "🌍",
    triggerPrompt: "I want to enrich my project narrative with external statistics",
  },
];

interface QuickActionsProps {
  onActionClick: (message: CreateMessage) => Promise<string | null | undefined>;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const handleClick = async (action: QuickAction) => {
    await onActionClick({
      role: "user",
      content: action.triggerPrompt,
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-[600px]">
      <div className="flex flex-col md:flex-row gap-3 justify-center">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleClick(action)}
              className="h-auto px-4 py-2 text-sm"
            >
              <span className="mr-2">{action.emoji}</span>
              <span>{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

