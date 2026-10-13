"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileSpreadsheet,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Layers,
  Calendar,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { MOBILE_WEIGHBRIDGE_OPTIONS } from "@/lib/constants";
import { getLoggedInUser, authHeaders, apiUrl } from "@/lib/api";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const REPORT_TYPE_OPTIONS = [
  {
    id: "mobile_summary",
    name: "Mobile Summary Report",
    badge: "Official KeNHA Return Format",
    description: "Daily Shift A & B Compliance Summaries + 24-Hour Traffic Distribution Matrix",
  },
];

export function resolveUserMobileStation(user: { station?: string | null; username?: string | null; full_name?: string | null } | null): string {
  if (!user) return MOBILE_WEIGHBRIDGE_OPTIONS[0]; // "Juja mobile"
  const raw = (user.station || user.username || user.full_name || "").trim().toLowerCase();
  if (raw.includes("kanyonyo")) return "Kanyonyo mobile";
  if (raw.includes("isinya")) return "Isinya mobile";
  if (raw.includes("athi")) return "Athi River mobile";
  if (raw.includes("gilgil")) return "Gilgil mobile";
  if (raw.includes("suswa")) return "Suswa mobile";
  if (raw.includes("juja")) return "Juja mobile";
  if (user.station) {
    const s = user.station.trim();
    return s.toLowerCase().includes("mobile") ? s : `${s} mobile`;
  }
  return MOBILE_WEIGHBRIDGE_OPTIONS[0];
}

export default function MonthlyReportPage() {
  const [mounted, setMounted] = useState(false);
  const user = mounted ? getLoggedInUser() : null;
  const isLocked = Boolean(user && user.role !== "admin" && (user.station || user.username));

  const currentDate = new Date();
  const [reportType, setReportType] = useState("mobile_summary");
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [station, setStation] = useState(() => {
    const initialUser = getLoggedInUser();
    return resolveUserMobileStation(initialUser);
  });

  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const loggedUser = getLoggedInUser();
    if (loggedUser) {
      const resolved = resolveUserMobileStation(loggedUser);
      if (loggedUser.role !== "admin") {
        setStation(resolved);
      } else if (loggedUser.station) {
        setStation(resolved);
      }
    }
  }, []);

  const selectedMonthObj = MONTH_OPTIONS.find((m) => m.value === Number(selectedMonth));
  const monthName = selectedMonthObj ? selectedMonthObj.label : "Month";

  const handleDownload = async () => {
    if (!station || !selectedMonth || !selectedYear) {
      setError("Please select station, month, and year before generating.");
      return;
    }

    setIsLoadingExcel(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const headers = authHeaders();
      const adminPass = localStorage.getItem("admin_password");
      if (adminPass && !headers["Authorization"]) {
        headers["X-Admin-Password"] = adminPass;
      }

      const queryParams = new URLSearchParams({
        station: station,
        year: String(selectedYear),
        month: String(selectedMonth),
        report_type: reportType,
        format: "excel",
      });

      const response = await fetch(apiUrl(`reports/monthly/generate?${queryParams.toString()}`), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate monthly Excel report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanStation = station.trim().replace(/\s+/g, "_");
      a.download = `${cleanStation}_Monthly_Summary_${monthName}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`Workbook successfully generated: ${cleanStation}_Monthly_Summary_${monthName}_${selectedYear}.xlsx`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during report generation.");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400" aria-label="Breadcrumbs">
        <Link href="/" prefetch={false} className="hover:text-cyan-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="opacity-80">Reports</span>
        <ChevronRight size={12} className="opacity-60" />
        <span className="text-cyan-300 font-semibold">Monthly Report</span>
      </nav>

      {/* Header Banner */}
      <header className="rounded-xl border border-cyan-900/50 bg-[#0b2135] p-5 shadow-lg">
        <h1 className="flex items-center gap-2.5 text-xl font-bold text-cyan-100">
          <CalendarDays className="text-cyan-400" size={24} />
          Monthly Report Generation
        </h1>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Compile consolidated monthly returns, shift compliance statistics, and 24-hour traffic distribution matrices for mobile units.
        </p>
      </header>

      {/* Feedback Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Two-Column Card Container */}
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135] p-6 shadow-xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT COLUMN: Parameters & Scope */}
          <div className="space-y-5">
            {/* 1. Report Type Selection */}
            <div>
              <label htmlFor="report-type" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cyan-200">
                Report Type
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2.5 text-sm font-medium text-cyan-100 outline-none focus:border-cyan-400 cursor-pointer [color-scheme:dark]"
              >
                {REPORT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#071827] text-white">
                    {opt.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Official consolidated return template with Shift A, Shift B, and 24-Hour hourly breakdowns.
              </p>
            </div>

            {/* 2. Station Scope */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="station-scope" className="block text-xs font-bold uppercase tracking-wider text-cyan-200">
                  Station Scope
                </label>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 rounded px-2 py-0.5">
                    <MapPin size={10} className="animate-pulse text-cyan-400" /> Station Locked
                  </span>
                )}
              </div>
              <select
                id="station-scope"
                disabled={isLocked}
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className={`w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2.5 text-sm font-medium text-cyan-100 outline-none focus:border-cyan-400 [color-scheme:dark] ${
                  isLocked ? "opacity-75 cursor-not-allowed bg-[#071827]/70" : "cursor-pointer"
                }`}
              >
                {isLocked ? (
                  <option value={station} className="bg-[#071827] text-white">{station}</option>
                ) : (
                  MOBILE_WEIGHBRIDGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#071827] text-white">
                      {opt}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 3. Target Month & Year */}
            <div>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cyan-200">
                Reporting Period
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="report-month" className="text-[11px] font-medium text-slate-400 block mb-1">Month</label>
                  <select
                    id="report-month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400 cursor-pointer [color-scheme:dark]"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#071827] text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-year" className="text-[11px] font-medium text-slate-400 block mb-1">Year</label>
                  <select
                    id="report-year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-cyan-900 bg-[#071827] px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-400 cursor-pointer [color-scheme:dark]"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y} className="bg-[#071827] text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scope Manifest Card & Export Action */}
          <div className="flex flex-col justify-between space-y-5">
            {/* Manifest Summary Card */}
            <div className="rounded-xl border border-cyan-900/60 bg-[#071827] p-4.5 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-400" /> Target Manifest
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {monthName} {selectedYear}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Station Unit:</span>
                  <span className="font-semibold text-cyan-100">{station}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Return Format:</span>
                  <span className="font-semibold text-slate-200">Excel (.xlsx)</span>
                </div>
              </div>

              <div className="border-t border-cyan-900/40 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Included Return Datasets:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                    <span>Daily Shift A & Shift B Compliance Summaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                    <span>Mobile Total Combined Operations Table</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                    <span>24-Hour Traffic Distribution Hourly Matrix</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                    <span>Hourly Totals & Monthly Baseline Averages</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Direct Export Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isLoadingExcel || !station}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-cyan-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-cyan-500 hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingExcel ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin text-white" />
                    <span>Compiling Monthly Workbook...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} />
                    <span>Download Excel Report (.xlsx)</span>
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Direct export based on selected month and verified daily sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
