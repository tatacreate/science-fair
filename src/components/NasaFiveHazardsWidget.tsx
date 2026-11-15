import React, { useState } from 'react';
import {
  Radiation,
  Brain,
  Radio,
  Activity,
  Wind,
  X,
  ArrowRight,
  Info,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { NasaHazardId, NasaHazardStatus } from '../data/nasaFiveHazards';

interface NasaFiveHazardsWidgetProps {
  hazards: NasaHazardStatus[];
  onTriggerHazardAction?: (hazard: NasaHazardStatus) => void;
  title?: string;
}

export const NasaFiveHazardsWidget: React.FC<NasaFiveHazardsWidgetProps> = ({
  hazards,
  onTriggerHazardAction,
  title = 'NASA 5 Hazards Monitor',
}) => {
  const [activeHazardId, setActiveHazardId] = useState<NasaHazardId | null>(null);

  const selectedHazard = hazards.find((h) => h.id === activeHazardId) || null;

  const getIcon = (id: NasaHazardId) => {
    switch (id) {
      case 'radiation':
        return <Radiation className="w-4 h-4 shrink-0" />;
      case 'isolation':
        return <Brain className="w-4 h-4 shrink-0" />;
      case 'distance':
        return <Radio className="w-4 h-4 shrink-0" />;
      case 'gravity':
        return <Activity className="w-4 h-4 shrink-0" />;
      case 'environment':
        return <Wind className="w-4 h-4 shrink-0" />;
    }
  };

  const getCardStyle = (status: NasaHazardStatus['status'], isSelected: boolean) => {
    const ring = isSelected ? 'ring-2 ring-cyan-400/70' : '';
    if (status === 'RED') {
      return `bg-rose-950/50 border-rose-500/80 text-rose-100 hover:bg-rose-950/75 ${ring}`;
    }
    if (status === 'AMBER') {
      return `bg-amber-950/40 border-amber-500/70 text-amber-100 hover:bg-amber-950/65 ${ring}`;
    }
    return `bg-slate-950 border-emerald-700/60 text-slate-100 hover:border-emerald-500 ${ring}`;
  };

  const getStatusTextClass = (status: NasaHazardStatus['status']) => {
    if (status === 'RED') return 'text-rose-300';
    if (status === 'AMBER') return 'text-amber-300';
    return 'text-emerald-300';
  };

  const getStatusDotClass = (status: NasaHazardStatus['status']) => {
    if (status === 'RED') return 'bg-rose-400';
    if (status === 'AMBER') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
      {/* Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            · Click any hazard for NASA briefing
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="text-emerald-400">● Nominal</span>
          <span className="text-amber-400">● Elevated</span>
          <span className="text-rose-400">● Action Required</span>
          <a
            href="https://www.nasa.gov/hrp/hazards/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            <span>NASA HRP Hazards</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 5 Clickable Color-Coded Hazard Pills/Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {hazards.map((hz) => {
          const isSelected = hz.id === activeHazardId;
          return (
            <button
              key={hz.id}
              type="button"
              onClick={() => setActiveHazardId(isSelected ? null : hz.id)}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${getCardStyle(
                hz.status,
                isSelected
              )}`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <span className={getStatusTextClass(hz.status)}>{getIcon(hz.id)}</span>
                  <span className="truncate">{hz.shortTitle}</span>
                </div>
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-mono text-slate-200 tabular-nums truncate">
                  {hz.liveMetric}
                </div>
                <div className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${getStatusTextClass(hz.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(hz.status)}`} />
                  <span>{hz.statusLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive "Click-to-Learn" NASA HRP Briefing Popover */}
      {selectedHazard && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-600/70 space-y-3">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className={getStatusTextClass(selectedHazard.status)}>
                {getIcon(selectedHazard.id)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    NASA HRP Briefing: {selectedHazard.title}
                  </h3>
                  <span className={`text-xs font-mono font-bold ${getStatusTextClass(selectedHazard.status)}`}>
                    · {selectedHazard.statusLabel}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Live Reading: {selectedHazard.liveMetric}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveHazardId(null)}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close NASA briefing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400 block">
                1. What It Is
              </span>
              <p className="text-slate-300 leading-relaxed">{selectedHazard.whatItIs}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-amber-400 block">
                2. Crew Body Impact
              </span>
              <p className="text-slate-300 leading-relaxed">{selectedHazard.crewImpact}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                3. HelioMed Countermeasure
              </span>
              <p className="text-slate-200 leading-relaxed">{selectedHazard.countermeasure}</p>
            </div>
          </div>

          {onTriggerHazardAction && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  onTriggerHazardAction(selectedHazard);
                  setActiveHazardId(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>{selectedHazard.linkedActionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
