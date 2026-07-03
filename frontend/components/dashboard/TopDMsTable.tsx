"use client";

import { useEffect, useState } from "react";
import { getReportSessions, isApiConnectionError } from "@/lib/api";
import { Trophy } from "lucide-react";

type DMSTableRow = {
  surname: string;
  weighed: number;
  charged: number;
  monthCharged: number;
};

export function TopDMsTable() {
  const [data, setData] = useState<DMSTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const sessions = await getReportSessions();
        if (!active) return;

        const statsMap = new Map<string, DMSTableRow>();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        for (const session of sessions) {
          const mobileReport = session.sections?.mobile_report;
          const extra = (session.manual_inputs as { extra?: { mobile_report?: { danka_staff?: string } } })?.extra;
          const dankaStaff = extra?.mobile_report?.danka_staff;

          if (mobileReport?.summary && dankaStaff) {
            const charged = mobileReport.summary.charged_trucks || 0;
            const weighed = mobileReport.summary.total_trucks_weighed || 0;
            
            let isCurrentMonth = false;
            if (mobileReport.summary.report_date) {
              const rDate = new Date(mobileReport.summary.report_date);
              if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                isCurrentMonth = true;
              }
            }

            const surname = dankaStaff.trim().split(" ").pop() || dankaStaff.trim();
            const existing = statsMap.get(surname) || { surname, weighed: 0, charged: 0, monthCharged: 0 };
            
            existing.weighed += weighed;
            existing.charged += charged;
            if (isCurrentMonth) {
              existing.monthCharged += charged;
            }
            
            statsMap.set(surname, existing);
          }
        }

        const sortedData = Array.from(statsMap.values())
          .sort((a, b) => b.charged - a.charged);

        setData(sortedData);
      } catch (err) {
        if (!isApiConnectionError(err)) {
          console.error("Failed to fetch top DMs", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, []);

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-cyan-950 pb-4 mb-6 shrink-0">
        <Trophy className="text-amber-400" size={20} />
        <div>
          <h2 className="text-lg font-bold text-white">DMs Performance Table</h2>
          <p className="text-xs text-slate-400">Charge records across all staff</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-500 text-sm">Loading...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-500 text-sm">No data available</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-cyan-200 uppercase tracking-wider bg-cyan-950/20 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-3 py-3 font-semibold rounded-tl-lg">DM Surname</th>
                  <th className="px-3 py-3 font-semibold text-right">Weighed</th>
                  <th className="px-3 py-3 font-semibold text-right">Charged</th>
                  <th className="px-3 py-3 font-semibold text-right rounded-tr-lg whitespace-nowrap">Month Charged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900/30">
                {data.map((row, i) => (
                  <tr key={row.surname} className="hover:bg-[#071827]/40 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-400/30' :
                          i === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                          'bg-cyan-900/30 text-cyan-500 border border-cyan-800/30'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="font-semibold text-white">{row.surname}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{row.weighed.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-cyan-400">{row.charged.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium text-emerald-400">{row.monthCharged.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
