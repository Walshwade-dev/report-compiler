"use client";

import { ReactNode, useState } from "react";
import { FileText, Settings, Truck, ShieldCheck, Database, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ReportSidebar } from "@/components/report-builder/ReportSidebar";
import {
  ReportProgressProvider,
  useReportProgress,
} from "@/components/report-builder/ReportProgressContext";
import {
  ReportSettingsProvider,
  useReportSettings,
} from "@/components/report-builder/ReportSettingsContext";
import { REPORT_NAV_ITEMS } from "@/lib/constants";

type ReportsLayoutProps = {
  children: ReactNode;
};

export default function ReportsLayout({ children }: ReportsLayoutProps) {
  return (
    <ReportSettingsProvider>
      <ReportProgressProvider>
        <ReportsLayoutContent>{children}</ReportsLayoutContent>
      </ReportProgressProvider>
    </ReportSettingsProvider>
  );
}

function ReportsLayoutContent({ children }: ReportsLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const pathname = usePathname();

  const { people, addPerson } = useReportSettings();
  const { debugManualPayload, debugUploadResponse, sessionId } =
    useReportProgress();

  return (
    <main className="min-h-screen bg-[#071827] text-slate-100">
      <div className="flex min-h-screen">
        <div className="hidden xl:block">
          <ReportSidebar onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        <section className="flex-1 p-4 sm:p-6">
          <header className="mb-5 rounded-xl border border-cyan-900/50 bg-[#0b2135] p-3 xl:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-cyan-200">
                  Reports
                </p>
                <p className="text-xs text-slate-500">
                  Select report workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-cyan-700 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10"
              >
                <Settings aria-hidden="true" size={16} />
                Settings
              </button>
            </div>
            <nav className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Report navigation">
              {REPORT_NAV_ITEMS[0].items.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      active
                        ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-100"
                        : "border-cyan-900/60 bg-[#071827] text-slate-400 hover:border-cyan-700 hover:text-cyan-200"
                    }`}
                  >
                    {item.icon === "truck" ? (
                      <Truck aria-hidden="true" size={16} />
                    ) : (
                      <FileText aria-hidden="true" size={16} />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {children}
        </section>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="h-full w-full max-w-md border-l border-cyan-900/50 bg-[#0b2135] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  App Settings
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Local UI settings for the report builder.
                </p>
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-cyan-700 px-3 py-1 text-sm text-cyan-300 hover:bg-cyan-500/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                <Zap size={12} className="animate-pulse" /> System Operational
              </div>

              <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                <p className="text-sm font-bold text-cyan-200 mb-3">
                  System Status
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-[#0b2135]/60 p-2.5 border border-cyan-950">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">API Gateway</p>
                        <p className="text-[9px] text-slate-400">FastAPI backend online</p>
                      </div>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#0b2135]/60 p-2.5 border border-cyan-950">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-cyan-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">Temporary Cache</p>
                        <p className="text-[9px] text-slate-400">In-memory Store active</p>
                      </div>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-cyan-900/30">
                  <p className="text-[9px] text-slate-500 text-center">
                    Antigravity Compiler Engine v1.1.0
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                <p className="text-sm font-bold text-cyan-200">
                  Report Officers
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Add officer name"
                    className="min-w-0 flex-1 rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm outline-none"
                  />

                  <button
                    onClick={() => {
                      addPerson(personName);
                      setPersonName("");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-1">
                  {people.map((person) => (
                    <p key={person} className="text-xs text-slate-400">
                      {person}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                <p className="text-sm font-bold text-cyan-200">
                  Session Details
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Technical report workspace reference.
                </p>

                <p className="mt-3 break-all rounded-lg border border-cyan-900/50 bg-[#0b2135] px-3 py-2 font-mono text-xs text-slate-300">
                  {sessionId || "No active report workspace"}
                </p>
              </div>

              {(debugManualPayload || debugUploadResponse) && (
                <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                  <p className="text-sm font-bold text-cyan-200">
                    Technical Payloads
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Backend request and response details for troubleshooting.
                  </p>

                  {debugManualPayload && (
                    <label htmlFor="settings-manual-payload" className="mt-4 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Manual PATCH Payload
                      </span>

                      <textarea
                        id="settings-manual-payload"
                        readOnly
                        value={debugManualPayload}
                        rows={10}
                        className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#0b2135] px-3 py-2 font-mono text-xs text-slate-300 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                      />
                    </label>
                  )}

                  {debugUploadResponse && (
                    <label htmlFor="settings-upload-response" className="mt-4 block">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Upload JSON Response
                      </span>

                      <textarea
                        id="settings-upload-response"
                        readOnly
                        value={debugUploadResponse}
                        rows={12}
                        className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#0b2135] px-3 py-2 font-mono text-xs text-slate-300 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/40"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
