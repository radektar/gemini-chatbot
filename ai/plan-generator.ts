import { generateText } from "ai";
import { geminiProModel } from "@/ai";
import { QueryContext } from "./types";

export async function generatePlan(queryContext: QueryContext): Promise<string> {
  const { text } = await generateText({
    model: geminiProModel,
    prompt: `
Na podstawie poniższego kontekstu zapytania, wygeneruj czytelny plan działania w języku polskim.

Kontekst zapytania:
- Intencja: ${queryContext.intent.action} ${queryContext.intent.object}
- Źródło danych: ${queryContext.dataSources.primary || "unknown"}
- Odbiorca: ${queryContext.audience.type || "unknown"}
- Format wyjściowy: ${queryContext.output.format || "narrative"}
- Filtry: ${queryContext.dataSources.filters ? JSON.stringify(queryContext.dataSources.filters) : "brak"}

WAŻNE:
- "Dla donora" oznacza że odpowiedź ma być sformatowana dla odbiorcy typu "donor" (np. pitch, raport dla darczyńcy), NIE że masz szukać informacji o donorach w bazie
- "Dla partnera" oznacza format odpowiedzi dla partnera biznesowego
- "Wewnętrzne" oznacza format odpowiedzi dla wewnętrznego użytku

Wygeneruj plan w formacie:
"Mam plan! 🎯

1) [krok 1 - co zrobię - konkretnie, np. "Użyję narzędzi Monday.com MCP do wyszukania projektów"]
2) [krok 2 - jakie narzędzia użyję - konkretnie, np. "get_board_items z filtrem geografia=Kenia"]
3) [krok 3 - jakie filtry zastosuję - konkretnie, np. "geografia: Kenia, temat: edukacja"]
4) [krok 4 - jak sformatuję odpowiedź - konkretnie, np. "w formie narracji dla donora"]

Czy chcesz coś zmienić w tym planie?"

Plan powinien być KONKRETNY i wskazywać dokładnie:
- Jakie narzędzia użyjesz (np. "get_board_items", "searchSlackHistory")
- Jakie parametry/filtry przekażesz do narzędzi
- Jak sformatujesz odpowiedź (format + odbiorca)
`,
  });

  return text;
}

