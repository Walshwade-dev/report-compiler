"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getSmsSummaryDates, isApiConnectionError } from "@/lib/api";
import ReportsLayout from "./reports/layout";
import { StaticSummaryCards, MobileSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DMSPerformance } from "@/components/dashboard/DMSPerformance";
import { TopDMsTable } from "@/components/dashboard/TopDMsTable";
import { SmsSummaryPanel } from "@/components/dashboard/SmsSummaryPanel";

export default function HomePage() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    async function loadDates() {
      try {
        const dateList = await getSmsSummaryDates();
        setDates(dateList);
        if (dateList.length > 0) {
          setSelectedDate(dateList[0]);
        }
      } catch (err) {
        if (!isApiConnectionError(err)) {
          console.error("Failed to load dashboard dates:", err);
        }
      }
    }
    loadDates();
  }, []);

  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl lg:p-8">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent"></div>
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Report Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                Monitor traffic, compliance and reporting activity.
              </p>
            </div>

            {/* Parent Unified Date Selector */}
            <div className="flex items-center gap-3 bg-[#071827]/85 border border-cyan-500/30 rounded-xl px-4 py-2 shrink-0 shadow-lg backdrop-blur-md hover:border-cyan-400/50 transition-colors">
              <Calendar className="text-cyan-400 shrink-0" size={16} />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest leading-none mb-1">
                  Active Report Date
                </span>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={dates.length === 0}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer disabled:opacity-50 min-w-[130px] [color-scheme:dark]"
                >
                  {dates.length === 0 ? (
                    <option value="">No Active Dates</option>
                  ) : (
                    dates.map((d) => (
                      <option key={d} value={d} className="bg-[#071827] text-white">
                        {d}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid for KPIs, SMS Summaries, and DMS Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          {/* Static Report KPIs: Span 1 on md (tablet), 4 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-4 h-full">
            <StaticSummaryCards selectedDate={selectedDate} />
          </div>

          {/* Mobile Report KPIs: Span 1 on md (tablet), 2 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-2 h-full">
            <MobileSummaryCards selectedDate={selectedDate} />
          </div>

          {/* Daily KPI SMS summaries: Span 1 on md (tablet), 3 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-3 h-full">
            <SmsSummaryPanel selectedDate={selectedDate} />
          </div>

          {/* DMS Performance Tracker: Span 1 on md (tablet), 3 on lg/larger */}
          <div className="md:col-span-1 lg:col-span-3 h-full flex flex-col">
            <DMSPerformance selectedDate={selectedDate} />
          </div>
        </div>

        {/* Bottom Section: Analytics + DMs Performance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-9">
            <DashboardCharts selectedDate={selectedDate} />
          </div>

          <div className="lg:col-span-3 min-w-0 h-full">
            <TopDMsTable selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
