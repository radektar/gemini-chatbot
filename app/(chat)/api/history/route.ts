// PoC: Auth removed
// import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/db/queries";

export async function GET() {
  // PoC: Skip authentication, return empty array (no persisted history)
  // const session = await auth();
  // if (!session || !session.user) {
  //   return Response.json("Unauthorized!", { status: 401 });
  // }

  // PoC: Return empty array - no persisted chats
  return Response.json([]);
}
