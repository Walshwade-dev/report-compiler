"use client";

import { ReportHeader } from "@/components/report-builder/ReportHeader";
import { SummaryCards } from "@/components/report-builder/SummaryCards";
import { UploadChecklist } from "@/components/report-builder/UploadChecklist";
import { ReportMetadataForm } from "@/components/report-builder/ReportMetadataForm";
import { SectionPreviewPanel } from "@/components/report-builder/SectionPreviewPanel";
import { ManualInputsPanel } from "@/components/report-builder/ManualInputsPanel";
import { useEffect, useState } from "react";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import { PreviewFormat, ReportSection } from "@/lib/types";
import { useReportSession } from "@/lib/hooks/useReportSession";
import { useReportUploads } from "@/lib/hooks/useReportUploads";

export default function NewReportPage() {
  const {
    sessionData,
    metadata,
    setMetadata,
    weighbridgeName,
    setWeighbridgeName,
    boundName,
    setBoundName,
    reportId,
    manualInputs,
    setManualInputs,
    manualInputsTouched,
    setManualInputsTouched,
    buildStatus,
    buildError,
    finalReportDownloadUrl,
    excelReportDownloadUrl,
    manualSaveStatus,
    handleCreateSession,
    handleBuildReport,
    handleResetReport,
    metadataComplete,
    loadSessionData,
  } = useReportSession();

  const {
    uploads,
    uploadCount,
    uploadsComplete,
    handleSectionUpload,
    setUploadsStateFromSession,
    resetUploads,
  } = useReportUploads(reportId, loadSessionData);

  // Sync uploads status when backend session loads
  useEffect(() => {
    if (sessionData) {
      setUploadsStateFromSession(sessionData);
    }
  }, [sessionData, setUploadsStateFromSession]);

  const [selectedSection, setSelectedSection] = useState<ReportSection>(1);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>("png");

  const { setProgress } = useReportProgress();

  const canBuild =
    metadataComplete &&
    uploadsComplete &&
    manualInputsTouched &&
    buildStatus !== "building";

  // Effect for progress updates
  useEffect(() => {
    setProgress({
      metadataComplete,
      uploadsComplete,
      manualInputsComplete: manualInputsTouched,
      uploadCount,
      canBuild,
      sessionId: reportId,
    });
  }, [
    metadataComplete,
    uploadsComplete,
    manualInputsTouched,
    uploadCount,
    canBuild,
    reportId,
    setProgress,
  ]);

  function handleDownloadReport() {
    if (!finalReportDownloadUrl) return;
    window.open(finalReportDownloadUrl, "_blank", "noreferrer");
  }

  function handleDownloadExcelReport() {
    if (!excelReportDownloadUrl) return;
    window.open(excelReportDownloadUrl, "_blank", "noreferrer");
  }

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
            onClick={() => handleResetReport(resetUploads)}
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
              canUpload={Boolean(reportId)}
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
                previewsEnabled={uploadsComplete}
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
            onBuildReport={() => handleBuildReport(canBuild)}
            onDownloadReport={handleDownloadReport}
            onDownloadExcelReport={handleDownloadExcelReport}
            canBuild={canBuild}
            manualSaveStatus={manualSaveStatus}
            buildError={buildError}
            finalReportDownloadUrl={finalReportDownloadUrl}
            excelReportDownloadUrl={excelReportDownloadUrl}
          />
        </div>
      </div>
    </>
  );
}
