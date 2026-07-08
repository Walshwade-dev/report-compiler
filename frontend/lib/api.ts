import { UPLOAD_ENDPOINTS } from "./constants";

const DEPLOYED_API_ORIGIN = "https://report-app-px6c.onrender.com";
const LOCAL_API_ORIGIN = "http://127.0.0.1:8000";
const ENV_API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export const API_ORIGIN = ENV_API_ORIGIN || DEPLOYED_API_ORIGIN;

function isLocalBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getApiOrigin() {
  if (ENV_API_ORIGIN) {
    return ENV_API_ORIGIN;
  }

  return isLocalBrowser() ? LOCAL_API_ORIGIN : "";
}

export function isApiConnectionError(error: unknown) {
  return (
    error instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(error.message)
  );
}

export function apiUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  const origin = getApiOrigin();

  return `${origin}/api/${cleanPath}`;
}

export function resolveApiUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const cleanUrl = url.replace(/^\/+/, "");

  if (cleanUrl.startsWith("api/")) {
    const origin = getApiOrigin();

    return `${origin}/${cleanUrl}`;
  }

  return apiUrl(cleanUrl);
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (typeof detail?.message === "string") {
      return detail.message;
    }

    if (typeof body?.message === "string") {
      return body.message;
    }
  } catch {
    // The backend may return an empty or non-JSON error body.
  }

  return fallback;
}

export type CreateReportSessionPayload = {
  report_date: string;
  station: string;
  bound: string;
  weighbridge_name: string;
  prepared_by?: string;
  confirmed_by?: string;
};

export type UpdateReportSessionMetadataPayload = {
  report_date?: string;
  station?: string;
  bound?: string;
  weighbridge_name?: string;
  prepared_by?: string;
  confirmed_by?: string;
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
    cc_records?: {
      buses_gte_3500kg?: number;
      vehicles_3500_to_7000_excluding_buses?: number;
      vehicles_gte_7000_excluding_buses?: number;
    }[];
    mobile_report?: {
      prepared_by?: string;
      confirmed_by?: string;
      route?: string;
      danka_staff?: string;
      police_officers?: string;
      mobile_vehicle?: string;
      mileage_start?: string | number;
      mileage_end?: string | number;
      cases_cleared_in_court?: string | number;
      transgressions_count?: string | number;
      exempted_permit?: string | number;
      manually_weighed?: string | number;
      shifts?: {
        label?: string;
        start_time?: string;
        end_time?: string;
        danka_staff?: string;
        police_officers?: string;
        mobile_vehicle?: string;
        mileage_start?: string | number;
        mileage_end?: string | number;
      }[];
    };
  };

  sections: Record<
    string,
    {
      status: string;
      preview_url?: string;
      summary?: MobileReportSummary;
      filename?: string;
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

  mobile_report?: {
    data?: Record<string, unknown>[];
  };

  mobile_excel_report?: {
    status?: string;
    download_url?: string | null;
  };

  mobile_word_report?: {
    status?: string;
    download_url?: string | null;
  };
};

export type MobileReportSummary = {
  total_records?: number;
  total_trucks_weighed?: number;
  warned_trucks?: number;
  charged_trucks?: number;
  charged_gvw_axle_trucks?: number;
  charged_dimensions_trucks?: number;
  overloaded_records?: number;
  total_excess_kg?: number;
  mismatch_records?: number;
  hourly_counts?: Record<string, number>;
  station?: string;
  report_date?: string;
};

export type MobileReportUploadResponse = ReportSessionResponse & {
  sections: ReportSessionResponse["sections"] & {
    mobile_report?: {
      status: string;
      summary?: MobileReportSummary;
    };
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
  station?: string;
  bound?: string;
  weighbridge_name?: string;
  x_total?: number;
  y_total?: number;
  g_total?: number;
  c_total?: number;
  z_total?: number;
  r_total?: number;
  cases_cleared?: number;
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
      await getErrorMessage(response, "Failed to create report session")
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
      await getErrorMessage(response, `Failed to upload ${section}`)
    );
  }

  return response.json();
}

export async function uploadMobileReportFile(
  reportId: string,
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    apiUrl(`report-sessions/${reportId}/uploads/mobile-report`),
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to upload mobile report register")
    );
  }

  return response.json() as Promise<MobileReportUploadResponse>;
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
    throw new Error(
      await getErrorMessage(response, "Failed to update manual inputs")
    );
  }

  return response.json();
}

