"use client";

import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FeedbackState = "idle" | "submitting" | "submitted";

interface FeedbackButtonsProps {
  chatId: string;
  messageId: string;
  userQuery?: string;
  assistantResponse?: string;
  toolsUsed?: Array<any>;
}

export function FeedbackButtons({
  chatId,
  messageId,
  userQuery,
  assistantResponse,
  toolsUsed,
}: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const handleFeedback = async (selectedRating: 1 | -1) => {
    if (state !== "idle") return;

    // Jeśli 👎 i jeszcze nie pokazano pola komentarza, pokaż je
    if (selectedRating === -1 && !showComment) {
      setShowComment(true);
      setRating(-1);
      return;
    }

    setState("submitting");
    setRating(selectedRating);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          messageId,
          rating: selectedRating,
          comment: selectedRating === -1 && comment ? comment : undefined,
          userQuery,
          assistantResponse,
          toolsUsed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Feedback API error:", response.status, errorData);
        throw new Error(`Failed to save feedback: ${errorData.error || response.statusText}`);
      }

      setState("submitted");
      setShowComment(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setState("idle");
      setRating(null);
    }
  };

  if (state === "submitted") {
    return (
      <div className="flex items-center gap-2 text-sm text-tttr-green-light font-secondary mt-2">
        <Check className="h-4 w-4 text-tttr-green-light" />
        <span>Dziękujemy za opinię!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(1)}
          disabled={state === "submitting"}
          className={`h-8 px-2 ${state === "submitting" && rating === 1 ? "opacity-50 cursor-wait" : ""}`}
        >
          <ThumbsUp className="h-4 w-4 text-tttr-interface-icon" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(-1)}
          disabled={state === "submitting"}
          className={`h-8 px-2 ${state === "submitting" && rating === -1 ? "opacity-50 cursor-wait" : ""}`}
        >
          <ThumbsDown className="h-4 w-4 text-tttr-interface-icon" />
        </Button>
        {state === "submitting" && (
          <span className="text-xs text-tttr-text-caption font-secondary ml-2">Zapisywanie...</span>
        )}
      </div>
      {showComment && rating === -1 && state === "idle" && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Co możemy poprawić? (opcjonalnie)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm font-secondary text-tttr-text-paragraph bg-tttr-white border-none rounded-lg"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(-1)}
              disabled={false}
            >
              Wyślij
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComment(false);
                setComment("");
                setRating(null);
              }}
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

