import type { MobileReportInputs } from "./types";

export interface ParsedMobileBriefing {
  station?: string;
  bound?: "Mobile 1" | "Mobile 2";
  reportDate?: string;
  totalWeighed?: number;
  mobileVehicleReg?: string;
  startMileage?: string;
  stopMileage?: string;
  route?: string;
  dmEntry?: string;
  driverEntry?: string;
  policeOfficerOne?: string;
  policeOfficerTwo?: string;
  shiftTwoDmEntry?: string;
  shiftTwoDriverEntry?: string;
  shiftTwoPoliceOfficerOne?: string;
  shiftTwoPoliceOfficerTwo?: string;
  shiftTwoMobileVehicleReg?: string;
  shiftTwoStartMileage?: string;
  shiftTwoStopMileage?: string;
  casesClearedInCourt?: string;
  transgressionsCount?: string;
  exemptedPermit?: string;
  manuallyWeighed?: string;
  extractedFields: string[];
}

export interface IngestBriefingOptions {
  targetShift?: "shift1" | "shift2" | "auto";
}

/**
 * Parses free-form text from patrol briefings (such as WhatsApp or SMS messages)
 * and extracts standard mobile weighbridge report fields.
 */
export function parseMobileBriefing(
  text: string,
  options: IngestBriefingOptions = {}
): ParsedMobileBriefing {
  const result: ParsedMobileBriefing = {
    extractedFields: [],
  };

  if (!text || !text.trim()) {
    return result;
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const lowerText = text.toLowerCase();

  // 1. Station
  if (lowerText.includes("juja")) {
    result.station = "Juja mobile";
    result.extractedFields.push("Station (Juja mobile)");
  } else if (lowerText.includes("kanyonyo")) {
    result.station = "Kanyonyo mobile";
    result.extractedFields.push("Station (Kanyonyo mobile)");
  } else if (lowerText.includes("isinya")) {
    result.station = "Isinya mobile";
    result.extractedFields.push("Station (Isinya mobile)");
  } else if (lowerText.includes("athi")) {
    result.station = "Athi River mobile";
    result.extractedFields.push("Station (Athi River mobile)");
  } else if (lowerText.includes("gilgil")) {
    result.station = "Gilgil mobile";
    result.extractedFields.push("Station (Gilgil mobile)");
  } else if (lowerText.includes("suswa")) {
    result.station = "Suswa mobile";
    result.extractedFields.push("Station (Suswa mobile)");
  }

  // 2. Bound / Shift
  if (/\bmobile\s*2\b|\bshift\s*2\b/i.test(text)) {
    result.bound = "Mobile 2";
    result.extractedFields.push("Shift (Mobile 2)");
  } else if (/\bmobile\s*1\b|\bshift\s*1\b/i.test(text)) {
    result.bound = "Mobile 1";
    result.extractedFields.push("Shift (Mobile 1)");
  }

  // 3. Date
  const dmyMatch = text.match(
    /(?:date|dated)?[:\s]*\b([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{4})\b/i
  );
  const ymdMatch = text.match(
    /(?:date|dated)?[:\s]*\b([0-9]{4})[-/.]([0-9]{1,2})[-/.]([0-9]{1,2})\b/i
  );
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    result.reportDate = `${year}-${month}-${day}`;
    result.extractedFields.push(`Date (${result.reportDate})`);
  } else if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    result.reportDate = `${year}-${month}-${day}`;
    result.extractedFields.push(`Date (${result.reportDate})`);
  }

  // Check if text has distinct Shift 1 and Shift 2 sections
  const shift1Index = text.search(/\bshift\s*1\b/i);
  const shift2Index = text.search(/\bshift\s*2\b/i);
  const hasBothShifts = shift1Index !== -1 && shift2Index !== -1;

  function parseShiftBlock(blockText: string) {
    const blockLines = blockText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const data: Partial<ParsedMobileBriefing> = {};

    // Vehicle Reg
    const vehMatch = blockText.match(
      /(?:vehicle(?:\s*reg(?:istration)?)?|reg(?:\s*no)?)\s*[:\-]\s*([A-Z0-9\s]+?)(?=\s*(?:\n|kms|km|$))/i
    );
    if (vehMatch) {
      data.mobileVehicleReg = vehMatch[1]
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
    }

    // Start Mileage
    const startMilMatch = blockText.match(
      /(?:start(?:ing)?|open(?:ing)?)\s*(?:mileage)?\s*[:\-]\s*([0-9,\s]+)/i
    );
    if (startMilMatch) {
      data.startMileage = startMilMatch[1].replace(/[^0-9]/g, "");
    }

    // Stop Mileage
    const stopMilMatch = blockText.match(
      /(?:clos(?:ing)?|end(?:ing)?|stop(?:ping)?)\s*(?:mileage)?\s*[:\-]\s*([0-9,\s]+)/i
    );
    if (stopMilMatch) {
      data.stopMileage = stopMilMatch[1].replace(/[^0-9]/g, "");
    }

    // DM
    const dmMatch = blockText.match(/\bDM\s*[:\-]\s*([^\n/]+)/i);
    if (dmMatch) {
      data.dmEntry = dmMatch[1].trim();
    }

    // Driver
    const driverMatch = blockText.match(/\bDriver\s*[:\-]\s*([^\n/]+)/i);
    if (driverMatch) {
      data.driverEntry = driverMatch[1].trim();
    }

    // Police
    const pInline = blockText.match(
      /police(?:\s*officers?)?\s*[:\-]\s*([^\n]+)/i
    );
    if (pInline && pInline[1].trim()) {
      const inlineVal = pInline[1].trim();
      if (/[/,&]|\band\b/i.test(inlineVal)) {
        const parts = inlineVal.split(/[/,&]|\band\b/i).map((p) => p.trim());
        data.policeOfficerOne = parts[0] || "";
        data.policeOfficerTwo = parts[1] || "";
      } else {
        data.policeOfficerOne = inlineVal;
      }
    }
    if (!data.policeOfficerOne || !data.policeOfficerTwo) {
      const pIdx = blockLines.findIndex((l) =>
        /^police(?:\s*officers?)?[:\s]*$/i.test(l)
      );
      if (pIdx !== -1) {
        let nextIdx = pIdx + 1;
        if (!data.policeOfficerOne && blockLines[nextIdx] && !blockLines[nextIdx].includes(":")) {
          data.policeOfficerOne = blockLines[nextIdx].trim();
          nextIdx++;
        }
        if (!data.policeOfficerTwo && blockLines[nextIdx] && !blockLines[nextIdx].includes(":")) {
          data.policeOfficerTwo = blockLines[nextIdx].trim();
        }
      }
    }

    return data;
  }

  if (hasBothShifts) {
    const firstShiftPos = Math.min(shift1Index, shift2Index);
    const secondShiftPos = Math.max(shift1Index, shift2Index);
    const block1 = text.substring(firstShiftPos, secondShiftPos);
    const block2 = text.substring(secondShiftPos);

    const s1Data =
      shift1Index < shift2Index
        ? parseShiftBlock(block1)
        : parseShiftBlock(block2);
    const s2Data =
      shift1Index < shift2Index
        ? parseShiftBlock(block2)
        : parseShiftBlock(block1);

    // Populate Shift 1
    if (s1Data.mobileVehicleReg) {
      result.mobileVehicleReg = s1Data.mobileVehicleReg;
      result.extractedFields.push(`Shift 1 Vehicle (${s1Data.mobileVehicleReg})`);
    }
    if (s1Data.startMileage) {
      result.startMileage = s1Data.startMileage;
      result.extractedFields.push(`Shift 1 Start Mileage (${s1Data.startMileage})`);
    }
    if (s1Data.stopMileage) {
      result.stopMileage = s1Data.stopMileage;
      result.extractedFields.push(`Shift 1 Stop Mileage (${s1Data.stopMileage})`);
    }
    if (s1Data.dmEntry) {
      result.dmEntry = s1Data.dmEntry;
      result.extractedFields.push(`Shift 1 DM (${s1Data.dmEntry})`);
    }
    if (s1Data.driverEntry) {
      result.driverEntry = s1Data.driverEntry;
      result.extractedFields.push(`Shift 1 Driver (${s1Data.driverEntry})`);
    }
    if (s1Data.policeOfficerOne) {
      result.policeOfficerOne = s1Data.policeOfficerOne;
      result.extractedFields.push(`Shift 1 Police 1 (${s1Data.policeOfficerOne})`);
    }
    if (s1Data.policeOfficerTwo) {
      result.policeOfficerTwo = s1Data.policeOfficerTwo;
      result.extractedFields.push(`Shift 1 Police 2 (${s1Data.policeOfficerTwo})`);
    }

    // Populate Shift 2
    if (s2Data.mobileVehicleReg) {
      result.shiftTwoMobileVehicleReg = s2Data.mobileVehicleReg;
      result.extractedFields.push(`Shift 2 Vehicle (${s2Data.mobileVehicleReg})`);
    }
    if (s2Data.startMileage) {
      result.shiftTwoStartMileage = s2Data.startMileage;
      result.extractedFields.push(`Shift 2 Start Mileage (${s2Data.startMileage})`);
    }
    if (s2Data.stopMileage) {
      result.shiftTwoStopMileage = s2Data.stopMileage;
      result.extractedFields.push(`Shift 2 Stop Mileage (${s2Data.stopMileage})`);
    }
    if (s2Data.dmEntry) {
      result.shiftTwoDmEntry = s2Data.dmEntry;
      result.extractedFields.push(`Shift 2 DM (${s2Data.dmEntry})`);
    }
    if (s2Data.driverEntry) {
      result.shiftTwoDriverEntry = s2Data.driverEntry;
      result.extractedFields.push(`Shift 2 Driver (${s2Data.driverEntry})`);
    }
    if (s2Data.policeOfficerOne) {
      result.shiftTwoPoliceOfficerOne = s2Data.policeOfficerOne;
      result.extractedFields.push(`Shift 2 Police 1 (${s2Data.policeOfficerOne})`);
    }
    if (s2Data.policeOfficerTwo) {
      result.shiftTwoPoliceOfficerTwo = s2Data.policeOfficerTwo;
      result.extractedFields.push(`Shift 2 Police 2 (${s2Data.policeOfficerTwo})`);
    }
  } else {
    // Single shift block
    const singleData = parseShiftBlock(text);
    const target =
      options.targetShift || (shift2Index !== -1 ? "shift2" : "shift1");

    if (target === "shift2") {
      if (singleData.mobileVehicleReg) {
        result.shiftTwoMobileVehicleReg = singleData.mobileVehicleReg;
        result.extractedFields.push(
          `Shift 2 Vehicle (${singleData.mobileVehicleReg})`
        );
      }
      if (singleData.startMileage) {
        result.shiftTwoStartMileage = singleData.startMileage;
        result.extractedFields.push(
          `Shift 2 Start Mileage (${singleData.startMileage})`
        );
      }
      if (singleData.stopMileage) {
        result.shiftTwoStopMileage = singleData.stopMileage;
        result.extractedFields.push(
          `Shift 2 Stop Mileage (${singleData.stopMileage})`
        );
      }
      if (singleData.dmEntry) {
        result.shiftTwoDmEntry = singleData.dmEntry;
        result.extractedFields.push(`Shift 2 DM (${singleData.dmEntry})`);
      }
      if (singleData.driverEntry) {
        result.shiftTwoDriverEntry = singleData.driverEntry;
        result.extractedFields.push(`Shift 2 Driver (${singleData.driverEntry})`);
      }
      if (singleData.policeOfficerOne) {
        result.shiftTwoPoliceOfficerOne = singleData.policeOfficerOne;
        result.extractedFields.push(
          `Shift 2 Police 1 (${singleData.policeOfficerOne})`
        );
      }
      if (singleData.policeOfficerTwo) {
        result.shiftTwoPoliceOfficerTwo = singleData.policeOfficerTwo;
        result.extractedFields.push(
          `Shift 2 Police 2 (${singleData.policeOfficerTwo})`
        );
      }
    } else {
      if (singleData.mobileVehicleReg) {
        result.mobileVehicleReg = singleData.mobileVehicleReg;
        result.extractedFields.push(`Vehicle (${singleData.mobileVehicleReg})`);
      }
      if (singleData.startMileage) {
        result.startMileage = singleData.startMileage;
        result.extractedFields.push(
          `Start Mileage (${singleData.startMileage})`
        );
      }
      if (singleData.stopMileage) {
        result.stopMileage = singleData.stopMileage;
        result.extractedFields.push(`Stop Mileage (${singleData.stopMileage})`);
      }
      if (singleData.dmEntry) {
        result.dmEntry = singleData.dmEntry;
        result.extractedFields.push(`DM (${singleData.dmEntry})`);
      }
      if (singleData.driverEntry) {
        result.driverEntry = singleData.driverEntry;
        result.extractedFields.push(`Driver (${singleData.driverEntry})`);
      }
      if (singleData.policeOfficerOne) {
        result.policeOfficerOne = singleData.policeOfficerOne;
        result.extractedFields.push(
          `Police 1 (${singleData.policeOfficerOne})`
        );
      }
      if (singleData.policeOfficerTwo) {
        result.policeOfficerTwo = singleData.policeOfficerTwo;
        result.extractedFields.push(
          `Police 2 (${singleData.policeOfficerTwo})`
        );
      }
    }
  }

  // Route
  const routeInline = text.match(/(?:actual\s+route|route)\s*[:\-]\s*([^\n]+)/i);
  if (routeInline && routeInline[1].trim()) {
    result.route = routeInline[1].trim().toUpperCase();
    result.extractedFields.push("Route");
  } else {
    const rIdx = lines.findIndex((l) =>
      /^(?:actual\s+route|route)[:\s]*$/i.test(l)
    );
    if (rIdx !== -1 && lines[rIdx + 1]) {
      result.route = lines[rIdx + 1].trim().toUpperCase();
      result.extractedFields.push("Route");
    }
  }

  // Weighed / Total Weighed
  const weighedMatch = text.match(/(?:weighed|total\s*weighed)\s*[:\-]\s*([0-9]+)/i);
  if (weighedMatch) {
    result.totalWeighed = parseInt(weighedMatch[1], 10);
    result.extractedFields.push(`Weighed (${weighedMatch[1]})`);
  }

  // Offloaded / Transgressions / Court cases / Permits / Manually Weighed
  const transMatch = text.match(
    /(?:transgressions?|offloaded)\s*[:\-]\s*([0-9]+)/i
  );
  if (transMatch) {
    result.transgressionsCount = transMatch[1];
    result.extractedFields.push(`Transgressions (${transMatch[1]})`);
  }

  const courtMatch = text.match(
    /(?:court\s*cases?|cases\s*cleared)\s*[:\-]\s*([0-9]+)/i
  );
  if (courtMatch) {
    result.casesClearedInCourt = courtMatch[1];
    result.extractedFields.push(`Court Cases (${courtMatch[1]})`);
  }

  const permitMatch = text.match(/(?:exempted|permit)\s*[:\-]\s*([0-9]+)/i);
  if (permitMatch) {
    result.exemptedPermit = permitMatch[1];
    result.extractedFields.push(`Exempted Permit (${permitMatch[1]})`);
  }

  const manualMatch = text.match(
    /(?:manually\s*weighed)\s*[:\-]\s*([0-9]+)/i
  );
  if (manualMatch) {
    result.manuallyWeighed = manualMatch[1];
    result.extractedFields.push(`Manually Weighed (${manualMatch[1]})`);
  }

  return result;
}

