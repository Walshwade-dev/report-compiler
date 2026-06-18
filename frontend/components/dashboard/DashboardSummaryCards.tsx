"use client";

import { useState, useEffect } from "react";
import { BarChart3, ShieldAlert, FileText, Scale, Gavel, Bus } from "lucide-react";
import { getSummaryCards } from "@/lib/api";

export function DashboardSummaryCards() {
  const [data, setData] = useState({
    weighed: 0,
    overloads: 0,
    psvOverloads: 0,
    minGross: 0,
    chargedRedist: "0 / 0",
    reportsGenerated: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeReportId = localStorage.getItem("active-report-id");
    if (!activeReportId) return;

    let active = true;
    async function fetchData() {
      try {
        const res = await getSummaryCards(activeReportId as string);
        if (!active) return;

        const hasUploadData = (res.x_total || 0) > 0 || (res.y_total || 0) > 0;

        if (hasUploadData) {
          setData({
            weighed: res.x_total || 0,
            overloads: Math.max((res.y_total || 0) - (res.g_total || 0), 0),
            psvOverloads: 0,
            minGross: res.g_total || 0,
            chargedRedist: `${res.z_total || 0} / ${res.r_total || 0}`,
            reportsGenerated: 1,
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard summary cards", err);
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
      value: data.weighed ? data.weighed.toLocaleString() : "0",
      change: data.weighed ? "From active session" : "No active session",
      icon: BarChart3,
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
    },
    {
      title: "Truck Overloads (No Permit)",
      value: data.overloads ? data.overloads.toLocaleString() : "0",
      change: data.overloads ? "Excluded permit holders" : "No active session",
      icon: ShieldAlert,
      color: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-300",
    },
    {
      title: "PSV Overloads (No Permit)",
      value: data.psvOverloads ? data.psvOverloads.toLocaleString() : "0",
      change: "Buses & passenger vehicles",
      icon: Bus,
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300",
    },
    {
      title: "Min Gross Overload (Allowed)",
      value: data.minGross ? data.minGross.toLocaleString() : "0",
      change: "Within minimal gross margin",
      icon: Scale,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    },
    {
      title: "Charged vs Redistributed",
      value: data.chargedRedist,
      change: data.weighed ? `${data.chargedRedist.split(" / ")[0]} Charged, ${data.chargedRedist.split(" / ")[1]} Redistributed` : "No active session",
      icon: Gavel,
      color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-300",
    },
    {
      title: "Reports Generated",
      value: data.reportsGenerated.toString(),
      change: "In active workspace",
      icon: FileText,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <Icon size={20} className="opacity-80" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {card.value}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400 font-medium">
              {card.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
