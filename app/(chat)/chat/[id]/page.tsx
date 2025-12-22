import { CoreMessage, Message } from "ai";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: any }) {
  const session = await auth();
  if (!session || !session.user) {
    notFound(); // Middleware should redirect, but this is a safety check
  }

  const { id } = params;
  const chatFromDb = await getChatById({ id });

  // If chat doesn't exist, show 404
  if (!chatFromDb) {
    notFound();
  }

  // Security: Check if chat belongs to current user
  if (chatFromDb.userId !== session.user.id) {
    notFound(); // Don't reveal that chat exists, just show 404
  }

  // Parse messages from JSON and convert to UI format
  let initialMessages: Array<Message> = [];
  try {
    const messages = typeof chatFromDb.messages === 'string' 
      ? JSON.parse(chatFromDb.messages) 
      : chatFromDb.messages;
    initialMessages = convertToUIMessages(messages as Array<CoreMessage>);
  } catch (error) {
    console.error("Failed to parse chat messages:", error);
    // If parsing fails, show empty chat
    initialMessages = [];
  }

  return <PreviewChat id={id} initialMessages={initialMessages} />;
}
