"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gauge,
  LoaderCircle,
  RotateCcw,
  Ruler,
  Save,
  Scale,
  Shield,
  Truck,
  Upload,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/report-builder/StatusBadge";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import { useReportSettings } from "@/components/report-builder/ReportSettingsContext";
import {
  createReportSession,
  getMobileExcelReportDownloadUrl,
  getMobileWordReportDownloadUrl,
  getReportSession,
  MobileReportUploadResponse,
  ReportSessionResponse,
  resolveApiUrl,
  updateManualInputs,
  updateReportSessionMetadata,
  uploadMobileReportFile,
  getLoggedInUser,
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
    shiftTwoDmEntry: "",
    shiftTwoDriverEntry: "",
    shiftTwoPoliceOfficerOne: "",
    shiftTwoPoliceOfficerTwo: "",
    route: "",
    mobileVehicleReg: "",
    startMileage: "",
    stopMileage: "",
    shiftTwoMobileVehicleReg: "",
    shiftTwoStartMileage: "",
    shiftTwoStopMileage: "",
    casesClearedInCourt: "0",
    transgressionsCount: "0",
    exemptedPermit: "0",
    manuallyWeighed: "0",
    vehicleCharges: [],
    reweigh_tickets: [],
    dimension_charges: [],
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

function stringFromSessionValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function splitSlashSeparatedNames(value: unknown) {
  return stringFromSessionValue(value)
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isMobileTwoBound(value: string) {
  return /\b(2|two)\b|mobile_?2/i.test(value);
}

function mobileInputsFromSession(
  session: ReportSessionResponse,
  fallback: MobileReportInputs
): MobileReportInputs {
  const mobileManual = session.manual_inputs?.mobile_report || {};
  const staff = splitSlashSeparatedNames(mobileManual.danka_staff);
  const police = splitSlashSeparatedNames(mobileManual.police_officers);
  const shifts = Array.isArray(mobileManual.shifts) ? mobileManual.shifts : [];
  const shiftOne = shifts[0] || {};
  const shiftTwo = shifts[1] || {};
  const shiftOneStaff = splitSlashSeparatedNames(shiftOne.danka_staff);
  const shiftTwoStaff = splitSlashSeparatedNames(shiftTwo.danka_staff);
  const shiftOnePolice = splitSlashSeparatedNames(shiftOne.police_officers);
  const shiftTwoPolice = splitSlashSeparatedNames(shiftTwo.police_officers);
  const summary = session.sections?.mobile_report?.summary;

  return {
    ...fallback,
    station: session.metadata?.station || fallback.station,
    bound: session.metadata?.bound || fallback.bound,
    reportDate: session.metadata?.report_date || fallback.reportDate,
    preparedBy:
      mobileManual.prepared_by ||
      session.metadata?.prepared_by ||
      fallback.preparedBy,
    approvedBy:
      mobileManual.confirmed_by ||
      session.metadata?.confirmed_by ||
      fallback.approvedBy ||
      "Faith Njani",
    totalWeighed:
      summary?.total_trucks_weighed ?? fallback.totalWeighed,
    dmEntry: shiftOneStaff[0] || staff[0] || fallback.dmEntry,
    driverEntry: shiftOneStaff[1] || staff[1] || fallback.driverEntry,
    policeOfficerOne: shiftOnePolice[0] || police[0] || fallback.policeOfficerOne,
    policeOfficerTwo: shiftOnePolice[1] || police[1] || fallback.policeOfficerTwo,
    shiftTwoDmEntry: shiftTwoStaff[0] || fallback.shiftTwoDmEntry,
    shiftTwoDriverEntry: shiftTwoStaff[1] || fallback.shiftTwoDriverEntry,
    shiftTwoPoliceOfficerOne:
      shiftTwoPolice[0] || fallback.shiftTwoPoliceOfficerOne,
    shiftTwoPoliceOfficerTwo:
      shiftTwoPolice[1] || fallback.shiftTwoPoliceOfficerTwo,
    route: stringFromSessionValue(mobileManual.route) || fallback.route,
    mobileVehicleReg:
      stringFromSessionValue(shiftOne.mobile_vehicle) ||
      stringFromSessionValue(mobileManual.mobile_vehicle) ||
      fallback.mobileVehicleReg,
    startMileage:
      stringFromSessionValue(shiftOne.mileage_start) ||
      stringFromSessionValue(mobileManual.mileage_start) ||
      fallback.startMileage,
    stopMileage:
      stringFromSessionValue(shiftOne.mileage_end) ||
      stringFromSessionValue(mobileManual.mileage_end) ||
      fallback.stopMileage,
    shiftTwoMobileVehicleReg:
      stringFromSessionValue(shiftTwo.mobile_vehicle) ||
      fallback.shiftTwoMobileVehicleReg,
    shiftTwoStartMileage:
      stringFromSessionValue(shiftTwo.mileage_start) ||
      fallback.shiftTwoStartMileage,
    shiftTwoStopMileage:
      stringFromSessionValue(shiftTwo.mileage_end) ||
      fallback.shiftTwoStopMileage,
    casesClearedInCourt:
      stringFromSessionValue(mobileManual.cases_cleared_in_court) ||
      fallback.casesClearedInCourt,
    transgressionsCount:
      stringFromSessionValue(mobileManual.transgressions_count) ||
      fallback.transgressionsCount,
    exemptedPermit:
      stringFromSessionValue(mobileManual.exempted_permit) ||
      fallback.exemptedPermit,
    manuallyWeighed:
      stringFromSessionValue(mobileManual.manually_weighed) ||
      fallback.manuallyWeighed,
    reweigh_tickets: mobileManual.reweigh_tickets || fallback.reweigh_tickets || [],
    dimension_charges: mobileManual.dimension_charges || fallback.dimension_charges || [],
  };
}

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "number" | "text";
  min?: number;
  uppercase?: boolean;
  placeholder?: string;
};

type BuiltMobileFile = {
  blob: Blob;
  filename: string;
};

type BuiltMobileOutputs = {
  word: BuiltMobileFile;
  excel: BuiltMobileFile;
};

function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  min,
  uppercase = true,
  placeholder,
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
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            uppercase && type === "text"
              ? toUppercase(event.target.value)
              : event.target.value
          )
        }
        className={`mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm ${inputTone} placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40`}
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
  disabled?: boolean;
};

