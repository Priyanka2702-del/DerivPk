"use client";

import { useState } from "react";

type Point = { label: string; value: number };

export default function PerformanceChart({ data }: { data: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data.length) return null;

  const width = 900;
  const height = 260;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 32;

  const max = Math.max(...data.map((d) => d.value), 0.01);
  const yMax = Math.ceil(max * 2) / 2 || 1;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const coords = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: padTop + chartH - (d.value / yMax) * chartH,
  }));

  function smoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return "";
    if (pts.length === 2) {
      return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  const linePath = smoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last.x} ${padTop + chartH} L ${first.x} ${padTop + chartH} Z`;

  const activeIdx = hoverIndex !== null ? hoverIndex : data.length - 1;
  const active = coords[activeIdx];
  const activeData = data[activeIdx];
  const yTicks = [0, yMax / 2, yMax];

  const xLabelIndexes = Array.from(
    new Set(
      [0, 1, 2, 3, 4].map((i) =>
        Math.min(data.length - 1, Math.round((i / 4) * (data.length - 1)))
      )
    )
  );

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6f83ff" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#6f83ff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6f83ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => {
          const y = padTop + chartH - (t / yMax) * chartH;
          return (
            <g key={t}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="#262a38"
                strokeWidth={1}
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="currentColor"
                className="text-text-muted"
                fontSize="10"
              >
                {t.toFixed(2)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#perfFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#6f83ff"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((p, i) => (
          <rect
            key={i}
            x={p.x - stepX / 2}
            y={padTop}
            width={Math.max(stepX, 24)}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onTouchStart={() => setHoverIndex(i)}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={active.x}
            x2={active.x}
            y1={padTop}
            y2={padTop + chartH}
            stroke="#343948"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        <circle
          cx={active.x}
          cy={active.y}
          r={5}
          fill="#6f83ff"
          stroke="white"
          strokeWidth={2.5}
        />

        {xLabelIndexes.map((i) => (
          <text
            key={data[i].label + i}
            x={coords[i].x}
            y={height - 8}
            textAnchor="middle"
            fill="currentColor"
            className="text-text-muted"
            fontSize="10"
          >
            {data[i].label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      <div
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-black px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm sm:text-xs"
        style={{
          left: `${(active.x / width) * 100}%`,
          top: `${(active.y / height) * 100}%`,
          marginTop: -10,
        }}
      >
        {activeData.value.toFixed(2)} USD
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-black" />
      </div>
    </div>
  );
}