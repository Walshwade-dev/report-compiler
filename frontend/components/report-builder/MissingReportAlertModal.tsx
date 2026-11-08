"use client";

import { AlertTriangle, Calendar, ArrowRight, ShieldAlert } from "lucide-react";
import { formatDisplayDate } from "@/lib/reportContinuity";

interface MissingReportAlertModalProps {
  isOpen: boolean;
  missingDate: string;
  attemptedDate: string;
  station: string;
  bound: string;
  onSwitchDate: (targetDate: string) => void;
}

export function MissingReportAlertModal({
  isOpen,
  missingDate,
  attemptedDate,
  station,
  bound,
  onSwitchDate,
}: MissingReportAlertModalProps) {
  if (!isOpen || !missingDate) {
    return null;
  }

  const formattedMissingDate = formatDisplayDate(missingDate);
  const formattedAttemptedDate = formatDisplayDate(attemptedDate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#0c2438] via-[#071827] to-[#040f1a] p-6 shadow-2xl sm:p-8">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="h-8 w-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <ShieldAlert size={13} />
            Data Continuity Guard
          </div>

          <h2 className="mt-3 text-xl font-extrabold text-white sm:text-2xl">
            Missing Daily Report Detected
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            To prevent an audit data gap, weighbridge reports must be compiled consecutively. The report for{" "}
            <span className="font-semibold text-amber-300">
              {formattedMissingDate}
            </span>{" "}
            has not been submitted for{" "}
            <span className="font-semibold text-cyan-300">
              {station}
            </span>
            {bound ? ` (${bound})` : ""}.
          </p>

          {/* Comparison Cards */}
          <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Required First (Missing)
              </span>
              <div className="mt-1 flex items-center gap-2 text-base font-extrabold text-amber-200">
                <Calendar size={16} className="text-amber-400 shrink-0" />
                <span>{formattedMissingDate}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3.5 opacity-60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attempted Date (Held)
              </span>
              <div className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-300 line-through decoration-red-400/70">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span>{formattedAttemptedDate}</span>
              </div>
            </div>
          </div>

          {/* Enforced message */}
          <p className="mt-4 text-xs leading-normal text-slate-400">
            You must compile and submit the report for{" "}
            <strong className="text-slate-200">{formattedMissingDate}</strong>{" "}
            before creating subsequent daily reports.
          </p>

          {/* Action button */}
          <div className="mt-6 w-full">
            <button
              type="button"
              onClick={() => onSwitchDate(missingDate)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/30 active:scale-[0.99]"
            >
              <Calendar size={16} />
              <span>Switch to {formattedMissingDate} Report</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
