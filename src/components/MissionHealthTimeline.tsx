import React, { useState, useEffect } from 'react';
import {
  TimelineDayEntry,
  loadMissionTimeline,
  resetMissionTimeline,
  updateLatestTimelineDay,
} from '../data/missionTimelineStore';
import { Calendar, RotateCcw, PlusCircle, Check } from 'lucide-react';

type TimelineMetricKey = 'all' | 'sleepHours' | 'stressScore' | 'painSeverity' | 'hydrationLiters';

interface MissionHealthTimelineProps {
  astronautId: string;
  astronautName: string;
  roleView?: 'astronaut' | 'doctor';
  externalSyncNonce?: number;
}

const METRIC_META: {
  key: Exclude<TimelineMetricKey, 'all'>;
  label: string;
  unit: string;
  color: string;
  maxScale: number;
  decimals: number;
}[] = [
  {
    key: 'sleepHours',
    label: 'Sleep Hours',
    unit: 'hrs',
    color: '#38bdf8',
    maxScale: 10,
    decimals: 1,
  },
  {
    key: 'stressScore',
    label: 'Stress Score',
    unit: '/10',
    color: '#fbbf24',
    maxScale: 10,
    decimals: 0,
  },
  {
    key: 'painSeverity',
    label: 'Pain Logs',
    unit: '/10',
    color: '#fb7185',
    maxScale: 10,
    decimals: 0,
  },
  {
    key: 'hydrationLiters',
    label: 'Hydration',
    unit: 'L',
    color: '#34d399',
    maxScale: 4,
    decimals: 1,
  },
];

