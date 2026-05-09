import { UPLOAD_ENDPOINTS } from "./constants";

const LOCAL_ORIGIN = "http://localhost:8000";
const ONLINE_ORIGIN = "https://report-app-uctr.onrender.com";
const HEALTH_CHECK_TIMEOUT_MS = 1200;

let cachedOrigin: string | null = null;

async function canReach(origin: string) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${origin}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getApiOrigin() {
  if (cachedOrigin) {
    return cachedOrigin;
  }

  const isBrowser = typeof window !== "undefined";
  const isLocalFrontend =
    isBrowser &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  cachedOrigin = isLocalFrontend && (await canReach(LOCAL_ORIGIN))
    ? LOCAL_ORIGIN
    : ONLINE_ORIGIN;

  if (process.env.NODE_ENV === "development") {
    console.info(`[api] selected API origin: ${cachedOrigin}`);
  }

  return cachedOrigin;
}

export async function apiUrl(path: string) {
  const origin = await getApiOrigin();
  const cleanPath = path.replace(/^\/+/, "");

  return `${origin}/api/${cleanPath}`;
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
    await apiUrl("report-sessions"),
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
    await apiUrl(`report-sessions/${reportId}/uploads/${endpoint}`),
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
    await apiUrl(`report-sessions/${reportId}/manual-inputs`),
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
    await apiUrl(`report-sessions/${reportId}`)
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
    await apiUrl(`report-sessions/${reportId}/metadata`),
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
    await apiUrl(`report-sessions/${reportId}/summary-cards`)
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
    await apiUrl(`report-sessions/${reportId}/build-final-report`),
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


export async function getSectionPreviewUrl(
  reportId: string,
  sectionName: string
) {
  return apiUrl(`report-sessions/${reportId}/sections/${sectionName}/preview`);
}
