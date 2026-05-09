"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type ReportProgressState = {
  metadataComplete: boolean;
  uploadsComplete: boolean;
  manualInputsComplete: boolean;
  uploadCount: number;
  canBuild: boolean;
  sessionId: string | null;
};

type ReportProgressContextValue = ReportProgressState & {
  setProgress: (progress: ReportProgressState) => void;
};

const defaultProgress: ReportProgressState = {
  metadataComplete: false,
  uploadsComplete: false,
  manualInputsComplete: false,
  uploadCount: 0,
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

  return (
    <ReportProgressContext.Provider
      value={{
        ...progress,
        setProgress,
      }}
    >
      {children}
    </ReportProgressContext.Provider>
  );
}
