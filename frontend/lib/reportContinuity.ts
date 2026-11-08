import { getReportSessionBySlot } from "./api";

const SYSTEM_BASELINE_DATE = "2026-10-01";

/**
 * Calculates the previous calendar date in YYYY-MM-DD format.
 */
export function getPreviousDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return "";
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
}

/**
 * Formats YYYY-MM-DD into DD/MM/YYYY for user-facing display.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export interface MissingReportCheckResult {
  isMissing: boolean;
  prevDate: string;
  targetDate: string;
  station: string;
  bound: string;
}

/**
 * Checks if the immediately preceding day's report exists in the system.
 * If the target date is after the baseline and the previous day has no report slot,
 * returns isMissing = true to enforce continuous daily record keeping.
 */
export async function checkMissingPreviousReport(
  targetDate: string,
  station: string,
  bound: string
): Promise<MissingReportCheckResult> {
  const fallbackResult: MissingReportCheckResult = {
    isMissing: false,
    prevDate: "",
    targetDate,
    station,
    bound,
  };

  if (!targetDate || !station || !bound) {
    return fallbackResult;
  }

  // Do not enforce for dates on or before system launch baseline
  if (targetDate <= SYSTEM_BASELINE_DATE) {
    return fallbackResult;
  }

  const prevDate = getPreviousDate(targetDate);
  if (!prevDate) {
    return fallbackResult;
  }

  try {
    const existingPrevSession = await getReportSessionBySlot(
      prevDate,
      station,
      bound
    );

    if (!existingPrevSession) {
      return {
        isMissing: true,
        prevDate,
        targetDate,
        station,
        bound,
      };
    }
  } catch (error) {
    // If network or server error occurs, log and avoid locking out if transient
    console.error("Continuity check failed to query previous report slot:", error);
  }

  return fallbackResult;
}
