"use client";

import { useEffect, useState } from "react";
import { getDmsPerformance, isApiConnectionError } from "@/lib/api";
import { UserRound, Calendar, X, Award } from "lucide-react";

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

export function DMSPerformance() {
  const [dmsData, setDmsData] = useState<DMSStats[]>([]);
  const [totalCharged, setTotalCharged] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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

  // Generate conic gradient stops using all data
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

  return (
    <>
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950 pb-4 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <UserRound className="text-cyan-400" size={20} />
            <div>
              <h2 className="text-lg font-bold text-white">DMS Performance Tracker</h2>
              <p className="text-xs text-slate-400">Mobile report charge rates per DM team</p>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-[#071827]/80 border border-cyan-900/60 rounded-lg px-3 py-1.5 self-start sm:self-auto">
            <Calendar className="text-cyan-400 shrink-0" size={14} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 flex-1 justify-between">
          {/* Top: Sliced List */}
          <div className="flex-1 min-h-0">
            <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-4">Top Performers</h3>
            {dmsData.length === 0 ? (
              <p className="text-sm text-slate-500">No active mobile charge data available.</p>
            ) : (
              <div className="space-y-3">
                {topDms.map((dms, idx) => (
                  <div
                    key={dms.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#071827]/60 border border-cyan-900/30 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 shrink-0"
                        style={{ backgroundColor: dms.color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="text-sm font-semibold text-slate-200 block truncate"
                          title={dms.team}
                        >
                          {dms.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                          {dms.team.split(" / ").slice(1).join(" / ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{dms.chargeRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">of {dms.weighed} weighed</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {dms.charged} charged
                      </p>
                    </div>
                  </div>
                ))}
                {dmsData.length > 3 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full text-center py-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider mt-2 border border-dashed border-cyan-950 rounded-lg hover:border-cyan-500/30 bg-[#071827]/30"
                  >
                    View All {dmsData.length} Teams
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Pie Chart - Proportional Sizing */}
          <div className="flex flex-col items-center justify-center border-t border-cyan-950/50 pt-4 shrink-0">
            <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-3">Charge Distribution</h3>
            <div
              className="relative w-36 h-36 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.05)] flex items-center justify-center transition-all duration-500 cursor-pointer hover:scale-105"
              style={{ background: conicGradient }}
              onClick={() => dmsData.length > 0 && setIsModalOpen(true)}
            >
              {/* Inner hole for donut style */}
              <div className="absolute w-24 h-24 bg-[#0b2135] rounded-full flex items-center justify-center border border-cyan-950/50 shadow-inner">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalCharged}</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Total
                    <br />
                    Charged
                  </p>
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
            className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
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

              {/* Large pie chart */}
              <div className="w-full md:w-80 flex flex-col items-center justify-center bg-[#0b2135]/20 p-6 rounded-xl border border-cyan-900/20 shrink-0">
                <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-6">Charge Distribution</h4>
                <div
                  className="relative w-56 h-56 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.08)] flex items-center justify-center"
                  style={{ background: conicGradient }}
                >
                  <div className="absolute w-36 h-36 bg-[#071827] rounded-full flex items-center justify-center border border-cyan-900/50 shadow-inner">
                    <div className="text-center">
                      <p className="text-4xl font-black text-white">{totalCharged}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                        Total<br />Charged
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 mt-8 w-full text-xs">
                  {dmsData.slice(0, 4).map((dms) => (
                    <div key={dms.name} className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dms.color }} />
                      <span className="text-slate-300 truncate" title={dms.name}>{dms.name.split(" ").pop()}</span>
                      <span className="text-slate-500 font-bold ml-auto">{((dms.charged / (totalCharged || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  {dmsData.length > 4 && (
                    <div className="flex items-center gap-2 col-span-2 text-slate-500 italic justify-center mt-2 border-t border-cyan-950 pt-2">
                      + {dmsData.length - 4} more teams represented
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
