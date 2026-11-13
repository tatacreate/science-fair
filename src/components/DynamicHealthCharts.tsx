import React, { useState, useEffect } from 'react';
import { INDICATOR_SIMPLE_GUIDES } from '../data/habitatEnvironments';
import {
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

export interface ChartDataPoint {
  label: string; // e.g., "Day 1", "Day 2", ... "Now"
  value: number;
}

export type TrackedChartIndicatorId =
  | 'glucose'
  | 'onsd'
  | 'heart_rate'
  | 'spo2'
  | 'radiation'
  | 'urine_sg';

interface ChartConfig {
  id: TrackedChartIndicatorId;
  label: string;
  unit: string;
  yMin: number;
  yMax: number;
  nominalLow: number;
  nominalHigh: number;
  warningHigh: number;
  warningLow?: number;
  decimals: number;
  defaultSeries: ChartDataPoint[];
  plainSummary: string;
}

const CHART_CONFIGS: ChartConfig[] = [
  {
    id: 'glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    yMin: 50,
    yMax: 180,
    nominalLow: 70,
    nominalHigh: 115,
    warningHigh: 160,
    warningLow: 65,
    decimals: 0,
    plainSummary: 'Shows steady blood sugar fuel across mission days.',
    defaultSeries: [
      { label: 'Sol 1', value: 88 },
      { label: 'Sol 2', value: 94 },
      { label: 'Sol 3', value: 102 },
      { label: 'Sol 4', value: 96 },
      { label: 'Sol 5', value: 108 },
      { label: 'Sol 6', value: 95 },
      { label: 'Today', value: 92 },
    ],
  },
  {
    id: 'onsd',
    label: 'Optic Nerve (ONSD)',
    unit: 'mm',
    yMin: 3.5,
    yMax: 6.8,
    nominalLow: 3.8,
    nominalHigh: 5.0,
    warningHigh: 5.8,
    decimals: 1,
    plainSummary: 'Tracks headward fluid pressure behind the eyes (SANS).',
    defaultSeries: [
      { label: 'Sol 1', value: 4.1 },
      { label: 'Sol 2', value: 4.3 },
      { label: 'Sol 3', value: 4.6 },
      { label: 'Sol 4', value: 4.8 },
      { label: 'Sol 5', value: 4.7 },
      { label: 'Sol 6', value: 4.5 },
      { label: 'Today', value: 4.5 },
    ],
  },
  {
    id: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    yMin: 45,
    yMax: 130,
    nominalLow: 55,
    nominalHigh: 95,
    warningHigh: 115,
    warningLow: 50,
    decimals: 0,
    plainSummary: 'Tracks resting heart effort adapting to microgravity.',
    defaultSeries: [
      { label: 'Sol 1', value: 78 },
      { label: 'Sol 2', value: 75 },
      { label: 'Sol 3', value: 73 },
      { label: 'Sol 4', value: 74 },
      { label: 'Sol 5', value: 71 },
      { label: 'Sol 6', value: 72 },
    ],
  },
  {
    id: 'spo2',
    label: 'Blood Oxygen (SpO₂)',
    unit: '%',
    yMin: 82,
    yMax: 100,
    nominalLow: 95,
    nominalHigh: 100,
    warningHigh: 100,
    warningLow: 91,
    decimals: 0,
    plainSummary: 'Confirms lungs are transferring enough oxygen into blood.',
    defaultSeries: [
      { label: 'Sol 1', value: 98 },
      { label: 'Sol 2', value: 98 },
      { label: 'Sol 3', value: 97 },
      { label: 'Sol 4', value: 98 },
      { label: 'Sol 5', value: 99 },
      { label: 'Sol 6', value: 98 },
    ],
  },
  {
    id: 'radiation',
    label: 'Radiation Flux',
    unit: 'µSv/h',
    yMin: 0,
    yMax: 120,
    nominalLow: 0,
    nominalHigh: 15,
    warningHigh: 50,
    decimals: 1,
    plainSummary: 'Monitors cosmic ray and solar flare radiation exposure over time.',
    defaultSeries: [
      { label: 'Sol 1', value: 2.1 },
      { label: 'Sol 2', value: 2.3 },
      { label: 'Sol 3', value: 2.0 },
      { label: 'Sol 4', value: 2.4 },
      { label: 'Sol 5', value: 2.2 },
      { label: 'Sol 6', value: 2.1 },
    ],
  },
  {
    id: 'urine_sg',
    label: 'Hydration (Urine SG)',
    unit: 'SG',
    yMin: 1.0,
    yMax: 1.035,
    nominalLow: 1.003,
    nominalHigh: 1.018,
    warningHigh: 1.026,
    decimals: 3,
    plainSummary: 'Tracks water dilution to prevent painful kidney stones.',
    defaultSeries: [
      { label: 'Sol 1', value: 1.015 },
      { label: 'Sol 2', value: 1.019 },
      { label: 'Sol 3', value: 1.016 },
      { label: 'Sol 4', value: 1.014 },
      { label: 'Sol 5', value: 1.011 },
      { label: 'Sol 6', value: 1.012 },
      { label: 'Today', value: 1.012 },
    ],
  },
];

function evaluateColorTier(cfg: ChartConfig, val: number): {
  tier: 'GREEN' | 'AMBER' | 'RED';
  textLabel: string;
  badgeClasses: string;
  strokeColor: string;
} {
  if (
    val > cfg.warningHigh ||
    (cfg.warningLow !== undefined && val < cfg.warningLow)
  ) {
    return {
      tier: 'RED',
      textLabel: 'ALERT · ACTION NEEDED',
      badgeClasses: 'bg-rose-950 border-rose-600 text-rose-300',
      strokeColor: '#fb7185',
    };
  }
  if (val > cfg.nominalHigh || val < cfg.nominalLow) {
    return {
      tier: 'AMBER',
      textLabel: 'WATCH · CREW CARE',
      badgeClasses: 'bg-amber-950 border-amber-600 text-amber-300',
      strokeColor: '#fbbf24',
    };
  }
  return {
    tier: 'GREEN',
    textLabel: 'GREEN · HEALTHY',
    badgeClasses: 'bg-emerald-950 border-emerald-600 text-emerald-300',
    strokeColor: '#34d399',
  };
}

interface DynamicHealthChartsProps {
  liveHeartRate: number;
  liveSpo2: number;
  liveRadiationRate: number;
  customLoggedSeries: Partial<Record<TrackedChartIndicatorId, ChartDataPoint[]>>;
  liveHrHistory: ChartDataPoint[];
  liveRadHistory: ChartDataPoint[];
  activeChartRequest?: { id: TrackedChartIndicatorId; nonce: number } | null;
}

export const DynamicHealthCharts: React.FC<DynamicHealthChartsProps> = ({
  liveHeartRate,
  liveSpo2,
  liveRadiationRate,
  customLoggedSeries,
  liveHrHistory,
  liveRadHistory,
  activeChartRequest,
}) => {
  const [selectedChartId, setSelectedChartId] = useState<TrackedChartIndicatorId>('glucose');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showSimpleGuide, setShowSimpleGuide] = useState<boolean>(true);

  useEffect(() => {
    if (activeChartRequest?.id) {
      setSelectedChartId(activeChartRequest.id);
      setHoveredIndex(null);
    }
  }, [activeChartRequest]);

  const activeConfig =
    CHART_CONFIGS.find((c) => c.id === selectedChartId) || CHART_CONFIGS[0];

  const getSeriesForConfig = (cfg: ChartConfig): ChartDataPoint[] => {
    if (cfg.id === 'heart_rate') {
      const base = liveHrHistory.length > 0 ? liveHrHistory.slice(-5) : cfg.defaultSeries.slice(0, 5);
      return [...cfg.defaultSeries.slice(0, 2), ...base, { label: 'Now', value: liveHeartRate }];
    }
    if (cfg.id === 'radiation') {
      const base = liveRadHistory.length > 0 ? liveRadHistory.slice(-5) : cfg.defaultSeries.slice(0, 5);
      return [...cfg.defaultSeries.slice(0, 2), ...base, { label: 'Now', value: liveRadiationRate }];
    }
    if (cfg.id === 'spo2') {
      return [...cfg.defaultSeries.slice(0, 5), { label: 'Live', value: liveSpo2 }];
    }
    const logged = customLoggedSeries[cfg.id];
    if (logged && logged.length > 0) {
      return [...cfg.defaultSeries.slice(0, -1), ...logged.slice(-5)];
    }
    return cfg.defaultSeries;
  };

  const activeSeries = getSeriesForConfig(activeConfig);
  const latestPoint = activeSeries[activeSeries.length - 1];
  const latestStatus = evaluateColorTier(activeConfig, latestPoint.value);
  const inspectedPoint =
    hoveredIndex !== null && activeSeries[hoveredIndex]
      ? activeSeries[hoveredIndex]
      : latestPoint;
  const inspectedStatus = evaluateColorTier(activeConfig, inspectedPoint.value);

  // SVG chart geometry
  const svgW = 640;
  const svgH = 220;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const dynamicMax = Math.max(
    activeConfig.yMax,
    ...activeSeries.map((p) => p.value * 1.1)
  );
  const yMin = activeConfig.yMin;
  const yMax = dynamicMax;

  const valueToY = (v: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, v));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return padT + plotH - ratio * plotH;
  };

  const indexToX = (i: number, len: number) => {
    if (len <= 1) return padL + plotW / 2;
    return padL + (i / (len - 1)) * plotW;
  };

  const polyPoints = activeSeries
    .map((pt, i) => `${indexToX(i, activeSeries.length)},${valueToY(pt.value)}`)
    .join(' ');

  const areaPath =
    activeSeries.length > 1
      ? `M ${indexToX(0, activeSeries.length)},${padT + plotH} ` +
        activeSeries
          .map((pt, i) => `L ${indexToX(i, activeSeries.length)},${valueToY(pt.value)}`)
          .join(' ') +
        ` L ${indexToX(activeSeries.length - 1, activeSeries.length)},${padT + plotH} Z`
      : '';

  const nominalTopY = valueToY(activeConfig.nominalHigh);
  const nominalBottomY = valueToY(activeConfig.nominalLow);
  const simpleGuide = INDICATOR_SIMPLE_GUIDES[activeConfig.id];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header + Beginner Guide Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Dynamic Health Trends &amp; Color-Coded Status Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track how your body changes over mission days · Green = Healthy · Amber = Crew Care · Red = Alert Ground Surgeons
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSimpleGuide((prev) => !prev)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            showSimpleGuide
              ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showSimpleGuide ? 'Hide Simple Guide' : 'Show Simple Guide'}</span>
        </button>
      </div>

      {/* At-a-Glance Color-Coded Indicator Selector Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CHART_CONFIGS.map((cfg) => {
          const series = getSeriesForConfig(cfg);
          const latestVal =
            cfg.id === 'heart_rate'
              ? liveHeartRate
              : cfg.id === 'spo2'
              ? liveSpo2
              : cfg.id === 'radiation'
              ? liveRadiationRate
              : series[series.length - 1].value;
          const st = evaluateColorTier(cfg, latestVal);
          const isSelected = cfg.id === selectedChartId;

          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => {
                setSelectedChartId(cfg.id);
                setHoveredIndex(null);
              }}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer space-y-1.5 ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-200 truncate">
                  {cfg.label}
                </span>
                {st.tier === 'GREEN' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : st.tier === 'AMBER' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold tabular-nums text-slate-100">
                  {latestVal.toFixed(cfg.decimals)}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{cfg.unit}</span>
              </div>

              <div
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${st.badgeClasses}`}
              >
                {st.textLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Dynamic SVG Trend Graph + Beginner Explanation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* SVG Chart Viewport */}
        <div
          className={`${
            showSimpleGuide ? 'lg:col-span-7' : 'lg:col-span-12'
          } p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-100">
                {activeConfig.label} Trajectory ({activeConfig.unit})
              </span>
              <p className="text-[11px] text-slate-400">{activeConfig.plainSummary}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                {inspectedPoint.label}:{' '}
                <strong className="text-slate-100 tabular-nums">
                  {inspectedPoint.value.toFixed(activeConfig.decimals)} {activeConfig.unit}
                </strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${inspectedStatus.badgeClasses}`}
              >
                {inspectedStatus.textLabel}
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-56 select-none"
              role="img"
              aria-label={`${activeConfig.label} time series trend chart`}
            >
              <defs>
                <linearGradient id={`grad-${activeConfig.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={latestStatus.strokeColor} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={latestStatus.strokeColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Green Safe Corridor Band */}
              <rect
                x={padL}
                y={nominalTopY}
                width={plotW}
                height={Math.max(2, nominalBottomY - nominalTopY)}
                fill="rgba(16, 185, 129, 0.10)"
              />

              {/* Horizontal Grid Lines & Y Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const v = yMin + (yMax - yMin) * (1 - t);
                const y = padT + plotH * t;
                return (
                  <g key={idx}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {v.toFixed(activeConfig.decimals)}
                    </text>
                  </g>
                );
              })}

              {/* Nominal Upper Threshold Hairline */}
              <line
                x1={padL}
                y1={nominalTopY}
                x2={svgW - padR}
                y2={nominalTopY}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="5 3"
                opacity="0.7"
              />

              {/* Area Fill + Trend Curve */}
              {areaPath && <path d={areaPath} fill={`url(#grad-${activeConfig.id})`} />}
              {polyPoints && (
                <polyline
                  fill="none"
                  stroke={latestStatus.strokeColor}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polyPoints}
                />
              )}

              {/* Hover Crosshair Hairline */}
              {hoveredIndex !== null && activeSeries[hoveredIndex] && (
                <line
                  x1={indexToX(hoveredIndex, activeSeries.length)}
                  y1={padT}
                  x2={indexToX(hoveredIndex, activeSeries.length)}
                  y2={padT + plotH}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data Points & Interactive Hit Targets */}
              {activeSeries.map((pt, i) => {
                const cx = indexToX(i, activeSeries.length);
                const cy = valueToY(pt.value);
                const ptSt = evaluateColorTier(activeConfig, pt.value);
                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={`${pt.label}-${i}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <circle cx={cx} cy={cy} r={14} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={ptSt.strokeColor}
                      stroke="#020617"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={svgH - 10}
                      textAnchor="middle"
                      fill={isHovered ? '#e2e8f0' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Color Legend Key */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                Green Zone ({activeConfig.nominalLow}–{activeConfig.nominalHigh} {activeConfig.unit})
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Amber = Crew Self-Care
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                Red = Tell Earth Doctors
              </span>
            </div>
            <span>Hover any point to inspect</span>
          </div>
        </div>

        {/* Beginner-Friendly Guided Explanation Card */}
        {showSimpleGuide && (
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                Beginner-Friendly Guide (No Medical Training Needed)
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                {simpleGuide ? simpleGuide.title : activeConfig.label}
              </h3>
            </div>

            {simpleGuide ? (
              <div className="space-y-2.5">
                <div>
                  <strong className="text-slate-200 block">What is this measuring?</strong>
                  <p className="text-slate-400 leading-relaxed mt-0.5">{simpleGuide.whatItIs}</p>
                </div>

                <div>
                  <strong className="text-slate-200 block">How to measure it step-by-step:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 mt-1">
                    {simpleGuide.howToMeasureSimple.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <strong className="text-slate-200 block text-[11px]">
                    How to read the colors at a glance:
                  </strong>
                  <p className="text-emerald-300 text-[11px]">Green: {simpleGuide.colorMeaning.green}</p>
                  <p className="text-amber-300 text-[11px]">Amber: {simpleGuide.colorMeaning.amber}</p>
                  <p className="text-rose-300 text-[11px]">Red: {simpleGuide.colorMeaning.red}</p>
                </div>

                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  <strong>Why it matters:</strong> {simpleGuide.riskIfIgnored}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-slate-300 leading-relaxed">
                <p>
                  <strong>What it tells you:</strong> {activeConfig.plainSummary}
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                  <p className="text-emerald-300">
                    Green ({activeConfig.nominalLow}–{activeConfig.nominalHigh} {activeConfig.unit}): Normal healthy range.
                  </p>
                  <p className="text-amber-300">
                    Amber: Slightly outside ideal range—review hydration, sleep, or cabin airflow.
                  </p>
                  <p className="text-rose-300">
                    Red: Outside safe corridor—follow emergency checklist and alert Earth Flight Surgeons.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
