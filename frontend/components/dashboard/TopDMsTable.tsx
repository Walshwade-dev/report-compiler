"use client";

import { useEffect, useState } from "react";
import { getDmsPerformance, isApiConnectionError } from "@/lib/api";
import { Download, Trophy } from "lucide-react";

type DMSTableRow = {
  name: string;
  surname: string;
  team: string;
  drivers: string[];
  weighed: number;
  charged: number;
  chargeRate: number;
  monthCharged: number;
};

export function TopDMsTable() {
  const [data, setData] = useState<DMSTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const performance = await getDmsPerformance();
        if (!active) return;

        setData(performance.rows);
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

  function csvCell(value: string | number) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function handleDownload() {
    if (data.length === 0) return;

    const headers = [
      "Rank",
      "DM Name",
      "Team",
      "Weighed",
      "Charged",
      "Charge Rate",
      "Month Charged",
    ];
    const rows = data.map((row, index) => [
      index + 1,
      row.name,
      row.team,
      row.weighed,
      row.charged,
      `${row.chargeRate.toFixed(1)}%`,
      row.monthCharged,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = "dms_performance.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-cyan-950 pb-4 mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <div>
            <h2 className="text-lg font-bold text-white">DMs Performance Table</h2>
            <p className="text-xs text-slate-400">Charge records by DM-led mobile team</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={data.length === 0}
          className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#071827]/70 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-40"
          title="Download CSV"
        >
          <Download size={15} />
        </button>
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
                  <th className="px-3 py-3 font-semibold rounded-tl-lg">DM Name</th>
                  <th className="px-3 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 font-semibold text-right">Weighed</th>
                  <th className="px-3 py-3 font-semibold text-right">Charged</th>
                  <th className="px-3 py-3 font-semibold text-right">Rate</th>
                  <th className="px-3 py-3 font-semibold text-right rounded-tr-lg whitespace-nowrap">Month Charged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900/30">
                {data.map((row, i) => (
                  <tr key={row.name} className="hover:bg-[#071827]/40 transition-colors">
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
                        <span className="font-semibold text-white" title={row.name}>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-400">
                      <span className="block max-w-[180px] truncate" title={row.team}>{row.team}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{row.weighed.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-cyan-400">{row.charged.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold text-white">{row.chargeRate.toFixed(1)}%</td>
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
