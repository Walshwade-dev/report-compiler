import assert from "node:assert";
import { register } from "node:module";

register(new URL("./test-loader.mjs", import.meta.url).href);
const {
  getPreviousDate,
  formatDisplayDate,
  checkMissingPreviousReport,
} = await import("../lib/reportContinuity.ts");

async function runTests() {
  console.log("Running report continuity tests...\n");

  // 1. Date math assertions
  console.log("Test 1: getPreviousDate calculates previous calendar day correctly");
  assert.strictEqual(getPreviousDate("2026-10-22"), "2026-10-21");
  assert.strictEqual(getPreviousDate("2026-10-01"), "2026-09-30");
  assert.strictEqual(getPreviousDate("2026-03-01"), "2026-02-28"); // Non-leap year
  assert.strictEqual(getPreviousDate("2026-01-01"), "2025-12-31");
  console.log("✓ Test 1 passed\n");

  // 2. Display formatting
  console.log("Test 2: formatDisplayDate formats YYYY-MM-DD to DD/MM/YYYY");
  assert.strictEqual(formatDisplayDate("2026-10-21"), "21/10/2026");
  assert.strictEqual(formatDisplayDate("2026-05-04"), "04/05/2026");
  console.log("✓ Test 2 passed\n");

  // 3. Continuity check when previous day slot is missing
  console.log("Test 3: checkMissingPreviousReport returns isMissing = true when previous slot 404s");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    // If querying 2026-10-21, simulate 404 (missing report)
    if (url.toString().includes("report_date=2026-10-21")) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ detail: "Report session not found for slot" }),
      };
    }
    // If querying 2026-10-20, simulate 200 (existing report)
    if (url.toString().includes("report_date=2026-10-20")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ report_id: "session-2026-10-20", metadata: { report_date: "2026-10-20" } }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  try {
    // Checking today (2026-10-22) when yesterday (2026-10-21) is missing
    const resToday = await checkMissingPreviousReport("2026-10-22", "JUJA", "THIKA BOUND");
    assert.strictEqual(resToday.isMissing, true, "isMissing is true when yesterday is not found");
    assert.strictEqual(resToday.prevDate, "2026-10-21", "prevDate is 2026-10-21");
    assert.strictEqual(resToday.targetDate, "2026-10-22", "targetDate is 2026-10-22");
    console.log("✓ Test 3 passed\n");

    // 4. Continuity check when previous day slot exists
    console.log("Test 4: checkMissingPreviousReport returns isMissing = false when previous slot exists");
    // Checking yesterday (2026-10-21) when day before yesterday (2026-10-20) exists
    const resYesterday = await checkMissingPreviousReport("2026-10-21", "JUJA", "THIKA BOUND");
    assert.strictEqual(resYesterday.isMissing, false, "isMissing is false when day before exists");
    console.log("✓ Test 4 passed\n");

    // 5. Baseline bypass
    console.log("Test 5: checkMissingPreviousReport bypasses dates on or before baseline");
    const resBaseline = await checkMissingPreviousReport("2026-10-01", "JUJA", "THIKA BOUND");
    assert.strictEqual(resBaseline.isMissing, false, "isMissing is false for baseline date");
    console.log("✓ Test 5 passed\n");
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("All report continuity tests passed successfully! 🎉");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
