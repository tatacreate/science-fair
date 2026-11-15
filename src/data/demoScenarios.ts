import { SimulationScenario } from '../types/heliomed';

export const DEMO_EMERGENCY_SCENARIOS: SimulationScenario[] = [
  {
    id: 'demo-co2-headache',
    name: 'Elevated Cabin CO₂ + Headache',
    shortLabel: 'Elevated Cabin CO₂ + Headache',
    category: 'hypercapnia',
    severity: 'WARNING',
    targetRegionId: 'head_brain',
    description:
      'Simulated CO₂ scrubber saturation pushes cabin CO₂ to 0.8% (6.1 mmHg) while crew check-in logs a frontal headache.',
    clinicalSigns:
      'Frontal headache (6/10) paired with simulated CO₂ at 0.8% (6.1 mmHg), SpO₂ 95%, and heart rate 104 bpm.',
    cabinModifiers: {
      ambientCO2: 6.1, // ~0.8% of 760 mmHg sea-level equivalent
      ambientPressure: 100.6,
      cabinTemp: 23.6,
      o2Fraction: 20.6,
      speRadiationFlux: 4.4,
    },
    vitalsModifiers: {
      heartRate: 104,
      hrvRmssd: 24,
      spo2: 95,
      respiratoryRate: 24,
      systolicBp: 134,
      diastolicBp: 86,
      radiationDoseRate: 2.3,
      fatigueScore: 74,
    },
    simulatedCheckinOverlay: {
      sleepQuality: 6,
      sleepHours: 6.2,
      mentalHealth: 'Brain fog and mild irritability near sleep rack',
      overallFeeling: 'Throbbing frontal headache and sluggish concentration',
      painAreas: ['Head'],
      painSeverity: 6,
      hydrationLiters: 1.9,
    },
    countermeasures: [
      'Move immediately to an open central cabin aisle with active airflow',
      'Set ECLSS ventilation fans to 100% to break up microgravity CO₂ pockets',
      'Inspect and rotate the primary LiOH / amine CO₂ scrubber canister',
      'Hydrate with 350–500 mL electrolyte water and re-check CO₂ gauge in 10 minutes',
    ],
    scientificMechanism:
      'In weightlessness, exhaled carbon dioxide pools around the face without natural convection. Elevated ambient CO₂ widens brain blood vessels, commonly triggering headaches and cognitive slowing.',
  },
  {
    id: 'demo-chest-discomfort',
    name: 'Sudden Chest Discomfort',
    shortLabel: 'Sudden Chest Discomfort',
    category: 'acute_cardiac_fatigue',
    severity: 'CRITICAL',
    targetRegionId: 'heart_cardio',
    description:
      'Crew member logs acute chest tightness after vigorous exercise while simulated telemetry detects elevated HR (118 bpm) and HRV drop.',
    clinicalSigns:
      'Chest discomfort (7/10), resting heart rate 118 bpm, HRV 19 ms, SpO₂ 94%, systolic pressure 142 mmHg.',
    cabinModifiers: {
      ambientCO2: 2.7,
      ambientPressure: 101.1,
      cabinTemp: 22.1,
      o2Fraction: 21.1,
      speRadiationFlux: 4.1,
    },
    vitalsModifiers: {
      heartRate: 118,
      hrvRmssd: 19,
      spo2: 94,
      respiratoryRate: 23,
      systolicBp: 142,
      diastolicBp: 90,
      radiationDoseRate: 2.1,
      fatigueScore: 79,
    },
    simulatedCheckinOverlay: {
      sleepQuality: 6,
      sleepHours: 6.0,
      mentalHealth: 'Anxious about sudden chest tightness',
      overallFeeling: 'Sudden chest discomfort and racing pulse while resting',
      painAreas: ['Chest / Heart Rate Spike'],
      painSeverity: 7,
      hydrationLiters: 1.7,
    },
    countermeasures: [
      'Stop physical exertion immediately and rest strapped upright or semi-reclined',
      'Attach fingertip pulse oximeter and 12-lead ECG patch for continuous recording',
      'Verify cabin oxygen fraction (21%+) and take slow, steady 4-second breaths',
      'Transmit stored vitals packet immediately for Flight Surgeon review and keep emergency O₂ kit within reach',
    ],
    scientificMechanism:
      'Microgravity alters blood volume distribution and heart workload; sudden chest tightness paired with rapid pulse and low HRV requires immediate rest and ground Flight Surgeon review.',
  },
  {
    id: 'demo-solar-radiation',
    name: 'Solar Radiation Spike Alert',
    shortLabel: 'Solar Radiation Spike Alert',
    category: 'radiation_spike',
    severity: 'CRITICAL',
    targetRegionId: 'head_brain',
    description:
      'Simulated solar particle event (SPE) triggers a sharp CANS neutron & total radiation flux spike to 380 µSv/h outside Earth’s magnetosphere.',
    clinicalSigns:
      'Simulated dosimeter surge at 380 µSv/h (~114 µSv/h neutron component), acute stress response (HR 110 bpm), mild nausea.',
    cabinModifiers: {
      ambientCO2: 2.4,
      ambientPressure: 101.3,
      cabinTemp: 21.9,
      o2Fraction: 21.2,
      speRadiationFlux: 7600,
    },
    vitalsModifiers: {
      radiationDoseRate: 380,
      heartRate: 110,
      hrvRmssd: 28,
      spo2: 98,
      respiratoryRate: 19,
      systolicBp: 130,
      diastolicBp: 82,
      fatigueScore: 68,
    },
    simulatedCheckinOverlay: {
      sleepQuality: 7,
      sleepHours: 6.8,
      mentalHealth: 'Heightened alert from Solar Particle Event warning',
      overallFeeling: 'Mild queasiness and stress during storm shelter transition',
      painAreas: ['Head'],
      painSeverity: 4,
      hydrationLiters: 2.2,
    },
    countermeasures: [
      'Relocate immediately into the high-mass water-wall storm shelter core',
      'Verify spacecraft propulsion & water tanks are oriented sunward for mass shielding',
      'Log continuous CANS neutron spectrometer and personal dosimeter readings',
      'Hydrate and take daily crew antioxidant protection pack per mission guidelines',
    ],
    scientificMechanism:
      'High-energy solar protons and secondary neutrons (~30% of space dose) penetrate standard hull aluminum, increasing DNA damage risk unless shielded by hydrogen-rich water walls.',
  },
  {
    id: 'demo-sleep-fatigue',
    name: 'Acute Sleep Deprivation & Fatigue',
    shortLabel: 'Acute Sleep Deprivation & Fatigue',
    category: 'sleep_fatigue',
    severity: 'WARNING',
    targetRegionId: 'head_brain',
    description:
      'Multiple fragmented rest cycles yield 3.8h sleep (quality 3/10), driving fatigue score to 86/100 and elevated cognitive error risk.',
    clinicalSigns:
      '3.8 hours sleep logged (3/10 quality), fatigue index 86/100, HRV reduced to 26 ms, reduced focus and isolation stress.',
    cabinModifiers: {
      ambientCO2: 2.9,
      ambientPressure: 101.2,
      cabinTemp: 22.8,
      o2Fraction: 21.1,
      speRadiationFlux: 4.2,
    },
    vitalsModifiers: {
      heartRate: 94,
      hrvRmssd: 26,
      spo2: 97,
      respiratoryRate: 17,
      systolicBp: 126,
      diastolicBp: 80,
      radiationDoseRate: 2.2,
      fatigueScore: 86,
    },
    simulatedCheckinOverlay: {
      sleepQuality: 3,
      sleepHours: 3.8,
      mentalHealth: 'Overwhelmed and fatigued after repeated orbital shift disruptions',
      overallFeeling: 'Heavy eyelids, slowed reaction speed, and confinement exhaustion',
      painAreas: ['Head', 'Neck'],
      painSeverity: 4,
      hydrationLiters: 1.8,
    },
    countermeasures: [
      'Postpone non-essential high-precision or EVA tasks until restorative rest is completed',
      'Run 30 minutes of timed circadian blue-spectrum light therapy upon waking',
      'Switch cabin LEDs to warm amber 60 minutes prior to the next scheduled sleep block',
      'Drink 500 mL water, complete a brief crew workload handoff, and notify Flight Surgeons on next sync',
    ],
    scientificMechanism:
      'Without Earth’s 24-hour light/dark cycle, circadian drift and sleep loss impair reaction speed, situational awareness, and emotional resilience.',
  },
];
