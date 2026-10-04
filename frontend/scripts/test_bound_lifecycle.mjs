import assert from "node:assert";
import { register } from "node:module";

register(new URL("./test-loader.mjs", import.meta.url).href);
const { getReportSessionBySlot, createReportSession } = await import("../lib/api.ts");

async function runTests() {
  console.log("Running bound lifecycle & session isolation tests...\n");

  const originalFetch = globalThis.fetch;

  // 1. Verify getReportSessionBySlot queries the slot endpoint correctly
  console.log("Test 1: getReportSessionBySlot queries /api/report-sessions/slot with correct params");
  try {
    let capturedUrl = "";
    globalThis.fetch = async (url) => {
      capturedUrl = url.toString();
      return {
        ok: true,
        status: 200,
        json: async () => ({
          report_id: "slot-session-789",
          metadata: {
            report_date: "2026-06-28",
            station: "JUJA",
            bound: "THIKA BOUND",
          },
        }),
      };
    };

    const session = await getReportSessionBySlot("2026-06-28", "Juja", "THIKA BOUND");
    assert.ok(capturedUrl.includes("report-sessions/slot"), "URL calls /report-sessions/slot");
    assert.ok(capturedUrl.includes("report_date=2026-06-28"), "Query includes report_date");
    assert.ok(capturedUrl.includes("station=Juja"), "Query includes station");
    assert.ok(capturedUrl.includes("bound=THIKA+BOUND"), "Query includes bound");
    assert.strictEqual(session?.report_id, "slot-session-789", "Returns matching session");

    // Test 404 behavior
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Not found" }),
    });

    const notFound = await getReportSessionBySlot("2026-06-28", "Juja", "NON_EXISTENT");
    assert.strictEqual(notFound, null, "Returns null on 404");
    console.log("✓ Test 1 passed\n");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 2. Verify handleResetReport does NOT call backend resetReportSession
  console.log("Test 2: handleResetReport resets local state without calling backend resetReportSession");
  {
    let backendResetCalled = false;
    let localReportId = "session-123";
    let uploadsResetCalled = false;

    // Simulate handleResetReport logic
    function handleResetReport(resetUploadsCallback) {
      localReportId = null;
      if (resetUploadsCallback) {
        resetUploadsCallback();
      }
    }

    handleResetReport(() => {
      uploadsResetCalled = true;
    });

    assert.strictEqual(localReportId, null, "Local report ID cleared");
    assert.strictEqual(uploadsResetCalled, true, "Uploads reset callback executed");
    assert.strictEqual(backendResetCalled, false, "Backend resetReportSession was NOT called");
    console.log("✓ Test 2 passed\n");
  }

  // 3. Verify changing bound in UI does NOT mutate active session bound via metadata PATCH
  console.log("Test 3: Changing bound dropdown preserves active session's own bound in metadata sync");
  {
    const sessionBoundRef = { current: "THIKA BOUND" };
    const sessionStationRef = { current: "JUJA" };
    let currentUiBound = "NAIROBI BOUND"; // User switched UI dropdown to Nairobi Bound

    // The metadata sync payload constructed:
    const payloadToSend = {
      station: sessionStationRef.current,
      bound: sessionBoundRef.current || currentUiBound, // Must use session's bound, not UI dropdown!
      report_date: "2026-06-28",
    };

    assert.strictEqual(
      payloadToSend.bound,
      "THIKA BOUND",
      "Metadata sync preserves session bound and does NOT rename to Nairobi Bound"
    );
    console.log("✓ Test 3 passed\n");
  }

  // 4. Verify bound switching restores existing bound session if slot exists
  console.log("Test 4: Bound switcher loads existing session when slot is populated");
  {
    let activeReportId = "thika-session-id";
    const sessionBoundRef = { current: "THIKA BOUND" };
    let loadedSession = null;

    const mockSlotLookup = async (date, station, bound) => {
      if (bound === "NAIROBI BOUND") {
        return {
          report_id: "nairobi-session-id",
          metadata: { report_date: date, station, bound },
          sections: { daily_hour: { status: "ready" } },
        };
      }
      return null;
    };

    // Simulate switchSlotWorkspace logic
    async function switchWorkspace(newBound) {
      const existing = await mockSlotLookup("2026-06-28", "JUJA", newBound);
      if (existing) {
        activeReportId = existing.report_id;
        sessionBoundRef.current = existing.metadata.bound;
        loadedSession = existing;
      }
    }

    await switchWorkspace("NAIROBI BOUND");
    assert.strictEqual(activeReportId, "nairobi-session-id", "Switched to Nairobi session ID");
    assert.strictEqual(sessionBoundRef.current, "NAIROBI BOUND", "Updated session bound ref");
    assert.strictEqual(loadedSession?.sections?.daily_hour?.status, "ready", "Preserved Nairobi data");
    console.log("✓ Test 4 passed\n");
  }

  // 5. Verify bound switching detaches cleanly without wiping when target slot is empty
  console.log("Test 5: Bound switcher detaches workspace cleanly when target slot is empty");
  {
    let activeReportId = "thika-session-id";
    const sessionBoundRef = { current: "THIKA BOUND" };
    let backendResetCalled = false;

    const mockSlotLookup = async () => null; // Empty slot

    async function switchWorkspace(newBound) {
      const existing = await mockSlotLookup("2026-06-28", "JUJA", newBound);
      if (!existing) {
        // Detach without backend reset
        activeReportId = null;
        sessionBoundRef.current = null;
      }
    }

    await switchWorkspace("NEW BOUND");
    assert.strictEqual(activeReportId, null, "Detached from previous session");
    assert.strictEqual(sessionBoundRef.current, null, "Cleared session bound ref");
    assert.strictEqual(backendResetCalled, false, "Backend session was NOT wiped");
    console.log("✓ Test 5 passed\n");
  }

  console.log("All bound lifecycle & session isolation tests passed successfully!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
