import { ManualInputs, CCRecordRow } from "./types";
import { extractCensusOcr } from "./api";

export type CensusIngestResult = {
  updatedInputs: ManualInputs;
  extractedValues?: {
    buses3500: number;
    vehicles3500to7000: number;
    vehicles7000: number;
    ccRecords: CCRecordRow[];
  };
  success: boolean;
  feedbackMessage?: string;
  feedbackType?: "success" | "error";
  errors: string[];
};

export async function processCensusFiles(
  files: File[],
  reportId: string,
  manualInputs: ManualInputs
): Promise<CensusIngestResult> {
  const errors: string[] = [];
  let updatedInputs = { ...manualInputs };
  let extractedSuccess = false;
  let summaryDetails = "";
  let extractedValues:
    | {
        buses3500: number;
        vehicles3500to7000: number;
        vehicles7000: number;
        ccRecords: CCRecordRow[];
      }
    | undefined = undefined;

  // Extract all files concurrently to minimize wait time
  const extractionResults = await Promise.all(
    files.map(async (file) => {
      try {
        const result = await extractCensusOcr(reportId, file);
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
    if (result && result.success && result.cc_records && result.cc_records.length > 0) {
      const nextCcRecords: CCRecordRow[] = [
        result.cc_records[0] || { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        result.cc_records[1] || { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
        result.cc_records[2] || { buses_gte_3500kg: 0, vehicles_3500_to_7000_excluding_buses: 0, vehicles_gte_7000_excluding_buses: 0 },
      ];

      const totalBuses = result.grand_total?.buses_gte_3500kg ?? nextCcRecords.reduce((sum, r) => sum + r.buses_gte_3500kg, 0);
      const totalV3500 = result.grand_total?.vehicles_3500_to_7000_excluding_buses ?? nextCcRecords.reduce((sum, r) => sum + r.vehicles_3500_to_7000_excluding_buses, 0);
      const totalV7000 = result.grand_total?.vehicles_gte_7000_excluding_buses ?? nextCcRecords.reduce((sum, r) => sum + r.vehicles_gte_7000_excluding_buses, 0);

      extractedValues = {
        buses3500: totalBuses,
        vehicles3500to7000: totalV3500,
        vehicles7000: totalV7000,
        ccRecords: nextCcRecords,
      };

      updatedInputs = {
        ...updatedInputs,
        ...extractedValues,
      };

      summaryDetails = `Populated 3 shifts (Total: ${totalBuses.toLocaleString()} buses, ${totalV3500.toLocaleString()} empty trucks 3.5k-7k, ${totalV7000.toLocaleString()} empty trucks >7k)${result.checksum_valid ? " [checksum verified]" : ""}.`;
      extractedSuccess = true;
    } else {
      errors.push(`${item.file.name}: Extraction did not return shift records.`);
    }
  }

  if (extractedSuccess) {
    return {
      updatedInputs,
      extractedValues,
      success: true,
      feedbackMessage: `Successfully scanned traffic census records from ${files.length} document(s). ${summaryDetails}`,
      feedbackType: "success",
      errors,
    };
  }

  return {
    updatedInputs: manualInputs,
    extractedValues: undefined,
    success: false,
    feedbackMessage:
      errors.length > 0
        ? `Census OCR extraction encountered issues: ${errors.join("; ")}`
        : "No census records extracted from the provided files.",
    feedbackType: "error",
    errors,
  };
}
