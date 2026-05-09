"use client";
import {
  ChevronDown,
  FileText,
  Settings,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { REPORT_NAV_ITEMS } from "@/lib/constants";
import Image from "next/image";
import { ProgressSummary } from "./ProgressSummary";
import { useReportProgress } from "./ReportProgressContext";

type ReportSidebarProps = {
  onOpenSettings: () => void;
};

export function ReportSidebar({ onOpenSettings }: ReportSidebarProps) {
  const [reportsOpen, setReportsOpen] =
  useState(true);

  const [logoError, setLogoError] =
  useState(false);

  const progress = useReportProgress();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-cyan-900/40 bg-[#0b2135] p-5">
      <div className="flex items-center justify-center">
        {!logoError ? (
          <Image
            loading="eager"
            src="/dnk.png"
            alt="Danka Logo"
            width={160}
            height={160}
            className="h-28 w-48 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-cyan-300">
            DANKA
          </span>
        )}
      </div>

      <nav className="mt-10 space-y-2">
        <button
          onClick={() =>
            setReportsOpen((prev) => !prev)
          }
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-300 hover:bg-cyan-500/10">
          <span>Reports</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              reportsOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {reportsOpen && (
        <div className="ml-3 space-y-1 border-l border-cyan-900/50 pl-3">
          {REPORT_NAV_ITEMS[0].items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                item.active
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-200"
              }`}
            >
              {item.icon === "file" ? (
                <FileText size={16} />
              ) : (
                <Truck size={16} />
              )}

              <span>{item.label}</span>
            </a>
          ))}
        </div> )}
      </nav>


      <button
        onClick={onOpenSettings}
        className="mt-auto mb-8 border-b-1 border-l-1 border-r-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
      >
        <Settings size={16} />
        <span>Settings</span>
      </button>

      <div className="mb-4">
        <ProgressSummary
          metadataComplete={progress.metadataComplete}
          uploadsComplete={progress.uploadsComplete}
          manualInputsComplete={progress.manualInputsComplete}
          uploadCount={progress.uploadCount}
          canBuild={progress.canBuild}
        />
      </div>

    </aside>
  );
}
