"use client";

import { ReportMetadata } from "@/lib/types";
import { useReportSettings } from "./ReportSettingsContext";
import { useState, useEffect } from "react";

type ReportMetadataFormProps = {
  metadata: ReportMetadata;
  setMetadata: React.Dispatch<
    React.SetStateAction<ReportMetadata>
  >;
};

export function ReportMetadataForm({
  metadata,
  setMetadata,
}: ReportMetadataFormProps) {
  const { people } = useReportSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Move to microtask to avoid direct setState warning
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  // Server and initial client render show the simplified version
  if (!mounted) {
    return (
      <div suppressHydrationWarning>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Report Info
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <input
            type="date"
            className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            placeholder="Date"
            value={metadata.date}
            onChange={(e) =>
              setMetadata((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
          />

          <select
            suppressHydrationWarning
            className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
            value={metadata.preparedBy}
            onChange={(e) =>
              setMetadata((prev) => ({
                ...prev,
                preparedBy: e.target.value,
              }))
            }
          >
            <option value="">Select prepared by</option>
          </select>

          <select
            suppressHydrationWarning
            className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed"
            value={metadata.approvedBy || "Faith Njani"}
            disabled
          >
            <option value="Faith Njani">Faith Njani</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
        Report Info
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <input
          type="date"
          className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
          placeholder="Date"
          value={metadata.date}
          onChange={(e) =>
            setMetadata((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
        />

        <select
          className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none"
          value={metadata.preparedBy}
          onChange={(e) =>
            setMetadata((prev) => ({
              ...prev,
              preparedBy: e.target.value,
            }))
          }
        >
          <option value="">Select prepared by</option>
          {people.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-cyan-700 bg-[#071827] px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed"
          value={metadata.approvedBy || "Faith Njani"}
          disabled
        >
          <option value="Faith Njani">Faith Njani</option>
        </select>
      </div>
    </div>
  );
}