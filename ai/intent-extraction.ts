import { generateObject } from "ai";
import { z } from "zod";
import { geminiProModel } from "@/ai";
import { QueryContext } from "./types";

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

export async function extractIntent(userMessage: string): Promise<QueryContext> {
  const { object } = await generateObject({
    model: geminiProModel,
    schema: QueryContextSchema,
    prompt: `
You are an expert at extracting intent from user queries. Analyze the following query and extract all available information, assigning a confidence level (0-1) to each element.

User query: "${userMessage}"

Extract:
1. **Intent**: 
   - action: what does the user want to do? (find, analyze, generate, compare, summarize, explain)
   - object: what is the query about? (e.g., "project", "metric", "email", "report")
   - confidence: how confident are you in the interpretation? (0-1)

2. **DataSources**:
   - primary: where to get data from? (monday, slack, impactlog, unknown)
   - filters: what filters to apply? (geography, status, timeRange, etc.)
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

IMPORTANT - STRICT CONFIDENCE RULES:

1. **DataSources confidence** - CRITICAL for queries about projects/data:
   - If the query is about projects/data from Monday.com:
     * NO FILTERS (geography, status, theme, time period) → confidence MUST be < 0.4
     * Only 1 filter → confidence < 0.5
     * 2-3 filters → confidence 0.5-0.7
     * 4+ filters or very specific → confidence >= 0.7
   - General queries like "show projects", "find projects", "show all projects" WITHOUT filters → confidence < 0.4
   - If primary = "unknown" → confidence < 0.3
   - If primary = "monday" but no filters for project queries → confidence < 0.4

2. **Intent confidence**:
   - General actions ("find", "show") without context → confidence < 0.6
   - Specific actions with context ("find projects in Kenya", "find educational projects") → confidence >= 0.7

3. **Audience confidence**:
   - If type = "unknown" → confidence < 0.3
   - If purpose is missing → confidence < 0.5

4. **Output confidence**:
   - If format is not specified → confidence < 0.5

5. **Evaluation examples**:
   - "Show projects" → dataSources.confidence < 0.4 (no filters), intent.confidence < 0.6 (general)
   - "Find educational projects in Kenya" → dataSources.confidence >= 0.7 (2 filters: theme + geography), intent.confidence >= 0.7
   - "How many beneficiaries does project X have?" → dataSources.confidence >= 0.7 (specific project), intent.confidence >= 0.7

REMEMBER: Be STRICT - it's better to have too low confidence than too high for unclear queries!
`,
  });

  const queryContext = object as QueryContext;

  // Oblicz ważoną średnią zamiast prostej średniej
  // Wagi: dataSources (50%), intent (20%), audience (15%), output (15%)
  // DataSources ma największą wagę bo brak filtrów jest krytyczny
  const weightedAverage = (
    queryContext.intent.confidence * 0.2 +
    queryContext.dataSources.confidence * 0.5 +
    queryContext.audience.confidence * 0.15 +
    queryContext.output.confidence * 0.15
  );

  // Dodatkowa korekta: jeśli dataSources ma bardzo niską confidence (< 0.4), 
  // obniż averageConfidence jeszcze bardziej
  if (queryContext.dataSources.confidence < 0.4) {
    queryContext.averageConfidence = Math.min(weightedAverage, 0.55);
  } else {
    queryContext.averageConfidence = weightedAverage;
  }

  return queryContext;
}


