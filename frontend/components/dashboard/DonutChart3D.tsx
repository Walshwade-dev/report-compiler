"use client";

import { useId, useMemo } from "react";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  sub?: string;
  badge?: string;
  colors: [string, string];
};

type DonutChart3DProps = {
  slices: DonutSlice[];
  total: number;
  size: "sm" | "lg";
  hovered?: string | null;
  onHover?: (key: string | null) => void;
  emptyText: string;
  ariaLabel: string;
  centerLabel?: string;
};

const TILT = 0.55;
const INNER_RATIO = 0.52;
const TAU = Math.PI * 2;
const START = -Math.PI / 2;

type Range = [number, number];

function clip(a0: number, a1: number, lo: number, hi: number): Range | null {
  const s = Math.max(a0, lo);
  const e = Math.min(a1, hi);
  return e - s > 1e-4 ? [s, e] : null;
}

function formatPct(value: number, total: number) {
  if (total <= 0) return "0%";
  const pct = (value / total) * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function DonutChart3D({
  slices,
  total,
  size,
  hovered = null,
  onHover,
  emptyText,
  ariaLabel,
  centerLabel,
}: DonutChart3DProps) {
  const uid = useId().replace(/:/g, "");
  const isLarge = size === "lg";
  const R = isLarge ? 95 : 60;
  const T = isLarge ? 30 : 15;
  const pad = 10;
  const r = R * INNER_RATIO;
  const ry = R * TILT;
  const riy = r * TILT;
  const W = 2 * R + 2 * pad;
  const H = 2 * ry + T + 2 * pad;
  const cx = W / 2;
  const cy = pad + ry;

  const geometry = useMemo(() => {
    const p = (rx: number, rY: number, a: number, dy = 0) =>
      `${(cx + rx * Math.cos(a)).toFixed(2)} ${(cy + rY * Math.sin(a) + dy).toFixed(2)}`;

    const face = (a0: number, a1: number) =>
      `M ${p(R, ry, a0)} A ${R} ${ry} 0 0 1 ${p(R, ry, a1)} L ${p(r, riy, a1)} A ${r} ${riy} 0 0 0 ${p(r, riy, a0)} Z`;

    const outerWall = (a0: number, a1: number) =>
      `M ${p(R, ry, a0)} A ${R} ${ry} 0 0 1 ${p(R, ry, a1)} L ${p(R, ry, a1, T)} A ${R} ${ry} 0 0 0 ${p(R, ry, a0, T)} Z`;

    const innerWall = (a0: number, a1: number) =>
      `M ${p(r, riy, a0)} A ${r} ${riy} 0 0 1 ${p(r, riy, a1)} L ${p(r, riy, a1, T)} A ${r} ${riy} 0 0 0 ${p(r, riy, a0, T)} Z`;

    // Split arcs so no single SVG arc exceeds a half turn.
    const split = (a0: number, a1: number): Range[] => {
      const out: Range[] = [];
      let s = a0;
      while (a1 - s > Math.PI) {
        out.push([s, s + Math.PI]);
        s += Math.PI;
      }
      out.push([s, a1]);
      return out;
    };

    const rm = (R + r) / 2;
    const rmy = rm * TILT;

    const spans = slices.map((s) => (total > 0 ? (s.value / total) * TAU : 0));
    const starts = spans.map((_, i) => START + spans.slice(0, i).reduce((acc, v) => acc + v, 0));
    return slices.map((slice, i) => {
      const span = spans[i];
      const a0 = starts[i];
      const a1 = a0 + span;
      const mid = (a0 + a1) / 2;

      const faces = span > 1e-4 ? split(a0, a1).map(([s, e]) => face(s, e)) : [];

      const frontRange = clip(a0, a1, 0, Math.PI);
      const outer = frontRange
        ? split(frontRange[0], frontRange[1]).map(([s, e]) => outerWall(s, e))
        : [];

      const innerRanges = [clip(a0, a1, START, 0), clip(a0, a1, Math.PI, Math.PI * 1.5)].filter(
        Boolean,
      ) as Range[];
      const inner = innerRanges.map(([s, e]) => innerWall(s, e));

      const dotX = cx + rm * Math.cos(mid);
      const dotY = cy + rmy * Math.sin(mid);
      const side: "left" | "right" = Math.cos(mid) >= 0 ? "right" : "left";

      return { slice, span, faces, outer, inner, dotX, dotY, side, mid };
    });
  }, [slices, total, R, T, r, ry, riy, cx, cy]);

  if (total <= 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-70">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
          <ellipse cx={cx} cy={cy + T} rx={R} ry={ry} fill="#0f2b46" opacity="0.6" />
          <ellipse cx={cx} cy={cy} rx={R} ry={ry} fill="#123552" />
          <ellipse cx={cx} cy={cy} rx={r} ry={riy} fill="#071827" />
        </svg>
        <p className="text-[10px] text-slate-500 text-center max-w-[150px]">{emptyText}</p>
      </div>
    );
  }

  const style = (key: string): React.CSSProperties => ({
    transform: hovered === key ? "translateY(-6px)" : "translateY(0)",
    opacity: hovered && hovered !== key ? 0.45 : 1,
    transition: "transform 200ms ease, opacity 200ms ease",
  });

  const svg = (
    <div className="relative shrink-0" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="overflow-visible">
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </radialGradient>
          {geometry.map(({ slice }) => (
            <linearGradient key={slice.key} id={`${uid}-${slice.key.replace(/\W/g, "")}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={slice.colors[0]} />
              <stop offset="100%" stopColor={slice.colors[1]} />
            </linearGradient>
          ))}
        </defs>

        <ellipse cx={cx} cy={cy + T / 2} rx={R * 1.3} ry={ry * 1.5} fill={`url(#${uid}-glow)`} />

        {/* Layer 1: inner walls (far side of the hole) */}
        {geometry.map(({ slice, inner }) => (
          <g key={`in-${slice.key}`} style={style(slice.key)}>
            {inner.map((d, i) => (
              <g key={i}>
                <path d={d} fill={`url(#${uid}-${slice.key.replace(/\W/g, "")})`} />
                <path d={d} fill="#000" opacity="0.45" />
              </g>
            ))}
          </g>
        ))}

        {/* Layer 2: front outer walls */}
        {geometry.map(({ slice, outer }) => (
          <g key={`out-${slice.key}`} style={style(slice.key)}>
            {outer.map((d, i) => (
              <g key={i}>
                <path d={d} fill={`url(#${uid}-${slice.key.replace(/\W/g, "")})`} />
                <path d={d} fill="#000" opacity="0.3" />
              </g>
            ))}
          </g>
        ))}

        {/* Layer 3: top faces + leader dots */}
        {geometry.map(({ slice, faces, dotX, dotY, span }) => (
          <g
            key={`top-${slice.key}`}
            style={{ ...style(slice.key), cursor: onHover ? "pointer" : "default" }}
            onMouseEnter={() => onHover?.(slice.key)}
            onMouseLeave={() => onHover?.(null)}
          >
            {faces.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={`url(#${uid}-${slice.key.replace(/\W/g, "")})`}
                stroke={slice.colors[1]}
                strokeWidth="0.4"
              />
            ))}
            {span / TAU >= 0.03 && (
              <circle
                cx={dotX}
                cy={dotY}
                r={isLarge ? 5 : 3}
                fill={slice.colors[0]}
                stroke="#fff"
                strokeWidth={isLarge ? 1.5 : 1}
              />
            )}
          </g>
        ))}
      </svg>

      {isLarge && centerLabel && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center"
          style={{ top: cy - 10 }}
        >
          <p className="text-3xl font-bold leading-none text-cyan-300" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
            {total}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-100 mt-1">{centerLabel}</p>
        </div>
      )}
    </div>
  );

  if (!isLarge) {
    const visible = geometry.slice(0, 3);
    return (
      <div className="flex flex-col items-center gap-1.5">
        {svg}
        <div className="flex flex-col gap-0.5 w-full max-w-[150px]">
          {visible.map(({ slice }) => (
            <div
              key={slice.key}
              className="flex items-center gap-1.5 text-[9px] cursor-default"
              onMouseEnter={() => onHover?.(slice.key)}
              onMouseLeave={() => onHover?.(null)}
              style={{ opacity: hovered && hovered !== slice.key ? 0.5 : 1 }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: `linear-gradient(135deg, ${slice.colors[0]}, ${slice.colors[1]})` }}
              />
              <span className="font-bold text-white tabular-nums w-7">{formatPct(slice.value, total)}</span>
              <span className="text-slate-400 truncate">{slice.label}</span>
            </div>
          ))}
          {geometry.length > visible.length && (
            <span className="text-[8px] text-slate-600 pl-3.5">+{geometry.length - visible.length} more</span>
          )}
        </div>
      </div>
    );
  }

  const renderCallout = (g: (typeof geometry)[number], align: "left" | "right") => (
    <div
      key={g.slice.key}
      className={`min-w-[104px] max-w-[130px] ${align === "right" ? "text-left" : "text-right"} cursor-default`}
      onMouseEnter={() => onHover?.(g.slice.key)}
      onMouseLeave={() => onHover?.(null)}
      style={{ opacity: hovered && hovered !== g.slice.key ? 0.45 : 1, transition: "opacity 200ms ease" }}
    >
      <p className="text-3xl font-extralight leading-none tabular-nums" style={{ color: g.slice.colors[0] }}>
        {formatPct(g.slice.value, total)}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200 leading-tight">
        {g.slice.label}
      </p>
      {g.slice.sub && <p className="text-[10px] text-slate-500 leading-tight">{g.slice.sub}</p>}
      {g.slice.badge && (
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold text-slate-950"
          style={{ background: `linear-gradient(90deg, ${g.slice.colors[0]}, ${g.slice.colors[1]})` }}
        >
          {g.slice.badge}
        </span>
      )}
    </div>
  );

  const left = geometry.filter((g) => g.side === "left").sort((a, b) => a.dotY - b.dotY);
  const right = geometry.filter((g) => g.side === "right").sort((a, b) => a.dotY - b.dotY);

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex flex-col justify-around gap-4 self-stretch items-end">
        {left.map((g) => renderCallout(g, "left"))}
      </div>
      {svg}
      <div className="flex flex-col justify-around gap-4 self-stretch items-start">
        {right.map((g) => renderCallout(g, "right"))}
      </div>
    </div>
  );
}
