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
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Report Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              View summary of traffic distribution and weighing statistics.
            </p>
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

        {/* Bottom Section: Analytics (Left) | Top DMs (Middle) | Actions & Workspaces (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_350px_350px] 2xl:grid-cols-[1fr_400px_400px] gap-6 items-stretch">
          
          {/* Left Column: Analytics */}
          <div className="h-full flex flex-col min-w-0 lg:col-span-2 xl:col-span-1">
            <DashboardCharts />
          </div>

          {/* Middle Column: Top DMs Table */}
          <div className="h-full flex flex-col min-w-0 lg:col-span-1">
            <TopDMsTable />
          </div>

          {/* Right Column: Actions & Workspaces */}
          <div className="hidden lg:flex h-full flex-col gap-6 min-w-0 lg:col-span-1">
             
             {/* Quick Actions (Compact Button List) */}
             <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md shrink-0">
               <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quick Actions</h2>
               <div className="flex flex-col gap-3">
                 <Link
                   href="/reports/static-weighbridge/new"
                   onClick={() => localStorage.removeItem("active-report-id")}
                   className="flex items-center gap-3 p-3 rounded-lg border border-cyan-900/60 bg-[#071827]/80 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all group"
                 >
                   <div className="rounded bg-cyan-500/10 p-2 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                     <Layers size={16} />
                   </div>
                   <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Static Weighbridge Report</span>
                   <PlusCircle size={14} className="ml-auto text-slate-500 group-hover:text-cyan-400 transition-colors" />
                 </Link>

                 <div className="flex items-center gap-3 p-3 rounded-lg border border-cyan-900/30 bg-[#071827]/40 cursor-not-allowed opacity-60">
                   <div className="rounded bg-slate-800 p-2 text-slate-400">
                     <FileSpreadsheet size={16} />
                   </div>
                   <span className="text-sm font-bold text-slate-400">Mobile Weighbridge Report</span>
                   <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                     Coming Soon
                   </span>
                 </div>
               </div>
             </div>

             {/* Recent Workspaces Table */}
             <div className="flex-1 min-h-0">
               <RecentReportsList />
             </div>
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
