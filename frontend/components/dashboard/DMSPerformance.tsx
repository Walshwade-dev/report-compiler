"use client";

import { useEffect, useState } from "react";
import { getDmsPerformance, isApiConnectionError } from "@/lib/api";
import { UserRound, X, Award, Maximize2 } from "lucide-react";

type DMSStats = {
  name: string;
  team: string;
  charged: number;
  weighed: number;
  chargeRate: number;
  color: string;
};

const COLORS = [
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
];

export function DMSPerformance({ selectedDate }: { selectedDate: string }) {
  const [dmsData, setDmsData] = useState<DMSStats[]>([]);
  const [totalCharged, setTotalCharged] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    async function fetchData() {
      try {
        const performance = await getDmsPerformance(selectedDate);
        if (!active) return;

        const sortedData = performance.rows.map((item, i) => ({
          ...item,
          color: COLORS[i % COLORS.length],
        }));

        setDmsData(sortedData);
        setTotalCharged(performance.totalCharged);
      } catch (err) {
        if (!isApiConnectionError(err)) {
          console.error("Failed to fetch DMS performance data", err);
        }
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (!isModalOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isModalOpen]);

  const topDms = dmsData.slice(0, 3);

  // Total Weighed
  const totalWeighed = dmsData.reduce((acc, curr) => acc + curr.weighed, 0);

  // Generate conic gradient stops using all data (Charged)
  let currentPercentage = 0;
  const gradientStops = dmsData
    .map((dms) => {
      const percentage = totalCharged > 0 ? (dms.charged / totalCharged) * 100 : 0;
      const stop = `${dms.color} ${currentPercentage}% ${currentPercentage + percentage}%`;
      currentPercentage += percentage;
      return stop;
    })
    .join(", ");

  const conicGradient =
    dmsData.length > 0 && totalCharged > 0
      ? `conic-gradient(${gradientStops})`
      : "conic-gradient(#0f2b46 0% 100%)";

  // Generate conic gradient stops using all data (Weighed)
  let currentWeighedPercentage = 0;
  const weighedGradientStops = dmsData
    .map((dms) => {
      const percentage = totalWeighed > 0 ? (dms.weighed / totalWeighed) * 100 : 0;
      const stop = `${dms.color} ${currentWeighedPercentage}% ${currentWeighedPercentage + percentage}%`;
      currentWeighedPercentage += percentage;
      return stop;
    })
    .join(", ");

  const weighedConicGradient =
    dmsData.length > 0 && totalWeighed > 0
      ? `conic-gradient(${weighedGradientStops})`
      : "conic-gradient(#0f2b46 0% 100%)";

  return (
    <>
      <div
        onClick={() => dmsData.length > 0 && setIsModalOpen(true)}
        className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md h-[540px] flex flex-col cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.005] hover:bg-[#0b2135]/80 relative group"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-950 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <UserRound className="text-cyan-400" size={16} />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">DMs Chart Performance</h2>
              <p className="text-[10px] text-slate-400">Mobile team charge rates for {selectedDate || "..."}</p>
            </div>
          </div>

          <div className="text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1">
            <Maximize2 size={14} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 flex-1 min-h-0 justify-between">
          {/* Top: Sliced List */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-2.5">Top Performers</h3>
            {dmsData.length === 0 ? (
              <p className="text-xs text-slate-500">No active mobile charge data.</p>
            ) : (
              <div className="space-y-2">
                {topDms.map((dms, idx) => (
                  <div
                    key={dms.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#071827]/60 border border-cyan-900/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-900 shrink-0"
                        style={{ backgroundColor: dms.color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="text-xs font-semibold text-slate-200 block truncate"
                          title={dms.team}
                        >
                          {dms.name}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate max-w-[120px]">
                          {dms.team.split(" / ").slice(1).join(" / ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{dms.chargeRate.toFixed(1)}%</p>
                      <p className="text-[9px] text-slate-500">of {dms.weighed}</p>
                    </div>
                  </div>
                ))}
                {dmsData.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="w-full text-center py-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider mt-1 border border-dashed border-cyan-950 rounded-lg hover:border-cyan-500/30 bg-[#071827]/30"
                  >
                    View All {dmsData.length} Teams
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Donut Charts - Side by Side */}
          <div className="flex items-center justify-around border-t border-cyan-950/50 pt-3 shrink-0 gap-2">
            {/* Charge Distribution Donut */}
            <div className="flex flex-col items-center">
              <h3 className="text-[9px] font-bold text-cyan-200 uppercase tracking-wider mb-2 text-center">Charge Dist.</h3>
              <div
                className="relative w-24 h-24 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.05)] flex items-center justify-center transition-all duration-300"
                style={{ background: conicGradient }}
              >
                <div className="absolute w-[70px] h-[70px] bg-[#0b2135] rounded-full flex items-center justify-center border border-cyan-950/50 shadow-inner">
                  <div className="text-center">
                    <p className="text-base font-black text-white">{totalCharged}</p>
                    <p className="text-[7px] uppercase font-bold text-slate-400 tracking-wider leading-tight">
                      Total
                      <br />
                      Charged
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weighed Distribution Donut */}
            <div className="flex flex-col items-center">
              <h3 className="text-[9px] font-bold text-cyan-200 uppercase tracking-wider mb-2 text-center">Weighed Dist.</h3>
              <div
                className="relative w-24 h-24 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.05)] flex items-center justify-center transition-all duration-300"
                style={{ background: weighedConicGradient }}
              >
                <div className="absolute w-[70px] h-[70px] bg-[#0b2135] rounded-full flex items-center justify-center border border-cyan-950/50 shadow-inner">
                  <div className="text-center">
                    <p className="text-base font-black text-white">{totalWeighed}</p>
                    <p className="text-[7px] uppercase font-bold text-slate-400 tracking-wider leading-tight">
                      Total
                      <br />
                      Weighed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
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
            <div className="flex items-center justify-between gap-3 border-b border-cyan-900/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="text-cyan-400" size={20} />
                  DMS Performance Leaderboard
                </h3>
                <p className="text-xs text-slate-400">
                  Full list of active DM teams and their charge rates for {selectedDate}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 flex flex-col md:flex-row gap-8 items-center md:items-start custom-scrollbar">
              {/* Leaderboard list */}
              <div className="flex-1 w-full space-y-3">
                <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-2">All Participating Teams</h4>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {dmsData.map((dms, idx) => (
                    <div
                      key={dms.name}
                      className="flex items-center justify-between p-3.5 rounded-lg bg-[#0b2135]/40 border border-cyan-900/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            idx === 0 ? "bg-amber-500 text-slate-950 font-extrabold shadow-md" :
                            idx === 1 ? "bg-slate-300 text-slate-950 font-extrabold shadow-md" :
                            idx === 2 ? "bg-orange-600 text-white font-extrabold shadow-md" :
                            "bg-cyan-950 text-cyan-300 border border-cyan-850"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-white block truncate" title={dms.team}>
                            {dms.name}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">
                            {dms.team}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-cyan-400">{dms.chargeRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">{dms.charged} of {dms.weighed} weighed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Large pie charts side-by-side */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-6 items-center justify-center bg-[#0b2135]/20 p-6 rounded-xl border border-cyan-900/20 shrink-0">
                {/* Charge Distribution */}
                <div className="flex flex-col items-center justify-center">
                  <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-4">Charge Distribution</h4>
                  <div
                    className="relative w-44 h-44 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.08)] flex items-center justify-center"
                    style={{ background: conicGradient }}
                  >
                    <div className="absolute w-28 h-28 bg-[#071827] rounded-full flex items-center justify-center border border-cyan-900/50 shadow-inner">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{totalCharged}</p>
                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                          Total<br />Charged
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weighed Distribution */}
                <div className="flex flex-col items-center justify-center">
                  <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-4">Weighed Distribution</h4>
                  <div
                    className="relative w-44 h-44 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.08)] flex items-center justify-center"
                    style={{ background: weighedConicGradient }}
                  >
                    <div className="absolute w-28 h-28 bg-[#071827] rounded-full flex items-center justify-center border border-cyan-900/50 shadow-inner">
                      <div className="text-center">
                        <p className="text-2xl font-black text-white">{totalWeighed}</p>
                        <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                          Total<br />Weighed
                        </p>
                      </div>
                    </div>
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