function adminHeaders(adminPassword: string) {
  return {
    "X-Admin-Password": adminPassword,
  };
}

export async function getReportSessions(adminPassword: string) {
  const response = await fetch(apiUrl("report-sessions"), {
    headers: adminHeaders(adminPassword),
  });
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch report sessions")
    );
  }
  return response.json() as Promise<ReportSessionResponse[]>;
}

export async function getReportSession(
  reportId: string
) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}`)
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch report session")
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export async function deleteReportSession(reportId: string, adminPassword: string) {
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}`),
    {
      method: "DELETE",
      headers: adminHeaders(adminPassword),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to delete report session")
    );
  }

  return response.json() as Promise<{ status: string; report_id: string }>;
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
      await getErrorMessage(response, "Failed to update report session metadata")
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
      await getErrorMessage(response, "Failed to fetch summary cards")
    );
  }

  return response.json() as Promise<SummaryCardsResponse>;
}

export async function getAnalyticsDashboard(filters?: {
  staticDate?: string;
  mobileDate?: string;
  mobileBound?: string;
}) {
  const query = new URLSearchParams();

  if (filters?.staticDate) {
    query.set("static_date", filters.staticDate);
  }

  if (filters?.mobileDate) {
    query.set("mobile_date", filters.mobileDate);
  }

  if (filters?.mobileBound) {
    query.set("mobile_bound", filters.mobileBound);
  }

  const path = query.size
    ? `report-sessions/analytics/dashboard?${query.toString()}`
    : "report-sessions/analytics/dashboard";

  const response = await fetch(apiUrl(path));

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch analytics dashboard")
    );
  }

  return response.json();
}

export async function getAnalyticsDetails() {
  const response = await fetch(
    apiUrl(`report-sessions/analytics/details`)
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch analytics details")
    );
  }

  return response.json();
}

export type DmsPerformanceRow = {
  name: string;
  surname: string;
  team: string;
  drivers: string[];
  weighed: number;
  charged: number;
  chargeRate: number;
  monthCharged: number;
  reports: number;
};

export type DmsPerformanceResponse = {
  rows: DmsPerformanceRow[];
  totalCharged: number;
  totalWeighed: number;
  reports: number;
};

export async function getDmsPerformance() {
  const response = await fetch(
    apiUrl("report-sessions/analytics/dms-performance")
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch DMS performance")
    );
  }

  return response.json() as Promise<DmsPerformanceResponse>;
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
      await getErrorMessage(response, "Failed to build final report")
    );
  }

  return response.json() as Promise<ReportSessionResponse>;
}

export function getFinalReportDownloadUrl(
  reportId: string
) {
  return apiUrl(`report-sessions/${reportId}/download-final-report`);
}

export function getExcelReportDownloadUrl(
  reportId: string
) {
  return apiUrl(`report-sessions/${reportId}/download-excel-report`);
}

export function getMobileExcelReportDownloadUrl(
  reportId: string
) {
  return apiUrl(`report-sessions/${reportId}/download-mobile-excel-report`);
}

export function getMobileWordReportDownloadUrl(
  reportId: string
) {
  return resolveApiUrl(
    `/api/report-sessions/${reportId}/download-mobile-word-report`
  );
}


export async function getSectionPreviewUrl(
  reportId: string,
  sectionName: string
) {
  return apiUrl(`report-sessions/${reportId}/sections/${sectionName}/preview`);
}

export type SmsSummaryItem = {
  slot: "static_bound_a" | "static_bound_b" | "mobile_1" | "mobile_2";
  title: string;
  exists: boolean;
  report_id: string | null;
  text: string;
};

export async function getSmsSummaryDates(): Promise<string[]> {
  const response = await fetch(apiUrl("report-sessions/sms-summaries/dates"));
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to fetch SMS summary dates")
    );
  }
  return response.json();
}

export async function getSmsSummariesByDate(reportDate: string, station?: string): Promise<SmsSummaryItem[]> {
  const url = station
    ? apiUrl(`report-sessions/sms-summaries/${reportDate}?station=${encodeURIComponent(station)}`)
    : apiUrl(`report-sessions/sms-summaries/${reportDate}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Failed to fetch SMS summaries for date ${reportDate}`)
    );
  }
  return response.json();
}
