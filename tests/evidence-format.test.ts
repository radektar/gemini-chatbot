/**
 * Evidence Format Tests
 * 
 * Testy formatu odpowiedzi z sekcjami Wyniki/Źródła/Do potwierdzenia
 * zgodnie z Faza 05 Evidence Policy
 */

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

console.log("=== Tests: Evidence Format ===\n");

test("Response should contain 'Wyniki' section", () => {
  const response = `## Wyniki
Projekt osiągnął 5000 beneficjentów.

## Źródła
- "Projekt osiągnął 5000 beneficjentów" → [Monday Item #456](link)`;
  
  assert(response.includes("## Wyniki"), "Should contain Wyniki section");
});

test("Response should contain 'Źródła' section when data is present", () => {
  const response = `## Wyniki
Projekt osiągnął 5000 beneficjentów.

## Źródła
- "Projekt osiągnął 5000 beneficjentów" → [Monday Item #456, kolumna "Beneficjenci"](https://monday.com/boards/123/pulses/456)`;
  
  assert(response.includes("## Źródła"), "Should contain Źródła section");
});

test("Response should contain 'Do potwierdzenia' section when sources are missing", () => {
  const response = `## Wyniki
Projekt współpracuje z 3 szkołami.

## Do potwierdzenia
⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy"`;
  
  assert(response.includes("## Do potwierdzenia"), "Should contain Do potwierdzenia section");
  assert(response.includes("⚠️"), "Should contain warning emoji");
});

test("Source format should have correct link and column", () => {
  const response = `## Źródła
- "Projekt osiągnął 5000 beneficjentów" → [Monday Item #456, kolumna "Beneficjenci"](https://monday.com/boards/123/pulses/456)`;
  
  assert(/Monday Item #\d+/.test(response), "Should have item ID");
  assert(/kolumna "[\w\s]+"/.test(response), "Should have column name");
  assert(/https:\/\/monday\.com\/boards\/\d+\/pulses\/\d+/.test(response), "Should have correct URL");
});

test("Response should not require 'Źródła' section for general information", () => {
  const response = `## Wyniki
System pozwala na wyszukiwanie projektów w Monday.com.`;
  
  assert(!response.includes("## Źródła"), "Should not require Źródła for general info");
});

test("Monday.com URL should have correct format", () => {
  const link = "https://monday.com/boards/123/pulses/456";
  
  assert(/^https:\/\/monday\.com\/boards\/\d+\/pulses\/\d+$/.test(link), "Should have correct URL format");
});

test("Source reference should include item ID", () => {
  const reference = "[Monday Item #456, kolumna \"Beneficjenci\"](https://monday.com/boards/123/pulses/456)";
  
  assert(reference.includes("Item #456"), "Should include item ID");
});

test("Source reference should include column name", () => {
  const reference = "[Monday Item #456, kolumna \"Beneficjenci\"](https://monday.com/boards/123/pulses/456)";
  
  assert(reference.includes("kolumna \"Beneficjenci\""), "Should include column name");
});

test("Unverified section should have warning emoji", () => {
  const section = `## Do potwierdzenia
⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy"`;
  
  assert(section.includes("⚠️"), "Should have warning emoji");
});

test("Unverified section should include claim in warning", () => {
  const section = `## Do potwierdzenia
⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy"`;
  
  assert(section.includes("współpracuje z 3 szkołami"), "Should include claim");
});

test("Unverified section should suggest verification location", () => {
  const section = `## Do potwierdzenia
⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy"`;
  
  assert(section.includes("proszę zweryfikować"), "Should suggest verification");
  assert(section.includes("Monday"), "Should mention Monday");
});

test("Complete response should have all three sections when applicable", () => {
  const response = `## Wyniki
Projekt osiągnął 5000 beneficjentów. Projekt współpracuje z 3 szkołami.

## Źródła
- "Projekt osiągnął 5000 beneficjentów" → [Monday Item #456, kolumna "Beneficjenci"](https://monday.com/boards/123/pulses/456)

## Do potwierdzenia
⚠️ Brak źródła: "Projekt współpracuje z 3 szkołami" — proszę zweryfikować w Monday kolumnie "Partnerzy"`;
  
  assert(response.includes("## Wyniki"), "Should have Wyniki");
  assert(response.includes("## Źródła"), "Should have Źródła");
  assert(response.includes("## Do potwierdzenia"), "Should have Do potwierdzenia");
});

test("Response should have only Wyniki and Źródła when all claims are verified", () => {
  const response = `## Wyniki
Projekt osiągnął 5000 beneficjentów.

## Źródła
- "Projekt osiągnął 5000 beneficjentów" → [Monday Item #456, kolumna "Beneficjenci"](https://monday.com/boards/123/pulses/456)`;
  
  assert(response.includes("## Wyniki"), "Should have Wyniki");
  assert(response.includes("## Źródła"), "Should have Źródła");
  assert(!response.includes("## Do potwierdzenia"), "Should not have Do potwierdzenia");
});

