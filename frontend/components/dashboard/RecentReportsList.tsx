"use client";

import { useState, useEffect, useMemo } from "react";
import { FileDown, Edit3, ArrowRight, CheckCircle2, AlertCircle, Clock, Trash2, X, Search, Filter } from "lucide-react";
import Link from "next/link";
import { resolveApiUrl, getReportSessions, isApiConnectionError, deleteReportSession } from "@/lib/api";

type ReportItem = {
  id: string;
  date: string;
  station: string;
  bound: string;
  type: "Static Weighbridge" | "Mobile Weighbridge";
  status: "Completed" | "In Progress" | "Draft";
  downloadUrl?: string;
  editUrl: string;
};

const STATUS_ICONS = {
  Completed: <CheckCircle2 size={14} className="text-emerald-400" />,
  "In Progress": <Clock size={14} className="text-cyan-400" />,
  Draft: <AlertCircle size={14} className="text-amber-400" />,
};

const STATUS_STYLES = {
  Completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "In Progress": "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  Draft: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function ReportTableRow({
  report,
  mounted,
  deletingId,
  onDelete,
  adminPassword,
}: {
  report: ReportItem;
  mounted: boolean;
  deletingId: string | null;
  onDelete: (report: ReportItem) => void;
  adminPassword?: string;
}) {
  return (
    <tr className="hover:bg-cyan-950/20 transition-colors">
      <td className="py-4 px-4 font-mono text-xs">{report.date}</td>
      <td className="py-4 px-4 font-semibold text-white">{report.station}</td>
      <td className="py-4 px-4 text-xs font-medium text-slate-400">{report.bound}</td>
      <td className="py-4 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          report.type === "Mobile Weighbridge"
            ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
            : "bg-slate-800 text-slate-300 border-slate-700"
        }`}>
          {report.type}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${STATUS_STYLES[report.status]}`}>
          {STATUS_ICONS[report.status]}
          {report.status}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={report.editUrl}
            onClick={() => {
              const key = report.type === "Mobile Weighbridge" ? "active-mobile-report-id" : "active-report-id";
              localStorage.setItem(key, report.id);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-950/40 p-2 text-cyan-300 border border-cyan-900/60 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all"
            title="Open Workspace"
          >
            <Edit3 size={14} />
          </Link>
          {report.status === "Completed" && (
            <a
              href={mounted ? (resolveApiUrl(`/api/report-sessions/${report.id}/download-pdf-report`) || "#") : "#"}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-950/40 p-2 text-emerald-300 border border-emerald-900/60 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
              title="Download PDF Report"
            >
              <FileDown size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(report)}
            disabled={deletingId === report.id}
            className="inline-flex items-center justify-center rounded-lg bg-red-950/30 p-2 text-red-300 border border-red-900/50 hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            title="Delete Workspace"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function RecentReportsList({
  adminPassword,
  compact = false,
}: {
  adminPassword?: string;
  compact?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "static" | "mobile">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Completed" | "In Progress" | "Draft">("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    async function loadSessions() {
      try {
        const sessions = await getReportSessions(adminPassword);
        const items: ReportItem[] = sessions.map(session => {
          const hasDailyHour = "daily_hour" in session.sections && session.sections.daily_hour.status === "ready";
          const hasMobile = "mobile_report" in session.sections && session.sections.mobile_report.status === "ready";
          const isMobile = hasMobile && !hasDailyHour;
          
          let status: "Completed" | "In Progress" | "Draft" = "In Progress";
          if (session.final_report?.status === "ready") {
            status = "Completed";
          } else if (session.final_report?.status === "error") {
            status = "Draft";
          }

          return {
            id: session.report_id,
            date: session.metadata?.report_date || "",
            station: session.metadata?.weighbridge_name || session.metadata?.station || "Static Weighbridge",
            bound: session.metadata?.bound || "",
            type: isMobile ? "Mobile Weighbridge" : "Static Weighbridge",
            status: status,
            editUrl: isMobile ? "/reports/mobile-weighbridge/new" : "/reports/static-weighbridge/new",
          };
        });
        setReports(items);
      } catch (err) {
        if (!isApiConnectionError(err)) {
          console.error("Failed to load sessions:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
    return () => clearTimeout(timer);
  }, [adminPassword]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (typeFilter === "static" && report.type !== "Static Weighbridge") return false;
      if (typeFilter === "mobile" && report.type !== "Mobile Weighbridge") return false;
      if (statusFilter !== "all" && report.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${report.date} ${report.station} ${report.bound} ${report.type}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [reports, typeFilter, statusFilter, searchQuery]);

  async function handleDeleteReport(report: ReportItem) {
    const confirmed = window.confirm(
      `Delete ${report.station} ${report.bound} from ${report.date}? This removes the session, uploads, previews, and generated outputs.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(report.id);
      await deleteReportSession(report.id, adminPassword);
      setReports((previous) => previous.filter((item) => item.id !== report.id));

      if (localStorage.getItem("active-report-id") === report.id) {
        localStorage.removeItem("active-report-id");
      }

      if (localStorage.getItem("active-mobile-report-id") === report.id) {
        localStorage.removeItem("active-mobile-report-id");
      }
    } catch (error) {
      console.error("Failed to delete report session:", error);
      window.alert("Failed to delete this report session.");
    } finally {
      setDeletingId(null);
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            {loading ? "Loading workspaces..." : "No workspaces found on record."}
          </p>
        ) : (
          reports.slice(0, 5).map((report) => (
            <div
              key={report.id}
              className="p-3 rounded-xl border border-cyan-900/40 bg-[#071827]/60 hover:bg-cyan-950/20 transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400">{report.date}</span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    STATUS_STYLES[report.status]
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white truncate">{report.station}</h3>
                <p className="text-[10px] text-slate-400">
                  {report.bound} • {report.type}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1 pt-1.5 border-t border-cyan-900/10">
                <Link
                  href={report.editUrl}
                  onClick={() => {
                    localStorage.setItem("active-report-id", report.id);
                  }}
                  className="inline-flex items-center justify-center rounded bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-900/60 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all"
                >
                  Edit
                </Link>
                {report.status === "Completed" && (
                  <a
                    href={mounted ? (resolveApiUrl(`/api/report-sessions/${report.id}/download-pdf-report`) || "#") : "#"}
                    className="inline-flex items-center justify-center rounded bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-900/60 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
                  >
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteReport(report)}
                  disabled={deletingId === report.id}
                  className="inline-flex items-center justify-center rounded bg-red-950/30 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-900/50 hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete workspace"
                >
                  {deletingId === report.id ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Workspaces</h2>
            <p className="text-xs text-slate-400">Manage your recently active report builder sessions.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all reports <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-cyan-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Station / Route</th>
                <th className="py-3 px-4">Bound</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900/30">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    {loading ? "Loading workspaces..." : "No workspaces found on record. Start by building a new report."}
                  </td>
                </tr>
              ) : (
                reports.slice(0, 3).map((report) => (
                  <ReportTableRow
                    key={report.id}
                    report={report}
                    mounted={mounted}
                    deletingId={deletingId}
                    onDelete={handleDeleteReport}
                    adminPassword={adminPassword}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── All Reports Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-cyan-800/70 bg-[#071827] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col gap-4 border-b border-cyan-900/50 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">All Report Sessions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filteredReports.length} of {reports.length} reports
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-900/60 bg-[#0b2135]/80 p-2 text-cyan-300 transition-colors hover:border-cyan-400/50 hover:bg-cyan-950/50"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filter bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search by date, station, or bound..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-cyan-900/60 bg-[#0b2135] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 transition"
                  />
                </div>

                {/* Type filter */}
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-500 shrink-0" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as "all" | "static" | "mobile")}
                    className="rounded-lg border border-cyan-900/60 bg-[#0b2135] px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="static">Static Weighbridge</option>
                    <option value="mobile">Mobile Weighbridge</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "Completed" | "In Progress" | "Draft")}
                    className="rounded-lg border border-cyan-900/60 bg-[#0b2135] px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="sticky top-0 bg-[#071827] z-10">
                  <tr className="border-b border-cyan-900/40 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Station / Route</th>
                    <th className="py-3 px-4">Bound</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/30">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        {loading
                          ? "Loading workspaces..."
                          : searchQuery || typeFilter !== "all" || statusFilter !== "all"
                          ? "No reports match the current filters."
                          : "No workspaces found on record."}
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <ReportTableRow
                        key={report.id}
                        report={report}
                        mounted={mounted}
                        deletingId={deletingId}
                        onDelete={handleDeleteReport}
                        adminPassword={adminPassword}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-cyan-900/50 px-6 py-3 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-slate-500">
                Daily slots: 2 Static (one per bound) + 2 Mobile (Mobile 1, Mobile 2). Re-creating a slot replaces the existing report.
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-cyan-900/60 bg-[#0b2135] px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-400/50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
