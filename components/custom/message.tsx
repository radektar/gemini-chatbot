"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

import { ClarificationSuggestions } from "./clarification-suggestions";
import { FeedbackButtons } from "./feedback-buttons";
import { BotIcon, UserIcon } from "./icons";
import { PlanActionButtons } from "./plan-action-buttons";
import { PreviewAttachment } from "./preview-attachment";

export const Message = ({
  chatId,
  messageId,
  role,
  content,
  toolInvocations,
  attachments,
  userQuery,
  assistantResponse,
  isLastMessage,
  onAppendMessage,
}: {
  chatId: string;
  messageId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  userQuery?: string;
  assistantResponse?: string;
  isLastMessage?: boolean;
  onAppendMessage?: (message: { role: "user"; content: string }) => Promise<void>;
}) => {
  const toolsUsed = toolInvocations?.map((inv) => inv.toolName) || [];
  
  // Check if this is a status message that should be hidden
  const isStatusMessage = (content: string): boolean => {
    if (!content || typeof content !== "string") return false;
    const statusPatterns = [
      /^zaraz\s+/i,
      /^teraz\s+/i,
      /^rozumiem\s+/i,
      /^pozwól\s+/i,
      /^znalazłem\s+/i,
      /^sprawdzę\s+/i,
      /^pobiorę\s+/i,
      /^szukam\s+/i,
      /^najpierw\s+/i,
      /\s+teraz\s+sprawdzę/i,
      /\s+zaraz\s+sprawdzę/i,
      /\s+teraz\s+pobiorę/i,
      /\s+zaraz\s+pobiorę/i,
      /sprawdzę\s+dostępną/i,
      /znalazłem\s+tablicę/i,
    ];
    return statusPatterns.some(pattern => pattern.test(content.trim()));
  };
  
  // Hide status messages that have active tool invocations
  const shouldHideContent = role === "assistant" && 
    typeof content === "string" && 
    isStatusMessage(content) &&
    toolInvocations && 
    toolInvocations.some(inv => inv.state !== "result");
  
  // Check if this is a clarification message (no tools, contains suggestions)
  const isClarificationMessage = 
    role === "assistant" && 
    isLastMessage &&
    (!toolInvocations || toolInvocations.length === 0) &&
    typeof content === "string" &&
    (content.includes('np.') || content.includes('proponuję') || content.includes('możesz'));
  
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:max-w-[800px] md:px-0 first-of-type:pt-20 ${role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border border-tttr-interface-divider rounded-tttr-8 p-1 flex flex-col justify-center items-center shrink-0 text-tttr-purple">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {content && typeof content === "string" && !shouldHideContent && (
          <div className={`text-tttr-text-paragraph font-secondary leading-[1.7] flex flex-col gap-4 ${role === "assistant" ? "bg-tttr-surface-light rounded-tttr-12 p-4" : "bg-tttr-purple/5 rounded-tttr-12 p-4"}`}>
            <Streamdown>{content}</Streamdown>
          </div>
        )}
        
        {/* Status messages are hidden - typing indicator will show instead */}
        {shouldHideContent && (
          <div className="text-sm text-tttr-text-caption italic">
            System pracuje...
          </div>
        )}

        {attachments && (
          <div className="flex flex-row gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}

        {role === "assistant" && isLastMessage && (
          <>
            {/* Show clarification suggestions if this is a clarification message */}
            {isClarificationMessage && typeof content === "string" && onAppendMessage && (
              <ClarificationSuggestions
                content={content}
                onAppendMessage={onAppendMessage}
              />
            )}
            {/* Show plan action buttons only if plan is present and not yet executed */}
            {(!toolInvocations || toolInvocations.length === 0) && (
              <PlanActionButtons
                chatId={chatId}
                messageId={messageId}
                content={typeof content === "string" ? content : ""}
                onAppendMessage={onAppendMessage}
              />
            )}
            {/* Show feedback buttons after plan execution or final response */}
            {((toolInvocations && toolInvocations.length > 0) || 
              (typeof content === "string" && content.length > 0)) && (
              <FeedbackButtons
                chatId={chatId}
                messageId={messageId}
                userQuery={userQuery}
                assistantResponse={
                  assistantResponse ||
                  (typeof content === "string" ? content : undefined)
                }
                toolsUsed={toolsUsed}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
