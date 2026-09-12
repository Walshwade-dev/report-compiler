"use client";

import { useState, useEffect } from "react";
import ReportsLayout from "../reports/layout";
import {
  BarChart3,
  Scale,
  Gavel,
  TrendingUp,
  Calendar,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Package,
  Layers,
  ArrowRight,
  Info,
  ChevronDown,
  Activity,
  Flame,
  GitCompare,
} from "lucide-react";
import {
  getAnalyticsDetails,
  getLoggedInUser,
  AvailableMonthItem,
  RouteChargingStat,
  CrossWeighedVehicle,
  CargoOverloadStat,
} from "@/lib/api";

interface HoveredBarType {
  label: string;
  value: number;
  title: string;
  date: string;
}

export default function AnalyticsPage() {
  const [hoveredBar, setHoveredBar] = useState<HoveredBarType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stationName, setStationName] = useState("Station");
  const [boundALabel, setBoundALabel] = useState("Bound A");
  const [boundBLabel, setBoundBLabel] = useState("Bound B");
  const [user, setUser] = useState<any>(null);

  // Month & Year filtering
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<AvailableMonthItem[]>([]);

  // Sub-view toggles for section graphs if desired
  const [staticGraphMode, setStaticGraphMode] = useState<"side_by_side" | "traffic_only" | "court_only">("side_by_side");

  // Cargo comparison mode and top commodities limit
  const [cargoCompareMetric, setCargoCompareMetric] = useState<"dual" | "cases" | "tonnes" | "avg">("dual");
  const [cargoTopLimit, setCargoTopLimit] = useState<number>(7);

  // Analytics data
  const [kpis, setKpis] = useState({
    totalTraffic: 0,
    thikaTraffic: 0,
    nairobiTraffic: 0,
    boundATraffic: 0,
    boundBTraffic: 0,
    totalCourtCases: 0,
    thikaCourtCases: 0,
    nairobiCourtCases: 0,
    boundACourtCases: 0,
    boundBCourtCases: 0,
    complianceRate: 0,
    overloadsIntercepted: 0,
    totalMobileWeighed: 0,
    totalMobileCharged: 0,
    totalMobileWarned: 0,
    totalMobileLegal: 0,
    mobileChargeRate: 0,
  });

  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [courtCasesData, setCourtCasesData] = useState<any[]>([]);
  const [crossStationData, setCrossStationData] = useState<any[]>([]);
  const [routesProneToCharging, setRoutesProneToCharging] = useState<RouteChargingStat[]>([]);
  const [crossWeighedVehicles, setCrossWeighedVehicles] = useState<CrossWeighedVehicle[]>([]);
  const [cargoOverloadStats, setCargoOverloadStats] = useState<CargoOverloadStat[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setIsLoading(true);
        const loggedUser = getLoggedInUser();
        setUser(loggedUser);
        const userStation = loggedUser?.station || null;

        const res = await getAnalyticsDetails({
          station: userStation || undefined,
          month: selectedMonth || undefined,
        });

        if (!active) return;

        if (res) {
          if (res.stationName) setStationName(res.stationName);
          if (res.boundALabel) setBoundALabel(res.boundALabel);
          if (res.boundBLabel) setBoundBLabel(res.boundBLabel);
          if (res.selectedMonth) setSelectedMonth(res.selectedMonth);
          if (res.selectedMonthLabel) setSelectedMonthLabel(res.selectedMonthLabel);
          if (res.availableMonths) setAvailableMonths(res.availableMonths);

          if (res.kpis) {
            setKpis(res.kpis);
            setTrafficData(res.trafficData || []);
            setCourtCasesData(res.courtCasesData || []);
            setCrossStationData(res.crossStationData || []);
            setRoutesProneToCharging(res.routesProneToCharging || []);
            setCrossWeighedVehicles(res.crossWeighedVehicles || []);
            setCargoOverloadStats(res.cargoOverloadStats || []);

            setHasData(
              (res.kpis.totalTraffic || 0) > 0 ||
              (res.kpis.totalCourtCases || 0) > 0 ||
              (res.kpis.totalMobileWeighed || 0) > 0
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch analytics details:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const maxTraffic = Math.max(
    ...trafficData.map((d) => Math.max(Number(d?.thikaBound) || 0, Number(d?.nairobiBound) || 0)),
    100
  );
  const maxCases = Math.max(
    ...courtCasesData.map((d) => Math.max(Number(d?.thikaBound) || 0, Number(d?.nairobiBound) || 0)),
    10
  );
  const maxCrossCases = Math.max(
    ...crossStationData.map((st) => Number(st?.cases) || 0),
    50
  );

  const maxRouteCharges = Math.max(
    ...routesProneToCharging.map((r) => r.chargedCount),
    5
  );

  const maxCargoIncidents = Math.max(
    ...cargoOverloadStats.map((c) => c.incidentCount),
    10
  );

  // Top commodities data & dynamic clean ceiling scaling
  const topCargoList = cargoOverloadStats.slice(0, cargoTopLimit);
  const rawMaxCargoCases = Math.max(...topCargoList.map((c) => c.incidentCount), 10);
  const rawMaxCargoTonnes = Math.max(...topCargoList.map((c) => Math.round(c.totalExcessKg / 1000)), 5);
  const rawMaxCargoAvg = Math.max(...topCargoList.map((c) => c.averageExcessKg), 500);

  const cleanCeilingCases = (() => {
    const val = rawMaxCargoCases;
    if (val <= 10) return 10;
    if (val <= 20) return 20;
    if (val <= 50) return 50;
    if (val <= 100) return 100;
    if (val <= 200) return 200;
    if (val <= 300) return 300;
    if (val <= 500) return 500;
    const mag = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / (mag / 2)) * (mag / 2);
  })();

  const cleanCeilingTonnes = (() => {
    const val = rawMaxCargoTonnes;
    if (val <= 5) return 5;
    if (val <= 10) return 10;
    if (val <= 20) return 20;
    if (val <= 50) return 50;
    if (val <= 100) return 100;
    if (val <= 150) return 150;
    if (val <= 200) return 200;
    if (val <= 300) return 300;
    const mag = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / (mag / 2)) * (mag / 2);
  })();

  const cleanCeilingAvg = (() => {
    const val = rawMaxCargoAvg;
    if (val <= 500) return 500;
    if (val <= 1000) return 1000;
    if (val <= 2000) return 2000;
    if (val <= 3000) return 3000;
    if (val <= 5000) return 5000;
    const mag = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / (mag / 2)) * (mag / 2);
  })();

  const getFormattedDate = (day: string) => `Day ${day}`;
  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const isViewingCurrentMonth = selectedMonth === currentMonthValue;

  return (
    <ReportsLayout>
      <div className="space-y-8">
        {/* Page Header with Month Selector */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {stationName} Analytics Workspace
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Data scoped strictly from day 1 to end of{" "}
                <strong className="text-cyan-300">{selectedMonthLabel || "the month"}</strong>.
                Separated into Static Weighbridge Analytics, Mobile Operations, and Comparative Analysis.
              </p>
            </div>

            {/* Month & Year Filter Selector Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-[#061928]/80 border border-cyan-500/30 rounded-xl p-2.5 shadow-lg">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-cyan-400 ml-1 shrink-0" />
                <label htmlFor="month-selector" className="text-xs font-bold uppercase tracking-wider text-slate-300 shrink-0">
                  Select Month:
                </label>
              </div>

              <div className="relative">
                <select
                  id="month-selector"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={isLoading}
                  className="w-full sm:w-auto appearance-none rounded-lg border border-cyan-500/40 bg-[#0b2135] py-1.5 pl-3 pr-8 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer disabled:opacity-50"
                >
                  {availableMonths.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#0b2135] text-white">
                      {m.label}
                    </option>
                  ))}
                  {availableMonths.length === 0 && (
                    <option value={selectedMonth}>{selectedMonthLabel || "Current Month"}</option>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-cyan-400 pointer-events-none" />
              </div>

              {!isViewingCurrentMonth && availableMonths.some((m) => m.value === currentMonthValue) && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(currentMonthValue)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition"
                >
                  Current Month
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: STATIC WEIGHBRIDGE ANALYTICS */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          {/* Section 1 Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/50 p-2 text-cyan-400">
                <Scale size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-white">
                  1. Static Weighbridge Analytics
                </h2>
                <p className="text-xs text-slate-400">
                  Station-level traffic volumes, bi-directional bound distributions, court prosecutions, and compliance rates for {selectedMonthLabel}.
                </p>
              </div>
            </div>

            {/* Static Graph View Switcher */}
            <div className="flex rounded-lg bg-[#071827] p-1 border border-cyan-900/40 text-[11px] font-bold self-start sm:self-auto">
              <button
                onClick={() => setStaticGraphMode("side_by_side")}
                className={`px-2.5 py-1 rounded transition ${
                  staticGraphMode === "side_by_side" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setStaticGraphMode("traffic_only")}
                className={`px-2.5 py-1 rounded transition ${
                  staticGraphMode === "traffic_only" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Traffic Only
              </button>
              <button
                onClick={() => setStaticGraphMode("court_only")}
                className={`px-2.5 py-1 rounded transition ${
                  staticGraphMode === "court_only" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Court Cases Only
              </button>
            </div>
          </div>

          {/* Static KPI Tiles (4 Tiles) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-cyan-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-cyan-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Weighed Traffic</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-cyan-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-white">{kpis.totalTraffic.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400 truncate">
                {kpis.thikaTraffic.toLocaleString()} {boundALabel.replace(/bound/i, "").trim()} / {kpis.nairobiTraffic.toLocaleString()} {boundBLabel.replace(/bound/i, "").trim()}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-indigo-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Court Cases Cleared</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-cyan-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-indigo-300">{kpis.totalCourtCases.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                {kpis.thikaCourtCases} {boundALabel.replace(/bound/i, "").trim()} / {kpis.nairobiCourtCases} {boundBLabel.replace(/bound/i, "").trim()}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Station Compliance Rate</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-cyan-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-emerald-400">{kpis.complianceRate}%</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Average across operational bounds</p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-rose-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overloads Intercepted</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-cyan-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-rose-400">{kpis.overloadsIntercepted.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Without valid special exemption permit</p>
            </div>
          </div>

          {/* Static Graphs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Graph 1: Bounds Traffic */}
            {(staticGraphMode === "side_by_side" || staticGraphMode === "traffic_only") && (
              <div className={`rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md ${staticGraphMode === "traffic_only" ? "lg:col-span-2" : ""}`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                      <BarChart3 size={14} className="text-cyan-400" />
                      Weighbridge Bounds Traffic Comparison
                    </h3>
                    <p className="text-[11px] text-slate-400">Bi-directional vehicle volume across active days</p>
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <span className="h-2.5 w-2.5 rounded bg-cyan-400"></span> {boundALabel.replace(/bound/i, "").trim()}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <span className="h-2.5 w-2.5 rounded bg-indigo-500"></span> {boundBLabel.replace(/bound/i, "").trim()}
                    </span>
                  </div>
                </div>

                {trafficData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-cyan-900/30 rounded-lg">
                    No traffic records for {selectedMonthLabel}
                  </div>
                ) : (
                  <div className="relative w-full h-[200px] border-b border-l border-cyan-950 flex items-end justify-between px-4 pt-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-3">
                      {[0, 1, 2, 3].map((val) => (
                        <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5 font-mono">
                          {maxTraffic > 0 ? Math.round(maxTraffic - (val * maxTraffic) / 3) : 0} v
                        </div>
                      ))}
                    </div>

                    {trafficData.map((d) => {
                      const thikaVal = Number(d?.thikaBound) || 0;
                      const nairobiVal = Number(d?.nairobiBound) || 0;
                      const thikaHeight = maxTraffic > 0 ? (thikaVal / maxTraffic) * 150 : 0;
                      const nairobiHeight = maxTraffic > 0 ? (nairobiVal / maxTraffic) * 150 : 0;

                      return (
                        <div key={d.day} className="flex flex-col items-center flex-1 group z-10">
                          <div className="flex items-end gap-1 h-[150px]">
                            <div
                              onMouseEnter={() => setHoveredBar({ label: boundALabel, value: thikaVal, title: stationName, date: getFormattedDate(d.day) })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${thikaHeight}px` }}
                              className="w-4 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                            />
                            <div
                              onMouseEnter={() => setHoveredBar({ label: boundBLabel, value: nairobiVal, title: stationName, date: getFormattedDate(d.day) })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${nairobiHeight}px` }}
                              className="w-4 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                            />
                          </div>
                          <span className="mt-1 text-[10px] font-semibold text-slate-400">D{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Graph 2: Bounds Court Cases */}
            {(staticGraphMode === "side_by_side" || staticGraphMode === "court_only") && (
              <div className={`rounded-xl border border-indigo-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md ${staticGraphMode === "court_only" ? "lg:col-span-2" : ""}`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                      <Gavel size={14} className="text-indigo-400" />
                      Bounds Court Cases Cleared
                    </h3>
                    <p className="text-[11px] text-slate-400">Prosecuted court cases resolved per bound</p>
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <span className="h-2.5 w-2.5 rounded bg-cyan-400"></span> {boundALabel.replace(/bound/i, "").trim()}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <span className="h-2.5 w-2.5 rounded bg-indigo-500"></span> {boundBLabel.replace(/bound/i, "").trim()}
                    </span>
                  </div>
                </div>

                {courtCasesData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-indigo-900/30 rounded-lg">
                    No court records for {selectedMonthLabel}
                  </div>
                ) : (
                  <div className="relative w-full h-[200px] border-b border-l border-cyan-950 flex items-end justify-between px-4 pt-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-3">
                      {[0, 1, 2, 3].map((val) => (
                        <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5 font-mono">
                          {maxCases > 0 ? Math.round(maxCases - (val * maxCases) / 3) : 0} c
                        </div>
                      ))}
                    </div>

                    {courtCasesData.map((d) => {
                      const thikaVal = Number(d?.thikaBound) || 0;
                      const nairobiVal = Number(d?.nairobiBound) || 0;
                      const thikaHeight = maxCases > 0 ? (thikaVal / maxCases) * 150 : 0;
                      const nairobiHeight = maxCases > 0 ? (nairobiVal / maxCases) * 150 : 0;

                      return (
                        <div key={d.day} className="flex flex-col items-center flex-1 group z-10">
                          <div className="flex items-end gap-1 h-[150px]">
                            <div
                              onMouseEnter={() => setHoveredBar({ label: `${boundALabel} Cases`, value: thikaVal, title: stationName, date: getFormattedDate(d.day) })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${thikaHeight}px` }}
                              className="w-4 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-125 transition-all duration-300 cursor-pointer"
                            />
                            <div
                              onMouseEnter={() => setHoveredBar({ label: `${boundBLabel} Cases`, value: nairobiVal, title: stationName, date: getFormattedDate(d.day) })}
                              onMouseLeave={() => setHoveredBar(null)}
                              style={{ height: `${nairobiHeight}px` }}
                              className="w-4 rounded-t bg-gradient-to-t from-indigo-700 to-indigo-500 hover:brightness-125 transition-all duration-300 cursor-pointer"
                            />
                          </div>
                          <span className="mt-1 text-[10px] font-semibold text-slate-400">D{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Graph 3: Cross-Station Court Comparison */}
          {crossStationData.length > 0 && (
            <div className="rounded-xl border border-cyan-900/40 bg-[#0b2135]/40 p-4 shadow-lg backdrop-blur-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-cyan-400" />
                  Cross-Station Court Comparison ({selectedMonthLabel})
                </h3>
                <span className="text-[10px] text-slate-400">{stationName} highlighted in Cyan</span>
              </div>

              <div className="relative w-full h-[150px] border-b border-l border-cyan-950 flex items-end justify-around px-6 pt-3">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 pt-2">
                  {[0, 1, 2].map((val) => (
                    <div key={val} className="w-full border-t border-cyan-950/40 text-[9px] text-slate-600 pt-0.5 font-mono">
                      {maxCrossCases > 0 ? Math.round(maxCrossCases - (val * maxCrossCases) / 2) : 0} cases
                    </div>
                  ))}
                </div>

                {crossStationData.map((st) => {
                  const casesVal = Number(st?.cases) || 0;
                  const barHeight = maxCrossCases > 0 ? (casesVal / maxCrossCases) * 110 : 0;

                  return (
                    <div key={st.name} className="flex flex-col items-center group z-10">
                      <div className="flex items-end h-[110px]">
                        <div
                          onMouseEnter={() => setHoveredBar({ label: "Cases Cleared", value: casesVal, title: st.name, date: selectedMonthLabel })}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ height: `${barHeight}px` }}
                          className={`w-8 rounded-t transition-all duration-300 cursor-pointer ${
                            st.active
                              ? "bg-gradient-to-t from-cyan-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] brightness-110 border border-cyan-300/40"
                              : "bg-gradient-to-t from-slate-700 to-slate-500 hover:brightness-110"
                          }`}
                        />
                      </div>
                      <span className={`mt-1.5 text-[9.5px] font-semibold text-center truncate w-16 ${st.active ? "text-cyan-300 font-bold" : "text-slate-400"}`}>
                        {st.name.replace(" Weighbridge", "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: MOBILE ENFORCEMENT & PATROL CORRIDORS */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-4 border-t border-purple-900/30">
          {/* Section 2 Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-purple-500/40 bg-purple-950/50 p-2 text-purple-400">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-white">
                  2. Mobile Weighbridge Enforcement & Corridor Analytics
                </h2>
                <p className="text-xs text-slate-400">
                  Mobile interception rates, patrol routes prone to vehicle charging, and transport corridors under active surveillance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> High Charge Risk
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span> Moderate
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Low Risk
              </span>
            </div>
          </div>

          {/* Mobile KPI Summary Tiles (4 Tiles) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-purple-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-purple-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Vehicles Weighed</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-purple-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-white">{kpis.totalMobileWeighed.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Total field intercepts in {selectedMonthLabel}</p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-rose-500/50 hover:bg-[#0b2135]/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicles Charged</span>
                <span className="text-[9px] font-bold text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                  {kpis.mobileChargeRate}% rate
                </span>
              </div>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-purple-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-rose-400">{kpis.totalMobileCharged.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Exceeded +2,000 kg GVW or axle limits</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-amber-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vehicles Warned</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-purple-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-amber-300">{kpis.totalMobileWarned.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Within 0kg to 2,000kg tolerance buffer</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-[#0b2135]/60 p-4 shadow-lg backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-[#0b2135]/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Legal Mobile Vehicles</span>
              {isLoading ? (
                <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-purple-950/60" />
              ) : (
                <p className="mt-2 text-2xl font-black text-emerald-400">{kpis.totalMobileLegal.toLocaleString()}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">Compliant with legal weight limits</p>
            </div>
          </div>

          {/* Top Routes Charging Propensity Visual Chart */}
          {routesProneToCharging.length > 0 && (
            <div className="rounded-xl border border-purple-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-400" />
                    Top Patrol Corridors by Charged Vehicles ({selectedMonthLabel})
                  </h3>
                  <p className="text-[11px] text-slate-400">Visual comparison of charging hotspots ranked by total prosecuted overloads</p>
                </div>
                <span className="text-[10px] text-purple-300 font-mono font-bold">
                  {routesProneToCharging.length} routes monitored
                </span>
              </div>

              {/* Horizontal visual bars for top 6 routes */}
              <div className="space-y-2.5 pt-1">
                {routesProneToCharging.slice(0, 6).map((r, i) => {
                  const barPct = maxRouteCharges > 0 ? (r.chargedCount / maxRouteCharges) * 100 : 0;
                  return (
                    <div key={`route-bar-${i}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 truncate max-w-[70%]" title={r.route}>
                          {r.route}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-rose-400 font-extrabold">{r.chargedCount} charged</span>
                          <span className="text-slate-400">({r.chargeRate}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            r.chargeRate >= 20
                              ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                              : r.chargeRate >= 8
                              ? "bg-gradient-to-r from-cyan-500 to-amber-500"
                              : "bg-cyan-500"
                          }`}
                          style={{ width: `${Math.max(barPct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Table: Routes Prone to Charging */}
          <div className="rounded-xl border border-purple-900/40 bg-[#0b2135]/40 p-4 shadow-lg backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Activity size={14} className="text-purple-400" />
              Comprehensive Route Charging & Surveillance Directory
            </h3>

            {routesProneToCharging.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-purple-900/30 rounded-lg">
                No mobile route records detected for {selectedMonthLabel}. Select June 2026 or July 2026 from the month selector above.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-purple-900/40 bg-black/40 shadow-inner">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 border-b border-purple-900/50 bg-[#061928] text-[10px] font-extrabold uppercase tracking-wider text-slate-300 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 text-slate-400 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 text-purple-300">Route / Transport Corridor</th>
                        <th className="py-2.5 px-3 text-slate-400 text-center w-24">Type</th>
                        <th className="py-2.5 px-3 text-white text-center">Weighed</th>
                        <th className="py-2.5 px-3 text-rose-300 text-center">Charged</th>
                        <th className="py-2.5 px-3 text-amber-300 text-center">Warned</th>
                        <th className="py-2.5 px-3 text-emerald-300 text-center">Legal</th>
                        <th className="py-2.5 px-3 text-center w-32">Charge Rate</th>
                        <th className="py-2.5 px-3 text-left">Top Charged Commodities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                      {routesProneToCharging.map((r, idx) => (
                        <tr key={`${r.route}-${idx}`} className="hover:bg-white/[0.04] transition-colors">
                          <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-sans">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-sans font-bold text-white text-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[280px]" title={r.route}>
                                {r.route}
                              </span>
                              {r.riskLevel === "High Risk" && (
                                <span className="shrink-0 rounded bg-rose-950/70 border border-rose-500/40 px-1.5 py-0.2 text-[8.5px] font-extrabold text-rose-300">
                                  HIGH
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center text-[10px] font-sans text-slate-400">
                            {r.routeType}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-white">
                            {r.totalWeighed.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center font-extrabold text-rose-400">
                            {r.chargedCount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center text-amber-300 font-semibold">
                            {r.warnedCount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center text-emerald-300">
                            {r.legalCount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    r.chargeRate >= 20 ? "bg-rose-500" : r.chargeRate >= 8 ? "bg-amber-500" : "bg-cyan-400"
                                  }`}
                                  style={{ width: `${Math.min(r.chargeRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-white w-9 text-right">
                                {r.chargeRate}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-sans text-[10.5px] text-slate-400">
                            {r.topChargedCargos && r.topChargedCargos.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {r.topChargedCargos.map((cg) => (
                                  <span
                                    key={cg}
                                    className="rounded border border-purple-500/30 bg-purple-950/40 px-1.5 py-0.2 text-[9px] font-semibold text-purple-200"
                                  >
                                    {cg}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: COMPARATIVE ANALYTICS & FIELD PERSPECTIVE */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4 border-t border-amber-900/30">
          {/* Section 3 Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/50 p-2 text-amber-400">
                <GitCompare size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-white">
                  3. Mobile vs. Static Comparative Analytics & Cargo Vulnerability
                </h2>
                <p className="text-xs text-slate-400">
                  Same-day dual weighings (identifying weight and axle distribution variance from field perspective) and cargo overloading vulnerability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="rounded-lg border border-sky-500/30 bg-sky-950/30 px-2.5 py-1 text-sky-300 font-bold">
                {crossWeighedVehicles.length} Dual Weighed
              </span>
              <span className="rounded-lg border border-teal-500/30 bg-teal-950/30 px-2.5 py-1 text-teal-300 font-bold">
                {cargoOverloadStats.length} Commodities
              </span>
            </div>
          </div>

          {/* Subsection 3A: Same-Day Cross-Weighed Vehicles */}
          <div className="rounded-xl border border-slate-800 bg-[#071927]/60 p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-100 flex items-center gap-2">
                  <Layers size={16} className="text-sky-400" />
                  Same-Day Cross-Weighed Vehicles (Dual-Weighed on Mobile & Static)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct side-by-side comparison of vehicles intercepted on Mobile patrol and subsequently/previously weighed on Static weighbridge scales on the same date.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {crossWeighedVehicles.length} vehicles detected
              </span>
            </div>

            {crossWeighedVehicles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg space-y-1.5">
                <p>No vehicles with matching registration plates on both mobile and static on the same day in {selectedMonthLabel}.</p>
                <p className="text-[11px] text-sky-400">
                  Select <strong className="underline cursor-pointer" onClick={() => setSelectedMonth("2026-06")}>June 2026</strong> or{" "}
                  <strong className="underline cursor-pointer" onClick={() => setSelectedMonth("2026-07")}>July 2026</strong> from the month selector above to view verified dual weighings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {crossWeighedVehicles.map((v, i) => (
                  <div
                    key={`${v.date}-${v.registration}-${i}`}
                    className="rounded-xl border border-slate-800 bg-[#071827] p-4 shadow-lg transition-all duration-300 hover:border-sky-500/40 hover:bg-[#0b2135]/70 flex flex-col justify-between space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-sky-200 rounded border border-sky-500/30 bg-sky-950/30 px-2 py-0.5">
                          {v.registration}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{v.cargo}</span>
                      </div>
                      <span className="text-[10.5px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar size={12} className="text-sky-400" />
                        {v.date}
                      </span>
                    </div>

                    {/* Dual Cards: Mobile vs Static */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {/* Mobile Card */}
                      <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="text-[10px] font-extrabold uppercase text-sky-300">
                            Mobile Patrol
                          </span>
                          <span
                            className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
                              v.mobile.remarks === "CHARGED"
                                ? "border-rose-800 bg-rose-950/60 text-rose-300"
                                : v.mobile.remarks === "WARNED"
                                ? "border-amber-800 bg-amber-950/60 text-amber-200"
                                : "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                            }`}
                          >
                            {v.mobile.remarks}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-400">Total GVW:</span>
                          <span className="font-bold text-slate-200">{v.mobile.totalGvwKg.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-400">Difference:</span>
                          <span
                            className={`font-bold ${
                              v.mobile.differenceKg > 0 ? "text-rose-300/90" : "text-emerald-400/90"
                            }`}
                          >
                            {v.mobile.differenceKg > 0 ? `+${v.mobile.differenceKg.toLocaleString()}` : v.mobile.differenceKg.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {v.mobile.station} ({v.mobile.bound})
                        </div>
                      </div>

                      {/* Static Card */}
                      <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-300">
                            Static Weighbridge
                          </span>
                          <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded border border-indigo-800 bg-indigo-950/60 text-indigo-300">
                            {v.static.status}
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-400">Axle Overload:</span>
                          <span
                            className={`font-bold ${
                              v.static.axleOverloadKg > 0 ? "text-rose-300/90" : "text-slate-400"
                            }`}
                          >
                            {v.static.axleOverloadKg > 0 ? `+${v.static.axleOverloadKg.toLocaleString()}` : "0"} kg
                          </span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-400">GVW Overload:</span>
                          <span
                            className={`font-bold ${
                              v.static.gvwOverloadKg > 0 ? "text-rose-300/90" : "text-slate-400"
                            }`}
                          >
                            {v.static.gvwOverloadKg > 0 ? `+${v.static.gvwOverloadKg.toLocaleString()}` : "0"} kg
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {v.static.station} ({v.static.bound})
                        </div>
                      </div>
                    </div>

                    {/* Field Perspective Insight */}
                    <div className="rounded-lg border border-slate-800 bg-[#051421] p-2.5 text-[10.5px] text-slate-300 flex items-start gap-2">
                      <Info size={14} className="text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-200">Field Perspective:</strong> {v.fieldPerspective}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subsection 3B: Cargo Overloading Vulnerability */}
          <div className="rounded-xl border border-slate-800 bg-[#071927]/60 p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-100 flex items-center gap-2">
                  <Package size={16} className="text-teal-400" />
                  Cargo Commodities Most Prone to Overload Prosecutions / Charges ({selectedMonthLabel})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statistical ranking of cargo types by charged vehicle prosecutions, excess tonnage, and average excess overload per charged truck.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {cargoOverloadStats.length} commodity categories
              </span>
            </div>

            {cargoOverloadStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No charged vehicle records detected for {selectedMonthLabel}.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Chart: Top Commodities Bar Graph Comparison with Suitable Scaling */}
                <div className="rounded-xl border border-slate-800 bg-[#071827] p-4 sm:p-5 shadow-2xl space-y-4">
                  {/* Header with Title & Metric Controls */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                        <BarChart3 size={16} className="text-teal-400" />
                        Top Commodities Charged Comparison
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Comparative bar visualization across top {topCargoList.length} charged cargo types with dynamic calibrated scaling.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Mode Toggle Buttons */}
                      <div className="flex items-center rounded-lg bg-black/50 p-1 border border-slate-800 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setCargoCompareMetric("dual")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            cargoCompareMetric === "dual"
                              ? "bg-teal-700 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Dual (Charged Cases & Tonnage)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCargoCompareMetric("cases")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            cargoCompareMetric === "cases"
                              ? "bg-teal-700 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Charged Cases
                        </button>
                        <button
                          type="button"
                          onClick={() => setCargoCompareMetric("tonnes")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            cargoCompareMetric === "tonnes"
                              ? "bg-indigo-700 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Tonnage (t)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCargoCompareMetric("avg")}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            cargoCompareMetric === "avg"
                              ? "bg-violet-700 text-white shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Avg Excess (kg)
                        </button>
                      </div>

                      {/* Top N Selector */}
                      <div className="flex items-center rounded-lg bg-black/50 p-1 border border-slate-800 text-[11px]">
                        <span className="text-slate-500 px-1.5 text-[10px] uppercase font-bold">Top:</span>
                        {[5, 7, 10].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCargoTopLimit(n)}
                            className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                              cargoTopLimit === n
                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legend & Scaling Indicators */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-3 px-1">
                    <div className="flex items-center gap-4">
                      {(cargoCompareMetric === "dual" || cargoCompareMetric === "cases") && (
                        <span className="flex items-center gap-1.5 font-semibold text-teal-300">
                          <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-teal-700 to-teal-400 shadow-[0_0_6px_rgba(20,184,166,0.3)]"></span>
                          Charged Prosecutions (Cases)
                        </span>
                      )}
                      {(cargoCompareMetric === "dual" || cargoCompareMetric === "tonnes") && (
                        <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
                          <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-indigo-700 to-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.3)]"></span>
                          Charged Excess Mass (Tonnes)
                        </span>
                      )}
                      {cargoCompareMetric === "avg" && (
                        <span className="flex items-center gap-1.5 font-semibold text-violet-300">
                          <span className="h-3 w-3 rounded-sm bg-gradient-to-t from-violet-700 to-purple-400 shadow-[0_0_6px_rgba(139,92,246,0.3)]"></span>
                          Average Overload per Charged Truck (kg)
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      {cargoCompareMetric === "dual" && (
                        <span>
                          Scale: <span className="text-teal-300 font-bold">0–{cleanCeilingCases} cases</span> (left) |{" "}
                          <span className="text-indigo-300 font-bold">0–{cleanCeilingTonnes} tonnes</span> (right)
                        </span>
                      )}
                      {cargoCompareMetric === "cases" && (
                        <span>Scale: <span className="text-teal-300 font-bold">0–{cleanCeilingCases} cases</span></span>
                      )}
                      {cargoCompareMetric === "tonnes" && (
                        <span>Scale: <span className="text-indigo-300 font-bold">0–{cleanCeilingTonnes} tonnes</span></span>
                      )}
                      {cargoCompareMetric === "avg" && (
                        <span>Scale: <span className="text-violet-300 font-bold">0–{cleanCeilingAvg.toLocaleString()} kg</span></span>
                      )}
                    </div>
                  </div>

                  {/* Main Bar Chart Container */}
                  <div className="relative w-full h-[240px] pt-6 pb-2 border-b border-l border-slate-800 bg-black/30 rounded-br-lg">
                    {/* Background Gridlines with Calibrated Ticks */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-6 pb-2">
                      {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => {
                        const tickCases = Math.round(cleanCeilingCases * ratio);
                        const tickTonnes = Math.round(cleanCeilingTonnes * ratio);
                        const tickAvg = Math.round(cleanCeilingAvg * ratio);
                        return (
                          <div
                            key={idx}
                            className="w-full flex items-center justify-between border-t border-slate-800/60 px-2 text-[9px] font-mono text-slate-500"
                          >
                            <span>
                              {cargoCompareMetric === "tonnes"
                                ? `${tickTonnes} t`
                                : cargoCompareMetric === "avg"
                                ? `${tickAvg.toLocaleString()} kg`
                                : `${tickCases} c`}
                            </span>
                            {cargoCompareMetric === "dual" && (
                              <span className="text-indigo-400/70">{tickTonnes} t</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bars for Each Top Commodity */}
                    <div className="relative h-full flex items-end justify-around px-2 sm:px-4 z-10">
                      {topCargoList.map((cg, idx) => {
                        const tonnesVal = Math.round(cg.totalExcessKg / 1000);
                        const maxChartHeight = 165; // px

                        const casesHeight =
                          cleanCeilingCases > 0 ? (cg.incidentCount / cleanCeilingCases) * maxChartHeight : 0;
                        const tonnesHeight =
                          cleanCeilingTonnes > 0 ? (tonnesVal / cleanCeilingTonnes) * maxChartHeight : 0;
                        const avgHeight =
                          cleanCeilingAvg > 0 ? (cg.averageExcessKg / cleanCeilingAvg) * maxChartHeight : 0;

                        return (
                          <div
                            key={cg.cargo}
                            className="flex flex-col items-center flex-1 max-w-[120px] group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                            onMouseEnter={() =>
                              setHoveredBar({
                                title: cg.cargo,
                                label: "Charged Overload Impact",
                                value: cg.incidentCount,
                                date: `${cg.incidentCount} charged cases • ${tonnesVal}t excess • avg +${cg.averageExcessKg.toLocaleString()}kg • peak +${cg.maxExcessKg.toLocaleString()}kg`,
                              })
                            }
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* Bars Container */}
                            <div className="flex items-end justify-center gap-1 sm:gap-2 h-[170px] w-full">
                              {cargoCompareMetric === "dual" && (
                                <>
                                  {/* Bar 1: Cases */}
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-mono font-bold text-teal-300 mb-0.5 opacity-90 group-hover:opacity-100">
                                      {cg.incidentCount}
                                    </span>
                                    <div
                                      style={{ height: `${Math.max(casesHeight, 4)}px` }}
                                      className="w-3.5 sm:w-5 md:w-6 rounded-t bg-gradient-to-t from-teal-700 via-teal-600 to-teal-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
                                    />
                                  </div>

                                  {/* Bar 2: Tonnes */}
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-mono font-bold text-indigo-300 mb-0.5 opacity-90 group-hover:opacity-100">
                                      {tonnesVal}t
                                    </span>
                                    <div
                                      style={{ height: `${Math.max(tonnesHeight, 4)}px` }}
                                      className="w-3.5 sm:w-5 md:w-6 rounded-t bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                                    />
                                  </div>
                                </>
                              )}

                              {cargoCompareMetric === "cases" && (
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-[10px] font-mono font-bold text-teal-300 mb-1">
                                    {cg.incidentCount}
                                  </span>
                                  <div
                                    style={{ height: `${Math.max(casesHeight, 4)}px` }}
                                    className="w-7 sm:w-10 md:w-12 rounded-t bg-gradient-to-t from-teal-700 via-teal-600 to-teal-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_10px_rgba(20,184,166,0.25)]"
                                  />
                                </div>
                              )}

                              {cargoCompareMetric === "tonnes" && (
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-[10px] font-mono font-bold text-indigo-300 mb-1">
                                    {tonnesVal}t
                                  </span>
                                  <div
                                    style={{ height: `${Math.max(tonnesHeight, 4)}px` }}
                                    className="w-7 sm:w-10 md:w-12 rounded-t bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                                  />
                                </div>
                              )}

                              {cargoCompareMetric === "avg" && (
                                <div className="flex flex-col items-center w-full">
                                  <span className="text-[9px] font-mono font-bold text-violet-300 mb-1">
                                    +{cg.averageExcessKg.toLocaleString()}kg
                                  </span>
                                  <div
                                    style={{ height: `${Math.max(avgHeight, 4)}px` }}
                                    className="w-7 sm:w-10 md:w-12 rounded-t bg-gradient-to-t from-violet-700 via-violet-500 to-purple-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.25)]"
                                  />
                                </div>
                              )}
                            </div>

                            {/* X-Axis Labels */}
                            <div className="mt-2 text-center flex flex-col items-center w-full px-0.5">
                              <span
                                className="text-[10px] font-semibold text-slate-300 group-hover:text-white truncate max-w-[85px] sm:max-w-[100px]"
                                title={cg.cargo}
                              >
                                {cg.cargo}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] font-mono text-slate-500">#{idx + 1}</span>
                                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                  {cg.percentageShare}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cargo Detail Table */}
                <div className="overflow-hidden rounded-lg border border-slate-800/80 bg-black/40 shadow-inner">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 z-10 border-b border-slate-800 bg-[#061928] text-[10px] font-extrabold uppercase tracking-wider text-slate-300 shadow-sm">
                        <tr>
                          <th className="py-2.5 px-3 text-slate-400 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 text-slate-300">Commodity / Cargo Description</th>
                          <th className="py-2.5 px-3 text-center text-white">Charged Cases</th>
                          <th className="py-2.5 px-3 text-center text-teal-300">Total Excess (KG)</th>
                          <th className="py-2.5 px-3 text-center text-indigo-300">Avg Excess / Truck</th>
                          <th className="py-2.5 px-3 text-center text-slate-400">Peak Overload</th>
                          <th className="py-2.5 px-3 text-center w-32">Offense Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                        {cargoOverloadStats.map((cg, idx) => (
                          <tr key={cg.cargo} className="hover:bg-white/[0.04] transition-colors">
                            <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-sans">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-sans font-bold text-white text-xs">
                              <span className="inline-flex items-center gap-1.5">
                                <Package size={13} className="text-teal-400 shrink-0" />
                                {cg.cargo}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-white">
                              {cg.incidentCount.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-teal-300">
                              {cg.totalExcessKg.toLocaleString()} kg
                            </td>
                            <td className="py-2 px-3 text-center text-indigo-300 font-semibold">
                              {cg.averageExcessKg.toLocaleString()} kg
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              {cg.maxExcessKg.toLocaleString()} kg
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-teal-500"
                                    style={{ width: `${Math.min(cg.percentageShare * 2.5, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 w-9 text-right">
                                  {cg.percentageShare}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Global Hover Tooltip for Graphs */}
        {hoveredBar && (
          <div className="fixed bottom-6 right-6 bg-[#051421] border border-cyan-500/60 rounded-xl px-4 py-2.5 shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {hoveredBar.title} {hoveredBar.date ? `• ${hoveredBar.date}` : ""}
            </p>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {hoveredBar.label}: <span className="text-cyan-400 font-mono">{hoveredBar.value.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>
    </ReportsLayout>
  );
}
