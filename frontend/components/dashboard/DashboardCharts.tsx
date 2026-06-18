"use client";

import { useState, useEffect } from "react";
import { BarChart3, Scale, Gavel, CheckCircle2, TrendingUp } from "lucide-react";
import { getSummaryCards } from "@/lib/api";

const initialStations = [
  {
    name: "Juja Weighbridge",
    code: "Juja",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
  {
    name: "Kanyonyo",
    code: "Kanyonyo",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
  {
    name: "Athi River",
    code: "Athi River",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
  {
    name: "Gilgil",
    code: "Gilgil",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
  {
    name: "Isinya",
    code: "Isinya",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
  {
    name: "Suswa",
    code: "Suswa",
    traffic: { boundA: 0, boundB: 0 },
    cases: { boundA: 0, boundB: 0 },
    compliance: {
      boundA: { calledIn: 0, weighed: 0, compliant: 0 },
      boundB: { calledIn: 0, weighed: 0, compliant: 0 }
    }
  },
];

export function DashboardCharts() {
  const [activeTab, setActiveTab] = useState<"traffic" | "court" | "compliance">("traffic");
  const [hoveredBar, setHoveredBar] = useState<any>(null);
  const [stations, setStations] = useState(initialStations);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeReportId = localStorage.getItem("active-report-id");
    if (!activeReportId) {
      setStations(initialStations);
      setHasData(false);
      return;
    }

    let active = true;
    async function fetchData() {
      try {
        const res = await getSummaryCards(activeReportId as string);
        if (!active) return;

        const hasUploadData = (res.x_total || 0) > 0 || (res.y_total || 0) > 0;
        if (!hasUploadData) {
          setStations(initialStations);
          setHasData(false);
          return;
        }

        setHasData(true);

        const updated = initialStations.map((st) => {
          const stationMatches = (res.station && st.name.toLowerCase().includes(res.station.toLowerCase())) || 
                                 (res.weighbridge_name && st.name.toLowerCase().includes(res.weighbridge_name.toLowerCase())) ||
                                 (res.station && res.station.toLowerCase().includes(st.code.toLowerCase())) ||
                                 (res.weighbridge_name && res.weighbridge_name.toLowerCase().includes(st.code.toLowerCase()));

          if (stationMatches) {
            const boundVal = res.bound || "";
            let isBoundA = false;
            let isBoundB = false;

            if (st.code === "Juja") {
              if (boundVal.toLowerCase().includes("thika") || boundVal.toLowerCase().includes("bound a") || boundVal.toLowerCase().includes("incoming")) {
                isBoundA = true;
              } else if (boundVal.toLowerCase().includes("nairobi") || boundVal.toLowerCase().includes("bound b") || boundVal.toLowerCase().includes("outgoing")) {
                isBoundB = true;
              } else {
                isBoundA = true;
              }
            } else {
              if (boundVal.toLowerCase().includes("bound a") || boundVal.toLowerCase().includes("a") || boundVal.toLowerCase().includes("incoming")) {
                isBoundA = true;
              } else if (boundVal.toLowerCase().includes("bound b") || boundVal.toLowerCase().includes("b") || boundVal.toLowerCase().includes("outgoing")) {
                isBoundB = true;
              } else {
                isBoundA = true;
              }
            }

            const traffic = { boundA: 0, boundB: 0 };
            const cases = { boundA: 0, boundB: 0 };
            const compliance = {
              boundA: { calledIn: 0, weighed: 0, compliant: 0 },
              boundB: { calledIn: 0, weighed: 0, compliant: 0 }
            };

            const calledVal = res.c_total || 0;
            const weighedVal = res.x_total || 0;
            const compliantVal = Math.max((res.c_total || 0) - Math.max((res.y_total || 0) - (res.g_total || 0), 0), 0);

            if (isBoundA) {
              traffic.boundA = weighedVal;
              cases.boundA = res.cases_cleared || 0;
              compliance.boundA = {
                calledIn: calledVal,
                weighed: weighedVal,
                compliant: compliantVal,
              };
            }
            if (isBoundB) {
              traffic.boundB = weighedVal;
              cases.boundB = res.cases_cleared || 0;
              compliance.boundB = {
                calledIn: calledVal,
                weighed: weighedVal,
                compliant: compliantVal,
              };
            }

            return {
              ...st,
              traffic,
              cases,
              compliance,
            };
          }

          return st;
        });

        setStations(updated);
      } catch (err) {
        console.error("Failed to fetch dashboard charts data", err);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const maxTraffic = Math.max(...stations.map(s => Math.max(s.traffic.boundA, s.traffic.boundB)), 700);
  const maxCases = Math.max(...stations.map(s => Math.max(s.cases.boundA, s.cases.boundB)), 25);
  const maxCompliance = Math.max(
    ...stations.map(s => Math.max(
      s.compliance.boundA.calledIn,
      s.compliance.boundA.weighed,
      s.compliance.boundA.compliant,
      s.compliance.boundB.calledIn,
      s.compliance.boundB.weighed,
      s.compliance.boundB.compliant
    )),
    200
  );

  // Format hover label to resolve Nairobi/Thika bound names for Juja Weighbridge
  const getTrafficLabel = (stationCode: string, boundKey: "Bound A" | "Bound B") => {
    if (stationCode === "Juja") {
      return boundKey === "Bound A" ? "Thika Bound" : "Nairobi Bound";
    }
    return boundKey;
  };

  const activeStation = stations.find(s => s.compliance.boundA.weighed > 0 || s.compliance.boundB.weighed > 0);
  
  const totalCalled = activeStation ? (activeStation.compliance.boundA.calledIn + activeStation.compliance.boundB.calledIn) : 0;
  const totalCompliant = activeStation ? (activeStation.compliance.boundA.compliant + activeStation.compliance.boundB.compliant) : 0;
  const overallComplianceRate = totalCalled ? Math.round((totalCompliant / totalCalled) * 1000) / 10 : 0;
  const totalWeighed = activeStation ? (activeStation.compliance.boundA.weighed + activeStation.compliance.boundB.weighed) : 0;

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cyan-950 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            Analytics & Comparative Statistics
          </h2>
          <p className="text-xs text-slate-400">
            Station overview comparing active weighbridges across designated parameters.
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
            Weighbridge Traffic
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
            Daily Court Cases
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "compliance"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 size={14} />
            Compliance Rates
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative min-h-[300px]">
        {activeTab === "traffic" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                  Traffic Comparison by Weighbridge
                </h3>
                <p className="text-xs text-slate-500">Comparing bi-directional traffic (Bound A vs Bound B) per station.</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-3 w-3 rounded bg-cyan-400"></span> Bound A
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-3 w-3 rounded bg-indigo-500"></span> Bound B
                </span>
              </div>
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-between px-6 pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                {[0, 1, 2, 3].map((val) => (
                  <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                    {hasData ? Math.round(maxTraffic - (val * maxTraffic) / 3) : 0} vehicles
                  </div>
                ))}
              </div>

              {stations.map((st) => {
                const boundAHeight = hasData ? (st.traffic.boundA / maxTraffic) * 160 : 0;
                const boundBHeight = hasData ? (st.traffic.boundB / maxTraffic) * 160 : 0;

                return (
                  <div key={st.code} className="flex flex-col items-center flex-1 group z-10">
                     <div className="flex items-end gap-1.5 h-[160px] relative">
                      <div
                        onMouseEnter={() => setHoveredBar({ label: getTrafficLabel(st.code, "Bound A"), value: hasData ? st.traffic.boundA : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${boundAHeight}px` }}
                        className="w-4 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: getTrafficLabel(st.code, "Bound B"), value: hasData ? st.traffic.boundB : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${boundBHeight}px` }}
                        className="w-4 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      />
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-slate-400 text-center truncate w-16">{st.code}</span>
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
                  Daily Court Cases Cleared
                </h3>
                <p className="text-xs text-slate-500">Overload prosecution cases resolved in court today.</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-3 w-3 rounded bg-emerald-500"></span> Bound A
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-3 w-3 rounded bg-teal-500"></span> Bound B
                </span>
              </div>
            </div>

            {/* Interactive SVG Bar Chart for Court Cases */}
            <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-between px-6 pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                {[0, 1, 2, 3].map((val) => (
                  <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                    {hasData ? Math.round(maxCases - (val * maxCases) / 3) : 0} cases
                  </div>
                ))}
              </div>

              {stations.map((st) => {
                const boundACasesHeight = hasData ? (st.cases.boundA / maxCases) * 160 : 0;
                const boundBCasesHeight = hasData ? (st.cases.boundB / maxCases) * 160 : 0;

                return (
                  <div key={st.code} className="flex flex-col items-center flex-1 group z-10">
                    <div className="flex items-end gap-1.5 h-[160px] relative">
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound A")} - Cases Cleared`, value: hasData ? st.cases.boundA : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${boundACasesHeight}px` }}
                        className="w-4 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound B")} - Cases Cleared`, value: hasData ? st.cases.boundB : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${boundBCasesHeight}px` }}
                        className="w-4 rounded-t bg-gradient-to-t from-teal-700 to-teal-500 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                      />
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-slate-400 text-center truncate w-16">{st.code}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                  Compliance Rates per Station
                </h3>
                <p className="text-xs text-slate-500">Comparison of called-in, weighed, and compliant vehicles.</p>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] sm:text-xs">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-amber-500"></span> Bound A Called In
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-cyan-500"></span> Bound A Weighed
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-400"></span> Bound A Compliant
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-amber-700"></span> Bound B Called In
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-cyan-700"></span> Bound B Weighed
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-600"></span> Bound B Compliant
                </span>
              </div>
            </div>

            {/* Interactive SVG Bar Chart for Compliance */}
            <div className="relative w-full h-[220px] border-b border-l border-cyan-950 flex items-end justify-between px-6 pt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                {[0, 1, 2, 3].map((val) => (
                  <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5">
                    {hasData ? Math.round(maxCompliance - (val * maxCompliance) / 3) : 0} vehicles
                  </div>
                ))}
              </div>

              {stations.map((st) => {
                const aCalled = hasData ? (st.compliance.boundA.calledIn / maxCompliance) * 160 : 0;
                const aWeighed = hasData ? (st.compliance.boundA.weighed / maxCompliance) * 160 : 0;
                const aCompliant = hasData ? (st.compliance.boundA.compliant / maxCompliance) * 160 : 0;
                const aPercent = hasData && st.compliance.boundA.calledIn ? Math.round((st.compliance.boundA.compliant / st.compliance.boundA.calledIn) * 100) : 0;

                const bCalled = hasData ? (st.compliance.boundB.calledIn / maxCompliance) * 160 : 0;
                const bWeighed = hasData ? (st.compliance.boundB.weighed / maxCompliance) * 160 : 0;
                const bCompliant = hasData ? (st.compliance.boundB.compliant / maxCompliance) * 160 : 0;
                const bPercent = hasData && st.compliance.boundB.calledIn ? Math.round((st.compliance.boundB.compliant / st.compliance.boundB.calledIn) * 100) : 0;

                return (
                  <div key={st.code} className="flex flex-col items-center flex-1 group z-10">
                    <div className="flex items-end gap-0.5 h-[160px] relative">
                      {/* Bound A Set */}
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound A")} Called In`, value: hasData ? st.compliance.boundA.calledIn : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${aCalled}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-amber-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound A")} Weighed`, value: hasData ? st.compliance.boundA.weighed : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${aWeighed}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-cyan-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound A")} Compliant`, value: hasData ? `${st.compliance.boundA.compliant} (${aPercent}% compliance)` : "0 (0% compliance)", title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${aCompliant}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-emerald-400 hover:brightness-125 transition-all duration-300 cursor-pointer mr-1"
                      />

                      {/* Bound B Set */}
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound B")} Called In`, value: hasData ? st.compliance.boundB.calledIn : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${bCalled}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-amber-700 hover:brightness-125 transition-all duration-300 cursor-pointer"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound B")} Weighed`, value: hasData ? st.compliance.boundB.weighed : 0, title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${bWeighed}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-cyan-700 hover:brightness-125 transition-all duration-300 cursor-pointer"
                      />
                      <div
                        onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound B")} Compliant`, value: hasData ? `${st.compliance.boundB.compliant} (${bPercent}% compliance)` : "0 (0% compliance)", title: st.name })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ height: `${bCompliant}px` }}
                        className="w-1.5 sm:w-2 rounded-t bg-emerald-600 hover:brightness-125 transition-all duration-300 cursor-pointer"
                      />
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-slate-400 text-center truncate w-16">{st.code}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredBar && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#051421] border border-cyan-500/50 rounded-lg px-4 py-2 shadow-2xl z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {hoveredBar.title}
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {hoveredBar.label}: <span className="text-cyan-400">{hoveredBar.value}</span>
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-cyan-950">
        <div className="flex items-center gap-3 bg-[#071827]/40 rounded-xl p-3 border border-cyan-950">
          <TrendingUp className="text-cyan-400 shrink-0" size={18} />
          <div>
            <p className="text-xs text-slate-400">Overall Compliance Rate</p>
            <p className="text-base font-extrabold text-white">{hasData ? `${overallComplianceRate}%` : "0%"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#071827]/40 rounded-xl p-3 border border-cyan-950">
          <Scale className="text-indigo-400 shrink-0" size={18} />
          <div>
            <p className="text-xs text-slate-400">Total Weighed</p>
            <p className="text-base font-extrabold text-white">{hasData ? totalWeighed : 0} Vehicles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
