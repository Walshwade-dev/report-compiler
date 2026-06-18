"use client";

import ReportsLayout from "./reports/layout";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentReportsList } from "@/components/dashboard/RecentReportsList";
import { PlusCircle, FileSpreadsheet, Layers, Zap } from "lucide-react";
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
              Report Compiler Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Compile weighbridge logs, analyze traffic distributions, track overloads, and generate client-ready reports in seconds.
            </p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <DashboardSummaryCards />

        {/* Analytics Section with Comparative Charts */}
        <DashboardCharts />

        {/* Quick Actions (Full Width) */}
        <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/reports/static-weighbridge/new"
              onClick={() => localStorage.removeItem("active-report-id")}
              className="group relative overflow-hidden rounded-xl border border-cyan-900/60 bg-[#071827]/80 p-5 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Layers size={20} />
                </div>
                <PlusCircle size={18} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="mt-4 font-bold text-white group-hover:text-cyan-300 transition-colors">
                Static Weighbridge Report
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Create daily & hourly statistics, charts, and overload details.
              </p>
            </Link>

            <div className="group relative overflow-hidden rounded-xl border border-cyan-900/30 bg-[#071827]/40 p-5 cursor-not-allowed opacity-60">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-800 p-2.5 text-slate-400">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Coming Soon
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-400">
                Mobile Weighbridge Report
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Parse mobile worksheet Excel files and compile summaries.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Workspaces Table */}
        <RecentReportsList />
      </div>
    </ReportsLayout>
  );
}
