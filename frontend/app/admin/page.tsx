"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Database,
  Download,
  FileCheck2,
  Lock,
  LogOut,
  ShieldCheck,
  Zap,
} from "lucide-react";

import ReportsLayout from "@/app/reports/layout";
import { RecentReportsList } from "@/components/dashboard/RecentReportsList";
import { useReportProgress } from "@/components/report-builder/ReportProgressContext";
import { getReportSessions } from "@/lib/api";

const ADMIN_PASSWORD_STORAGE_KEY = "dnk-admin-password";

type DeveloperTicket = {
  id: string;
  title: string;
  category: "Bug" | "Feature" | "Enhancement";
  severity: "Low" | "Medium" | "High" | "Critical";
  affectedArea: string;
  description: string;
  expectedBehavior: string;
  submittedAt: string;
  prompt: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const storedPassword = sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    if (storedPassword) {
      setAdminPassword(storedPassword);
    }
  }, []);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setChecking(true);

    try {
      await getReportSessions(password);
      sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
      setAdminPassword(password);
      setPassword("");
    } catch {
      setError("The admin password was not accepted.");
    } finally {
      setChecking(false);
    }
  }

  function handleLock() {
    sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setAdminPassword("");
    setPassword("");
    setError("");
  }

  return (
    <ReportsLayout>
      <div className="space-y-6">
        <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
                <ShieldCheck aria-hidden="true" size={14} />
                Admin
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-white">
                Admin Console
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Report and workspace history.
              </p>
            </div>

            {adminPassword && (
              <button
                type="button"
                onClick={handleLock}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-800 px-3 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-500/10"
              >
                <LogOut aria-hidden="true" size={16} />
                Lock
              </button>
            )}
          </div>
        </div>

        {!adminPassword ? (
          <form
            onSubmit={handleUnlock}
            className="max-w-md rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl"
          >
            <label className="text-sm font-bold text-cyan-200" htmlFor="admin-password">
              Admin password
            </label>
            <div className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Lock
                  aria-hidden="true"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-cyan-900 bg-[#071827] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-500"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!password || checking}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? "Checking" : "Unlock"}
              </button>
            </div>
            {error && (
              <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200">
                {error}
              </p>
            )}
          </form>
        ) : (
          <AdminUnlockedContent adminPassword={adminPassword} />
        )}
      </div>
    </ReportsLayout>
  );
}

function AdminUnlockedContent({ adminPassword }: { adminPassword: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SystemStatusPanel />
        <SessionDetailsPanel />
      </div>

      <DeveloperPromptAccessPanel />

      <RecentReportsList adminPassword={adminPassword} />
    </div>
  );
}

function SystemStatusPanel() {
  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-cyan-200">System Status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Operational controls and persistence surfaces.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
          <Zap size={12} className="animate-pulse" /> Online
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-white">API Gateway</p>
              <p className="text-xs text-slate-400">FastAPI backend online</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-white">PostgreSQL Metadata</p>
              <p className="text-xs text-slate-400">Report history and dashboard persistence</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[#071827]/80 p-3 border border-cyan-950">
          <div className="flex items-center gap-3">
            <FileCheck2 size={18} className="text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-white">Persistent Report Storage</p>
              <p className="text-xs text-slate-400">Uploads, previews, processed data, and outputs</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}

function SessionDetailsPanel() {
  const { debugManualPayload, debugUploadResponse, sessionId } = useReportProgress();

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <h2 className="text-base font-bold text-cyan-200">Session Details</h2>
      <p className="mt-1 text-xs text-slate-400">
        Technical workspace and payload details for troubleshooting.
      </p>

      <p className="mt-4 break-all rounded-lg border border-cyan-900/50 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300">
        {sessionId || "No active report workspace"}
      </p>

      {debugManualPayload && (
        <label htmlFor="admin-manual-payload" className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Manual PATCH Payload
          </span>
          <textarea
            id="admin-manual-payload"
            readOnly
            value={debugManualPayload}
            rows={7}
            className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300 outline-none"
          />
        </label>
      )}

      {debugUploadResponse && (
        <label htmlFor="admin-upload-response" className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upload JSON Response
          </span>
          <textarea
            id="admin-upload-response"
            readOnly
            value={debugUploadResponse}
            rows={8}
            className="mt-2 w-full resize-none rounded-md border border-cyan-900/60 bg-[#071827] px-3 py-2 font-mono text-xs text-slate-300 outline-none"
          />
        </label>
      )}
    </div>
  );
}

function DeveloperPromptAccessPanel() {
  const [tickets, setTickets] = useState<DeveloperTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dev-tickets");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as DeveloperTicket[];
      setTickets(parsed);
      setActiveTicketId(parsed[0]?.id || "");
    } catch (error) {
      console.error("Failed to parse tickets", error);
    }
  }, []);

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || null;

  function handleCopyPrompt() {
    if (!activeTicket) {
      return;
    }

    navigator.clipboard.writeText(activeTicket.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPrompt() {
    if (!activeTicket) {
      return;
    }

    const blob = new Blob([activeTicket.prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTicket.id}_developer_prompt.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/80 p-5 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-cyan-200">Developer Prompt Access</h2>
          <p className="mt-1 text-xs text-slate-400">
            Ticket-generated AI developer prompts are visible only in admin controls.
          </p>
        </div>

        {activeTicket && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-300"
            >
              {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPrompt}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10"
            >
              <Download aria-hidden="true" size={14} />
              Download
            </button>
          </div>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-cyan-900/40 bg-[#071827]/60 p-8 text-center text-sm text-slate-400">
          No developer tickets have been submitted in this browser.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setActiveTicketId(ticket.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  activeTicketId === ticket.id
                    ? "border-cyan-400 bg-cyan-950/40"
                    : "border-cyan-900/40 bg-[#071827]/60 hover:border-cyan-700"
                }`}
              >
                <p className="font-mono text-[10px] font-bold text-slate-400">{ticket.id}</p>
                <p className="mt-1 text-sm font-semibold text-white">{ticket.title}</p>
                <p className="mt-1 text-xs text-slate-500">{ticket.submittedAt}</p>
              </button>
            ))}
          </div>

          <div className="min-h-[320px] max-h-[560px] overflow-auto rounded-lg border border-cyan-900/50 bg-[#071827] p-4 font-mono text-xs whitespace-pre-wrap text-slate-300">
            {activeTicket?.prompt || "Select a ticket to view its developer prompt."}
          </div>
        </div>
      )}
    </div>
  );
}
