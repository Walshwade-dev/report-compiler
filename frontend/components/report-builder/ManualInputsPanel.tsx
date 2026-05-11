import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import {
  BuildStatus,
  ManualInputs,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

type ManualInputsPanelProps = {
  manualInputs: ManualInputs;
  setManualInputs: React.Dispatch<
    React.SetStateAction<ManualInputs>
  >;
  buildStatus: BuildStatus;
  onBuildReport: () => void;
  onDownloadReport: () => void;
  onDownloadExcelReport: () => void;
  canBuild: boolean;
  setManualInputsTouched: React.Dispatch<React.SetStateAction<boolean>>;
  manualSaveStatus: "idle" | "saving" | "saved" | "error";
  buildError: string | null;
  finalReportDownloadUrl: string | null;
  excelReportDownloadUrl: string | null;
};

const emptyDailyTransgression = {
  date: "",
  time: "",
  regNo: "",
  axleConfig: "",
  transporter: "",
  censusClerk: "",
  policeInCharge: "",
  actionTaken: "",
  caught: "",
  nextWbReportSent: "",
  nextWb: "",
};

const emptyActionReport = {
  date: "",
  timeReceived: "",
  truckNo: "",
  sendingWbStation: "",
  ocsReportedTo: "",
  action1: "",
  action2: "",
  attachEvidence: "",
  weightNoted: "",
  taggedInSystem: "",
};

export function ManualInputsPanel({
  manualInputs,
  setManualInputs,
  buildStatus,
  onBuildReport,
  onDownloadReport,
  onDownloadExcelReport,
  canBuild,
  setManualInputsTouched,
  manualSaveStatus,
  buildError,
  finalReportDownloadUrl,
  excelReportDownloadUrl,
}: ManualInputsPanelProps) {
  const [transgressionModalOpen, setTransgressionModalOpen] =
    useState(false);

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

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Buses ≥ 3500KG
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={manualInputs.buses3500}
              onChange={(e) => {
                setManualInputsTouched(true);
                setManualInputs((prev) => ({
                  ...prev,
                  buses3500: Number(e.target.value),
                }));
              }}
              className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vehicles 3500–7000KG
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={manualInputs.vehicles3500to7000}
              onChange={(e) => {
                setManualInputsTouched(true);
                setManualInputs((prev) => ({
                  ...prev,
                  vehicles3500to7000: Number(e.target.value),
                }));
              }}
              className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vehicles ≥ 7000KG
            </span>

            <input
              type="number"
              min={0}
              step={1}
              value={manualInputs.vehicles7000}
              onChange={(e) => {
                setManualInputsTouched(true);
                setManualInputs((prev) => ({
                  ...prev,
                  vehicles7000: Number(e.target.value),
                }));
              }}
              className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            />
          </label>
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

        <button
          suppressHydrationWarning
          onClick={onDownloadReport}
          disabled={Boolean(
            buildStatus !== "completed" || !finalReportDownloadUrl
          )}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileText aria-hidden="true" size={16} />
          Download DOCX
        </button>

        <button
          suppressHydrationWarning
          onClick={onDownloadExcelReport}
          disabled={Boolean(
            buildStatus !== "completed" || !excelReportDownloadUrl
          )}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/60 px-4 py-3 text-sm font-bold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileSpreadsheet aria-hidden="true" size={16} />
          Download Excel
        </button>
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
                      ["date", "Date", "date"],
                      ["time", "Time", "time"],
                      ["regNo", "Reg No", "text"],
                      ["axleConfig", "Axle Config", "text"],
                      ["transporter", "Transporter", "text"],
                      ["censusClerk", "Census Clerk", "text"],
                      ["policeInCharge", "Police In charge", "text"],
                      ["actionTaken", "Action Taken", "text"],
                      ["caught", "Caught", "text"],
                      ["nextWbReportSent", "Next WB report sent", "text"],
                      ["nextWb", "Next WB", "text"],
                    ].map(([field, label, type]) => (
                      <label key={field} className="block">
                        <span className="text-xs text-slate-400">{label}</span>
                        <input
                          type={type}
                          value={String(row[field as keyof typeof row])}
                          onChange={(e) => {
                            const value =
                              type === "text"
                                ? e.target.value.toUpperCase()
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
                      ["date", "Date", "date"],
                      ["timeReceived", "Time Received", "time"],
                      ["truckNo", "Truck No.", "text"],
                      ["sendingWbStation", "Sending WB station", "text"],
                      ["ocsReportedTo", "OCS Reported To", "text"],
                      ["action1", "Action 1", "text"],
                      ["action2", "Action 2", "text"],
                      ["attachEvidence", "Attach evidence", "text"],
                      ["weightNoted", "Weight noted", "text"],
                      ["taggedInSystem", "Tagged in system", "text"],
                    ].map(([field, label, type]) => (
                      <label key={field} className="block">
                        <span className="text-xs text-slate-400">{label}</span>
                        <input
                          type={type}
                          value={String(row[field as keyof typeof row])}
                          onChange={(e) => {
                            const value =
                              type === "text"
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
