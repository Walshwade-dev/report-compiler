"use client";
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Settings,
  Ticket,
  Truck,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { REPORT_NAV_ITEMS } from "@/lib/constants";
import { ProgressSummary } from "./ProgressSummary";
import { useReportProgress } from "./ReportProgressContext";
import { getLoggedInUser, logoutUser } from "@/lib/api";


type ReportSidebarProps = {
  onOpenSettings: () => void;
};

export function ReportSidebar({ onOpenSettings }: ReportSidebarProps) {
  const router = useRouter();
  const user = getLoggedInUser();
  const [reportsOpen, setReportsOpen] = useState(true);
  const pathname = usePathname();

  const [logoError, setLogoError] = useState(false);

  const progress = useReportProgress();

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-cyan-900/40 bg-[#0b2135] p-5">
      <div className="flex items-center justify-center">
        {!logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="eager"
            src="/dnk.png"
            alt="Danka Logo"
            width={160}
            height={160}
            className="h-28 w-48 object-contain border-0 shadow-none outline-none"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-cyan-300">
            DANKA
          </span>
        )}
      </div>

      <nav className="mt-8 space-y-6" aria-label="Report workspace navigation">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase text-cyan-300/70">
            Menu
          </p>

          <ul className="mt-2 space-y-1">
            <li>
              <Link
                href="/"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === "/"
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            </li>

            <li>
              <button
                onClick={() => setReportsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-cyan-100 hover:bg-cyan-500/10"
                aria-expanded={reportsOpen}
              >
                <span className="flex items-center gap-3">
                  <FileText size={16} />
                  Reports
                </span>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    reportsOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>

              {reportsOpen && (
                <ul className="ml-6 mt-1 space-y-1 border-l border-cyan-900/50 pl-3">
                  {REPORT_NAV_ITEMS[0].items.map((item) => (
                    <li key={item.label}>
                      {(() => {
                        const active = pathname === item.href;

                        return (
                        <Link
                          href={item.href}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            active
                              ? "bg-cyan-500/20 text-cyan-200"
                              : "text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-200"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          {item.icon === "file" ? (
                            <FileText size={16} />
                          ) : (
                            <Truck size={16} />
                          )}

                          <span>{item.label}</span>
                        </Link>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li>
              <Link
                href="/analytics"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  pathname === "/analytics"
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
                }`}
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </Link>
            </li>

            <li>
              <Link
                href="/tickets"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  pathname === "/tickets"
                    ? "bg-cyan-500/20 text-cyan-200"
                    : "text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
                }`}
              >
                <Ticket size={16} />
                <span>Tickets</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold uppercase text-cyan-300/70">
            General
          </p>

          <ul className="mt-2 space-y-1">
            <li>
              <button
                onClick={onOpenSettings}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold uppercase text-cyan-300/70">
            Account
          </p>

          <ul className="mt-2 space-y-1">
            <li className="px-3 py-1 text-xs text-slate-400 font-semibold truncate">
              {user?.full_name || user?.username || "Authorized Officer"}
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="mt-auto mb-4">
        <ProgressSummary
          reportType={progress.reportType}
          metadataComplete={progress.metadataComplete}
          uploadsComplete={progress.uploadsComplete}
          manualInputsComplete={progress.manualInputsComplete}
          uploadCount={progress.uploadCount}
          uploadTotal={progress.uploadTotal}
          canBuild={progress.canBuild}
        />
      </div>
    </aside>
  );
}
