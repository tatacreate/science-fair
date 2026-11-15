import React from 'react';
import { ExplainableAssessment } from '../utils/correlationEngine';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Crosshair,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface ExplainableAssessmentCardListProps {
  assessments: ExplainableAssessment[];
  onFocusBodyRegion?: (regionId: string) => void;
  onClearScenario?: () => void;
  hasActiveScenario?: boolean;
}

export const ExplainableAssessmentCardList: React.FC<ExplainableAssessmentCardListProps> = ({
  assessments,
  onFocusBodyRegion,
  onClearScenario,
  hasActiveScenario = false,
}) => {
  if (assessments.length === 0) return null;

  return (
    <section
      aria-label="Explainable Health Correlation Assessments"
      className="space-y-3"
    >
      {assessments.map((item) => {
        const isCritical = item.severity === 'CRITICAL';
        const isWarning = item.severity === 'WARNING';

        const frameStyle = isCritical
          ? 'bg-slate-900 border-rose-600/70'
          : isWarning
          ? 'bg-slate-900 border-amber-500/70'
          : 'bg-slate-900 border-cyan-600/60';

        const badgeStyle = isCritical
          ? 'bg-rose-950 border-rose-700 text-rose-200'
          : isWarning
          ? 'bg-amber-950 border-amber-700 text-amber-200'
          : 'bg-cyan-950 border-cyan-700 text-cyan-200';

        const statusLabel = isCritical
          ? 'CRITICAL PRIORITY'
          : isWarning
          ? 'ELEVATED CAUTION'
          : 'ADVISORY WATCH';

        return (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${frameStyle}`}
          >
            {/* Card Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-bold ${badgeStyle}`}
                  >
                    {isCritical ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5" />
                    )}
                    <span>{statusLabel}</span>
                  </span>
                  <span className="text-slate-400">· {item.hazardCategory}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Explainable Assessment: {item.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onFocusBodyRegion && (
                  <button
                    type="button"
                    onClick={() => onFocusBodyRegion(item.targetRegionId)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Inspect 3D Zone</span>
                  </button>
                )}
                {hasActiveScenario && onClearScenario && (
                  <button
                    type="button"
                    onClick={onClearScenario}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Alert</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4-Question Structured Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* 1. What Was Detected */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                  1. What Was Detected
                </h4>
                <p className="text-slate-200 leading-relaxed text-xs sm:text-sm">
                  {item.whatWasDetected}
                </p>
              </div>

              {/* 2. Contributing Data */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                  2. Contributing Data (Check-In + Simulated Sensors)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.contributingData.map((datum, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <span className="text-slate-400 text-[11px] truncate">{datum.label}</span>
                      <span
                        className={`font-mono tabular-nums font-bold text-[11px] whitespace-nowrap ${
                          datum.isAbnormal ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        {datum.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Why It Matters */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-mono text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                  3. Why It Matters
                </h4>
                <p className="text-slate-300 leading-relaxed">{item.whyItMatters}</p>
              </div>

              {/* 4. Recommended Initial Response Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                    4. Recommended Initial Response Steps
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Non-Diagnostic Safety Actions
                  </span>
                </div>
                <ol className="space-y-1.5 text-slate-200">
                  {item.recommendedSteps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
