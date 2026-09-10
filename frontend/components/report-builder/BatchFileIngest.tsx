"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  UploadKey,
  UploadState,
  ManualInputs,
  BuildStatus,
} from "@/lib/types";
import {
  ClassifiedTarget,
  ConfidenceLevel,
  TARGET_CATEGORIES,
  classifyFile,
  formatFileSize,
} from "@/lib/fileClassifier";
import { processTransgressionFiles } from "@/lib/transgressionIngest";
import { processCensusFiles } from "@/lib/censusIngest";

export type StagedFileItem = {
  id: string;
  file: File;
  detectedTarget: ClassifiedTarget;
  selectedTarget: ClassifiedTarget;
  confidence: ConfidenceLevel;
  reason: string;
  status: "staged" | "uploading" | "extracting" | "ready" | "error";
  error?: string;
};

type BatchFileIngestProps = {
  reportId: string | null;
  uploads: Record<UploadKey, UploadState>;
  onSectionUpload: (section: UploadKey, file: File) => Promise<void>;
  manualInputs: ManualInputs;
  setManualInputs: React.Dispatch<React.SetStateAction<ManualInputs>>;
  setManualInputsTouched: React.Dispatch<React.SetStateAction<boolean>>;
  canBuild: boolean;
  onBuildReport: () => void;
  buildStatus: BuildStatus;
  resetKey?: number;
};

const SPREADSHEET_SECTIONS: UploadKey[] = [
  "daily_hour",
  "wideload",
  "impounded_prohibited",
  "impounded_overloaded",
];

