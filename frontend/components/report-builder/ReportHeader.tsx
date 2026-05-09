import {
  BOUND_OPTIONS,
  WEIGHBRIDGE_OPTIONS,
} from "@/lib/constants";

type ReportHeaderProps = {
    weighbridgeName: string;

    boundName: string;

    setWeighbridgeName: React.Dispatch<
      React.SetStateAction<string>
    >;

    setBoundName: React.Dispatch<
      React.SetStateAction<string>
    >;
  };

export function ReportHeader({
  weighbridgeName,
  boundName,
  setWeighbridgeName,
  setBoundName,
}: ReportHeaderProps) {
  
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">
          Static Weighbridge Report
        </h1>
        <p className="text-sm text-cyan-400">
          Daily report builder
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={weighbridgeName}
          onChange={(e) =>
            setWeighbridgeName(e.target.value)
          }
          className="rounded-lg border border-cyan-700 bg-[#0b2135] px-3 py-2 text-sm text-cyan-200"
        >
          {WEIGHBRIDGE_OPTIONS.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <select
          value={boundName}
          onChange={(e) =>
            setBoundName(e.target.value)
          }
          className="rounded-lg border border-cyan-700 bg-[#0b2135] px-3 py-2 text-sm text-cyan-200"
        >
          {BOUND_OPTIONS.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}