"use client";

import { useState, useEffect } from "react";
import ReportsLayout from "../reports/layout";
import { BarChart3, Scale, Gavel, CheckCircle2, TrendingUp, Award, MapPin } from "lucide-react";

// Mock data for Juja Weighbridge (Station specific) over days of the month
// Nairobi Bound and Thika Bound as requested for Juja
const jujaTrafficData = [
  { day: "05", thikaBound: 210, nairobiBound: 190 },
  { day: "10", thikaBound: 260, nairobiBound: 245 },
  { day: "15", thikaBound: 315, nairobiBound: 290 },
  { day: "20", thikaBound: 240, nairobiBound: 220 },
  { day: "25", thikaBound: 295, nairobiBound: 265 },
  { day: "30", thikaBound: 340, nairobiBound: 305 },
];

const jujaCourtCasesData = [
  { day: "05", thikaBound: 8, nairobiBound: 6 },
  { day: "10", thikaBound: 10, nairobiBound: 9 },
  { day: "15", thikaBound: 15, nairobiBound: 12 },
  { day: "20", thikaBound: 7, nairobiBound: 5 },
  { day: "25", thikaBound: 11, nairobiBound: 9 },
  { day: "30", thikaBound: 14, nairobiBound: 11 },
];

// Cross-station court cases comparison for allowed stations
const crossStationCases = [
  { name: "Juja Weighbridge", cases: 69, active: true },
  { name: "Kanyonyo", cases: 28, active: false },
  { name: "Athi River", cases: 94, active: false },
  { name: "Gilgil", cases: 81, active: false },
  { name: "Isinya", cases: 42, active: false },
  { name: "Suswa", cases: 18, active: false },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"traffic" | "court" | "cross">("traffic");
  const [hoveredBar, setHoveredBar] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasData(!!localStorage.getItem("active-report-id"));
    }
  }, []);

  const maxTraffic = 400;
  const maxCases = 20;
  const maxCrossCases = 100;

  const getFormattedDate = (day: string) => {
    return `${day}th June 2026`;
  };

  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* User context banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                <MapPin size={12} className="animate-pulse" /> Station-Locked Scope
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Juja Weighbridge Analytics Workspace
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Authorized station role scope: comparing bounds and compliance details for Juja.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-cyan-950/40 border border-cyan-900/60 p-3">
              <Award size={18} className="text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">Assigned Officer</p>
                <p className="text-[10px] text-slate-400">Station Role: Juja Operator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Station-specific KPIs */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-lg backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Juja Total Traffic</span>
            <p className="mt-3 text-3xl font-extrabold text-white">{hasData ? "3,170" : "0"}</p>
            <p className="mt-1 text-xs text-slate-500">{hasData ? "1,660 Thika / 1,510 Nairobi" : "No active session"}</p>
          </div>
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-lg backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Juja Total Court Cases</span>
            <p className="mt-3 text-3xl font-extrabold text-white">{hasData ? "69" : "0"}</p>
            <p className="mt-1 text-xs text-slate-500">{hasData ? "65 cleared in last 30 days" : "No active session"}</p>
          </div>
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-lg backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Rate</span>
            <p className="mt-3 text-3xl font-extrabold text-emerald-400">{hasData ? "83.6%" : "0%"}</p>
            <p className="mt-1 text-xs text-slate-500">{hasData ? "Average across both bounds" : "No active session"}</p>
          </div>
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-lg backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overloads Intercepted</span>
            <p className="mt-3 text-3xl font-extrabold text-rose-400">{hasData ? "188" : "0"}</p>
            <p className="mt-1 text-xs text-slate-500">{hasData ? "Without valid special permits" : "No active session"}</p>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cyan-950 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-cyan-400" size={20} />
                Juja Bi-directional Statistics & Court Scope
              </h2>
              <p className="text-xs text-slate-400">
                Detailed comparison of bounds and performance tracking for Juja Weighbridge.
              </p>
            </div>

            {/* Tab Controls */}
            <div className="flex rounded-lg bg-[#071827] p-1 border border-cyan-900/40">
              <button
                onClick={() => setActiveTab("traffic")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === "traffic"
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scale size={14} />
                Juja Bounds Traffic
              </button>
              <button
                onClick={() => setActiveTab("court")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === "court"
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Gavel size={14} />
                Juja Bounds Court Cases
              </button>
              <button
                onClick={() => setActiveTab("cross")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === "cross"
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp size={14} />
                Cross-Station Comparison
              </button>
            </div>
          </div>

          <div className="relative min-h-[300px]">
            {activeTab === "traffic" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                      Weighbridge Bounds Traffic Comparison
                    </h3>
                    <p className="text-xs text-slate-500">Bi-directional split over days of the month.</p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-3 w-3 rounded bg-cyan-400"></span> Thika Bound
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-3 w-3 rounded bg-indigo-500"></span> Nairobi Bound
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-between px-6 pt-4">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                    {[0, 1, 2, 3].map((val) => (
                      <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                        {hasData ? Math.round(maxTraffic - (val * maxTraffic) / 3) : 0} vehicles
                      </div>
                    ))}
                  </div>

                  {jujaTrafficData.map((d) => {
                    const thikaHeight = hasData ? (d.thikaBound / maxTraffic) * 160 : 0;
                    const nairobiHeight = hasData ? (d.nairobiBound / maxTraffic) * 160 : 0;

                    return (
                      <div key={d.day} className="flex flex-col items-center flex-1 group z-10">
                        <div className="flex items-end gap-1.5 h-[160px]">
                          <div
                            onMouseEnter={() => setHoveredBar({ label: "Thika Bound", value: hasData ? d.thikaBound : 0, title: "Juja Weighbridge", date: getFormattedDate(d.day) })}
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ height: `${thikaHeight}px` }}
                            className="w-5 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                          />
                          <div
                            onMouseEnter={() => setHoveredBar({ label: "Nairobi Bound", value: hasData ? d.nairobiBound : 0, title: "Juja Weighbridge", date: getFormattedDate(d.day) })}
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ height: `${nairobiHeight}px` }}
                            className="w-5 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                          />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-slate-400">Day {d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "court" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                      Court Cases: Bi-directional Bounds Comparison
                    </h3>
                    <p className="text-xs text-slate-500">Cleared court cases split by bound over days of the month.</p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-3 w-3 rounded bg-cyan-400"></span> Thika Bound Cases
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-3 w-3 rounded bg-indigo-500"></span> Nairobi Bound Cases
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-between px-6 pt-4">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                    {[0, 1, 2, 3].map((val) => (
                      <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                        {hasData ? Math.round(maxCases - (val * maxCases) / 3) : 0} cases
                      </div>
                    ))}
                  </div>

                  {jujaCourtCasesData.map((d) => {
                    const thikaHeight = hasData ? (d.thikaBound / maxCases) * 160 : 0;
                    const nairobiHeight = hasData ? (d.nairobiBound / maxCases) * 160 : 0;

                    return (
                      <div key={d.day} className="flex flex-col items-center flex-1 group z-10">
                        <div className="flex items-end gap-1.5 h-[160px]">
                          <div
                            onMouseEnter={() => setHoveredBar({ label: "Thika Bound Cases", value: hasData ? d.thikaBound : 0, title: "Juja Weighbridge", date: getFormattedDate(d.day) })}
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ height: `${thikaHeight}px` }}
                            className="w-5 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer"
                          />
                          <div
                            onMouseEnter={() => setHoveredBar({ label: "Nairobi Bound Cases", value: hasData ? d.nairobiBound : 0, title: "Juja Weighbridge", date: getFormattedDate(d.day) })}
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ height: `${nairobiHeight}px` }}
                            className="w-5 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                          />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-slate-400">Day {d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "cross" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                      Cross-Station Court Cases Cleared Comparison
                    </h3>
                    <p className="text-xs text-slate-500">Comparison across allowed stations whose data is available (Juja highlighted).</p>
                  </div>
                </div>

                <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-around px-8 pt-4">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                    {[0, 1, 2, 3].map((val) => (
                      <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                        {hasData ? Math.round(maxCrossCases - (val * maxCrossCases) / 3) : 0} cases
                      </div>
                    ))}
                  </div>

                  {crossStationCases.map((st) => {
                    const barHeight = hasData ? (st.cases / maxCrossCases) * 160 : 0;

                    return (
                      <div key={st.name} className="flex flex-col items-center group z-10">
                        <div className="flex items-end h-[160px]">
                          <div
                            onMouseEnter={() => setHoveredBar({ label: "Cases Cleared", value: hasData ? st.cases : 0, title: st.name, date: "June 2026" })}
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ height: `${barHeight}px` }}
                            className={`w-10 rounded-t transition-all duration-300 cursor-pointer ${
                              st.active
                                ? "bg-gradient-to-t from-cyan-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] brightness-110 border border-cyan-300/40"
                                : "bg-gradient-to-t from-slate-700 to-slate-500 hover:brightness-110"
                            }`}
                          />
                        </div>
                        <span className={`mt-2 text-[10px] font-semibold text-center truncate w-16 ${st.active ? "text-cyan-300 font-bold" : "text-slate-400"}`}>
                          {st.name.replace(" Weighbridge", "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hoveredBar && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#051421] border border-cyan-500/50 rounded-lg px-4 py-2 shadow-2xl z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {hoveredBar.title} {hoveredBar.date ? `• ${hoveredBar.date}` : ""}
                </p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {hoveredBar.label}: <span className="text-cyan-400">{hoveredBar.value}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ReportsLayout>
  );
}
