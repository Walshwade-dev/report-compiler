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

export type ManualInputs = {
  casesCleared: number;
  transgressions: number;
  buses3500: number;
  vehicles3500to7000: number;
  vehicles7000: number;
  dailyTransgressions: DailyTransgressionRow[];
  transgressionActions: TransgressionActionRow[];
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
