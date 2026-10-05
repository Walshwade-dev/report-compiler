"use client";

import { useEffect, useState } from "react";
import { getDmsPerformance, isApiConnectionError } from "@/lib/api";
import { UserRound, X, Award, Maximize2 } from "lucide-react";
import { DonutChart3D, type DonutSlice } from "./DonutChart3D";

type DMSStats = {
  name: string;
  team: string;
  charged: number;
  weighed: number;
  chargeRate: number;
  color: string;
};

const PALETTE: [string, string][] = [
  ["#22d3ee", "#0891b2"], // cyan
  ["#38bdf8", "#0284c7"], // sky blue
  ["#818cf8", "#4f46e5"], // indigo
  ["#60a5fa", "#2563eb"], // blue
  ["#34d399", "#059669"], // emerald (for a slight pop, but still cool)
  ["#a78bfa", "#7c3aed"], // violet
];
const OTHERS_COLORS: [string, string] = ["#94a3b8", "#475569"];
const MAX_SLICES = 5;

export function DMSPerformance({ selectedDate, station }: { selectedDate: string; station?: string | null }) {
  const [dmsData, setDmsData] = useState<DMSStats[]>([]);
  const [totalCharged, setTotalCharged] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataDate, setDataDate] = useState<string>("");
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const performance = await getDmsPerformance(selectedDate || undefined, station || undefined);
        if (!active) return;

        const sortedData = (performance.rows || []).map((item, i) => ({
          ...item,
          color: PALETTE[i % PALETTE.length][0],
        }));

        setDmsData(sortedData);
        setTotalCharged(performance.totalCharged || 0);
        if (performance.selectedDate) {
          setDataDate(performance.selectedDate);
        }
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
  }, [selectedDate, station]);

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

  const shortName = (name: string) => name.replace(/^DM\s+/i, "");

  // Each team keeps the same gradient in both donuts, the list and the modal.
  const buildSlices = (
    metric: "charged" | "weighed",
    grandTotal: number,
    withBadges = false,
  ): DonutSlice[] => {
    const ranked = dmsData
      .map((dms, index) => ({ dms, index }))
      .filter(({ dms }) => dms[metric] > 0)
      .sort((a, b) => b.dms[metric] - a.dms[metric]);

    const toSlice = ({ dms, index }: { dms: DMSStats; index: number }): DonutSlice => {
      let badge: string | undefined;
      if (withBadges && totalCharged > 0 && totalWeighed > 0) {
        const ratio = dms.charged / totalCharged / (dms.weighed / totalWeighed || 1);
        if (dms.charged > 0 && ratio >= 1.2) badge = `${ratio.toFixed(1)}× workload`;
        else if (dms.charged > 0 && ratio <= 0.8) badge = `${ratio.toFixed(1)}× workload`;
      }
      return {
        key: dms.name,
        label: shortName(dms.name),
        value: dms[metric],
        sub: metric === "charged" ? `${dms.charged} of ${dms.weighed} weighed` : `${dms.weighed} weighed`,
        badge,
        colors: PALETTE[index % PALETTE.length],
      };
    };

    if (ranked.length <= MAX_SLICES) return ranked.map(toSlice);

    const head = ranked.slice(0, MAX_SLICES - 1).map(toSlice);
    const rest = ranked.slice(MAX_SLICES - 1);
    const restValue = rest.reduce((acc, { dms }) => acc + dms[metric], 0);
    if (grandTotal <= 0) return head;
    return [
      ...head,
      {
        key: "__others__",
        label: `Others (${rest.length})`,
        value: restValue,
        sub: `${restValue} ${metric}`,
        colors: OTHERS_COLORS,
      },
    ];
  };

  const chargeSlices = buildSlices("charged", totalCharged);
  const chargeSlicesLarge = buildSlices("charged", totalCharged, true);
  const weighedSlices = buildSlices("weighed", totalWeighed);

  const ariaFor = (title: string, slices: DonutSlice[], total: number) =>
    total > 0
      ? `${title}: ${slices.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}`
      : `${title}: no data`;
  const chargeAria = ariaFor("Charge distribution", chargeSlices, totalCharged);
  const weighedAria = ariaFor("Weighed distribution", weighedSlices, totalWeighed);

  const isDifferentDate = Boolean(dataDate && selectedDate && dataDate !== selectedDate);

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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200">DMs Chart Performance</h2>
                {isDifferentDate && (
                  <span className="text-[8px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                    {dataDate} (Prior Period)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isDifferentDate
                  ? `Active mobile team rates from ${dataDate} (Filter: ${selectedDate})`
                  : `Mobile team charge rates for ${selectedDate || "..."}`}
              </p>
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

          {/* Bottom: 3D Donut Charts - Side by Side */}
          <div className="flex items-start justify-around border-t border-cyan-950/50 pt-3 shrink-0 gap-2">
            <div className="flex flex-col items-center">
              <h3 className="text-[9px] font-bold text-cyan-200 uppercase tracking-wider mb-1 text-center">
                Charge Dist. <span className="text-slate-400">· {totalCharged}</span>
              </h3>
              <DonutChart3D
                size="sm"
                slices={chargeSlices}
                total={totalCharged}
                hovered={hoveredTeam}
                onHover={setHoveredTeam}
                emptyText="No charges recorded"
                ariaLabel={chargeAria}
              />
            </div>

            <div className="flex flex-col items-center">
              <h3 className="text-[9px] font-bold text-cyan-200 uppercase tracking-wider mb-1 text-center">
                Weighed Dist. <span className="text-slate-400">· {totalWeighed}</span>
              </h3>
              <DonutChart3D
                size="sm"
                slices={weighedSlices}
                total={totalWeighed}
                hovered={hoveredTeam}
                onHover={setHoveredTeam}
                emptyText="Nothing weighed"
                ariaLabel={weighedAria}
              />
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="text-cyan-400" size={20} />
                    DMS Performance Leaderboard
                  </h3>
                  {isDifferentDate && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      Data from {dataDate} (Prior Period)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isDifferentDate
                    ? `Full list of active DM teams and charge rates from ${dataDate} (Filter: ${selectedDate})`
                    : `Full list of active DM teams and their charge rates for ${selectedDate}`}
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
                      onMouseEnter={() => setHoveredTeam(dms.name)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      className={`flex items-center justify-between p-3.5 rounded-lg bg-[#0b2135]/40 border transition-colors ${
                        hoveredTeam === dms.name ? "border-cyan-400/70 bg-[#0b2135]/80" : "border-cyan-900/30"
                      }`}
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

              {/* Large 3D donut charts, stacked so callouts have room */}
              <div className="w-full md:w-auto flex flex-col gap-8 items-center justify-center bg-[#0b2135]/20 p-6 rounded-xl border border-cyan-900/20 shrink-0">
                <div className="flex flex-col items-center justify-center">
                  <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-4">Charge Distribution</h4>
                  <DonutChart3D
                    size="lg"
                    slices={chargeSlicesLarge}
                    total={totalCharged}
                    hovered={hoveredTeam}
                    onHover={setHoveredTeam}
                    centerLabel="Charged"
                    emptyText="No charges recorded for this period."
                    ariaLabel={chargeAria}
                  />
                </div>

                <div className="flex flex-col items-center justify-center">
                  <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider mb-4">Weighed Distribution</h4>
                  <DonutChart3D
                    size="lg"
                    slices={weighedSlices}
                    total={totalWeighed}
                    hovered={hoveredTeam}
                    onHover={setHoveredTeam}
                    centerLabel="Weighed"
                    emptyText="No vehicles weighed for this period."
                    ariaLabel={weighedAria}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
