import { UPLOAD_ENDPOINTS } from "./constants";

const LOCAL_API_ORIGIN = "http://127.0.0.1:8000";

export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://report-app-px6c.onrender.com"
).replace(/\/+$/, "");

function isHostedBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  return !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export function apiUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  const origin = isHostedBrowser() ? "" : API_ORIGIN || LOCAL_API_ORIGIN;

  return origin
    ? `${origin}/api/${cleanPath}`
    : `/api/${cleanPath}`;
}

export type CreateReportSessionPayload = {
  report_date: string;
  station: string;
  bound: string;
  weighbridge_name: string;
  prepared_by: string;
  confirmed_by: string;
};

export type UpdateReportSessionMetadataPayload = {
  station: string;
  bound: string;
  weighbridge_name: string;
};

export type ReportSessionResponse = {
  report_id: string;

  metadata: {
    report_date?: string;
    station?: string;
    bound?: string;
    weighbridge_name?: string;
    prepared_by?: string;
    confirmed_by?: string;
  };

  manual_inputs?: {
    traffic_census?: {
      buses_gte_3500kg?: number;
      vehicles_3500_to_7000_excluding_buses?: number;
      vehicles_gte_7000_excluding_buses?: number;
    };
    transgressions?: {
      daily_transgressions?: Record<string, unknown>[];
      action_report?: Record<string, unknown>[];
    };
    cases_cleared_in_court?: number;
    transgressions_count?: number;
  };

  sections: Record<
    string,
    {
      status: string;
      preview_url?: string;
    }
  >;

  final_report: {
    status: string;
    download_url: string | null;
    error: string | null;
  };

  excel_report?: {
    download_url: string | null;
  };
};

export type SummaryCard = {
  title: string;
  value: number | null;
  display_value: string;
  status: "ready" | "awaiting_data" | string;
  subtitle: string;
  source: string;
};

export type SummaryCardsResponse = {
  report_id: string;
  cards: SummaryCard[];
};

export async function createReportSession(
  payload: CreateReportSessionPayload
) {
  const response = await fetch(
    apiUrl("report-sessions"),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to create report session"
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export async function uploadSectionFile(
  reportId: string,
  section: keyof typeof UPLOAD_ENDPOINTS,
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const endpoint =
    UPLOAD_ENDPOINTS[section];

  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/uploads/${endpoint}`),
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to upload ${section}`
    );
  }

  return response.json();
}


export async function updateManualInputs(
  reportId: string,
  payload: unknown
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/manual-inputs`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update manual inputs");
  }

  return response.json();
}

export async function getReportSession(
  reportId: string
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}`)
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch report session"
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export async function updateReportSessionMetadata(
  reportId: string,
  payload: UpdateReportSessionMetadataPayload
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/metadata`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to update report session metadata"
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export async function getSummaryCards(
  reportId: string
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/summary-cards`)
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch summary cards"
    );
  }

  return response.json() as Promise<SummaryCardsResponse>;
}

export async function buildFinalReport(
  reportId: string
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/build-final-report`),
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to build final report"
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export async function getFinalReportDownloadUrl(
  reportId: string
) {
  return apiUrl(`report-sessions/${reportId}/download-final-report`);
}

export async function getExcelReportDownloadUrl(
  reportId: string
) {
  return apiUrl(`report-sessions/${reportId}/download-excel-report`);
}


export async function getSectionPreviewUrl(
  reportId: string,
  sectionName: string
) {
  return apiUrl(`report-sessions/${reportId}/sections/${sectionName}/preview`);
}
