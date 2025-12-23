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
Jesteś ekspertem od ekstrakcji intencji z zapytań użytkowników. Przeanalizuj poniższe zapytanie i wyekstrahuj wszystkie dostępne informacje, przypisując każdemu elementowi poziom pewności (confidence) od 0 do 1.

Zapytanie użytkownika: "${userMessage}"

Wyekstrahuj:
1. **Intent (intencja)**: 
   - action: co użytkownik chce zrobić? (find, analyze, generate, compare, summarize, explain)
   - object: czego dotyczy zapytanie? (np. "projekt", "metryka", "mail", "raport")
   - confidence: jak pewny jesteś interpretacji? (0-1)

2. **DataSources (źródła danych)**:
   - primary: skąd brać dane? (monday, slack, impactlog, unknown)
   - filters: jakie filtry zastosować? (geography, status, timeRange, etc.)
   - confidence: jak pewny jesteś co do źródła? (0-1)

3. **Audience (odbiorca)**:
   - type: dla kogo? (donor, partner, internal, unknown)
   - purpose: jaki cel? (np. "spotkanie", "raport", "pitch")
   - confidence: jak pewny jesteś co do odbiorcy? (0-1)

4. **Output (format wyjściowy)**:
   - format: jaki format? (narrative, bullets, table, email, raw)
   - length: jaka długość? (short, medium, long)
   - confidence: jak pewny jesteś co do formatu? (0-1)

5. **averageConfidence**: średnia z wszystkich confidence scores

WAŻNE:
- Jeśli informacja nie jest jasna lub nieobecna, użyj niskiej confidence (< 0.5)
- Jeśli informacja jest jasna i jednoznaczna, użyj wysokiej confidence (>= 0.7)
- Jeśli informacja jest częściowo jasna, użyj średniej confidence (0.5-0.7)
- Dla brakujących informacji użyj wartości domyślnych i niskiej confidence
`,
  });

  return object as QueryContext;
}


