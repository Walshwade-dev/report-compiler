import {
  ManualInputs,
  DailyTransgressionRow,
  TransgressionActionRow,
} from "./types";
import { extractTransgressionOcr } from "./api";

export type TransgressionIngestResult = {
  updatedInputs: ManualInputs;
  extractedDailyList: DailyTransgressionRow[];
  extractedActionList: TransgressionActionRow[];
  extractedCount: number;
  plates: string[];
  duplicates: string[];
  errors: string[];
  feedbackMessage?: string;
  feedbackType?: "success" | "error";
};

export const normalizePlate = (p?: string): string =>
  (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export async function processTransgressionFiles(
  files: File[],
  reportId: string,
  manualInputs: ManualInputs
): Promise<TransgressionIngestResult> {
  const extractedDailyList: DailyTransgressionRow[] = [];
  const extractedActionList: TransgressionActionRow[] = [];
  const plates: string[] = [];
  const duplicates: string[] = [];
  const errors: string[] = [];

  // Extract all files concurrently to minimize wait time
  const extractionResults = await Promise.all(
    files.map(async (file) => {
      try {
        const result = await extractTransgressionOcr(reportId, file);
        return { file, result, error: null };
      } catch (err) {
        return {
          file,
          result: null,
          error: `${file.name}: ${err instanceof Error ? err.message : "Failed to extract"}`,
        };
      }
    })
  );

  for (const item of extractionResults) {
    if (item.error) {
      errors.push(item.error);
      continue;
    }

    const result = item.result;
    if (result && result.success && result.extracted) {
      const newDaily = result.extracted.daily_transgression;
      const newAction = result.extracted.action_report;
      const plate = newDaily.regNo || newAction.truckNo || "Vehicle";
      const normCandidate = normalizePlate(plate);
      const isValidPlate = normCandidate !== "" && normCandidate !== "VEHICLE";

      // Check if details have already been populated for this truck or Tag ID
      const isAlreadyPopulated =
        Boolean(
          isValidPlate &&
            (manualInputs.dailyTransgressions.some(
              (r) => normalizePlate(r.regNo) === normCandidate
            ) ||
              manualInputs.transgressionActions.some(
                (r) => normalizePlate(r.truckNo) === normCandidate
              ) ||
              extractedDailyList.some(
                (r) => normalizePlate(r.regNo) === normCandidate
              ))
        ) ||
        Boolean(
          newAction.attachEvidence &&
            manualInputs.transgressionActions.some((r) => {
              const tagCandidate = newAction.attachEvidence
                .split(",")[0]
                .trim()
                .toUpperCase();
              return (
                tagCandidate.startsWith("TAG") &&
                r.attachEvidence &&
                r.attachEvidence.toUpperCase().includes(tagCandidate)
              );
            })
        );

      if (isAlreadyPopulated) {
        duplicates.push(plate);
      } else {
        extractedDailyList.push(newDaily);
        extractedActionList.push(newAction);
        plates.push(plate);
      }
    } else {
      errors.push(`${item.file.name}: Extraction did not return records.`);
    }
  }

  // Handle duplicates alert
  if (duplicates.length > 0) {
    const uniqueDuplicates = Array.from(new Set(duplicates));
    const dupPlatesText = uniqueDuplicates.map((p) => `"${p}"`).join(", ");
    const alertMsg =
      uniqueDuplicates.length === 1
        ? `Transgression details for ${dupPlatesText} have already been populated and can not be repopulated for the same truck.`
        : `Transgression details for ${dupPlatesText} have already been populated and can not be repopulated for the same trucks.`;

    if (typeof window !== "undefined") {
      window.alert(alertMsg);
    }
  }

  const nextDaily = [...manualInputs.dailyTransgressions, ...extractedDailyList];
  const nextAction = [...manualInputs.transgressionActions, ...extractedActionList];

  const updatedInputs: ManualInputs = {
    ...manualInputs,
    dailyTransgressions: nextDaily,
    transgressionActions: nextAction,
    transgressions: nextDaily.length,
  };

  let feedbackMessage: string | undefined;
  let feedbackType: "success" | "error" | undefined;

  if (extractedDailyList.length > 0) {
    const platesText = plates.map((p) => `"${p}"`).join(", ");
    const successMsg = `successfully extracted transgression details for ${platesText}`;
    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      const dupPlatesText = uniqueDuplicates.map((p) => `"${p}"`).join(", ");
      feedbackMessage = `${successMsg}. Note: details for ${dupPlatesText} were already populated and skipped.`;
      feedbackType = "error";
    } else if (errors.length > 0) {
      feedbackMessage = `${successMsg}. (Errors: ${errors.join("; ")})`;
      feedbackType = "error";
    } else {
      feedbackMessage = successMsg;
      feedbackType = "success";
    }
  } else if (duplicates.length > 0) {
    const uniqueDuplicates = Array.from(new Set(duplicates));
    const dupPlatesText = uniqueDuplicates.map((p) => `"${p}"`).join(", ");
    feedbackMessage = `Transgression details for ${dupPlatesText} have already been populated and can not be repopulated for the same truck.`;
    feedbackType = "error";
  } else if (errors.length > 0) {
    feedbackMessage = errors.join("; ");
    feedbackType = "error";
  }

  return {
    updatedInputs,
    extractedDailyList,
    extractedActionList,
    extractedCount: extractedDailyList.length,
    plates,
    duplicates,
    errors,
    feedbackMessage,
    feedbackType,
  };
}
