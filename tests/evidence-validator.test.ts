/**
 * Evidence Validator Tests
 * 
 * Testy dla modułu evidence-validator.ts zgodnie z Faza 05 Evidence Policy
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

console.log("=== Tests: Evidence Validator ===\n");

import {
  extractNumbers,
  extractClaims,
  findSourceForClaim,
  validateEvidence,
  formatSourcesSection,
  formatUnverifiedSection,
} from "@/ai/evidence-validator";
import { MondaySource } from "@/lib/monday-link-generator";

test("extractNumbers should extract numbers from text", () => {
  const text = "Projekt osiągnął 5000 beneficjentów. Budżet wynosi 100000 zł.";
  const numbers = extractNumbers(text);
  
  assert(numbers.length > 0, "Should extract numbers");
  assert(numbers.some(n => n.number === 5000), "Should extract 5000");
  assert(numbers.some(n => n.number === 100000), "Should extract 100000");
});

test("extractNumbers should extract numbers with context", () => {
  const text = "Projekt edukacyjny w Kenii osiągnął 5000 beneficjentów w 2023 roku.";
  const numbers = extractNumbers(text);
  
  const number5000 = numbers.find(n => n.number === 5000);
  assert(number5000 !== undefined, "Should find number 5000");
  assert(number5000?.context.includes("beneficjentów"), "Should include context");
});

test("extractNumbers should handle numbers with thousands separators", () => {
  const text = "Projekt ma 1 234 567 beneficjentów.";
  const numbers = extractNumbers(text);
  
  assert(numbers.some(n => n.number === 1234567), "Should handle separators");
});

test("extractNumbers should ignore zero and negative numbers", () => {
  const text = "Projekt ma 0 beneficjentów i -5 projektów.";
  const numbers = extractNumbers(text);
  
  assert(numbers.every(n => n.number > 0), "Should ignore zero and negative");
});

test("extractClaims should extract claims with numbers", () => {
  const text = "Projekt osiągnął 5000 beneficjentów.\nProjekt działa od 2023 roku.";
  const claims = extractClaims(text);
  
  assert(claims.length > 0, "Should extract claims");
  assert(claims.some(c => c.includes("5000")), "Should include number claim");
});

test("extractClaims should extract claims with fact keywords", () => {
  const text = "Projekt współpracuje z 3 szkołami.\nStatus projektu to aktywny.";
  const claims = extractClaims(text);
  
  assert(claims.length > 0, "Should extract claims");
  assert(claims.some(c => c.includes("współpracuje")), "Should include fact keyword");
});

test("extractClaims should skip header sections", () => {
  const text = "## Źródła\nProjekt ma 5000 beneficjentów.\n## Do potwierdzenia";
  const claims = extractClaims(text);
  
  assert(claims.every(c => !c.includes("Źródła")), "Should skip headers");
  assert(claims.every(c => !c.includes("Do potwierdzenia")), "Should skip unverified section");
});

test("extractClaims should filter out short claims", () => {
  const text = "Projekt X.\nProjekt osiągnął 5000 beneficjentów w Kenii.";
  const claims = extractClaims(text);
  
  assert(claims.every(c => c.length > 10), "Should filter short claims");
});

test("findSourceForClaim should find source in Monday.com tool results", () => {
  const claim = "Projekt osiągnął 5000 beneficjentów";
  const toolResults = {
    get_board_items: {
      board: { id: "123" },
      items_page: {
        items: [
          { id: "456", column_values: [{ id: "beneficiaries", value: "5000" }] },
        ],
      },
    },
  };
  
  const evidenceItem = findSourceForClaim(claim, toolResults);
  
  assert(evidenceItem !== undefined, "Should find evidence item");
  assert(evidenceItem?.sourceType === "monday", "Should be Monday source");
  assert(evidenceItem?.itemId === "456", "Should have item ID");
});

test("findSourceForClaim should return unverified if no source found", () => {
  const claim = "Projekt współpracuje z 3 szkołami";
  const toolResults = {};
  
  const evidenceItem = findSourceForClaim(claim, toolResults);
  
  assert(evidenceItem !== undefined, "Should return evidence item");
  assert(evidenceItem?.sourceType === "none", "Should be unverified");
  assert(evidenceItem?.source === null, "Should have null source");
});

test("validateEvidence should validate evidence with sources", () => {
  const responseText = "Projekt osiągnął 5000 beneficjentów.";
  const toolResults = {
    get_board_items: {
      board: { id: "123" },
      items_page: {
        items: [{ id: "456" }],
      },
    },
  };
  
  const result = validateEvidence(responseText, toolResults);
  
  assert(result.validClaims.length > 0, "Should have valid claims");
  assert(result.unverifiedClaims.length === 0, "Should have no unverified claims");
});

test("validateEvidence should detect unverified claims", () => {
  const responseText = "Projekt współpracuje z 3 szkołami.";
  const toolResults = {};
  
  const result = validateEvidence(responseText, toolResults);
  
  assert(result.unverifiedClaims.length > 0, "Should detect unverified claims");
  assert(result.unverifiedClaims[0].claim.includes("współpracuje"), "Should include claim");
});

test("formatSourcesSection should format sources section with links", () => {
  const validClaims = [
    {
      claim: "Projekt osiągnął 5000 beneficjentów",
      source: { boardId: "123", itemId: "456", columnName: "Beneficjenci" } as MondaySource,
      sourceType: "monday" as const,
      link: "[Monday Item #456, kolumna \"Beneficjenci\"](https://monday.com/boards/123/pulses/456)",
    },
  ];
  
  const section = formatSourcesSection(validClaims);
  
  assert(section.includes("## Źródła"), "Should include header");
  assert(section.includes("5000 beneficjentów"), "Should include claim");
  assert(section.includes("Monday Item #456"), "Should include item reference");
});

test("formatSourcesSection should return empty string for no claims", () => {
  const section = formatSourcesSection([]);
  assert(section === "", "Should return empty string");
});

test("formatUnverifiedSection should format unverified section with warnings", () => {
  const unverifiedClaims = [
    {
      claim: "Projekt współpracuje z 3 szkołami",
      source: null,
      sourceType: "none" as const,
    },
  ];
  
  const section = formatUnverifiedSection(unverifiedClaims);
  
  assert(section.includes("## Do potwierdzenia"), "Should include header");
  assert(section.includes("⚠️"), "Should include warning emoji");
  assert(section.includes("współpracuje z 3 szkołami"), "Should include claim");
});

test("formatUnverifiedSection should suggest column name from claim", () => {
  const unverifiedClaims = [
    {
      claim: "Projekt ma 5000 beneficjentów",
      source: null,
      sourceType: "none" as const,
    },
  ];
  
  const section = formatUnverifiedSection(unverifiedClaims);
  
  assert(section.includes("beneficjent"), "Should suggest column name");
});

test("formatUnverifiedSection should return empty string for no unverified claims", () => {
  const section = formatUnverifiedSection([]);
  assert(section === "", "Should return empty string");
});

