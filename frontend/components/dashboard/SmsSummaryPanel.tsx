"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Download, ChevronLeft, ChevronRight, Calendar, AlertCircle, MapPin } from "lucide-react";
import { getSmsSummaryDates, getSmsSummariesByDate, SmsSummaryItem } from "@/lib/api";
import { WEIGHBRIDGE_OPTIONS } from "@/lib/constants";

export function SmsSummaryPanel() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("JUJA");
  const [summaries, setSummaries] = useState<SmsSummaryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadDates() {
      try {
        const dateList = await getSmsSummaryDates();
        setDates(dateList);
        if (dateList.length > 0) {
          setSelectedDate(dateList[0]);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load SMS summary dates:", err);
        setLoading(false);
      }
    }
    loadDates();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    async function loadSummaries() {
      setLoading(true);
      try {
        const data = await getSmsSummariesByDate(selectedDate, selectedStation);
        setSummaries(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to load SMS summaries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSummaries();
  }, [selectedDate, selectedStation]);

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

  const handleCopy = async () => {
    if (summaries.length === 0) return;
    const text = summaries[currentIndex].text;
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
    
    // Clean filename
    const dateStr = selectedDate.replace(/-/g, "");
    const cleanTitle = item.title.replace(/[:\s]/g, "_").toLowerCase();
    element.download = `kpi_sms_${cleanTitle}_${dateStr}.txt`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const activeItem = summaries[currentIndex];

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0 border-b border-cyan-900/30 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Daily KPI SMS Summaries
          </h2>
          <p className="text-xs text-slate-400 mt-1">Copy or download daily weighbridge updates formatted for SMS.</p>
        </div>

        {/* Selectors Container */}
        <div className="flex flex-col gap-2 self-start sm:self-auto">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-[#071827]/80 border border-cyan-900/60 rounded-lg px-3 py-1.5 w-full">
            <Calendar size={14} className="text-cyan-400 shrink-0" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={dates.length === 0}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer disabled:opacity-50 w-full"
            >
              {dates.length === 0 ? (
                <option value="">No Dates Available</option>
              ) : (
                dates.map((d) => (
                  <option key={d} value={d} className="bg-[#071827] text-white">
                    {d}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Weighbridge Selector */}
          <div className="flex items-center gap-2 bg-[#071827]/80 border border-cyan-900/60 rounded-lg px-3 py-1.5 w-full">
            <MapPin size={14} className="text-cyan-400 shrink-0" />
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full"
            >
              {WEIGHBRIDGE_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#071827] text-white">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="relative w-10 h-10 mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin"></div>
            </div>
            <span className="text-xs font-medium">Fetching summaries...</span>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-cyan-900/30 rounded-xl bg-[#071827]/20">
            <AlertCircle size={32} className="text-cyan-900 mb-2" />
            <span className="text-sm font-semibold">No report sessions found</span>
            <span className="text-xs text-slate-500 mt-1">Upload files to get started.</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Active Summary Header Details */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {activeItem.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                activeItem.exists 
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
              }`}>
                {activeItem.exists ? "Active Data" : "Awaiting Data"}
              </span>
            </div>

            {/* SMS text card container */}
            <div className="flex-1 relative rounded-xl border border-cyan-900/40 bg-[#071827]/90 p-4 shadow-inner overflow-y-auto max-h-[360px] custom-scrollbar">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all pr-2">
                {activeItem.text}
              </pre>

              {/* Action buttons embedded in card */}
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-[#0b2135]/80 text-cyan-400 border border-cyan-900/40 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all flex items-center gap-1.5 shadow-md"
                  title="Copy to Clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="text-[10px] font-bold">Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-[#0b2135]/80 text-cyan-400 border border-cyan-900/40 hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-cyan-300 transition-all flex items-center gap-1.5 shadow-md"
                  title="Download Text File"
                >
                  <Download size={13} />
                  <span className="text-[10px] font-bold">TXT</span>
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-cyan-900/20 shrink-0">
              <button
                onClick={handlePrev}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-cyan-900/60 bg-[#071827]/60 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-400 transition-all"
                title="Previous Report"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {summaries.map((item, idx) => (
                  <button
                    key={item.slot}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setCopied(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? "bg-cyan-400 w-5" 
                        : "bg-slate-700 hover:bg-cyan-900/80"
                    }`}
                    title={item.title}
                  ></button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-cyan-900/60 bg-[#071827]/60 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-400 transition-all"
                title="Next Report"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Active description under pagination */}
            <div className="text-center mt-2">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                Slide {currentIndex + 1} of {summaries.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
