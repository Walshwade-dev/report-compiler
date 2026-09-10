import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  BuildStatus,
  ManualInputs,
  CCRecordRow,
  DailyTransgressionRow,
  TransgressionActionRow,
} from "@/lib/types";
import { extractTransgressionOcr } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";

type ManualInputsPanelProps = {
  manualInputs: ManualInputs;
  setManualInputs: React.Dispatch<
    React.SetStateAction<ManualInputs>
  >;
  buildStatus: BuildStatus;
  onBuildReport: () => void;
  canBuild: boolean;
  setManualInputsTouched: React.Dispatch<React.SetStateAction<boolean>>;
  manualSaveStatus: "idle" | "saving" | "saved" | "error";
  buildError: string | null;
  finalReportDownloadUrl: string | null;
  excelReportDownloadUrl: string | null;
  onSaveManualInputs?: () => void;
  reportId?: string | null;
};

const emptyDailyTransgression = {
  date: "",
  time: "0000hrs",
  regNo: "",
  axleConfig: "",
  transporter: "",
  censusClerk: "",
  policeInCharge: "",
  actionTaken: "",
  caught: "",
  nextWbReportSent: "-",
  nextWb: "-",
};

const emptyActionReport = {
  date: "",
  timeReceived: "0000hrs",
  truckNo: "",
  sendingWbStation: "",
  ocsReportedTo: "NO",
  action1: "",
  action2: "",
  attachEvidence: "",
  weightNoted: "NO",
  taggedInSystem: "NO",
};

