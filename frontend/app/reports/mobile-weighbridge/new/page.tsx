"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gauge,
  RotateCcw,
  Ruler,
  Save,
  Scale,
  Shield,
  Truck,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/report-builder/StatusBadge";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import { useReportSettings } from "@/components/report-builder/ReportSettingsContext";
import {
  createReportSession,
  getMobileExcelReportDownloadUrl,
  getMobileWordReportDownloadUrl,
  getReportSession,
  MobileReportUploadResponse,
  resolveApiUrl,
  updateManualInputs,
  uploadMobileReportFile,
} from "@/lib/api";
import {
  isSupportedSpreadsheetFile,
  supportedSpreadsheetFileMessage,
} from "@/lib/files";
import { MobileReportInputs } from "@/lib/types";

const MOBILE_DRAFT_KEY = "mobile-weighbridge-report-draft";
const MOBILE_REPORT_ID_KEY = "active-mobile-report-id";

const STATION_OPTIONS = [
  "Juja mobile",
  "Kanyonyo mobile",
  "Isinya mobile",
  "Athiriver mobile",
  "Suswa mobile",
  "Gilgil mobile",
];

const SHIFT_OPTIONS = ["Mobile 1", "Mobile 2"];

function createInitialMobileInputs(): MobileReportInputs {
  return {
    station: "Juja mobile",
    bound: "Mobile 2",
    reportDate: "",
    preparedBy: "",
    approvedBy: "Faith Njani",
    totalWeighed: 0,
    dmEntry: "",
    driverEntry: "",
    policeOfficerOne: "",
    policeOfficerTwo: "",
    route: "",
    mobileVehicleReg: "",
    startMileage: "",
    stopMileage: "",
    casesClearedInCourt: "0",
    transgressionsCount: "0",
    exemptedPermit: "0",
    manuallyWeighed: "0",
    vehicleCharges: [],
  };
}

function toUppercase(value: string) {
  return value.toUpperCase();
}

function numberFromMileage(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function stringFromRow(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "number" | "text";
  min?: number;
  uppercase?: boolean;
};

function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  min,
  uppercase = true,
}: TextInputProps) {
  const inputTone =
    type === "date"
      ? `mobile-date-input [color-scheme:dark] ${
          value ? "text-slate-100" : "text-slate-400"
        }`
      : "text-slate-100";

  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <input
        id={id}
        type={type}
        min={min}
        value={value}
        onChange={(event) =>
          onChange(
            uppercase && type === "text"
              ? toUppercase(event.target.value)
              : event.target.value
          )
        }
        className={`mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm ${inputTone} placeholder:text-slate-400 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40`}
      />
    </label>
  );
}

type WorkflowStatus = "idle" | "busy" | "ready" | "error";

type SelectInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
}: SelectInputProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function NewMobileReportPage() {
  const [inputs, setInputs] = useState<MobileReportInputs>(
    createInitialMobileInputs
  );
  const [reportId, setReportId] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving">("saved");
  const [sessionStatus, setSessionStatus] = useState<WorkflowStatus>("idle");
  const [manualStatus, setManualStatus] = useState<WorkflowStatus>("idle");
  const [uploadStatus, setUploadStatus] = useState<WorkflowStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadResponse, setUploadResponse] =
    useState<MobileReportUploadResponse | null>(null);
  const [mobileExcelUrl, setMobileExcelUrl] = useState<string | null>(
    reportId ? getMobileExcelReportDownloadUrl(reportId) : null
  );
  const { setProgress } = useReportProgress();
  const { people } = useReportSettings();

  const mobileWordUrl = reportId
    ? getMobileWordReportDownloadUrl(reportId)
    : null;
  const summary = uploadResponse?.sections.mobile_report?.summary;
  const normalizedRows = uploadResponse?.mobile_report?.data || [];

  const mileageStart = numberFromMileage(inputs.startMileage);
  const mileageStop = numberFromMileage(inputs.stopMileage);
  const kilometers =
    mileageStart !== null && mileageStop !== null
      ? Math.max(mileageStop - mileageStart, 0)
      : null;

  const totalWeighed = summary?.total_trucks_weighed ?? inputs.totalWeighed;
  const warned = summary?.warned_trucks ?? 0;
  const chargedGvwAxle = summary?.charged_gvw_axle_trucks ?? 0;
  const chargedDimensions = summary?.charged_dimensions_trucks ?? 0;

  const metadataComplete = Boolean(
    inputs.reportDate &&
      inputs.station &&
      inputs.bound &&
      inputs.preparedBy &&
      inputs.approvedBy
  );

  const manualInputsComplete = Boolean(
    inputs.route &&
      inputs.dmEntry &&
      inputs.driverEntry &&
      inputs.policeOfficerOne &&
      inputs.policeOfficerTwo &&
      inputs.mobileVehicleReg &&
      inputs.startMileage &&
      inputs.stopMileage &&
      inputs.casesClearedInCourt &&
      inputs.transgressionsCount &&
      inputs.exemptedPermit &&
      inputs.manuallyWeighed
  );

  const uploadComplete =
    uploadResponse?.sections.mobile_report?.status === "ready";

  const manualPayload = useMemo(
    () => ({
      prepared_by: inputs.preparedBy,
      confirmed_by: inputs.approvedBy,
      extra: {
        mobile_report: {
          prepared_by: inputs.preparedBy,
          confirmed_by: inputs.approvedBy,
          route: inputs.route,
          danka_staff: [
            inputs.dmEntry,
            inputs.driverEntry,
          ]
            .filter(Boolean)
            .join(" / "),
          police_officers: [
            inputs.policeOfficerOne,
            inputs.policeOfficerTwo,
          ]
            .filter(Boolean)
            .join(" / "),
          mobile_vehicle: inputs.mobileVehicleReg,
          mileage_start:
            mileageStart === null ? inputs.startMileage : mileageStart,
          mileage_end: mileageStop === null ? inputs.stopMileage : mileageStop,
          cases_cleared_in_court: inputs.casesClearedInCourt,
          transgressions_count: inputs.transgressionsCount,
          exempted_permit: inputs.exemptedPermit,
          manually_weighed: inputs.manuallyWeighed,
        },
      },
    }),
    [inputs, mileageStart, mileageStop]
  );
  const manualPayloadPreview = useMemo(
    () => JSON.stringify(manualPayload, null, 2),
    [manualPayload]
  );
  const uploadResponsePreview = useMemo(
    () =>
      uploadResponse
        ? JSON.stringify(uploadResponse, null, 2)
        : "Upload a register to see the backend response.",
    [uploadResponse]
  );

  useEffect(() => {
    setProgress({
      reportType: "mobile",
      metadataComplete: Boolean(reportId),
      uploadsComplete: uploadComplete,
      manualInputsComplete: manualStatus === "ready",
      uploadCount: uploadComplete ? 1 : 0,
      uploadTotal: 1,
      canBuild: Boolean(uploadComplete && mobileExcelUrl),
      sessionId: reportId,
      debugManualPayload: manualPayloadPreview,
      debugUploadResponse: uploadResponsePreview,
    });
  }, [
    manualPayloadPreview,
    manualStatus,
    mobileExcelUrl,
    reportId,
    setProgress,
    uploadComplete,
    uploadResponsePreview,
  ]);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const savedDraft = localStorage.getItem(MOBILE_DRAFT_KEY);
      const savedReportId = localStorage.getItem(MOBILE_REPORT_ID_KEY);

      if (savedDraft) {
        try {
          setInputs({
            ...createInitialMobileInputs(),
            ...JSON.parse(savedDraft),
            approvedBy: "Faith Njani",
          } as MobileReportInputs);
        } catch {
          localStorage.removeItem(MOBILE_DRAFT_KEY);
        }
      }

      if (savedReportId) {
        setReportId(savedReportId);
        setSessionStatus("ready");
        setMobileExcelUrl(getMobileExcelReportDownloadUrl(savedReportId));

        try {
          const session = await getReportSession(savedReportId);
          if (session.sections.mobile_report) {
            setUploadResponse(session as MobileReportUploadResponse);
            setUploadStatus(session.sections.mobile_report.status === "ready" ? "ready" : "error");
          }
        } catch (error) {
          console.error("Failed to restore mobile session from backend:", error);
        }
      }

      setDraftLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }

    const timeout = setTimeout(() => {
      localStorage.setItem(MOBILE_DRAFT_KEY, JSON.stringify(inputs));
      setDraftStatus("saved");
    }, 350);

    return () => clearTimeout(timeout);
  }, [draftLoaded, inputs]);

  function updateInput<K extends keyof MobileReportInputs>(
    field: K,
    value: MobileReportInputs[K]
  ) {
    setDraftStatus("saving");
    setInputs((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function ensureSession() {
    if (reportId) {
      return reportId;
    }

    if (!metadataComplete) {
      throw new Error("Enter report date, station, and shift first.");
    }

    setSessionStatus("busy");
    setStatusMessage(null);

    const response = await createReportSession({
      report_date: inputs.reportDate,
      station: inputs.station,
      bound: inputs.bound,
      weighbridge_name: inputs.station,
      prepared_by: inputs.preparedBy,
      confirmed_by: inputs.approvedBy,
    });

    setReportId(response.report_id);
    setMobileExcelUrl(getMobileExcelReportDownloadUrl(response.report_id));
    localStorage.setItem(MOBILE_REPORT_ID_KEY, response.report_id);
    setSessionStatus("ready");

    return response.report_id;
  }

  async function handleCreateSession() {
    try {
      await ensureSession();
      setStatusMessage("Mobile report session is ready.");
    } catch (error) {
      setSessionStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to create session."
      );
    }
  }

  async function handleSaveManualInputs(activeReportId?: string) {
    try {
      const id = activeReportId || (await ensureSession());

      setManualStatus("busy");
      setStatusMessage(null);
      await updateManualInputs(id, manualPayload);
      setManualStatus("ready");
      setStatusMessage("Manual mobile report fields saved.");

      return id;
    } catch (error) {
      setManualStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to save manual mobile report fields."
      );
      throw error;
    }
  }

  async function handleMobileRegisterUpload(file: File) {
    setSelectedFileName(file.name);

    if (!isSupportedSpreadsheetFile(file)) {
      setUploadStatus("error");
      setStatusMessage(supportedSpreadsheetFileMessage());
      return;
    }

    try {
      const id = await handleSaveManualInputs();

      setUploadStatus("busy");
      setStatusMessage(null);

      const response = await uploadMobileReportFile(id, file);
      setUploadResponse(response);
      setUploadStatus(
        response.sections.mobile_report?.status === "ready"
          ? "ready"
          : "error"
      );
      setMobileExcelUrl(
        resolveApiUrl(response.mobile_excel_report?.download_url) ||
          getMobileExcelReportDownloadUrl(id)
      );
      setStatusMessage(
        response.sections.mobile_report?.status === "ready"
          ? "Mobile register uploaded and Excel report is ready."
          : "Mobile register uploaded, but the backend did not mark it ready."
      );
    } catch (error) {
      setUploadStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload mobile register."
      );
    }
  }

  async function handleDownloadMobileExcel() {
    if (!mobileExcelUrl) {
      return;
    }

    const filename = `${inputs.station}_${inputs.bound}_${inputs.reportDate}_mobile_report.xlsx`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    try {
      const response = await fetch(mobileExcelUrl);

      if (!response.ok) {
        throw new Error("Failed to download mobile Excel report.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(
        new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${filename || "mobile_report"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to download mobile Excel report."
      );
      window.open(mobileExcelUrl, "_blank", "noreferrer");
    }
  }

  async function handleDownloadMobileWord() {
    if (!mobileWordUrl) {
      return;
    }

    const filename = `${inputs.station}_${inputs.bound}_${inputs.reportDate}_mobile_report`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    try {
      const response = await fetch(mobileWordUrl);

      if (!response.ok) {
        throw new Error("Failed to download mobile Word report.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(
        new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      );
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${filename || "mobile_report"}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to download mobile Word report."
      );
      window.open(mobileWordUrl, "_blank", "noreferrer");
    }
  }

  function resetDraft() {
    localStorage.removeItem(MOBILE_DRAFT_KEY);
    localStorage.removeItem(MOBILE_REPORT_ID_KEY);
    setDraftStatus("saving");
    setInputs(createInitialMobileInputs());
    setReportId(null);
    setSessionStatus("idle");
    setManualStatus("idle");
    setUploadStatus("idle");
    setUploadResponse(null);
    setMobileExcelUrl(null);
    setSelectedFileName("");
    setStatusMessage(null);
  }

  const kpiCards = [
    {
      title: "Total Weighed",
      value: totalWeighed,
      subtitle: uploadComplete ? "from uploaded register" : "awaiting register",
      icon: Scale,
      className: uploadComplete 
        ? "border-sky-500/50 bg-transparent hover:bg-sky-600/25 text-sky-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: uploadComplete ? "bg-sky-400/15 text-sky-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: uploadComplete ? "text-sky-100" : "text-slate-300",
      subtitleClass: uploadComplete ? "text-sky-200" : "text-slate-400",
    },
    {
      title: "Warned",
      value: warned,
      subtitle: "warned trucks",
      icon: AlertTriangle,
      className: uploadComplete 
        ? "border-amber-500/50 bg-transparent hover:bg-amber-600/20 text-amber-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: uploadComplete ? "bg-amber-400/15 text-amber-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: uploadComplete ? "text-amber-100" : "text-slate-300",
      subtitleClass: uploadComplete ? "text-amber-200" : "text-slate-400",
    },
    {
      title: "Charged GVW/Axle",
      value: chargedGvwAxle,
      subtitle: "weight offences",
      icon: Truck,
      className: uploadComplete 
        ? "border-rose-500/50 bg-transparent hover:bg-rose-600/20 text-rose-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: uploadComplete ? "bg-rose-400/15 text-rose-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: uploadComplete ? "text-rose-100" : "text-slate-300",
      subtitleClass: uploadComplete ? "text-rose-200" : "text-slate-400",
    },
    {
      title: "Charged Dimensions",
      value: chargedDimensions,
      subtitle: "dimension offences",
      icon: Ruler,
      className: uploadComplete 
        ? "border-emerald-500/50 bg-transparent hover:bg-emerald-600/20 text-emerald-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: uploadComplete ? "bg-emerald-400/15 text-emerald-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: uploadComplete ? "text-emerald-100" : "text-slate-300",
      subtitleClass: uploadComplete ? "text-emerald-200" : "text-slate-400",
    },
  ];

  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mobile Weighbridge Report</h1>
          <p className="text-sm text-cyan-400">
            Upload register, save manual fields, and download mobile Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p
            className="rounded-lg border border-cyan-900/50 bg-[#0b2a45] px-3 py-2 text-sm font-semibold text-cyan-200"
            aria-live="polite"
          >
            {draftStatus === "saving" ? "Saving draft" : "Draft saved"}
          </p>

          <button
            type="button"
            onClick={resetDraft}
            className="flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300/50"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Reset / Reupload
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section
            aria-labelledby="mobile-kpis-heading"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <h2 id="mobile-kpis-heading" className="sr-only">
              Mobile report KPI cards
            </h2>

            {kpiCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className={`rounded-xl border p-5 shadow-lg transition duration-300 hover:scale-[1.02] ${card.className}`}
                >
                  <div className="flex min-h-12 items-start justify-between gap-3">
                    <p className={`text-sm font-bold uppercase tracking-wider ${card.titleClass}`}>
                      {card.title}
                    </p>

                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                      <Icon aria-hidden="true" size={22} strokeWidth={2.3} />
                    </span>
                  </div>

                  <p className="mt-5 text-4xl font-black text-white">
                    {uploadComplete ? card.value : "—"}
                  </p>

                  <p className={`mt-2 text-base font-semibold ${card.subtitleClass}`}>{card.subtitle}</p>
                </article>
              );
            })}
          </section>
          <section
            aria-labelledby="session-heading"
            className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield aria-hidden="true" className="text-cyan-300" size={20} />
                <h2
                  id="session-heading"
                  className="text-sm font-bold text-cyan-200"
                >
                  Backend Session
                </h2>
              </div>

              <StatusBadge
                label={
                  sessionStatus === "busy"
                    ? "Creating"
                    : reportId
                    ? "Ready"
                    : "Not Started"
                }
                variant={
                  sessionStatus === "error"
                    ? "error"
                    : reportId
                    ? "success"
                    : "pending"
                }
              />
            </div>

            <fieldset className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <legend className="sr-only">Backend session metadata</legend>

              <TextInput
                id="mobile-report-date"
                label="Date"
                type="date"
                uppercase={false}
                value={inputs.reportDate}
                onChange={(value) => updateInput("reportDate", value)}
              />

              <SelectInput
                id="mobile-station"
                label="Station"
                value={inputs.station}
                onChange={(value) => updateInput("station", value)}
                options={STATION_OPTIONS}
              />

              <SelectInput
                id="mobile-bound"
                label="Shift"
                value={inputs.bound}
                onChange={(value) => updateInput("bound", value)}
                options={SHIFT_OPTIONS}
              />

              <label htmlFor="mobile-prepared-by" className="block min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prepared By
                </span>

                <select
                  id="mobile-prepared-by"
                  value={inputs.preparedBy}
                  onChange={(event) =>
                    updateInput("preparedBy", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 shadow-inner outline-none transition hover:border-cyan-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                >
                  {!inputs.preparedBy && (
                    <option value="">Select officer</option>
                  )}
                  {inputs.preparedBy && !people.includes(inputs.preparedBy) && (
                    <option value={inputs.preparedBy}>
                      {inputs.preparedBy}
                    </option>
                  )}
                  {people.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="mobile-approved-by" className="block min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Approved By
                </span>

                <input
                  id="mobile-approved-by"
                  type="text"
                  value={inputs.approvedBy}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-cyan-900/80 bg-[#071827]/80 px-3 py-2 text-sm font-semibold text-slate-400 shadow-inner outline-none ring-1 ring-white/5"
                />
              </label>
            </fieldset>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={!metadataComplete || sessionStatus === "busy"}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 aria-hidden="true" size={16} />
                {reportId ? "Reuse Session" : "Create Session"}
              </button>

              <p className="break-all font-mono text-xs text-slate-400">
                {reportId || "No report_id yet"}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="manual-heading"
            className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserRound
                  aria-hidden="true"
                  className="text-cyan-300"
                  size={20}
                />
                <h2
                  id="manual-heading"
                  className="text-sm font-bold text-cyan-200"
                >
                  Manual Mobile Fields
                </h2>
              </div>

              <StatusBadge
                label={
                  manualStatus === "busy"
                    ? "Saving"
                    : manualStatus === "ready"
                    ? "Saved"
                    : "Pending"
                }
                variant={
                  manualStatus === "error"
                    ? "error"
                    : manualStatus === "ready"
                    ? "success"
                    : "pending"
                }
              />
            </div>

            <fieldset className="mt-5 space-y-6">
              <legend className="sr-only">Manual mobile report fields</legend>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Danka Staff In Charge
                </p>

                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <TextInput
                    id="dm-entry"
                    label="DM Entry"
                    value={inputs.dmEntry}
                    onChange={(value) => updateInput("dmEntry", value)}
                  />

                  <TextInput
                    id="driver-entry"
                    label="Driver Entry"
                    value={inputs.driverEntry}
                    onChange={(value) => updateInput("driverEntry", value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Police In Charge
                </p>

                <div className="mt-2 grid gap-4 md:grid-cols-2">
                  <TextInput
                    id="police-officer-one"
                    label="Police Officer 1"
                    value={inputs.policeOfficerOne}
                    onChange={(value) => updateInput("policeOfficerOne", value)}
                  />

                  <TextInput
                    id="police-officer-two"
                    label="Police Officer 2"
                    value={inputs.policeOfficerTwo}
                    onChange={(value) => updateInput("policeOfficerTwo", value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mobile Vehicle Used
                </p>

                <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <TextInput
                    id="mobile-vehicle-reg"
                    label="Vehicle Registration"
                    value={inputs.mobileVehicleReg}
                    onChange={(value) => updateInput("mobileVehicleReg", value)}
                  />

                  <TextInput
                    id="start-mileage"
                    label="Mileage Start"
                    type="number"
                    min={0}
                    uppercase={false}
                    value={inputs.startMileage}
                    onChange={(value) => updateInput("startMileage", value)}
                  />

                  <TextInput
                    id="stop-mileage"
                    label="Mileage End"
                    type="number"
                    min={0}
                    uppercase={false}
                    value={inputs.stopMileage}
                    onChange={(value) => updateInput("stopMileage", value)}
                  />

                  <div className="px-1 py-1">
                    <div className="flex items-center gap-2 text-cyan-200">
                      <Gauge aria-hidden="true" size={18} />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        KMS
                      </p>
                    </div>

                    <p className="mt-2 text-2xl font-black text-white">
                      {kilometers ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <TextInput
                id="cases-cleared-in-court"
                label="Cases Cleared In Court"
                type="number"
                min={0}
                uppercase={false}
                value={inputs.casesClearedInCourt}
                onChange={(value) => updateInput("casesClearedInCourt", value)}
              />

              <TextInput
                id="transgressions-count"
                label="Transgressions (L)"
                type="number"
                min={0}
                uppercase={false}
                value={inputs.transgressionsCount}
                onChange={(value) => updateInput("transgressionsCount", value)}
              />

              <TextInput
                id="exempted-permit"
                label="Exempted permit (E)"
                type="number"
                min={0}
                uppercase={false}
                value={inputs.exemptedPermit}
                onChange={(value) => updateInput("exemptedPermit", value)}
              />

              <TextInput
                id="manually-weighed"
                label="Manually Weighed (M)"
                type="number"
                min={0}
                uppercase={false}
                value={inputs.manuallyWeighed}
                onChange={(value) => updateInput("manuallyWeighed", value)}
              />

              <label htmlFor="operation-route" className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Route
                </span>

                <textarea
                  id="operation-route"
                  value={inputs.route}
                  onChange={(event) =>
                    updateInput("route", toUppercase(event.target.value))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>
            </fieldset>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSaveManualInputs()}
                disabled={
                  !metadataComplete ||
                  !manualInputsComplete ||
                  manualStatus === "busy"
                }
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save aria-hidden="true" size={16} />
                Save Manual Fields
              </button>
            </div>
          </section>

          <section
            aria-labelledby="upload-heading"
            className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet
                  aria-hidden="true"
                  className="text-cyan-300"
                  size={20}
                />
                <h2
                  id="upload-heading"
                  className="text-sm font-bold text-cyan-200"
                >
                  Mobile Weighbridge Register
                </h2>
              </div>

              <StatusBadge
                label={
                  uploadStatus === "busy"
                    ? "Uploading"
                    : uploadComplete
                    ? "Ready"
                    : "Awaiting Upload"
                }
                variant={
                  uploadStatus === "error"
                    ? "error"
                    : uploadComplete
                    ? "success"
                    : "pending"
                }
              />
            </div>

            <div className="mt-5 rounded-lg border border-cyan-900/50 bg-[#071827] p-4">
              <input
                id="mobile-register-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  await handleMobileRegisterUpload(file);
                  event.target.value = "";
                }}
              />

              <label
                htmlFor="mobile-register-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/10"
              >
                <Upload aria-hidden="true" size={16} />
                Upload CSV or XLSX Register
              </label>

              {selectedFileName && (
                <p className="mt-3 truncate text-xs text-slate-400">
                  {selectedFileName}
                </p>
              )}
            </div>

            {normalizedRows.length > 0 && (
              <div className="mt-5 overflow-x-auto rounded-lg border border-cyan-900/50">
                <table className="min-w-full divide-y divide-cyan-900/50 text-left text-sm">
                  <caption className="sr-only">
                    Normalized mobile register vehicle rows
                  </caption>
                  <thead className="bg-[#071827] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Vehicle Reg</th>
                      <th className="px-3 py-2">Transporter</th>
                      <th className="px-3 py-2">Axle Config</th>
                      <th className="px-3 py-2">Cargo</th>
                      <th className="px-3 py-2">GVW</th>
                      <th className="px-3 py-2">Excess</th>
                      <th className="px-3 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/40 bg-[#0b2a45]">
                    {normalizedRows.slice(0, 12).map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          {stringFromRow(row, [
                            "date",
                            "Date",
                            "date_time",
                            "Date Time",
                            "date_weighed",
                          ])}
                        </td>
                        <td className="px-3 py-2 font-semibold text-cyan-100">
                          {stringFromRow(row, [
                            "registration",
                            "vehicle_reg",
                            "VEHICLE REG",
                            "Registration",
                          ])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, ["transporter", "TRANSPORTER"])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, ["axle", "Axle", "axle_config"])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, ["cargo", "Cargo"])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, [
                            "gvw_kg",
                            "GVW [KG]",
                            "gvw",
                            "GVW",
                            "total_gvw_kg",
                          ])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, [
                            "excess_kg",
                            "Excess [KG]",
                            "excess",
                            "EXCESS",
                            "gvw_difference_kg",
                          ])}
                        </td>
                        <td className="px-3 py-2">
                          {stringFromRow(row, ["remarks", "REMARKS"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5 2xl:sticky 2xl:top-6 2xl:self-start">
          <div className="flex items-center gap-3">
            <Download aria-hidden="true" className="text-cyan-300" size={20} />
            <h2 className="text-sm font-bold text-cyan-200">Output</h2>
          </div>

          {statusMessage && (
            <p
              className="mt-4 rounded-lg border border-cyan-900/60 bg-[#071827] px-3 py-2 text-sm text-slate-300"
              aria-live="polite"
            >
              {statusMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleDownloadMobileWord}
            disabled={!uploadComplete || !mobileWordUrl}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download aria-hidden="true" size={16} />
            Download Mobile Word
          </button>

          <button
            type="button"
            onClick={handleDownloadMobileExcel}
            disabled={!uploadComplete || !mobileExcelUrl}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download aria-hidden="true" size={16} />
            Download Mobile Excel
          </button>
        </aside>
      </div>
    </>
  );
}