export function BatchFileIngest({
  reportId,
  uploads,
  onSectionUpload,
  manualInputs,
  setManualInputs,
  setManualInputsTouched,
  canBuild,
  onBuildReport,
  buildStatus,
  resetKey,
}: BatchFileIngestProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestSummary, setIngestSummary] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear staged batch files and reset to default when resetKey changes or reportId is cleared
  useEffect(() => {
    setStagedFiles([]);
    setIngestSummary(null);
    setIsDragging(false);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetKey, reportId]);

  const addFilesToStaging = useCallback(
    async (incomingFiles: FileList | File[]) => {
      const fileArray = Array.from(incomingFiles);
      if (fileArray.length === 0) return;

      const newStagedItems: StagedFileItem[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const classification = await classifyFile(file);
        newStagedItems.push({
          id: `${file.name}-${file.size}-${Date.now()}-${i}`,
          file,
          detectedTarget: classification.target,
          selectedTarget: classification.target,
          confidence: classification.confidence,
          reason: classification.reason,
          status: "staged",
        });
      }

      setStagedFiles((prev) => [...prev, ...newStagedItems]);
      setIngestSummary(null);
    },
    []
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFilesToStaging(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const updateFileTarget = (id: string, newTarget: ClassifiedTarget) => {
    setStagedFiles((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selectedTarget: newTarget } : item
      )
    );
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllStagedFiles = () => {
    setStagedFiles([]);
    setIngestSummary(null);
  };

  // Check section coverage across already-uploaded and staged files
  const sectionCoverage = {
    daily_hour:
      uploads.daily_hour?.status === "uploaded" ||
      stagedFiles.some((f) => f.selectedTarget === "daily_hour"),
    wideload:
      uploads.wideload?.status === "uploaded" ||
      stagedFiles.some((f) => f.selectedTarget === "wideload"),
    impounded_prohibited:
      uploads.impounded_prohibited?.status === "uploaded" ||
      stagedFiles.some((f) => f.selectedTarget === "impounded_prohibited"),
    impounded_overloaded:
      uploads.impounded_overloaded?.status === "uploaded" ||
      stagedFiles.some((f) => f.selectedTarget === "impounded_overloaded"),
    transgressionsStaged: stagedFiles.filter(
      (f) => f.selectedTarget === "transgression"
    ).length,
    censusStaged: stagedFiles.filter(
      (f) => f.selectedTarget === "census"
    ).length,
  };

  const allSpreadsheetsCovered =
    sectionCoverage.daily_hour &&
    sectionCoverage.wideload &&
    sectionCoverage.impounded_prohibited &&
    sectionCoverage.impounded_overloaded;

  const handleExecuteBatchIngest = async () => {
    if (!reportId) {
      setIngestSummary({
        type: "error",
        message: "Please create or select a report workspace before ingesting files.",
      });
      return;
    }

    if (stagedFiles.length === 0) return;

    setIsProcessing(true);
    setIngestSummary(null);

    const spreadsheetItems = stagedFiles.filter(
      (f) =>
        SPREADSHEET_SECTIONS.includes(f.selectedTarget as UploadKey) &&
        f.status !== "ready"
    );

    // Sort spreadsheets in canonical dependency order
    spreadsheetItems.sort(
      (a, b) =>
        SPREADSHEET_SECTIONS.indexOf(a.selectedTarget as UploadKey) -
        SPREADSHEET_SECTIONS.indexOf(b.selectedTarget as UploadKey)
    );

    const transgressionItems = stagedFiles.filter(
      (f) => f.selectedTarget === "transgression" && f.status !== "ready"
    );

    const censusItems = stagedFiles.filter(
      (f) => f.selectedTarget === "census" && f.status !== "ready"
    );

    let spreadsheetSuccessCount = 0;
    let spreadsheetErrorCount = 0;

    // 1. Process Spreadsheet Files sequentially
    for (const item of spreadsheetItems) {
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "uploading", error: undefined } : f
        )
      );

      try {
        await onSectionUpload(item.selectedTarget as UploadKey, item.file);

        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "ready" } : f
          )
        );
        spreadsheetSuccessCount++;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to upload file";
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", error: errorMsg } : f
          )
        );
        spreadsheetErrorCount++;
      }
    }

    // 2. Process Transgression and Census Scan Files Concurrently
    const hasTransgression = transgressionItems.length > 0;
    const hasCensus = censusItems.length > 0;

    let transgressionSuccessCount = 0;
    let transgressionErrorCount = 0;
    let censusSuccessCount = 0;
    let censusErrorCount = 0;

    if (hasTransgression || hasCensus) {
      // Mark all OCR items as extracting simultaneously
      setStagedFiles((prev) =>
        prev.map((f) => {
          if (
            (hasTransgression && transgressionItems.some((t) => t.id === f.id)) ||
            (hasCensus && censusItems.some((c) => c.id === f.id))
          ) {
            return { ...f, status: "extracting", error: undefined };
          }
          return f;
        })
      );

      // Execute both OCR extractions concurrently
      const [transgressionResult, censusResult] = await Promise.all([
        hasTransgression
          ? processTransgressionFiles(
              transgressionItems.map((t) => t.file),
              reportId,
              manualInputs
            )
          : Promise.resolve(null),
        hasCensus
          ? processCensusFiles(
              censusItems.map((c) => c.file),
              reportId,
              manualInputs
            )
          : Promise.resolve(null),
      ]);

      // Atomic functional state merge: combines both results into manualInputs without data loss
      const hasTransgressionData = Boolean(
        transgressionResult && transgressionResult.extractedCount > 0
      );
      const hasCensusData = Boolean(
        censusResult && censusResult.success && censusResult.extractedValues
      );

      if (hasTransgressionData || hasCensusData) {
        setManualInputs((prev) => {
          let next = { ...prev };
          if (hasTransgressionData && transgressionResult) {
            const combinedDaily = [
              ...next.dailyTransgressions,
              ...transgressionResult.extractedDailyList,
            ];
            const combinedAction = [
              ...next.transgressionActions,
              ...transgressionResult.extractedActionList,
            ];
            next = {
              ...next,
              dailyTransgressions: combinedDaily,
              transgressionActions: combinedAction,
              transgressions: combinedDaily.length,
            };
          }
          if (hasCensusData && censusResult?.extractedValues) {
            next = {
              ...next,
              buses3500: censusResult.extractedValues.buses3500,
              vehicles3500to7000: censusResult.extractedValues.vehicles3500to7000,
              vehicles7000: censusResult.extractedValues.vehicles7000,
              ccRecords: censusResult.extractedValues.ccRecords,
            };
          }
          return next;
        });
        setManualInputsTouched(true);
      }

      // Update per-item status for both transgression and census files
      setStagedFiles((prev) =>
        prev.map((f) => {
          if (hasTransgression && transgressionItems.some((t) => t.id === f.id)) {
            const matchingItem = transgressionItems.find((t) => t.id === f.id);
            const hasError = transgressionResult?.errors.some((err) =>
              err.includes(matchingItem?.file.name || "")
            );
            if (
              hasError ||
              (transgressionResult &&
                transgressionResult.extractedCount === 0 &&
                transgressionResult.errors.length > 0)
            ) {
              transgressionErrorCount++;
              return {
                ...f,
                status: "error",
                error: "OCR extraction could not extract valid truck data",
              };
            }
            transgressionSuccessCount++;
            return { ...f, status: "ready" };
          }

          if (hasCensus && censusItems.some((c) => c.id === f.id)) {
            const matchingItem = censusItems.find((c) => c.id === f.id);
            const hasError = censusResult?.errors.some((err) =>
              err.includes(matchingItem?.file.name || "")
            );
            if (hasError || (censusResult && !censusResult.success)) {
              censusErrorCount++;
              return {
                ...f,
                status: "error",
                error: "Could not extract census subtotals from document",
              };
            }
            censusSuccessCount++;
            return { ...f, status: "ready" };
          }

          return f;
        })
      );

      // Handle feedback summaries from OCR
      if (
        transgressionResult?.feedbackType === "error" &&
        transgressionResult.feedbackMessage
      ) {
        setIngestSummary({
          type: "error",
          message: transgressionResult.feedbackMessage,
        });
      } else if (
        censusResult?.feedbackType === "error" &&
        censusResult.feedbackMessage
      ) {
        setIngestSummary({
          type: "error",
          message: censusResult.feedbackMessage,
        });
      }
    }

    setIsProcessing(false);

    // Provide overall completion summary if not already set by alert
    if (spreadsheetErrorCount === 0 && transgressionErrorCount === 0 && censusErrorCount === 0) {
      const summaryMsg = `Successfully ingested ${spreadsheetSuccessCount} data section(s)${
        transgressionSuccessCount > 0
          ? ` and processed ${transgressionSuccessCount} transgression form(s)`
          : ""
      }${
        censusSuccessCount > 0
          ? ` and processed ${censusSuccessCount} census record(s)`
          : ""
      }. All mappings verified!`;
      setIngestSummary({
        type: "success",
        message: summaryMsg,
      });
    } else {
      setIngestSummary({
        type: "error",
        message: `Ingest completed with errors: ${spreadsheetErrorCount + transgressionErrorCount + censusErrorCount} file(s) had issues. Check row indicators below.`,
      });
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-[#071827] p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/40 pb-4">
        <div>
          <h3 className="text-base font-bold text-cyan-100">
            Batch file intake and auto mapping
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Upload all the files needed for report generation here. Review the auto detect categories and verify before building.
          </p>
        </div>

        {/* Coverage chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              sectionCoverage.daily_hour
                ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            Daily Hour {sectionCoverage.daily_hour ? "✓" : ""}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              sectionCoverage.wideload
                ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            Wideload {sectionCoverage.wideload ? "✓" : ""}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              sectionCoverage.impounded_prohibited
                ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            Prohibited {sectionCoverage.impounded_prohibited ? "✓" : ""}
          </span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              sectionCoverage.impounded_overloaded
                ? "bg-lime-500/20 text-lime-300 border border-lime-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            Overloaded {sectionCoverage.impounded_overloaded ? "✓" : ""}
          </span>
          {sectionCoverage.transgressionsStaged > 0 && (
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
              {sectionCoverage.transgressionsStaged} Transgression Scan(s)
            </span>
          )}
          {sectionCoverage.censusStaged > 0 && (
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {sectionCoverage.censusStaged} Census Scan(s)
            </span>
          )}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/40"
            : "border-cyan-900/60 bg-[#0b2238]/60 hover:border-cyan-500/60 hover:bg-[#0b2238]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.tiff,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              addFilesToStaging(e.target.files);
              e.target.value = "";
            }
          }}
        />

        <div className="rounded-full bg-cyan-950/80 p-3 text-cyan-400">
          <UploadCloud className="h-7 w-7" />
        </div>
        <p className="mt-2 text-sm font-semibold text-cyan-200">
          Drop all files here or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Upload Daily hour, wideload, impounded overloaded, impounded prohibited, & transgression form.
        </p>
      </div>

      {/* Staged & Classified Files Table */}
      {stagedFiles.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Staged Files & Mappings ({stagedFiles.length})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                <Plus className="h-3.5 w-3.5" /> Add More
              </button>
              <button
                type="button"
                onClick={clearAllStagedFiles}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Queue
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-cyan-950 bg-[#051320]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-cyan-900/60 bg-[#071827] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Detected Target</th>
                  <th className="py-2.5 px-3">Assigned Form / Input</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/60">
                {stagedFiles.map((item) => {
                  const isSpreadsheet =
                    item.file.name.endsWith(".csv") ||
                    item.file.name.endsWith(".xlsx") ||
                    item.file.name.endsWith(".xls");

                  return (
                    <tr key={item.id} className="hover:bg-cyan-950/30">
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          {isSpreadsheet ? (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[220px]" title={item.file.name}>
                            {item.file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatFileSize(item.file.size)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold w-fit ${
                              item.confidence === "high"
                                ? "bg-lime-500/20 text-lime-300"
                                : item.confidence === "medium"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {TARGET_CATEGORIES.find(
                              (c) => c.key === item.detectedTarget
                            )?.badgeLabel || item.detectedTarget}
                          </span>
                          <span className="mt-0.5 text-[10px] text-slate-400 italic">
                            {item.reason}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={item.selectedTarget}
                          disabled={item.status === "ready" || isProcessing}
                          onChange={(e) =>
                            updateFileTarget(
                              item.id,
                              e.target.value as ClassifiedTarget
                            )
                          }
                          className="rounded border border-cyan-800/80 bg-[#071827] px-2 py-1 text-xs text-cyan-200 focus:border-cyan-400 focus:outline-none disabled:opacity-70"
                        >
                          {TARGET_CATEGORIES.map((cat) => (
                            <option
                              key={cat.key}
                              value={cat.key}
                              disabled={cat.disabled}
                            >
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.status === "staged" && (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                            Staged
                          </span>
                        )}
                        {item.status === "uploading" && (
                          <span className="flex items-center gap-1 text-[11px] text-cyan-300">
                            <Loader2 className="h-3 w-3 animate-spin" /> Uploading
                          </span>
                        )}
                        {item.status === "extracting" && (
                          <span className="flex items-center gap-1 text-[11px] text-yellow-300">
                            <Loader2 className="h-3 w-3 animate-spin" /> OCR Extracting
                          </span>
                        )}
                        {item.status === "ready" && (
                          <span className="flex items-center gap-1 text-[11px] text-lime-300 font-semibold">
                            <CheckCircle2 className="h-3 w-3 text-lime-400" /> Ingested
                          </span>
                        )}
                        {item.status === "error" && (
                          <div className="flex items-center gap-1 text-[11px] text-red-400">
                            <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                            <span title={item.error} className="truncate max-w-[120px]">
                              {item.error || "Error"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeStagedFile(item.id)}
                          disabled={isProcessing}
                          className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                          title="Remove file from queue"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Feedback & Ingest Action Row */}
          {ingestSummary && (
            <div
              className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
                ingestSummary.type === "success"
                  ? "border-lime-500/30 bg-lime-500/10 text-lime-200"
                  : ingestSummary.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
              }`}
            >
              {ingestSummary.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <p>{ingestSummary.message}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400">
              {!reportId ? (
                <span className="text-yellow-400">
                  Please create a report workspace above before ingesting.
                </span>
              ) : (
                <span>
                  {allSpreadsheetsCovered
                    ? "✓ All 4 spreadsheet categories matched and ready to process."
                    : "Tip: Verify mappings before triggering ingest."}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExecuteBatchIngest}
                disabled={isProcessing || !reportId || stagedFiles.length === 0}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingesting & Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-yellow-300" /> Ingest Mapped Files
                  </>
                )}
              </button>

              {/* Direct Trigger to Build Report once conditions are met */}
              {canBuild && (
                <button
                  type="button"
                  onClick={onBuildReport}
                  disabled={buildStatus === "building"}
                  className="flex items-center gap-2 rounded-lg border border-lime-500/40 bg-lime-500/20 px-4 py-2 text-xs font-bold text-lime-300 hover:bg-lime-500/30 disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" /> Build Report Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
