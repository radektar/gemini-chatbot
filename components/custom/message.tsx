"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { MondayBoard } from "../tools/monday-board";
import { MondayTask } from "../tools/monday-task";
import { SlackChannels } from "../tools/slack-channels";
import { SlackMessages } from "../tools/slack-messages";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
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
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : toolName === "list_boards" || toolName === "listMondayBoards" ? (
                      <MondayBoard result={result} />
                    ) : toolName === "get_board_items" || toolName === "get_item_details" || toolName === "getMondayTasks" || toolName === "getMondayTaskDetails" ? (
                      <MondayTask result={result} />
                    ) : toolName === "searchSlackHistory" ? (
                      <SlackMessages result={result} />
                    ) : toolName === "getSlackChannels" ? (
                      <SlackChannels result={result} />
                    ) : (
                      <div className="bg-card rounded-lg p-4 border">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "getWeather" ? (
                      <Weather />
                    ) : toolName === "list_boards" || toolName === "listMondayBoards" ? (
                      <MondayBoard result={{ boards: [] }} />
                    ) : toolName === "get_board_items" || toolName === "get_item_details" || toolName === "getMondayTasks" || toolName === "getMondayTaskDetails" ? (
                      <MondayTask result={{ tasks: [] }} />
                    ) : toolName === "searchSlackHistory" ? (
                      <SlackMessages result={{ results: [] }} />
                    ) : toolName === "getSlackChannels" ? (
                      <SlackChannels result={{ channels: [] }} />
                    ) : (
                      <div className="bg-muted rounded-lg p-4 h-20 animate-pulse" />
                    )}
                  </div>
                );
              }
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
      </div>
    </motion.div>
  );
};
