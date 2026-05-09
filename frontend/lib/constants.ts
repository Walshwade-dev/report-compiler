
import type { ReportSection } from "@/lib/types";

export const REPORT_NAV_ITEMS = [
  {
    section: "Reports",

    items: [
      {
        label: "Static Weighbridge Report",

        href: "/reports/static-weighbridge/new",

        icon: "file",

        active: true,
      },

      {
        label: "Mobile Weighbridge Report",

        href: "#",

        icon: "truck",

        active: false,
      },
    ],
  },
];


export const WEIGHBRIDGE_OPTIONS = [
  "JUJA",
  "ATHI RIVER",
  "GILGIL",
  "KANYONYO",
  "SUSWA",
  "ISINYA"
];

export const BOUND_OPTIONS = [
  "THIKA BOUND",
  "NAIROBI BOUND",
  "MOMBASA BOUND",
  "KAJIADO BOUND",
  "NAKURU BOUND",
];

export const UPLOAD_ENDPOINTS = {
  daily_hour: "daily-hour",
  wideload: "wideload",
  impounded_prohibited:
    "impounded-prohibited",
  impounded_overloaded:
    "overloaded",
};

export const BACKEND_SECTION_STATUS_MAP = {
  missing: "missing",
  ready: "uploaded",
  error: "missing",
} as const;

export const BACKEND_SECTION_KEYS = {
  daily_hour: "daily_hour",
  wideload: "wideload",
  impounded_prohibited:
    "impounded_prohibited",
  impounded_overloaded:
    "overloaded",
} as const;


export const REPORT_SECTION_NAMES: Partial<Record<ReportSection, string>> = {
  1: "daily-hour-statistics",
  2: "daily-hour-chart",
  3: "traffic-census",
  4: "daily_summary",
  5: "transgressions",
  6: "impounded-prohibited",
  7: "wideload",
};