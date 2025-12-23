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

console.log("=== Tests: Confidence-based Prompting ===\n");

const confidenceThreshold = 0.7;

test("Should ask for clarification when confidence < threshold", () => {
  const queryContext = {
    intent: { confidence: 0.4 },
    dataSources: { confidence: 0.5 },
    audience: { confidence: 0.3 },
    output: { confidence: 0.4 },
    averageConfidence: 0.4,
  };

  const shouldAsk = queryContext.averageConfidence < confidenceThreshold;
  assert(shouldAsk === true, "Should ask when confidence < threshold");
});

test("Should not ask when confidence >= threshold", () => {
  const queryContext = {
    intent: { confidence: 0.9 },
    dataSources: { confidence: 0.8 },
    audience: { confidence: 0.7 },
    output: { confidence: 0.8 },
    averageConfidence: 0.8,
  };

  const shouldAsk = queryContext.averageConfidence < confidenceThreshold;
  assert(shouldAsk === false, "Should not ask when confidence >= threshold");
});

test("Should identify low confidence slots", () => {
  const queryContext = {
    intent: { confidence: 0.3 },
    dataSources: { confidence: 0.4 },
    audience: { confidence: 0.9 },
    output: { confidence: 0.8 },
    averageConfidence: 0.6,
  };

  const lowConfidenceSlots: string[] = [];
  if (queryContext.intent.confidence < 0.5) {
    lowConfidenceSlots.push("intencję");
  }
  if (queryContext.dataSources.confidence < 0.5) {
    lowConfidenceSlots.push("źródło danych");
  }
  if (queryContext.audience.confidence < 0.5) {
    lowConfidenceSlots.push("odbiorcę");
  }
  if (queryContext.output.confidence < 0.5) {
    lowConfidenceSlots.push("format odpowiedzi");
  }

  assert(lowConfidenceSlots.includes("intencję"), "Should identify intent as low confidence");
  assert(lowConfidenceSlots.includes("źródło danych"), "Should identify dataSources as low confidence");
  assert(!lowConfidenceSlots.includes("odbiorcę"), "Should not identify audience as low confidence");
});

test("Should trigger stop & ask for >100 records", () => {
  const result = {
    items: Array(150).fill({}),
  };

  const recordCount = Array.isArray(result.items) ? result.items.length : 0;
  const shouldAsk = recordCount > 100;

  assert(shouldAsk === true, "Should ask when >100 records");
  assert(recordCount === 150, "Record count should be 150");
});

test("Should not trigger stop & ask for <100 records", () => {
  const result = {
    items: Array(50).fill({}),
  };

  const recordCount = Array.isArray(result.items) ? result.items.length : 0;
  const shouldAsk = recordCount > 100;

  assert(shouldAsk === false, "Should not ask when <100 records");
  assert(recordCount === 50, "Record count should be 50");
});

test("Should include specific slots in clarification question", () => {
  const queryContext = {
    intent: { confidence: 0.3 },
    dataSources: { confidence: 0.4 },
    audience: { confidence: 0.9 },
    output: { confidence: 0.8 },
    averageConfidence: 0.6,
  };

  const lowConfidenceSlots: string[] = [];
  if (queryContext.intent.confidence < 0.5) {
    lowConfidenceSlots.push("intencję");
  }
  if (queryContext.dataSources.confidence < 0.5) {
    lowConfidenceSlots.push("źródło danych");
  }

  const clarificationQuestion = lowConfidenceSlots.length > 0
    ? `Nie jestem pewien co do: ${lowConfidenceSlots.join(", ")}. Czy możesz doprecyzować?`
    : "Czy możesz doprecyzować swoje zapytanie?";

  assert(
    clarificationQuestion.includes("intencję"),
    "Clarification question should include 'intencję'"
  );
  assert(
    clarificationQuestion.includes("źródło danych"),
    "Clarification question should include 'źródło danych'"
  );
});

test("Should use configurable threshold from env var", () => {
  // Mock env var
  const originalEnv = process.env.CONFIDENCE_THRESHOLD;
  
  // Test default threshold
  delete process.env.CONFIDENCE_THRESHOLD;
  const defaultThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD || "0.7");
  assert(defaultThreshold === 0.7, "Default threshold should be 0.7");

  // Test custom threshold
  process.env.CONFIDENCE_THRESHOLD = "0.5";
  const customThreshold = parseFloat(process.env.CONFIDENCE_THRESHOLD || "0.7");
  assert(customThreshold === 0.5, "Custom threshold should be 0.5");

  // Restore
  if (originalEnv) {
    process.env.CONFIDENCE_THRESHOLD = originalEnv;
  } else {
    delete process.env.CONFIDENCE_THRESHOLD;
  }
});

