"use client";

import { useState, useEffect, useRef } from "react";
import { BarChart3, ShieldAlert, FileText, Scale, Gavel, Bus, Truck, CheckCircle2, Maximize2, X } from "lucide-react";

type MobileReportOption = {
  date: string;
  bound: string;
  bound_label: string;
  label: string;
  report_id: string;
};

type StaticKpis = {
  label: string;
  weighed: number;
  overloads: number;
  psvOverloads: number;
  minGross: number;
  chargedRedist: string;
  reportsGenerated: number;
  axleConfigs?: Record<string, number>;
  psvBreakdown?: {
    charged: number;
    redistributed: number;
    specialRelease: number;
    withinAllowed?: number;
  };
};

type MobileShiftStats = {
  weighed: number;
  warned: number;
  legal: number;
  charged: number;
};

function emptyStaticKpis(): StaticKpis {
  return {
    label: "",
    weighed: 0,
    overloads: 0,
    psvOverloads: 0,
    minGross: 0,
    chargedRedist: "0 / 0",
    reportsGenerated: 0,
    axleConfigs: {},
    psvBreakdown: { charged: 0, redistributed: 0, specialRelease: 0, withinAllowed: 0 },
  };
}

function useDashboardData(filters?: { staticDate?: string; mobileDate?: string; mobileBound?: string; station?: string }) {
  const staticDate = filters?.staticDate;
  const mobileDate = filters?.mobileDate;
  const mobileBound = filters?.mobileBound;
  const station = filters?.station;
  const [data, setData] = useState({
    weighed: 0,
    overloads: 0,
    psvOverloads: 0,
    minGross: 0,
    chargedRedist: "0 / 0",
    reportsGenerated: 0,
    axleConfigs: {} as Record<string, number>,
    psvBreakdown: { charged: 0, redistributed: 0, specialRelease: 0, withinAllowed: 0 },
    staticDates: [] as string[],
    selectedStaticDate: null as string | null,
    staticByBound: {
      boundA: { ...emptyStaticKpis(), label: "Bound A" },
      boundB: { ...emptyStaticKpis(), label: "Bound B" },
      total: { ...emptyStaticKpis(), label: "Total" },
    },
    mobileWeighed: 0,
    mobileWarned: 0,
    mobileLegal: 0,
    mobileCharged: 0,
    mobileShifts: {
      shiftA: { weighed: 0, warned: 0, legal: 0, charged: 0 } as MobileShiftStats,
      shiftB: { weighed: 0, warned: 0, legal: 0, charged: 0 } as MobileShiftStats,
      total: { weighed: 0, warned: 0, legal: 0, charged: 0 } as MobileShiftStats,
    },
    mobileReports: [] as MobileReportOption[],
    selectedMobileReport: null as MobileReportOption | null,
    hasStaticData: false,
    hasMobileData: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    async function fetchData() {
      setIsLoading(true);
      try {
        const { getAnalyticsDashboard } = await import("@/lib/api");
        const res = await getAnalyticsDashboard({ staticDate, mobileDate, mobileBound, station });
        const byBound = res.static.byBound || {};

        if (active) {
          setData({
            weighed: res.static.weighed,
            overloads: res.static.overloads,
            psvOverloads: res.static.psvOverloads || 0,
            minGross: res.static.minGross,
            chargedRedist: res.static.chargedRedist,
            reportsGenerated: res.static.reportsGenerated,
            axleConfigs: res.static.axleConfigs || {},
            psvBreakdown: res.static.psvBreakdown || { charged: 0, redistributed: 0, specialRelease: 0 },
            staticDates: res.static.dates || [],
            selectedStaticDate: res.static.selectedDate || null,
            staticByBound: {
              boundA: { ...emptyStaticKpis(), label: "Bound A", ...(byBound.boundA || {}) },
              boundB: { ...emptyStaticKpis(), label: "Bound B", ...(byBound.boundB || {}) },
              total: { ...emptyStaticKpis(), label: "Total", ...(byBound.total || {}) },
            },
            mobileWeighed: res.mobile.weighed,
            mobileWarned: res.mobile.warned,
            mobileLegal: res.mobile.legal || 0,
            mobileCharged: res.mobile.charged,
            mobileShifts: res.mobile.shifts || {
              shiftA: { weighed: 0, warned: 0, legal: 0, charged: 0 },
              shiftB: { weighed: 0, warned: 0, legal: 0, charged: 0 },
              total: { weighed: 0, warned: 0, legal: 0, charged: 0 },
            },
            mobileReports: res.mobile.reports || [],
            selectedMobileReport: res.mobile.selected || null,
            hasStaticData: res.static.reportsGenerated > 0 || res.static.weighed > 0 || (res.static.axleConfigs && Object.keys(res.static.axleConfigs).length > 0),
            hasMobileData:
              (res.mobile.weighed || 0) > 0 ||
              (res.mobile.warned || 0) > 0 ||
              (res.mobile.charged || 0) > 0 ||
              (res.mobile.legal || 0) > 0,
          });
        }
      } catch (err) {
        const { isApiConnectionError } = await import("@/lib/api");

        if (!isApiConnectionError(err)) {
          console.error("Failed to fetch dashboard summary cards", err);
        }
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
  }, [mobileBound, mobileDate, staticDate, station]);

  return { data, isLoading };
}

export function StaticSummaryCards({ selectedDate, station }: { selectedDate: string; station?: string | null }) {
  const { data, isLoading } = useDashboardData({ staticDate: selectedDate, station: station || undefined });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const effectiveDate = selectedDate || data.selectedStaticDate || "";

  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  const staticMetric = {
    weighed: {
      boundA: data.staticByBound.boundA.weighed,
      boundB: data.staticByBound.boundB.weighed,
      total: data.staticByBound.total.weighed,
    },
    overloads: {
      boundA: data.staticByBound.boundA.overloads,
      boundB: data.staticByBound.boundB.overloads,
      total: data.staticByBound.total.overloads,
    },
    psvOverloads: {
      boundA: data.staticByBound.boundA.psvOverloads,
      boundB: data.staticByBound.boundB.psvOverloads,
      total: data.staticByBound.total.psvOverloads,
    },
    minGross: {
      boundA: data.staticByBound.boundA.minGross,
      boundB: data.staticByBound.boundB.minGross,
      total: data.staticByBound.total.minGross,
    },
    chargedRedist: {
      boundA: data.staticByBound.boundA.chargedRedist,
      boundB: data.staticByBound.boundB.chargedRedist,
      total: data.staticByBound.total.chargedRedist,
    },
    reportsGenerated: {
      boundA: data.staticByBound.boundA.reportsGenerated,
      boundB: data.staticByBound.boundB.reportsGenerated,
      total: data.staticByBound.total.reportsGenerated,
    },
  };
  const staticLabels = {
    boundA: data.staticByBound.boundA.label || "Bound A",
    boundB: data.staticByBound.boundB.label || "Bound B",
    total: data.staticByBound.total.label || "Total",
  };

  const axleConfigs = data.axleConfigs || data.staticByBound.total.axleConfigs || {};
  const axleEntries = Object.entries(axleConfigs).sort((a, b) => b[1] - a[1]);
  const topAxles = axleEntries.slice(0, 6);
  const totalAxleCount = axleEntries.reduce((acc, [, c]) => acc + c, 0);
  const remainingAxleCount = axleEntries.slice(6).reduce((acc, [, c]) => acc + c, 0);

  const psvBreakdown = data.psvBreakdown || { charged: 0, redistributed: 0, specialRelease: 0, withinAllowed: 0 };
  const hasPsvBreakdown =
    (psvBreakdown.charged || 0) > 0 ||
    (psvBreakdown.redistributed || 0) > 0 ||
    (psvBreakdown.specialRelease || 0) > 0 ||
    (psvBreakdown.withinAllowed || 0) > 0;

  const cards = [
    {
      id: "weighed",
      title: "Total Weighed Vehicles",
      metric: staticMetric.weighed,
      change: data.hasStaticData ? effectiveDate : "No active session",
      icon: BarChart3,
      color: "bg-transparent border-cyan-500/20 text-cyan-300 hover:border-cyan-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "overloads",
      title: "Truck Overloads (No Permit)",
      metric: staticMetric.overloads,
      change: data.hasStaticData ? "Excluded permit holders" : "No active session",
      icon: ShieldAlert,
      color: "bg-transparent border-rose-500/20 text-rose-300 hover:border-rose-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "psv",
      title: "PSV Coaches weighed",
      metric: staticMetric.psvOverloads,
      change: data.hasStaticData
        ? hasPsvBreakdown
          ? `${psvBreakdown.withinAllowed ?? 0} Allowed (+2t) · ${psvBreakdown.charged} Chg · ${psvBreakdown.redistributed} Red`
          : "Buses & passenger vehicles"
        : "No active session",
      icon: Bus,
      color: "bg-transparent border-amber-500/20 text-amber-300 hover:border-amber-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "min_axle",
      title: "Min Axle Overload Allowed",
      metric: staticMetric.minGross,
      change: "Within minimal axle overload tolerance",
      icon: Scale,
      color: "bg-transparent border-emerald-500/20 text-emerald-300 hover:border-emerald-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "charged_redist",
      title: "Charged vs Redistributed",
      metric: staticMetric.chargedRedist,
      change: data.hasStaticData ? "Charged / Redistributed" : "No active session",
      icon: Gavel,
      color: "bg-transparent border-blue-500/20 text-blue-300 hover:border-blue-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "axle_config",
      title: "Axle Config Breakdown",
      metric: staticMetric.weighed,
      change: data.hasStaticData && topAxles.length > 0
        ? remainingAxleCount > 0
          ? `+${axleEntries.length - 6} other configs (${remainingAxleCount} trucks)`
          : `${axleEntries.length} axle configurations`
        : "No active session",
      icon: Truck,
      color: "bg-transparent border-purple-500/20 text-purple-300 hover:border-purple-500/40 hover:bg-[#071827]/40",
      isAxleConfig: true,
    },
  ];

  function formatMetric(value: number | string) {
    return typeof value === "number" ? value.toLocaleString() : value;
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md h-[540px] flex flex-col cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.005] hover:bg-[#0b2135]/80 relative group"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3 mb-3 shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Static Report KPIs
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Static weighbridge metrics for {effectiveDate || "..."}</p>
          </div>
          <div className="text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={14} />
          </div>
        </div>

        {/* Scrollable grid area */}
        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`loading-static-${i}`}
                  className="relative flex min-h-[110px] flex-col justify-between overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/50 p-2.5 shadow-lg backdrop-blur-md"
                >
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-700/80" />
                  <div className="mt-2 h-5 w-12 animate-pulse rounded bg-slate-700/80" />
                  <div className="mt-2 h-2.5 w-20 animate-pulse rounded bg-slate-800/80" />
                </div>
              ))
            : cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={`static-${i}`}
                    className={`relative flex min-h-[115px] flex-col justify-between overflow-hidden rounded-xl border p-2.5 transition-all duration-300 ${card.color}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight block truncate max-w-[85%]">
                        {card.title}
                      </span>
                      <Icon size={12} className="opacity-80 shrink-0" />
                    </div>

                    {card.isAxleConfig ? (
                      <div className="mt-1.5 flex flex-col justify-between flex-1 min-h-0">
                        {data.hasStaticData && topAxles.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1">
                            {topAxles.map(([cfg, count]) => (
                              <div
                                key={cfg}
                                className="min-w-0 rounded border border-purple-500/20 bg-purple-950/40 px-1 py-0.5 text-center"
                              >
                                <span
                                  className="block truncate text-[7.5px] font-bold uppercase text-purple-300/80"
                                  title={cfg}
                                >
                                  {cfg}
                                </span>
                                <span className="block truncate text-[11px] font-extrabold tracking-tight text-white">
                                  {count.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-2 text-center text-[10px] text-slate-500">
                            {isLoading ? "Loading..." : "No axle records"}
                          </div>
                        )}
                        <p className="mt-1 text-[8px] text-slate-400 font-medium truncate" title={card.change}>
                          {card.change}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {[
                            [staticLabels.boundA, card.metric.boundA],
                            [staticLabels.boundB, card.metric.boundB],
                            [staticLabels.total, card.metric.total],
                          ].map(([label, value]) => (
                            <div key={label} className="min-w-0 rounded border border-white/5 bg-black/20 px-1 py-0.5">
                              <span
                                className="block truncate text-[7px] font-bold uppercase text-slate-500 text-center"
                                title={String(label)}
                              >
                                {label}
                              </span>
                              <span className="block truncate text-[11px] font-extrabold tracking-tight text-white text-center">
                                {data.hasStaticData ? formatMetric(value) : "0"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="mt-1 text-[8px] text-slate-500 font-medium truncate" title={card.change}>
                            {card.change}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-900/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Static Report KPIs Details</h3>
                <p className="text-xs text-slate-400">Detailed static weighbridge statistics for {effectiveDate}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
              >
                <X size={16} />
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card, i) => {
                  const Icon = card.icon;

                  if (card.isAxleConfig) {
                    return (
                      <div
                        key={`modal-static-${i}`}
                        className="relative flex flex-col justify-between rounded-xl border border-purple-900/50 bg-[#0b2135]/30 p-4 shadow-md md:col-span-2 lg:col-span-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-purple-950 pb-2 mb-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                              Axle Configuration Breakdown ({totalAxleCount.toLocaleString()} Total Vehicles)
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Count of vehicles by axle configuration from Impounded & Overloaded records
                            </p>
                          </div>
                          <Icon size={18} className="text-purple-400 shrink-0" />
                        </div>

                        {data.hasStaticData && axleEntries.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                            {axleEntries.map(([cfg, count]) => {
                              const boundACount = data.staticByBound.boundA.axleConfigs?.[cfg] || 0;
                              const boundBCount = data.staticByBound.boundB.axleConfigs?.[cfg] || 0;
                              const pct = totalAxleCount > 0 ? ((count / totalAxleCount) * 100).toFixed(1) : "0";

                              return (
                                <div
                                  key={cfg}
                                  className="rounded-lg border border-purple-900/30 bg-purple-950/20 p-2.5 flex flex-col justify-between hover:border-purple-500/40 transition"
                                >
                                  <div className="flex items-center justify-between border-b border-purple-900/20 pb-1 mb-1.5">
                                    <span className="font-mono text-xs font-bold text-purple-200">{cfg}</span>
                                    <span className="text-[9px] font-semibold text-purple-400/80">{pct}%</span>
                                  </div>
                                  <div className="text-lg font-extrabold text-white text-center py-0.5">
                                    {count.toLocaleString()}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 mt-1 text-[8px] text-slate-400 border-t border-white/5 pt-1">
                                    <span className="truncate">A: <strong className="text-slate-300">{boundACount}</strong></span>
                                    <span className="truncate text-right">B: <strong className="text-slate-300">{boundBCount}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-500">
                            No axle configuration records for selected date
                          </div>
                        )}
                        <p className="mt-3 text-[10px] text-slate-400 font-medium">
                          {card.change}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`modal-static-${i}`}
                      className="relative flex flex-col justify-between rounded-xl border border-cyan-900/50 bg-[#0b2135]/30 p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-cyan-950 pb-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                          {card.title}
                        </span>
                        <Icon size={16} className="text-cyan-400 shrink-0" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-2">
                        {[
                          [staticLabels.boundA, card.metric.boundA],
                          [staticLabels.boundB, card.metric.boundB],
                          [staticLabels.total, card.metric.total],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0 rounded-lg border border-cyan-900/20 bg-black/30 p-2 text-center">
                            <span className="block truncate text-[9px] font-bold uppercase text-slate-500 mb-1">
                              {label}
                            </span>
                            <span className="block truncate text-base font-extrabold text-white">
                              {data.hasStaticData ? formatMetric(value) : "0"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {card.id === "psv" && hasPsvBreakdown && (
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] bg-amber-950/30 border border-amber-900/30 rounded px-2 py-1 mt-1 text-amber-200/90 font-mono">
                          <span>Allowed (+2t): <strong>{psvBreakdown.withinAllowed ?? 0}</strong></span>
                          <span>Charged: <strong>{psvBreakdown.charged}</strong></span>
                          <span>Redist: <strong>{psvBreakdown.redistributed}</strong></span>
                          <span>Release: <strong>{psvBreakdown.specialRelease}</strong></span>
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-slate-400 font-medium">
                        {card.change}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileSummaryCards({ selectedDate, station }: { selectedDate: string; station?: string | null }) {
  const [selectedBound, setSelectedBound] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mobileBoundSelectRef = useRef<HTMLSelectElement>(null);
  
  const { data, isLoading } = useDashboardData({
    mobileDate: selectedDate,
    mobileBound: selectedBound,
    station: station || undefined,
  });

  const effectiveDate = selectedDate || data.selectedMobileReport?.date || "";
  const effectiveBound = selectedBound || data.selectedMobileReport?.bound || "";

  const availableBounds = data.mobileReports.filter(
    (report) => !effectiveDate || report.date === effectiveDate
  );

  const selectedLabel =
    data.selectedMobileReport?.label ||
    (effectiveDate && effectiveBound
      ? `${effectiveDate} - ${effectiveBound === "mobile_2" ? "Mobile 2" : "Mobile 1"}`
      : "No mobile session");

  // Keep dropdown state in sync if data loads a new selected bound
  useEffect(() => {
    if (data.selectedMobileReport?.bound && !selectedBound) {
      setSelectedBound(data.selectedMobileReport.bound);
    }
  }, [data.selectedMobileReport, selectedBound]);

  const shifts = data.mobileShifts || {
    shiftA: { weighed: 0, warned: 0, legal: 0, charged: 0 },
    shiftB: { weighed: 0, warned: 0, legal: 0, charged: 0 },
    total: { weighed: 0, warned: 0, legal: 0, charged: 0 },
  };

  const cards = [
    {
      id: "weighed",
      title: "Mobile Weighed",
      shortLabel: "Weighed",
      shiftA: shifts.shiftA.weighed,
      shiftB: shifts.shiftB.weighed,
      total: shifts.total.weighed || data.mobileWeighed,
      change: data.hasMobileData ? selectedLabel : "No mobile session",
      icon: Scale,
      color: "bg-transparent border-sky-500/20 text-sky-300 hover:border-sky-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "warned",
      title: "Mobile Warned",
      shortLabel: "Warned",
      shiftA: shifts.shiftA.warned,
      shiftB: shifts.shiftB.warned,
      total: shifts.total.warned || data.mobileWarned,
      change: data.hasMobileData ? "Warned vehicles" : "No mobile session",
      icon: ShieldAlert,
      color: "bg-transparent border-amber-500/20 text-amber-300 hover:border-amber-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "legal",
      title: "Mobile Legal",
      shortLabel: "Legal",
      shiftA: shifts.shiftA.legal,
      shiftB: shifts.shiftB.legal,
      total: shifts.total.legal || data.mobileLegal,
      change: data.hasMobileData ? "Compliant vehicles" : "No mobile session",
      icon: CheckCircle2,
      color: "bg-transparent border-emerald-500/20 text-emerald-300 hover:border-emerald-500/40 hover:bg-[#071827]/40",
    },
    {
      id: "charged",
      title: "Mobile Charged",
      shortLabel: "Charged",
      shiftA: shifts.shiftA.charged,
      shiftB: shifts.shiftB.charged,
      total: shifts.total.charged || data.mobileCharged,
      change: data.hasMobileData ? "Charged vehicles" : "No mobile session",
      icon: Gavel,
      color: "bg-transparent border-rose-500/20 text-rose-300 hover:border-rose-500/40 hover:bg-[#071827]/40",
    },
  ];

  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md h-[540px] flex flex-col cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.005] hover:bg-[#0b2135]/80 relative group"
      >
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-cyan-900/30 pb-3 mb-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Mobile Report KPIs
            </h2>
            <div className="text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={14} />
            </div>
          </div>

          {/* Bound Selector: Stop propagation to prevent modal trigger */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex cursor-pointer rounded-lg border border-cyan-900/60 bg-[#071827]/85 px-2 py-1 shadow-sm"
          >
            <select
              ref={mobileBoundSelectRef}
              value={effectiveBound}
              onChange={(event) => setSelectedBound(event.target.value)}
              disabled={availableBounds.length === 0}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-[11px] font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {availableBounds.length === 0 ? (
                <option value="">No Mobile Report</option>
              ) : (
                availableBounds.map((report) => (
                  <option key={`${report.date}-${report.bound}`} value={report.bound} className="bg-[#071827] text-white">
                    {report.bound_label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`loading-mobile-${i}`}
                  className="relative flex min-h-[92px] flex-col justify-between overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/50 p-2.5 shadow-lg backdrop-blur-md animate-pulse"
                >
                  <div className="h-3 w-20 rounded bg-slate-700/80" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="h-8 rounded bg-slate-800/80" />
                    <div className="h-8 rounded bg-slate-800/80" />
                  </div>
                </div>
              ))
            : cards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={`mobile-${i}`}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 transition-all duration-300 min-h-[92px] ${card.color}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight block truncate">
                        {card.title}
                      </span>
                      <Icon size={12} className="opacity-80 shrink-0" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div className="min-w-0 rounded border border-white/5 bg-black/25 px-1.5 py-0.5 text-center">
                        <span className="block truncate text-[7.5px] font-bold uppercase text-slate-400">
                          Shift A (Day)
                        </span>
                        <span className="block truncate text-sm font-extrabold tracking-tight text-white">
                          {data.hasMobileData ? card.shiftA.toLocaleString() : "0"}
                        </span>
                      </div>
                      <div className="min-w-0 rounded border border-white/5 bg-black/25 px-1.5 py-0.5 text-center">
                        <span className="block truncate text-[7.5px] font-bold uppercase text-slate-400">
                          Shift B (Night)
                        </span>
                        <span className="block truncate text-sm font-extrabold tracking-tight text-white">
                          {data.hasMobileData ? card.shiftB.toLocaleString() : "0"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1 text-[8px] px-0.5">
                      <span className="text-slate-400 font-medium truncate">Total {card.shortLabel}:</span>
                      <span className="font-extrabold text-white font-mono shrink-0">
                        {data.hasMobileData ? card.total.toLocaleString() : "0"}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-900/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Mobile Report KPIs Details</h3>
                <p className="text-xs text-slate-400">Detailed mobile weighbridge statistics for {effectiveBound === "mobile_2" ? "Mobile 2" : "Mobile 1"} on {effectiveDate}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
              >
                <X size={16} />
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={`modal-mobile-${i}`}
                      className="relative flex flex-col justify-between rounded-xl border border-cyan-900/50 bg-[#0b2135]/30 p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-cyan-950 pb-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                          {card.title}
                        </span>
                        <Icon size={16} className="text-cyan-400 shrink-0" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="rounded-lg border border-cyan-900/20 bg-black/30 p-2.5 text-center">
                          <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Shift A (Day Shift)
                          </span>
                          <span className="block text-xl font-extrabold text-white">
                            {data.hasMobileData ? card.shiftA.toLocaleString() : "0"}
                          </span>
                          <span className="block text-[9px] text-cyan-400/80 font-mono mt-0.5">
                            {card.total > 0 ? `${((card.shiftA / card.total) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-cyan-900/20 bg-black/30 p-2.5 text-center">
                          <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                            Shift B (Night Shift)
                          </span>
                          <span className="block text-xl font-extrabold text-white">
                            {data.hasMobileData ? card.shiftB.toLocaleString() : "0"}
                          </span>
                          <span className="block text-[9px] text-cyan-400/80 font-mono mt-0.5">
                            {card.total > 0 ? `${((card.shiftB / card.total) * 100).toFixed(1)}%` : "0%"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-cyan-900/30 pt-2 mt-1 px-1 text-xs">
                        <span className="font-semibold text-slate-300">Total {card.title}:</span>
                        <span className="font-extrabold text-white text-sm font-mono">
                          {data.hasMobileData ? card.total.toLocaleString() : "0"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DashboardSummaryCards({ selectedDate }: { selectedDate: string }) {
  return (
    <>
      <StaticSummaryCards selectedDate={selectedDate} />
      <MobileSummaryCards selectedDate={selectedDate} />
    </>
  );
}
