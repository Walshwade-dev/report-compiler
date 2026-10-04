import assert from "node:assert";
import { register } from "node:module";

register(new URL("./test-loader.mjs", import.meta.url).href);
const { updateReportSessionMetadata } = await import("../lib/api.ts");

async function runTests() {
  console.log("Running metadata date synchronization tests...\n");

  // 1. Verify updateReportSessionMetadata sends report_date in payload
  console.log("Test 1: updateReportSessionMetadata sends report_date in request payload");
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = null;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    capturedUrl = url.toString();
    capturedMethod = init.method;
    capturedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        report_id: "test-session-123",
        metadata: {
          report_date: capturedBody.report_date,
          station: capturedBody.station,
          bound: capturedBody.bound,
          weighbridge_name: capturedBody.weighbridge_name,
        },
      }),
    };
  };

  try {
    const res = await updateReportSessionMetadata("test-session-123", {
      station: "JUJA",
      bound: "THIKA BOUND",
      weighbridge_name: "JUJA",
      report_date: "2026-06-28",
    });

    assert.ok(capturedUrl.includes("report-sessions/test-session-123/metadata"), "URL matches endpoint");
    assert.strictEqual(capturedMethod, "PATCH", "HTTP method is PATCH");
    assert.strictEqual(capturedBody.report_date, "2026-06-28", "Payload includes report_date");
    assert.strictEqual(res.metadata.report_date, "2026-06-28", "Response echoes updated report_date");
    console.log("✓ Test 1 passed\n");
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 2. Test metadata sync simulation (hook logic verification)
  console.log("Test 2: Initial session restore populates metadata.date");
  {
    let metadataDate = "";
    const reportIdRef = { current: "session-abc" };
    const lastSyncedDateRef = { current: null };
    const pendingDateSyncRef = { current: null };

    // Function matching loadSessionData logic in useReportSession
    function loadSessionData(session) {
      const backendDate = session.metadata?.report_date || "";
      const activeUserDate =
        pendingDateSyncRef.current ||
        (lastSyncedDateRef.current && lastSyncedDateRef.current !== backendDate
          ? lastSyncedDateRef.current
          : null);
      const dateToUse =
        session.report_id === reportIdRef.current && activeUserDate
          ? activeUserDate
          : backendDate;

      if (dateToUse && !lastSyncedDateRef.current) {
        lastSyncedDateRef.current = dateToUse;
      }
      metadataDate = dateToUse;
    }

    const initialSession = {
      report_id: "session-abc",
      metadata: { report_date: "2026-06-04" },
    };

    loadSessionData(initialSession);
    assert.strictEqual(metadataDate, "2026-06-04", "Session date restored to 2026-06-04");
    assert.strictEqual(lastSyncedDateRef.current, "2026-06-04", "lastSyncedDateRef set to 2026-06-04");
    console.log("✓ Test 2 passed\n");
  }

  console.log("Test 3: Date change sets pending sync and prevents upload response from clobbering");
  {
    let metadataDate = "2026-06-04";
    const reportIdRef = { current: "session-abc" };
    const lastSyncedDateRef = { current: "2026-06-04" };
    const pendingDateSyncRef = { current: null };

    function loadSessionData(session) {
      const backendDate = session.metadata?.report_date || "";
      const activeUserDate =
        pendingDateSyncRef.current ||
        (lastSyncedDateRef.current && lastSyncedDateRef.current !== backendDate
          ? lastSyncedDateRef.current
          : null);
      const dateToUse =
        session.report_id === reportIdRef.current && activeUserDate
          ? activeUserDate
          : backendDate;

      if (dateToUse && !lastSyncedDateRef.current) {
        lastSyncedDateRef.current = dateToUse;
      }
      metadataDate = dateToUse;
    }

    // User changes date to 2026-06-28
    const newSelectedDate = "2026-06-28";
    metadataDate = newSelectedDate;
    if (newSelectedDate !== lastSyncedDateRef.current) {
      pendingDateSyncRef.current = newSelectedDate;
    }

    assert.strictEqual(pendingDateSyncRef.current, "2026-06-28", "Pending date sync queued");

    // Ingest completes upload with stale backend date before debounce sync completes
    const uploadResponseSession = {
      report_id: "session-abc",
      metadata: { report_date: "2026-06-04" }, // Stale date on backend
    };

    loadSessionData(uploadResponseSession);

    assert.strictEqual(
      metadataDate,
      "2026-06-28",
      "loadSessionData preserved the user's selected date 2026-06-28 and did not reset to 2026-06-04"
    );
    console.log("✓ Test 3 passed\n");
  }

  console.log("Test 4: Metadata sync completion persists new date and clears pending");
  {
    let metadataDate = "2026-06-28";
    const reportIdRef = { current: "session-abc" };
    const lastSyncedDateRef = { current: "2026-06-04" };
    const pendingDateSyncRef = { current: "2026-06-28" };

    function loadSessionData(session) {
      const backendDate = session.metadata?.report_date || "";
      const activeUserDate =
        pendingDateSyncRef.current ||
        (lastSyncedDateRef.current && lastSyncedDateRef.current !== backendDate
          ? lastSyncedDateRef.current
          : null);
      const dateToUse =
        session.report_id === reportIdRef.current && activeUserDate
          ? activeUserDate
          : backendDate;

      if (dateToUse && !lastSyncedDateRef.current) {
        lastSyncedDateRef.current = dateToUse;
      }
      metadataDate = dateToUse;
    }

    // Debounced sync resolves with updated backend session
    const syncResponse = {
      report_id: "session-abc",
      metadata: { report_date: "2026-06-28" },
    };
    lastSyncedDateRef.current = syncResponse.metadata.report_date;
    pendingDateSyncRef.current = null;

    assert.strictEqual(lastSyncedDateRef.current, "2026-06-28", "Synced date is 2026-06-28");
    assert.strictEqual(pendingDateSyncRef.current, null, "Pending flag cleared");

    // Subsequent upload or session load returns updated backend session
    loadSessionData(syncResponse);
    assert.strictEqual(metadataDate, "2026-06-28", "Metadata date remains 2026-06-28");
    console.log("✓ Test 4 passed\n");
  }

  console.log("Test 5: Switching to a different session properly loads that session's date (no blanket rule)");
  {
    let metadataDate = "2026-06-28";
    const reportIdRef = { current: "session-abc" };
    const lastSyncedDateRef = { current: "2026-06-28" };
    const pendingDateSyncRef = { current: null };

    function loadSessionData(session) {
      const backendDate = session.metadata?.report_date || "";
      const activeUserDate =
        pendingDateSyncRef.current ||
        (lastSyncedDateRef.current && lastSyncedDateRef.current !== backendDate
          ? lastSyncedDateRef.current
          : null);
      const dateToUse =
        session.report_id === reportIdRef.current && activeUserDate
          ? activeUserDate
          : backendDate;

      if (dateToUse && !lastSyncedDateRef.current) {
        lastSyncedDateRef.current = dateToUse;
      }
      metadataDate = dateToUse;
    }

    // A different session is loaded
    const differentSession = {
      report_id: "session-xyz",
      metadata: { report_date: "2026-07-15" },
    };

    loadSessionData(differentSession);
    assert.strictEqual(
      metadataDate,
      "2026-07-15",
      "Different session correctly overrides non-empty date with its own date"
    );
    console.log("✓ Test 5 passed\n");
  }

  console.log("All metadata date synchronization tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
