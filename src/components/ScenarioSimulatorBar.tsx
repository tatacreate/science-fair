import React from 'react';
import { SimulationScenario } from '../types/heliomed';
import { DEMO_EMERGENCY_SCENARIOS } from '../data/demoScenarios';
import {
  Play,
  RotateCcw,
  Wind,
  HeartPulse,
  Radiation,
  Moon,
  SlidersHorizontal,
} from 'lucide-react';

interface ScenarioSimulatorBarProps {
  activeScenario: SimulationScenario | null;
  onSelectScenario: (scenario: SimulationScenario | null) => void;
}

export const ScenarioSimulatorBar: React.FC<ScenarioSimulatorBarProps> = ({
  activeScenario,
  onSelectScenario,
}) => {
  const getIcon = (id: string, isActive: boolean) => {
    const colorClass = isActive ? 'text-white' : '';
    switch (id) {
      case 'demo-co2-headache':
        return <Wind className={`w-4 h-4 shrink-0 ${colorClass || 'text-amber-300'}`} />;
      case 'demo-chest-discomfort':
        return <HeartPulse className={`w-4 h-4 shrink-0 ${colorClass || 'text-rose-300'}`} />;
      case 'demo-solar-radiation':
        return <Radiation className={`w-4 h-4 shrink-0 ${colorClass || 'text-orange-300'}`} />;
      case 'demo-sleep-fatigue':
        return <Moon className={`w-4 h-4 shrink-0 ${colorClass || 'text-sky-300'}`} />;
      default:
        return <Play className={`w-4 h-4 shrink-0 ${colorClass || 'text-cyan-300'}`} />;
    }
  };

  return (
    <section
      aria-label="Interactive Emergency Scenario Simulator"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/60">
            <SlidersHorizontal className="w-4 h-4 text-indigo-300 shrink-0" />
          </div>
          <h2 className="text-sm font-bold text-white">
            Test Emergency Scenarios (Demo Simulator)
          </h2>
          <span className="text-xs text-indigo-200">
            · Tap any button below to test 3D body alerts &amp; sensors
          </span>
        </div>

        {activeScenario && (
          <button
            type="button"
            onClick={() => onSelectScenario(null)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Back to Normal</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {DEMO_EMERGENCY_SCENARIOS.map((sc) => {
          const isActive = activeScenario?.id === sc.id;
          const isCritical = sc.severity === 'CRITICAL';
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(isActive ? null : sc)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? isCritical
                    ? 'bg-rose-600 border-rose-300 text-white shadow-[0_0_18px_rgba(244,63,94,0.5)]'
                    : 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                  : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-cyan-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isActive
                    ? isCritical
                      ? 'bg-white'
                      : 'bg-slate-950'
                    : isCritical
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
              {getIcon(sc.id, isActive && isCritical)}
              <span>{sc.shortLabel || sc.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
