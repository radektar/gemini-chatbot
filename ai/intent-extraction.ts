import { generateObject } from "ai";
import { z } from "zod";
import { geminiProModel } from "@/ai";
import { QueryContext } from "./types";

// Message type for conversation history
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const QueryContextSchema = z.object({
  intent: z.object({
    action: z.enum(["find", "analyze", "generate", "compare", "summarize", "explain"]),
    object: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  dataSources: z.object({
    primary: z.enum(["monday", "slack", "impactlog", "unknown"]).optional(),
    filters: z.record(z.any()).optional(),
    confidence: z.number().min(0).max(1),
  }),
  audience: z.object({
    type: z.enum(["donor", "partner", "internal", "unknown"]).optional(),
    purpose: z.string().optional(),
    confidence: z.number().min(0).max(1),
  }),
  output: z.object({
    format: z.enum(["narrative", "bullets", "table", "email", "raw"]).optional(),
    length: z.enum(["short", "medium", "long"]).optional(),
    confidence: z.number().min(0).max(1),
  }),
  averageConfidence: z.number().min(0).max(1),
});

/**
 * Build conversation context from recent messages.
 * This helps accumulate information from multiple user messages.
 */
function buildConversationContext(messages: ConversationMessage[]): string {
  if (messages.length <= 1) {
    return "";
  }
  
  // Get last 6 messages (3 exchanges) for context
  const recentMessages = messages.slice(-6);
  
  // Build context string showing the conversation flow
  const contextParts: string[] = [];
  for (const msg of recentMessages.slice(0, -1)) { // Exclude last message (it's the current query)
    const role = msg.role === "user" ? "User" : "Assistant";
    contextParts.push(`${role}: ${msg.content}`);
  }
  
  if (contextParts.length === 0) {
    return "";
  }
  
  return `
PREVIOUS CONVERSATION (use this to understand accumulated context):
${contextParts.join("\n")}
---
`;
}

/**
 * Extract intent from user query with conversation context.
 * @param userMessage - The current user message
 * @param conversationHistory - Optional array of previous messages for context
 */
export async function extractIntent(
  userMessage: string,
  conversationHistory?: ConversationMessage[]
): Promise<QueryContext> {
  
  const conversationContext = conversationHistory 
    ? buildConversationContext(conversationHistory) 
    : "";
  
  const { object } = await generateObject({
    model: geminiProModel,
    schema: QueryContextSchema,
    prompt: `
You are an expert at extracting intent from user queries. Analyze the following query and extract all available information, assigning a confidence level (0-1) to each element.

${conversationContext}
CURRENT USER QUERY: "${userMessage}"

CRITICAL - ACCUMULATE CONTEXT FROM CONVERSATION:
- If the user has clarified details in previous messages (e.g., "in progress", "Monday", "educational"), USE THAT INFORMATION
- Each clarification ADDS to the context - don't treat messages in isolation
- Example: User says "Show projects" → Assistant asks → User says "in progress" → User says "in Monday"
  This means: find projects with status="in progress" from Monday.com

Extract:
1. **Intent**: 
   - action: what does the user want to do? (find, analyze, generate, compare, summarize, explain)
   - object: what is the query about? (e.g., "project", "metric", "email", "report")
   - confidence: how confident are you in the interpretation? (0-1)

2. **DataSources**:
   - primary: where to get data from? (monday, slack, impactlog, unknown)
   - filters: what filters to apply? (geography, status, timeRange, theme/type, etc.)
   - confidence: how confident are you about the data source? (0-1)

3. **Audience**:
   - type: for whom? (donor, partner, internal, unknown)
   - purpose: what is the purpose? (e.g., "meeting", "report", "pitch")
   - confidence: how confident are you about the audience? (0-1)

4. **Output**:
   - format: what format? (narrative, bullets, table, email, raw)
   - length: what length? (short, medium, long)
   - confidence: how confident are you about the format? (0-1)

5. **averageConfidence**: average of all confidence scores (will be recalculated with weights in code)

CONFIDENCE RULES (BALANCED - not too strict):

1. **DataSources confidence** - ACTIONABLE QUERIES:
   - If data source is EXPLICIT (user says "Monday", "Slack") AND has at least 1 filter → confidence >= 0.7
   - If data source is EXPLICIT but no filters → confidence 0.5-0.6
   - If data source is IMPLICIT (inferred from context like "projects") → confidence 0.4-0.6
   - If data source is unknown → confidence < 0.4
   
   FILTER EXAMPLES (each counts as 1 filter):
   - status: "in progress", "w trakcie", "completed", "opóźnione"
   - type/theme: "educational", "edukacyjne", "health", "zdrowotne"
   - geography: "Kenya", "Kenia", "Uganda", "Tanzania"
   - time: "this month", "last week", "2024"
   - person: "assigned to X", "managed by Y"

2. **Intent confidence**:
   - Clear action verbs ("show", "find", "list", "get") with an object → confidence >= 0.7
   - General queries with context from conversation → confidence >= 0.6
   - Very vague single words → confidence < 0.5

3. **Audience confidence**:
   - If type = "unknown" but query is actionable → confidence = 0.5 (default to internal)
   - Explicit audience ("for donor", "dla partnera") → confidence >= 0.8

4. **Output confidence**:
   - If format is not specified → confidence = 0.5 (default to bullets/narrative)
   - Explicit format ("as table", "jako listę") → confidence >= 0.8

5. **KEY PRINCIPLE - ACTIONABLE = PROCEED**:
   - If user has specified: DATA SOURCE + at least 1 FILTER → query is ACTIONABLE
   - "Show me in progress projects in Monday" = Monday (explicit) + status filter = ACTIONABLE (confidence >= 0.7)
   - "Educational projects in Monday" = Monday (explicit) + type filter = ACTIONABLE (confidence >= 0.7)
   - Don't require perfect clarity - if we can execute the query, confidence should be high enough

EVALUATION EXAMPLES:
- "Show projects" (no context) → dataSources.confidence = 0.4, intent.confidence = 0.5
- "in progress" (after asking) → Accumulate: dataSources.confidence = 0.6 (has status filter)
- "Show me in progress projects in Monday" → dataSources.confidence = 0.75 (explicit source + filter)
- "Educational projects in progress in Monday" → dataSources.confidence = 0.85 (explicit + 2 filters)
- "Find projects in Kenya from Monday" → dataSources.confidence = 0.75 (explicit + geography filter)
`,
  });

  const queryContext = object as QueryContext;

  // Calculate weighted average with balanced weights
  // Weights: intent (30%), dataSources (40%), audience (15%), output (15%)
  // Reduced dataSources weight so missing audience/output don't penalize too much
  const weightedAverage = (
    queryContext.intent.confidence * 0.30 +
    queryContext.dataSources.confidence * 0.40 +
    queryContext.audience.confidence * 0.15 +
    queryContext.output.confidence * 0.15
  );

  // ACTIONABLE QUERY BOOST:
  // If intent is clear (>=0.6) AND dataSources is actionable (>=0.6), 
  // ensure average is at least 0.65 so we proceed with a plan
  const isActionable = 
    queryContext.intent.confidence >= 0.6 && 
    queryContext.dataSources.confidence >= 0.6;
  
  if (isActionable) {
    queryContext.averageConfidence = Math.max(weightedAverage, 0.65);
  } else if (queryContext.dataSources.confidence < 0.4) {
    // Only penalize if dataSources is really unclear
    queryContext.averageConfidence = Math.min(weightedAverage, 0.55);
  } else {
    queryContext.averageConfidence = weightedAverage;
  }

  return queryContext;
}


