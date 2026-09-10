export type ClassifiedTarget =
  | "daily_hour"
  | "wideload"
  | "impounded_prohibited"
  | "impounded_overloaded"
  | "transgression"
  | "census"
  | "unassigned";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ClassificationResult = {
  target: ClassifiedTarget;
  confidence: ConfidenceLevel;
  reason: string;
};

export type TargetCategoryOption = {
  key: ClassifiedTarget;
  label: string;
  badgeLabel: string;
  type: "spreadsheet" | "scan" | "other";
  disabled?: boolean;
};

export const TARGET_CATEGORIES: TargetCategoryOption[] = [
  {
    key: "daily_hour",
    label: "Daily Hour Stats (.csv / .xlsx)",
    badgeLabel: "Daily Hour",
    type: "spreadsheet",
  },
  {
    key: "wideload",
    label: "Wideload Records (.csv / .xlsx)",
    badgeLabel: "Wideload",
    type: "spreadsheet",
  },
  {
    key: "impounded_prohibited",
    label: "Impounded / Prohibited (.csv / .xlsx)",
    badgeLabel: "Impounded / Prohibited",
    type: "spreadsheet",
  },
  {
    key: "impounded_overloaded",
    label: "Impounded / Overloaded (.csv / .xlsx)",
    badgeLabel: "Impounded / Overloaded",
    type: "spreadsheet",
  },
  {
    key: "transgression",
    label: "Transgression Ticket / Form (OCR)",
    badgeLabel: "Transgression (OCR)",
    type: "scan",
  },
  {
    key: "census",
    label: "Traffic Census Record (OCR)",
    badgeLabel: "Census (OCR)",
    type: "scan",
  },
  {
    key: "unassigned",
    label: "Do Not Ingest (Ignore)",
    badgeLabel: "Ignored",
    type: "other",
  },
];

const SCAN_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".webp"];
const SPREADSHEET_EXTENSIONS = [".csv", ".xlsx", ".xls"];

/**
 * Sniffs first 2KB of a text/CSV file to inspect column headers
 */
async function sniffCsvHeaders(file: File): Promise<string> {
  try {
    const slice = file.slice(0, 2048);
    return (await slice.text()).toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Classifies an incoming file by extension, filename heuristics, and CSV headers
 */
export async function classifyFile(file: File): Promise<ClassificationResult> {
  const name = file.name.toLowerCase();

  const isScan = SCAN_EXTENSIONS.some((ext) => name.endsWith(ext));
  const isSpreadsheet = SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext));

  // 1. Scanned documents & images
  if (isScan) {
    if (
      name.includes("census") ||
      name.includes("traffic_count") ||
      name.includes("traffic count") ||
      name.includes("cc records") ||
      name.includes("cc record") ||
      name.includes("cc_record") ||
      name.includes("cc_records") ||
      name.includes("traffic census")
    ) {
      return {
        target: "census",
        confidence: "high",
        reason: "Matched traffic census / CC records filename pattern",
      };
    }

    if (
      name.includes("transgression") ||
      name.includes("transgress") ||
      name.includes("ticket") ||
      name.includes("tag") ||
      name.includes("bypass") ||
      name.includes("chased") ||
      name.includes("offence")
    ) {
      return {
        target: "transgression",
        confidence: "high",
        reason: "Matched transgression ticket filename keyword",
      };
    }

    // Default scans in static report workflow are assumed to be transgression tickets
    return {
      target: "transgression",
      confidence: "medium",
      reason: "Scanned document / image detected (Transgression candidate)",
    };
  }

  // 2. Spreadsheet files (.csv, .xlsx, .xls)
  if (isSpreadsheet) {
    // Check filename patterns first
    if (
      name.includes("daily") ||
      name.includes("hourly") ||
      name.includes("hswim") ||
      name.includes("daily_hour") ||
      name.includes("station_hourly")
    ) {
      return {
        target: "daily_hour",
        confidence: "high",
        reason: "Matched daily hourly stats filename pattern",
      };
    }

    if (
      name.includes("wideload") ||
      name.includes("wide_load") ||
      name.includes("wide") ||
      name.includes("abnormal")
    ) {
      return {
        target: "wideload",
        confidence: "high",
        reason: "Matched wideload register filename pattern",
      };
    }

    if (
      name.includes("prohibit") ||
      name.includes("p_and_i") ||
      name.includes("p&i") ||
      name.includes("p_i") ||
      name.includes("pi_")
    ) {
      return {
        target: "impounded_prohibited",
        confidence: "high",
        reason: "Matched impounded / prohibited filename pattern",
      };
    }

    if (name.includes("overload") || name.includes("court")) {
      return {
        target: "impounded_overloaded",
        confidence: "high",
        reason: "Matched impounded / overloaded filename pattern",
      };
    }

    // Header sniffing for CSV files if filename was ambiguous
    if (name.endsWith(".csv")) {
      const headerSnippet = await sniffCsvHeaders(file);

      if (
        headerSnippet.includes("multideck") ||
        headerSnippet.includes("singleaxle") ||
        headerSnippet.includes("hswim total") ||
        headerSnippet.includes("warnedtucks") ||
        headerSnippet.includes("calledin")
      ) {
        return {
          target: "daily_hour",
          confidence: "high",
          reason: "Identified via Daily Hour CSV column headers",
        };
      }

      if (
        headerSnippet.includes("abnormallpermit") ||
        headerSnippet.includes("inspstick") ||
        headerSnippet.includes("insuarancest") ||
        headerSnippet.includes("dpermitissu") ||
        headerSnippet.includes("authweight") ||
        headerSnippet.includes("weighofload")
      ) {
        return {
          target: "wideload",
          confidence: "high",
          reason: "Identified via Wideload CSV column headers",
        };
      }

      if (
        headerSnippet.includes("prohibitionorder") ||
        headerSnippet.includes("prosecutor") ||
        headerSnippet.includes("computeroperator") ||
        headerSnippet.includes("axleoverload") ||
        headerSnippet.includes("gvwoverload")
      ) {
        return {
          target: "impounded_prohibited",
          confidence: "high",
          reason: "Identified via Impounded / Prohibited CSV column headers",
        };
      }

      if (
        headerSnippet.includes("vardict") ||
        headerSnippet.includes("verdict") ||
        headerSnippet.includes("valid permit")
      ) {
        return {
          target: "impounded_overloaded",
          confidence: "high",
          reason: "Identified via Impounded / Overloaded CSV column headers",
        };
      }
    }

    return {
      target: "unassigned",
      confidence: "low",
      reason: "Spreadsheet file without matching pattern. Please select section.",
    };
  }

  return {
    target: "unassigned",
    confidence: "low",
    reason: "Unrecognized file format. Supported: .csv, .xlsx, .pdf, images",
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
