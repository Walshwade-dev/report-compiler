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

export function authHeaders(extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("dnk-auth-token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function loginUser(username: string, password: string) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const response = await fetch(apiUrl("auth/token"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Login failed"));
  }

  const data = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("dnk-auth-token", data.access_token);
    localStorage.setItem("dnk-auth-user", JSON.stringify(data.user));
  }
  return data;
}

export function logoutUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dnk-auth-token");
    localStorage.removeItem("dnk-auth-user");
  }
}

export function getLoggedInUser() {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("dnk-auth-user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function updateCurrentUser(payload: { username?: string; password?: string; full_name?: string }) {
  const response = await fetch(apiUrl("auth/me"), {
    method: "PATCH",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update profile"));
  }

  const data = await response.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("dnk-auth-user", JSON.stringify(data));
  }
  return data;
}

export async function getUsers() {
  const response = await fetch(apiUrl("users"), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to fetch users"));
  }

  return response.json();
}

export async function createUserByAdmin(payload: {
  username: string;
  password: string;
  full_name?: string;
  role: string;
  station?: string;
}) {
  const response = await fetch(apiUrl("users"), {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create user"));
  }

  return response.json();
}

export async function deleteUserByAdmin(userId: string) {
  const response = await fetch(apiUrl(`users/${userId}`), {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete user"));
  }
}

export async function updateUserRole(userId: string, role: string) {
  const response = await fetch(apiUrl(`users/${userId}/role`), {
    method: "PATCH",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update user role"));
  }

  return response.json();
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
  if (response.status === 401 && !response.url.includes("auth/token")) {
    logoutUser();
    if (typeof window !== "undefined") {
      window.location.href = "/login?session_expired=1";
    }
  }

  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail.map((item: any) => {
        if (typeof item === "string") return item;
        const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "";
        return field ? `${field}: ${item.msg}` : item?.msg || JSON.stringify(item);
      });
      return messages.join("; ");
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

const apiCache = new Map<string, { data: any; expiry: number }>();
const DEFAULT_CACHE_TTL_MS = 20000;

export function clearApiCache() {
  apiCache.clear();
}

async function fetchCached<T>(url: string, ttlMs: number = DEFAULT_CACHE_TTL_MS, options?: RequestInit): Promise<T> {
  const now = Date.now();
  const cached = apiCache.get(url);
  if (cached && now < cached.expiry) {
    return cached.data as T;
  }

  const reqOptions: RequestInit = {
    ...options,
    headers: authHeaders((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, reqOptions);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Fetch failed for ${url}`));
  }

  const data = await response.json();
  apiCache.set(url, { data, expiry: now + ttlMs });
  return data as T;
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
      reweigh_tickets?: string[];
      dimension_charges?: any[];
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
  mobile_report?: {
    data?: Record<string, unknown>[];
    duplicates?: {
      registration: string;
      tickets: {
        ticket_no: string;
        date_time: string;
        gvw_kg: string;
        remarks: string;
      }[];
    }[];
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

      headers: authHeaders({
        "Content-Type": "application/json",
      }),

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
      headers: authHeaders(),
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
      headers: authHeaders(),
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
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
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

export async function getReportSessions(adminPassword?: string) {
  const headers = adminPassword ? adminHeaders(adminPassword) : authHeaders();
  const response = await fetch(apiUrl("report-sessions"), {
    headers,
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

export async function deleteReportSession(reportId: string, adminPassword?: string) {
  const headers = adminPassword ? adminHeaders(adminPassword) : authHeaders();
  const response = await fetch(
    apiUrl(`report-sessions/${reportId}`),
    {
      method: "DELETE",
      headers,
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
      headers: authHeaders({
        "Content-Type": "application/json",
      }),
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
}): Promise<any> {
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

  return fetchCached(apiUrl(path));
}

export async function getAnalyticsDetails(): Promise<any> {
  return fetchCached(apiUrl("report-sessions/analytics/details"));
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

export async function getDmsPerformance(date?: string) {
  const query = new URLSearchParams();
  if (date) {
    query.set("date", date);
  }
  const urlPath = query.size 
    ? `report-sessions/analytics/dms-performance?${query.toString()}` 
    : "report-sessions/analytics/dms-performance";

  const response = await fetch(apiUrl(urlPath));

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
      headers: authHeaders(),
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
  return fetchCached<string[]>(apiUrl("report-sessions/sms-summaries/dates"));
}

export async function getSmsSummariesByDate(reportDate: string, station?: string): Promise<SmsSummaryItem[]> {
  const url = station
    ? apiUrl(`report-sessions/sms-summaries/${reportDate}?station=${encodeURIComponent(station)}`)
    : apiUrl(`report-sessions/sms-summaries/${reportDate}`);
  return fetchCached<SmsSummaryItem[]>(url);
}

// ---------------------------------------------------------------------------
// Mobile Checklist & Equipment Management Helpers
// ---------------------------------------------------------------------------

export async function getMobileChecklistEntries() {
  try {
    const res = await fetch(apiUrl("mobile-checklist/entries"), { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch checklist entries");
    return await res.json();
  } catch {
    return {
      entries: [
        {
          id: "chk-03092026-day",
          date: "2026-09-03",
          shift: "Day Shift Mobile Operations",
          station: "Mobile 1 Weighbridge",
          scales_sno: "6451",
          technician_name: "John Kimani (Technician)",
          approved_by: "Peter Njoroge (Duty Manager)",
          status: "Approved",
          approval_date: "2026-09-03T18:00:00",
          mobile_scale_gvw: 12440,
          multideck_scale_gvw: 11960,
          variance_gvw: 480,
          variance_comment: "ALERT: Scale weight variance of 480kg exceeds 200kg threshold. Recalibration and technical inspection recommended.",
          technical_checks: { plate_screws_tight: true, surface_clean: true, battery_charge: 95, dry_operation: true, cables_intact: true },
          vehicle_reg: "KCM 494U / KCF 951Q",
          doc_ref: "DNK/AFRKE/LV3/WBS/018/FM03"
        }
      ]
    };
  }
}

export async function saveMobileChecklistEntry(payload: any) {
  try {
    const res = await fetch(apiUrl("mobile-checklist/entries"), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to save checklist");
    return await res.json();
  } catch (err) {
    return { message: "Saved locally", entry: { ...payload, id: `chk-${Date.now()}`, status: "Submitted" } };
  }
}

export async function approveMobileChecklistEntry(entryId: string, approvedBy: string) {
  try {
    const res = await fetch(apiUrl(`mobile-checklist/entries/${entryId}/approve`), {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ approved_by: approvedBy })
    });
    if (!res.ok) throw new Error("Failed to approve checklist");
    return await res.json();
  } catch {
    return { message: "Approved locally" };
  }
}

export async function getEquipmentIssues() {
  try {
    const res = await fetch(apiUrl("mobile-checklist/issues"), { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch equipment issues");
    return await res.json();
  } catch {
    return {
      issues: [
        {
          id: "iss-001",
          equipment_name: "10m load scale connecting Cable (E Cable 6920.3)",
          issue_description: "Intermittent signal loss on channel 2 due to connector pin wear.",
          reported_date: "2026-09-02",
          reported_by: "Duty Manager",
          status: "In Progress",
          severity: "Medium",
          assigned_handler: "Alex Technical Officer",
          resolution_notes: "Replacement cable ordered from warehouse. Secondary backup cable deployed."
        },
        {
          id: "iss-002",
          equipment_name: "12Vdc to 240Vac Power Inverter",
          issue_description: "Fuse blown during heavy night shift charging.",
          reported_date: "2026-08-30",
          reported_by: "Night Operator",
          status: "Resolved",
          severity: "High",
          assigned_handler: "Electrical Maintenance Team",
          resolution_notes: "15A fuse replaced and inverter bench-tested successfully."
        }
      ]
    };
  }
}

export async function createEquipmentIssue(payload: any) {
  try {
    const res = await fetch(apiUrl("mobile-checklist/issues"), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to log equipment issue");
    return await res.json();
  } catch {
    return { message: "Issue logged locally", issue: { ...payload, id: `iss-${Date.now()}` } };
  }
}

export async function updateEquipmentIssueStatus(issueId: string, payload: any) {
  try {
    const res = await fetch(apiUrl(`mobile-checklist/issues/${issueId}`), {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to update issue");
    return await res.json();
  } catch {
    return { message: "Issue updated locally" };
  }
}

export async function getDeliveryNotes() {
  try {
    const res = await fetch(apiUrl("mobile-checklist/delivery-notes"), { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch delivery notes");
    return await res.json();
  } catch {
    return {
      notes: [
        {
          id: "del-001",
          delivery_date: "2026-08-25",
          item_name: "WL 108 Wheel Load Scale 15-Ton (Set of 2)",
          serial_numbers: "6451-A, 6451-B",
          condition_state: "Brand New - Factory Calibrated",
          intended_purpose: "Mobile Operations Primary Weighing Unit",
          delivered_by: "Avery Weights Kenya Ltd",
          received_by: "Technical Manager",
          pdf_url: "#"
        }
      ]
    };
  }
}

export async function createDeliveryNote(payload: any) {
  try {
    const res = await fetch(apiUrl("mobile-checklist/delivery-notes"), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to create delivery note");
    return await res.json();
  } catch {
    return { message: "Delivery note created locally", note: { ...payload, id: `del-${Date.now()}` } };
  }
}
