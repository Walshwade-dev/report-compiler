"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, CalendarDays, MapPin, ChevronRight } from "lucide-react";
import { WEIGHBRIDGE_OPTIONS } from "@/lib/constants";
import { getLoggedInUser, authHeaders, API_ORIGIN } from "@/lib/api";

export function resolveUserStaticStation(user: { station?: string | null; username?: string | null; full_name?: string | null } | null): string {
  if (!user) return WEIGHBRIDGE_OPTIONS[0]; // "JUJA"
  const raw = (user.station || user.username || user.full_name || "").trim().toLowerCase();
  if (raw.includes("kanyonyo")) return "KANYONYO";
  if (raw.includes("isinya")) return "ISINYA";
  if (raw.includes("athi")) return "ATHI RIVER";
  if (raw.includes("gilgil")) return "GILGIL";
  if (raw.includes("suswa")) return "SUSWA";
  if (raw.includes("juja")) return "JUJA";
  if (user.station) {
    return user.station.toUpperCase();
  }
  return WEIGHBRIDGE_OPTIONS[0];
}

export default function WeeklyReportPage() {
  const [mounted, setMounted] = useState(false);
  const user = mounted ? getLoggedInUser() : null;
  const isLocked = Boolean(user && user.role !== "admin" && (user.station || user.username));

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [station, setStation] = useState(() => {
    const initialUser = getLoggedInUser();
    return resolveUserStaticStation(initialUser);
  });
  const [preparedBy, setPreparedBy] = useState(() => {
    const initialUser = getLoggedInUser();
    return initialUser?.full_name || initialUser?.username || "";
  });
  const [approvedBy, setApprovedBy] = useState("Faith Njani");
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const loggedUser = getLoggedInUser();
    if (loggedUser) {
      const resolved = resolveUserStaticStation(loggedUser);
      if (loggedUser.role !== "admin") {
        setStation(resolved);
        setPreparedBy(loggedUser.full_name || loggedUser.username || "");
      } else if (loggedUser.station) {
        setStation(resolved);
      }
    }
  }, []);

  useEffect(() => {
    if (startDate) {
      try {
        const dateObj = new Date(startDate);
        if (!isNaN(dateObj.getTime())) {
          const end = new Date(dateObj);
          end.setDate(end.getDate() + 6);
          setEndDate(end.toISOString().split("T")[0]);
        }
      } catch (e) {}
    }
  }, [startDate]);

  const handleDownload = async (formatType: "excel" | "pdf") => {
    if (!startDate || !endDate || !station || !preparedBy || !approvedBy) {
      setError("Please fill in all fields before generating the report.");
      return;
    }

    if (formatType === "excel") setIsLoadingExcel(true);
    else setIsLoadingPdf(true);
    setError(null);

    try {
      const headers = authHeaders();
      const adminPass = localStorage.getItem("admin_password");
      if (adminPass && !headers["Authorization"]) {
        headers["X-Admin-Password"] = adminPass;
      }

      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        station: station,
        prepared_by: preparedBy,
        approved_by: approvedBy,
        format: formatType,
      });

      const response = await fetch(`${API_ORIGIN}/api/reports/weekly/generate?${queryParams.toString()}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to generate ${formatType} report.`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${station}_Weekly_Report_${startDate}_to_${endDate}.${formatType === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      if (formatType === "excel") setIsLoadingExcel(false);
      else setIsLoadingPdf(false);
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
        <span className="text-cyan-300 font-semibold">Weekly Report</span>
      </nav>

      <header className="rounded-xl border border-cyan-900/50 bg-[#0b2135] p-5 shadow-lg">
        <h1 className="flex items-center gap-2 text-xl font-bold text-cyan-100">
          <CalendarDays className="text-cyan-500" />
          Weekly Report Generation
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Generate an aggregated weekly report from approved daily reports. The report strictly covers 7 days starting from the selected start date.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135] p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Station</label>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded px-2 py-0.5">
                    <MapPin size={10} className="animate-pulse" /> Station Locked
                  </span>
                )}
              </div>
              <select
                disabled={isLocked}
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className={`w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2 text-sm text-cyan-100 outline-none transition focus:border-cyan-500 ${
                  isLocked ? "opacity-75 cursor-not-allowed bg-[#071827]/70" : ""
                }`}
              >
                {isLocked ? (
                  <option value={station}>{station}</option>
                ) : (
                  WEIGHBRIDGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">End Date (Auto-calculated)</label>
              <input
                type="date"
                value={endDate}
                readOnly
                disabled
                className="w-full rounded-lg border border-cyan-900 bg-[#071827]/50 px-4 py-2 text-sm text-cyan-100/50 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Prepared By</label>
              <input
                type="text"
                disabled={isLocked}
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Report Officer Name"
                className={`w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2 text-sm text-cyan-100 outline-none transition focus:border-cyan-500 ${
                  isLocked ? "opacity-75 cursor-not-allowed bg-[#071827]/70" : ""
                }`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Approved By</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="e.g. Faith Njani"
                className="w-full rounded-lg border border-cyan-900 bg-[#071827] px-4 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <button
                onClick={() => handleDownload("excel")}
                disabled={isLoadingExcel || isLoadingPdf || !startDate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingExcel ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download size={18} />
                )}
                Download Excel Report
              </button>

              <button
                onClick={() => handleDownload("pdf")}
                disabled={isLoadingExcel || isLoadingPdf || !startDate}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-cyan-600 bg-transparent px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingPdf ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                ) : (
                  <Download size={18} />
                )}
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

