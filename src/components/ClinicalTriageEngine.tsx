import React, { useState } from 'react';
import { SimulationScenario, TriageLevel, AstronautProfile } from '../types/heliomed';
import { SPACEFLIGHT_SCENARIOS } from '../data/spaceflightScenarios';
import {
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Brain,
  Shield,
  Radio,
} from 'lucide-react';

interface ClinicalTriageEngineProps {
  currentScenario: SimulationScenario | null;
  onSelectScenario: (scenario: SimulationScenario | null) => void;
  astronautName: string;
  triageLevel: TriageLevel;
  onOpenThinkingModal: () => void;
  isThinkingLoading: boolean;
}

export const ClinicalTriageEngine: React.FC<ClinicalTriageEngineProps> = ({
  currentScenario,
  onSelectScenario,
  astronautName,
  triageLevel,
  onOpenThinkingModal,
  isThinkingLoading,
}) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const toggleAction = (action: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Autonomous Edge Triage &amp; Clinical Scenarios
            </h3>
            <p className="text-xs text-slate-400">
              Zero-latency clinical decision protocols for deep space transit (Earth latency 14m 28s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentScenario && (
            <button
              type="button"
              onClick={() => {
                onSelectScenario(null);
                setCompletedActions({});
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Baseline
            </button>
          )}

          <button
            type="button"
            onClick={onOpenThinkingModal}
            disabled={isThinkingLoading}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isThinkingLoading ? 'Synthesizing...' : 'Gemini Deep Thinking Triage'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Chips */}
      <div>
        <span className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 block">
          Inject Spaceflight Clinical Edge Cases:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SPACEFLIGHT_SCENARIOS.map((sc) => {
            const isSelected = currentScenario?.id === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  onSelectScenario(sc);
                  setCompletedActions({});
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sc.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      {sc.severity}
                    </span>
                    {isSelected && <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{sc.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Incident Details & Countermeasures */}
      {currentScenario ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{currentScenario.name}</span>
                <span className="text-xs font-mono text-cyan-400">
                  Target: {astronautName}
                </span>
              </div>
              <p className="text-xs text-rose-300 mt-0.5">{currentScenario.clinicalSigns}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>EARTH SYNC QUEUED (PACKET #702)</span>
            </div>
          </div>

          {/* Pathophysiology Mechanism */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 leading-relaxed font-sans">
            <span className="font-semibold text-cyan-300 block mb-1">Pathophysiological Fusion:</span>
            {currentScenario.scientificMechanism}
          </div>

          {/* Immediate Countermeasures Checklist */}
          <div>
            <h5 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Immediate Onboard Mitigation Protocol (Local Crew Execution):
            </h5>
            <div className="space-y-2">
              {currentScenario.countermeasures.map((action: string, idx: number) => {
                const isDone = !!completedActions[action];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 line-through opacity-80'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isDone ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span>{action}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
          <p>
            Current crew biometrics are <strong className="text-emerald-400">NOMINAL</strong>. Select a scenario above to inject acute spaceflight emergencies (Hypercapnia, Radiation SPE Storm, Microgravity Cardiac Deconditioning, or Decompression) to observe autonomous multi-stressor AI data fusion.
          </p>
        </div>
      )}
    </div>
  );
};
