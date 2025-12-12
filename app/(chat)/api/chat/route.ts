import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { getMondayMCPTools, callMondayMCPTool } from "@/integrations/mcp/init";

// PoC: Auth removed
// import { auth } from "@/app/(auth)/auth";
// PoC: DB queries removed
// import { deleteChatById, getChatById, saveChat } from "@/db/queries";
// PoC: Slack integration removed
// import { slackTools } from "@/integrations";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  // PoC: Skip authentication check
  // const session = await auth();
  // if (!session) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Get Monday.com MCP tools
  let mondayToolsForAI: Record<string, any> = {};
  
  try {
    const mcpTools = await getMondayMCPTools();
    
    // Convert MCP tools to AI SDK format
    for (const tool of mcpTools) {
      // MCP tools have structure: { name, description, inputSchema }
      const inputSchema = tool.inputSchema || {};
      const properties = inputSchema.properties || {};
      
      // Build Zod schema from MCP input schema
      const zodProperties: Record<string, z.ZodTypeAny> = {};
      const required = inputSchema.required || [];
      
      for (const [key, value] of Object.entries(properties)) {
        const prop = value as any;
        let zodType: z.ZodTypeAny;
        
        if (prop.type === "string") {
          zodType = z.string();
        } else if (prop.type === "number" || prop.type === "integer") {
          zodType = z.number();
        } else if (prop.type === "boolean") {
          zodType = z.boolean();
        } else if (prop.type === "array") {
          // Google Gemini requires proper items type for arrays
          // Check if MCP schema provides items type, otherwise default to string
          const itemsType = prop.items?.type;
          if (itemsType === "number" || itemsType === "integer") {
            zodType = z.array(z.number());
          } else if (itemsType === "boolean") {
            zodType = z.array(z.boolean());
          } else if (itemsType === "object") {
            zodType = z.array(z.record(z.string(), z.unknown()));
          } else {
            // Default to string array (most common and safest)
            zodType = z.array(z.string());
          }
        } else if (prop.type === "object") {
          zodType = z.record(z.string(), z.unknown());
        } else {
          // For unknown types, use string as the safest default
          zodType = z.string();
        }
        
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        
        if (!required.includes(key)) {
          zodType = zodType.optional();
        }
        
        zodProperties[key] = zodType;
      }
      
      mondayToolsForAI[tool.name] = {
        description: tool.description || tool.name,
        parameters: z.object(zodProperties),
        execute: async (args: Record<string, any>) => {
          try {
            const result = await callMondayMCPTool(tool.name, args);
            // Result is already processed by MCP client
            return result;
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : "Failed to execute tool",
            };
          }
        },
      };
    }
  } catch (error) {
    console.error("Failed to load Monday.com MCP tools:", error);
    // Fallback: use empty tools object, will log error but won't crash
  }

  const result = await streamText({
    model: geminiProModel,
    system: `
      Jesteś asystentem organizacyjnym. Pomagasz pracownikom w:
      - Przeglądaniu zadań z Monday.com (używając MCP - TYLKO ODCZYT)
      
      WAŻNE: Integracja z Monday.com jest TYLKO DO ODCZYTU. 
      Nie możesz tworzyć, modyfikować ani usuwać danych w Monday.com.
      Jeśli użytkownik prosi o zmiany, wyjaśnij że dostęp jest tylko do odczytu.
      
      PoC: Dostęp ograniczony do boardu ID 5088645756 (konto testowe).
      
      Dzisiejsza data: ${new Date().toLocaleDateString('pl-PL')}.
      
      Odpowiadaj zwięźle i konkretnie. Używaj narzędzi, gdy użytkownik prosi o dostęp do danych z Monday.
    `,
    messages: coreMessages,
    tools: {
      getWeather: {
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number().describe("Latitude coordinate"),
          longitude: z.number().describe("Longitude coordinate"),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
          );

          const weatherData = await response.json();
          return weatherData;
        },
      },
      ...mondayToolsForAI,
      // PoC: Slack integration removed
      // ...slackTools,
    },
    // PoC: Skip saving to database
    // onFinish: async ({ responseMessages }) => {
    //   if (session.user && session.user.id) {
    //     try {
    //       await saveChat({
    //         id,
    //         messages: [...coreMessages, ...responseMessages],
    //         userId: session.user.id,
    //       });
    //     } catch (error) {
    //       console.error("Failed to save chat");
    //     }
    //   }
    // },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse();
}

export async function DELETE(request: Request) {
  // PoC: Simplified DELETE (no DB, no auth)
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  // PoC: No authentication or database persistence
  console.log("[PoC] Mock deleteChat:", id);
  return new Response("Chat deleted (PoC - not persisted)", { status: 200 });
}
