"use client";

import { ReportHeader } from "@/components/report-builder/ReportHeader";
import { SummaryCards } from "@/components/report-builder/SummaryCards";
import { UploadChecklist } from "@/components/report-builder/UploadChecklist";
import { ReportMetadataForm } from "@/components/report-builder/ReportMetadataForm";
import { SectionPreviewPanel } from "@/components/report-builder/SectionPreviewPanel";
import { ManualInputsPanel } from "@/components/report-builder/ManualInputsPanel";
import { useEffect, useState, useCallback, useRef } from "react";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import {
  BuildStatus,
  ManualInputs,
  PreviewFormat,
  ReportMetadata,
  ReportSection,
  UploadKey,
  UploadState,
} from "@/lib/types";

import {
  buildFinalReport,
  createReportSession,
  getFinalReportDownloadUrl,
  uploadSectionFile,
  getReportSession,
  updateReportSessionMetadata,
  updateManualInputs,
} from "@/lib/api";

import {
  BACKEND_SECTION_KEYS,
  BACKEND_SECTION_STATUS_MAP,
} from "@/lib/constants";

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

export default function NewReportPage() {
  const [metadata, setMetadata] = useState<ReportMetadata>({
    date: "",
    preparedBy: "",
    approvedBy: "",
  });

  const [weighbridgeName, setWeighbridgeName] = useState(() =>
    loadStoredSelection(ACTIVE_WEIGHBRIDGE_KEY, "JUJA")
  );
  const [boundName, setBoundName] = useState(() =>
    loadStoredSelection(ACTIVE_BOUND_KEY, "THIKA BOUND")
  );
  const [reportId, setReportId] = useState<string | null>(null);

  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    daily_hour: { status: "missing" },
    wideload: { status: "missing" },
    impounded_prohibited: { status: "missing" },
    impounded_overloaded: { status: "missing" },
  });

  const [manualInputs, setManualInputs] = useState<ManualInputs>({
    casesCleared: 0,
    transgressions: 0,
    buses3500: 0,
    vehicles3500to7000: 0,
    vehicles7000: 0,
    dailyTransgressions: [],
    transgressionActions: [],
  });

  const [manualInputsTouched, setManualInputsTouched] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("not_ready");
  const [selectedSection, setSelectedSection] = useState<ReportSection>(1);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>("png");
  const [manualSaveStatus, setManualSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [buildError, setBuildError] = useState<string | null>(null);
  const [finalReportDownloadUrl, setFinalReportDownloadUrl] =
    useState<string | null>(null);

  const metadataComplete =
    metadata.date.trim() !== "" &&
    metadata.preparedBy.trim() !== "" &&
    metadata.approvedBy.trim() !== "";

  const uploadCount = Object.values(uploads).filter(
    (upload) => upload.status === "uploaded"
  ).length;

  const uploadsComplete = uploadCount === 4;
  const manualInputsComplete = manualInputsTouched;

  const canBuild =
    metadataComplete &&
    uploadsComplete &&
    manualInputsComplete &&
    buildStatus !== "building";

  const { setProgress } = useReportProgress();
  const sessionReady =
    Boolean(metadata.date) &&
    Boolean(metadata.preparedBy) &&
    Boolean(metadata.approvedBy) &&
    !reportId;

  // Use ref to track if initial save has been done
  const initialSaveDone = useRef(false);

  // Define handleSaveManualInputs with useCallback
  const handleSaveManualInputs = useCallback(async () => {
    if (!reportId) {
      return;
    }

    try {
      setManualSaveStatus("saving");
      const response = await updateManualInputs(reportId, {
        prepared_by: metadata.preparedBy,
        confirmed_by: metadata.approvedBy,
        weighbridge_name: weighbridgeName,

        traffic_census: {
          buses_gte_3500kg: manualInputs.buses3500,
          vehicles_3500_to_7000_excluding_buses:
            manualInputs.vehicles3500to7000,
          vehicles_gte_7000_excluding_buses:
            manualInputs.vehicles7000,
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
            weight_noted: row.weightNoted,
            tagged_in_system: row.taggedInSystem,
          })),
        },

        extra: {
          cases_cleared_in_court: manualInputs.casesCleared,
          transgressions_count: manualInputs.transgressions,
        },
      });

      console.log("MANUAL INPUTS SAVED:", response);
      setManualInputsTouched(true);
      setManualSaveStatus("saved");
    } catch (error) {
      console.error(error);
      setManualSaveStatus("error");
    }
  }, [reportId, metadata.preparedBy, metadata.approvedBy, weighbridgeName, manualInputs]);

  async function handleBuildReport() {
    if (!canBuild) return;
    if (!reportId) {
      setBuildStatus("error");
      setBuildError("Create a backend session before building the final report.");
      return;
    }

    setBuildStatus("building");
    setBuildError(null);
    setFinalReportDownloadUrl(null);

    try {
      const response = await buildFinalReport(reportId);
      const finalReport = response.final_report;

      if (finalReport.status === "ready") {
        setBuildStatus("completed");
        setFinalReportDownloadUrl(
          await getFinalReportDownloadUrl(response.report_id)
        );
        return;
      }

      setBuildStatus("error");
      setBuildError(
        finalReport.error ||
          "Backend did not mark the final report as ready."
      );
    } catch (error) {
      console.error(error);
      setBuildStatus("error");
      setBuildError(
        error instanceof Error
          ? error.message
          : "Failed to build final report"
      );
    }
  }

  function handleDownloadReport() {
    if (!finalReportDownloadUrl) return;

    window.open(finalReportDownloadUrl, "_blank", "noreferrer");
  }

  function handleResetReport() {
    setMetadata({
      date: "",
      preparedBy: "",
      approvedBy: "",
    });

    setUploads({
      daily_hour: { status: "missing" },
      wideload: { status: "missing" },
      impounded_prohibited: { status: "missing" },
      impounded_overloaded: { status: "missing" },
    });

    setManualInputs({
      casesCleared: 0,
      transgressions: 0,
      buses3500: 0,
      vehicles3500to7000: 0,
      vehicles7000: 0,
      dailyTransgressions: [],
      transgressionActions: [],
    });

    setManualInputsTouched(false);
    setBuildStatus("not_ready");
    setBuildError(null);
    setFinalReportDownloadUrl(null);
    setSelectedSection(1);
    setPreviewFormat("png");
    setReportId(null);
    initialSaveDone.current = false;

    localStorage.removeItem("active-report-id");
  }

  const handleCreateSession = useCallback(async () => {
    try {
      const response = await createReportSession({
        report_date: metadata.date,
        station: weighbridgeName,
        bound: boundName,
        weighbridge_name: weighbridgeName,
        prepared_by: metadata.preparedBy,
        confirmed_by: metadata.approvedBy,
      });

      console.log("SESSION CREATED:", response);
      setReportId(response.report_id);
      localStorage.setItem("active-report-id", response.report_id);
    } catch (error) {
      console.error(error);
    }
  }, [metadata.date, metadata.preparedBy, metadata.approvedBy, weighbridgeName, boundName]);

  async function handleSectionUpload(section: UploadKey, file: File) {
    if (!reportId) {
      alert("Create backend session first.");
      return;
    }

    try {
      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "selected",
          filename: file.name,
          error: undefined,
        },
      }));

      const response = await uploadSectionFile(reportId, section, file);
      console.log(`${section.toUpperCase()} RESPONSE:`, response);

      const backendSectionKey = BACKEND_SECTION_KEYS[section];
      const backendSection = response.sections?.[backendSectionKey];
      const backendStatus = backendSection?.status;

      const mappedStatus = backendStatus
        ? BACKEND_SECTION_STATUS_MAP[
            backendStatus as keyof typeof BACKEND_SECTION_STATUS_MAP
          ]
        : "missing";

      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: mappedStatus,
          filename: file.name,
          error: undefined,
        },
      }));
    } catch (error: unknown) {
      console.error(error);

      const err = error as {
        response?: {
          data?: {
            detail?: { message?: string } | string;
          };
        };
        message?: string;
      };
      const detail = err?.response?.data?.detail;
      const message =
        (typeof detail === "object" && detail?.message) ||
        (typeof detail === "string" ? detail : undefined) ||
        err?.message ||
        "Upload failed. Please check that the file matches the expected format.";

      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "error",
          filename: file.name,
          error: typeof message === "string" ? message : JSON.stringify(message),
        },
      }));
    }
  }

  // Effect for progress updates
  useEffect(() => {
    setProgress({
      metadataComplete,
      uploadsComplete,
      manualInputsComplete,
      uploadCount,
      canBuild,
      sessionId: reportId,
    });
  }, [
    metadataComplete,
    uploadsComplete,
    manualInputsComplete,
    uploadCount,
    canBuild,
    reportId,
    setProgress,
  ]);

  // Effect to restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedReportId = localStorage.getItem("active-report-id");
        if (!savedReportId) return;

        const session = await getReportSession(savedReportId);
        console.log("RESTORED SESSION:", session);

        setReportId(savedReportId);

        setMetadata({
          date: session.metadata?.report_date || "",
          preparedBy: session.metadata?.prepared_by || "",
          approvedBy: session.metadata?.confirmed_by || "",
        });

        setWeighbridgeName(
          session.metadata?.weighbridge_name ||
            session.metadata?.station ||
            "JUJA"
        );
        setBoundName(session.metadata?.bound || "THIKA BOUND");

        const restoredUploads: Record<UploadKey, UploadState> = {
          daily_hour: { status: "missing" },
          wideload: { status: "missing" },
          impounded_prohibited: { status: "missing" },
          impounded_overloaded: { status: "missing" },
        };

        (Object.keys(BACKEND_SECTION_KEYS) as UploadKey[]).forEach((key) => {
          const backendKey = BACKEND_SECTION_KEYS[key];
          const section = session.sections?.[backendKey];

          if (!section) return;

          const mappedStatus =
            BACKEND_SECTION_STATUS_MAP[
              section.status as keyof typeof BACKEND_SECTION_STATUS_MAP
            ] || "missing";

          restoredUploads[key] = {
            status: mappedStatus,
          };
        });

        setUploads(restoredUploads);

        const restoredManualInputs = session.manual_inputs;

        if (restoredManualInputs) {
          const trafficCensus = restoredManualInputs.traffic_census;
          const transgressions = restoredManualInputs.transgressions;
          const dailyTransgressions =
            transgressions?.daily_transgressions || [];
          const transgressionActions =
            transgressions?.action_report || [];

          setManualInputs({
            casesCleared: numberFromSession(
              restoredManualInputs.cases_cleared_in_court
            ),
            transgressions: numberFromSession(
              restoredManualInputs.transgressions_count
            ),
            buses3500: numberFromSession(
              trafficCensus?.buses_gte_3500kg
            ),
            vehicles3500to7000: numberFromSession(
              trafficCensus?.vehicles_3500_to_7000_excluding_buses
            ),
            vehicles7000: numberFromSession(
              trafficCensus?.vehicles_gte_7000_excluding_buses
            ),
            dailyTransgressions: dailyTransgressions.map(
              mapDailyTransgressionRow
            ),
            transgressionActions: transgressionActions.map(
              mapTransgressionActionRow
            ),
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
          setFinalReportDownloadUrl(
            await getFinalReportDownloadUrl(savedReportId)
          );
          setBuildError(null);
        } else if (session.final_report?.status === "error") {
          setBuildStatus("error");
          setBuildError(
            session.final_report.error ||
              "The backend reported a final report build error."
          );
          setFinalReportDownloadUrl(null);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    localStorage.setItem(ACTIVE_WEIGHBRIDGE_KEY, weighbridgeName);
  }, [weighbridgeName]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_BOUND_KEY, boundName);
  }, [boundName]);

  useEffect(() => {
    if (!reportId) return;

    const timeout = setTimeout(async () => {
      try {
        const response = await updateReportSessionMetadata(reportId, {
          station: weighbridgeName,
          bound: boundName,
          weighbridge_name: weighbridgeName,
        });

        setBuildStatus(
          response.final_report.status === "ready" ? "completed" : "not_ready"
        );
        setFinalReportDownloadUrl(
          response.final_report.status === "ready"
            ? await getFinalReportDownloadUrl(response.report_id)
            : null
        );
        setBuildError(response.final_report.error);
      } catch (error) {
        console.error("Failed to update session metadata:", error);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [reportId, weighbridgeName, boundName]);

  // Effect to save manual inputs when reportId is ready
  useEffect(() => {
    if (!reportId) return;
    if (!metadataComplete) return;
    if (initialSaveDone.current) return;

    initialSaveDone.current = true;
    handleSaveManualInputs();
  }, [reportId, metadataComplete, handleSaveManualInputs]);

  // Effect to save manual inputs with debounce
  useEffect(() => {
    if (!reportId) return;
    if (!metadataComplete) return;

    const timeout = setTimeout(() => {
      handleSaveManualInputs();
    }, 600);

    return () => clearTimeout(timeout);
  }, [manualInputs, metadata.preparedBy, metadata.approvedBy, weighbridgeName, reportId, metadataComplete, handleSaveManualInputs]);

  // Effect to create session
  useEffect(() => {
    if (!sessionReady) return;

    const timeout = setTimeout(() => {
      handleCreateSession();
    }, 300);

    return () => clearTimeout(timeout);
  }, [sessionReady, handleCreateSession]);

  return (
    <>
      <ReportHeader
        weighbridgeName={weighbridgeName}
        boundName={boundName}
        setWeighbridgeName={setWeighbridgeName}
        setBoundName={setBoundName}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {reportId ? (
            <p className="text-sm text-lime-300">
              Report workspace ready
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Complete report info to start a workspace.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            suppressHydrationWarning
            onClick={handleCreateSession}
            disabled={Boolean(!metadataComplete)}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {reportId ? "Report Started" : "Start Report"}
          </button>

          <button
            onClick={handleResetReport}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            New Report / Reset
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_220px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT CONTENT */}
        <div className="space-y-5">
          {/* KPI CARDS */}
          <SummaryCards
            reportId={reportId}
            refreshKey={uploadCount}
          />

          {/* MAIN BUILDER */}
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5">
            <UploadChecklist
              uploads={uploads}
              onSectionUpload={handleSectionUpload}
            />

            <div className="mt-6">
              <ReportMetadataForm
                metadata={metadata}
                setMetadata={setMetadata}
              />
            </div>

            <div className="mt-6">
              <SectionPreviewPanel
                reportId={reportId}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                previewFormat={previewFormat}
                setPreviewFormat={setPreviewFormat}
              />
            </div>
          </div>
        </div>

        {/* RIGHT STICKY PANEL */}
        <div className="xl:sticky xl:top-6 xl:self-start xl:justify-self-end">
          <ManualInputsPanel
            manualInputs={manualInputs}
            setManualInputs={setManualInputs}
            setManualInputsTouched={setManualInputsTouched}
            buildStatus={buildStatus}
            onBuildReport={handleBuildReport}
            onDownloadReport={handleDownloadReport}
            canBuild={canBuild}
            manualSaveStatus={manualSaveStatus}
            buildError={buildError}
            finalReportDownloadUrl={finalReportDownloadUrl}
          />
        </div>
      </div>
    </>
  );
}
