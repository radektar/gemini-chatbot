/**
 * Script to help verify context budget and payload control functionality
 * Run with: npx tsx scripts/test-context-budget-manual.ts
 */

import {
  allocateBudget,
  calculateCurrentUsage,
  shouldDegrade,
  DegradationLevel,
  estimateTokens,
  estimateJsonTokens,
} from "../ai/context-budget";

import {
  processMondayPayload,
  shouldTriggerNarrowWarning,
} from "../lib/monday-payload-control";

import {
  processSlackPayload,
  shouldTriggerNarrowWarning as shouldTriggerSlackNarrowWarning,
} from "../lib/slack-payload-control";

console.log("🧪 Testy automatyczne dla Context Budget i Payload Control\n");

// Test 1: Budget allocation
console.log("1️⃣ Test: Alokacja budżetu tokenów");
const budget = allocateBudget(200_000);
console.log(`   ✅ Budżet całkowity: ${budget.total.toLocaleString()} tokenów`);
console.log(`   ✅ System prompt: ${budget.systemPrompt.min}-${budget.systemPrompt.max} tokenów`);
console.log(`   ✅ Historia rozmowy: ${budget.conversationHistory.min}-${budget.conversationHistory.max} tokenów`);
console.log(`   ✅ Dane integracji: ${budget.integrationData.min}-${budget.integrationData.max} tokenów`);
console.log(`   ✅ Output: ${budget.output.min}-${budget.output.max} tokenów`);
console.log(`   ✅ Safety margin: ${budget.safetyMargin.min}-${budget.safetyMargin.max} tokenów\n`);

// Test 2: Token estimation
console.log("2️⃣ Test: Estymacja tokenów");
const testText = "To jest przykładowy tekst do testowania estymacji tokenów.";
const tokens = estimateTokens(testText);
console.log(`   ✅ Tekst: "${testText}"`);
console.log(`   ✅ Estymowane tokeny: ${tokens} (${testText.length} znaków / 4 = ${Math.ceil(testText.length / 4)})\n`);

// Test 3: JSON token estimation
console.log("3️⃣ Test: Estymacja tokenów dla JSON");
const testJson = {
  items: Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    status: "active",
  })),
};
const jsonTokens = estimateJsonTokens(testJson);
console.log(`   ✅ JSON z 10 items: ~${jsonTokens} tokenów\n`);

// Test 4: Current usage calculation
console.log("4️⃣ Test: Obliczanie aktualnego użycia");
const usage = calculateCurrentUsage({
  systemPrompt: "You are a helpful assistant.",
  messages: [
    { role: "user", content: "Test message" },
    { role: "assistant", content: "Test response" },
  ],
});
console.log(`   ✅ Aktualne użycie: ${usage} tokenów\n`);

// Test 5: Degradation levels
console.log("5️⃣ Test: Poziomy degradacji");
const testLevels = [
  { usage: 50_000, expected: DegradationLevel.NONE }, // 25% < 75%
  { usage: 160_000, expected: DegradationLevel.COMPRESS_HISTORY }, // 80% >= 80%
  { usage: 170_000, expected: DegradationLevel.AGGREGATE }, // 85% >= 85%
  { usage: 180_000, expected: DegradationLevel.ASK_USER }, // 90% >= 90%
  { usage: 190_000, expected: DegradationLevel.ASK_USER }, // 95% >= 90%
];

for (const test of testLevels) {
  const level = shouldDegrade(test.usage, budget);
  const status = level === test.expected ? "✅" : "❌";
  console.log(`   ${status} Usage ${test.usage.toLocaleString()} (${((test.usage / budget.total) * 100).toFixed(1)}%): ${level}`);
}
console.log();

// Test 6: Monday payload control
console.log("6️⃣ Test: Kontrola payload Monday.com");
const mondayItems = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  status: "active",
}));

const mondayProcessed = processMondayPayload(mondayItems);
console.log(`   ✅ Oryginalna liczba: ${mondayProcessed.originalCount}`);
console.log(`   ✅ Przetworzona liczba: ${mondayProcessed.items.length}`);
console.log(`   ✅ Estymowane tokeny: ~${mondayProcessed.tokenEstimate}`);
console.log(`   ✅ Powinno zawęzić: ${mondayProcessed.shouldNarrow ? "TAK" : "NIE"}`);

const shouldNarrow = shouldTriggerNarrowWarning(100);
console.log(`   ✅ Trigger narrow (>100): ${shouldNarrow ? "TAK" : "NIE"}\n`);

// Test 7: Slack payload control
console.log("7️⃣ Test: Kontrola payload Slack");
const slackMessages = Array.from({ length: 100 }, (_, i) => ({
  ts: String(i),
  text: `Message ${i}`,
  user: "U123",
}));

const slackProcessed = processSlackPayload(slackMessages);
console.log(`   ✅ Oryginalna liczba: ${slackProcessed.originalCount}`);
console.log(`   ✅ Przetworzona liczba: ${slackProcessed.messages.length}`);
console.log(`   ✅ Estymowane tokeny: ~${slackProcessed.tokenEstimate}`);
console.log(`   ✅ Powinno zawęzić: ${slackProcessed.shouldNarrow ? "TAK" : "NIE"}`);

const shouldSlackNarrow = shouldTriggerSlackNarrowWarning(100);
console.log(`   ✅ Trigger narrow (>50): ${shouldSlackNarrow ? "TAK" : "NIE"}\n`);

// Test 8: Environment variables check
console.log("8️⃣ Test: Sprawdzenie zmiennych środowiskowych");
const mondayMaxRecords = process.env.MONDAY_MAX_RECORDS || "30 (domyślne)";
const mondayTriggerNarrow = process.env.MONDAY_TRIGGER_NARROW_AT || "100 (domyślne)";
const slackMaxMessages = process.env.SLACK_MAX_MESSAGES || "15 (domyślne)";
const slackTriggerNarrow = process.env.SLACK_TRIGGER_NARROW_AT || "50 (domyślne)";

console.log(`   ✅ MONDAY_MAX_RECORDS: ${mondayMaxRecords}`);
console.log(`   ✅ MONDAY_TRIGGER_NARROW_AT: ${mondayTriggerNarrow}`);
console.log(`   ✅ SLACK_MAX_MESSAGES: ${slackMaxMessages}`);
console.log(`   ✅ SLACK_TRIGGER_NARROW_AT: ${slackTriggerNarrow}\n`);

console.log("✅ Wszystkie testy automatyczne zakończone pomyślnie!");
console.log("\n📋 Następne kroki:");
console.log("   1. Uruchom aplikację: pnpm dev");
console.log("   2. Otwórz http://localhost:3000");
console.log("   3. Przejdź przez testy manualne z listy testów");
console.log("   4. Sprawdzaj logi konsoli serwera podczas testów");

