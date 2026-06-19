"use client";

import { useEffect, useState } from "react";
import { getReportSessions } from "@/lib/api";
import { UserRound } from "lucide-react";

type DMSStats = {
  name: string;
  charged: number;
  weighed: number;
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

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const sessions = await getReportSessions();
        if (!active) return;

        const statsMap = new Map<string, DMSStats>();
        let total = 0;

        for (const session of sessions) {
          const mobileReport = session.sections?.mobile_report;
          const extra = (session.manual_inputs as { extra?: { mobile_report?: { danka_staff?: string } } })?.extra;
          const dankaStaff = extra?.mobile_report?.danka_staff;

          if (mobileReport?.summary && dankaStaff) {
            const charged = mobileReport.summary.charged_trucks || 0;
            const weighed = mobileReport.summary.total_trucks_weighed || 0;

            const nameKey = dankaStaff.trim();
            
            if (charged > 0 || weighed > 0) {
              const existing = statsMap.get(nameKey) || { name: nameKey, charged: 0, weighed: 0, color: "" };
              existing.charged += charged;
              existing.weighed += weighed;
              statsMap.set(nameKey, existing);
              total += charged;
            }
          }
        }

        const sortedData = Array.from(statsMap.values())
          .sort((a, b) => b.charged - a.charged)
          .map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));

        setDmsData(sortedData);
        setTotalCharged(total);
      } catch (err) {
        console.error("Failed to fetch DMS performance data", err);
      }
    }
    fetchData();
    return () => { active = false; };
  }, []);

  let currentPercentage = 0;
  const gradientStops = dmsData.map(dms => {
    const percentage = totalCharged > 0 ? (dms.charged / totalCharged) * 100 : 0;
    const stop = `${dms.color} ${currentPercentage}% ${currentPercentage + percentage}%`;
    currentPercentage += percentage;
    return stop;
  }).join(", ");

  const conicGradient = dmsData.length > 0 && totalCharged > 0 
    ? `conic-gradient(${gradientStops})` 
    : "conic-gradient(#0f2b46 0% 100%)";

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-cyan-950 pb-4 mb-6 shrink-0">
        <UserRound className="text-cyan-400" size={20} />
        <div>
          <h2 className="text-lg font-bold text-white">DMS Performance Tracker</h2>
          <p className="text-xs text-slate-400">Mobile report charge rates per Danka Staff</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 flex-1 justify-between">
        {/* Top: List */}
        <div className="flex-1 min-h-0">
          <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-4">Charge Records</h3>
          {dmsData.length === 0 ? (
            <p className="text-sm text-slate-500">No active mobile charge data available.</p>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              {dmsData.map((dms) => (
                <div key={dms.name} className="flex items-center justify-between p-3 rounded-lg bg-[#071827]/60 border border-cyan-900/30 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dms.color }} />
                    <span className="text-sm font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[180px]" title={dms.name}>{dms.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{dms.charged} Charged</p>
                    <p className="text-xs text-slate-500">of {dms.weighed} weighed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: Pie Chart */}
        <div className="flex flex-col items-center justify-center border-t border-cyan-950/50 pt-6 shrink-0">
           <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-4">Charge Distribution</h3>
           <div className="relative w-48 h-48 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.05)] flex items-center justify-center transition-all duration-500" style={{ background: conicGradient }}>
             {/* Inner hole for donut style */}
             <div className="absolute w-32 h-32 bg-[#0b2135] rounded-full flex items-center justify-center border border-cyan-950/50 shadow-inner">
               <div className="text-center">
                 <p className="text-3xl font-black text-white">{totalCharged}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total<br/>Charged</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
