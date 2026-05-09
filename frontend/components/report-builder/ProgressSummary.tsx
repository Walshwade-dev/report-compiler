import { SectionCard } from "./SectionCard";

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
    <SectionCard
      title="Progress Summary"
      description="Workflow completion status"
    >
      

      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 text-center transition ${
              item.complete
                ? "border-lime-400 bg-lime-500/10"
                : "border-cyan-900 bg-[#071827]"
            }`}
          >
            <p
              className={`text-sm font-bold ${
                item.complete ? "text-lime-300" : "text-slate-400"
              }`}
            >
              {item.value}
            </p>

            
          </div>
        ))}
      </div>
    </SectionCard>
  );
}