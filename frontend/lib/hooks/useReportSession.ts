import { useState, useCallback, useEffect, useRef } from "react";
import { ReportMetadata, ManualInputs, BuildStatus } from "../types";
import {
  createReportSession,
  getReportSession,
  getReportSessionBySlot,
  updateReportSessionMetadata,
  updateManualInputs,
  buildFinalReport,
  getFinalReportDownloadUrl,
  getExcelReportDownloadUrl,
  ReportSessionResponse,
  getLoggedInUser,
  resetReportSession,
} from "../api";


const ACTIVE_WEIGHBRIDGE_KEY = "active-weighbridge-name";
const ACTIVE_BOUND_KEY = "active-bound-name";

function loadStoredSelection(storageKey: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }
  return localStorage.getItem(storageKey) || fallback;
}

function numberFromSession(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringFromSession(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return "";
}

function mapDailyTransgressionRow(row: Record<string, unknown>) {
  return {
    date: stringFromSession(row, ["date", "Date"]),
    time: stringFromSession(row, ["time", "Time"]),
    regNo: stringFromSession(row, ["reg_no", "regNo", "Reg No"]),
    axleConfig: stringFromSession(row, ["axle_config", "axleConfig", "Axle Config"]),
    transporter: stringFromSession(row, ["transporter", "Transporter"]),
    censusClerk: stringFromSession(row, ["census_clerk", "censusClerk", "Census Clerk"]),
    policeInCharge: stringFromSession(row, [
      "police_in_charge",
      "policeInCharge",
      "Police In charge",
    ]),
    actionTaken: stringFromSession(row, ["action_taken", "actionTaken", "Action Taken"]),
    caught: stringFromSession(row, ["caught", "Caught"]),
    nextWbReportSent: stringFromSession(row, [
      "next_wb_report_sent",
      "nextWbReportSent",
      "Next WB report sent",
    ]),
    nextWb: stringFromSession(row, ["next_wb", "nextWb", "Next WB"]),
  };
}

function mapTransgressionActionRow(row: Record<string, unknown>) {
  return {
    date: stringFromSession(row, ["date", "Date"]),
    timeReceived: stringFromSession(row, ["time_received", "timeReceived", "Time Received"]),
    truckNo: stringFromSession(row, ["truck_no", "truckNo", "Truck No."]),
    sendingWbStation: stringFromSession(row, [
      "sending_wb_station",
      "sendingWbStation",
      "Sending WB station",
    ]),
    ocsReportedTo: stringFromSession(row, [
      "ocs_reported_to",
      "ocsReportedTo",
      "OCS Reported To",
    ]),
    action1: stringFromSession(row, ["action_1", "action1", "Action 1"]),
    action2: stringFromSession(row, ["action_2", "action2", "Action 2"]),
    attachEvidence: stringFromSession(row, [
      "attach_evidence",
      "attachEvidence",
      "Attach evidence if any",
    ]),
    weightNoted: stringFromSession(row, ["weight_noted", "weightNoted", "Weight Noted"]),
    taggedInSystem: stringFromSession(row, [
      "tagged_in_system",
      "taggedInSystem",
      "Tagged in System",
    ]),
  };
}

function splitThreeRows(total: number): [number, number, number] {
  if (total <= 0) return [0, 0, 0];
  const first = Math.round(total * 0.19);
  const second = Math.round(total * 0.55);
  let third = total - first - second;
  if (third < 0) {
    third = 0;
    return [first, total - first, 0];
  }
  return [first, second, third];
}

export function useReportSession() {
  const [sessionData, setSessionData] = useState<ReportSessionResponse | null>(null);

  const [metadata, setMetadata] = useState<ReportMetadata>({
    date: "",
    preparedBy: "",
    approvedBy: "Faith Njani",
  });

  const [weighbridgeName, setWeighbridgeName] = useState(() =>
    loadStoredSelection(ACTIVE_WEIGHBRIDGE_KEY, "JUJA")
  );
  const [boundName, setBoundName] = useState(() =>
    loadStoredSelection(ACTIVE_BOUND_KEY, "THIKA BOUND")
  );
  const [reportId, setReportId] = useState<string | null>(null);

  // Lock station and preparedBy for non-admin users
  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.role !== "admin") {
      const rawStation = user.station || user.username || "";
      if (rawStation) {
        const STATION_MAP: Record<string, string> = {
          "juja": "JUJA",
          "athi": "ATHI RIVER",
          "gilgil": "GILGIL",
          "kanyonyo": "KANYONYO",
          "suswa": "SUSWA",
          "isinya": "ISINYA"
        };
        const normalized = rawStation.toLowerCase();
        let matched = "JUJA";
        for (const [key, value] of Object.entries(STATION_MAP)) {
          if (normalized.includes(key)) {
            matched = value;
            break;
          }
        }
        setWeighbridgeName(matched);
        if (matched === "KANYONYO") {
          setBoundName("NAIROBI BOUND");
        }
      }
      
      setMetadata((prev) => ({
        ...prev,
        preparedBy: user.full_name || user.username || "",
      }));
    }
  }, []);

  useEffect(() => {
    if (weighbridgeName.toUpperCase() === "KANYONYO") {
      setBoundName("NAIROBI BOUND");
    }
  }, [weighbridgeName]);

  const [manualInputs, setManualInputs] = useState<ManualInputs>({
    casesCleared: 0,
    transgressions: 0,
    buses3500: 0,
    vehicles3500to7000: 0,
    vehicles7000: 0,
    ccRecords: [
      { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
      { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
      { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
    ],
    dailyTransgressions: [],
    transgressionActions: [],
  });

  const [manualInputsTouched, setManualInputsTouched] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("not_ready");
  const [buildError, setBuildError] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "ready" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [finalReportDownloadUrl, setFinalReportDownloadUrl] = useState<string | null>(null);
  const [excelReportDownloadUrl, setExcelReportDownloadUrl] = useState<string | null>(null);
  const [manualSaveStatus, setManualSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const initialSaveDone = useRef(false);
  const reportIdRef = useRef<string | null>(null);
  const sessionBoundRef = useRef<string | null>(null);
  const sessionStationRef = useRef<string | null>(null);
  const lastSyncedDateRef = useRef<string | null>(null);
  const pendingDateSyncRef = useRef<string | null>(null);

  useEffect(() => {
    reportIdRef.current = reportId;
  }, [reportId]);

  const metadataComplete =
    metadata.date.trim() !== "" &&
    metadata.preparedBy.trim() !== "" &&
    metadata.approvedBy.trim() !== "";

  const sessionReady =
    Boolean(metadata.date) &&
    Boolean(metadata.preparedBy) &&
    Boolean(metadata.approvedBy) &&
    !reportId &&
    createStatus === "idle";

  // Function to load session details from backend response
  const loadSessionData = useCallback(async (session: ReportSessionResponse) => {
    setSessionData(session);
    sessionBoundRef.current = session.metadata?.bound || null;
    sessionStationRef.current = session.metadata?.weighbridge_name || session.metadata?.station || null;

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

    setMetadata((prev) => ({
      date: dateToUse,
      preparedBy: session.metadata?.prepared_by || prev.preparedBy || "",
      approvedBy: session.metadata?.confirmed_by || prev.approvedBy || "Faith Njani",
    }));

    setWeighbridgeName(
      session.metadata?.weighbridge_name ||
        session.metadata?.station ||
        "JUJA"
    );
    setBoundName(session.metadata?.bound || "THIKA BOUND");

    const restoredManualInputs = session.manual_inputs;
    if (restoredManualInputs) {
      const trafficCensus = restoredManualInputs.traffic_census;
      const transgressions = restoredManualInputs.transgressions;
      const dailyTransgressions = transgressions?.daily_transgressions || [];
      const transgressionActions = transgressions?.action_report || [];

      let ccRecords = restoredManualInputs.cc_records?.map(r => ({
        buses_gte_3500kg: r.buses_gte_3500kg || 0,
        vehicles_3500_to_7000_excluding_buses: r.vehicles_3500_to_7000_excluding_buses || 0,
        vehicles_gte_7000_excluding_buses: r.vehicles_gte_7000_excluding_buses || 0,
      }));
      if (!ccRecords || ccRecords.length === 0) {
        const b = numberFromSession(trafficCensus?.buses_gte_3500kg);
        const v = numberFromSession(trafficCensus?.vehicles_3500_to_7000_excluding_buses);
        const w = numberFromSession(trafficCensus?.vehicles_gte_7000_excluding_buses);

        const bSplit = splitThreeRows(b);
        const vSplit = splitThreeRows(v);
        const wSplit = splitThreeRows(w);

        ccRecords = [
          { buses_gte_3500kg: bSplit[0], vehicles_3500_to_7000_excluding_buses: vSplit[0], vehicles_gte_7000_excluding_buses: wSplit[0] },
          { buses_gte_3500kg: bSplit[1], vehicles_3500_to_7000_excluding_buses: vSplit[1], vehicles_gte_7000_excluding_buses: wSplit[1] },
          { buses_gte_3500kg: bSplit[2], vehicles_3500_to_7000_excluding_buses: vSplit[2], vehicles_gte_7000_excluding_buses: wSplit[2] },
        ];
      }

      setManualInputs({
        casesCleared: numberFromSession(restoredManualInputs.cases_cleared_in_court),
        transgressions: numberFromSession(restoredManualInputs.transgressions_count),
        buses3500: numberFromSession(trafficCensus?.buses_gte_3500kg),
        vehicles3500to7000: numberFromSession(trafficCensus?.vehicles_3500_to_7000_excluding_buses),
        vehicles7000: numberFromSession(trafficCensus?.vehicles_gte_7000_excluding_buses),
        ccRecords: ccRecords,
        dailyTransgressions: dailyTransgressions.map(mapDailyTransgressionRow),
        transgressionActions: transgressionActions.map(mapTransgressionActionRow),
      });

      setManualInputsTouched(
        Boolean(
          trafficCensus ||
            transgressions ||
            restoredManualInputs.cases_cleared_in_court !== undefined ||
            restoredManualInputs.transgressions_count !== undefined
        )
      );
    }

    if (session.final_report?.status === "ready") {
      setBuildStatus("completed");
      setFinalReportDownloadUrl(await getFinalReportDownloadUrl(session.report_id));
      setExcelReportDownloadUrl(await getExcelReportDownloadUrl(session.report_id));
      setBuildError(null);
    } else if (session.final_report?.status === "error") {
      setBuildStatus("error");
      setBuildError(
        session.final_report.error || "The backend reported a final report build error."
      );
      setFinalReportDownloadUrl(null);
      setExcelReportDownloadUrl(null);
    } else if (session.final_report?.status === "processing") {
      setBuildStatus("building");
      setFinalReportDownloadUrl(null);
      setExcelReportDownloadUrl(null);
      setBuildError(null);
    } else {
      setBuildStatus("not_ready");
      setFinalReportDownloadUrl(null);
      setExcelReportDownloadUrl(null);
      setBuildError(null);
    }
  }, []);

  // Poll if session is in building/processing status on load
  useEffect(() => {
    if (!reportId || buildStatus !== "building") return;
    
    let active = true;
    const poll = async () => {
      let attempts = 0;
      const maxAttempts = 60;
      while (active && attempts < maxAttempts) {
        try {
          const session = await getReportSession(reportId);
          if (session.final_report?.status === "ready") {
            setBuildStatus("completed");
            setFinalReportDownloadUrl(await getFinalReportDownloadUrl(reportId));
            setExcelReportDownloadUrl(await getExcelReportDownloadUrl(reportId));
            break;
          } else if (session.final_report?.status === "error") {
            setBuildStatus("error");
            setBuildError(session.final_report.error || "The backend reported a final report build error.");
            break;
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }
    };
    
    poll();
    return () => {
      active = false;
    };
  }, [reportId, buildStatus]);

  const handleCreateSession = useCallback(async () => {
    if (reportId || createStatus === "creating") return;

    try {
      setCreateStatus("creating");
      setCreateError(null);

      const response = await createReportSession({
        report_date: metadata.date,
        station: weighbridgeName,
        bound: boundName,
        weighbridge_name: weighbridgeName,
        prepared_by: metadata.preparedBy,
        confirmed_by: metadata.approvedBy,
      });

      setReportId(response.report_id);
      reportIdRef.current = response.report_id;
      sessionBoundRef.current = response.metadata?.bound || boundName;
      sessionStationRef.current = response.metadata?.station || response.metadata?.weighbridge_name || weighbridgeName;
      lastSyncedDateRef.current = response.metadata?.report_date || metadata.date;
      pendingDateSyncRef.current = null;
      localStorage.setItem("active-report-id", response.report_id);
      setCreateStatus("ready");
      await loadSessionData(response);
    } catch (error) {
      console.error("Failed to create session:", error);
      setCreateStatus("error");
      setCreateError(
        error instanceof Error ? error.message : "Failed to create report workspace"
      );
    }
  }, [
    reportId,
    createStatus,
    metadata.date,
    metadata.preparedBy,
    metadata.approvedBy,
    weighbridgeName,
    boundName,
    loadSessionData,
  ]);

  const handleSaveManualInputs = useCallback(async () => {
    if (!reportId) return;

    const busesTotal = manualInputs.ccRecords.reduce((sum, r) => sum + (r.buses_gte_3500kg || 0), 0);
    const vehicles3500to7000Total = manualInputs.ccRecords.reduce((sum, r) => sum + (r.vehicles_3500_to_7000_excluding_buses || 0), 0);
    const vehicles7000Total = manualInputs.ccRecords.reduce((sum, r) => sum + (r.vehicles_gte_7000_excluding_buses || 0), 0);
    const totalCensus = busesTotal + vehicles3500to7000Total + vehicles7000Total;

    try {
      setManualSaveStatus("saving");
      await updateManualInputs(reportId, {
        prepared_by: metadata.preparedBy,
        confirmed_by: metadata.approvedBy,
        weighbridge_name: weighbridgeName,
        traffic_census: {
          buses_gte_3500kg: busesTotal,
          vehicles_3500_to_7000_excluding_buses: vehicles3500to7000Total,
          vehicles_gte_7000_excluding_buses: vehicles7000Total,
          total_traffic_census: totalCensus,
        },
        transgressions: {
          daily_transgressions: manualInputs.dailyTransgressions.map((row) => ({
            date: row.date,
            time: row.time,
            reg_no: row.regNo,
            axle_config: row.axleConfig,
            transporter: row.transporter,
            census_clerk: row.censusClerk,
            police_in_charge: row.policeInCharge,
            action_taken: row.actionTaken,
            caught: row.caught,
            next_wb_report_sent: row.nextWbReportSent,
            next_wb: row.nextWb,
          })),
          action_report: manualInputs.transgressionActions.map((row) => ({
            date: row.date,
            time_received: row.timeReceived,
            truck_no: row.truckNo,
            sending_wb_station: row.sendingWbStation,
            ocs_reported_to: row.ocsReportedTo,
            action_1: row.action1,
            action_2: row.action2,
            attach_evidence: row.attachEvidence,
            attach_evidence_if_any: row.attachEvidence,
            weight_noted: row.weightNoted,
            tagged_in_system: row.taggedInSystem,
          })),
        },
        extra: {
          cases_cleared_in_court: manualInputs.casesCleared,
          transgressions_count: manualInputs.transgressions,
          cc_records: manualInputs.ccRecords,
        },
      });

      setManualInputsTouched(true);
      setManualSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save manual inputs:", error);
      setManualSaveStatus("error");
    }
  }, [reportId, metadata.preparedBy, metadata.approvedBy, weighbridgeName, manualInputs]);

  const handleBuildReport = useCallback(async (canBuild: boolean) => {
    if (!canBuild || !reportId) return;

    setBuildStatus("building");
    setBuildError(null);
    setFinalReportDownloadUrl(null);
    setExcelReportDownloadUrl(null);

    try {
      let response = await buildFinalReport(reportId);
      let finalReport = response.final_report;

      // Poll until status is "ready" or "error"
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      while (
        (finalReport?.status === "processing" || finalReport?.status === "building") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        response = await getReportSession(reportId);
        finalReport = response.final_report;
        attempts++;
      }

      if (finalReport?.status === "ready") {
        setBuildStatus("completed");
        setFinalReportDownloadUrl(await getFinalReportDownloadUrl(response.report_id));
        setExcelReportDownloadUrl(await getExcelReportDownloadUrl(response.report_id));
      } else if (finalReport?.status === "error") {
        setBuildStatus("error");
        setBuildError(finalReport.error || "The backend reported a final report build error.");
      } else {
        setBuildStatus("error");
        setBuildError("Build timed out. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setBuildStatus("error");
      setBuildError(
        error instanceof Error ? error.message : "Failed to build final report"
      );
    }
  }, [reportId]);

  const handleResetReport = useCallback((resetUploadsCallback?: () => void) => {
    // Only resets local editor workspace; does NOT call resetReportSession on backend
    // to preserve completed reports and avoid wiping user data.
    const user = getLoggedInUser();
    const defaultPreparedBy =
      user && user.role !== "admin"
        ? user.full_name || user.username || ""
        : "";

    setMetadata({
      date: "",
      preparedBy: defaultPreparedBy,
      approvedBy: "Faith Njani",
    });

    setManualInputs({
      casesCleared: 0,
      transgressions: 0,
      buses3500: 0,
      vehicles3500to7000: 0,
      vehicles7000: 0,
      ccRecords: [
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
      ],
      dailyTransgressions: [],
      transgressionActions: [],
    });

    setManualInputsTouched(false);
    setBuildStatus("not_ready");
    setBuildError(null);
    setCreateStatus("idle");
    setCreateError(null);
    setFinalReportDownloadUrl(null);
    setExcelReportDownloadUrl(null);
    setReportId(null);
    reportIdRef.current = null;
    sessionBoundRef.current = null;
    sessionStationRef.current = null;
    lastSyncedDateRef.current = null;
    pendingDateSyncRef.current = null;
    setSessionData(null);
    initialSaveDone.current = false;

    localStorage.removeItem("active-report-id");
    if (resetUploadsCallback) {
      resetUploadsCallback();
    }
  }, []);

  // Save metadata changes to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVE_WEIGHBRIDGE_KEY, weighbridgeName);
  }, [weighbridgeName]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_BOUND_KEY, boundName);
  }, [boundName]);

  // Debounce metadata updates (only syncs editable fields for the active session, never mutates bound)
  useEffect(() => {
    if (!reportId) return;

    if (metadata.date && metadata.date !== lastSyncedDateRef.current) {
      pendingDateSyncRef.current = metadata.date;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await updateReportSessionMetadata(reportId, {
          station: sessionStationRef.current || weighbridgeName,
          bound: sessionBoundRef.current || boundName,
          weighbridge_name: sessionStationRef.current || weighbridgeName,
          report_date: metadata.date,
        });

        lastSyncedDateRef.current = response.metadata?.report_date || metadata.date;
        if (pendingDateSyncRef.current === metadata.date) {
          pendingDateSyncRef.current = null;
        }

        if (response.final_report?.status === "ready") {
          setBuildStatus("completed");
          setFinalReportDownloadUrl(await getFinalReportDownloadUrl(response.report_id));
          setExcelReportDownloadUrl(await getExcelReportDownloadUrl(response.report_id));
        } else {
          setBuildStatus("not_ready");
          setFinalReportDownloadUrl(null);
          setExcelReportDownloadUrl(null);
        }
        setBuildError(response.final_report?.error);
      } catch (error) {
        console.error("Failed to update session metadata:", error);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [reportId, metadata.date]);

  // Switch workspace when boundName or weighbridgeName changes away from active session slot
  useEffect(() => {
    if (!reportId || !sessionData) return;

    const currentBound = sessionBoundRef.current || sessionData.metadata?.bound;
    const currentStation = sessionStationRef.current || sessionData.metadata?.station || sessionData.metadata?.weighbridge_name;

    const boundChanged = Boolean(
      currentBound && boundName.toUpperCase().trim() !== currentBound.toUpperCase().trim()
    );
    const stationChanged = Boolean(
      currentStation && weighbridgeName.toUpperCase().trim() !== currentStation.toUpperCase().trim()
    );

    if (!boundChanged && !stationChanged) {
      return;
    }

    let active = true;

    async function switchSlotWorkspace() {
      try {
        const targetDate = metadata.date || lastSyncedDateRef.current || "";
        const targetStation = weighbridgeName;
        const targetBound = boundName;

        if (targetDate) {
          const existing = await getReportSessionBySlot(targetDate, targetStation, targetBound);
          if (!active) return;
          if (existing) {
            setReportId(existing.report_id);
            reportIdRef.current = existing.report_id;
            sessionBoundRef.current = existing.metadata?.bound || targetBound;
            sessionStationRef.current = existing.metadata?.station || targetStation;
            lastSyncedDateRef.current = existing.metadata?.report_date || targetDate;
            pendingDateSyncRef.current = null;
            localStorage.setItem("active-report-id", existing.report_id);
            setCreateStatus("ready");
            setCreateError(null);
            await loadSessionData(existing);
            return;
          }
        }

        // No existing session for the new slot: detach workspace for clean creation
        if (!active) return;
        setReportId(null);
        reportIdRef.current = null;
        sessionBoundRef.current = null;
        sessionStationRef.current = null;
        setSessionData(null);
        lastSyncedDateRef.current = metadata.date || null;
        pendingDateSyncRef.current = null;
        localStorage.removeItem("active-report-id");

        setManualInputs({
          casesCleared: 0,
          transgressions: 0,
          buses3500: 0,
          vehicles3500to7000: 0,
          vehicles7000: 0,
          ccRecords: [
            { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
            { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
            { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
          ],
          dailyTransgressions: [],
          transgressionActions: [],
        });
        setManualInputsTouched(false);
        setBuildStatus("not_ready");
        setBuildError(null);
        setFinalReportDownloadUrl(null);
        setExcelReportDownloadUrl(null);
        setCreateStatus("idle");
        setCreateError(null);
        initialSaveDone.current = false;
      } catch (err) {
        console.error("Error switching slot workspace:", err);
      }
    }

    switchSlotWorkspace();

    return () => {
      active = false;
    };
  }, [boundName, weighbridgeName, metadata.date, reportId, sessionData, loadSessionData]);

  // Initial save of manual inputs
  useEffect(() => {
    if (!reportId || !metadataComplete || initialSaveDone.current) return;
    initialSaveDone.current = true;
    handleSaveManualInputs();
  }, [reportId, metadataComplete, handleSaveManualInputs]);

  // Debounced auto-save of manual inputs
  useEffect(() => {
    if (!reportId || !metadataComplete) return;

    const timeout = setTimeout(() => {
      handleSaveManualInputs();
    }, 600);

    return () => clearTimeout(timeout);
  }, [
    manualInputs,
    metadata.preparedBy,
    metadata.approvedBy,
    weighbridgeName,
    reportId,
    metadataComplete,
    handleSaveManualInputs,
  ]);

  // Auto create session when metadata is complete
  useEffect(() => {
    if (!sessionReady) return;

    const timeout = setTimeout(() => {
      handleCreateSession();
    }, 300);

    return () => clearTimeout(timeout);
  }, [sessionReady, handleCreateSession]);

  // Restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedReportId = localStorage.getItem("active-report-id");
        if (!savedReportId) return;

        const session = await getReportSession(savedReportId);
        setReportId(savedReportId);
        reportIdRef.current = savedReportId;
        sessionBoundRef.current = session.metadata?.bound || null;
        sessionStationRef.current = session.metadata?.weighbridge_name || session.metadata?.station || null;
        lastSyncedDateRef.current = session.metadata?.report_date || null;
        pendingDateSyncRef.current = null;
        setCreateStatus("ready");
        setCreateError(null);
        await loadSessionData(session);
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    }

    restoreSession();
  }, [loadSessionData]);

  return {
    sessionData,
    metadata,
    setMetadata,
    weighbridgeName,
    setWeighbridgeName,
    boundName,
    setBoundName,
    reportId,
    setReportId,
    manualInputs,
    setManualInputs,
    manualInputsTouched,
    setManualInputsTouched,
    buildStatus,
    setBuildStatus,
    buildError,
    setBuildError,
    createStatus,
    createError,
    finalReportDownloadUrl,
    setFinalReportDownloadUrl,
    excelReportDownloadUrl,
    setExcelReportDownloadUrl,
    manualSaveStatus,
    setManualSaveStatus,
    handleCreateSession,
    handleSaveManualInputs,
    handleBuildReport,
    handleResetReport,
    metadataComplete,
    loadSessionData,
  };
}
