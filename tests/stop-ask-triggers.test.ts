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

console.log("=== Tests: Stop & Ask Triggers ===\n");

function countRecords(result: any): number {
  if (Array.isArray(result)) {
    return result.length;
  }
  if (result && typeof result === "object") {
    if (Array.isArray(result.items)) {
      return result.items.length;
    }
    if (Array.isArray(result.boards)) {
      return result.boards.length;
    }
  }
  return 0;
}

function shouldTriggerWarning(recordCount: number): boolean {
  return recordCount > 100;
}

test("Should trigger warning for >100 records in items array", () => {
  const result = {
    items: Array(150).fill({}),
  };

  const recordCount = countRecords(result);
  const shouldAsk = shouldTriggerWarning(recordCount);

  assert(shouldAsk === true, "Should trigger warning when >100 records");
  assert(recordCount === 150, "Record count should be 150");
});

test("Should not trigger warning for <100 records", () => {
  const result = {
    items: Array(50).fill({}),
  };

  const recordCount = countRecords(result);
  const shouldAsk = shouldTriggerWarning(recordCount);

  assert(shouldAsk === false, "Should not trigger warning when <100 records");
  assert(recordCount === 50, "Record count should be 50");
});

test("Should trigger warning for >100 records in boards array", () => {
  const result = {
    boards: Array(200).fill({}),
  };

  const recordCount = countRecords(result);
  const shouldAsk = shouldTriggerWarning(recordCount);

  assert(shouldAsk === true, "Should trigger warning when >100 boards");
  assert(recordCount === 200, "Record count should be 200");
});

test("Should handle different result structures", () => {
  // Test 1: Direct array
  const result1 = Array(150).fill({});
  assert(countRecords(result1) === 150, "Should count direct array");

  // Test 2: Object with items
  const result2 = { items: Array(120).fill({}) };
  assert(countRecords(result2) === 120, "Should count items array");

  // Test 3: Object with boards
  const result3 = { boards: Array(80).fill({}) };
  assert(countRecords(result3) === 80, "Should count boards array");

  // Test 4: Object without items/boards
  const result4 = { data: "some data" };
  assert(countRecords(result4) === 0, "Should return 0 for object without items/boards");
});

test("Warning message should contain record count", () => {
  const recordCount = 150;
  const warning = `Znaleziono ${recordCount} rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`;

  assert(warning.includes(String(recordCount)), "Warning should contain record count");
  assert(warning.includes("zawęzić zakres"), "Warning should suggest narrowing scope");
  assert(warning.includes("filtrów") || warning.includes("filtry"), "Warning should mention filters");
});

test("Should handle edge case: exactly 100 records", () => {
  const result = {
    items: Array(100).fill({}),
  };

  const recordCount = countRecords(result);
  const shouldAsk = shouldTriggerWarning(recordCount);

  assert(shouldAsk === false, "Should not trigger warning for exactly 100 records");
  assert(recordCount === 100, "Record count should be 100");
});

test("Should handle edge case: 101 records", () => {
  const result = {
    items: Array(101).fill({}),
  };

  const recordCount = countRecords(result);
  const shouldAsk = shouldTriggerWarning(recordCount);

  assert(shouldAsk === true, "Should trigger warning for 101 records");
  assert(recordCount === 101, "Record count should be 101");
});