export function ManualInputsPanel({
  manualInputs,
  setManualInputs,
  buildStatus,
  onBuildReport,
  canBuild,
  setManualInputsTouched,
  manualSaveStatus,
  buildError,
  finalReportDownloadUrl,
  excelReportDownloadUrl,
  onSaveManualInputs,
  reportId,
}: ManualInputsPanelProps) {
  const [transgressionModalOpen, setTransgressionModalOpen] =
    useState(false);
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrFeedback, setOcrFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear feedback and close modal when session is reset or when transgression entries are cleared
  useEffect(() => {
    if (
      !reportId ||
      (manualInputs.dailyTransgressions.length === 0 &&
        manualInputs.transgressionActions.length === 0)
    ) {
      setOcrFeedback(null);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    }
    if (!reportId) {
      setTransgressionModalOpen(false);
    }
  }, [
    reportId,
    manualInputs.dailyTransgressions.length,
    manualInputs.transgressionActions.length,
  ]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleOcrFilesUpload = async (files: File[]) => {
    if (!reportId) {
      setOcrFeedback({
        type: "error",
        message: "Please initialize or select a report session before uploading documents.",
      });
      return;
    }

    if (files.length === 0) return;

    setOcrUploading(true);
    setOcrFeedback(null);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    const normalizePlate = (p?: string) =>
      (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    const extractedDailyList: DailyTransgressionRow[] = [];
    const extractedActionList: TransgressionActionRow[] = [];
    const plates: string[] = [];
    const duplicates: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await extractTransgressionOcr(reportId, file);
        if (result.success && result.extracted) {
          const newDaily = result.extracted.daily_transgression;
          const newAction = result.extracted.action_report;
          const plate =
            newDaily.regNo ||
            newAction.truckNo ||
            "Vehicle";
          const normCandidate = normalizePlate(plate);
          const isValidPlate =
            normCandidate !== "" && normCandidate !== "VEHICLE";

          // Check if details have already been populated for this truck or Tag ID
          const isAlreadyPopulated =
            Boolean(
              isValidPlate &&
                (manualInputs.dailyTransgressions.some(
                  (r) => normalizePlate(r.regNo) === normCandidate
                ) ||
                  manualInputs.transgressionActions.some(
                    (r) => normalizePlate(r.truckNo) === normCandidate
                  ) ||
                  extractedDailyList.some(
                    (r) => normalizePlate(r.regNo) === normCandidate
                  ))
            ) ||
            Boolean(
              newAction.attachEvidence &&
                manualInputs.transgressionActions.some((r) => {
                  const tagCandidate = newAction.attachEvidence
                    .split(",")[0]
                    .trim()
                    .toUpperCase();
                  return (
                    tagCandidate.startsWith("TAG") &&
                    r.attachEvidence &&
                    r.attachEvidence.toUpperCase().includes(tagCandidate)
                  );
                })
            );

          if (isAlreadyPopulated) {
            duplicates.push(plate);
          } else {
            extractedDailyList.push(newDaily);
            extractedActionList.push(newAction);
            plates.push(plate);
          }
        } else {
          errors.push(`${file.name}: Extraction did not return records.`);
        }
      } catch (err) {
        errors.push(
          `${file.name}: ${err instanceof Error ? err.message : "Failed to extract"}`
        );
      }
    }

    // Handle duplicates alert
    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      const dupPlatesText = uniqueDuplicates.map((p) => `"${p}"`).join(", ");
      const alertMsg =
        uniqueDuplicates.length === 1
          ? `Transgression details for ${dupPlatesText} have already been populated and can not be repopulated for the same truck.`
          : `Transgression details for ${dupPlatesText} have already been populated and can not be repopulated for the same trucks.`;

      if (typeof window !== "undefined") {
        window.alert(alertMsg);
      }

      if (extractedDailyList.length === 0) {
        setOcrFeedback({
          type: "error",
          message: alertMsg,
        });
      }
    }

    if (extractedDailyList.length > 0) {
      setManualInputsTouched(true);
      setManualInputs((prev) => {
        const nextDaily = [
          ...prev.dailyTransgressions,
          ...extractedDailyList,
        ];
        const nextAction = [
          ...prev.transgressionActions,
          ...extractedActionList,
        ];
        return {
          ...prev,
          dailyTransgressions: nextDaily,
          transgressionActions: nextAction,
          transgressions: nextDaily.length,
        };
      });

      const platesText = plates.map((p) => `"${p}"`).join(", ");
      const successMsg = `successfully extracted transgression details for ${platesText}`;

      if (duplicates.length > 0) {
        const uniqueDuplicates = Array.from(new Set(duplicates));
        const dupPlatesText = uniqueDuplicates.map((p) => `"${p}"`).join(", ");
        setOcrFeedback({
          type: "error",
          message: `${successMsg}. Note: details for ${dupPlatesText} were already populated and skipped.`,
        });
      } else if (errors.length > 0) {
        setOcrFeedback({
          type: "error",
          message: `${successMsg}. (Errors: ${errors.join("; ")})`,
        });
      } else {
        setOcrFeedback({
          type: "success",
          message: successMsg,
        });

        // Heads up label: auto-disappear in less than a second (850ms)
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
          setOcrFeedback(null);
        }, 850);
      }
    } else if (duplicates.length === 0) {
      setOcrFeedback({
        type: "error",
        message:
          errors.length > 0
            ? errors.join("; ")
            : "Failed to extract transgression data from document.",
      });
    }

    setOcrUploading(false);
  };

  const handleCellChange = (rowIndex: number, colKey: keyof CCRecordRow, value: number) => {
    setManualInputsTouched(true);
    setManualInputs((prev) => {
      const nextCcRecords = prev.ccRecords ? [...prev.ccRecords] : [
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
      ];
      nextCcRecords[rowIndex] = {
        ...nextCcRecords[rowIndex],
        [colKey]: value,
      };
      return {
        ...prev,
        ccRecords: nextCcRecords,
      };
    });
  };

  const ccRecords = manualInputs.ccRecords || [
    { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
    { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
    { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
  ];

  const colTotals = {
    buses: ccRecords.reduce((sum, r) => sum + (r.buses_gte_3500kg || 0), 0),
    v3500to7000: ccRecords.reduce((sum, r) => sum + (r.vehicles_3500_to_7000_excluding_buses || 0), 0),
    v7000: ccRecords.reduce((sum, r) => sum + (r.vehicles_gte_7000_excluding_buses || 0), 0),
  };

  return (
    <>
      <aside className="w-full rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-4 xl:w-[220px] 2xl:w-[320px]">
        <h2 className="text-sm font-bold text-cyan-200">
          Manual Inputs
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {manualSaveStatus === "saving" && "Saving manual inputs..."}
          {manualSaveStatus === "saved" && "Manual inputs saved"}
          {manualSaveStatus === "error" && "Failed to save manual inputs"}
          {manualSaveStatus === "idle" && "Auto-save enabled"}
        </p>

        <div className="mt-3">
          <StatusBadge
            label={
              buildStatus === "building"
                ? "Building"
                : buildStatus === "completed"
                ? "Completed"
                : buildStatus === "error"
                ? "Error"
                : canBuild
                ? "Ready"
                : "Not Ready"
            }
            variant={
              buildStatus === "building"
                ? "warning"
                : buildStatus === "completed"
                ? "success"
                : buildStatus === "error"
                ? "error"
                : canBuild
                ? "info"
                : "pending"
            }
          />
        </div>

        {buildError && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {buildError}
          </p>
        )}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cases Cleared
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={manualInputs.casesCleared}
              onChange={(e) => {
                setManualInputsTouched(true);
                setManualInputs((prev) => ({
                  ...prev,
                  casesCleared: Number(e.target.value),
                }));
              }}
              className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transgressions
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={manualInputs.transgressions}
              onChange={(e) => {
                setManualInputsTouched(true);
                setManualInputs((prev) => ({
                  ...prev,
                  transgressions: Number(e.target.value),
                }));
              }}
              className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            />
          </label>

          <button
            onClick={() => setTransgressionModalOpen(true)}
            className="w-full rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10"
          >
            Manage Transgression Details
          </button>

          {onSaveManualInputs && (
            <button
              onClick={onSaveManualInputs}
              disabled={manualSaveStatus === "saving"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600/30 border border-cyan-500/50 px-4 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-600/50 disabled:opacity-50"
            >
              <Save aria-hidden="true" size={16} />
              {manualSaveStatus === "saving" ? "Saving..." : "Save Manual Inputs"}
            </button>
          )}

          <div className="mt-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Traffic Census (CC Records)
            </span>
            <div className="overflow-x-auto rounded-lg border border-cyan-800/40 bg-[#071827] p-2">
              <table className="w-full border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-cyan-800/40 text-slate-400 font-bold uppercase text-[9px] tracking-wider text-center">
                    <th className="py-2 px-1">
                      <div className="flex flex-col items-center leading-tight">
                        <span>Buses</span>
                        <span className="text-[8px] text-slate-500 font-normal mt-0.5">&ge;3.5k</span>
                      </div>
                    </th>
                    <th className="py-2 px-1">
                      <div className="flex flex-col items-center leading-tight">
                        <span>Vehicles</span>
                        <span className="text-[8px] text-slate-500 font-normal mt-0.5">3.5-7k</span>
                      </div>
                    </th>
                    <th className="py-2 px-1">
                      <div className="flex flex-col items-center leading-tight">
                        <span>Vehicles</span>
                        <span className="text-[8px] text-slate-500 font-normal mt-0.5">&ge;7k</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/40">
                  {[0, 1, 2].map((rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-cyan-950/10 text-center">
                      <td className="py-1 px-0.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={ccRecords[rowIndex]?.buses_gte_3500kg ?? 0}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            handleCellChange(rowIndex, "buses_gte_3500kg", val ? Number(val) : 0);
                          }}
                          className="w-16 sm:w-20 rounded border border-cyan-800/60 bg-[#051421] px-1.5 py-1 text-center text-xs outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </td>
                      <td className="py-1 px-0.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={ccRecords[rowIndex]?.vehicles_3500_to_7000_excluding_buses ?? 0}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            handleCellChange(rowIndex, "vehicles_3500_to_7000_excluding_buses", val ? Number(val) : 0);
                          }}
                          className="w-16 sm:w-20 rounded border border-cyan-800/60 bg-[#051421] px-1.5 py-1 text-center text-xs outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </td>
                      <td className="py-1 px-0.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={ccRecords[rowIndex]?.vehicles_gte_7000_excluding_buses ?? 0}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            handleCellChange(rowIndex, "vehicles_gte_7000_excluding_buses", val ? Number(val) : 0);
                          }}
                          className="w-16 sm:w-20 rounded border border-cyan-800/60 bg-[#051421] px-1.5 py-1 text-center text-xs outline-none focus:border-cyan-500 text-white font-mono"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-cyan-950/20 font-bold border-t border-cyan-900 text-center">
                    <td className="py-2 px-1 font-mono text-cyan-300">
                      <div className="flex flex-col items-center">
                        <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total</span>
                        <span>{colTotals.buses.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 font-mono text-cyan-300">
                      <div className="flex flex-col items-center">
                        <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total</span>
                        <span>{colTotals.v3500to7000.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 font-mono text-cyan-300">
                      <div className="flex flex-col items-center">
                        <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total</span>
                        <span>{colTotals.v7000.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <button
          suppressHydrationWarning
          onClick={onBuildReport}
          disabled={Boolean(!canBuild)}
          className="mt-8 w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {buildStatus === "building"
            ? "Building..."
            : buildStatus === "completed"
            ? "Report Built"
            : buildStatus === "error"
            ? "Retry Build"
            : "Build Final Report"}
        </button>

        {buildStatus === "completed" && finalReportDownloadUrl ? (
          <a
            href={finalReportDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10"
          >
            <FileText aria-hidden="true" size={16} />
            Download DOCX
          </a>
        ) : (
          <button
            disabled
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-300 cursor-not-allowed opacity-40"
          >
            <FileText aria-hidden="true" size={16} />
            Download DOCX
          </button>
        )}

        {buildStatus === "completed" && excelReportDownloadUrl ? (
          <a
            href={excelReportDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/60 px-4 py-3 text-sm font-bold text-emerald-300 hover:bg-[#10b981]/10"
          >
            <FileSpreadsheet aria-hidden="true" size={16} />
            Download Excel
          </a>
        ) : (
          <button
            disabled
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/60 px-4 py-3 text-sm font-bold text-emerald-300 cursor-not-allowed opacity-40"
          >
            <FileSpreadsheet aria-hidden="true" size={16} />
            Download Excel
          </button>
        )}
      </aside>

      {transgressionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-cyan-900/50 bg-[#0b2135] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">
                Transgression Details
              </h2>

              <button
                onClick={() => setTransgressionModalOpen(false)}
                className="rounded-lg border border-cyan-700 px-3 py-1 text-sm text-cyan-300"
              >
                Close
              </button>
            </div>

            {/* Quick Ingest from Document / Ticket (OCR) */}
            <div className="mt-4 rounded-xl border border-cyan-800/60 bg-[#071827] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Auto-Extract via Document OCR
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    upload scanned transgression form.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      ocrUploading
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40"
                    }`}
                  >
                    {ocrUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Extracting OCR...
                      </>
                    ) : (
                      "Upload transgression file"
                    )}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"
                      disabled={ocrUploading}
                      onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        if (files.length > 0) {
                          handleOcrFilesUpload(files);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {ocrFeedback && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                    ocrFeedback.type === "success"
                      ? "border border-lime-500/40 bg-lime-950/30 text-lime-300"
                      : "border border-red-500/40 bg-red-950/30 text-red-300"
                  }`}
                >
                  {ocrFeedback.type === "success" ? (
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-lime-400" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span>{ocrFeedback.message}</span>
                </div>
              )}
            </div>

            <datalist id="actionTakenSuggestions">
              <option value="chased and returned" />
              <option value="chased not found" />
            </datalist>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-cyan-200">
                  Daily Transgressions Report
                </h3>

                <button
                  onClick={() => {
                    setManualInputsTouched(true);
                    setManualInputs((prev) => ({
                      ...prev,
                      dailyTransgressions: [
                        ...prev.dailyTransgressions,
                        emptyDailyTransgression,
                      ],
                    }));
                  }}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950"
                >
                  Add Row
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {manualInputs.dailyTransgressions.map((row, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-cyan-900/50 bg-[#071827] p-3 md:grid-cols-2"
                  >
                    {[
                      ["date", "Date", "date", ""],
                      ["time", "Time", "text", "0000hrs"],
                      ["regNo", "Reg No", "text", ""],
                      ["axleConfig", "Axle Config", "text", ""],
                      ["transporter", "Transporter", "text", ""],
                      ["censusClerk", "Census Clerk", "text", ""],
                      ["policeInCharge", "Police In charge", "text", ""],
                      ["actionTaken", "Action Taken", "text", ""],
                      ["caught", "Caught", "text", ""],
                      ["nextWbReportSent", "Next WB report sent", "text", ""],
                      ["nextWb", "Next WB", "text", ""],
                    ].map(([field, label, type, placeholder]) => (
                      <label key={field} className="block">
                        <span className="text-xs text-slate-400">{label}</span>
                        <input
                          type={type}
                          placeholder={placeholder || undefined}
                          list={field === "actionTaken" ? "actionTakenSuggestions" : undefined}
                          value={String(row[field as keyof typeof row] ?? "")}
                          onChange={(e) => {
                            const value =
                              type === "text" && field !== "time" && field !== "nextWbReportSent" && field !== "nextWb"
                                ? (field === "actionTaken" ? e.target.value : e.target.value.toUpperCase())
                                : e.target.value;
                            setManualInputsTouched(true);
                            setManualInputs((prev) => {
                              const rows = [...prev.dailyTransgressions];
                              rows[index] = {
                                ...rows[index],
                                [field]: value,
                              };
                              return {
                                ...prev,
                                dailyTransgressions: rows,
                              };
                            });
                          }}
                          className="mt-1 w-full rounded-md border border-cyan-700 bg-[#0b2a45] px-3 py-2 text-sm"
                        />
                      </label>
                    ))}
                    <div className="flex justify-end md:col-span-2">
                      <button
                        onClick={() => {
                          setManualInputsTouched(true);
                          setManualInputs((prev) => ({
                            ...prev,
                            dailyTransgressions:
                              prev.dailyTransgressions.filter(
                                (_, rowIndex) => rowIndex !== index
                              ),
                          }));
                        }}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/10"
                      >
                        Remove Row
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-cyan-200">
                  Transgressions Action Report
                </h3>

                <button
                  onClick={() => {
                    setManualInputsTouched(true);
                    setManualInputs((prev) => ({
                      ...prev,
                      transgressionActions: [
                        ...prev.transgressionActions,
                        emptyActionReport,
                      ],
                    }));
                  }}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950"
                >
                  Add Row
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {manualInputs.transgressionActions.map((row, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-cyan-900/50 bg-[#071827] p-3 md:grid-cols-2"
                  >
                    {[
                      ["date", "Date", "date", ""],
                      ["timeReceived", "Time Received", "text", "0000hrs"],
                      ["truckNo", "Truck No.", "text", ""],
                      ["sendingWbStation", "Sending WB station", "text", ""],
                      ["ocsReportedTo", "OCS Reported To", "select", ""],
                      ["action1", "Action 1", "text", ""],
                      ["action2", "Action 2", "text", ""],
                      ["attachEvidence", "Attach evidence", "text", ""],
                      ["weightNoted", "Weight noted", "select", ""],
                      ["taggedInSystem", "Tagged in system", "select", ""],
                    ].map(([field, label, type, placeholder]) => (
                      <label key={field} className="block">
                        <span className="text-xs text-slate-400">{label}</span>
                        {type === "select" ? (
                          <select
                            value={String(row[field as keyof typeof row] || "NO")}
                            onChange={(e) => {
                              setManualInputsTouched(true);
                              setManualInputs((prev) => {
                                const rows = [...prev.transgressionActions];
                                rows[index] = {
                                  ...rows[index],
                                  [field]: e.target.value,
                                };
                                return {
                                  ...prev,
                                  transgressionActions: rows,
                                };
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-cyan-700 bg-[#0b2a45] px-3 py-2 text-sm text-slate-100 outline-none"
                          >
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                          </select>
                        ) : (
                          <input
                            type={type}
                            placeholder={placeholder || undefined}
                            value={String(row[field as keyof typeof row] ?? "")}
                            onChange={(e) => {
                              const value =
                                type === "text" && field !== "timeReceived"
                                  ? e.target.value.toUpperCase()
                                  : e.target.value;
                              setManualInputsTouched(true);
                              setManualInputs((prev) => {
                                const rows = [...prev.transgressionActions];
                                rows[index] = {
                                  ...rows[index],
                                  [field]: value,
                                };
                                return {
                                  ...prev,
                                  transgressionActions: rows,
                                };
                              });
                            }}
                            className="mt-1 w-full rounded-md border border-cyan-700 bg-[#0b2a45] px-3 py-2 text-sm"
                          />
                        )}
                      </label>
                    ))}
                    <div className="flex justify-end md:col-span-2">
                      <button
                        onClick={() => {
                          setManualInputsTouched(true);
                          setManualInputs((prev) => ({
                            ...prev,
                            transgressionActions:
                              prev.transgressionActions.filter(
                                (_, rowIndex) => rowIndex !== index
                              ),
                          }));
                        }}
                        className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/10"
                      >
                        Remove Row
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
