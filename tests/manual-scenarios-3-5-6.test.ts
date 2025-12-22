/**
 * Manual test scenarios 3, 5, and 6
 * Run with: npx tsx tests/manual-scenarios-3-5-6.test.ts
 */

import {
  isReadOnlyTool,
  validateReadOnlyOperation,
  validateGraphQLQuery,
  ReadOnlyModeError,
} from "@/lib/monday-readonly";
import * as fs from "fs";
import * as path from "path";

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

console.log("=== Manual Test Scenarios 3, 5, and 6 ===\n");

// Scenariusz 3: Weryfikacja braku debug artifacts
console.log("=== Scenariusz 3: Weryfikacja braku debug artifacts ===\n");

test("Brak debug artifacts w lib/monday-readonly.ts", () => {
  const filePath = path.join(process.cwd(), "lib/monday-readonly.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  const debugPatterns = [
    "127.0.0.1:7242",
    "fetch('http://127.0.0.1",
    'fetch("http://127.0.0.1',
    "localhost:7242",
    "agent log",
  ];

  debugPatterns.forEach((pattern) => {
    assert(
      !content.includes(pattern),
      `Znaleziono debug artifact: "${pattern}" w lib/monday-readonly.ts`
    );
  });
});

test("Brak debug artifacts w integrations/mcp/", () => {
  const integrationsPath = path.join(process.cwd(), "integrations/mcp");
  const files = ["monday.ts", "init.ts", "client.ts"];

  files.forEach((file) => {
    const filePath = path.join(integrationsPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const debugPatterns = [
        "127.0.0.1:7242",
        "fetch('http://127.0.0.1",
        'fetch("http://127.0.0.1',
        "localhost:7242",
      ];

      debugPatterns.forEach((pattern) => {
        assert(
          !content.includes(pattern),
          `Znaleziono debug artifact: "${pattern}" w integrations/mcp/${file}`
        );
      });
    }
  });
});

// Scenariusz 5: Weryfikacja fail-safe dla nieznanych operacji
console.log("\n=== Scenariusz 5: Weryfikacja fail-safe dla nieznanych operacji ===\n");

test("Nieznane operacje są blokowane domyślnie", () => {
  const unknownOps = [
    "unknown_operation_xyz",
    "weird_function_name",
    "something_random_123",
    "all_widgets_schema", // z logów produkcyjnych
    "mystery_operation",
  ];

  unknownOps.forEach((op) => {
    const result = isReadOnlyTool(op);
    assert(
      result === false,
      `Operacja "${op}" powinna być zablokowana (isReadOnlyTool zwróciło true)`
    );

    try {
      validateReadOnlyOperation(op);
      throw new Error(
        `Operacja "${op}" powinna rzucić ReadOnlyModeError, ale nie rzuciła`
      );
    } catch (error) {
      assert(
        error instanceof ReadOnlyModeError,
        `Operacja "${op}" rzuciła ${error instanceof Error ? error.constructor.name : typeof error} zamiast ReadOnlyModeError`
      );
      assert(
        (error as ReadOnlyModeError).operationName === op,
        `ReadOnlyModeError powinien zawierać operationName="${op}", ale zawiera "${(error as ReadOnlyModeError).operationName}"`
      );
    }
  });
});

test("Komunikat błędu zawiera informację o fail-safe", () => {
  try {
    validateReadOnlyOperation("unknown_test_operation");
  } catch (error) {
    if (error instanceof ReadOnlyModeError) {
      const message = error.message.toLowerCase();
      assert(
        message.includes("blocked") || message.includes("zablokowana"),
        "Komunikat błędu powinien zawierać informację o blokadzie"
      );
    } else {
      throw error;
    }
  }
});

// Scenariusz 6: Weryfikacja GraphQL queries
console.log("\n=== Scenariusz 6: Weryfikacja GraphQL queries ===\n");

test("Read-only GraphQL query przechodzi walidację", () => {
  const readQuery = `
    query {
      boards(ids: [123456]) {
        name
        items {
          name
        }
      }
    }
  `;

  try {
    validateGraphQLQuery(readQuery);
  } catch (error) {
    throw new Error(
      `Read-only query powinno przejść walidację, ale rzuciło błąd: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

test("GraphQL mutation jest blokowana", () => {
  const mutation = `
    mutation {
      create_item(board_id: 123456, item_name: "Test") {
        id
      }
    }
  `;

  try {
    validateGraphQLQuery(mutation);
    throw new Error("Mutation powinno być zablokowane, ale przeszło walidację");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      `Mutation powinno rzucić ReadOnlyModeError, ale rzuciło ${error instanceof Error ? error.constructor.name : typeof error}`
    );
    const message = error.message.toLowerCase();
    assert(
      message.includes("mutation") || message.includes("create"),
      `Komunikat błędu powinien zawierać informację o mutacji: ${error.message}`
    );
  }
});

test("Query z komentarzem zawierającym 'mutation' przechodzi walidację", () => {
  const queryWithComment = `
    query {
      boards(ids: [123456]) {
        name
        # This is a comment about creating items, not a mutation
        # Another comment mentioning mutation keyword
      }
    }
  `;

  try {
    validateGraphQLQuery(queryWithComment);
  } catch (error) {
    throw new Error(
      `Query z komentarzem powinno przejść walidację, ale rzuciło błąd: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

test("Query z stringiem zawierającym 'mutation' przechodzi walidację", () => {
  const queryWithString = `
    query {
      boards(ids: [123456]) {
        name
        description: "This describes a mutation operation"
      }
    }
  `;

  try {
    validateGraphQLQuery(queryWithString);
  } catch (error) {
    throw new Error(
      `Query z stringiem powinno przejść walidację, ale rzuciło błąd: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

test("Anonymous mutation jest blokowana", () => {
  const anonymousMutation = `
    mutation {
      create_item(board_id: 123456, item_name: "Test") {
        id
      }
    }
  `;

  try {
    validateGraphQLQuery(anonymousMutation);
    throw new Error("Anonymous mutation powinno być zablokowane");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      `Anonymous mutation powinno rzucić ReadOnlyModeError`
    );
  }
});

test("Named mutation jest blokowana", () => {
  const namedMutation = `
    mutation CreateItem {
      create_item(board_id: 123456, item_name: "Test") {
        id
      }
    }
  `;

  try {
    validateGraphQLQuery(namedMutation);
    throw new Error("Named mutation powinno być zablokowane");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      `Named mutation powinno rzucić ReadOnlyModeError`
    );
  }
});

console.log("\n=== Wszystkie testy zakończone pomyślnie ===");

