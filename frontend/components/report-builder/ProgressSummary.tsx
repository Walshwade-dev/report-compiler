import { CheckCircle2, CircleDashed } from "lucide-react";

type ProgressSummaryProps = {
  reportType?: "static" | "mobile";
  metadataComplete: boolean;
  uploadsComplete: boolean;
  manualInputsComplete: boolean;
  uploadCount: number;
  uploadTotal?: number;
  canBuild: boolean;
};

export function ProgressSummary({
  reportType = "static",
  metadataComplete,
  uploadsComplete,
  manualInputsComplete,
  uploadCount,
  uploadTotal = 4,
  canBuild,
}: ProgressSummaryProps) {
  const items =
    reportType === "mobile"
      ? [
          {
            label: "Session",
            complete: metadataComplete,
            value: metadataComplete ? "Ready" : "Pending",
          },
          {
            label: "Manual",
            complete: manualInputsComplete,
            value: manualInputsComplete ? "Saved" : "Pending",
          },
          {
            label: "Register",
            complete: uploadsComplete,
            value: `${uploadCount}/${uploadTotal}`,
          },
          {
            label: "Excel",
            complete: canBuild,
            value: canBuild ? "Ready" : "Blocked",
          },
        ]
      : [
          {
            label: "Metadata",
            complete: metadataComplete,
            value: metadataComplete ? "Done" : "Pending",
          },
          {
            label: "Uploads",
            complete: uploadsComplete,
            value: `${uploadCount}/${uploadTotal}`,
          },
          {
            label: "Manual",
            complete: manualInputsComplete,
            value: manualInputsComplete ? "Done" : "Pending",
          },
          {
            label: "Build",
            complete: canBuild,
            value: canBuild ? "Ready" : "Blocked",
          },
        ];

  return (
    <section className="rounded-lg border border-cyan-900/50 bg-[#0b2a45] p-3">
      <div>
        <h2 className="text-xs font-bold uppercase text-slate-300">
          Project Summary
        </h2>

        <p className="mt-0.5 text-[11px] text-slate-500">
          {reportType === "mobile"
            ? "Mobile report workflow"
            : "Report build readiness"}
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-md border px-2 py-1.5 transition ${
              item.complete
                ? "border-lime-500/40 bg-lime-500/10"
                : "border-cyan-900/70 bg-[#071827]"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              {item.complete ? (
                <CheckCircle2 size={14} className="shrink-0 text-lime-300" />
              ) : (
                <CircleDashed size={14} className="shrink-0 text-slate-500" />
              )}

              <span className="truncate text-xs font-medium text-slate-300">
                {item.label}
              </span>
            </span>

            <span
              className={`ml-2 shrink-0 text-xs font-bold ${
                item.complete ? "text-lime-300" : "text-slate-500"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
