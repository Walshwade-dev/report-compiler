"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import { BarChart3, ShieldAlert, FileText, Scale, Gavel, Bus, Calendar } from "lucide-react";

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
  };
}

function openSelectPicker(select: HTMLSelectElement | null) {
  if (!select || select.disabled) return;

  select.focus();

  try {
    select.showPicker?.();
  } catch {
    // Some browsers only allow the native picker from direct select interaction.
  }
}

function handleSelectButtonClick(
  event: MouseEvent<HTMLElement>,
  select: HTMLSelectElement | null
) {
  if ((event.target as HTMLElement).tagName === "SELECT") return;
  openSelectPicker(select);
}

function useDashboardData(filters?: { staticDate?: string; mobileDate?: string; mobileBound?: string }) {
  const staticDate = filters?.staticDate;
  const mobileDate = filters?.mobileDate;
  const mobileBound = filters?.mobileBound;
  const [data, setData] = useState({
    weighed: 0,
    overloads: 0,
    psvOverloads: 0,
    minGross: 0,
    chargedRedist: "0 / 0",
    reportsGenerated: 0,
    staticDates: [] as string[],
    selectedStaticDate: null as string | null,
    staticByBound: {
      boundA: { ...emptyStaticKpis(), label: "Bound A" },
      boundB: { ...emptyStaticKpis(), label: "Bound B" },
      total: { ...emptyStaticKpis(), label: "Total" },
    },
    mobileWeighed: 0,
    mobileWarned: 0,
    mobileCharged: 0,
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
      try {
        const { getAnalyticsDashboard } = await import("@/lib/api");
        const res = await getAnalyticsDashboard({ staticDate, mobileDate, mobileBound });
        const byBound = res.static.byBound || {};

        if (active) {
          setData({
            weighed: res.static.weighed,
            overloads: res.static.overloads,
            psvOverloads: 0,
            minGross: res.static.minGross,
            chargedRedist: res.static.chargedRedist,
            reportsGenerated: res.static.reportsGenerated,
            staticDates: res.static.dates || [],
            selectedStaticDate: res.static.selectedDate || null,
            staticByBound: {
              boundA: { ...emptyStaticKpis(), label: "Bound A", ...(byBound.boundA || {}) },
              boundB: { ...emptyStaticKpis(), label: "Bound B", ...(byBound.boundB || {}) },
              total: { ...emptyStaticKpis(), label: "Total", ...(byBound.total || {}) },
            },
            mobileWeighed: res.mobile.weighed,
            mobileWarned: res.mobile.warned,
            mobileCharged: res.mobile.charged,
            mobileReports: res.mobile.reports || [],
            selectedMobileReport: res.mobile.selected || null,
            hasStaticData: res.static.reportsGenerated > 0,
            hasMobileData: res.mobile.weighed > 0 || res.mobile.warned > 0 || res.mobile.charged > 0,
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
  }, [mobileBound, mobileDate, staticDate]);

  return { data, isLoading };
}

export function StaticSummaryCards() {
  const [selectedDate, setSelectedDate] = useState("");
  const staticDateSelectRef = useRef<HTMLSelectElement>(null);
  const { data, isLoading } = useDashboardData({ staticDate: selectedDate });
  const effectiveDate = selectedDate || data.selectedStaticDate || "";

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

  const cards = [
    {
      title: "Total Weighed Vehicles",
      metric: staticMetric.weighed,
      change: data.hasStaticData ? effectiveDate : "No active session",
      icon: BarChart3,
      color: "bg-transparent border-cyan-500/30 text-cyan-300 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/10",
    },
    {
      title: "Truck Overloads (No Permit)",
      metric: staticMetric.overloads,
      change: data.hasStaticData ? "Excluded permit holders" : "No active session",
      icon: ShieldAlert,
      color: "bg-transparent border-rose-500/30 text-rose-300 hover:bg-gradient-to-br hover:from-rose-500/20 hover:to-red-500/10",
    },
    {
      title: "PSV Overloads (No Permit)",
      metric: staticMetric.psvOverloads,
      change: "Buses & passenger vehicles",
      icon: Bus,
      color: "bg-transparent border-amber-500/30 text-amber-300 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-orange-500/10",
    },
    {
      title: "Min Gross Overload (Allowed)",
      metric: staticMetric.minGross,
      change: "Within minimal gross margin",
      icon: Scale,
      color: "bg-transparent border-emerald-500/30 text-emerald-300 hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-teal-500/10",
    },
    {
      title: "Charged vs Redistributed",
      metric: staticMetric.chargedRedist,
      change: data.hasStaticData ? "Charged / Redistributed" : "No active session",
      icon: Gavel,
      color: "bg-transparent border-blue-500/30 text-blue-300 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-indigo-500/10",
    },
    {
      title: "Reports Generated",
      metric: staticMetric.reportsGenerated,
      change: data.hasStaticData ? "Unique reports for date" : "No active session",
      icon: FileText,
      color: "bg-transparent border-purple-500/30 text-purple-300 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-indigo-500/10",
    },
  ];

  function formatMetric(value: number | string) {
    return typeof value === "number" ? value.toLocaleString() : value;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">Static Report KPIs</h2>
        <label
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-900/60 bg-[#071827]/80 px-2 py-1.5"
          onClick={(event) => handleSelectButtonClick(event, staticDateSelectRef.current)}
        >
          <Calendar size={13} className="shrink-0 text-cyan-400" />
          <select
            ref={staticDateSelectRef}
            value={effectiveDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            disabled={data.staticDates.length === 0}
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {data.staticDates.length === 0 ? (
              <option value="">No Dates</option>
            ) : (
              data.staticDates.map((date) => (
                <option key={date} value={date} className="bg-[#071827] text-white">
                  {date}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`loading-static-${i}`}
                className="relative flex min-h-[100px] flex-col justify-between overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/50 p-3 shadow-lg backdrop-blur-md"
              >
                <div className="h-3 w-20 animate-pulse rounded bg-slate-700/80" />
                <div className="mt-4 h-6 w-16 animate-pulse rounded bg-slate-700/80" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-800/80" />
              </div>
            ))
          : cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={`static-${i}`}
                  tabIndex={0}
                  className={`group relative flex min-h-[126px] flex-col justify-between overflow-hidden rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${card.color}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                      {card.title}
                    </span>
                    <Icon size={14} className="opacity-80 shrink-0" />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {[
                      [staticLabels.boundA, card.metric.boundA],
                      [staticLabels.boundB, card.metric.boundB],
                      [staticLabels.total, card.metric.total],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0 rounded-md border border-white/10 bg-black/10 px-1.5 py-1">
                        <span
                          className="block truncate text-[8px] font-bold uppercase text-slate-500"
                          title={String(label)}
                        >
                          {label}
                        </span>
                        <span className="block origin-left truncate text-sm font-extrabold tracking-tight text-white transition-transform duration-200 group-hover:scale-110 group-focus-within:scale-110 sm:text-base">
                          {data.hasStaticData ? formatMetric(value) : "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="mt-0.5 text-[9px] text-slate-400 font-medium truncate" title={card.change}>
                      {card.change}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export function MobileSummaryCards() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBound, setSelectedBound] = useState("");
  const mobileDateSelectRef = useRef<HTMLSelectElement>(null);
  const mobileBoundSelectRef = useRef<HTMLSelectElement>(null);
  const { data, isLoading } = useDashboardData({
    mobileDate: selectedDate,
    mobileBound: selectedBound,
  });

  const effectiveDate = selectedDate || data.selectedMobileReport?.date || "";
  const effectiveBound = selectedBound || data.selectedMobileReport?.bound || "";

  const availableDates = Array.from(
    new Set(data.mobileReports.map((report) => report.date))
  );
  const availableBounds = data.mobileReports.filter(
    (report) => !effectiveDate || report.date === effectiveDate
  );
  const selectedLabel =
    data.selectedMobileReport?.label ||
    (effectiveDate && effectiveBound
      ? `${effectiveDate} - ${effectiveBound === "mobile_2" ? "Mobile 2" : "Mobile 1"}`
      : "No mobile session");

  function handleDateChange(date: string) {
    setSelectedDate(date);
    const nextBound =
      data.mobileReports.find((report) => report.date === date)?.bound || "";
    setSelectedBound(nextBound);
  }

  const cards = [
    {
      title: "Mobile Weighed",
      value: data.hasMobileData ? data.mobileWeighed.toLocaleString() : "0",
      change: data.hasMobileData ? selectedLabel : "No mobile session",
      icon: Scale,
      color: "bg-transparent border-sky-500/30 text-sky-300 hover:bg-gradient-to-br hover:from-sky-500/20 hover:to-cyan-500/10",
    },
    {
      title: "Mobile Warned",
      value: data.hasMobileData ? data.mobileWarned.toLocaleString() : "0",
      change: data.hasMobileData ? "Warned trucks" : "No mobile session",
      icon: ShieldAlert,
      color: "bg-transparent border-amber-500/30 text-amber-300 hover:bg-gradient-to-br hover:from-amber-500/20 hover:to-yellow-500/10",
    },
    {
      title: "Mobile Charged",
      value: data.hasMobileData ? data.mobileCharged.toLocaleString() : "0",
      change: data.hasMobileData ? "Charged trucks" : "No mobile session",
      icon: Gavel,
      color: "bg-transparent border-rose-500/30 text-rose-300 hover:bg-gradient-to-br hover:from-rose-500/20 hover:to-red-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">Mobile Report KPIs</h2>
        <div className="grid grid-cols-1 gap-2">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-900/60 bg-[#071827]/80 px-2 py-1.5"
            onClick={(event) => handleSelectButtonClick(event, mobileDateSelectRef.current)}
          >
            <Calendar size={13} className="shrink-0 text-cyan-400" />
            <select
              ref={mobileDateSelectRef}
              value={effectiveDate}
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={data.mobileReports.length === 0}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {availableDates.length === 0 ? (
                <option value="">No Dates</option>
              ) : (
                availableDates.map((date) => (
                  <option key={date} value={date} className="bg-[#071827] text-white">
                    {date}
                  </option>
                ))
              )}
            </select>
          </label>

          <label
            className="flex cursor-pointer rounded-lg border border-cyan-900/60 bg-[#071827]/80 px-2 py-1.5"
            onClick={(event) => handleSelectButtonClick(event, mobileBoundSelectRef.current)}
          >
            <select
              ref={mobileBoundSelectRef}
              value={effectiveBound}
              onChange={(event) => setSelectedBound(event.target.value)}
              disabled={availableBounds.length === 0}
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {availableBounds.length === 0 ? (
                <option value="">No Mobile Report</option>
              ) : (
                availableBounds.map((report) => (
                  <option key={`${report.date}-${report.bound}`} value={report.bound}>
                    {report.bound_label}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 flex-1">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`loading-mobile-${i}`}
                className="relative flex min-h-[100px] flex-col justify-between overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 shadow-lg backdrop-blur-md"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-slate-700/80" />
                <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-700/80" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-800/80" />
              </div>
            ))
          : cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={`mobile-${i}`}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] min-h-[100px] ${card.color}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">
                      {card.title}
                    </span>
                    <Icon size={16} className="opacity-80 shrink-0" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white block">
                      {card.value}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-400 font-medium truncate" title={card.change}>
                      {card.change}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export function DashboardSummaryCards() {
  return (
    <>
      <StaticSummaryCards />
      <MobileSummaryCards />
    </>
  );
}
