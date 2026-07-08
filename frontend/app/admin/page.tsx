"use client";

import { FormEvent, useEffect, useState } from "react";
import { Lock, LogOut, ShieldCheck } from "lucide-react";

import ReportsLayout from "@/app/reports/layout";
import { RecentReportsList } from "@/components/dashboard/RecentReportsList";
import { getReportSessions } from "@/lib/api";

const ADMIN_PASSWORD_STORAGE_KEY = "dnk-admin-password";

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
                Report history and workspace deletion controls.
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
          <RecentReportsList adminPassword={adminPassword} />
        )}
      </div>
    </ReportsLayout>
  );
}
