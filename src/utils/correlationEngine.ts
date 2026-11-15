import { CabinEnvironment, DailyCheckin, SimulationScenario, TelemetryState } from '../types/heliomed';

export interface ContributingDatum {
  label: string;
  value: string;
  isAbnormal?: boolean;
}

export interface ExplainableAssessment {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  whatWasDetected: string;
  contributingData: ContributingDatum[];
  whyItMatters: string;
  recommendedSteps: string[];
  targetRegionId: string;
  hazardCategory: string;
}

export interface CorrelationEngineInput {
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  latestCheckin: DailyCheckin | null;
  painAreas: string[];
  evaMode?: boolean;
  activeScenario?: SimulationScenario | null;
  cumulativeDoseMsv?: number;
}

function co2MmHgToPercent(mmHg: number): string {
  return ((mmHg / 760) * 100).toFixed(2);
}

export function runCorrelationEngine(input: CorrelationEngineInput): ExplainableAssessment[] {
  const {
    telemetry,
    cabin,
    latestCheckin,
    painAreas,
    evaMode = false,
    activeScenario = null,
    cumulativeDoseMsv = 94.2,
  } = input;

  const overlay = activeScenario?.simulatedCheckinOverlay;
  const effectivePainAreas =
    overlay?.painAreas && overlay.painAreas.length > 0 ? overlay.painAreas : painAreas;
  const effectivePainSeverity = overlay?.painSeverity ?? latestCheckin?.painSeverity ?? 0;
  const effectiveSleepHours = overlay?.sleepHours ?? latestCheckin?.sleepHours ?? 7.2;
  const effectiveSleepQuality = overlay?.sleepQuality ?? latestCheckin?.sleepQuality ?? 8;
  const effectiveMood = `${overlay?.mentalHealth || ''} ${latestCheckin?.mentalHealth || ''} ${
    overlay?.overallFeeling || ''
  } ${latestCheckin?.overallFeeling || ''}`.toLowerCase();

  const painStr = effectivePainAreas.join(' ').toLowerCase();
  const assessments: ExplainableAssessment[] = [];

  // 1. Environment-to-Body: Elevated Cabin CO2 + Headache / Hypercapnia
  const co2High = cabin.ambientCO2 > 3.5;
  const hasHeadache = /head|forehead|brain|sinus/i.test(painStr);
  if (
    activeScenario?.id === 'demo-co2-headache' ||
    activeScenario?.id === 'scenario-hypercapnia' ||
    co2High ||
    (hasHeadache && cabin.ambientCO2 >= 2.8)
  ) {
    const co2Pct = co2MmHgToPercent(cabin.ambientCO2);
    assessments.push({
      id: 'corr-co2-headache',
      severity: cabin.ambientCO2 >= 5.0 ? 'WARNING' : 'ADVISORY',
      title: 'Cabin CO₂ & Neurovascular Alert',
      whatWasDetected: hasHeadache
        ? `Headache (${effectivePainSeverity || 5}/10) logged alongside elevated simulated CO₂ at ${co2Pct}% (${cabin.ambientCO2.toFixed(
            1
          )} mmHg).`
        : `Simulated cabin CO₂ rose to ${co2Pct}% (${cabin.ambientCO2.toFixed(
            1
          )} mmHg), exceeding the nominal 0.4% threshold.`,
      contributingData: [
        {
          label: 'Simulated Cabin CO₂',
          value: `${co2Pct}% (${cabin.ambientCO2.toFixed(1)} mmHg)`,
          isAbnormal: true,
        },
        {
          label: 'Symptom Log',
          value: hasHeadache ? `Headache (${effectivePainSeverity || 5}/10)` : 'Pre-headache airflow watch',
          isAbnormal: hasHeadache,
        },
        {
          label: 'Simulated SpO₂ / HR',
          value: `${telemetry.spo2}% · ${telemetry.heartRate} bpm`,
          isAbnormal: telemetry.heartRate > 95 || telemetry.spo2 < 96,
        },
        {
          label: 'Respiratory Rate',
          value: `${telemetry.respiratoryRate} breaths/min`,
          isAbnormal: telemetry.respiratoryRate > 20,
        },
      ],
      whyItMatters:
        'Without natural gravity-driven air mixing, exhaled CO₂ accumulates around an astronaut’s head. Rising CO₂ levels dilate blood vessels in the brain, which commonly drives spaceflight headaches, slowed thinking, and fatigue.',
      recommendedSteps: [
        'Relocate to an open central corridor with steady ventilation airflow.',
        'Increase cabin circulation fans to 100% and inspect the LiOH / amine CO₂ scrubber rack.',
        'Drink 350–500 mL of water and re-check cabin CO₂ and symptom intensity in 10 minutes.',
        'Non-diagnostic guidance: If headache worsens or vision blurs, notify the Flight Surgeon console.',
      ],
      targetRegionId: 'head_brain',
      hazardCategory: 'Hostile/Closed Environments · NASA HRP Risk of Hypoxia',
    });
  }

  // 2. Sudden Chest Discomfort & Cardiovascular Strain
  const hasChestSymptom = /chest|heart|cardiac/i.test(painStr);
  const cardioAlert =
    activeScenario?.id === 'demo-chest-discomfort' ||
    activeScenario?.id === 'scenario-cardiac' ||
    hasChestSymptom ||
    telemetry.heartRate > 105;

  if (cardioAlert && activeScenario?.id !== 'demo-solar-radiation' && activeScenario?.id !== 'demo-co2-headache') {
    assessments.push({
      id: 'corr-cardio-chest',
      severity: hasChestSymptom || telemetry.heartRate > 110 ? 'CRITICAL' : 'WARNING',
      title: 'Cardiopulmonary Strain & Chest Comfort Alert',
      whatWasDetected: hasChestSymptom
        ? `Sudden chest discomfort (${effectivePainSeverity || 7}/10) logged alongside elevated simulated heart rate (${telemetry.heartRate} bpm) and low HRV (${telemetry.hrvRmssd} ms).`
        : `Simulated resting heart rate elevated to ${telemetry.heartRate} bpm with HRV drop to ${telemetry.hrvRmssd} ms.`,
      contributingData: [
        {
          label: 'Simulated Heart Rate',
          value: `${telemetry.heartRate} bpm`,
          isAbnormal: true,
        },
        {
          label: 'Heart Rate Variability (HRV)',
          value: `${telemetry.hrvRmssd} ms`,
          isAbnormal: telemetry.hrvRmssd < 35,
        },
        {
          label: 'Symptom Check-In',
          value: hasChestSymptom ? `Chest discomfort (${effectivePainSeverity || 7}/10)` : 'Elevated cardiac load',
          isAbnormal: hasChestSymptom,
        },
        {
          label: 'Simulated SpO₂ / BP',
          value: `${telemetry.spo2}% · ${telemetry.systolicBp}/${telemetry.diastolicBp} mmHg`,
          isAbnormal: telemetry.spo2 < 95 || telemetry.systolicBp > 135,
        },
      ],
      whyItMatters:
        'Long-duration spaceflight shifts fluid toward the chest and changes heart muscle workload. Sudden chest tightness paired with rapid pulse and low HRV requires immediate rest and close oxygen monitoring to rule out acute strain.',
      recommendedSteps: [
        'Pause all physical exertion immediately and secure yourself in a calm resting posture.',
        'Keep the fingertip pulse oximeter attached and confirm cabin O₂ fraction is 20.9% or higher.',
        'Follow slow 4-second inhale / 4-second exhale pacing to lower autonomic stress.',
        'Non-diagnostic guidance: Queue recorded ECG/vitals telemetry for Flight Surgeon review and keep emergency O₂ accessible.',
      ],
      targetRegionId: 'heart_cardio',
      hazardCategory: 'Altered Gravity Fields · NASA HRP Cardiovascular Adaptations',
    });
  }

  // 3. Solar Radiation Spike Alert (SPE + CANS Neutron Correlation)
  const radHigh =
    activeScenario?.id === 'demo-solar-radiation' ||
    activeScenario?.id === 'scenario-radiation' ||
    activeScenario?.id === 'osdr-352-test' ||
    telemetry.radiationDoseRate > 15;

  if (radHigh) {
    const estNeutronRate = +(telemetry.radiationDoseRate * 0.3).toFixed(1);
    assessments.push({
      id: 'corr-solar-radiation',
      severity: telemetry.radiationDoseRate > 50 ? 'CRITICAL' : 'WARNING',
      title: 'Solar Radiation & CANS Neutron Flux Alert',
      whatWasDetected: `Simulated radiation dosimeter spiked to ${telemetry.radiationDoseRate.toFixed(
        1
      )} µSv/h (estimated ${estNeutronRate} µSv/h secondary neutrons via CANS feed).`,
      contributingData: [
        {
          label: 'Simulated Total Dose Rate',
          value: `${telemetry.radiationDoseRate.toFixed(1)} µSv/h`,
          isAbnormal: true,
        },
        {
          label: 'Simulated CANS Neutron (~30%)',
          value: `${estNeutronRate} µSv/h`,
          isAbnormal: true,
        },
        {
          label: 'Simulated SPE Flux',
          value: `${cabin.speRadiationFlux.toLocaleString()} p/cm²/s`,
          isAbnormal: cabin.speRadiationFlux > 100,
        },
        {
          label: 'Career Cumulative Total',
          value: `${cumulativeDoseMsv.toFixed(1)} mSv`,
          isAbnormal: cumulativeDoseMsv > 150,
        },
      ],
      whyItMatters:
        'Outside Earth’s magnetic field, solar flares deliver penetrating charged particles and secondary neutrons (~30% of space radiation). Unshielded exposure increases cellular DNA stress and long-term radiation health risks.',
      recommendedSteps: [
        'Move immediately into the spacecraft’s water-walled Storm Shelter core (or dense stowage zone).',
        'Verify propulsion/water tanks are oriented toward the incoming solar flare direction if applicable.',
        'Hydrate well and take your scheduled daily crew antioxidant support pack.',
        'Non-diagnostic guidance: Remain sheltered until simulated CANS & dosimeter rates drop below 5.0 µSv/h for 30 minutes.',
      ],
      targetRegionId: 'head_brain',
      hazardCategory: 'Space Radiation · NASA HRP Radiation-Induced Cancers + CSA CANS',
    });
  }

  // 4. Acute Sleep Deprivation & Fatigue
  const sleepAlert =
    activeScenario?.id === 'demo-sleep-fatigue' ||
    effectiveSleepHours < 6.0 ||
    effectiveSleepQuality <= 5 ||
    telemetry.fatigueScore >= 75;

  if (sleepAlert && activeScenario?.id !== 'demo-co2-headache' && activeScenario?.id !== 'demo-chest-discomfort') {
    assessments.push({
      id: 'corr-sleep-fatigue',
      severity: effectiveSleepHours < 5.0 || telemetry.fatigueScore >= 80 ? 'WARNING' : 'ADVISORY',
      title: 'Acute Sleep Deprivation & Circadian Fatigue',
      whatWasDetected: `Check-in logged ${effectiveSleepHours}h sleep (quality ${effectiveSleepQuality}/10) alongside a simulated fatigue index of ${telemetry.fatigueScore}/100.`,
      contributingData: [
        {
          label: 'Logged Sleep Duration',
          value: `${effectiveSleepHours} hrs`,
          isAbnormal: effectiveSleepHours < 6.5,
        },
        {
          label: 'Sleep Quality Score',
          value: `${effectiveSleepQuality}/10`,
          isAbnormal: effectiveSleepQuality <= 6,
        },
        {
          label: 'Simulated Fatigue Index',
          value: `${telemetry.fatigueScore}/100`,
          isAbnormal: telemetry.fatigueScore >= 65,
        },
        {
          label: 'HRV Recovery Reserve',
          value: `${telemetry.hrvRmssd} ms`,
          isAbnormal: telemetry.hrvRmssd < 35,
        },
      ],
      whyItMatters:
        'Spacecraft experience 16 orbital sunrises daily or shifting Mars transit schedules. Severe sleep loss slows reaction speed, reduces attention on critical checklists, and raises isolation stress.',
      recommendedSteps: [
        'Defer complex airlock, EVA, or high-precision tasks until after a protected recovery rest block.',
        'Schedule 30 minutes of bright morning blue-spectrum circadian lighting and switch LEDs to warm amber 60 minutes before sleep.',
        'Check sleeping-sack ventilation airflow and reduce cabin acoustic noise where possible.',
        'Non-diagnostic guidance: Log a follow-up check-in after your next rest cycle and share shift workload with crew.',
      ],
      targetRegionId: 'head_brain',
      hazardCategory: 'Isolation & Confinement · NASA HRP Inadequate Sleep',
    });
  }

  // 5. Cabin Decompression / Hypoxia Check
  if (
    activeScenario?.id === 'scenario-decompression' ||
    activeScenario?.id === 'osdr-630-test' ||
    cabin.ambientPressure < 85 ||
    telemetry.spo2 < 92
  ) {
    assessments.push({
      id: 'corr-hypoxia-pressure',
      severity: 'CRITICAL',
      title: 'Cabin Pressure & Blood Oxygen Alert',
      whatWasDetected: `Simulated cabin pressure dropped to ${cabin.ambientPressure.toFixed(
        1
      )} kPa with SpO₂ at ${telemetry.spo2}%.`,
      contributingData: [
        {
          label: 'Simulated Cabin Pressure',
          value: `${cabin.ambientPressure.toFixed(1)} kPa`,
          isAbnormal: cabin.ambientPressure < 90,
        },
        {
          label: 'Simulated SpO₂',
          value: `${telemetry.spo2}%`,
          isAbnormal: telemetry.spo2 < 95,
        },
        {
          label: 'Cabin O₂ Fraction',
          value: `${cabin.o2Fraction.toFixed(1)}%`,
          isAbnormal: cabin.o2Fraction < 19.5,
        },
      ],
      whyItMatters:
        'Lower habitat pressure reduces oxygen transfer in the lungs and increases the risk of nitrogen gas bubbles (decompression sickness) and rapid hypoxia.',
      recommendedSteps: [
        'Put on an emergency 100% oxygen mask immediately and confirm steady airflow.',
        'Inspect module hatch seals and isolate any leaking compartment per emergency checklist.',
        'Recheck fingertip SpO₂ after 30 seconds of calm breathing.',
        'Non-diagnostic guidance: Remain on oxygen until cabin pressure stabilizes and Flight Surgeons confirm air safety.',
      ],
      targetRegionId: 'lungs_respiratory',
      hazardCategory: 'Hostile/Closed Environments · Risk of Hypoxia & Decompression',
    });
  }

  // 6. Spine / Back / Musculoskeletal or EVA Readiness Advisory (when no higher-severity duplicate)
  if (
    assessments.length === 0 &&
    (effectivePainAreas.some((a) => /spine|lumbar|back|leg|joint|shoulder/i.test(a)) ||
      evaMode ||
      /anxious|stress|overwhelmed|isolation/i.test(effectiveMood))
  ) {
    const isMusculoskeletal = effectivePainAreas.some((a) =>
      /spine|lumbar|back|leg|joint|shoulder/i.test(a)
    );
    assessments.push({
      id: 'corr-general-advisory',
      severity: 'ADVISORY',
      title: isMusculoskeletal
        ? 'Microgravity Musculoskeletal Load Advisory'
        : evaMode
        ? 'Pre/Post-EVA Spacewalk Readiness Active'
        : 'Isolation & Crew Wellbeing Check',
      whatWasDetected: isMusculoskeletal
        ? `${effectivePainAreas.join(', ')} soreness (${effectivePainSeverity}/10) logged in crew self-check.`
        : evaMode
        ? `Pre/Post-EVA Readiness mode active at ${cabin.ambientPressure.toFixed(1)} kPa cabin pressure.`
        : `Crew mood/stress check-in noted heightened confinement strain.`,
      contributingData: [
        {
          label: 'Reported Pain Zones',
          value: effectivePainAreas.length > 0 ? effectivePainAreas.join(', ') : 'None',
          isAbnormal: effectivePainAreas.length > 0,
        },
        {
          label: 'Sleep Logged',
          value: `${effectiveSleepHours}h (${effectiveSleepQuality}/10)`,
          isAbnormal: effectiveSleepQuality < 6,
        },
        {
          label: 'Cabin Pressure / CO₂',
          value: `${cabin.ambientPressure.toFixed(1)} kPa · ${cabin.ambientCO2.toFixed(1)} mmHg`,
          isAbnormal: false,
        },
      ],
      whyItMatters:
        'Removing Earth’s gravity lengthens spinal discs, reduces muscle/bone loading, and alters suit joint ergonomics during EVAs.',
      recommendedSteps: [
        'Perform 15 minutes of gentle knees-to-chest decompression stretching and scheduled ARED resistance exercises.',
        'Drink at least 500 mL of electrolyte water prior to intense tasks or EVA pre-breathe.',
        'Non-diagnostic guidance: Log any worsening ache or tingling before starting heavy suit work.',
      ],
      targetRegionId: isMusculoskeletal ? 'spine_lumbar' : 'shoulders_joints',
      hazardCategory: 'Altered Gravity Fields · NASA HRP Musculoskeletal & EVA Readiness',
    });
  }

  return assessments;
}
