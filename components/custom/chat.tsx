"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useState } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";

import { MultimodalInput } from "./multimodal-input";
import { TTTRHero } from "./tttr-hero";
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

  type Phase = "analyzing" | "fetching" | "preparing";

  const getLoadingPhase = (): Phase => {
    const lastMessage = messages[messages.length - 1];

    // Faza 2: Aktywne tool invocations
    if (lastMessage?.role === "assistant" && lastMessage.toolInvocations?.length) {
      const hasActiveTools = lastMessage.toolInvocations.some(
        (inv) => inv.state !== "result"
      );
      if (hasActiveTools) return "fetching";
    }

    // Faza 3: Tools zakończone, treść w trakcie generowania
    if (lastMessage?.role === "assistant" && lastMessage.toolInvocations?.length) {
      const allToolsDone = lastMessage.toolInvocations.every(
        (inv) => inv.state === "result"
      );
      if (allToolsDone) return "preparing";
    }

    // Faza 1: Początek analizy
    return "analyzing";
  };

  const isStartScreen = messages.length === 0;

  return (
    <div className={`flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-tttr-beige-light`}>
      <div className={`flex flex-col justify-between items-center gap-4 ${isStartScreen ? 'w-full h-full' : 'w-full h-full'}`}>
        <div
          ref={messagesContainerRef}
          className={`flex flex-col gap-4 ${isStartScreen ? 'items-center w-full flex-1' : 'items-stretch flex-1 w-full max-w-[900px] mx-auto overflow-y-auto scrollbar-hide px-4 md:px-8'}`}
        >
          {isStartScreen && (
            <TTTRHero
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
          )}

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

          {/* Show typing indicator when loading and no assistant message yet or last message is empty or has active tool invocations */}
          {isLoading && (() => {
            const lastMessage = messages[messages.length - 1];
            const hasActiveToolInvocations = lastMessage?.role === "assistant" && 
              lastMessage.toolInvocations?.some((inv) => inv.state !== "result");
            const shouldShowIndicator = 
              !lastMessage || 
              lastMessage.role !== "assistant" || 
              (typeof lastMessage.content === "string" && lastMessage.content.trim() === "") ||
              hasActiveToolInvocations;
            
            return shouldShowIndicator ? <TypingIndicator phase={getLoadingPhase()} /> : null;
          })()}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        {!isStartScreen && (
          <form className="flex flex-row gap-2 relative items-end w-full max-w-[calc(100dvw-32px)] px-4 md:px-0 md:max-w-[800px]">
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
        )}
      </div>
    </div>
  );
}
