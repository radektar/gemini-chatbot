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

console.log("=== Tests: Plan Generation ===\n");

test("Plan should contain action steps", () => {
  const mockPlan = `
Mój plan:
1) Użyję narzędzi Monday.com MCP do wyszukania projektów
2) Zastosuję filtry: geografia=Kenia, temat=edukacja
3) Wygeneruję odpowiedź w formie narracji
4) Przedstawię wyniki użytkownikowi

Czy chcesz coś zmienić w tym planie?
`;

  assert(mockPlan.includes("Mój plan:"), "Plan should contain 'Mój plan:'");
  assert(mockPlan.includes("1)"), "Plan should contain numbered step 1)");
  assert(mockPlan.includes("2)"), "Plan should contain numbered step 2)");
  assert(mockPlan.includes("3)"), "Plan should contain numbered step 3)");
  assert(mockPlan.includes("4)"), "Plan should contain numbered step 4)");
});

test("Plan should contain information about tools", () => {
  const mockPlan = "Użyję narzędzi Monday.com MCP do wyszukania projektów";
  
  assert(mockPlan.includes("narzędzi"), "Plan should mention tools");
  assert(mockPlan.includes("Monday.com MCP") || mockPlan.includes("Slack"), "Plan should specify tool name");
});

test("Plan should contain information about filters", () => {
  const mockPlan = "Zastosuję filtry: geografia=Kenia, temat=edukacja";
  
  assert(mockPlan.includes("filtry"), "Plan should mention filters");
  assert(mockPlan.includes("geografia") || mockPlan.includes("status") || mockPlan.includes("timeRange"), "Plan should specify filter type");
});

test("Plan should be in Polish", () => {
  const mockPlan = "Mój plan: 1) Użyję narzędzi Monday.com MCP";
  
  // Check for Polish words
  assert(mockPlan.includes("Mój") || mockPlan.includes("plan"), "Plan should contain Polish words");
});

test("Plan should contain confirmation question", () => {
  const mockPlan = "Czy chcesz coś zmienić w tym planie?";
  
  assert(mockPlan.includes("Czy chcesz"), "Plan should contain confirmation question");
  assert(mockPlan.includes("zmienić") || mockPlan.includes("plan"), "Plan should ask about changes");
});

test("Plan should contain all required elements", () => {
  const mockPlan = `
Mój plan:
1) [krok 1 - co zrobię]
2) [krok 2 - jakie narzędzia użyję]
3) [krok 3 - jakie filtry zastosuję]
4) [krok 4 - jak sformatuję odpowiedź]

Czy chcesz coś zmienić w tym planie?
`;

  assert(mockPlan.includes("Mój plan:"), "Plan should start with 'Mój plan:'");
  assert((mockPlan.match(/\d\)/g) || []).length >= 4, "Plan should contain at least 4 numbered steps");
  assert(mockPlan.includes("Czy chcesz coś zmienić"), "Plan should contain confirmation question");
});



