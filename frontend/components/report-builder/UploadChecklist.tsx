import {
  UploadKey,
  UploadState,
} from "@/lib/types";

type UploadChecklistProps = {
  uploads: Record<UploadKey, UploadState>;
  canUpload: boolean;

  onSectionUpload: (
    section: UploadKey,
    file: File
  ) => Promise<void>;
};

const uploadSections = [
  {
    key: "daily_hour",
    label: "Daily Hour",
  },

  {
    key: "wideload",
    label: "Wideload",
  },

  {
    key: "impounded_prohibited",
    label: "Impounded / Prohibited",
  },

  {
    key: "impounded_overloaded",
    label: "Impounded / Overloaded",
  },
] as const;

const uploadOrder = uploadSections.map((section) => section.key);

export function UploadChecklist({
  uploads,
  canUpload,
  onSectionUpload,
}: UploadChecklistProps) {
  return (
    <div>
      <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4">
      {uploadSections.map((section) => {
        const upload =
          uploads[section.key];
        const sectionIndex = uploadOrder.indexOf(section.key);
        const previousUploadsComplete = uploadOrder
          .slice(0, sectionIndex)
          .every((uploadKey) => uploads[uploadKey].status === "uploaded");
        const disabled = !canUpload || !previousUploadsComplete;
        const disabledReason = !canUpload
          ? "Start a report workspace before uploading files."
          : "Complete the previous upload first.";

        return (
          <div
            key={section.key}
            className={`rounded-xl border p-4 ${
              disabled
                ? "border-slate-800 bg-[#071827]/60 opacity-70"
                : "border-cyan-900/50 bg-[#071827]"
            }`}
          >
            <div className="flex items-center justify-between  min-h-[3.5em]">
              <div>
                <p className="text-sm font-bold text-cyan-200">
                  {section.label}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  .csv · .xlsx · .xls
                </p>
              </div>

              {upload.error && (
                <p className="mt-2 text-sm text-red-400">
                  {upload.error}
                </p>
              )}

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  upload.status === "uploaded"
                    ? "bg-lime-500/20 text-lime-300"

                    : upload.status ===
                      "selected"
                    ? "bg-yellow-500/20 text-yellow-300"

                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {upload.status}
              </div>
            </div>

            <div className="mt-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                id={section.key}
                disabled={disabled}
                className="hidden"
                onChange={async (e) => {
                  const file =
                    e.target.files?.[0];

                  if (!file) return;

                  await onSectionUpload(
                    section.key,
                    file
                  );
                  e.target.value = "";
                }}
              />

              <label
                htmlFor={disabled ? undefined : section.key}
                aria-disabled={disabled}
                className={`flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  disabled
                    ? "cursor-not-allowed border-slate-700 text-slate-500"
                    : "cursor-pointer border-cyan-700 text-cyan-200 hover:bg-cyan-500/10"
                }`}
              >
                Upload File
              </label>
            </div>

            {disabled && (
              <p className="mt-3 text-xs text-slate-500">
                {disabledReason}
              </p>
            )}

            {upload.filename && (
              <p className="mt-3 truncate text-xs text-slate-500">
                {upload.filename}
              </p>
            )}
          </div>
            );
      })}
    </div>
    </div>
  );
}