export const MissionHealthTimeline: React.FC<MissionHealthTimelineProps> = ({
  astronautId,
  astronautName,
  roleView = 'astronaut',
  externalSyncNonce = 0,
}) => {
  const [entries, setEntries] = useState<TimelineDayEntry[]>(() =>
    loadMissionTimeline(astronautId)
  );
  const [activeMetric, setActiveMetric] = useState<TimelineMetricKey>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const latest = entries[entries.length - 1] || entries[0];
  const [draftSleep, setDraftSleep] = useState<number>(latest?.sleepHours ?? 7.0);
  const [draftStress, setDraftStress] = useState<number>(latest?.stressScore ?? 3);
  const [draftPain, setDraftPain] = useState<number>(latest?.painSeverity ?? 2);
  const [draftHydration, setDraftHydration] = useState<number>(latest?.hydrationLiters ?? 2.5);
  const [draftNote, setDraftNote] = useState<string>(latest?.note ?? '');

  useEffect(() => {
    const loaded = loadMissionTimeline(astronautId);
    setEntries(loaded);
    const last = loaded[loaded.length - 1];
    if (last) {
      setDraftSleep(last.sleepHours);
      setDraftStress(last.stressScore);
      setDraftPain(last.painSeverity);
      setDraftHydration(last.hydrationLiters);
      setDraftNote(last.note);
    }
  }, [astronautId, externalSyncNonce]);

  const handleSaveToday = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateLatestTimelineDay(astronautId, {
      sleepHours: draftSleep,
      stressScore: draftStress,
      painSeverity: draftPain,
      hydrationLiters: draftHydration,
      note: draftNote.trim() || 'Updated Day 14 crew log.',
    });
    setEntries(updated);
    setShowQuickLog(false);
  };

  const handleReset = () => {
    const reset = resetMissionTimeline(astronautId);
    setEntries(reset);
    const last = reset[reset.length - 1];
    if (last) {
      setDraftSleep(last.sleepHours);
      setDraftStress(last.stressScore);
      setDraftPain(last.painSeverity);
      setDraftHydration(last.hydrationLiters);
      setDraftNote(last.note);
    }
  };

  // SVG chart dimensions
  const svgW = 780;
  const svgH = 230;
  const padL = 44;
  const padR = 24;
  const padT = 20;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const indexToX = (i: number) =>
    entries.length <= 1 ? padL + plotW / 2 : padL + (i / (entries.length - 1)) * plotW;

  // Normalize values onto 0..10 display axis (hydration scaled x2.5 so 4L == 10)
  const normalizeValue = (key: Exclude<TimelineMetricKey, 'all'>, val: number) => {
    const meta = METRIC_META.find((m) => m.key === key)!;
    return Math.min(1, Math.max(0, val / meta.maxScale));
  };

  const ratioToY = (r: number) => padT + plotH - r * plotH;

  const visibleMetrics =
    activeMetric === 'all'
      ? METRIC_META
      : METRIC_META.filter((m) => m.key === activeMetric);

  const inspectedEntry =
    hoveredIdx !== null && entries[hoveredIdx] ? entries[hoveredIdx] : entries[entries.length - 1];

  const avgSleep = +(
    entries.reduce((acc, e) => acc + e.sleepHours, 0) / (entries.length || 1)
  ).toFixed(1);
  const avgStress = +(
    entries.reduce((acc, e) => acc + e.stressScore, 0) / (entries.length || 1)
  ).toFixed(1);
  const avgHydration = +(
    entries.reduce((acc, e) => acc + e.hydrationLiters, 0) / (entries.length || 1)
  ).toFixed(1);
  const painDaysCount = entries.filter((e) => e.painSeverity > 0).length;

  return (
    <section
      aria-label="14-Day Mars Transit Mission Health Timeline"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Mission Health Timeline · 14-Day Mars Transit ({astronautName})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-day local browser record tracking Sleep Hours, Stress Score, Pain Logs, and Hydration trends{' '}
              {roleView === 'doctor' ? 'for Flight Surgeon review' : 'across mission days'}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickLog((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showQuickLog ? 'Close Day 14 Editor' : 'Log Day 14 Metrics'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 14-Day Transit</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Day-14 LocalStorage Updater */}
      {showQuickLog && (
        <form
          onSubmit={handleSaveToday}
          className="p-4 rounded-xl bg-slate-950 border border-cyan-700/70 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase text-cyan-400 font-bold">
              Update Day 14 Entry (Saved Locally in Browser Storage)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="space-y-1">
              <span className="text-slate-400 font-mono text-[11px] block">Sleep (hrs)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="12"
                value={draftSleep}
                onChange={(e) => setDraftSleep(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 font-mono text-[11px] block">Stress (1–10)</span>
              <input
                type="number"
                min="1"
                max="10"
                value={draftStress}
                onChange={(e) => setDraftStress(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 font-mono text-[11px] block">Pain Log (0–10)</span>
              <input
                type="number"
                min="0"
                max="10"
                value={draftPain}
                onChange={(e) => setDraftPain(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 font-mono text-[11px] block">Hydration (L)</span>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="4.5"
                value={draftHydration}
                onChange={(e) => setDraftHydration(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono tabular-nums"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Day 14 brief crew note..."
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Day 14</span>
            </button>
          </div>
        </form>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">14-Day Avg Sleep</span>
          <div className="text-xl font-bold font-mono tabular-nums text-sky-400">
            {avgSleep} <span className="text-xs text-slate-400 font-normal">hrs/night</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Day 14: {latest?.sleepHours} hrs
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">14-Day Avg Stress</span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-400">
            {avgStress} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Day 14: {latest?.stressScore}/10
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">Days With Pain Logged</span>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-400">
            {painDaysCount} <span className="text-xs text-slate-400 font-normal">/ 14 days</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 truncate block">
            Day 14: {latest?.painSeverity}/10 ({latest?.painZone})
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">14-Day Avg Hydration</span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {avgHydration} <span className="text-xs text-slate-400 font-normal">L/day</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Day 14: {latest?.hydrationLiters} L
          </span>
        </div>
      </div>

      {/* Metric Filter Controls + Inspected Day Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeMetric === 'all'
                ? 'bg-cyan-600 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 4 Trends
          </button>
          {METRIC_META.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMetric(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeMetric === m.key
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {inspectedEntry && (
          <div className="text-xs font-mono text-slate-300 flex flex-wrap items-center gap-3">
            <span className="text-cyan-400 font-bold">{inspectedEntry.solLabel}:</span>
            <span className="tabular-nums text-sky-300">Sleep {inspectedEntry.sleepHours}h</span>
            <span className="tabular-nums text-amber-300">Stress {inspectedEntry.stressScore}/10</span>
            <span className="tabular-nums text-rose-300">Pain {inspectedEntry.painSeverity}/10</span>
            <span className="tabular-nums text-emerald-300">Water {inspectedEntry.hydrationLiters}L</span>
          </div>
        )}
      </div>

      {/* Interactive 14-Day SVG Multi-Channel Trend Chart */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-56 select-none"
            role="img"
            aria-label="14-Day Mars Transit Health Timeline Chart"
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
              const y = padT + plotH * t;
              const labelVal = activeMetric === 'hydrationLiters'
                ? `${((1 - t) * 4).toFixed(1)}L`
                : `${Math.round((1 - t) * 10)}`;
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
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Polyline Paths */}
            {visibleMetrics.map((m) => {
              const pts = entries
                .map((entry, idx) => {
                  const ratio = normalizeValue(m.key, entry[m.key]);
                  return `${indexToX(idx)},${ratioToY(ratio)}`;
                })
                .join(' ');
              return (
                <polyline
                  key={m.key}
                  fill="none"
                  stroke={m.color}
                  strokeWidth={activeMetric === 'all' ? '2.2' : '3'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pts}
                />
              );
            })}

            {/* Hover Crosshair */}
            {hoveredIdx !== null && (
              <line
                x1={indexToX(hoveredIdx)}
                y1={padT}
                x2={indexToX(hoveredIdx)}
                y2={padT + plotH}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Day Columns & Points */}
            {entries.map((entry, idx) => {
              const x = indexToX(idx);
              const isHov = hoveredIdx === idx;
              return (
                <g
                  key={entry.day}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <rect
                    x={x - plotW / 28}
                    y={padT}
                    width={plotW / 14}
                    height={plotH}
                    fill="transparent"
                  />
                  {visibleMetrics.map((m) => {
                    const y = ratioToY(normalizeValue(m.key, entry[m.key]));
                    return (
                      <circle
                        key={m.key}
                        cx={x}
                        cy={y}
                        r={isHov ? 5 : 3.2}
                        fill={m.color}
                        stroke="#020617"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                  <text
                    x={x}
                    y={svgH - 10}
                    textAnchor="middle"
                    fill={isHov ? '#f8fafc' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    D{entry.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Day Context Note + Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-4">
            {METRIC_META.map((m) => (
              <span key={m.key} className="inline-flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: m.color }}
                />
                <span>{m.label}</span>
              </span>
            ))}
          </div>
          {inspectedEntry && (
            <span className="text-slate-400">
              {inspectedEntry.solLabel} Note:{' '}
              <strong className="text-slate-200 font-sans font-medium">
                {inspectedEntry.note}
              </strong>
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
