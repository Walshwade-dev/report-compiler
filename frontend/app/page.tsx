"use client";

import ReportsLayout from "./reports/layout";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DMSPerformance } from "@/components/dashboard/DMSPerformance";
import { TopDMsTable } from "@/components/dashboard/TopDMsTable";
import { RecentReportsList } from "@/components/dashboard/RecentReportsList";
import { SmsSummaryPanel } from "@/components/dashboard/SmsSummaryPanel";
import { PlusCircle, FileSpreadsheet, Layers } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl lg:p-8">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent"></div>
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
                Operations overview
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Report Dashboard
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                Monitor traffic, compliance, and reporting activity in one place before generating the next report pack.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Live summary
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Fast report creation
              </span>
            </div>
          </div>
        </div>

        {/* KPI Summary Columns & DMS Tracker (3 main columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <DashboardSummaryCards />
          <div className="h-full flex flex-col">
            <DMSPerformance />
          </div>
        </div>

        {/* SMS Summaries Row */}
        <div className="grid grid-cols-1 gap-6">
          <SmsSummaryPanel />
        </div>

        {/* Bottom Section: Analytics + DMs + Workspaces */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <DashboardCharts />
            <TopDMsTable />
          </div>

          <div className="flex flex-col gap-6 min-w-0">
            <div className="rounded-2xl border border-cyan-900/50 bg-[#0b2135]/70 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
                    Quick Actions
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Start a new report workflow or reopen recent workspaces.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/reports/static-weighbridge/new"
                  onClick={() => localStorage.removeItem("active-report-id")}
                  className="flex items-center gap-3 rounded-xl border border-cyan-900/60 bg-[#071827]/80 p-3 transition-all duration-200 group hover:border-cyan-500/40 hover:bg-cyan-950/20"
                >
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-300">
                      Static Weighbridge Report
                    </div>
                    <div className="text-xs text-slate-400">
                      Create a fresh report bundle
                    </div>
                  </div>
                  <PlusCircle size={14} className="ml-auto shrink-0 text-slate-500 transition-colors group-hover:text-cyan-400" />
                </Link>

                <div className="flex items-center gap-3 rounded-xl border border-cyan-900/30 bg-[#071827]/40 p-3 opacity-70">
                  <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-400">
                      Mobile Weighbridge Report
                    </div>
                    <div className="text-xs text-slate-500">
                      Coming soon
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
                    Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0">
              <RecentReportsList />
            </div>
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
