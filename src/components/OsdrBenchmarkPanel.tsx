import React, { useState } from 'react';
import {
  Database,
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Microscope,
} from 'lucide-react';
import { NASA_OSDR_DATASETS, OsdrStudyDataset } from '../data/osdrDatasets';
import { CabinEnvironment, SimulationScenario, TelemetryState } from '../types/heliomed';
import { HabitatEnvironmentId } from '../data/habitatEnvironments';

interface OsdrBenchmarkPanelProps {
  activeScenarioId?: string;
  onApplyOsdrTestCase: (dataset: OsdrStudyDataset) => void;
  onResetOsdrTest: () => void;
  liveTelemetry: TelemetryState;
  liveCabin: CabinEnvironment;
  onJumpToEnvironment: (envId: HabitatEnvironmentId) => void;
}

export const OsdrBenchmarkPanel: React.FC<OsdrBenchmarkPanelProps> = ({
  activeScenarioId,
  onApplyOsdrTestCase,
  onResetOsdrTest,
  liveTelemetry,
  liveCabin,
  onJumpToEnvironment,
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>(NASA_OSDR_DATASETS[0].studyId);

  const selectedStudy =
    NASA_OSDR_DATASETS.find((d) => d.studyId === selectedStudyId) || NASA_OSDR_DATASETS[0];

  const isCurrentlyTestingSelected = activeScenarioId === selectedStudy.testScenario.id;

  // Map a live dashboard value where applicable so astronauts can compare themselves to real OSDR cohorts
  const getCrewLiveComparison = (indicatorName: string): string | null => {
    const lower = indicatorName.toLowerCase();
    if (lower.includes('heart rate variability')) return `${liveTelemetry.hrvRmssd} ms`;
    if (lower.includes('resting heart rate') || lower === 'heart rate')
      return `${liveTelemetry.heartRate} bpm`;
    if (lower.includes('blood oxygen') || lower.includes('spo2')) return `${liveTelemetry.spo2}%`;
    if (lower.includes('radiation dose rate')) return `${liveTelemetry.radiationDoseRate} µSv/h`;
    if (lower.includes('breathing rate')) return `${liveTelemetry.respiratoryRate} br/min`;
    if (lower.includes('systolic blood pressure')) return `${liveTelemetry.systolicBp} mmHg`;
    if (lower.includes('co2')) return `${liveCabin.ambientCO2} mmHg`;
    if (lower.includes('pressure') && !lower.includes('eye') && !lower.includes('systolic'))
      return `${liveCabin.ambientPressure} kPa`;
    return null;
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-300 flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                NASA Open Science Data Repository (OSDR) Flight Biology Testbench
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[10px] font-mono font-bold">
                EMBEDDED OFFLINE ARCHIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Compare your live readings against real NASA spaceflight biology studies (Earth baseline vs. In-Flight measurements) and test how HelioMed catches each real anomaly offline.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeScenarioId?.startsWith('osdr-') && (
            <button
              type="button"
              onClick={onResetOsdrTest}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Nominal Baseline</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onJumpToEnvironment(selectedStudy.environmentId);
              onApplyOsdrTestCase(selectedStudy);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {isCurrentlyTestingSelected
                ? `Re-Inject ${selectedStudy.studyId} Case`
                : `Test ${selectedStudy.studyId} Case in Dashboard`}
            </span>
          </button>
        </div>
      </div>

      {/* Study Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {NASA_OSDR_DATASETS.map((study) => {
          const isSelected = study.studyId === selectedStudy.studyId;
          const isActiveTest = activeScenarioId === study.testScenario.id;
          return (
            <button
              key={study.studyId}
              type="button"
              onClick={() => setSelectedStudyId(study.studyId)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500/70'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono text-[11px] font-bold">
                  {study.studyId}
                </span>
                {isActiveTest && (
                  <span className="text-[10px] font-mono font-bold text-amber-300">ACTIVE TEST</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">
                  {study.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{study.cohortLabel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Study Details + Biomarker Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Plain-English Space Biology Explanation */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-cyan-300">
                {selectedStudy.studyId} · {selectedStudy.cohortLabel}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              {selectedStudy.environmentId.replace('_', ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono">{selectedStudy.missionContext}</p>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase block">
              What Scientists Found (Plain Language):
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {selectedStudy.plainEnglishFinding}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 space-y-1">
            <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase block">
              Why It Matters To Non-Doctor Crew:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {selectedStudy.whyAstronautsCare}
            </p>
          </div>

          {isCurrentlyTestingSelected && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-700/60 text-xs text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                This OSDR anomaly is currently injected into the 3D Body Inspector, Vitals Grid, and Dynamic Charts above.
              </span>
            </div>
          )}
        </div>

        {/* Right: Earth Baseline vs Flight Delta vs Crew Live Comparison */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              BIOMARKER COMPARISON (EARTH VS. SPACEFLIGHT STUDY VS. YOUR LIVE STATUS)
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedStudy.biomarkers.map((bm, i) => {
              const liveNow = getCrewLiveComparison(bm.indicatorName);
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{bm.indicatorName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        (Safe: {bm.safeLimitLabel})
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        bm.status === 'ALERT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : bm.status === 'WATCH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {bm.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">EARTH BASELINE</span>
                      <span className="text-emerald-300 font-bold tabular-nums">
                        {bm.earthBaseline} {bm.unit}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">OSDR IN-FLIGHT</span>
                      <span className="text-amber-300 font-bold tabular-nums">
                        {bm.flightObserved} {bm.unit}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">YOUR LIVE SENSOR</span>
                      <span className="text-cyan-300 font-bold tabular-nums">
                        {liveNow || 'Manual Log'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>{bm.plainMeaning}</span>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onJumpToEnvironment(selectedStudy.environmentId);
                onApplyOsdrTestCase(selectedStudy);
              }}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Run {selectedStudy.studyId} anomaly test in body viewer &amp; charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
