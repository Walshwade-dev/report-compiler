import {
  BOUND_OPTIONS,
  WEIGHBRIDGE_OPTIONS,
} from "@/lib/constants";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLoggedInUser } from "@/lib/api";
import { useEffect, useState } from "react";

type ReportHeaderProps = {
    weighbridgeName: string;

    boundName: string;

    setWeighbridgeName: React.Dispatch<
      React.SetStateAction<string>
    >;

    setBoundName: React.Dispatch<
      React.SetStateAction<string>
    >;
  };

export function ReportHeader({
  weighbridgeName,
  boundName,
  setWeighbridgeName,
  setBoundName,
}: ReportHeaderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? getLoggedInUser() : null;
  const isAdmin = !user || user.role === "admin";
  
  return (
    <header className="mb-6">
      {/* Breadcrumbs */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-400" aria-label="Breadcrumbs">
        <Link href="/" className="hover:text-cyan-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="opacity-80">Reports</span>
        <ChevronRight size={12} className="opacity-60" />
        <span className="text-cyan-300 font-semibold">Static Weighbridge</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile-only logo */}
          <div className="block xl:hidden rounded-lg bg-cyan-950/40 p-1.5 border border-cyan-900/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dnk.png" alt="Logo" className="h-8 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Static Weighbridge Report
            </h1>
            <p className="text-xs text-slate-400">
              Compile daily & hourly statistics workspace
            </p>
          </div>
        </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          disabled={!isAdmin}
          value={weighbridgeName}
          onChange={(e) =>
            setWeighbridgeName(e.target.value)
          }
          className={`rounded-lg border border-cyan-700 bg-[#0b2135] px-3 py-2 text-sm text-cyan-200 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isAdmin ? (
            WEIGHBRIDGE_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))
          ) : (
            <option value={weighbridgeName}>{weighbridgeName}</option>
          )}
        </select>

        <select
          value={boundName}
          onChange={(e) =>
            setBoundName(e.target.value)
          }
          className="rounded-lg border border-cyan-700 bg-[#0b2135] px-3 py-2 text-sm text-cyan-200"
        >
          {BOUND_OPTIONS.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
     </div>
    </header>
  );
}