function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
}: SelectInputProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <select
        disabled={disabled}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? getLoggedInUser() : null;
  const isAdmin = !user || user.role === "admin";
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving">("saved");
  const [sessionStatus, setSessionStatus] = useState<WorkflowStatus>("idle");
  const [autoSessionKey, setAutoSessionKey] = useState<string | null>(null);
  const [manualStatus, setManualStatus] = useState<WorkflowStatus>("idle");
  const [uploadStatus, setUploadStatus] = useState<WorkflowStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [downloadTarget, setDownloadTarget] = useState<
    "word" | "excel" | null
  >(null);
  const [buildStatus, setBuildStatus] = useState<
    "idle" | "building" | "ready" | "error"
  >("idle");
  const [builtOutputs, setBuiltOutputs] = useState<BuiltMobileOutputs | null>(
    null
  );
  const [uploadResponse, setUploadResponse] =
    useState<MobileReportUploadResponse | null>(null);
  const [mobileExcelUrl, setMobileExcelUrl] = useState<string | null>(
    reportId ? getMobileExcelReportDownloadUrl(reportId) : null
  );
  const [newDimCharge, setNewDimCharge] = useState({
    registration: "",
    transporter: "",
    axle: "",
    gvw_excess: "",
    axle_excess: "",
    origin: "",
    destination: "",
    cargo: "",
    date_time: "",
    make: "",
  });
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
  const shiftTwoMileageStart = numberFromMileage(inputs.shiftTwoStartMileage);
  const shiftTwoMileageStop = numberFromMileage(inputs.shiftTwoStopMileage);
  const shiftTwoKilometers =
    shiftTwoMileageStart !== null && shiftTwoMileageStop !== null
      ? Math.max(shiftTwoMileageStop - shiftTwoMileageStart, 0)
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
  const isMobileTwo = isMobileTwoBound(inputs.bound);
  const shiftTwoComplete = Boolean(
    inputs.shiftTwoDmEntry &&
      inputs.shiftTwoDriverEntry &&
      inputs.shiftTwoPoliceOfficerOne &&
      inputs.shiftTwoPoliceOfficerTwo &&
      inputs.shiftTwoMobileVehicleReg &&
      inputs.shiftTwoStartMileage &&
      inputs.shiftTwoStopMileage
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
      inputs.manuallyWeighed &&
      (!isMobileTwo || shiftTwoComplete)
  );

  const uploadComplete =
    uploadResponse?.sections.mobile_report?.status === "ready";
  const reportsBuilt = buildStatus === "ready" && builtOutputs !== null;
  const buildBusy = buildStatus === "building";
  const downloadBusy = downloadTarget !== null;
  const processingMessage =
    buildBusy
      ? "Building mobile Word and Excel reports"
      : downloadTarget === "word"
      ? "Preparing Word report download"
      : downloadTarget === "excel"
      ? "Preparing Excel workbook download"
      : uploadStatus === "busy"
      ? "Processing uploaded mobile register"
      : manualStatus === "busy"
      ? "Saving manual inputs"
      : sessionStatus === "busy"
      ? "Creating backend session"
      : null;

  const manualPayload = useMemo(() => {
    const shiftOnePayload = {
      label: "Shift 1",
      start_time: "0000",
      end_time: "0800",
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
    };
    const shiftTwoPayload = {
      label: "Shift 2",
      start_time: "0800",
      end_time: "0000",
      danka_staff: [
        inputs.shiftTwoDmEntry,
        inputs.shiftTwoDriverEntry,
      ]
        .filter(Boolean)
        .join(" / "),
      police_officers: [
        inputs.shiftTwoPoliceOfficerOne,
        inputs.shiftTwoPoliceOfficerTwo,
      ]
        .filter(Boolean)
        .join(" / "),
      mobile_vehicle: inputs.shiftTwoMobileVehicleReg,
      mileage_start:
        shiftTwoMileageStart === null
          ? inputs.shiftTwoStartMileage
          : shiftTwoMileageStart,
      mileage_end:
        shiftTwoMileageStop === null
          ? inputs.shiftTwoStopMileage
          : shiftTwoMileageStop,
    };

    return {
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
          shifts: isMobileTwo ? [shiftOnePayload, shiftTwoPayload] : [],
          reweigh_tickets: inputs.reweigh_tickets || [],
          dimension_charges: inputs.dimension_charges || [],
        },
      },
    };
  }, [
    inputs,
    isMobileTwo,
    mileageStart,
    mileageStop,
    shiftTwoMileageStart,
    shiftTwoMileageStop,
  ]);
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

  const ensureSession = useCallback(async () => {
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
  }, [
    inputs.approvedBy,
    inputs.bound,
    inputs.preparedBy,
    inputs.reportDate,
    inputs.station,
    metadataComplete,
    reportId,
  ]);

  useEffect(() => {
    setProgress({
      reportType: "mobile",
      metadataComplete: Boolean(reportId),
      uploadsComplete: uploadComplete,
      manualInputsComplete: manualStatus === "ready",
      uploadCount: uploadComplete ? 1 : 0,
      uploadTotal: 1,
      canBuild: Boolean(
        uploadComplete &&
          mobileExcelUrl &&
          mobileWordUrl &&
          manualInputsComplete &&
          !buildBusy &&
          !downloadBusy
      ),
      sessionId: reportId,
      debugManualPayload: manualPayloadPreview,
      debugUploadResponse: uploadResponsePreview,
    });
  }, [
    manualPayloadPreview,
    manualStatus,
    manualInputsComplete,
    buildBusy,
    mobileExcelUrl,
    mobileWordUrl,
    reportId,
    setProgress,
    uploadComplete,
    downloadBusy,
    uploadResponsePreview,
  ]);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const savedDraft = localStorage.getItem(MOBILE_DRAFT_KEY);
      const savedReportId = localStorage.getItem(MOBILE_REPORT_ID_KEY);
      let restoredInputs = createInitialMobileInputs();

      const user = getLoggedInUser();
      if (user && user.role !== "admin") {
        if (user.station) {
          const STATION_MAP: Record<string, string> = {
            "juja": "Juja mobile",
            "kanyonyo": "Kanyonyo mobile",
            "isinya": "Isinya mobile",
            "athi": "Athi River mobile",
            "gilgil": "Gilgil mobile",
            "suswa": "Suswa mobile"
          };
          const normalized = user.station.toLowerCase();
          let matched = "Juja mobile";
          for (const [key, value] of Object.entries(STATION_MAP)) {
            if (normalized.includes(key)) {
              matched = value;
              break;
            }
          }
          restoredInputs.station = matched;
        }
        restoredInputs.preparedBy = user.full_name || user.username || "";
      }

      if (savedDraft) {
        try {
          restoredInputs = {
            ...restoredInputs,
            ...JSON.parse(savedDraft),
            approvedBy: "Faith Njani",
          } as MobileReportInputs;

          // Re-apply lock to ensure user doesn't bypass via modified localstorage draft
          if (user && user.role !== "admin") {
            if (user.station) {
              const STATION_MAP: Record<string, string> = {
                "juja": "Juja mobile",
                "kanyonyo": "Kanyonyo mobile",
                "isinya": "Isinya mobile",
                "athi": "Athi River mobile",
                "gilgil": "Gilgil mobile",
                "suswa": "Suswa mobile"
              };
              const normalized = user.station.toLowerCase();
              let matched = "Juja mobile";
              for (const [key, value] of Object.entries(STATION_MAP)) {
                if (normalized.includes(key)) {
                  matched = value;
                  break;
                }
              }
              restoredInputs.station = matched;
            }
            restoredInputs.preparedBy = user.full_name || user.username || "";
          }

          setInputs(restoredInputs);
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
          const restoredFromSession = mobileInputsFromSession(
            session,
            restoredInputs
          );

          if (user && user.role !== "admin") {
            if (user.station) {
              const STATION_MAP: Record<string, string> = {
                "juja": "Juja mobile",
                "kanyonyo": "Kanyonyo mobile",
                "isinya": "Isinya mobile",
                "athi": "Athi River mobile",
                "gilgil": "Gilgil mobile",
                "suswa": "Suswa mobile"
              };
              const normalized = user.station.toLowerCase();
              let matched = "Juja mobile";
              for (const [key, value] of Object.entries(STATION_MAP)) {
                if (normalized.includes(key)) {
                  matched = value;
                  break;
                }
              }
              restoredFromSession.station = matched;
            }
            restoredFromSession.preparedBy = user.full_name || user.username || "";
          }

          const mobileSection = session.sections.mobile_report;
          const mobileReady = mobileSection?.status === "ready";
          const hasMobileManualInputs = Boolean(
            session.manual_inputs?.mobile_report
          );

          setInputs(restoredFromSession);
          setManualStatus(hasMobileManualInputs ? "ready" : "idle");
          setUploadResponse(session as MobileReportUploadResponse);
          setUploadStatus(
            mobileReady ? "ready" : mobileSection ? "error" : "idle"
          );
          setSelectedFileName(mobileSection?.filename || "");
          setMobileExcelUrl(
            resolveApiUrl(session.mobile_excel_report?.download_url) ||
              getMobileExcelReportDownloadUrl(savedReportId)
          );
        } catch (error) {
          localStorage.removeItem(MOBILE_REPORT_ID_KEY);
          setReportId(null);
          setMobileExcelUrl(null);
          setSessionStatus("idle");
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

  useEffect(() => {
    if (!draftLoaded || reportId || !metadataComplete || sessionStatus === "busy") {
      return;
    }

    const metadataKey = [
      inputs.reportDate,
      inputs.station,
      inputs.bound,
      inputs.preparedBy,
      inputs.approvedBy,
    ].join("|");

    if (autoSessionKey === metadataKey) {
      return;
    }

    const timeout = setTimeout(() => {
      setAutoSessionKey(metadataKey);
      ensureSession()
        .then(() => {
          setStatusMessage("Mobile report session created automatically.");
        })
        .catch((error) => {
          setSessionStatus("error");
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Failed to create mobile report session automatically."
          );
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    autoSessionKey,
    draftLoaded,
    inputs.approvedBy,
    inputs.bound,
    inputs.preparedBy,
    inputs.reportDate,
    inputs.station,
    metadataComplete,
    reportId,
    sessionStatus,
    ensureSession,
  ]);

  useEffect(() => {
    if (!draftLoaded || !reportId || !metadataComplete) {
      return;
    }

    const timeout = setTimeout(() => {
      updateReportSessionMetadata(reportId, {
        report_date: inputs.reportDate,
        station: inputs.station,
        bound: inputs.bound,
        weighbridge_name: inputs.station,
        prepared_by: inputs.preparedBy,
        confirmed_by: inputs.approvedBy,
      }).catch((error) => {
        console.error("Failed to persist mobile session metadata:", error);
      });
    }, 600);

    return () => clearTimeout(timeout);
  }, [
    draftLoaded,
    inputs.approvedBy,
    inputs.bound,
    inputs.preparedBy,
    inputs.reportDate,
    inputs.station,
    metadataComplete,
    reportId,
  ]);

  function updateInput<K extends keyof MobileReportInputs>(
    field: K,
    value: MobileReportInputs[K]
  ) {
    setDraftStatus("saving");
    setBuiltOutputs(null);
    setBuildStatus((previous) => (previous === "building" ? previous : "idle"));
    setInputs((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSaveManualInputs(activeReportId?: string) {
    try {
      const id = activeReportId || (await ensureSession());

      setManualStatus("busy");
      setStatusMessage(null);
      const updatedSession = await updateManualInputs(id, manualPayload);
      setManualStatus("ready");
      setUploadResponse(updatedSession as MobileReportUploadResponse);
      setMobileExcelUrl(
        resolveApiUrl(updatedSession.mobile_excel_report?.download_url) ||
          (updatedSession.sections.mobile_report?.status === "ready"
            ? getMobileExcelReportDownloadUrl(id)
            : null)
      );
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

  function handleAddDimensionCharge() {
    if (!newDimCharge.registration) {
      alert("Registration is required.");
      return;
    }
    let dateTimeVal = newDimCharge.date_time;
    if (!dateTimeVal) {
      const today = inputs.reportDate || new Date().toISOString().split("T")[0];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      dateTimeVal = `${today} ${timeStr}`;
    }

    const newCharge = {
      ...newDimCharge,
      date_time: dateTimeVal,
      id: `dim-${Date.now()}`,
    };

    const currentCharges = inputs.dimension_charges || [];
    updateInput("dimension_charges", [...currentCharges, newCharge]);

    setNewDimCharge({
      registration: "",
      transporter: "",
      axle: "",
      gvw_excess: "",
      axle_excess: "",
      origin: "",
      destination: "",
      cargo: "",
      date_time: "",
      make: "",
    });
  }

  function handleRemoveDimensionCharge(id: string) {
    const currentCharges = inputs.dimension_charges || [];
    const filtered = currentCharges.filter((c: any) => c.id !== id);
    updateInput("dimension_charges", filtered);
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
      setBuiltOutputs(null);
      setBuildStatus("idle");

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

  function mobileOutputFilename(extension: "docx" | "xlsx") {
    const station = inputs.station
      .toUpperCase()
      .split(/\s+/)
      .filter((part) => part && part !== "MOBILE")
      .join(" ");
    const stationName = station.includes("WEIGHBRIDGE")
      ? station
      : `${station || "STATION"} WEIGHBRIDGE`;
    const reportNumber = /(?:^|\s|_)mobile_?2(?:$|\s|_)|\b2\b|\btwo\b/i.test(
      inputs.bound
    )
      ? "2"
      : "1";
    const [year, month, day] = inputs.reportDate.split("-");
    const datePart =
      year && month && day ? `${day}.${month}.${year.slice(-2)}` : inputs.reportDate;
    const filename =
      `${stationName} MOBILE DAILY REPORT ${reportNumber} ${datePart}`
        .replace(/[<>:"/\\|?*]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return `${filename || "MOBILE DAILY REPORT"}.${extension}`;
  }

  async function readErrorMessage(response: Response, fallback: string) {
    try {
      const body = await response.json();
      const detail = body?.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (typeof detail?.message === "string") {
        return detail.message;
      }
    } catch {
      // Some build failures may return an empty or non-JSON response.
    }

    return fallback;
  }

  async function fetchBuiltMobileFile({
    url,
    filename,
    mediaType,
    failureMessage,
  }: {
    url: string;
    filename: string;
    mediaType: string;
    failureMessage: string;
  }): Promise<BuiltMobileFile> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, failureMessage));
    }

    const blob = await response.blob();

    return {
      filename,
      blob: new Blob([blob], { type: mediaType }),
    };
  }

  function saveBuiltMobileFile(file: BuiltMobileFile) {
    const objectUrl = URL.createObjectURL(file.blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function handleBuildMobileReports() {
    if (
      !uploadComplete ||
      !manualInputsComplete ||
      !mobileExcelUrl ||
      !mobileWordUrl ||
      buildBusy
    ) {
      return;
    }

    try {
      setBuildStatus("building");
      setBuiltOutputs(null);
      setStatusMessage("Building mobile Word and Excel reports.");

      const activeReportId = await handleSaveManualInputs(reportId || undefined);
      const excelUrl = mobileExcelUrl || getMobileExcelReportDownloadUrl(activeReportId);
      const wordUrl = mobileWordUrl || getMobileWordReportDownloadUrl(activeReportId);

      if (!wordUrl || !excelUrl) {
        throw new Error("Mobile report download links are not ready.");
      }

      setStatusMessage("Building mobile Word and Excel reports.");

      const [word, excel] = await Promise.all([
        fetchBuiltMobileFile({
          url: wordUrl,
          filename: mobileOutputFilename("docx"),
          mediaType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          failureMessage: "Failed to build mobile Word report.",
        }),
        fetchBuiltMobileFile({
          url: excelUrl,
          filename: mobileOutputFilename("xlsx"),
          mediaType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          failureMessage: "Failed to build mobile Excel workbook.",
        }),
      ]);

      setBuiltOutputs({ word, excel });
      setBuildStatus("ready");
      setStatusMessage("Reports built successfully. Downloads are now enabled.");
    } catch (error) {
      setBuildStatus("error");
      setBuiltOutputs(null);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to build mobile report outputs."
      );
    }
  }

  function handleDownloadMobileExcel() {
    if (!reportsBuilt) {
      setStatusMessage("Build the mobile reports before downloading.");
      return;
    }

    setDownloadTarget("excel");
    saveBuiltMobileFile(builtOutputs.excel);
    setDownloadTarget(null);
    setStatusMessage("Excel workbook download has started.");
  }

  function handleDownloadMobileWord() {
    if (!reportsBuilt) {
      setStatusMessage("Build the mobile reports before downloading.");
      return;
    }

    setDownloadTarget("word");
    saveBuiltMobileFile(builtOutputs.word);
    setDownloadTarget(null);
    setStatusMessage("Word report download has started.");
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
    setDownloadTarget(null);
    setBuildStatus("idle");
    setBuiltOutputs(null);
    setSelectedFileName("");
    setStatusMessage(null);
  }

  const kpiCards = [
    {
      title: "Total Weighed",
      value: totalWeighed,
      subtitle: processingMessage
        ? processingMessage
        : uploadComplete
        ? "from uploaded register"
        : "awaiting register",
      icon: Scale,
      className: processingMessage
        ? "border-cyan-400/60 bg-transparent text-cyan-100"
        : uploadComplete 
        ? "border-sky-500/50 bg-transparent hover:bg-sky-600/25 text-sky-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: processingMessage
        ? "bg-cyan-400/15 text-cyan-100"
        : uploadComplete ? "bg-sky-400/15 text-sky-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: processingMessage ? "text-cyan-100" : uploadComplete ? "text-sky-100" : "text-slate-300",
      subtitleClass: processingMessage ? "text-cyan-200" : uploadComplete ? "text-sky-200" : "text-slate-400",
    },
    {
      title: "Warned",
      value: warned,
      subtitle: processingMessage ? "updating KPI source data" : "warned trucks",
      icon: AlertTriangle,
      className: processingMessage
        ? "border-cyan-400/60 bg-transparent text-cyan-100"
        : uploadComplete 
        ? "border-amber-500/50 bg-transparent hover:bg-amber-600/20 text-amber-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: processingMessage
        ? "bg-cyan-400/15 text-cyan-100"
        : uploadComplete ? "bg-amber-400/15 text-amber-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: processingMessage ? "text-cyan-100" : uploadComplete ? "text-amber-100" : "text-slate-300",
      subtitleClass: processingMessage ? "text-cyan-200" : uploadComplete ? "text-amber-200" : "text-slate-400",
    },
    {
      title: "Charged GVW/Axle",
      value: chargedGvwAxle,
      subtitle: processingMessage ? "updating KPI source data" : "weight offences",
      icon: Truck,
      className: processingMessage
        ? "border-cyan-400/60 bg-transparent text-cyan-100"
        : uploadComplete 
        ? "border-rose-500/50 bg-transparent hover:bg-rose-600/20 text-rose-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: processingMessage
        ? "bg-cyan-400/15 text-cyan-100"
        : uploadComplete ? "bg-rose-400/15 text-rose-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: processingMessage ? "text-cyan-100" : uploadComplete ? "text-rose-100" : "text-slate-300",
      subtitleClass: processingMessage ? "text-cyan-200" : uploadComplete ? "text-rose-200" : "text-slate-400",
    },
    {
      title: "Charged Dimensions",
      value: chargedDimensions,
      subtitle: processingMessage ? "updating KPI source data" : "dimension offences",
      icon: Ruler,
      className: processingMessage
        ? "border-cyan-400/60 bg-transparent text-cyan-100"
        : uploadComplete 
        ? "border-emerald-500/50 bg-transparent hover:bg-emerald-600/20 text-emerald-100" 
        : "border-cyan-900/50 bg-transparent hover:bg-[#0b2a45] text-slate-300",
      iconClass: processingMessage
        ? "bg-cyan-400/15 text-cyan-100"
        : uploadComplete ? "bg-emerald-400/15 text-emerald-200" : "bg-cyan-400/15 text-cyan-200",
      titleClass: processingMessage ? "text-cyan-100" : uploadComplete ? "text-emerald-100" : "text-slate-300",
      subtitleClass: processingMessage ? "text-cyan-200" : uploadComplete ? "text-emerald-200" : "text-slate-400",
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

                  <div className="mt-5 flex h-12 items-center">
                    {processingMessage ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin text-cyan-200"
                        size={34}
                      />
                    ) : (
                      <p className="text-4xl font-black text-white">
                        {uploadComplete ? card.value : "—"}
                      </p>
                    )}
                  </div>

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
                disabled={!isAdmin}
                id="mobile-station"
                label="Station"
                value={inputs.station}
                onChange={(value) => updateInput("station", value)}
                options={isAdmin ? STATION_OPTIONS : [inputs.station]}
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
                  disabled={!isAdmin}
                  id="mobile-prepared-by"
                  value={inputs.preparedBy}
                  onChange={(event) =>
                    updateInput("preparedBy", event.target.value)
                  }
                  className={`mt-1 w-full rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm text-slate-100 shadow-inner outline-none transition hover:border-cyan-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {!isAdmin ? (
                    <option value={inputs.preparedBy}>{inputs.preparedBy}</option>
                  ) : (
                    <>
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
                    </>
                  )}
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
              <p className="text-xs font-semibold text-slate-400">
                {reportId
                  ? "Session started"
                  : sessionStatus === "busy"
                  ? "Creating session automatically..."
                  : sessionStatus === "error"
                  ? "Session could not be created. Update the report info to try again."
                  : metadataComplete
                  ? "Creating session automatically..."
                  : "Fill report info to start session automatically."}
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
                  {isMobileTwo
                    ? "Shift 1 Danka Staff"
                    : "Danka Staff In Charge"}
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
                  {isMobileTwo
                    ? "Shift 1 Police In Charge"
                    : "Police In Charge"}
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
                  {isMobileTwo
                    ? "Shift 1 Mobile Vehicle Used"
                    : "Mobile Vehicle Used"}
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

              {isMobileTwo && (
                <div className="rounded-lg border border-cyan-900/50 bg-[#071827]/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    Shift 2 Team And Vehicle
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextInput
                      id="shift-two-dm-entry"
                      label="DM Entry"
                      value={inputs.shiftTwoDmEntry}
                      onChange={(value) => updateInput("shiftTwoDmEntry", value)}
                    />

                    <TextInput
                      id="shift-two-driver-entry"
                      label="Driver Entry"
                      value={inputs.shiftTwoDriverEntry}
                      onChange={(value) =>
                        updateInput("shiftTwoDriverEntry", value)
                      }
                    />

                    <TextInput
                      id="shift-two-police-officer-one"
                      label="Police Officer 1"
                      value={inputs.shiftTwoPoliceOfficerOne}
                      onChange={(value) =>
                        updateInput("shiftTwoPoliceOfficerOne", value)
                      }
                    />

                    <TextInput
                      id="shift-two-police-officer-two"
                      label="Police Officer 2"
                      value={inputs.shiftTwoPoliceOfficerTwo}
                      onChange={(value) =>
                        updateInput("shiftTwoPoliceOfficerTwo", value)
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TextInput
                      id="shift-two-mobile-vehicle-reg"
                      label="Vehicle Registration"
                      value={inputs.shiftTwoMobileVehicleReg}
                      onChange={(value) =>
                        updateInput("shiftTwoMobileVehicleReg", value)
                      }
                    />

                    <TextInput
                      id="shift-two-start-mileage"
                      label="Mileage Start"
                      type="number"
                      min={0}
                      uppercase={false}
                      value={inputs.shiftTwoStartMileage}
                      onChange={(value) =>
                        updateInput("shiftTwoStartMileage", value)
                      }
                    />

                    <TextInput
                      id="shift-two-stop-mileage"
                      label="Mileage End"
                      type="number"
                      min={0}
                      uppercase={false}
                      value={inputs.shiftTwoStopMileage}
                      onChange={(value) =>
                        updateInput("shiftTwoStopMileage", value)
                      }
                    />

                    <div className="px-1 py-1">
                      <div className="flex items-center gap-2 text-cyan-200">
                        <Gauge aria-hidden="true" size={18} />
                        <p className="text-xs font-bold uppercase tracking-wider">
                          KMS
                        </p>
                      </div>

                      <p className="mt-2 text-2xl font-black text-white">
                        {shiftTwoKilometers ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Manual Dimension Charges Section */}
              <div className="mt-6 border-t border-cyan-900/50 pt-6">
                <h3 className="text-sm font-bold text-cyan-200">Manual Dimension Charges</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manually record vehicles charged on dimensions. These will be appended to the mobile report.
                </p>

                {/* Table of current charges */}
                {(inputs.dimension_charges || []).length > 0 && (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-cyan-900/50">
                    <table className="min-w-full divide-y divide-cyan-900/50 text-left text-xs">
                      <thead className="bg-[#071827] text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Reg No</th>
                          <th className="px-3 py-2">Transporter</th>
                          <th className="px-3 py-2">Config</th>
                          <th className="px-3 py-2">Cargo</th>
                          <th className="px-3 py-2">GVW Excess</th>
                          <th className="px-3 py-2">Axle Excess</th>
                          <th className="px-3 py-2">Origin</th>
                          <th className="px-3 py-2">Destination</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/40 bg-[#0b2a45]">
                        {(inputs.dimension_charges || []).map((charge: any) => (
                          <tr key={charge.id} className="hover:bg-cyan-950/20 text-slate-300">
                            <td className="px-3 py-2 font-mono font-bold text-cyan-100">{charge.registration}</td>
                            <td className="px-3 py-2">{charge.transporter || "—"}</td>
                            <td className="px-3 py-2">{charge.axle || "—"}</td>
                            <td className="px-3 py-2">{charge.cargo || "—"}</td>
                            <td className="px-3 py-2">{charge.gvw_excess || "0"}</td>
                            <td className="px-3 py-2">{charge.axle_excess || "0"}</td>
                            <td className="px-3 py-2">{charge.origin || "—"}</td>
                            <td className="px-3 py-2">{charge.destination || "—"}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveDimensionCharge(charge.id)}
                                className="text-red-400 hover:text-red-300 font-bold transition"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Form to add a new charge */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 rounded-lg border border-cyan-800/20 bg-slate-900/20 p-4">
                  <TextInput
                    id="dim-reg"
                    label="Registration *"
                    value={newDimCharge.registration}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, registration: val }))}
                  />
                  <TextInput
                    id="dim-transporter"
                    label="Transporter"
                    value={newDimCharge.transporter}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, transporter: val }))}
                  />
                  <TextInput
                    id="dim-axle"
                    label="Configuration"
                    value={newDimCharge.axle}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, axle: val }))}
                  />
                  <TextInput
                    id="dim-cargo"
                    label="Cargo"
                    value={newDimCharge.cargo}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, cargo: val }))}
                  />
                  <TextInput
                    id="dim-gvw-excess"
                    label="GVW Excess (KG)"
                    type="number"
                    value={newDimCharge.gvw_excess}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, gvw_excess: val }))}
                  />
                  <TextInput
                    id="dim-axle-excess"
                    label="Axle Excess (KG)"
                    type="number"
                    value={newDimCharge.axle_excess}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, axle_excess: val }))}
                  />
                  <TextInput
                    id="dim-origin"
                    label="Origin"
                    value={newDimCharge.origin}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, origin: val }))}
                  />
                  <TextInput
                    id="dim-destination"
                    label="Destination"
                    value={newDimCharge.destination}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, destination: val }))}
                  />
                  <TextInput
                    id="dim-date-time"
                    label="Date/Time Override (optional)"
                    placeholder="e.g. YYYY-MM-DD HH:MM"
                    value={newDimCharge.date_time}
                    onChange={(val) => setNewDimCharge(prev => ({ ...prev, date_time: val }))}
                  />

                  <div className="sm:col-span-2 md:col-span-3 xl:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDimensionCharge}
                      className="flex items-center gap-1.5 rounded-md bg-cyan-900/60 border border-cyan-700/60 hover:bg-cyan-700/60 px-4 py-2 text-xs font-bold text-cyan-200 transition"
                    >
                      Add Dimension Charge
                    </button>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSaveManualInputs()}
                disabled={
                  !metadataComplete ||
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

            {uploadResponse?.mobile_report?.duplicates && uploadResponse.mobile_report.duplicates.length > 0 && (
              <div className="mt-5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 text-yellow-300">
                  <AlertTriangle size={18} />
                  <h3 className="text-sm font-bold">Duplicate Weighbridge Entries Detected</h3>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  The following vehicles were weighed multiple times. Please select which weigh ticket represents a **Reweigh**. Tickets marked as Reweigh will not count towards overloaded/charged violations.
                </p>

                <div className="mt-4 space-y-4">
                  {uploadResponse.mobile_report.duplicates.map((dup: any) => {
                    const selectedTicket = dup.tickets.find((t: any) =>
                      inputs.reweigh_tickets?.includes(t.ticket_no)
                    )?.ticket_no || "";

                    return (
                      <div key={dup.registration} className="rounded-md border border-cyan-900/50 bg-[#071827] p-3">
                        <p className="text-sm font-bold text-cyan-200">{dup.registration}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded border border-cyan-800/40 bg-slate-900/40 p-2 cursor-pointer hover:bg-slate-900/80 transition">
                            <input
                              type="radio"
                              name={`reweigh-${dup.registration}`}
                              checked={selectedTicket === ""}
                              onChange={() => {
                                const ticketNumbers = dup.tickets.map((t: any) => t.ticket_no);
                                const filtered = (inputs.reweigh_tickets || []).filter(
                                  (t) => !ticketNumbers.includes(t)
                                );
                                updateInput("reweigh_tickets", filtered);
                              }}
                              className="accent-cyan-500"
                            />
                            <span className="text-xs text-slate-300">No Reweigh (Keep both)</span>
                          </label>

                          {dup.tickets.map((t: any) => (
                            <label key={t.ticket_no} className="flex items-center gap-2 rounded border border-cyan-800/40 bg-slate-900/40 p-2 cursor-pointer hover:bg-slate-900/80 transition">
                              <input
                                type="radio"
                                name={`reweigh-${dup.registration}`}
                                checked={selectedTicket === t.ticket_no}
                                onChange={() => {
                                  const ticketNumbers = dup.tickets.map((x: any) => x.ticket_no);
                                  const filtered = (inputs.reweigh_tickets || []).filter(
                                    (x) => !ticketNumbers.includes(x)
                                  );
                                  updateInput("reweigh_tickets", [...filtered, t.ticket_no]);
                                }}
                                className="accent-cyan-500"
                              />
                              <span className="text-xs text-slate-300">
                                Ticket: <strong>{t.ticket_no}</strong> ({t.gvw_kg} kg) - {t.remarks}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

          {processingMessage && (
            <div
              className="mt-4 flex items-start gap-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-3 text-sm text-cyan-100"
              aria-live="polite"
            >
              <LoaderCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0 animate-spin"
                size={18}
              />
              <p>{processingMessage}. Please keep this tab open.</p>
            </div>
          )}

          {buildStatus === "ready" && (
            <div
              className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100"
              aria-live="polite"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-emerald-200"
                size={18}
              />
              <p>Reports built successfully. You can download the Word and Excel files.</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleBuildMobileReports}
            disabled={
              !uploadComplete ||
              !manualInputsComplete ||
              !mobileWordUrl ||
              !mobileExcelUrl ||
              buildBusy ||
              downloadBusy
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400 bg-transparent px-4 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {buildBusy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <FileSpreadsheet aria-hidden="true" size={16} />
            )}
            {buildBusy ? "Building Reports" : "Build Reports"}
          </button>

          <button
            type="button"
            onClick={handleDownloadMobileWord}
            disabled={
              !reportsBuilt ||
              downloadBusy ||
              buildBusy
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {downloadTarget === "word" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <Download aria-hidden="true" size={16} />
            )}
            {downloadTarget === "word" ? "Building Word" : "Download Mobile Word"}
          </button>

          <button
            type="button"
            onClick={handleDownloadMobileExcel}
            disabled={
              !reportsBuilt ||
              downloadBusy ||
              buildBusy
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {downloadTarget === "excel" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <Download aria-hidden="true" size={16} />
            )}
            {downloadTarget === "excel"
              ? "Building Excel"
              : "Download Mobile Excel"}
          </button>

          {!manualInputsComplete && (
            <p className="mt-3 text-xs text-slate-400">
              Complete the manual mobile fields before building outputs.
            </p>
          )}

          {manualInputsComplete && uploadComplete && !reportsBuilt && (
            <p className="mt-3 text-xs text-slate-400">
              Build the reports to enable downloads.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
