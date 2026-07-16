"use client";

import { useEffect, useState } from "react";
import { getDmsPerformance, isApiConnectionError } from "@/lib/api";
import { Download, Trophy, Calendar, X, Eye } from "lucide-react";

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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      try {
        const performance = await getDmsPerformance(selectedDate);
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
    element.download = `dms_performance_${selectedDate.replace(/-/g, "")}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-[560px] max-h-[560px] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950 pb-4 mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            <div>
              <h2 className="text-lg font-bold text-white">DMs Performance Table</h2>
              <p className="text-xs text-slate-400">Charge records by DM-led mobile team</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-[#071827]/80 border border-cyan-900/60 rounded-lg px-2.5 py-1.5">
              <Calendar className="text-cyan-400 shrink-0" size={13} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer [color-scheme:dark] w-24"
              />
            </div>

            {/* View Full Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={data.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#071827]/70 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-40"
              title="Expand View"
            >
              <Eye size={15} />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={data.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#071827]/70 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-40"
              title="Download CSV"
            >
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20"></div>
                <div className="absolute inset-0 rounded-full border border-t-cyan-400 animate-spin"></div>
              </div>
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
                    <tr
                      key={row.name}
                      onClick={() => setIsModalOpen(true)}
                      className="hover:bg-[#071827]/60 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              i === 0
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : i === 1
                                ? "bg-slate-300/20 text-slate-300 border border-slate-400/30"
                                : i === 2
                                ? "bg-orange-700/20 text-orange-400 border border-orange-700/30"
                                : "bg-cyan-900/30 text-cyan-500 border border-cyan-800/30"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-semibold text-white" title={row.name}>
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-400">
                        <span className="block max-w-[140px] truncate" title={row.team}>
                          {row.team}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{row.weighed.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-bold text-cyan-400">{row.charged.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right font-bold text-white">{row.chargeRate.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right font-medium text-emerald-400">
                        {row.monthCharged.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Modal View */}
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
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-400" size={22} />
                <div>
                  <h3 className="text-lg font-bold text-white">Full DMS Performance Leaderboard</h3>
                  <p className="text-xs text-slate-400">
                    Detailed statistics for all participating DMS teams up to {selectedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 px-3 py-2 text-xs font-bold text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                  title="Download CSV"
                >
                  <Download size={14} />
                  Download CSV
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content - Wide Table */}
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <div className="overflow-x-auto rounded-xl border border-cyan-950 bg-[#0b2135]/20 shadow-inner">
                <table className="w-full text-left text-sm text-slate-300 border-collapse">
                  <thead className="text-xs text-cyan-200 uppercase tracking-wider bg-cyan-950/40 sticky top-0 backdrop-blur-sm z-10 border-b border-cyan-900/40">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Rank</th>
                      <th className="px-4 py-4 font-semibold">DM Name</th>
                      <th className="px-4 py-4 font-semibold">DM Team (Drivers)</th>
                      <th className="px-4 py-4 font-semibold text-right">Weighed Vehicles</th>
                      <th className="px-4 py-4 font-semibold text-right">Charged Vehicles</th>
                      <th className="px-4 py-4 font-semibold text-right">Charge Rate</th>
                      <th className="px-4 py-4 font-semibold text-right">Monthly Total Charged</th>
                      <th className="px-4 py-4 font-semibold text-right">Reports Built</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {data.map((row, i) => (
                      <tr key={row.name} className="hover:bg-[#071827]/70 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              i === 0
                                ? "bg-amber-500 text-slate-950 font-extrabold shadow-md"
                                : i === 1
                                ? "bg-slate-300 text-slate-950 font-extrabold shadow-md"
                                : i === 2
                                ? "bg-orange-600 text-white font-extrabold shadow-md"
                                : "bg-cyan-950 text-cyan-400 border border-cyan-850"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-white">{row.name}</td>
                        <td className="px-4 py-3.5 text-slate-400 font-medium">{row.team}</td>
                        <td className="px-4 py-3.5 text-right font-medium">{row.weighed.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-cyan-400">{row.charged.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-white bg-cyan-950/10">
                          {row.chargeRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                          {row.monthCharged.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-500 font-bold">{row.monthCharged > 0 ? Math.ceil(row.monthCharged / (row.charged || 1) * row.monthCharged) : row.monthCharged}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
