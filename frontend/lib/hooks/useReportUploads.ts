import { useState, useCallback } from "react";
import { UploadKey, UploadState } from "../types";
import { uploadSectionFile, ReportSessionResponse } from "../api";
import { BACKEND_SECTION_KEYS, BACKEND_SECTION_STATUS_MAP } from "../constants";
import { isSupportedSpreadsheetFile, supportedSpreadsheetFileMessage } from "../files";

export function useReportUploads(
  reportId: string | null,
  onUploadSuccess?: (session: ReportSessionResponse) => void
) {
  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>({
    daily_hour: { status: "missing" },
    wideload: { status: "missing" },
    impounded_prohibited: { status: "missing" },
    impounded_overloaded: { status: "missing" },
  });

  const uploadCount = Object.values(uploads).filter(
    (upload) => upload.status === "uploaded"
  ).length;

  const uploadsComplete = uploadCount === 4;

  const setUploadsStateFromSession = useCallback((session: ReportSessionResponse) => {
    if (!session) return;

    const restoredUploads: Record<UploadKey, UploadState> = {
      daily_hour: { status: "missing" },
      wideload: { status: "missing" },
      impounded_prohibited: { status: "missing" },
      impounded_overloaded: { status: "missing" },
    };

    (Object.keys(BACKEND_SECTION_KEYS) as UploadKey[]).forEach((key) => {
      const backendKey = BACKEND_SECTION_KEYS[key];
      const section = session.sections?.[backendKey];

      if (!section) return;

      const mappedStatus =
        BACKEND_SECTION_STATUS_MAP[
          section.status as keyof typeof BACKEND_SECTION_STATUS_MAP
        ] || "missing";

      restoredUploads[key] = {
        status: mappedStatus,
        filename: section.filename || undefined,
      };
    });

    setUploads(restoredUploads);
  }, []);

  const handleSectionUpload = useCallback(async (section: UploadKey, file: File) => {
    if (!isSupportedSpreadsheetFile(file)) {
      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "error",
          filename: file.name,
          error: supportedSpreadsheetFileMessage(),
        },
      }));
      return;
    }

    if (!reportId) {
      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "error",
          filename: file.name,
          error: "Start a report workspace before uploading files.",
        },
      }));
      return;
    }

    try {
      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "selected",
          filename: file.name,
          error: undefined,
        },
      }));

      const response = await uploadSectionFile(reportId, section, file);

      // Set state from the new session details (this updates all section states, 
      // which handles cases like wideload updating daily_hour as well)
      setUploadsStateFromSession(response);

      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);

      const err = error as {
        response?: {
          data?: {
            detail?: { message?: string } | string;
          };
        };
        message?: string;
      };
      const detail = err?.response?.data?.detail;
      const message =
        (typeof detail === "object" && detail?.message) ||
        (typeof detail === "string" ? detail : undefined) ||
        err?.message ||
        "Upload failed. Please check that the file matches the expected format.";

      setUploads((prev) => ({
        ...prev,
        [section]: {
          status: "error",
          filename: file.name,
          error: typeof message === "string" ? message : JSON.stringify(message),
        },
      }));
    }
  }, [reportId, setUploadsStateFromSession, onUploadSuccess]);

  const resetUploads = useCallback(() => {
    setUploads({
      daily_hour: { status: "missing" },
      wideload: { status: "missing" },
      impounded_prohibited: { status: "missing" },
      impounded_overloaded: { status: "missing" },
    });
  }, []);

  return {
    uploads,
    uploadCount,
    uploadsComplete,
    handleSectionUpload,
    setUploadsStateFromSession,
    resetUploads,
  };
}
