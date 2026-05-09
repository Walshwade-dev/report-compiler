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

export function SectionPreviewPanel({
  selectedSection,
  setSelectedSection,
  previewFormat,
  setPreviewFormat,
  reportId,
}: SectionPreviewPanelProps) {
  const [previewSrc, setPreviewSrc] =
    useState<string | null>(null);

  const sectionName =
    REPORT_SECTION_NAMES[
      selectedSection
    ];

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewSrc() {
      if (!reportId || !sectionName) {
        setPreviewSrc(null);
        return;
      }

      const url = await getSectionPreviewUrl(reportId, sectionName);

      if (!cancelled) {
        setPreviewSrc(`${url}?format=${previewFormat}`);
      }
    }

    loadPreviewSrc();

    return () => {
      cancelled = true;
    };
  }, [reportId, sectionName, previewFormat]);

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-5">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Section Preview
          </h2>
        </div>

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
      </div>

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
              Preview format:
              {" "}
              {previewFormat.toUpperCase()}
            </p>
          </div>
        </div>

        {!reportId ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-cyan-900/50 bg-[#071827] text-sm text-slate-500">
            Create a backend session first.
          </div>

        ) : previewFormat === "png" ? (

          <div className="overflow-auto rounded-xl border border-cyan-900/50 bg-white p-2">

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc || ""}
              alt={`Section ${selectedSection} preview`}
              className="w-full rounded-lg object-contain"
              loading="eager"
            />
          </div>

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
    </div>
  );
}
