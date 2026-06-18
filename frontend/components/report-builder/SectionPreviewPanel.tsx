import {
  PreviewFormat,
  ReportSection,
} from "@/lib/types";
import { useEffect, useState } from "react";

import {
  getSectionPreviewUrl,
} from "@/lib/api";

import {
  REPORT_SECTION_NAMES,
} from "@/lib/constants";

type SectionPreviewPanelProps = {
  selectedSection: ReportSection;

  setSelectedSection: React.Dispatch<
    React.SetStateAction<ReportSection>
  >;

  previewFormat: PreviewFormat;

  setPreviewFormat: React.Dispatch<
    React.SetStateAction<PreviewFormat>
  >;

  reportId: string | null;

  previewsEnabled: boolean;
};

const sections = [
  { id: 1, label: "HOURLY STATS" },
  { id: 2, label: "HOURLY DATA" },
  { id: 3, label: "TRAFFIC CENSUS" },
  { id: 4, label: "DAILY SUMMARY" },
  { id: 5, label: "TRANSGRESSIONS" },
  { id: 6, label: "PROHIBITED" },
  { id: 7, label: "WIDELOADS" },
] as const;


const formats: PreviewFormat[] = [
  "png",
  "pdf",
  "docx",
];

const PNG_PREVIEW_RETRY_DELAY_MS = 5000;
const PNG_PREVIEW_MAX_ATTEMPTS = 14;

export function SectionPreviewPanel({
  selectedSection,
  setSelectedSection,
  previewFormat,
  setPreviewFormat,
  reportId,
  previewsEnabled,
}: SectionPreviewPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewSrc, setPreviewSrc] =
    useState<string | null>(null);
  const [docxPreviewSrc, setDocxPreviewSrc] =
    useState<string | null>(null);
  const [previewError, setPreviewError] =
    useState<string | null>(null);
  const [pngPreviewStatus, setPngPreviewStatus] =
    useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pngPreviewAttempt, setPngPreviewAttempt] =
    useState(0);
  const [pngRetryPending, setPngRetryPending] =
    useState(false);

  const sectionName =
    REPORT_SECTION_NAMES[
      selectedSection
    ];

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewSrc() {
      if (!reportId || !sectionName || !previewsEnabled) {
        setPreviewSrc(null);
        setDocxPreviewSrc(null);
        setPreviewError(null);
        setPngPreviewStatus("idle");
        setPngPreviewAttempt(0);
        setPngRetryPending(false);
        return;
      }

      try {
        const url = await getSectionPreviewUrl(reportId, sectionName);

        if (!cancelled) {
          setPreviewSrc(`${url}?format=${previewFormat}`);
          setDocxPreviewSrc(`${url}?format=docx`);
          setPreviewError(null);
          setPngPreviewStatus(
            previewFormat === "png" ? "loading" : "idle"
          );
          setPngPreviewAttempt(0);
          setPngRetryPending(false);
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(null);
          setDocxPreviewSrc(null);
          setPreviewError("Preview URL could not be prepared.");
          setPngPreviewStatus("error");
          setPngPreviewAttempt(0);
          setPngRetryPending(false);
        }
      }
    }

    loadPreviewSrc();

    return () => {
      cancelled = true;
    };
  }, [reportId, sectionName, previewFormat, previewsEnabled]);

  useEffect(() => {
    if (
      previewFormat !== "png" ||
      !pngRetryPending ||
      pngPreviewAttempt >= PNG_PREVIEW_MAX_ATTEMPTS
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      setPngPreviewAttempt((attempt) => attempt + 1);
      setPngRetryPending(false);
    }, PNG_PREVIEW_RETRY_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [previewFormat, pngRetryPending, pngPreviewAttempt]);

  const pngPreviewSrc =
    previewSrc && previewFormat === "png"
      ? `${previewSrc}&previewAttempt=${pngPreviewAttempt}`
      : previewSrc;

  const pngRetrySeconds =
    Math.round(
      (PNG_PREVIEW_RETRY_DELAY_MS *
        (PNG_PREVIEW_MAX_ATTEMPTS - 1)) /
        1000
    );

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Section Preview
          </h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${
              showPreview
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300"
            }`}
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        {showPreview && (
          <select
            value={previewFormat}
            onChange={(e) =>
              setPreviewFormat(
                e.target.value as PreviewFormat
              )
            }
            className="rounded-md border border-cyan-700 bg-[#0b2a45] px-3 py-2 text-sm"
          >
            {formats.map((format) => (
              <option
                key={format}
                value={format}
              >
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        )}
      </div>

      {showPreview && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedSection === section.id
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-[#0b2a45] text-slate-300 hover:bg-cyan-500/20"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-cyan-900/50 bg-[#0b2135] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-cyan-300">
                  {sections.find((section) => section.id === selectedSection)?.label}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Preview format:{" "}
                  {previewFormat.toUpperCase()}
                </p>
              </div>
            </div>

            {!reportId ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-cyan-900/50 bg-[#071827] text-sm text-slate-500">
                Create a backend session first.
              </div>
            ) : !previewsEnabled ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-800/50 bg-transparent p-6 text-center">
                <p className="text-sm font-semibold text-sky-300">
                  Upload all required CSV files to unlock previews.
                </p>

                <p className="mt-2 max-w-sm text-xs text-sky-200/70">
                  PNG rendering will start after Daily Hour, Wideload,
                  Impounded / Prohibited, and Impounded / Overloaded are uploaded.
                </p>
              </div>
            ) : previewFormat === "png" ? (
              previewError ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/40 bg-[#071827] p-6 text-center">
                  <p className="text-sm font-semibold text-amber-200">
                    {previewError}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    The generated Word preview is still available.
                  </p>

                  <a
                    href={docxPreviewSrc || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950"
                  >
                    Open DOCX Preview
                  </a>
                </div>
              ) : (
                <div className="relative min-h-64 overflow-auto rounded-xl border border-cyan-900/50 bg-white p-2">
                  {pngPreviewStatus === "loading" && (
                    <div className="absolute inset-2 z-10 flex min-h-64 flex-col items-center justify-center rounded-lg bg-transparent p-6 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />

                      <p className="mt-4 text-sm font-semibold text-sky-600">
                        Rendering PNG preview...
                      </p>

                      <p className="mt-2 max-w-sm text-xs text-sky-500">
                        First-time previews can take up to {pngRetrySeconds} seconds
                        while the backend converts the report section.
                      </p>
                    </div>
                  )}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pngPreviewSrc || ""}
                    alt={`Section ${selectedSection} preview`}
                    className={`w-full rounded-lg object-contain ${
                      pngPreviewStatus === "ready" ? "opacity-100" : "opacity-0"
                    }`}
                    loading="lazy"
                    onLoad={() => {
                      setPngPreviewStatus("ready");
                      setPreviewError(null);
                      setPngRetryPending(false);
                    }}
                    onError={() => {
                      if (pngPreviewAttempt < PNG_PREVIEW_MAX_ATTEMPTS - 1) {
                        setPngPreviewStatus("loading");
                        setPngRetryPending(true);
                        return;
                      }

                      setPngPreviewStatus("error");
                      setPngRetryPending(false);
                      setPreviewError(
                        "PNG preview is taking too long or could not be rendered by the backend."
                      );
                    }}
                  />
                </div>
              )
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-900/50 bg-[#071827] text-center">
                <p className="text-sm text-slate-400">
                  {previewFormat.toUpperCase()} preview available.
                </p>

                <a
                  href={previewSrc || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950"
                >
                  Open {previewFormat.toUpperCase()}
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
