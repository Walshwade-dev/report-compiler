"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Download, ChevronLeft, ChevronRight, AlertCircle, MapPin, X, Maximize2 } from "lucide-react";
import {
  getSmsSummariesByDate,
  isApiConnectionError,
  SmsSummaryItem,
} from "@/lib/api";
import { WEIGHBRIDGE_OPTIONS } from "@/lib/constants";

export function SmsSummaryPanel({ selectedDate }: { selectedDate: string }) {
  const [selectedStation, setSelectedStation] = useState<string>("JUJA");
  const [summaries, setSummaries] = useState<SmsSummaryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [modalItem, setModalItem] = useState<SmsSummaryItem | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    async function loadSummaries() {
      setLoading(true);
      try {
        const data = await getSmsSummariesByDate(selectedDate, selectedStation);
        setSummaries(data);
        setCurrentIndex(0);
      } catch (err) {
        if (!isApiConnectionError(err)) {
          console.error("Failed to load SMS summaries:", err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSummaries();
  }, [selectedDate, selectedStation]);

  useEffect(() => {
    if (!modalItem) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalItem]);

  const handlePrev = () => {
    if (summaries.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? summaries.length - 1 : prev - 1));
    setCopied(false);
  };

  const handleNext = () => {
    if (summaries.length === 0) return;
    setCurrentIndex((prev) => (prev === summaries.length - 1 ? 0 : prev + 1));
    setCopied(false);
  };

  const handleCopy = async (item = summaries[currentIndex]) => {
    if (!item) return;
    const text = item.text;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownload = () => {
    if (summaries.length === 0) return;
    const item = summaries[currentIndex];
    const element = document.createElement("a");
    const file = new Blob([item.text], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    
    const dateStr = selectedDate.replace(/-/g, "");
    const cleanTitle = item.title.replace(/[:\s]/g, "_").toLowerCase();
    element.download = `kpi_sms_${cleanTitle}_${dateStr}.txt`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const activeItem = summaries[currentIndex];

  return (
    <>
      <div
        onClick={() => activeItem && setModalItem(activeItem)}
        className="flex h-[540px] max-w-full flex-col overflow-hidden rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-5 shadow-xl backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.005] hover:bg-[#0b2135]/80 relative group"
      >
        {/* Header */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-row items-center justify-between gap-4 mb-4 shrink-0 border-b border-cyan-900/30 pb-3"
        >
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Daily KPI SMS
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Weighbridge updates formatted for SMS</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Weighbridge Selector */}
            <div className="flex items-center gap-1.5 bg-[#071827]/80 border border-cyan-900/60 rounded-lg px-2 py-1 shadow-sm">
              <MapPin size={11} className="text-cyan-400 shrink-0" />
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer w-auto"
              >
                {WEIGHBRIDGE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[#071827] text-white">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1">
              <Maximize2 size={14} />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="relative w-8 h-8 mb-2">
                <div className="absolute inset-0 rounded-full border border-cyan-500/20"></div>
                <div className="absolute inset-0 rounded-full border border-t-cyan-400 animate-spin"></div>
              </div>
              <span className="text-[10px] font-semibold">Fetching summaries...</span>
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-cyan-900/30 rounded-xl bg-[#071827]/20">
              <AlertCircle size={28} className="text-cyan-900 mb-1.5" />
              <span className="text-xs font-semibold">No report sessions found</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Upload files to get started.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Active Summary Header Details */}
              <div className="flex items-center justify-between mb-2.5 px-0.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  {activeItem.title}
                </span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                  activeItem.exists 
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }`}>
                  {activeItem.exists ? "Active Data" : "Awaiting Data"}
                </span>
              </div>

              {/* SMS text card container */}
              <div
                className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-xl border border-cyan-900/40 bg-[#071827]/90 p-3.5 shadow-inner transition-colors hover:border-cyan-500/30 custom-scrollbar"
              >
                <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap select-all pr-2">
                  {activeItem.text}
                </pre>

                {/* Action buttons embedded in card */}
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                  <button
                    onClick={() => handleCopy()}
                    className="p-1.5 rounded bg-[#0b2135]/90 text-cyan-400 border border-cyan-900/50 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-md"
                    title="Copy to Clipboard"
                  >
                    {copied ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span className="text-[9px] font-bold">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded bg-[#0b2135]/90 text-cyan-400 border border-cyan-900/50 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-md"
                    title="Download Text File"
                  >
                    <Download size={11} />
                    <span className="text-[9px] font-bold">TXT</span>
                  </button>
                </div>
              </div>

              {/* Pagination Controls */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between mt-4 pt-2.5 border-t border-cyan-900/20 shrink-0"
              >
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center justify-center p-1.5 rounded border border-cyan-900/60 bg-[#071827]/60 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-400 transition-all"
                  title="Previous Report"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Dot Indicators */}
                <div className="flex items-center gap-1.5">
                  {summaries.map((item, idx) => (
                    <button
                      key={item.slot}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setCopied(false);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex 
                          ? "bg-cyan-400 w-4" 
                          : "bg-slate-700 hover:bg-cyan-900/80"
                      }`}
                      title={item.title}
                    ></button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="inline-flex items-center justify-center p-1.5 rounded border border-cyan-900/60 bg-[#071827]/60 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-400 transition-all"
                  title="Next Report"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Active description under pagination */}
              <div className="text-center mt-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">
                  Slide {currentIndex + 1} of {summaries.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal View */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalItem(null)}
        >
          <div
            className="flex max-h-[86vh] w-full max-w-2xl flex-col rounded-xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-cyan-900/50 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold uppercase tracking-wider text-cyan-200">
                  {modalItem.title}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Daily KPI SMS Summary for {selectedDate}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleCopy(modalItem)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 px-3 py-2 text-xs font-bold text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                  title="Copy to Clipboard"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => setModalItem(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="custom-scrollbar overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">
                {modalItem.text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
