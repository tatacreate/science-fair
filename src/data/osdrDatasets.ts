import { CabinEnvironment, SimulationScenario, TelemetryState } from '../types/heliomed';
import { HabitatEnvironmentId } from './habitatEnvironments';

export interface OsdrBiomarkerPoint {
  indicatorName: string;
  unit: string;
  earthBaseline: number;
  flightObserved: number;
  safeLimitLabel: string;
  status: 'NORMAL' | 'WATCH' | 'ALERT';
  plainMeaning: string;
}

export interface OsdrStudyDataset {
  studyId: string;
  title: string;
  missionContext: string;
  cohortLabel: string;
  environmentId: HabitatEnvironmentId;
  targetRegionId: string;
  chartTargetIndicator?: 'glucose' | 'onsd' | 'urine_sg';
  chartSampleValue?: number;
  plainEnglishFinding: string;
  whyAstronautsCare: string;
  biomarkers: OsdrBiomarkerPoint[];
  testScenario: SimulationScenario;
  vitalsOverride: Partial<TelemetryState>;
  cabinOverride: Partial<CabinEnvironment>;
}

export const NASA_OSDR_DATASETS: OsdrStudyDataset[] = [
  {
    studyId: 'OSD-511',
    title: 'Inspiration4 Short-Duration Commercial Flight Multi-Omics',
    missionContext: '3-day orbital flight (585 km high-altitude orbit) · 4 civilian crew',
    cohortLabel: 'NASA OSDR Civilian Spaceflight Cohort',
    environmentId: 'spacecraft',
    targetRegionId: 'abdomen_renal',
    chartTargetIndicator: 'glucose',
    chartSampleValue: 136,
    plainEnglishFinding:
      'Even on a 3-day flight with no doctors aboard, stress hormones and zero-gravity fluid shifts temporarily raised blood sugar, spiked resting heart rate, and stressed immune cells.',
    whyAstronautsCare:
      'Shows that metabolic and dehydration stress start on Day 1—making quick finger-prick blood sugar and hydration checks essential early in every flight.',
    biomarkers: [
      {
        indicatorName: 'Fasting Blood Glucose',
        unit: 'mg/dL',
        earthBaseline: 88,
        flightObserved: 136,
        safeLimitLabel: '70–110',
        status: 'WATCH',
        plainMeaning: 'Stress & zero-G temporarily reduce insulin sensitivity.',
      },
      {
        indicatorName: 'Resting Heart Rate',
        unit: 'bpm',
        earthBaseline: 68,
        flightObserved: 96,
        safeLimitLabel: '60–95',
        status: 'WATCH',
        plainMeaning: 'Heart beats faster while adapting to headward blood shift.',
      },
      {
        indicatorName: 'Urine Concentration (SG)',
        unit: 'SG',
        earthBaseline: 1.012,
        flightObserved: 1.023,
        safeLimitLabel: '< 1.018',
        status: 'WATCH',
        plainMeaning: 'Lower thirst in space quickly concentrates urine.',
      },
    ],
    testScenario: {
      id: 'osdr-511-test',
      name: 'OSDR-511 Replay: Early Flight Metabolic & Hydration Drift',
      category: 'acute_cardiac_fatigue',
      severity: 'ADVISORY',
      description:
        'Loaded from NASA OSDR OSD-511: Simulates Day-3 orbital insulin drift, elevated heart rate (96 bpm), and mild dehydration.',
      clinicalSigns: 'Elevated blood sugar (136 mg/dL), mild thirst suppression, resting HR 96 bpm.',
      cabinModifiers: {
        ambientCO2: 2.9,
        ambientPressure: 101.3,
        speRadiationFlux: 5.1,
      },
      vitalsModifiers: {
        heartRate: 96,
        hrvRmssd: 38,
        spo2: 98,
        systolicBp: 128,
        diastolicBp: 82,
        fatigueScore: 54,
        radiationDoseRate: 4.1,
      },
      countermeasures: [
        'Drink 500 mL water with electrolyte tablets over the next 45 minutes',
        'Perform 20 minutes of light stationary cycling to bring blood sugar down naturally',
        'Re-test Urine Specific Gravity before sleeping',
      ],
      scientificMechanism:
        'OSDR OSD-511 documented rapid hepatic glycogen mobilization and plasma volume contraction during initial 72h orbital adaptation.',
    },
    vitalsOverride: {
      heartRate: 96,
      hrvRmssd: 38,
      spo2: 98,
      systolicBp: 128,
      diastolicBp: 82,
      fatigueScore: 54,
      radiationDoseRate: 4.1,
    },
    cabinOverride: {
      ambientCO2: 2.9,
      ambientPressure: 101.3,
    },
  },
  {
    studyId: 'OSD-484',
    title: 'Long-Duration Orbital Fluid Shift & Ocular Nerve Strain',
    missionContext: '180–340 day orbital station mission · Headward pressure cohort',
    cohortLabel: 'NASA Twins / HRP SANS Benchmark',
    environmentId: 'space_station',
    targetRegionId: 'eyes_ocular',
    chartTargetIndicator: 'onsd',
    chartSampleValue: 5.9,
    plainEnglishFinding:
      'Months of floating push extra fluid into the skull, widening the sheath behind the eye (ONSD) and flattening the eyeball—causing blurry close-up reading.',
    whyAstronautsCare:
      'Using the handheld ultrasound caliper every week catches eye nerve swelling before permanent vision loss occurs.',
    biomarkers: [
      {
        indicatorName: 'Optic Nerve Sheath (ONSD)',
        unit: 'mm',
        earthBaseline: 4.2,
        flightObserved: 5.9,
        safeLimitLabel: '< 5.0 mm',
        status: 'ALERT',
        plainMeaning: 'Fluid pressure has widened the nerve cushion behind the eye.',
      },
      {
        indicatorName: 'Eye Fluid Pressure (IOP)',
        unit: 'mmHg',
        earthBaseline: 14,
        flightObserved: 22,
        safeLimitLabel: '10–20',
        status: 'WATCH',
        plainMeaning: 'Mild upward shift in internal eye pressure.',
      },
      {
        indicatorName: 'Ambient Station CO2',
        unit: 'mmHg',
        earthBaseline: 0.3,
        flightObserved: 4.1,
        safeLimitLabel: '< 3.0',
        status: 'WATCH',
        plainMeaning: 'Elevated cabin CO2 widens brain blood vessels and worsens eye swelling.',
      },
    ],
    testScenario: {
      id: 'osdr-484-test',
      name: 'OSDR-484 Replay: Spaceflight Ocular Nerve Swelling (SANS)',
      category: 'hypercapnia',
      severity: 'WARNING',
      description:
        'Loaded from NASA OSDR OSD-484: Simulates chronic headward fluid shift (ONSD 5.9 mm) compounded by 4.1 mmHg cabin CO2.',
      clinicalSigns: 'Blurry near text, puffy facial fullness, ONSD widened to 5.9 mm, mild dull frontal headache.',
      cabinModifiers: {
        ambientCO2: 4.1,
        ambientPressure: 101.3,
      },
      vitalsModifiers: {
        heartRate: 84,
        hrvRmssd: 41,
        spo2: 97,
        systolicBp: 134,
        diastolicBp: 84,
        fatigueScore: 62,
      },
      countermeasures: [
        'Complete 45 minutes of Lower Body Negative Pressure (LBNP) suction pants to pull fluid back down toward your legs',
        'Aim sleeping-rack circulation fan straight across your face to clear CO2 pocket',
        'Re-measure ONSD with closed-eyelid ultrasound and queue scan packet to Earth Flight Surgeons',
      ],
      scientificMechanism:
        'Absence of hydrostatic gradients shifts ~2L fluid cephalad, elevating intracranial venous compliance and expanding the retrobulbar subarachnoid space.',
    },
    vitalsOverride: {
      heartRate: 84,
      hrvRmssd: 41,
      spo2: 97,
      systolicBp: 134,
      diastolicBp: 84,
      fatigueScore: 62,
    },
    cabinOverride: {
      ambientCO2: 4.1,
      ambientPressure: 101.3,
    },
  },
  {
    studyId: 'OSD-352',
    title: 'Deep-Space High-LET Cosmic Radiation & Oxidative Stress Study',
    missionContext: 'Simulated Deep-Space SPE / GCR Transit Profile',
    cohortLabel: 'NASA OSDR Space Radiation Biology',
    environmentId: 'spacecraft',
    targetRegionId: 'head_brain',
    plainEnglishFinding:
      'High-energy cosmic rays and solar flare protons damage cell DNA and deplete natural antioxidants unless crew shelter inside water-lined spacecraft walls.',
    whyAstronautsCare:
      'Explains why moving immediately to the storm shelter and taking antioxidant supplements when dosimeters spike prevents radiation sickness.',
    biomarkers: [
      {
        indicatorName: 'Radiation Dose Rate',
        unit: 'µSv/h',
        earthBaseline: 0.12,
        flightObserved: 340,
        safeLimitLabel: '< 15 µSv/h',
        status: 'ALERT',
        plainMeaning: 'Solar proton wave hitting outer hull—shelter required now.',
      },
      {
        indicatorName: 'Heart Rate Variability (HRV)',
        unit: 'ms',
        earthBaseline: 64,
        flightObserved: 26,
        safeLimitLabel: '> 40 ms',
        status: 'ALERT',
        plainMeaning: 'Body shows acute autonomic stress under storm alert.',
      },
      {
        indicatorName: 'Heart Rate',
        unit: 'bpm',
        earthBaseline: 70,
        flightObserved: 112,
        safeLimitLabel: '60–95',
        status: 'WATCH',
        plainMeaning: 'Adrenaline response during emergency sheltering.',
      },
    ],
    testScenario: {
      id: 'osdr-352-test',
      name: 'OSDR-352 Replay: Deep-Space Solar Proton Radiation Spike',
      category: 'radiation_spike',
      severity: 'CRITICAL',
      description:
        'Loaded from NASA OSDR OSD-352: Simulates solar particle event surging cabin radiation to 340 µSv/h outside Earth magnetosphere.',
      clinicalSigns: 'Dosimeter red alarm, acute stress tachycardia (112 bpm), mild nausea warning.',
      cabinModifiers: {
        speRadiationFlux: 6800,
      },
      vitalsModifiers: {
        radiationDoseRate: 340,
        heartRate: 112,
        hrvRmssd: 26,
        fatigueScore: 71,
      },
      countermeasures: [
        'Move immediately into the central water-wall storm shelter core',
        'Take 1 dose of onboard antioxidant protection pack (Vitamin C + N-acetylcysteine)',
        'Orient spacecraft water/fuel tanks toward the solar direction until flux drops below 15 µSv/h',
      ],
      scientificMechanism:
        'High-energy protons generate reactive oxygen species and clustered DNA double-strand breaks in radiosensitive hematopoietic and endothelial tissues.',
    },
    vitalsOverride: {
      radiationDoseRate: 340,
      heartRate: 112,
      hrvRmssd: 26,
      fatigueScore: 71,
    },
    cabinOverride: {
      speRadiationFlux: 6800,
    },
  },
  {
    studyId: 'OSD-630',
    title: 'Lunar Regolith Dust Airway & Oxygen Transfer Response',
    missionContext: 'Planetary Surface Airlock & EVA Dust Exposure Model',
    cohortLabel: 'NASA OSDR Planetary Surface Toxicology',
    environmentId: 'planetary_base',
    targetRegionId: 'lungs_respiratory',
    plainEnglishFinding:
      'Unlike rounded Earth sand, Moon dust is made of tiny jagged glass shards that scratch lung airways and block oxygen from entering the bloodstream.',
    whyAstronautsCare:
      'If dust enters the Moon base or rover, watching your finger oxygen meter (SpO2) and breathing rate tells you immediately if you need pure oxygen and HEPA air scrubbing.',
    biomarkers: [
      {
        indicatorName: 'Blood Oxygen (SpO2)',
        unit: '%',
        earthBaseline: 98,
        flightObserved: 90,
        safeLimitLabel: '95–100%',
        status: 'ALERT',
        plainMeaning: 'Airway irritation is lowering oxygen reaching your blood.',
      },
      {
        indicatorName: 'Breathing Rate',
        unit: 'br/min',
        earthBaseline: 15,
        flightObserved: 24,
        safeLimitLabel: '12–20',
        status: 'ALERT',
        plainMeaning: 'Breathing faster to compensate for dusty cabin air.',
      },
      {
        indicatorName: 'Habitat Pressure',
        unit: 'kPa',
        earthBaseline: 101.3,
        flightObserved: 56.5,
        safeLimitLabel: '56.5–101',
        status: 'NORMAL',
        plainMeaning: 'Standard exploration atmosphere for surface habitat.',
      },
    ],
    testScenario: {
      id: 'osdr-630-test',
      name: 'OSDR-630 Replay: Regolith Dust Airway Irritation & Hypoxia',
      category: 'decompression_alert',
      severity: 'CRITICAL',
      description:
        'Loaded from NASA OSDR OSD-630: Simulates post-EVA lunar dust inhalation dropping SpO2 to 90% and raising breathing rate to 24 br/min.',
      clinicalSigns: 'Dry raspy cough, gritty eyes, SpO2 90%, breathing rate 24 br/min.',
      cabinModifiers: {
        ambientPressure: 56.5,
        o2Fraction: 20.1,
      },
      vitalsModifiers: {
        spo2: 90,
        respiratoryRate: 24,
        heartRate: 106,
        hrvRmssd: 28,
        fatigueScore: 76,
      },
      countermeasures: [
        'Put on clean P100 particulate respirator or positive-pressure 100% O2 mask immediately',
        'Flush eyes and nostrils gently with sterile saline eyewash station',
        'Set base HEPA air scrubbers to MAX and vacuum EVA suit outer layer before removing hood',
      ],
      scientificMechanism:
        'Sharp silicate regolith particulates trigger acute alveolar macrophage activation, bronchospasm, and impaired alveolar-capillary O2 diffusion.',
    },
    vitalsOverride: {
      spo2: 90,
      respiratoryRate: 24,
      heartRate: 106,
      hrvRmssd: 28,
      fatigueScore: 76,
    },
    cabinOverride: {
      ambientPressure: 56.5,
      o2Fraction: 20.1,
    },
  },
  {
    studyId: 'OSD-102',
    title: 'Musculoskeletal Unloading & Bone-Calcium Kidney Risk',
    missionContext: 'Unloaded Spine & Lower Limb Muscle Atrophy Benchmark',
    cohortLabel: 'NASA OSDR Musculoskeletal Repository',
    environmentId: 'rover',
    targetRegionId: 'spine_lumbar',
    chartTargetIndicator: 'urine_sg',
    chartSampleValue: 1.028,
    plainEnglishFinding:
      'When legs and spine stop carrying your weight, bones shed calcium into your blood and urine—weakening muscles and sharply raising kidney stone risk.',
    whyAstronautsCare:
      'Combines daily resistance workouts with urine dipstick checks so a painful kidney stone never grounds a mission.',
    biomarkers: [
      {
        indicatorName: 'Urine Specific Gravity',
        unit: 'SG',
        earthBaseline: 1.012,
        flightObserved: 1.028,
        safeLimitLabel: '< 1.018',
        status: 'ALERT',
        plainMeaning: 'Urine is heavily concentrated with bone calcium—high stone risk.',
      },
      {
        indicatorName: 'Systolic Blood Pressure',
        unit: 'mmHg',
        earthBaseline: 118,
        flightObserved: 92,
        safeLimitLabel: '95–128',
        status: 'WATCH',
        plainMeaning: 'Fluid depletion makes blood pressure dip when standing.',
      },
      {
        indicatorName: 'Fatigue Index',
        unit: '/100',
        earthBaseline: 22,
        flightObserved: 74,
        safeLimitLabel: '< 50',
        status: 'WATCH',
        plainMeaning: 'Muscle deconditioning plus dehydration amplifies exhaustion.',
      },
    ],
    testScenario: {
      id: 'osdr-102-test',
      name: 'OSDR-102 Replay: Dehydration, Bone Calcium Loss & Orthostatic Dip',
      category: 'acute_cardiac_fatigue',
      severity: 'WARNING',
      description:
        'Loaded from NASA OSDR OSD-102: Simulates unloading-driven dehydration (Urine SG 1.028) and borderline low standing BP (92/60 mmHg).',
      clinicalSigns: 'Lower back tightness, dark concentrated urine (1.028), dizzy when standing, fatigue 74/100.',
      cabinModifiers: {
        ambientCO2: 3.1,
        ambientPressure: 82.5,
      },
      vitalsModifiers: {
        heartRate: 98,
        systolicBp: 92,
        diastolicBp: 60,
        hrvRmssd: 30,
        fatigueScore: 74,
      },
      countermeasures: [
        'Drink 750 mL oral electrolyte solution immediately (slow steady sips over 20 minutes)',
        'Take prescribed potassium-citrate tablet to keep calcium dissolved and prevent kidney stones',
        'Perform 15 minutes of gentle knees-to-chest lumbar decompression stretches',
      ],
      scientificMechanism:
        'Mechanical unloading accelerates osteoclastic bone resorption and hypercalciuria while plasma volume contraction lowers orthostatic tolerance.',
    },
    vitalsOverride: {
      heartRate: 98,
      systolicBp: 92,
      diastolicBp: 60,
      hrvRmssd: 30,
      fatigueScore: 74,
    },
    cabinOverride: {
      ambientCO2: 3.1,
      ambientPressure: 82.5,
    },
  },
];
