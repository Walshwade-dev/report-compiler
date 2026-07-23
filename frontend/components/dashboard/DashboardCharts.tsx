"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Scale, Gavel, CheckCircle2, TrendingUp, X, Maximize2 } from "lucide-react";
import { getAnalyticsDashboard } from "@/lib/api";

interface ComplianceDetail {
  calledIn: number;
  weighed: number;
  compliant: number;
}

interface StationType {
  name: string;
  code: string;
  traffic: { boundA: number; boundB: number };
  cases: { boundA: number; boundB: number };
  compliance: {
    boundA: ComplianceDetail;
    boundB: ComplianceDetail;
  };
}

interface HoveredBarType {
  label: string;
  value: number | string;
  title: string;
}

const initialStations: StationType[] = [
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

export function DashboardCharts({ selectedDate }: { selectedDate: string }) {
  const [activeTab, setActiveTab] = useState<"traffic" | "court" | "compliance">("traffic");
  const [hoveredBar, setHoveredBar] = useState<HoveredBarType | null>(null);
  const [stations, setStations] = useState<StationType[]>(initialStations);
  const [hasData, setHasData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: res, isError } = useQuery({
    queryKey: ["analyticsDashboard", selectedDate],
    queryFn: () => getAnalyticsDashboard({ staticDate: selectedDate }),
    enabled: !!selectedDate,
  });

  useEffect(() => {
    if (res && res.stations && res.stations.length > 0) {
      const hasAnyData = res.stations.some(
        (st: StationType) => st.traffic.boundA > 0 || st.traffic.boundB > 0
      );
      setHasData(hasAnyData);

      const activeStations = res.stations.filter(
        (st: StationType) => st.traffic.boundA > 0 || st.traffic.boundB > 0
      );
      setStations(activeStations.length > 0 ? activeStations : [res.stations.find((s: StationType) => s.code === "Juja") || res.stations[0]]);
    } else if (res || isError) {
      setStations([initialStations[0]]);
      setHasData(false);
    }
  }, [res, isError]);

  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

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

  // Render mini bars (for fixed height h-[480px] panel)
  const maxMiniChartHeight = 135;

  return (
    <>
      <div
        onClick={() => hasData && setIsModalOpen(true)}
        className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md h-[480px] flex flex-col cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.005] hover:bg-[#0b2135]/80 relative group"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cyan-950 pb-3 mb-4 gap-4 shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="text-cyan-400" size={16} />
              Analytics & Comparative Stats
            </h2>
            <p className="text-[10px] text-slate-400">
              Station overview for {selectedDate || "..."}
            </p>
          </div>

          {/* Tab Controls: stop propagation */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex rounded-lg bg-[#071827] p-1 border border-cyan-900/40 self-start sm:self-auto"
          >
            <button
              onClick={() => setActiveTab("traffic")}
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded transition-all ${
                activeTab === "traffic"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale size={11} />
              Traffic
            </button>
            <button
              onClick={() => setActiveTab("court")}
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded transition-all ${
                activeTab === "court"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Gavel size={11} />
              Cases
            </button>
            <button
              onClick={() => setActiveTab("compliance")}
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded transition-all ${
                activeTab === "compliance"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 size={11} />
              Compliance
            </button>
            <div className="text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-2 flex items-center">
              <Maximize2 size={13} />
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative flex-1 flex flex-col justify-center min-h-0">
          {activeTab === "traffic" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">
                  Traffic Comparison
                </span>
                <div className="flex gap-3 text-[9px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-2 rounded bg-cyan-400"></span> Bound A
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-2 rounded bg-indigo-500"></span> Bound B
                  </span>
                </div>
              </div>

              {/* Mini SVG Bar Chart */}
              <div className="relative w-full h-[180px] border-b border-l border-cyan-950 flex items-end justify-between px-4 pt-4 shrink-0">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                  {[0, 1, 2, 3].map((val) => (
                    <div key={val} className="w-full border-t border-cyan-950/20 text-[8px] text-slate-650 pt-0.5">
                      {hasData ? Math.round(maxTraffic - (val * maxTraffic) / 3) : 0}
                    </div>
                  ))}
                </div>

                {stations.map((st) => {
                  const boundAHeight = hasData ? (st.traffic.boundA / maxTraffic) * maxMiniChartHeight : 0;
                  const boundBHeight = hasData ? (st.traffic.boundB / maxTraffic) * maxMiniChartHeight : 0;

                  return (
                    <div key={st.code} className="flex flex-col items-center flex-1 group/bar z-10">
                       <div className="flex items-end gap-1 h-[135px] relative">
                        <div
                          onMouseEnter={() => setHoveredBar({ label: getTrafficLabel(st.code, "Bound A"), value: hasData ? st.traffic.boundA : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${boundAHeight}px` }}
                          className="w-3 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: getTrafficLabel(st.code, "Bound B"), value: hasData ? st.traffic.boundB : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${boundBHeight}px` }}
                          className="w-3 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                        />
                      </div>
                      <span className="mt-1.5 text-[9px] font-semibold text-slate-500 text-center truncate w-12">{st.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "court" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">
                  Court Cases Resolved
                </span>
                <div className="flex gap-3 text-[9px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-2 rounded bg-emerald-500"></span> Bound A
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="h-2 w-2 rounded bg-teal-500"></span> Bound B
                  </span>
                </div>
              </div>

              {/* Mini SVG Bar Chart for Court Cases */}
              <div className="relative w-full h-[180px] border-b border-l border-cyan-950 flex items-end justify-between px-4 pt-4 shrink-0">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                  {[0, 1, 2, 3].map((val) => (
                    <div key={val} className="w-full border-t border-cyan-950/20 text-[8px] text-slate-650 pt-0.5">
                      {hasData ? Math.round(maxCases - (val * maxCases) / 3) : 0}
                    </div>
                  ))}
                </div>

                {stations.map((st) => {
                  const boundACasesHeight = hasData ? (st.cases.boundA / maxCases) * maxMiniChartHeight : 0;
                  const boundBCasesHeight = hasData ? (st.cases.boundB / maxCases) * maxMiniChartHeight : 0;

                  return (
                    <div key={st.code} className="flex flex-col items-center flex-1 group/bar z-10">
                      <div className="flex items-end gap-1 h-[135px] relative">
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound A")} - Cases`, value: hasData ? st.cases.boundA : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${boundACasesHeight}px` }}
                          className="w-3 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-125 transition-all duration-300 cursor-pointer"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `${getTrafficLabel(st.code, "Bound B")} - Cases`, value: hasData ? st.cases.boundB : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${boundBCasesHeight}px` }}
                          className="w-3 rounded-t bg-gradient-to-t from-teal-700 to-teal-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                        />
                      </div>
                      <span className="mt-1.5 text-[9px] font-semibold text-slate-500 text-center truncate w-12">{st.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider">
                  Compliance rates
                </span>
                <div className="flex gap-2 text-[8px] text-slate-400">
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded bg-amber-500" /> A-Call</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded bg-cyan-500" /> A-Weigh</span>
                  <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded bg-emerald-400" /> A-Comp</span>
                </div>
              </div>

              {/* Mini SVG Bar Chart for Compliance */}
              <div className="relative w-full h-[180px] border-b border-l border-cyan-950 flex items-end justify-between px-4 pt-4 shrink-0">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                  {[0, 1, 2, 3].map((val) => (
                    <div key={val} className="w-full border-t border-cyan-950/20 text-[8px] text-slate-650 pt-0.5">
                      {hasData ? Math.round(maxCompliance - (val * maxCompliance) / 3) : 0}
                    </div>
                  ))}
                </div>

                {stations.map((st) => {
                  const aCalled = hasData ? (st.compliance.boundA.calledIn / maxCompliance) * maxMiniChartHeight : 0;
                  const aWeighed = hasData ? (st.compliance.boundA.weighed / maxCompliance) * maxMiniChartHeight : 0;
                  const aCompliant = hasData ? (st.compliance.boundA.compliant / maxCompliance) * maxMiniChartHeight : 0;
                  const aPercent = hasData && st.compliance.boundA.calledIn ? Math.round((st.compliance.boundA.compliant / st.compliance.boundA.calledIn) * 100) : 0;

                  const bCalled = hasData ? (st.compliance.boundB.calledIn / maxCompliance) * maxMiniChartHeight : 0;
                  const bWeighed = hasData ? (st.compliance.boundB.weighed / maxCompliance) * maxMiniChartHeight : 0;
                  const bCompliant = hasData ? (st.compliance.boundB.compliant / maxCompliance) * maxMiniChartHeight : 0;
                  const bPercent = hasData && st.compliance.boundB.calledIn ? Math.round((st.compliance.boundB.compliant / st.compliance.boundB.calledIn) * 100) : 0;

                  return (
                    <div key={st.code} className="flex flex-col items-center flex-1 group/bar z-10">
                      <div className="flex items-end gap-0.5 h-[135px] relative">
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound A Called`, value: hasData ? st.compliance.boundA.calledIn : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${aCalled}px` }}
                          className="w-1 rounded-t bg-amber-500"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound A Weighed`, value: hasData ? st.compliance.boundA.weighed : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${aWeighed}px` }}
                          className="w-1 rounded-t bg-cyan-500"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound A Compliant (${aPercent}%)`, value: hasData ? st.compliance.boundA.compliant : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${aCompliant}px` }}
                          className="w-1 rounded-t bg-emerald-400 mr-0.5"
                        />

                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound B Called`, value: hasData ? st.compliance.boundB.calledIn : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${bCalled}px` }}
                          className="w-1 rounded-t bg-amber-700"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound B Weighed`, value: hasData ? st.compliance.boundB.weighed : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${bWeighed}px` }}
                          className="w-1 rounded-t bg-cyan-700"
                        />
                        <div
                          onMouseEnter={() => setHoveredBar({ label: `Bound B Compliant (${bPercent}%)`, value: hasData ? st.compliance.boundB.compliant : 0, title: st.name })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${bCompliant}px` }}
                          className="w-1 rounded-t bg-emerald-600"
                        />
                      </div>
                      <span className="mt-1.5 text-[9px] font-semibold text-slate-500 text-center truncate w-12">{st.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hover Tooltip Overlay */}
          {hoveredBar && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#051421] border border-cyan-500/50 rounded-lg px-3 py-1.5 shadow-2xl z-20 pointer-events-none">
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                {hoveredBar.title}
              </p>
              <p className="text-xs font-extrabold text-white mt-0.5">
                {hoveredBar.label}: <span className="text-cyan-400">{hoveredBar.value}</span>
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer details */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-cyan-950 shrink-0"
        >
          <div className="flex items-center gap-2 bg-[#071827]/40 rounded-lg p-2 border border-cyan-950">
            <TrendingUp className="text-cyan-400 shrink-0" size={14} />
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Compliance</p>
              <p className="text-xs font-black text-white">{hasData ? `${overallComplianceRate}%` : "0%"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#071827]/40 rounded-lg p-2 border border-cyan-950">
            <Scale className="text-indigo-400 shrink-0" size={14} />
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Weighed</p>
              <p className="text-xs font-black text-white">{hasData ? totalWeighed.toLocaleString() : 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-900/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-cyan-400" size={22} />
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Comparative Analytics</h3>
                  <p className="text-xs text-slate-400">
                    High resolution comparative analytics and compliance statistics for {selectedDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 gap-8">
                {/* Traffic Chart */}
                <div className="bg-[#0b2135]/30 p-5 rounded-xl border border-cyan-900/40">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                        1. Weighbridge Traffic Comparison
                      </h4>
                      <p className="text-xs text-slate-400">Total bi-directional traffic per weighbridge station.</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-350">
                        <span className="h-3 w-3 rounded bg-cyan-400" /> Bound A
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-350">
                        <span className="h-3 w-3 rounded bg-indigo-500" /> Bound B
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full h-[240px] border-b border-l border-cyan-900/60 flex items-end justify-between px-8 pt-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                      {[0, 1, 2, 3].map((val) => (
                        <div key={val} className="w-full border-t border-cyan-900/10 text-[10px] text-slate-500 pt-0.5">
                          {hasData ? Math.round(maxTraffic - (val * maxTraffic) / 3) : 0} vehicles
                        </div>
                      ))}
                    </div>

                    {stations.map((st) => {
                      const boundAHeight = hasData ? (st.traffic.boundA / maxTraffic) * 180 : 0;
                      const boundBHeight = hasData ? (st.traffic.boundB / maxTraffic) * 180 : 0;

                      return (
                        <div key={st.code} className="flex flex-col items-center flex-1 z-10">
                          <div className="flex items-end gap-2 h-[180px]">
                            <div
                              style={{ height: `${boundAHeight}px` }}
                              className="w-5 rounded-t bg-gradient-to-t from-cyan-650 to-cyan-400 hover:brightness-125 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                              title={`${st.name} Bound A: ${st.traffic.boundA}`}
                            />
                            <div
                              style={{ height: `${boundBHeight}px` }}
                              className="w-5 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                              title={`${st.name} Bound B: ${st.traffic.boundB}`}
                            />
                          </div>
                          <span className="mt-2 text-xs font-bold text-slate-400">{st.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Court Cases Chart */}
                <div className="bg-[#0b2135]/30 p-5 rounded-xl border border-cyan-900/40">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                        2. Daily Court Cases Cleared
                      </h4>
                      <p className="text-xs text-slate-400">Total prosecution cases settled in court.</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-350">
                        <span className="h-3 w-3 rounded bg-emerald-550" /> Bound A
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-350">
                        <span className="h-3 w-3 rounded bg-teal-500" /> Bound B
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full h-[240px] border-b border-l border-cyan-900/60 flex items-end justify-between px-8 pt-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-4">
                      {[0, 1, 2, 3].map((val) => (
                        <div key={val} className="w-full border-t border-cyan-900/10 text-[10px] text-slate-500 pt-0.5">
                          {hasData ? Math.round(maxCases - (val * maxCases) / 3) : 0} cases
                        </div>
                      ))}
                    </div>

                    {stations.map((st) => {
                      const boundACasesHeight = hasData ? (st.cases.boundA / maxCases) * 180 : 0;
                      const boundBCasesHeight = hasData ? (st.cases.boundB / maxCases) * 180 : 0;

                      return (
                        <div key={st.code} className="flex flex-col items-center flex-1 z-10">
                          <div className="flex items-end gap-2 h-[180px]">
                            <div
                              style={{ height: `${boundACasesHeight}px` }}
                              className="w-5 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-450 hover:brightness-125 transition-all shadow-[0_0_10px_rgba(52,211,153,0.1)]"
                              title={`${st.name} Bound A Court Cases: ${st.cases.boundA}`}
                            />
                            <div
                              style={{ height: `${boundBCasesHeight}px` }}
                              className="w-5 rounded-t bg-gradient-to-t from-teal-700 to-teal-500 hover:brightness-125 transition-all shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                              title={`${st.name} Bound B Court Cases: ${st.cases.boundB}`}
                            />
                          </div>
                          <span className="mt-2 text-xs font-bold text-slate-400">{st.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compliance Rates Table/Stats */}
                <div className="bg-[#0b2135]/30 p-5 rounded-xl border border-cyan-900/40">
                  <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-4">
                    3. Detailed Compliance Statistics Table
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-cyan-950">
                    <table className="w-full text-left text-xs text-slate-350 border-collapse">
                      <thead className="bg-[#071827]/80 text-cyan-300 uppercase font-bold border-b border-cyan-900/50">
                        <tr>
                          <th className="p-3">Weighbridge</th>
                          <th className="p-3 text-right">A - Called In</th>
                          <th className="p-3 text-right">A - Weighed</th>
                          <th className="p-3 text-right">A - Compliant</th>
                          <th className="p-3 text-right">B - Called In</th>
                          <th className="p-3 text-right">B - Weighed</th>
                          <th className="p-3 text-right">B - Compliant</th>
                          <th className="p-3 text-right">Total Weighed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/20">
                        {stations.map((st) => (
                          <tr key={st.code} className="hover:bg-[#071827]/40 transition-colors">
                            <td className="p-3 font-semibold text-white">{st.name}</td>
                            <td className="p-3 text-right">{st.compliance.boundA.calledIn.toLocaleString()}</td>
                            <td className="p-3 text-right">{st.compliance.boundA.weighed.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-emerald-450">{st.compliance.boundA.compliant.toLocaleString()}</td>
                            <td className="p-3 text-right">{st.compliance.boundB.calledIn.toLocaleString()}</td>
                            <td className="p-3 text-right">{st.compliance.boundB.weighed.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-emerald-450">{st.compliance.boundB.compliant.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-cyan-400 bg-cyan-950/10">
                              {(st.compliance.boundA.weighed + st.compliance.boundB.weighed).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
