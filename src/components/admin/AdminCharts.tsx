import { useId } from "react";

import type { AnalyticsPoint, ServiceAnalytics } from "../../types/staff";

const chartColors = ["#5b45dc", "#55b9e8", "#f59e0b", "#43c6ac", "#94a3b8"];

type LineChartProps = {
  points: AnalyticsPoint[];
  suffix?: string;
};

export function LineChart({ points, suffix = "" }: LineChartProps) {
  const gradientId = useId().replaceAll(":", "");
  const width = 620;
  const height = 220;
  const left = 34;
  const top = 18;
  const bottom = 34;
  const usableWidth = width - left - 16;
  const usableHeight = height - top - bottom;
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const coordinates = points.map((point, index) => ({
    x: left + (index / Math.max(1, points.length - 1)) * usableWidth,
    y: top + usableHeight - (point.value / maxValue) * usableHeight,
    ...point,
  }));
  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coordinates.length
    ? `M ${coordinates[0].x} ${top + usableHeight} L ${coordinates.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${coordinates.at(-1)?.x ?? left} ${top + usableHeight} Z`
    : "";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[520px]">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d5be7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6d5be7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = top + usableHeight - ratio * usableHeight;
          return (
            <g key={ratio}>
              <line x1={left} x2={width - 16} y1={y} y2={y} stroke="#e8eaf0" strokeDasharray="4 4" />
              <text x={2} y={y + 4} fontSize="10" fill="#94a3b8">
                {Math.round(maxValue * ratio)}{suffix}
              </text>
            </g>
          );
        })}

        {area && <path d={area} fill={`url(#${gradientId})`} />}
        <polyline points={polyline} fill="none" stroke="#5b45dc" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {coordinates.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#5b45dc" strokeWidth="2.5" />
            {(index % 2 === 0 || index === coordinates.length - 1) && (
              <text x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
                {point.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function DonutChart({ services }: { services: ServiceAnalytics[] }) {
  const total = services.reduce((sum, service) => sum + service.visits, 0);
  const stops = services.reduce<{ stops: string[]; cursor: number }>(
    (result, service, index) => {
      const share = total === 0
        ? 100 / Math.max(1, services.length)
        : (service.visits / total) * 100;
      const nextCursor = result.cursor + share;

      return {
        cursor: nextCursor,
        stops: [
          ...result.stops,
          `${chartColors[index % chartColors.length]} ${result.cursor}% ${nextCursor}%`,
        ],
      };
    },
    { stops: [], cursor: 0 },
  ).stops;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div
        className="relative mx-auto h-40 w-40 rounded-full"
        style={{ background: stops.length ? `conic-gradient(${stops.join(",")})` : "#e2e8f0" }}
      >
        <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <strong className="text-2xl font-black text-slate-950">{total}</strong>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visits</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {services.map((service, index) => (
          <div key={service.id} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="truncate">{service.title}</span>
            </span>
            <strong className="text-slate-900">{service.percentage}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeakHoursChart({ points }: { points: AnalyticsPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="space-y-4">
      {points.map((point) => (
        <div key={point.label} className="grid grid-cols-[78px_1fr_32px] items-center gap-3 text-xs">
          <span className="font-medium text-slate-600">{point.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${(point.value / max) * 100}%` }} />
          </div>
          <strong className="text-right text-slate-900">{point.value}</strong>
        </div>
      ))}
    </div>
  );
}
