"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ReportProgressState = {
  reportType?: "static" | "mobile";
  metadataComplete: boolean;
  uploadsComplete: boolean;
  manualInputsComplete: boolean;
  uploadCount: number;
  uploadTotal?: number;
  canBuild: boolean;
  sessionId: string | null;
  debugManualPayload?: string;
  debugUploadResponse?: string;
};

type ReportProgressContextValue = ReportProgressState & {
  setProgress: (progress: ReportProgressState) => void;
};

const defaultProgress: ReportProgressState = {
  reportType: "static",
  metadataComplete: false,
  uploadsComplete: false,
  manualInputsComplete: false,
  uploadCount: 0,
  uploadTotal: 4,
  canBuild: false,
  sessionId: null,
};

const ReportProgressContext =
  createContext<ReportProgressContextValue | null>(null);


export function useReportProgress() {
  const context = useContext(ReportProgressContext);

  if (!context) {
    throw new Error(
      "useReportProgress must be used inside ReportProgressProvider"
    );
  }

  return context;
}  


export function ReportProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [progress, setProgress] =
    useState<ReportProgressState>(defaultProgress);
  const updateProgress = useCallback((nextProgress: ReportProgressState) => {
    setProgress((previous) => {
      const merged = {
        ...defaultProgress,
        ...nextProgress,
      };

      if (
        previous.reportType === merged.reportType &&
        previous.metadataComplete === merged.metadataComplete &&
        previous.uploadsComplete === merged.uploadsComplete &&
        previous.manualInputsComplete === merged.manualInputsComplete &&
        previous.uploadCount === merged.uploadCount &&
        previous.uploadTotal === merged.uploadTotal &&
        previous.canBuild === merged.canBuild &&
        previous.sessionId === merged.sessionId &&
        previous.debugManualPayload === merged.debugManualPayload &&
        previous.debugUploadResponse === merged.debugUploadResponse
      ) {
        return previous;
      }

      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({
      ...progress,
      setProgress: updateProgress,
    }),
    [progress, updateProgress]
  );

  return (
    <ReportProgressContext.Provider value={value}>
      {children}
    </ReportProgressContext.Provider>
  );
}
