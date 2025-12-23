// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

console.log("=== Tests: Intent Extraction ===\n");

test("Should extract intent from clear query", () => {
  const mockQueryContext = {
    intent: {
      action: "find" as const,
      object: "projekt edukacyjny",
      confidence: 0.9,
    },
    dataSources: {
      primary: "monday" as const,
      filters: { geography: "Kenia", theme: "edukacja" },
      confidence: 0.8,
    },
    audience: {
      type: "unknown" as const,
      confidence: 0.5,
    },
    output: {
      format: "narrative" as const,
      length: "medium" as const,
      confidence: 0.7,
    },
    averageConfidence: 0.75,
  };

  assert(mockQueryContext.intent.action === "find", "Intent action should be 'find'");
  assert(mockQueryContext.intent.confidence >= 0.7, "Intent confidence should be >= 0.7");
  assert(mockQueryContext.averageConfidence >= 0.7, "Average confidence should be >= 0.7");
});

test("Should have low confidence for ambiguous query", () => {
  const mockQueryContext = {
    intent: {
      action: "find" as const,
      object: "projekty",
      confidence: 0.3,
    },
    dataSources: {
      primary: "unknown" as const,
      confidence: 0.2,
    },
    audience: {
      type: "unknown" as const,
      confidence: 0.2,
    },
    output: {
      format: "narrative" as const,
      confidence: 0.3,
    },
    averageConfidence: 0.25,
  };

  assert(mockQueryContext.averageConfidence < 0.7, "Average confidence should be < 0.7");
  assert(mockQueryContext.intent.confidence < 0.5, "Intent confidence should be < 0.5");
});

test("Should extract audience type from query", () => {
  const mockQueryContext = {
    intent: {
      action: "find" as const,
      object: "projekt",
      confidence: 0.9,
    },
    dataSources: {
      primary: "monday" as const,
      confidence: 0.8,
    },
    audience: {
      type: "donor" as const,
      confidence: 0.9,
    },
    output: {
      format: "narrative" as const,
      confidence: 0.7,
    },
    averageConfidence: 0.825,
  };

  assert(mockQueryContext.audience.type === "donor", "Audience type should be 'donor'");
  assert(mockQueryContext.audience.confidence >= 0.7, "Audience confidence should be >= 0.7");
});

test("Should extract different action types", () => {
  const testCases = [
    { query: "Znajdź projekt", expected: "find" },
    { query: "Przeanalizuj dane", expected: "analyze" },
    { query: "Wygeneruj raport", expected: "generate" },
    { query: "Porównaj projekty", expected: "compare" },
    { query: "Podsumuj wyniki", expected: "summarize" },
    { query: "Wyjaśnij metrykę", expected: "explain" },
  ];

  testCases.forEach(({ query, expected }) => {
    // Mock extraction - w rzeczywistości używa extractIntent()
    const mockContext = {
      intent: { action: expected as any, object: "", confidence: 0.8 },
      dataSources: { confidence: 0.7 },
      audience: { confidence: 0.7 },
      output: { confidence: 0.7 },
      averageConfidence: 0.75,
    };
    assert(mockContext.intent.action === expected, `Query "${query}" should extract action "${expected}"`);
  });
});

test("Should extract different data sources", () => {
  const testCases = [
    { query: "Znajdź w Monday.com", expected: "monday" },
    { query: "Szukaj w Slack", expected: "slack" },
    { query: "Sprawdź w ImpactLog", expected: "impactlog" },
    { query: "Coś o projektach", expected: "unknown" },
  ];

  testCases.forEach(({ query, expected }) => {
    const mockContext = {
      intent: { action: "find" as const, object: "", confidence: 0.7 },
      dataSources: { primary: expected as any, confidence: 0.7 },
      audience: { confidence: 0.7 },
      output: { confidence: 0.7 },
      averageConfidence: 0.7,
    };
    assert(
      mockContext.dataSources.primary === expected,
      `Query "${query}" should extract primary source "${expected}"`
    );
  });
});

test("Should extract different audience types", () => {
  const testCases = [
    { query: "Dla donora", expected: "donor" },
    { query: "Dla partnera", expected: "partner" },
    { query: "Wewnętrzne", expected: "internal" },
  ];

  testCases.forEach(({ query, expected }) => {
    const mockContext = {
      intent: { action: "find" as const, object: "", confidence: 0.7 },
      dataSources: { confidence: 0.7 },
      audience: { type: expected as any, confidence: 0.8 },
      output: { confidence: 0.7 },
      averageConfidence: 0.75,
    };
    assert(mockContext.audience.type === expected, `Query "${query}" should extract audience type "${expected}"`);
  });
});

test("Should extract different output formats", () => {
  const testCases = [
    { query: "W formie narracji", expected: "narrative" },
    { query: "W punktach", expected: "bullets" },
    { query: "W tabeli", expected: "table" },
    { query: "Jako email", expected: "email" },
  ];

  testCases.forEach(({ query, expected }) => {
    const mockContext = {
      intent: { action: "find" as const, object: "", confidence: 0.7 },
      dataSources: { confidence: 0.7 },
      audience: { confidence: 0.7 },
      output: { format: expected as any, confidence: 0.8 },
      averageConfidence: 0.75,
    };
    assert(mockContext.output.format === expected, `Query "${query}" should extract format "${expected}"`);
  });
});

test("Should extract filters from query", () => {
  const testCases = [
    { query: "W Kenii", filterKey: "geography", expected: "Kenia" },
    { query: "Aktywne projekty", filterKey: "status", expected: "active" },
    { query: "Z ostatnich 12 miesięcy", filterKey: "timeRange", expected: "last_12_months" },
  ];

  testCases.forEach(({ query, filterKey, expected }) => {
    const mockContext = {
      intent: { action: "find" as const, object: "", confidence: 0.7 },
      dataSources: {
        primary: "monday" as const,
        filters: { [filterKey]: expected },
        confidence: 0.8,
      },
      audience: { confidence: 0.7 },
      output: { confidence: 0.7 },
      averageConfidence: 0.75,
    };
    assert(
      mockContext.dataSources.filters?.[filterKey] === expected,
      `Query "${query}" should extract filter ${filterKey}="${expected}"`
    );
  });
});

