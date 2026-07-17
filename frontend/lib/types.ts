export type UploadKey =
  | "daily_hour"
  | "wideload"
  | "impounded_prohibited"
  | "impounded_overloaded";

export type UploadStatus =
  | "missing"
  | "selected"
  | "uploaded";

export type BuildStatus =
  | "not_ready"
  | "ready"
  | "building"
  | "completed"
  | "error";

export type UploadState = {
  status: "missing" | "selected" | "uploaded" | "error";
  filename?: string;
  error?: string;
};


export type ReportMetadata = {
  date: string;
  preparedBy: string;
  approvedBy: string;
};

export type DailyTransgressionRow = {
  date: string;
  time: string;
  regNo: string;
  axleConfig: string;
  transporter: string;
  censusClerk: string;
  policeInCharge: string;
  actionTaken: string;
  caught: string;
  nextWbReportSent: string;
  nextWb: string;
};

export type TransgressionActionRow = {
  date: string;
  timeReceived: string;
  truckNo: string;
  sendingWbStation: string;
  ocsReportedTo: string;
  action1: string;
  action2: string;
  attachEvidence: string;
  weightNoted: string;
  taggedInSystem: string;
};

export type CCRecordRow = {
  buses_gte_3500kg: number;
  vehicles_3500_to_7000_excluding_buses: number;
  vehicles_gte_7000_excluding_buses: number;
};

export type ManualInputs = {
  casesCleared: number;
  transgressions: number;
  buses3500: number;
  vehicles3500to7000: number;
  vehicles7000: number;
  ccRecords: CCRecordRow[];
  dailyTransgressions: DailyTransgressionRow[];
  transgressionActions: TransgressionActionRow[];
};

export type MobileChargeAction =
  | "charged"
  | "warned"
  | "legal";

export type MobileChargeType =
  | "gvw_axle"
  | "dimensions";

export type MobileVehicleChargeRow = {
  id: string;
  dateWeighed: string;
  vehicleReg: string;
  transporter: string;
  configuration: string;
  chargeType: MobileChargeType;
  action: MobileChargeAction;
  gvwExcessKg: string;
  axleExcessKg: string;
  dimensionDetails: string;
  origin: string;
  destination: string;
  cargo: string;
  remarks: string;
};

export type MobileReportInputs = {
  station: string;
  bound: string;
  reportDate: string;
  preparedBy: string;
  approvedBy: string;
  totalWeighed: number;
  dmEntry: string;
  driverEntry: string;
  policeOfficerOne: string;
  policeOfficerTwo: string;
  shiftTwoDmEntry: string;
  shiftTwoDriverEntry: string;
  shiftTwoPoliceOfficerOne: string;
  shiftTwoPoliceOfficerTwo: string;
  route: string;
  mobileVehicleReg: string;
  startMileage: string;
  stopMileage: string;
  shiftTwoMobileVehicleReg: string;
  shiftTwoStartMileage: string;
  shiftTwoStopMileage: string;
  casesClearedInCourt: string;
  transgressionsCount: string;
  exemptedPermit: string;
  manuallyWeighed: string;
  vehicleCharges: MobileVehicleChargeRow[];
  reweigh_tickets?: string[];
  dimension_charges?: any[];
};

export type PreviewFormat =
  | "png"
  | "pdf"
  | "docx";

export type ReportSection =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7;
