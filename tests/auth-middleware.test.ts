/**
 * Smoke tests for authentication middleware and API endpoints
 * Tests that middleware matcher covers required paths and endpoints require auth
 */

import { readFileSync } from "fs";
import { join } from "path";

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

// Test suite
console.log("=== Smoke Tests: Auth Middleware & API Endpoints ===\n");

// Test 1: Middleware matcher should cover required UI routes
test("Middleware matcher should cover UI routes", () => {
  const middlewarePath = join(process.cwd(), "middleware.ts");
  const middlewareContent = readFileSync(middlewarePath, "utf-8");

  // Check that matcher is configured (not empty array)
  assert(
    middlewareContent.includes("matcher:"),
    "Middleware should have matcher configuration"
  );

  // Check that matcher uses a pattern that would match required routes
  // The matcher pattern should match "/", "/chat/*", etc.
  assert(
    middlewareContent.includes("matcher:") &&
      !middlewareContent.includes('matcher: []'),
    "Middleware matcher should not be empty (should match routes)"
  );

  // Check that middleware uses NextAuth
  assert(
    middlewareContent.includes("NextAuth") || middlewareContent.includes("auth"),
    "Middleware should use NextAuth/auth"
  );
});

// Test 2: API endpoints should have auth check
test("API endpoint /api/chat should require auth", () => {
  const chatRoutePath = join(process.cwd(), "app", "(chat)", "api", "chat", "route.ts");
  const chatRouteContent = readFileSync(chatRoutePath, "utf-8");

  assert(
    chatRouteContent.includes("await auth()"),
    "/api/chat should call auth()"
  );
  assert(
    chatRouteContent.includes("401") || chatRouteContent.includes("Unauthorized"),
    "/api/chat should return 401 when unauthorized"
  );
});

test("API endpoint /api/history should require auth", () => {
  const historyRoutePath = join(process.cwd(), "app", "(chat)", "api", "history", "route.ts");
  const historyRouteContent = readFileSync(historyRoutePath, "utf-8");

  assert(
    historyRouteContent.includes("await auth()"),
    "/api/history should call auth()"
  );
  assert(
    historyRouteContent.includes("401") || historyRouteContent.includes("Unauthorized"),
    "/api/history should return 401 when unauthorized"
  );
});

test("API endpoint /api/files/upload should require auth", () => {
  const uploadRoutePath = join(process.cwd(), "app", "(chat)", "api", "files", "upload", "route.ts");
  const uploadRouteContent = readFileSync(uploadRoutePath, "utf-8");

  assert(
    uploadRouteContent.includes("await auth()"),
    "/api/files/upload should call auth()"
  );
  assert(
    uploadRouteContent.includes("401") || uploadRouteContent.includes("Unauthorized"),
    "/api/files/upload should return 401 when unauthorized"
  );
});

test("API endpoint /api/slack/sync should require auth", () => {
  const slackRoutePath = join(process.cwd(), "app", "(chat)", "api", "slack", "sync", "route.ts");
  const slackRouteContent = readFileSync(slackRoutePath, "utf-8");

  assert(
    slackRouteContent.includes("await auth()"),
    "/api/slack/sync should call auth()"
  );
  assert(
    slackRouteContent.includes("401") || slackRouteContent.includes("Unauthorized"),
    "/api/slack/sync should return 401 when unauthorized"
  );
});

// Test 3: Middleware should handle API routes differently from UI routes
test("Middleware should distinguish API routes from UI routes", () => {
  const middlewarePath = join(process.cwd(), "middleware.ts");
  const middlewareContent = readFileSync(middlewarePath, "utf-8");

  // Check that middleware checks for API routes
  assert(
    middlewareContent.includes("/api/") || middlewareContent.includes("pathname.startsWith"),
    "Middleware should check if route is API route"
  );

  // Check that middleware returns 401 for API routes (not redirect)
  assert(
    middlewareContent.includes("401") || middlewareContent.includes("Unauthorized"),
    "Middleware should return 401 for API routes, not redirect"
  );
});

// Test 4: DEV bypass should be conditional
test("DEV bypass should only work in development", () => {
  const middlewarePath = join(process.cwd(), "middleware.ts");
  const middlewareContent = readFileSync(middlewarePath, "utf-8");

  if (middlewareContent.includes("AUTH_BYPASS")) {
    assert(
      middlewareContent.includes("development") || middlewareContent.includes("NODE_ENV"),
      "DEV bypass should check NODE_ENV or development mode"
    );
  }
});

console.log("\n✅ All auth middleware smoke tests passed!");

