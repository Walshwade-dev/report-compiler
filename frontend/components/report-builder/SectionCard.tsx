import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-xl border border-cyan-900/50 bg-[#0b2a45] p-5">
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}