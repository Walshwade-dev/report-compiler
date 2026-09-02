"use client";

import { ReactNode, useState, useEffect } from "react";
import { FileText, Settings, Truck, ShieldCheck, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getLoggedInUser } from "@/lib/api";

import { ReportSidebar } from "@/components/report-builder/ReportSidebar";
import {
  ReportProgressProvider,
} from "@/components/report-builder/ReportProgressContext";
import {
  ReportSettingsProvider,
  useReportSettings,
} from "@/components/report-builder/ReportSettingsContext";
import { REPORT_NAV_ITEMS } from "@/lib/constants";

type ReportsLayoutProps = {
  children: ReactNode;
};

export default function ReportsLayout({ children }: ReportsLayoutProps) {
  return (
    <ReportSettingsProvider>
      <ReportProgressProvider>
        <ReportsLayoutContent>{children}</ReportsLayoutContent>
      </ReportProgressProvider>
    </ReportSettingsProvider>
  );
}

function ReportsLayoutContent({ children }: ReportsLayoutProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const user = getLoggedInUser();
    if (!user) {
      router.push("/login");
    } else if (user.role === "duty_manager" || user.role === "cluster_manager") {
      router.push("/");
    } else {
      setAuthorized(true);
      setCurrentUser(user);
    }
  }, [router]);

  const { people, addPerson } = useReportSettings();

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071827]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm font-bold text-cyan-300">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#071827] text-slate-100">
      <div className="flex min-h-screen">
        <div className="hidden xl:block">
          <ReportSidebar onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        <section className="flex-1 p-4 sm:p-6">
          <header className="mb-5 rounded-xl border border-cyan-900/50 bg-[#0b2135] p-3 xl:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-cyan-200">
                  Reports
                </p>
                <p className="text-xs text-slate-500">
                  Select report workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="hidden lg:flex items-center gap-2 rounded-lg border border-cyan-700 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10"
              >
                <Settings aria-hidden="true" size={16} />
                Settings
              </button>
            </div>
            <nav className="mt-3 hidden lg:grid gap-2 sm:grid-cols-2" aria-label="Report navigation">
              {REPORT_NAV_ITEMS[0].items.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      active
                        ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-100"
                        : "border-cyan-900/60 bg-[#071827] text-slate-400 hover:border-cyan-700 hover:text-cyan-200"
                    }`}
                  >
                    {item.icon === "truck" ? (
                      <Truck aria-hidden="true" size={16} />
                    ) : item.icon === "calendar" ? (
                      <Calendar aria-hidden="true" size={16} />
                    ) : (
                      <FileText aria-hidden="true" size={16} />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {children}
        </section>
      </div>

      {settingsOpen && (
        <div 
          onClick={() => setSettingsOpen(false)}
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md border-l border-cyan-900/50 bg-[#0b2135] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  App Settings
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Local UI settings for the report builder.
                </p>
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-cyan-700 px-3 py-1 text-sm text-cyan-300 hover:bg-cyan-500/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {currentUser?.role === "admin" && (
                <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                  <p className="text-sm font-bold text-cyan-200 mb-3">
                    Admin Controls
                  </p>
                  <Link
                    href="/admin"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-700 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-500/20"
                  >
                    <ShieldCheck aria-hidden="true" size={16} />
                    Open Admin Console
                  </Link>
                </div>
              )}

              <div className="rounded-xl border border-cyan-900/50 bg-[#071827] p-4">
                <p className="text-sm font-bold text-cyan-200">
                  Report Officers
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Add officer name"
                    className="min-w-0 flex-1 rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm outline-none"
                  />

                  <button
                    onClick={() => {
                      addPerson(personName);
                      setPersonName("");
                    }}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-1">
                  {people.map((person) => (
                    <p key={person} className="text-xs text-slate-400">
                      {person}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
