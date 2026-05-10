import { CheckCircle2, CircleDashed } from "lucide-react";

type ProgressSummaryProps = {
  metadataComplete: boolean;
  uploadsComplete: boolean;
  manualInputsComplete: boolean;
  uploadCount: number;
  canBuild: boolean;
};

export function ProgressSummary({
  metadataComplete,
  uploadsComplete,
  manualInputsComplete,
  uploadCount,
  canBuild,
}: ProgressSummaryProps) {
  const items = [
    {
      label: "Metadata",
      complete: metadataComplete,
      value: metadataComplete ? "Done" : "Pending",
    },
    {
      label: "Uploads",
      complete: uploadsComplete,
      value: `${uploadCount}/4`,
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
          Report build readiness
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
