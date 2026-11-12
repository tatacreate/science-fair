import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Flame,
  Pill,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Radio,
  Layers,
  Info,
} from 'lucide-react';
import { calculateRadiationBiologicalImpact } from '../utils/scienceCalculators';

export interface RadiationExposureLog {
  id: string;
  timestamp: string;
  source: 'Solar Particle Event (SPE)' | 'Galactic Cosmic Rays (GCR)' | 'Trapped Belt / SAA Pass' | 'Secondary Bremsstrahlung';
  doseRateUSvPerHour: number;
  accumulatedDoseMsv: number;
  mitigationAction: string;
  status: 'ACTIVE' | 'MITIGATED' | 'LOGGED';
  effectiveReductionPct: number;
  notes: string;
}

interface RadiationMonitorModuleProps {
  astronautName: string;
  missionCode: string;
  currentDoseRate: number; // µSv/h
  cumulativeCareerDose: number; // mSv
  onDoseRateChange?: (newRate: number) => void;
  onMitigationTriggered?: (actionName: string, reductionPct: number) => void;
}

export const RadiationMonitorModule: React.FC<RadiationMonitorModuleProps> = ({
  astronautName,
  missionCode,
  currentDoseRate: initialDoseRate = 2.1,
  cumulativeCareerDose: initialCareerDose = 14.2,
  onDoseRateChange,
  onMitigationTriggered,
}) => {
  // Live dosimeter rate
  const [doseRate, setDoseRate] = useState<number>(initialDoseRate);
  const [cumulativeCareer, setCumulativeCareer] = useState<number>(initialCareerDose);
  const [cumulative30Day, setCumulative30Day] = useState<number>(3.8);

  // Breakdown by source
  const [doseSources, setDoseSources] = useState({
    speFlares: 2.1, // mSv from past solar flares
    gcrBackground: 10.4, // mSv from Galactic Cosmic Rays
    secondaryBelt: 1.7, // mSv from trapped belts / secondary Bremsstrahlung
  });

  // Active Countermeasures State
  const [inStormShelter, setInStormShelter] = useState<boolean>(false);
  const [attitudeAligned, setAttitudeAligned] = useState<boolean>(false);
  const [polyethyleneShieldsActive, setPolyethyleneShieldsActive] = useState<boolean>(false);
  const [evaCancelled, setEvaCancelled] = useState<boolean>(false);
  const [exercisePostponed, setExercisePostponed] = useState<boolean>(false);
  const [activeSupplements, setActiveSupplements] = useState<string[]>([]);

  // Simulation mode
  const [simulatedScenario, setSimulatedScenario] = useState<string | null>(null);

  // Event & Mitigation Chronological Log
  const [exposureLogs, setExposureLogs] = useState<RadiationExposureLog[]>([
    {
      id: 'log-001',
      timestamp: '06:15 UTC',
      source: 'Galactic Cosmic Rays (GCR)',
      doseRateUSvPerHour: 2.1,
      accumulatedDoseMsv: 14.2,
      mitigationAction: 'Baseline cabin hull composite shielding active',
      status: 'LOGGED',
      effectiveReductionPct: 35,
      notes: 'Deep-space nominal interplanetary GCR background flux.',
    },
    {
      id: 'log-002',
      timestamp: '07:40 UTC',
      source: 'Solar Particle Event (SPE)',
      doseRateUSvPerHour: 18.4,
      accumulatedDoseMsv: 14.24,
      mitigationAction: 'Reoriented spacecraft propulsion tanks along CME vector',
      status: 'MITIGATED',
      effectiveReductionPct: 42,
      notes: 'Minor M-Class flare flank transit. Spacecraft propellant alignment absorbed primary proton wave.',
    },
  ]);

  // Alert message for threshold breach
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  // Scientific calculation
  const biologicalImpact = calculateRadiationBiologicalImpact(doseRate, cumulativeCareer);

  // Calculate total active shielding attenuation percentage
  let totalShieldingPct = 35; // baseline hull
  if (inStormShelter) totalShieldingPct += 53; // reaches 88%
  if (attitudeAligned) totalShieldingPct += 8; // reaches up to 96%
  if (polyethyleneShieldsActive) totalShieldingPct += 4;
  totalShieldingPct = Math.min(98, totalShieldingPct);

  // Threshold alerts evaluation
  useEffect(() => {
    if (doseRate >= 250) {
      setActiveAlert('CRITICAL RADCON-1 ALERT: Class X Solar Flare detected! Dose rate exceeds 250 µSv/h. IMMEDIATE STORM SHELTER INGRESS REQUIRED.');
    } else if (doseRate >= 50) {
      setActiveAlert('HAZARDOUS RADCON-2 ALERT: Significant SPE proton flux (Dose rate > 50 µSv/h). Move to shielded quarters and deploy auxiliary shielding.');
    } else if (doseRate >= 15) {
      setActiveAlert('ADVISORY RADCON-3 ALERT: Solar wind radiation flux elevated above nominal (> 15 µSv/h). Postpone EVA sorties.');
    } else if (cumulative30Day >= 200) {
      setActiveAlert('NASA 30-DAY THRESHOLD WARNING: 30-day cumulative dose is approaching NASA 250 mSv mission safety cap.');
    } else {
      setActiveAlert(null);
    }
  }, [doseRate, cumulative30Day]);

  // Log countermeasure action
  const logAction = (actionName: string, reductionPct: number, notes: string) => {
    const newLog: RadiationExposureLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC',
      source: doseRate > 50 ? 'Solar Particle Event (SPE)' : doseRate > 10 ? 'Trapped Belt / SAA Pass' : 'Galactic Cosmic Rays (GCR)',
      doseRateUSvPerHour: doseRate,
      accumulatedDoseMsv: cumulativeCareer,
      mitigationAction: actionName,
      status: 'MITIGATED',
      effectiveReductionPct: reductionPct,
      notes,
    };
    setExposureLogs((prev) => [newLog, ...prev]);
    if (onMitigationTriggered) {
      onMitigationTriggered(actionName, reductionPct);
    }
  };

  // 1. Storm Shelter Ingress / Egress
  const handleToggleStormShelter = () => {
    if (!inStormShelter) {
      setInStormShelter(true);
      const reducedRate = Math.max(0.6, +(doseRate * 0.12).toFixed(2));
      setDoseRate(reducedRate);
      if (onDoseRateChange) onDoseRateChange(reducedRate);
      logAction(
        'Ingress to Water-Wall Storm Shelter',
        88,
        'Astronaut entered central storm shelter surrounded by 40cm potable water storage tanks. Radiation flux attenuated by 88%.'
      );
    } else {
      setInStormShelter(false);
      const restoredRate = simulatedScenario === 'flare' ? 380 : simulatedScenario === 'saa' ? 62 : 2.1;
      setDoseRate(restoredRate);
      if (onDoseRateChange) onDoseRateChange(restoredRate);
      logAction(
        'Egress from Storm Shelter to Main Module',
        0,
        'Astronaut returned to main flight deck. Nominal module shielding resumed.'
      );
    }
  };

  // 2. Spacecraft Attitude Alignment
  const handleToggleAttitude = () => {
    const nextState = !attitudeAligned;
    setAttitudeAligned(nextState);
    if (nextState) {
      const reduced = Math.max(0.8, +(doseRate * 0.58).toFixed(2));
      setDoseRate(reduced);
      if (onDoseRateChange) onDoseRateChange(reduced);
      logAction(
        'Spacecraft Attitude Vector Alignment',
        42,
        'Reaction control thrusters oriented service module propellant tanks toward Sun CME vector to absorb solar proton stream.'
      );
    } else {
      logAction('Spacecraft Attitude Reset to Flight Vector', 0, 'Orientation returned to standard navigation flight trajectory.');
    }
  };

  // 3. Polyethylene Shielding
  const handleTogglePolyethylene = () => {
    const nextState = !polyethyleneShieldsActive;
    setPolyethyleneShieldsActive(nextState);
    if (nextState) {
      logAction('Deployed Auxiliary 5cm HDPE Sleeping Quarter Shields', 30, 'High-density polyethylene hydrogen-rich blocks deployed to shield sleeping berth.');
    }
  };

  // 4. Nutritional Supplements
  const handleAdministerSupplement = (name: string, dose: string, bioFunction: string) => {
    if (activeSupplements.includes(name)) return;
    setActiveSupplements((prev) => [...prev, name]);
    logAction(
      `Administered ${name} (${dose})`,
      15,
      `${bioFunction} Protocol logged in medical locker database.`
    );
  };

  // 5. Schedule Alterations
  const handleCancelEVA = () => {
    setEvaCancelled(true);
    logAction(
      'MISSION SCHEDULE ALTERATION: Emergency EVA Spacewalk Abort / Postponement',
      100,
      'Ground Flight Surgeon and Onboard Triage halted all exterior EVA egress until dosimeters confirm flare passage.'
    );
  };

  const handlePostponeExercise = () => {
    setExercisePostponed(true);
    logAction(
      'MISSION SCHEDULE ALTERATION: Postponed High-Intensity Cardiovascular ARED Workout',
      25,
      'Delayed heavy resistance cycle to prevent elevated minute ventilation and accelerated vascular radiotoxin circulation.'
    );
  };

  // Inject Scenarios
  const handleInjectScenario = (scenario: 'flare' | 'gcr' | 'saa' | 'nominal') => {
    setSimulatedScenario(scenario);
    let targetRate = 2.1;
    if (scenario === 'flare') {
      targetRate = inStormShelter ? 45.6 : 380.0;
      setDoseSources((prev) => ({ ...prev, speFlares: +(prev.speFlares + 2.8).toFixed(1) }));
      setCumulativeCareer((prev) => +(prev + 2.8).toFixed(1));
      setCumulative30Day((prev) => +(prev + 2.8).toFixed(1));
      logAction('Solar Flare Class X-3.2 Proton Inundation', 0, 'Major coronal mass ejection impact detected by exterior Alpha-Proton spectrometer.');
    } else if (scenario === 'saa') {
      targetRate = inStormShelter ? 7.4 : 62.0;
      setDoseSources((prev) => ({ ...prev, secondaryBelt: +(prev.secondaryBelt + 0.5).toFixed(1) }));
      setCumulativeCareer((prev) => +(prev + 0.5).toFixed(1));
      setCumulative30Day((prev) => +(prev + 0.5).toFixed(1));
      logAction('Trapped Belt / SAA Orbital Crossing', 0, 'Spacecraft entering inner radiation belt geomagnetic anomaly.');
    } else if (scenario === 'gcr') {
      targetRate = 8.8;
      setDoseSources((prev) => ({ ...prev, gcrBackground: +(prev.gcrBackground + 0.2).toFixed(1) }));
      logAction('Solar Minimum Deep Space GCR Peak Flux', 0, 'Weakened heliospheric magnetic field allowing increased galactic iron/heavy HZE ion penetration.');
    } else {
      targetRate = inStormShelter ? 0.35 : 2.1;
      logAction('Restored to Nominal Interplanetary Deep-Space Baseline', 0, 'Solar proton flux subsided below action thresholds.');
    }

    setDoseRate(targetRate);
    if (onDoseRateChange) onDoseRateChange(targetRate);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
            <Zap className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                HelioMed Radiation Monitoring &amp; Countermeasures Engine
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 border border-rose-700 text-rose-300 uppercase">
                NASA HRP Dosimetry Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative deep-space radiation tracking, multi-source breakdown, threshold alarms, and proactive clinical countermeasures for {astronautName} ({missionCode}).
            </p>
          </div>
        </div>

        {/* Live RADCON Status Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 font-mono text-xs">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                doseRate >= 250
                  ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                  : doseRate >= 50
                  ? 'bg-amber-500 shadow-lg shadow-amber-500/50'
                  : doseRate >= 15
                  ? 'bg-yellow-400'
                  : 'bg-emerald-400'
              }`}
            />
            <div>
              <span className="text-[10px] text-slate-500 block">CURRENT STATUS</span>
              <span className="font-bold text-slate-200">
                {doseRate >= 250
                  ? 'RADCON-1 (CRITICAL SPE)'
                  : doseRate >= 50
                  ? 'RADCON-2 (HAZARDOUS)'
                  : doseRate >= 15
                  ? 'RADCON-3 (ELEVATED)'
                  : 'RADCON-4 (NOMINAL)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Alert Banner (Appears when predefined thresholds approached or breached) */}
      {activeAlert && (
        <div className="p-4 rounded-xl bg-rose-950/90 border-2 border-rose-600 shadow-2xl flex items-start gap-3.5 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold font-mono text-rose-200 uppercase tracking-wide">
              {activeAlert}
            </h4>
            <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
              Immediate autonomous mitigation protocol engaged. NASA Flight Surgeons at Johnson Space Center are alerted via high-priority DSN telemetry packet. Execute proactive countermeasures below.
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Core Metrics: Instantaneous Rate + Cumulative Dose + NASA Career Limit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Instantaneous Rate */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>FLUX DOSE RATE</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-1.5">
            <span className={doseRate > 50 ? 'text-rose-400' : doseRate > 15 ? 'text-amber-400' : 'text-slate-100'}>
              {doseRate.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-sans font-normal">µSv/h</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Threshold alert: &gt;15 µSv/h
          </div>
        </div>

        {/* Metric 2: 30-Day Cumulative Dose */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>30-DAY MISSION DOSE</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-1.5">
            <span className={cumulative30Day > 150 ? 'text-rose-400' : 'text-amber-300'}>
              {cumulative30Day.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-sans font-normal">mSv</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            NASA 30-Day Cap: 250 mSv ({Math.round((cumulative30Day / 250) * 100)}%)
          </div>
        </div>

        {/* Metric 3: Career Lifetime Exposure */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>CAREER CUMULATIVE</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 flex items-baseline gap-1.5">
            <span>{cumulativeCareer.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-sans font-normal">mSv</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Career limit: 600 mSv ({Math.round((cumulativeCareer / 600) * 100)}%)
          </div>
        </div>

        {/* Metric 4: Shielding Attenuation */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SHIELDING ATTENUATION</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 flex items-baseline gap-1.5">
            <span>{totalShieldingPct}%</span>
            <span className="text-xs text-slate-400 font-sans font-normal">
              {inStormShelter ? 'In Shelter' : 'Standard Hull'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Storm shelter: -88% attenuation
          </div>
        </div>
      </div>

      {/* Multi-Source Dose Breakdown & Progress Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Cumulative Dosage Breakdown by Exposure Source:
            </h3>
            <p className="text-[11px] text-slate-400">
              NASA REID safety envelope (600 mSv limit for 3% mean risk of exposure-induced death).
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            Total Logged: {cumulativeCareer.toFixed(1)} mSv / 600 mSv
          </span>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${Math.min(100, (doseSources.gcrBackground / 600) * 100 * 8)}%` }}
            className="bg-cyan-500 h-full"
            title={`GCR Background: ${doseSources.gcrBackground} mSv`}
          />
          <div
            style={{ width: `${Math.min(100, (doseSources.speFlares / 600) * 100 * 8)}%` }}
            className="bg-rose-500 h-full"
            title={`Solar Flares / SPE: ${doseSources.speFlares} mSv`}
          />
          <div
            style={{ width: `${Math.min(100, (doseSources.secondaryBelt / 600) * 100 * 8)}%` }}
            className="bg-amber-500 h-full"
            title={`Trapped Belts / Secondary: ${doseSources.secondaryBelt} mSv`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-500" />
              <span className="text-slate-300">Galactic Cosmic Rays (GCR)</span>
            </div>
            <strong className="text-cyan-300">{doseSources.gcrBackground.toFixed(1)} mSv</strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-300">Solar Flares &amp; SPE</span>
            </div>
            <strong className="text-rose-300">{doseSources.speFlares.toFixed(1)} mSv</strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-300">Trapped Belts &amp; Secondary</span>
            </div>
            <strong className="text-amber-300">{doseSources.secondaryBelt.toFixed(1)} mSv</strong>
          </div>
        </div>
      </div>

      {/* Proactive Countermeasures Suite (Interactive Action Matrix) */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Proactive Radiation Countermeasures &amp; Mitigation Protocols:
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Click action to engage &amp; log
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column A: Physical Shielding Actions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Compass className="w-4 h-4" />
              1. Spatial &amp; Habitat Shielding
            </div>

            {/* Countermeasure 1: Storm Shelter */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Water-Wall Storm Shelter</h4>
                  <p className="text-[11px] text-slate-400">40cm potable water wall reduces proton flux by 88%</p>
                </div>
                {inStormShelter && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">INSIDE</span>}
              </div>
              <button
                type="button"
                onClick={handleToggleStormShelter}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  inStormShelter
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{inStormShelter ? 'Egress Shelter (Return to Deck)' : 'Move to Storm Shelter (-88%)'}</span>
              </button>
            </div>

            {/* Countermeasure 2: Spacecraft Attitude Alignment */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Spacecraft CME Alignment</h4>
                  <p className="text-[11px] text-slate-400">Orient propellant tanks toward flare vector (-42%)</p>
                </div>
                {attitudeAligned && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">ALIGNED</span>}
              </div>
              <button
                type="button"
                onClick={handleToggleAttitude}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  attitudeAligned
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{attitudeAligned ? 'Attitude Aligned to CME Vector' : 'Align Spacecraft Attitude (-42%)'}</span>
              </button>
            </div>

            {/* Countermeasure 3: Auxiliary Polyethylene */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">HDPE Sleeping Berth Blocks</h4>
                  <p className="text-[11px] text-slate-400">5cm high-density polyethylene shielding (-30%)</p>
                </div>
                {polyethyleneShieldsActive && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">DEPLOYED</span>}
              </div>
              <button
                type="button"
                onClick={handleTogglePolyethylene}
                disabled={polyethyleneShieldsActive}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <span>{polyethyleneShieldsActive ? 'HDPE Shielding Active' : 'Deploy HDPE Berth Shields'}</span>
              </button>
            </div>
          </div>

          {/* Column B: Radioprotective Nutritional Supplements & Pharma */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
              <Pill className="w-4 h-4" />
              2. Radioprotectant Supplements
            </div>

            {/* Supplement 1: NAC */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">N-Acetylcysteine (NAC) 1200mg</h4>
                  <p className="text-[11px] text-slate-400">Glutathione precursor; neutralizes radiation free-radicals</p>
                </div>
                {activeSupplements.includes('NAC') && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <button
                type="button"
                onClick={() => handleAdministerSupplement('NAC', '1200mg', 'Scavenges reactive oxygen species & protects DNA integrity.')}
                disabled={activeSupplements.includes('NAC')}
                className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <span>{activeSupplements.includes('NAC') ? 'Administered (In System)' : 'Administer NAC 1200mg'}</span>
              </button>
            </div>

            {/* Supplement 2: Vitamin E + Selenium */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Alpha-Tocopherol &amp; Selenium</h4>
                  <p className="text-[11px] text-slate-400">Protects cell membranes against lipid peroxidation</p>
                </div>
                {activeSupplements.includes('VitE_Selenium') && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <button
                type="button"
                onClick={() => handleAdministerSupplement('VitE_Selenium', '400 IU + 200µg', 'Inhibits lipid membrane peroxidation and mitochondrial degradation.')}
                disabled={activeSupplements.includes('VitE_Selenium')}
                className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <span>{activeSupplements.includes('VitE_Selenium') ? 'Administered' : 'Administer Vit E + Selenium'}</span>
              </button>
            </div>

            {/* Supplement 3: Amifostine Analogue */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Amifostine WR-2721 Protocol</h4>
                  <p className="text-[11px] text-slate-400">Cytoprotective agent for acute proton flare inundation</p>
                </div>
                {activeSupplements.includes('Amifostine') && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <button
                type="button"
                onClick={() => handleAdministerSupplement('Amifostine', '500mg sublingual', 'Cellular radioprotectant scavenges hydroxyl radicals.')}
                disabled={activeSupplements.includes('Amifostine')}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <span>{activeSupplements.includes('Amifostine') ? 'Administered' : 'Administer Amifostine Analogue'}</span>
              </button>
            </div>
          </div>

          {/* Column C: Mission Schedule Alterations */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
              <Clock className="w-4 h-4" />
              3. Mission Schedule Alterations
            </div>

            {/* Alteration 1: Cancel EVA */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Abort / Postpone EVA Spacewalk</h4>
                  <p className="text-[11px] text-slate-400">Exterior suit offers minimal proton storm attenuation</p>
                </div>
                {evaCancelled && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">ABORTED</span>}
              </div>
              <button
                type="button"
                onClick={handleCancelEVA}
                disabled={evaCancelled}
                className="w-full py-2 px-3 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-mono font-bold transition cursor-pointer disabled:opacity-50"
              >
                <span>{evaCancelled ? 'EVA Sortie Stand-Down Order Active' : 'Order Immediate EVA Abort'}</span>
              </button>
            </div>

            {/* Alteration 2: Postpone Exercise */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Reschedule Heavy ARED Workouts</h4>
                  <p className="text-[11px] text-slate-400">High pulmonary cardiac output increases toxin spread</p>
                </div>
                {exercisePostponed && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">POSTPONED</span>}
              </div>
              <button
                type="button"
                onClick={handlePostponeExercise}
                disabled={exercisePostponed}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <span>{exercisePostponed ? 'ARED Cycle Postponed 12h' : 'Postpone ARED Exercise'}</span>
              </button>
            </div>

            {/* Guidance memo */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-0.5">NASA Flight Surgeon Directive:</span>
              During high SPE events, all astronaut physical activity must remain low metabolic rate (&lt;100 bpm) while sheltered in the habitat core.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Radiation Event Simulation Switcher */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-slate-200 block">
            Inject Simulated Deep-Space Radiation Events (Test Module):
          </span>
          <span className="text-[11px] text-slate-400">
            Verify automated threshold triggers, shelter attenuation, and NASA ground reporting.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleInjectScenario('flare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              simulatedScenario === 'flare'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/60'
            }`}
          >
            🔥 Class X Solar Flare (380 µSv/h)
          </button>

          <button
            type="button"
            onClick={() => handleInjectScenario('saa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              simulatedScenario === 'saa'
                ? 'bg-amber-600 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-900/60'
            }`}
          >
            ⚡ SAA Anomaly Pass (62 µSv/h)
          </button>

          <button
            type="button"
            onClick={() => handleInjectScenario('gcr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              simulatedScenario === 'gcr'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900/60'
            }`}
          >
            🌌 GCR Solar Min Peak (8.8 µSv/h)
          </button>

          <button
            type="button"
            onClick={() => handleInjectScenario('nominal')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer"
          >
            ✓ Reset Nominal (2.1 µSv/h)
          </button>
        </div>
      </div>

      {/* Chronological Exposure Events & Mitigation Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs sm:text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Official Radiation Exposure &amp; Mitigation Action Log:
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            {exposureLogs.length} Events Recorded &bull; Auto-Synced to Earth DSN
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Exposure Source</th>
                <th className="py-2.5 px-3">Rate (µSv/h)</th>
                <th className="py-2.5 px-3">Accumulated</th>
                <th className="py-2.5 px-3">Mitigation Action Taken</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Attenuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {exposureLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-300">{log.timestamp}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        log.source.includes('Solar')
                          ? 'text-rose-400'
                          : log.source.includes('Trapped')
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {log.source}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-200 font-bold">
                    {log.doseRateUSvPerHour.toFixed(1)} µSv/h
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {log.accumulatedDoseMsv.toFixed(2)} mSv
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-200 font-medium">{log.mitigationAction}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{log.notes}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        log.status === 'MITIGATED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : log.status === 'ACTIVE'
                          ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-emerald-400 font-bold">
                    {log.effectiveReductionPct > 0 ? `-${log.effectiveReductionPct}%` : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
