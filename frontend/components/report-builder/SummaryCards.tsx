"use client";

import {
  BadgeCheck,
  Scale,
  ShieldCheck,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  getSummaryCards,
  SummaryCard,
} from "@/lib/api";

const fallbackCards: SummaryCard[] = [
  {
    title: "Total Weighed",
    value: null,
    display_value: "—",
    status: "awaiting_data",
    subtitle: "awaiting session",
    source: "daily_hour.totals.X",
  },
  {
    title: "Total Overloaded",
    value: null,
    display_value: "—",
    status: "awaiting_data",
    subtitle: "awaiting session",
    source: "daily_hour.totals.Y",
  },
  {
    title: "Special Released",
    value: null,
    display_value: "—",
    status: "awaiting_data",
    subtitle: "awaiting session",
    source: "daily_hour.totals.G",
  },
  {
    title: "Wide Loads",
    value: null,
    display_value: "—",
    status: "awaiting_data",
    subtitle: "awaiting session",
    source: "wideload.wideload_count",
  },
];

type SummaryCardsProps = {
  reportId: string | null;
  refreshKey: number;
};

const cardVisuals = {
  "Total Weighed": {
    icon: Scale,
    readyClass: "border-sky-500/50 bg-sky-600/25",
    iconClass: "bg-sky-400/15 text-sky-200",
    valueClass: "text-sky-50",
    titleClass: "text-sky-100",
    subtitleClass: "text-sky-200",
  },
  "Total Overloaded": {
    icon: TriangleAlert,
    readyClass: "border-amber-500/50 bg-amber-600/20",
    iconClass: "bg-amber-400/15 text-amber-200",
    valueClass: "text-amber-50",
    titleClass: "text-amber-100",
    subtitleClass: "text-amber-200",
  },
  "Special Released": {
    icon: ShieldCheck,
    readyClass: "border-emerald-500/50 bg-emerald-600/20",
    iconClass: "bg-emerald-400/15 text-emerald-200",
    valueClass: "text-emerald-50",
    titleClass: "text-emerald-100",
    subtitleClass: "text-emerald-200",
  },
  "Wide Loads": {
    icon: Truck,
    readyClass: "border-violet-500/50 bg-violet-600/20",
    iconClass: "bg-violet-400/15 text-violet-200",
    valueClass: "text-violet-50",
    titleClass: "text-violet-100",
    subtitleClass: "text-violet-200",
  },
} as const;

const defaultVisual = {
  icon: BadgeCheck,
  readyClass: "border-cyan-700/50 bg-blue-600/25",
  iconClass: "bg-cyan-400/15 text-cyan-200",
  valueClass: "text-white",
  titleClass: "text-cyan-100",
  subtitleClass: "text-cyan-200",
};

export function SummaryCards({
  reportId,
  refreshKey,
}: SummaryCardsProps) {
  const [cards, setCards] =
    useState<SummaryCard[]>(fallbackCards);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      return;
    }

    let cancelled = false;
    const activeReportId = reportId;

    async function loadSummaryCards() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const response = await getSummaryCards(activeReportId);

        if (cancelled) return;

        setCards(response.cards);
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to fetch summary cards"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummaryCards();

    return () => {
      cancelled = true;
    };
  }, [reportId, refreshKey]);

  const displayedCards = reportId ? cards : fallbackCards;
  const displayedErrorMessage = reportId ? errorMessage : null;
  const displayedLoading = Boolean(reportId) && loading;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {displayedCards.map((card) => {
        const visual =
          cardVisuals[card.title as keyof typeof cardVisuals] ||
          defaultVisual;
        const Icon = visual.icon;
        const ready = card.status === "ready";

        return (
          <div
            key={card.title}
            className={`rounded-xl border p-5 shadow-lg transition ${
              ready
                ? visual.readyClass
                : "border-cyan-900/50 bg-[#0b2a45]"
            }`}
          >
            <div className="flex min-h-12 items-start justify-between gap-3">
              <p
                className={`text-sm font-bold uppercase tracking-wider ${
                  ready ? visual.titleClass : "text-slate-300"
                }`}
              >
                {card.title}
              </p>

              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  ready
                    ? visual.iconClass
                    : "bg-slate-700/40 text-slate-400"
                }`}
              >
                <Icon size={22} strokeWidth={2.3} />
              </span>
            </div>

            <p
              className={`mt-5 text-4xl font-black ${
                ready ? visual.valueClass : "text-slate-300"
              }`}
            >
              {displayedLoading ? "…" : card.display_value}
            </p>

            <p
              className={`mt-2 text-base font-semibold ${
                displayedErrorMessage
                  ? "text-red-300"
                  : ready
                  ? visual.subtitleClass
                  : "text-slate-400"
              }`}
            >
              {displayedErrorMessage || card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
