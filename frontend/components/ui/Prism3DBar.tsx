"use client";

import React, { useId } from "react";

export type PrismColorScheme =
  | "cyan"
  | "indigo"
  | "emerald"
  | "teal"
  | "violet"
  | "amber"
  | "slate";

interface ColorConfig {
  top: [string, string];
  left: [string, string];
  right: [string, string];
  base: string;
  glow: string;
  halo: [string, string];
  labelColor: string; // Neon shade matching the bar
}

const COLOR_PALETTES: Record<PrismColorScheme, ColorConfig> = {
  cyan: {
    top: ["#ffffff", "#e0f2fe"],
    left: ["#38bdf8", "#0284c7"],
    right: ["#0369a1", "#075985"],
    base: "#0284c7",
    glow: "rgba(34, 211, 238, 0.5)",
    halo: ["#38bdf8", "#06b6d4"],
    labelColor: "#38bdf8", // Vibrant neon cyan matching the bar
  },
  indigo: {
    top: ["#ffffff", "#ede9fe"],
    left: ["#818cf8", "#4f46e5"],
    right: ["#3730a3", "#1e1b4b"],
    base: "#312e81",
    glow: "rgba(99, 102, 241, 0.5)",
    halo: ["#818cf8", "#6366f1"],
    labelColor: "#818cf8", // Vibrant neon indigo matching the bar
  },
  emerald: {
    top: ["#ffffff", "#d1fae5"],
    left: ["#34d399", "#059669"],
    right: ["#047857", "#064e3b"],
    base: "#065f46",
    glow: "rgba(52, 211, 153, 0.5)",
    halo: ["#34d399", "#10b981"],
    labelColor: "#34d399", // Vibrant neon emerald matching the bar
  },
  teal: {
    top: ["#ffffff", "#ccfbf1"],
    left: ["#2dd4bf", "#0d9488"],
    right: ["#0f766e", "#134e4a"],
    base: "#115e59",
    glow: "rgba(20, 184, 166, 0.5)",
    halo: ["#2dd4bf", "#14b8a6"],
    labelColor: "#2dd4bf", // Vibrant neon teal matching the bar
  },
  violet: {
    top: ["#ffffff", "#fae8ff"],
    left: ["#e879f9", "#9333ea"],
    right: ["#7e22ce", "#581c87"],
    base: "#6b21a8",
    glow: "rgba(168, 85, 247, 0.5)",
    halo: ["#e879f9", "#c084fc"],
    labelColor: "#e879f9", // Vibrant neon violet matching the bar
  },
  amber: {
    top: ["#ffffff", "#fef3c7"],
    left: ["#fbbf24", "#d97706"],
    right: ["#b45309", "#78350f"],
    base: "#92400e",
    glow: "rgba(245, 158, 11, 0.5)",
    halo: ["#fbbf24", "#f59e0b"],
    labelColor: "#fbbf24", // Vibrant neon amber matching the bar
  },
  slate: {
    top: ["#ffffff", "#f1f5f9"],
    left: ["#94a3b8", "#64748b"],
    right: ["#475569", "#1e293b"],
    base: "#334155",
    glow: "rgba(148, 163, 184, 0.5)",
    halo: ["#cbd5e1", "#94a3b8"],
    labelColor: "#cbd5e1", // Vibrant slate matching the bar
  },
};

export interface Prism3DBarProps {
  height: number;
  width?: number;
  colorScheme?: PrismColorScheme;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  title?: string;
  abbreviation?: string;
  sublabel?: string;
  value?: number | string;
  showHalo?: boolean;
}

