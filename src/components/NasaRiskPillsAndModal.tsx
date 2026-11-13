import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
  Activity,
  Brain,
  Radiation,
  Compass,
} from 'lucide-react';
import { FlaggedNasaRisk, NasaRiskCategory } from '../data/nasaHrpRisks';

interface SmartRiskPillsProps {
  risks: FlaggedNasaRisk[];
  title?: string;
  compact?: boolean;
  onInspectRegion?: (regionId: string) => void;
}

export const SmartRiskPills: React.FC<SmartRiskPillsProps> = ({
  risks,
  title = 'NASA HRP Specific Risks Detected',
  compact = false,
  onInspectRegion,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (risks.length === 0) return null;

  const selectedRisk = risks.find((r) => r.spec.id === expandedId) || null;

  const getBadgeStyle = (severity: FlaggedNasaRisk['severity'], isSelected: boolean) => {
    const activeRing = isSelected ? 'ring-2 ring-cyan-400/80' : '';
    if (severity === 'RED') {
      return `bg-rose-950/90 border-rose-500/80 text-rose-200 hover:bg-rose-900/80 ${activeRing}`;
    }
    if (severity === 'AMBER') {
      return `bg-amber-950/85 border-amber-500/80 text-amber-200 hover:bg-amber-900/70 ${activeRing}`;
    }
    return `bg-emerald-950/80 border-emerald-600/70 text-emerald-200 hover:bg-emerald-900/60 ${activeRing}`;
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>{title}</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Click badge for 3-line guide
        </span>
      </div>

      {/* Smart Risk Pills */}
      <div className="flex flex-wrap gap-1.5">
        {risks.map((item) => {
          const isSelected = expandedId === item.spec.id;
          return (
            <button
              key={item.spec.id}
              type="button"
              onClick={() => setExpandedId(isSelected ? null : item.spec.id)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${getBadgeStyle(
                item.severity,
                isSelected
              )}`}
            >
              <span>⚠ NASA HRP Risk: {item.spec.shortBadge}</span>
              {isSelected ? (
                <ChevronUp className="w-3 h-3 opacity-80" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sleek 3-Line Plain-English Briefing */}
      {selectedRisk && (
        <div className="p-3 rounded-xl bg-slate-950 border border-cyan-600/70 space-y-2 text-xs shadow-lg">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                {selectedRisk.spec.categoryLabel} · Official NASA HRP Risk
              </span>
              <h5 className="text-xs font-bold text-slate-100 mt-0.5">
                {selectedRisk.spec.title}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close risk briefing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] leading-relaxed">
            <div>
              <strong className="text-cyan-400 font-mono">What NASA Found:</strong>{' '}
              <span className="text-slate-300">{selectedRisk.spec.whatNasaFound}</span>
            </div>
            <div>
              <strong className="text-amber-400 font-mono">Why It’s Flagged Now:</strong>{' '}
              <span className="text-slate-200">{selectedRisk.whyFlaggedNow}</span>
            </div>
            <div>
              <strong className="text-emerald-400 font-mono">Actionable Countermeasure:</strong>{' '}
              <span className="text-emerald-200">{selectedRisk.spec.countermeasure}</span>
            </div>
          </div>

          {onInspectRegion && selectedRisk.spec.linkedRegionId && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onInspectRegion(selectedRisk.spec.linkedRegionId!)}
                className="px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold cursor-pointer"
              >
                Focus Body Region in 3D
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NasaRiskMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRisks: FlaggedNasaRisk[];
  evaMode: boolean;
  onToggleEvaMode?: (val: boolean) => void;
}

export const NasaRiskMatrixModal: React.FC<NasaRiskMatrixModalProps> = ({
  isOpen,
  onClose,
  allRisks,
  evaMode,
  onToggleEvaMode,
}) => {
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: {
    id: NasaRiskCategory;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'physiology',
      label: 'Human Physiology Risks',
      subtitle: 'Ocular, vestibular, heart, bone/muscle, immune, nutrition, hypoxia & EVA bends',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      accent: 'text-cyan-400 border-cyan-800/60',
    },
    {
      id: 'behavioral',
      label: 'Behavioral Performance Risks',
      subtitle: 'Sleep, isolation stress, crew teamwork, EVA cognitive load & offline procedures',
      icon: <Brain className="w-4 h-4 text-amber-400" />,
      accent: 'text-amber-400 border-amber-800/60',
    },
    {
      id: 'radiation',
      label: 'Space Radiation Risk',
      subtitle: 'Cumulative galactic cosmic rays, solar flares & storm-shelter protection',
      icon: <Radiation className="w-4 h-4 text-rose-400" />,
      accent: 'text-rose-400 border-rose-800/60',
    },
  ];

  const activeCount = allRisks.filter((r) => r.isActiveFlag).length;
  const inspectedRisk = allRisks.find((r) => r.spec.id === selectedRiskId) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                NASA HRP Specific Health Risk Coverage Matrix
              </h3>
              <p className="text-xs text-slate-400">
                100% offline active surveillance across {allRisks.length} official NASA risks ·{' '}
                <strong className="text-amber-300 font-mono">{activeCount} currently flagged</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleEvaMode && (
              <button
                type="button"
                onClick={() => onToggleEvaMode(!evaMode)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  evaMode
                    ? 'bg-amber-950 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>EVA Readiness: {evaMode ? 'ON' : 'OFF'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close risk matrix"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Matrix */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          {inspectedRisk && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-600/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-cyan-300">
                  {inspectedRisk.spec.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRiskId(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-300">
                <strong className="text-cyan-400 font-mono">What NASA Found:</strong>{' '}
                {inspectedRisk.spec.whatNasaFound}
              </p>
              <p className="text-slate-200">
                <strong className="text-amber-400 font-mono">Why Flagged / Live Status:</strong>{' '}
                {inspectedRisk.whyFlaggedNow}
              </p>
              <p className="text-emerald-300">
                <strong className="text-emerald-400 font-mono">Countermeasure:</strong>{' '}
                {inspectedRisk.spec.countermeasure}
              </p>
            </div>
          )}

          {categories.map((cat) => {
            const catRisks = allRisks.filter((r) => r.spec.category === cat.id);
            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    {cat.icon}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{cat.label}</h4>
                      <p className="text-[11px] text-slate-400">{cat.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    ✓ {catRisks.length}/{catRisks.length} Monitored
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {catRisks.map((item) => (
                    <button
                      key={item.spec.id}
                      type="button"
                      onClick={() =>
                        setSelectedRiskId(
                          selectedRiskId === item.spec.id ? null : item.spec.id
                        )
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start justify-between gap-2.5 ${
                        item.isActiveFlag
                          ? item.severity === 'RED'
                            ? 'bg-rose-950/45 border-rose-500/75'
                            : 'bg-amber-950/35 border-amber-500/70'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-100">{item.spec.title}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Sensor / Check: {item.spec.monitoredBy}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {item.whyFlaggedNow}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                          item.isActiveFlag
                            ? item.severity === 'RED'
                              ? 'bg-rose-950 border-rose-600 text-rose-300'
                              : 'bg-amber-950 border-amber-600 text-amber-300'
                            : 'bg-emerald-950 border-emerald-700 text-emerald-300'
                        }`}
                      >
                        {item.isActiveFlag ? 'FLAGGED' : 'MONITORED'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
