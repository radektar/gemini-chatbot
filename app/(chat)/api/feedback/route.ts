import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { saveFeedback, getFeedbackStats } from "@/db/queries";

const feedbackSchema = z.object({
  chatId: z.string().optional(),
  messageId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().optional(),
  userQuery: z.string().optional(),
  assistantResponse: z.string().optional(),
  toolsUsed: z.array(z.any()).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    try {
      const result = await saveFeedback({
        chatId: validatedData.chatId,
        userId: session.user.id,
        messageId: validatedData.messageId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        userQuery: validatedData.userQuery,
        assistantResponse: validatedData.assistantResponse,
        toolsUsed: validatedData.toolsUsed,
      });
      
      // If saveFeedback returns undefined, DB is not configured (PoC mode)
      if (result === undefined) {
        console.warn("⚠️  Database not configured - feedback not saved (PoC mode)");
        return Response.json({ success: true, message: "Feedback received (database not configured)" });
      }
    } catch (dbError: any) {
      // Graceful degradation: if DB is not configured or table doesn't exist, still return success (PoC mode)
      const errorMessage = dbError?.message || String(dbError);
      const errorCode = dbError?.code;
      
      // Log the full error for debugging
      console.error("Database error when saving feedback:", {
        message: errorMessage,
        code: errorCode,
        error: dbError,
      });
      
      // Handle all database errors gracefully - return success even if DB fails
      // This allows the app to work in PoC mode without a fully configured database
      if (
        (dbError instanceof Error && errorMessage.includes("Database not configured")) ||
        errorCode === "42P01" || // PostgreSQL error: relation does not exist
        errorCode === "23503" || // PostgreSQL error: foreign key violation
        errorCode === "23505" || // PostgreSQL error: unique violation
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("foreign key") ||
        errorMessage.includes("constraint")
      ) {
        console.warn("⚠️  Database error - feedback not saved (PoC mode)", {
          error: errorMessage,
          code: errorCode,
        });
        return Response.json({ success: true, message: "Feedback received (database error - not saved)" });
      }
      
      // For any other database error, also return success (graceful degradation)
      console.warn("⚠️  Unknown database error - feedback not saved (PoC mode)", {
        error: errorMessage,
        code: errorCode,
      });
      return Response.json({ success: true, message: "Feedback received (database error - not saved)" });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to save feedback:", error);
    return Response.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || undefined;

    const stats = await getFeedbackStats(period);
    return Response.json(stats);
  } catch (error) {
    console.error("Failed to get feedback stats:", error);
    return Response.json(
      { error: "Failed to get feedback stats" },
      { status: 500 }
    );
  }
}


