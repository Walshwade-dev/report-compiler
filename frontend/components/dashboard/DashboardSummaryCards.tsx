"use client";

import { useState, useEffect } from "react";
import { BarChart3, ShieldAlert, FileText, Scale, Gavel, Bus } from "lucide-react";
export function DashboardSummaryCards() {
  const [data, setData] = useState({
    weighed: 0,
    overloads: 0,
    psvOverloads: 0,
    minGross: 0,
    chargedRedist: "0 / 0",
    reportsGenerated: 0,
    mobileWeighed: 0,
    mobileWarned: 0,
    mobileCharged: 0,
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
        const res = await getAnalyticsDashboard();

        if (active) {
          setData({
            weighed: res.static.weighed,
            overloads: res.static.overloads,
            psvOverloads: 0,
            minGross: res.static.minGross,
            chargedRedist: res.static.chargedRedist,
            reportsGenerated: res.static.reportsGenerated,
            mobileWeighed: res.mobile.weighed,
            mobileWarned: res.mobile.warned,
            mobileCharged: res.mobile.charged,
            hasStaticData: res.static.reportsGenerated > 0,
            hasMobileData: res.mobile.weighed > 0 || res.mobile.warned > 0 || res.mobile.charged > 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard summary cards", err);
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
  }, []);

  const cards = [
    {
      title: "Total Weighed Vehicles",
      value: data.hasStaticData ? data.weighed.toLocaleString() : "0",
      change: data.hasStaticData ? "All active sessions" : "No active session",
      icon: BarChart3,
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
    },
    {
      title: "Truck Overloads (No Permit)",
      value: data.hasStaticData ? data.overloads.toLocaleString() : "0",
      change: data.hasStaticData ? "Excluded permit holders" : "No active session",
      icon: ShieldAlert,
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
    },
    {
      title: "PSV Overloads (No Permit)",
      value: data.hasStaticData ? data.psvOverloads.toLocaleString() : "0",
      change: "Buses & passenger vehicles",
      icon: Bus,
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300",
    },
    {
      title: "Min Gross Overload (Allowed)",
      value: data.hasStaticData ? data.minGross.toLocaleString() : "0",
      change: "Within minimal gross margin",
      icon: Scale,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    },
    {
      title: "Charged vs Redistributed",
      value: data.hasStaticData ? data.chargedRedist : "0 / 0",
      change: data.hasStaticData ? `${data.chargedRedist.split(" / ")[0]} Charged, ${data.chargedRedist.split(" / ")[1]} Redistributed` : "No active session",
      icon: Gavel,
      color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300",
    },
    {
      title: "Reports Generated",
      value: data.hasStaticData ? data.reportsGenerated.toString() : "0",
      change: "All active sessions",
      icon: FileText,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300",
    },
    {
      title: "Mobile Weighed",
      value: data.hasMobileData ? data.mobileWeighed.toLocaleString() : "0",
      change: data.hasMobileData ? "All mobile sessions" : "No mobile session",
      icon: Scale,
      color: "from-sky-500/20 to-cyan-500/10 border-sky-500/30 text-sky-300",
    },
    {
      title: "Mobile Warned",
      value: data.hasMobileData ? data.mobileWarned.toLocaleString() : "0",
      change: data.hasMobileData ? "Warned trucks" : "No mobile session",
      icon: ShieldAlert,
      color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300",
    },
    {
      title: "Mobile Charged",
      value: data.hasMobileData ? data.mobileCharged.toLocaleString() : "0",
      change: data.hasMobileData ? "Charged trucks" : "No mobile session",
      icon: Gavel,
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
    },
  ];

  const staticCards = cards.slice(0, 6);
  const mobileCards = cards.slice(6, 9);

  return (
    <>
      {/* Column 1: Static Report KPIs */}
      <div className="flex flex-col gap-4 h-full">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">Static Report KPIs</h2>
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
            : staticCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={`static-${i}`}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br p-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] min-h-[100px] ${card.color}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                        {card.title}
                      </span>
                      <Icon size={14} className="opacity-80 shrink-0" />
                    </div>
                    <div className="mt-2">
                      <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white block">
                        {card.value}
                      </span>
                      <p className="mt-0.5 text-[9px] text-slate-400 font-medium truncate" title={card.change}>
                        {card.change}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Column 2: Mobile Report KPIs */}
      <div className="flex flex-col gap-4 h-full">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">Mobile Report KPIs</h2>
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
            : mobileCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={`mobile-${i}`}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] min-h-[100px] ${card.color}`}
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
    </>
  );
}