/**
 * Applies parsed briefing fields onto existing MobileReportInputs
 */
export function applyBriefingToInputs(
  currentInputs: MobileReportInputs,
  parsed: ParsedMobileBriefing,
  options: { includeDateAndShift?: boolean } = { includeDateAndShift: true }
): MobileReportInputs {
  const next = { ...currentInputs };

  if (options.includeDateAndShift !== false) {
    if (parsed.station) next.station = parsed.station;
    if (parsed.bound) next.bound = parsed.bound;
    if (parsed.reportDate) next.reportDate = parsed.reportDate;
  }

  if (parsed.totalWeighed !== undefined) {
    next.totalWeighed = parsed.totalWeighed;
  }

  // Shift 1 / Single shift
  if (parsed.mobileVehicleReg) next.mobileVehicleReg = parsed.mobileVehicleReg;
  if (parsed.startMileage) next.startMileage = parsed.startMileage;
  if (parsed.stopMileage) next.stopMileage = parsed.stopMileage;
  if (parsed.dmEntry) next.dmEntry = parsed.dmEntry;
  if (parsed.driverEntry) next.driverEntry = parsed.driverEntry;
  if (parsed.policeOfficerOne) next.policeOfficerOne = parsed.policeOfficerOne;
  if (parsed.policeOfficerTwo) next.policeOfficerTwo = parsed.policeOfficerTwo;

  // Shift 2
  if (parsed.shiftTwoMobileVehicleReg)
    next.shiftTwoMobileVehicleReg = parsed.shiftTwoMobileVehicleReg;
  if (parsed.shiftTwoStartMileage)
    next.shiftTwoStartMileage = parsed.shiftTwoStartMileage;
  if (parsed.shiftTwoStopMileage)
    next.shiftTwoStopMileage = parsed.shiftTwoStopMileage;
  if (parsed.shiftTwoDmEntry) next.shiftTwoDmEntry = parsed.shiftTwoDmEntry;
  if (parsed.shiftTwoDriverEntry)
    next.shiftTwoDriverEntry = parsed.shiftTwoDriverEntry;
  if (parsed.shiftTwoPoliceOfficerOne)
    next.shiftTwoPoliceOfficerOne = parsed.shiftTwoPoliceOfficerOne;
  if (parsed.shiftTwoPoliceOfficerTwo)
    next.shiftTwoPoliceOfficerTwo = parsed.shiftTwoPoliceOfficerTwo;

  // Route & compliance counters
  if (parsed.route) next.route = parsed.route;
  if (parsed.transgressionsCount !== undefined)
    next.transgressionsCount = parsed.transgressionsCount;
  if (parsed.casesClearedInCourt !== undefined)
    next.casesClearedInCourt = parsed.casesClearedInCourt;
  if (parsed.exemptedPermit !== undefined)
    next.exemptedPermit = parsed.exemptedPermit;
  if (parsed.manuallyWeighed !== undefined)
    next.manuallyWeighed = parsed.manuallyWeighed;

  return next;
}
