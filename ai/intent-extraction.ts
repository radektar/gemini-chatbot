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

5. **averageConfidence**: średnia z wszystkich confidence scores (będzie przeliczona z wagami w kodzie)

WAŻNE - RYGORYSTYCZNE ZASADY CONFIDENCE:

1. **DataSources confidence** - KRYTYCZNE dla zapytań o projekty/dane:
   - Jeśli zapytanie dotyczy projektów/danych z Monday.com:
     * BRAK FILTRÓW (geografia, status, temat, okres) → confidence MUSI być < 0.4
     * Tylko 1 filtr → confidence < 0.5
     * 2-3 filtry → confidence 0.5-0.7
     * 4+ filtry lub bardzo konkretne → confidence >= 0.7
   - Ogólne zapytania typu "pokaż projekty", "znajdź projekty", "pokaż wszystkie projekty" BEZ filtrów → confidence < 0.4
   - Jeśli primary = "unknown" → confidence < 0.3
   - Jeśli primary = "monday" ale brak filtrów dla zapytań o projekty → confidence < 0.4

2. **Intent confidence**:
   - Ogólne akcje ("find", "show", "pokaż") bez kontekstu → confidence < 0.6
   - Konkretne akcje z kontekstem ("find projects in Kenya", "znajdź projekty edukacyjne") → confidence >= 0.7

3. **Audience confidence**:
   - Jeśli type = "unknown" → confidence < 0.3
   - Jeśli brak purpose → confidence < 0.5

4. **Output confidence**:
   - Jeśli format nie jest określony → confidence < 0.5

5. **Przykłady oceny**:
   - "Pokaż projekty" → dataSources.confidence < 0.4 (brak filtrów), intent.confidence < 0.6 (ogólne)
   - "Znajdź projekty edukacyjne w Kenii" → dataSources.confidence >= 0.7 (2 filtry: temat + geografia), intent.confidence >= 0.7
   - "Ile beneficjentów ma projekt X?" → dataSources.confidence >= 0.7 (konkretny projekt), intent.confidence >= 0.7

PAMIĘTAJ: Bądź RYGORYSTYCZNY - lepiej mieć zbyt niską confidence niż zbyt wysoką dla niejasnych zapytań!
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


