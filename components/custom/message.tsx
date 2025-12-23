"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { FeedbackButtons } from "./feedback-buttons";
import { PlanActionButtons } from "./plan-action-buttons";
import { ClarificationSuggestions } from "./clarification-suggestions";

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
  
  // Check if this is a clarification message (no tools, contains suggestions)
  const isClarificationMessage = 
    role === "assistant" && 
    isLastMessage &&
    (!toolInvocations || toolInvocations.length === 0) &&
    typeof content === "string" &&
    (content.includes('np.') || content.includes('proponuję') || content.includes('możesz'));
  
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            <Streamdown>{content}</Streamdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-2">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              // Only show loading indicator, hide results completely
              if (state !== "result") {
                const toolLabels: Record<string, string> = {
                  list_boards: "Szukam tablic w Monday.com...",
                  listMondayBoards: "Szukam tablic w Monday.com...",
                  get_board_items: "Pobieram zadania...",
                  get_item_details: "Analizuję szczegóły...",
                  getMondayTasks: "Pobieram zadania...",
                  getMondayTaskDetails: "Analizuję szczegóły...",
                  search_items_by_column_value: "Przeszukuję dane...",
                  searchSlackHistory: "Przeszukuję Slack...",
                  getSlackChannels: "Pobieram kanały Slack...",
                  getWeather: "Sprawdzam pogodę...",
                };

                return (
                  <div
                    key={toolCallId}
                    className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse"
                  >
                    <div className="size-2 bg-blue-500 rounded-full animate-ping" />
                    {toolLabels[toolName] || "Analizuję..."}
                  </div>
                );
              }

              // Hide results when complete - the model's text response will contain the processed info
              return null;
            })}
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