export function Prism3DBar({
  height,
  width = 18,
  colorScheme = "cyan",
  className = "",
  onMouseEnter,
  onMouseLeave,
  title,
  abbreviation,
  sublabel,
  value,
  showHalo = true,
}: Prism3DBarProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, "");

  const safeHeight = Math.max(0, height);
  if (safeHeight <= 0) {
    return <div style={{ width: `${width}px`, height: 0 }} className="shrink-0" />;
  }

  const palette = COLOR_PALETTES[colorScheme] || COLOR_PALETTES.cyan;

  // Proportional 3D cap height with vertical depth for floating text
  const nominalCapH = Math.min(Math.max(width * 0.52, 9), 16);
  const capH = safeHeight < nominalCapH * 1.5 ? safeHeight * 0.45 : nominalCapH;

  const w = width;
  const h = safeHeight;
  const midX = w * 0.5;
  const sideY = capH * 0.6;
  const bottomDip = capH * 0.4;
  const bottomY = h;

  // Hexagonal Top Cap coordinates
  const topPoints = `${midX},0 ${w * 0.85},${capH * 0.3} ${w},${sideY} ${midX},${capH} 0,${sideY} ${w * 0.15},${capH * 0.3}`;

  // Left vertical facet
  const leftPoints = `0,${sideY} ${midX},${capH} ${midX},${bottomY} 0,${bottomY - bottomDip}`;

  // Right vertical facet
  const rightPoints = `${midX},${capH} ${w},${sideY} ${w},${bottomY - bottomDip} ${midX},${bottomY}`;

  // Translucent bottom facet
  const bottomPoints = `0,${bottomY - bottomDip} ${midX},${bottomY} ${w},${bottomY - bottomDip} ${midX},${bottomY - bottomDip * 2}`;

  // Diagonal glass sheen streaks (only render if bar is tall enough)
  const showStreaks = h >= 30;
  const streak1Y = h * 0.65;
  const streak2Y = h * 0.8;

  const showLabel = Boolean((abbreviation || value !== undefined) && safeHeight > 0);
  const labelFontSize = Math.min(Math.max(w * 0.48, 9), 11.5);

  return (
    <div
      className={`relative inline-flex flex-col items-center shrink-0 group/prism ${className}`}
      style={{ width: `${w}px`, height: `${h}px` }}
      title={title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Abbreviation and Value absolute positioned above the halo by 4em with matching bar shade */}
      {showLabel && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none font-black tracking-wider whitespace-nowrap z-20 flex flex-col items-center transition-transform duration-200 group-hover/prism:scale-110"
          style={{
            bottom: "calc(100% + 4em)",
            color: palette.labelColor,
            textShadow: `0 0 4px ${palette.glow}`,
            fontSize: `${labelFontSize}px`,
            lineHeight: 1.2,
            letterSpacing: "0.04em",
          }}
        >
          {value !== undefined && <span className="mb-0.5">{value}</span>}
          {abbreviation && <span>{abbreviation}</span>}
        </div>
      )}

      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="overflow-visible transition-all duration-300 w-full h-full cursor-pointer hover:brightness-110"
        style={{
          filter: `drop-shadow(0 0 2px ${palette.glow})`,
        }}
      >
        {title ? <title>{title}</title> : null}
        <defs>
          {/* Radiant Top Cap (Luminous White Surface with soft ambient tint at edge) */}
          <linearGradient id={`top-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={palette.top[1]} />
          </linearGradient>
          <linearGradient id={`left-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.left[0]} />
            <stop offset="100%" stopColor={palette.left[1]} />
          </linearGradient>
          <linearGradient id={`right-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.right[0]} />
            <stop offset="100%" stopColor={palette.right[1]} />
          </linearGradient>
          {/* Upward Halo Bloom Gradient */}
          <radialGradient id={`halo-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.halo[0]} stopOpacity="0.4" />
            <stop offset="45%" stopColor={palette.halo[1]} stopOpacity="0.15" />
            <stop offset="100%" stopColor={palette.halo[1]} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Upward Glowing Halo Bloom Light */}
        {showHalo && (
          <g className="pointer-events-none">
            <ellipse
              cx={midX}
              cy={-capH * 0.3}
              rx={w * 0.82}
              ry={capH * 0.95}
              fill={`url(#halo-${id})`}
              opacity={0.5}
            />
            <ellipse
              cx={midX}
              cy={-capH * 0.15}
              rx={w * 0.48}
              ry={capH * 0.45}
              fill="#ffffff"
              opacity={0.15}
            />
          </g>
        )}

        {/* Left Front Facet (Illuminated Face) */}
        <polygon points={leftPoints} fill={`url(#left-${id})`} />

        {/* Right Front Facet (Shaded Face) */}
        <polygon points={rightPoints} fill={`url(#right-${id})`} />

        {/* Diagonal Glass Sheen Streaks (//) on Left Facet */}
        {showStreaks && (
          <g opacity="0.45" style={{ mixBlendMode: "overlay" }}>
            <polygon
              points={`0,${streak1Y} ${midX * 0.8},${streak1Y + 4} ${midX},${streak1Y + 3} ${midX},${streak1Y + 7} 0,${streak1Y + 4}`}
              fill="#ffffff"
            />
            <polygon
              points={`0,${streak2Y} ${midX * 0.8},${streak2Y + 4} ${midX},${streak2Y + 3} ${midX},${streak2Y + 9} 0,${streak2Y + 6}`}
              fill="#ffffff"
            />
          </g>
        )}

        {/* Vertical Center Ridge Highlight */}
        <line
          x1={midX}
          y1={capH}
          x2={midX}
          y2={bottomY}
          stroke="#ffffff"
          strokeWidth={Math.max(w * 0.04, 0.7)}
          opacity={0.65}
        />

        {/* Hexagonal Top Cap */}
        <polygon
          points={topPoints}
          fill={`url(#top-${id})`}
          stroke={palette.top[0]}
          strokeWidth={Math.max(w * 0.05, 1)}
          strokeLinejoin="round"
          opacity={0.8}
        />

        {/* Translucent Bottom Facet */}
        <polygon points={bottomPoints} fill={palette.base} opacity={0.3} />
      </svg>
    </div>
  );
}
