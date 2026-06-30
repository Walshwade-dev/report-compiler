"use client";

import ReportsLayout from "./reports/layout";
import { StaticSummaryCards, MobileSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DMSPerformance } from "@/components/dashboard/DMSPerformance";
import { TopDMsTable } from "@/components/dashboard/TopDMsTable";
import { SmsSummaryPanel } from "@/components/dashboard/SmsSummaryPanel";

export default function HomePage() {
  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl lg:p-8">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent"></div>
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Report Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                Monitor traffic, compliance and reporting activity.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid for KPIs, SMS Summaries, and DMS Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          {/* Static Report KPIs: Span 1 on md (tablet), 4 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-4 h-full">
            <StaticSummaryCards />
          </div>

          {/* Mobile Report KPIs: Span 1 on md (tablet), 2 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-2 h-full">
            <MobileSummaryCards />
          </div>

          {/* Daily KPI SMS summaries: Span 1 on md (tablet), 3 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-3 h-full">
            <SmsSummaryPanel />
          </div>

          {/* DMS Performance Tracker: Span 1 on md (tablet), 3 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-3 h-full flex flex-col">
            <DMSPerformance />
          </div>
        </div>

        {/* Bottom Section: Analytics + DMs Performance Table */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <DashboardCharts />
          </div>

          <div className="flex flex-col gap-6 min-w-0 h-full">
            <TopDMsTable />
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
