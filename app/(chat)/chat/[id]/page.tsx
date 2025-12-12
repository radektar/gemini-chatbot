import { CoreMessage } from "ai";
import { notFound } from "next/navigation";

// PoC: Auth removed
// import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { Chat } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  const chatFromDb = await getChatById({ id });

  // PoC: No persisted chats, always show empty chat
  // In PoC, we don't have persisted chats, so always show empty chat
  return <PreviewChat id={id} initialMessages={[]} />;
}
