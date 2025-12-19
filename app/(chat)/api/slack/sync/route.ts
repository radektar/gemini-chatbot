// PoC: Slack integration disabled
import { auth } from "@/app/(auth)/auth";
// import { syncAllChannels, syncChannel } from "@/integrations/slack/sync";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // PoC: Slack integration disabled
  return Response.json(
    {
      success: false,
      error: "Slack integration is disabled in PoC mode",
    },
    { status: 503 }
  );

  // PoC: Slack integration disabled
  // try {
  //   const { channelId } = await request.json().catch(() => ({}));
  //
  //   let result;
  //   if (channelId) {
  //     result = await syncChannel(channelId);
  //   } else {
  //     result = await syncAllChannels();
  //   }
  //
  //   if (result.success) {
  //     return Response.json(result);
  //   } else {
  //     return Response.json(result, { status: 500 });
  //   }
  // } catch (error) {
  //   console.error("Error syncing Slack:", error);
  //   return Response.json(
  //     {
  //       success: false,
  //       error: error instanceof Error ? error.message : "Unknown error",
  //     },
  //     { status: 500 }
  //   );
  // }
}

