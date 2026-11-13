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
import { CansNeutronHudWidget } from './CansNeutronHudWidget';

interface TelemetryVitalsGridProps {
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  status: TriageLevel;
  cumulativeDose: number;
  onOpenRadiationTab?: () => void;
}

export const TelemetryVitalsGrid: React.FC<TelemetryVitalsGridProps> = ({
  telemetry,
  cabin,
  cumulativeDose,
  onOpenRadiationTab,
}) => {
  const alveolar = calculateAlveolarOxygen(cabin.ambientPressure, cabin.o2Fraction, cabin.ambientCO2);
  const radiation = calculateRadiationBiologicalImpact(telemetry.radiationDoseRate, cumulativeDose);
  const hypercapnia = calculateHypercapniaRisk(cabin.ambientCO2, telemetry.heartRate, telemetry.hrvRmssd);
  const cardiac = calculateCardiovascularStrain(telemetry.heartRate, telemetry.systolicBp, telemetry.hrvRmssd);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            Live Body &amp; Cabin Vitals
          </h2>
        </div>
        <span className="text-xs font-mono text-emerald-400">
          Offline Sensors Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
        {/* Heart Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" /> Heart Rate
            </span>
            <span className="font-mono text-[11px] text-slate-400">bpm</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                telemetry.heartRate > 100
                  ? 'text-rose-400'
                  : telemetry.heartRate > 94 || telemetry.heartRate < 55
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {telemetry.heartRate}
            </span>
            <span
              className={`text-xs font-mono ${
                telemetry.heartRate > 100
                  ? 'text-rose-300'
                  : telemetry.heartRate > 94
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {telemetry.heartRate > 100 ? 'High' : telemetry.heartRate > 94 ? 'Elevated' : 'Healthy'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Normal: 60–94</span>
            <span className={cardiac.orthostaticIntoleranceRisk === 'HIGH' ? 'text-rose-400' : 'text-slate-400'}>
              {cardiac.orthostaticIntoleranceRisk} Load
            </span>
          </div>
        </div>

        {/* Blood Oxygen */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-sky-400" /> Blood Oxygen
            </span>
            <span className="font-mono text-[11px] text-slate-400">SpO₂</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
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
              {telemetry.spo2 < 92 ? 'Low O₂ Alert' : telemetry.spo2 < 95 ? 'Watch' : 'Healthy'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Lung O₂: {alveolar.pao2mmHg} mmHg ({alveolar.status})
          </div>
        </div>

        {/* Radiation Dose Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Radiation
            </span>
            <span className="font-mono text-[11px] text-slate-400">µSv/h</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                telemetry.radiationDoseRate > 100
                  ? 'text-rose-400'
                  : telemetry.radiationDoseRate > 15
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
            <span>Career: {cumulativeDose?.toFixed(1) || '0.0'} mSv</span>
            <span>Safe &lt; 15</span>
          </div>
        </div>

        {/* Ambient CO2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" /> Cabin CO₂
            </span>
            <span className="font-mono text-[11px] text-slate-400">mmHg</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
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
              {cabin.ambientCO2 > 3.5 ? 'Headache Risk' : 'Clean Air'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Headache Risk: {hypercapnia.headacheRiskPercentage}%
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" /> Blood Pressure
            </span>
            <span className="font-mono text-[11px] text-slate-400">mmHg</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                telemetry.systolicBp < 95 || telemetry.systolicBp > 140
                  ? 'text-amber-400'
                  : 'text-slate-100'
              }`}
            >
              {telemetry.systolicBp}/{telemetry.diastolicBp}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Fatigue: {telemetry.fatigueScore}/100
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Breathing: {telemetry.respiratoryRate}/min · HRV: {telemetry.hrvRmssd} ms
          </div>
        </div>

        {/* Cabin Pressure & Temp */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" /> Cabin Air &amp; Temp
            </span>
            <span className="font-mono text-[11px] text-slate-400">kPa / °C</span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                cabin.ambientPressure < 54
                  ? 'text-rose-400'
                  : 'text-slate-100'
              }`}
            >
              {cabin?.ambientPressure?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              {telemetry?.coreTemp?.toFixed(1) || '37.0'}°C
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            O₂: {cabin?.o2Fraction?.toFixed(1) || '21.0'}% · {cabin.ambientPressure < 54 ? 'Low Pressure!' : 'Pressure OK'}
          </div>
        </div>
      </div>

      {/* CANS Active Neutron Spectrometer Telemetry Feed */}
      <CansNeutronHudWidget
        compact
        doseRateUSv={telemetry.radiationDoseRate}
        cumulativeDoseMsv={cumulativeDose}
        onTriggerShelter={onOpenRadiationTab}
      />
    </div>
  );
};
