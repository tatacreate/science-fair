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
  const getIcon = (id: string) => {
    switch (id) {
      case 'demo-co2-headache':
        return <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'demo-chest-discomfort':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'demo-solar-radiation':
        return <Radiation className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'demo-sleep-fatigue':
        return <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <section
      aria-label="Interactive Emergency Scenario Simulator"
      className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
          <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
            Simulate Scenario
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            · Demo Mode (Simulated Telemetry &amp; 3D Correlation)
          </span>
        </div>

        {activeScenario && (
          <button
            type="button"
            onClick={() => onSelectScenario(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Restore Nominal Baseline</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEMO_EMERGENCY_SCENARIOS.map((sc) => {
          const isActive = activeScenario?.id === sc.id;
          const isCritical = sc.severity === 'CRITICAL';
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(isActive ? null : sc)}
              className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? isCritical
                    ? 'bg-rose-950 border-rose-500 text-rose-100'
                    : 'bg-amber-950 border-amber-500 text-amber-100'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-600/70 hover:text-white'
              }`}
            >
              {getIcon(sc.id)}
              <span>{sc.shortLabel || sc.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
