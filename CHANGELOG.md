# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-12-19

### Fixed
- Monday.com MCP: `MONDAY_ALLOWED_BOARD_ID` now properly filters results from list operations (like `get_boards`) to only show the allowed board, not just validate input parameters
- Added `filterMondayResult()` function to filter MCP response data after execution
- Board restriction can be easily disabled by setting `MONDAY_ALLOWED_BOARD_ID=` (empty) or removing it from `.env.local`

### Added
- Comprehensive security test suite for Monday.com MCP integration to verify all write operations are blocked before production deployment
- Unit tests for mutation operations blocking (`mutate_`, `insert_`, `post_`, `put_`, `patch_`)
- Unit tests for compound operations blocking (`move_item_to_group`, `change_multiple_column_values`, `bulk_*`, etc.)
- Unit tests for admin operations blocking (`invite_user`, `remove_user`, `change_permissions`, etc.)
- End-to-end security tests (`tests/monday-mcp-e2e-security.test.ts`) with real MCP server connection verification
  - Tests MCP server connection with `-ro` flag
  - Tests 20+ write operations blocking via `callMondayMCPTool()`
  - Tests direct MCP bypass attempts (blocked by MCP server)
  - Tests read operations functionality
  - Tests penetration attempts (SQL injection, path traversal, case variations)
- Production readiness check script (`scripts/test-monday-production-readiness.ts`)
  - Shows current configuration (token, -ro flag, board restrictions)
  - Runs all test suites automatically (unit, integration, E2E)
  - Tests write operations blocking with clear error messages
  - Generates detailed security report in Markdown format
  - Provides clear PASS/FAIL verdict for production readiness
- Security test results documentation (`docs/MONDAY_SECURITY_TEST_RESULTS.md`) with comprehensive test results

### Changed
- `integrations/mcp/monday.ts`: Changed `mondayMCPConfig` from static object to `getMondayMCPConfig()` function to ensure dynamic token loading from environment variables
- `integrations/mcp/init.ts`: Updated to use `getMondayMCPConfig()` for dynamic configuration
- `tests/monday-readonly.test.ts`: Extended with 3 new test categories (Test 11-13) covering mutation, compound, and admin operations

### Security
- Verified three-layer security protection:
  1. **MCP Server Level**: `-ro` flag blocks write operations at server level
  2. **Application Level**: `isReadOnlyTool()` check blocks write operations before execution
  3. **Tool Filtering**: `filterReadOnlyTools()` filters out write operations from available tools
- All write operations confirmed blocked (20+ operations tested):
  - Create operations: `create_item`, `create_board`, `create_column`, `create_update`
  - Update operations: `update_item`, `update_board`, `update_column`, `change_column_value`
  - Delete operations: `delete_item`, `delete_board`, `delete_column`, `delete_update`
  - Other operations: `archive_item`, `duplicate_item`, `move_item_to_group`, `mutate_item`, `insert_item`, `post_update`, `put_item`, `patch_item`
- Direct MCP bypass attempts blocked: Direct calls to `mcpManager.callTool()` with write operations are rejected by MCP server in `-ro` mode
- Penetration testing confirms no bypass methods work:
  - SQL injection patterns blocked
  - Path traversal patterns blocked
  - Case variation attempts blocked
  - Compound operation attempts blocked
- Production readiness verified: All security tests pass on test Monday.com account

### Added
- New test script `scripts/test-board-filtering.ts` for testing board filtering functionality
- Added "PoC Mode" indicator in navigation bar UI (`components/custom/navbar.tsx`)
- New npm script `test:board-filter` in package.json for board filtering tests

### Changed
- Enhanced `lib/monday-readonly.ts` with debug logging for security monitoring
- Updated `scripts/test-monday-security.ts` with improved test output formatting

## [0.1.0] - 2025-01-XX

### Changed
- Monday.com MCP integration: `MONDAY_ALLOWED_BOARD_ID` environment variable is now optional - when empty or not set, the integration allows unrestricted access to all boards accessible by the API token, instead of being limited to a single board
