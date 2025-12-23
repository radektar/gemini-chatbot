"use client";

import { Attachment, Message, useChat } from "ai/react";
import { useState } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";

import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { TypingIndicator } from "./typing-indicator";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id,
      body: { id },
      initialMessages,
      maxSteps: 10,
      onFinish: () => {
        window.history.replaceState({}, "", `/chat/${id}`);
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && <Overview />}

          {messages.map((message, index) => {
            // Znajdź poprzednią wiadomość użytkownika dla odpowiedzi assistant
            let userQuery: string | undefined;
            if (message.role === "assistant") {
              // Szukaj wstecz od aktualnej wiadomości
              for (let i = index - 1; i >= 0; i--) {
                if (messages[i].role === "user") {
                  userQuery =
                    typeof messages[i].content === "string"
                      ? messages[i].content
                      : undefined;
                  break;
                }
              }
            }

            // Sprawdź czy to ostatnia wiadomość assistant
            // Szukamy wstecz od końca, aby znaleźć ostatnią wiadomość assistant
            const isLastAssistantMessage = (() => {
              if (message.role !== "assistant") return false;
              // Sprawdź czy po tej wiadomości nie ma już innych wiadomości assistant
              for (let i = index + 1; i < messages.length; i++) {
                if (messages[i].role === "assistant") {
                  return false;
                }
              }
              return true;
            })();

            return (
              <PreviewMessage
                key={message.id}
                chatId={id}
                messageId={message.id}
                role={message.role}
                content={message.content}
                attachments={message.experimental_attachments}
                toolInvocations={message.toolInvocations}
                userQuery={userQuery}
                assistantResponse={
                  message.role === "assistant" &&
                  typeof message.content === "string"
                    ? message.content
                    : undefined
                }
                isLastMessage={isLastAssistantMessage}
                onAppendMessage={async (msg) => {
                  await append(msg);
                }}
              />
            );
          })}

          {/* Show typing indicator when loading and no assistant message yet or last message is empty */}
          {isLoading && (() => {
            const lastMessage = messages[messages.length - 1];
            const shouldShowIndicator = 
              !lastMessage || 
              lastMessage.role !== "assistant" || 
              (typeof lastMessage.content === "string" && lastMessage.content.trim() === "");
            
            return shouldShowIndicator ? <TypingIndicator /> : null;
          })()}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>
    </div>
  );
}
