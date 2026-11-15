import React, { useState } from 'react';
import {
  Info,
  X,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface CansNeutronHudWidgetProps {
  doseRateUSv: number;
  cumulativeDoseMsv: number;
  inStormShelter?: boolean;
  compact?: boolean;
  onTriggerShelter?: () => void;
}

export const CansNeutronHudWidget: React.FC<CansNeutronHudWidgetProps> = ({
  doseRateUSv,
  cumulativeDoseMsv,
  inStormShelter = false,
  compact = false,
  onTriggerShelter,
}) => {
  const [showTechSpec, setShowTechSpec] = useState(false);

  // Authentic neutron physics: neutrons make up ~30% of effective deep-space biological dose
  const totalDailyMsv = (doseRateUSv * 24) / 1000;
  const neutronSharePct = inStormShelter ? 14 : 30;
  const neutronMsvPerDay = totalDailyMsv * (neutronSharePct / 100);
  const cumulativeNeutronMsv = cumulativeDoseMsv * 0.3;

  const status: 'GREEN' | 'AMBER' | 'RED' =
    doseRateUSv > 50 ? 'RED' : doseRateUSv > 12 ? 'AMBER' : 'GREEN';

  const statusLabel =
    status === 'RED'
      ? 'Solar Storm / High Neutron Spike'
      : status === 'AMBER'
      ? 'Elevated Particle Flux'
      : 'Nominal Levels';

  const ringStrokeClass =
    status === 'RED'
      ? 'stroke-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.65)]'
      : status === 'AMBER'
      ? 'stroke-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]'
      : 'stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]';

  const cardBorderClass =
    status === 'RED'
      ? 'border-rose-500/80 bg-rose-950/25'
      : status === 'AMBER'
      ? 'border-amber-500/75 bg-amber-950/20'
      : 'border-emerald-700/60 bg-slate-950/90';

  const statusTextClass =
    status === 'RED'
      ? 'text-rose-300'
      : status === 'AMBER'
      ? 'text-amber-300'
      : 'text-emerald-300';

  // Gauge fill percentage (maps 0..250 µSv/h smoothly into ring arc)
  const gaugePct = Math.min(100, Math.max(18, Math.round((doseRateUSv / 80) * 100)));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gaugePct / 100) * circumference;

  return (
    <div className={`rounded-xl border p-3.5 sm:p-4 space-y-3 transition-colors ${cardBorderClass}`}>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 shrink-0 ${statusTextClass}`} />
          <div>
            <h4 className="text-xs font-bold text-slate-100 leading-tight">
              CANS (Canadian Active Neutron Spectrometer) Feed
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              CSA &amp; Bubble-Detector Active Heritage · Continuous Deep-Space Log
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTechSpec(!showTechSpec)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            showTechSpec
              ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
              : 'bg-slate-900 border-slate-700 text-cyan-300 hover:border-cyan-500/70'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>CANS Tech Spec</span>
        </button>
      </div>

      {/* Color-Coded Status Ring + Live Telemetry Readouts */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Status Ring HUD Gauge */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-slate-800"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-500 ${ringStrokeClass}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-xs font-mono font-bold tabular-nums ${statusTextClass}`}>
              {neutronMsvPerDay.toFixed(3)}
            </span>
            <span className="text-[9px] font-mono text-slate-400">mSv/day</span>
          </div>
        </div>

        {/* Live Telemetry Breakdown */}
        <div className="flex-1 grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 block">
              NEUTRON EXPOSURE
            </span>
            <div className={`text-sm font-mono font-bold tabular-nums ${statusTextClass}`}>
              {neutronMsvPerDay.toFixed(3)} mSv/day
            </div>
            <span className="text-[10px] text-slate-400 block">
              ~{neutronSharePct}% of total space dose
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 block">
              TOTAL CUMULATIVE DOSE
            </span>
            <div className="text-sm font-mono font-bold text-slate-100 tabular-nums">
              {cumulativeDoseMsv.toFixed(1)} mSv
            </div>
            <span className="text-[10px] text-slate-400 block">
              Est. {cumulativeNeutronMsv.toFixed(1)} mSv from neutrons
            </span>
          </div>

          <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-[11px] font-mono">
            <span className={`font-bold flex items-center gap-1.5 ${statusTextClass}`}>
              {status === 'GREEN' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span>STATUS: {statusLabel}</span>
            </span>
            {!compact && (
              <span className="text-slate-400">
                Total Rate: {doseRateUSv.toFixed(1)} µSv/h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warning Card Linked to NASA HRP Risk: Radiation-Induced Cancers */}
      {(status === 'AMBER' || status === 'RED') && (
        <div
          className={`p-3 rounded-lg border text-xs space-y-2 ${
            status === 'RED'
              ? 'bg-rose-950/75 border-rose-500/80 text-rose-100'
              : 'bg-amber-950/60 border-amber-500/75 text-amber-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>⚠ NASA HRP Risk: Radiation-Induced Cancers · CANS Continuous Alert</span>
            </span>
            {onTriggerShelter && (
              <button
                type="button"
                onClick={onTriggerShelter}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold cursor-pointer"
              >
                Enter Water-Wall Shelter
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed">
            <strong>CANS Alert:</strong> Elevated neutron flux detected ({neutronMsvPerDay.toFixed(3)}{' '}
            mSv/day neutron component). Recommending crew shelter in high-mass shielded core /
            water-walled stowage area and hydrogen-rich polyethylene shielding.
          </p>
        </div>
      )}

      {/* Interactive "CANS Tech Spec" Popover */}
      {showTechSpec && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-600/80 space-y-2.5 text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tech Spotlight · CSA CANS &amp; Bubble Detectors</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTechSpec(false)}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close CANS tech spec"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-[11px] leading-relaxed">
            <div>
              <strong className="text-cyan-400 font-mono">What It Is:</strong>{' '}
              <span className="text-slate-300">
                A compact Canadian Space Agency instrument designed with Bubble
                Technology Industries to continuously measure harmful secondary neutrons in space.
              </span>
            </div>
            <div>
              <strong className="text-amber-400 font-mono">Why It Matters:</strong>{' '}
              <span className="text-slate-300">
                Neutrons cause ~30% of space radiation damage. Unlike older passive badge
                detectors, continuous real-time logging prevents surprise exposure spikes during
                Moon and Mars missions.
              </span>
            </div>
            <div>
              <strong className="text-emerald-400 font-mono">Terrestrial Benefits:</strong>{' '}
              <span className="text-slate-300">
                This space radiation technology also protects high-altitude airline crews,
                improves precision cancer radiation therapy, and strengthens nuclear plant safety on
                Earth.
              </span>
            </div>
            <div className="pt-1 border-t border-slate-800/80">
              <a
                href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                <span>Canadian Space Agency (CSA): Monitoring Radiation &amp; Astronaut Health</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
