"use client";

import { Play, Edit } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PlanActionState = "idle" | "executing" | "improving";

interface PlanActionButtonsProps {
  chatId: string;
  messageId: string;
  content: string;
  onAppendMessage?: (message: { role: "user"; content: string }) => Promise<void>;
}

export function PlanActionButtons({
  chatId,
  messageId,
  content,
  onAppendMessage,
}: PlanActionButtonsProps) {
  const [state, setState] = useState<PlanActionState>("idle");
  const [showImproveInput, setShowImproveInput] = useState(false);
  const [improveText, setImproveText] = useState("");

  // Check if content contains a plan
  const hasPlan =
    typeof content === "string" &&
    (content.includes("Mam plan!") ||
      content.includes("Mój plan:") ||
      content.includes("Plan:") ||
      content.includes("plan:") ||
      content.match(/\d+\)/)); // Contains numbered steps

  if (!hasPlan) {
    return null;
  }

  const handleExecutePlan = async () => {
    if (state !== "idle" || !onAppendMessage) return;

    setState("executing");

    try {
      // Send confirmation message to execute the plan
      await onAppendMessage({
        role: "user",
        content: "Plan jest ok. Wykonaj go.",
      });
    } catch (error) {
      console.error("Failed to execute plan:", error);
      setState("idle");
    }
  };

  const handleImprovePlan = async () => {
    if (state !== "idle" || !onAppendMessage) return;

    if (!showImproveInput) {
      // Show input field
      setShowImproveInput(true);
      return;
    }

    // Send improvement request
    setState("improving");

    try {
      const improvementMessage = improveText.trim()
        ? `Popraw plan: ${improveText}`
        : "Popraw plan";

      await onAppendMessage({
        role: "user",
        content: improvementMessage,
      });

      setShowImproveInput(false);
      setImproveText("");
    } catch (error) {
      console.error("Failed to improve plan:", error);
      setState("idle");
    }
  };

  const handleCancelImprove = () => {
    setShowImproveInput(false);
    setImproveText("");
    setState("idle");
  };

  if (state === "executing" || state === "improving") {
    return (
      <div className="flex items-center gap-2 text-sm text-tttr-text-caption font-secondary mt-2">
        <span>
          {state === "executing" ? "Wykonywanie planu..." : "Poprawianie planu..."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleExecutePlan}
          disabled={state !== "idle"}
          className="h-8 px-3 bg-tttr-purple hover:bg-tttr-purple-hover text-white font-primary rounded-tttr-8"
        >
          <Play className="h-4 w-4 mr-1" />
          Wykonaj plan
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImprovePlan}
          disabled={state !== "idle"}
          className="h-8 px-3 bg-tttr-beige-mid hover:bg-tttr-beige text-tttr-text-paragraph border-0 font-primary rounded-tttr-8"
        >
          <Edit className="h-4 w-4 mr-1" />
          Popraw plan
        </Button>
      </div>
      {showImproveInput && state === "idle" && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Co chcesz zmienić w planie? (opcjonalnie)"
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImprovePlan}
              disabled={state !== "idle"}
            >
              Wyślij
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelImprove}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

