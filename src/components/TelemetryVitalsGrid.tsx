import React from 'react';
import { TelemetryState, CabinEnvironment, TriageLevel } from '../types/heliomed';
import {
  calculateAlveolarOxygen,
  calculateRadiationBiologicalImpact,
  calculateHypercapniaRisk,
  calculateCardiovascularStrain,
} from '../utils/scienceCalculators';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  ShieldAlert,
  Gauge,
  Zap,
} from 'lucide-react';

interface TelemetryVitalsGridProps {
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  status: TriageLevel;
  cumulativeDose: number;
}

export const TelemetryVitalsGrid: React.FC<TelemetryVitalsGridProps> = ({
  telemetry,
  cabin,
  status,
  cumulativeDose,
}) => {
  // Compute real science metrics
  const alveolar = calculateAlveolarOxygen(cabin.ambientPressure, cabin.o2Fraction, cabin.ambientCO2);
  const radiation = calculateRadiationBiologicalImpact(telemetry.radiationDoseRate, cumulativeDose);
  const hypercapnia = calculateHypercapniaRisk(cabin.ambientCO2, telemetry.heartRate, telemetry.hrvRmssd);
  const cardiac = calculateCardiovascularStrain(telemetry.heartRate, telemetry.systolicBp, telemetry.hrvRmssd);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            Real-Time Biometric &amp; Habitat Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">FUSION ENGINE:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 font-bold">
            OFFLINE CAPSULE (0ms)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Heart Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" /> Heart Rate
            </span>
            <span className="font-mono text-[11px] text-slate-400">BPM</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.heartRate > 100
                  ? 'text-rose-400'
                  : telemetry.heartRate < 55
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {telemetry.heartRate}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {telemetry.heartRate > 100 ? 'Tachycardia' : 'Nominal'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
            <span>Shock Idx: {cardiac.shockIndex}</span>
            <span className={cardiac.orthostaticIntoleranceRisk === 'HIGH' ? 'text-rose-400' : 'text-slate-400'}>
              {cardiac.orthostaticIntoleranceRisk} Strain
            </span>
          </div>
        </div>

        {/* HRV RMSSD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> HRV (RMSSD)
            </span>
            <span className="font-mono text-[11px] text-slate-400">ms</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.hrvRmssd < 25
                  ? 'text-rose-400'
                  : telemetry.hrvRmssd < 40
                  ? 'text-amber-400'
                  : 'text-cyan-400'
              }`}
            >
              {telemetry.hrvRmssd}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Vagal: {cardiac.autonomicVagalTone}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Autonomic tone indicator
          </div>
        </div>

        {/* SpO2 & PAO2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-sky-400" /> SpO2 / PAO2
            </span>
            <span className="font-mono text-[11px] text-slate-400">% / mmHg</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.spo2 < 90
                  ? 'text-rose-400'
                  : telemetry.spo2 < 95
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {telemetry.spo2}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              PAO2: {alveolar.pao2mmHg}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Alveolar: {alveolar.status}
          </div>
        </div>

        {/* Radiation Dose Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Radiation Flux
            </span>
            <span className="font-mono text-[11px] text-slate-400">μSv/h</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.radiationDoseRate > 100
                  ? 'text-rose-400'
                  : telemetry.radiationDoseRate > 20
                  ? 'text-amber-400'
                  : 'text-purple-300'
              }`}
            >
              {telemetry.radiationDoseRate}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {radiation.clinicalRiskTier}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Cum: {cumulativeDose?.toFixed(1) || '0.0'} mSv</span>
            <span>DSB: {radiation.chromosomalDsbScore}%</span>
          </div>
        </div>

        {/* Ambient CO2 (Hypercapnia Risk) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" /> Cabin PCO2
            </span>
            <span className="font-mono text-[11px] text-slate-400">mmHg</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                cabin.ambientCO2 > 5.0
                  ? 'text-rose-400'
                  : cabin.ambientCO2 > 3.5
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {cabin?.ambientCO2?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Headache: {hypercapnia.headacheRiskPercentage}%
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Cerebral Vasodilation: {hypercapnia.cerebralVasodilationTier}
          </div>
        </div>

        {/* Ambient Cabin Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" /> Barometric Press.
            </span>
            <span className="font-mono text-[11px] text-slate-400">kPa</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                cabin.ambientPressure < 80
                  ? 'text-rose-400'
                  : cabin.ambientPressure < 95
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {cabin?.ambientPressure?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {cabin.ambientPressure < 80 ? 'DECOMPRESSION' : 'Nominal 101.3'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            FiO2: {cabin?.o2Fraction?.toFixed(1) || '0.0'}% | RH: {cabin?.relativeHumidity || '0'}%
          </div>
        </div>

        {/* Core Temperature */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" /> Core Body Temp
            </span>
            <span className="font-mono text-[11px] text-slate-400">°C</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.coreTemp > 38.0
                  ? 'text-rose-400'
                  : telemetry.coreTemp > 37.5
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {telemetry?.coreTemp?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Cabin: {cabin?.cabinTemp?.toFixed(1) || '0.0'}°C
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Microgravity circadian shift
          </div>
        </div>

        {/* Blood Pressure & Fatigue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" /> Blood Pressure
            </span>
            <span className="font-mono text-[11px] text-slate-400">mmHg</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {telemetry.systolicBp}/{telemetry.diastolicBp}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Fatigue: {telemetry.fatigueScore}/100
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Resp Rate: {telemetry.respiratoryRate} bpm
          </div>
        </div>
      </div>
    </div>
  );
};
