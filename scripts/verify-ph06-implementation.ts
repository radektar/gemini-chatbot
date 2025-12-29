/**
 * Script to verify PH06 implementation without manual UI testing
 * Verifies code structure, logging, configuration, and edge cases
 */

import { existsSync } from "fs";
import { readFileSync } from "fs";

console.log("🔍 Weryfikacja implementacji PH06 - Context Budget Hardening\n");

let passedTests = 0;
let failedTests = 0;
const results: Array<{ test: string; status: "✅" | "❌"; details: string }> = [];

function test(name: string, condition: boolean, details: string = "") {
  if (condition) {
    passedTests++;
    results.push({ test: name, status: "✅", details });
    console.log(`✅ ${name}`);
  } else {
    failedTests++;
    results.push({ test: name, status: "❌", details });
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test 1: Sprawdzenie czy pliki modułów istnieją
console.log("1️⃣ Weryfikacja plików modułów\n");

test(
  "ai/context-budget.ts istnieje",
  existsSync("ai/context-budget.ts"),
  "Moduł budżetu tokenów"
);

test(
  "lib/monday-payload-control.ts istnieje",
  existsSync("lib/monday-payload-control.ts"),
  "Moduł kontroli payload Monday.com"
);

test(
  "lib/slack-payload-control.ts istnieje",
  existsSync("lib/slack-payload-control.ts"),
  "Moduł kontroli payload Slack"
);

// Test 2: Sprawdzenie logowania w kodzie
console.log("\n2️⃣ Weryfikacja logowania\n");

const mcpInitContent = readFileSync("integrations/mcp/init.ts", "utf-8");
test(
  "Logowanie payload Monday.com w init.ts",
  mcpInitContent.includes("[Monday.com Payload]"),
  "Logi zawierają: [Monday.com Payload] Tool: X, Original: Y, Processed: Z"
);

const slackClientContent = readFileSync("integrations/slack/client.ts", "utf-8");
test(
  "Logowanie payload Slack w client.ts",
  slackClientContent.includes("[Slack Payload]"),
  "Logi zawierają: [Slack Payload] Channel: X, Original: Y, Processed: Z"
);

const routeContent = readFileSync("app/(chat)/api/chat/route.ts", "utf-8");
test(
  "Logowanie budżetu tokenów w route.ts",
  routeContent.includes("[Context Budget]"),
  "Logi zawierają: [Context Budget] Usage: X/Y tokens (Z%), Degradation: LEVEL"
);

// Test 3: Sprawdzenie konfiguracji zmiennych środowiskowych
console.log("\n3️⃣ Weryfikacja konfiguracji zmiennych środowiskowych\n");

test(
  "MONDAY_MAX_RECORDS użyte w kodzie",
  mcpInitContent.includes("MONDAY_MAX_RECORDS"),
  "Domyślna wartość: 30"
);

test(
  "MONDAY_TRIGGER_NARROW_AT użyte w kodzie",
  mcpInitContent.includes("MONDAY_TRIGGER_NARROW_AT"),
  "Domyślna wartość: 100"
);

test(
  "SLACK_MAX_MESSAGES użyte w kodzie",
  slackClientContent.includes("SLACK_MAX_MESSAGES"),
  "Domyślna wartość: 15"
);

test(
  "SLACK_TRIGGER_NARROW_AT użyte w kodzie",
  slackClientContent.includes("SLACK_TRIGGER_NARROW_AT"),
  "Domyślna wartość: 50"
);

// Test 4: Sprawdzenie integracji payload control
console.log("\n4️⃣ Weryfikacja integracji payload control\n");

test(
  "Payload control aplikowane w callMondayMCPTool",
  mcpInitContent.includes("applyPayloadControl"),
  "Funkcja applyPayloadControl wywoływana dla tools z 'item' lub 'board'"
);

test(
  "Payload control aplikowane w getChannelHistory",
  slackClientContent.includes("processSlackPayload"),
  "Funkcja processSlackPayload wywoływana w getChannelHistory"
);

test(
  "Payload control aplikowane w getAllChannelHistory",
  slackClientContent.split("processSlackPayload").length > 2,
  "Funkcja processSlackPayload wywoływana również w getAllChannelHistory"
);

// Test 5: Sprawdzenie budżetu tokenów
console.log("\n5️⃣ Weryfikacja budżetu tokenów\n");

test(
  "allocateBudget wywoływane w route.ts",
  routeContent.includes("allocateBudget"),
  "Budżet alokowany dla 200K context window"
);

test(
  "calculateCurrentUsage wywoływane w route.ts",
  routeContent.includes("calculateCurrentUsage"),
  "Aktualne użycie obliczane przed wywołaniem streamText"
);

test(
  "shouldDegrade wywoływane w route.ts",
  routeContent.includes("shouldDegrade"),
  "Poziom degradacji określany na podstawie użycia"
);

test(
  "Kompresja historii implementowana",
  routeContent.includes("COMPRESS_HISTORY") || routeContent.includes("Compressed history"),
  "Sliding window dla historii rozmowy (max 10 messages)"
);

// Test 6: Sprawdzenie limitów domyślnych
console.log("\n6️⃣ Weryfikacja limitów domyślnych\n");

test(
  "Monday.com: domyślny limit 30 rekordów",
  mcpInitContent.includes('"30"') && mcpInitContent.includes("MONDAY_MAX_RECORDS || \"30\""),
  "parseInt(process.env.MONDAY_MAX_RECORDS || \"30\", 10)"
);

test(
  "Monday.com: trigger narrow przy 100 rekordach",
  mcpInitContent.includes('"100"') && mcpInitContent.includes("MONDAY_TRIGGER_NARROW_AT || \"100\""),
  "parseInt(process.env.MONDAY_TRIGGER_NARROW_AT || \"100\", 10)"
);

test(
  "Slack: domyślny limit 15 wiadomości",
  slackClientContent.includes('"15"') && slackClientContent.includes("SLACK_MAX_MESSAGES || \"15\""),
  "parseInt(process.env.SLACK_MAX_MESSAGES || \"15\", 10)"
);

test(
  "Slack: trigger narrow przy 50 wynikach",
  slackClientContent.includes('"50"') && slackClientContent.includes("SLACK_TRIGGER_NARROW_AT || \"50\""),
  "parseInt(process.env.SLACK_TRIGGER_NARROW_AT || \"50\", 10)"
);

// Test 7: Sprawdzenie obsługi edge cases
console.log("\n7️⃣ Weryfikacja obsługi edge cases\n");

const mondayPayloadContent = readFileSync("lib/monday-payload-control.ts", "utf-8");
test(
  "Monday payload control obsługuje pustą tablicę",
  mondayPayloadContent.includes("if (!items || items.length === 0") || 
  mondayPayloadContent.includes("if (!items || items.length === 0"),
  "Graceful handling dla pustych wyników"
);

const slackPayloadContent = readFileSync("lib/slack-payload-control.ts", "utf-8");
test(
  "Slack payload control obsługuje pustą tablicę",
  slackPayloadContent.includes("if (!messages || messages.length === 0") ||
  slackPayloadContent.includes("if (!messages || messages.length === 0"),
  "Graceful handling dla pustych wyników"
);

// Test 8: Sprawdzenie struktury odpowiedzi z warning
console.log("\n8️⃣ Weryfikacja struktury odpowiedzi z warning\n");

test(
  "Monday.com zwraca _warning przy >100 rekordach",
  mcpInitContent.includes("_warning") && mcpInitContent.includes("_total_count"),
  "Struktura: { ...result, _warning: string, _total_count: number, _displayed_count: number }"
);

// Test 9: Sprawdzenie token estimation
console.log("\n9️⃣ Weryfikacja estymacji tokenów\n");

test(
  "estimateTokens zaimplementowane",
  readFileSync("ai/context-budget.ts", "utf-8").includes("estimateTokens"),
  "Funkcja estimateTokens dostępna"
);

test(
  "estimateJsonTokens zaimplementowane",
  readFileSync("ai/context-budget.ts", "utf-8").includes("estimateJsonTokens"),
  "Funkcja estimateJsonTokens dostępna"
);

// Test 10: Sprawdzenie testów automatycznych
console.log("\n🔟 Weryfikacja testów automatycznych\n");

test(
  "tests/context-budget.test.ts istnieje",
  existsSync("tests/context-budget.test.ts"),
  "Testy dla modułu budżetu tokenów"
);

test(
  "tests/payload-control.test.ts istnieje",
  existsSync("tests/payload-control.test.ts"),
  "Testy dla modułów payload control"
);

// Podsumowanie
console.log("\n" + "=".repeat(60));
console.log("📊 PODSUMOWANIE WERYFIKACJI");
console.log("=".repeat(60));
console.log(`✅ Testy przeszły: ${passedTests}`);
console.log(`❌ Testy nie przeszły: ${failedTests}`);
console.log(`📈 Sukces: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.log("❌ Testy, które nie przeszły:\n");
  results.filter(r => r.status === "❌").forEach(r => {
    console.log(`   - ${r.test}`);
    if (r.details) console.log(`     ${r.details}`);
  });
}

console.log("\n📋 Następne kroki:");
console.log("   1. Przejdź przez testy manualne wymagające interakcji z UI");
console.log("   2. Sprawdź logi konsoli serwera podczas rzeczywistych zapytań");
console.log("   3. Wypełnij wyniki w docs/PH06_MANUAL_TEST_RESULTS.md");

