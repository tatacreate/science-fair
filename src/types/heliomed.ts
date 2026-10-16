export type TriageLevel = 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';

export interface AstronautProfile {
  id: string;
  name: string;
  callsign: string;
  role: string;
  missionDay: number;
  status: TriageLevel;
  cumulativeRadiationDoseMsv: number;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  astronautName: string;
  date: string;
  sleepQuality: number; // 1 to 10
  sleepHours: number;
  mentalHealth: string;
  overallFeeling: string;
  hasPain: boolean;
  painAreas: string[];
  painSeverity: number; // 0 to 10
  painNotes: string;
  habitsToImprove: string[];
  habitsStrugglingWith: string[];
  aiFeedback?: string;
  createdAt: string;
}

export interface TelemetryState {
  timestamp: number;
  heartRate: number; // bpm (60-100 nominal)
  hrvRmssd: number; // ms (40-90 nominal)
  spo2: number; // % (95-100 nominal)
  coreTemp: number; // C (36.5 - 37.5 nominal)
  respiratoryRate: number; // breaths/min (12-20 nominal)
  radiationDoseRate: number; // uSv/h (0.8 - 5.0 nominal deep space background)
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  shockIndex: number; // HR / SBP
  fatigueScore: number; // 0-100
}

export interface CabinEnvironment {
  ambientCO2: number; // mmHg (Nominal < 3.0 mmHg, > 5.0 = toxic hypercapnia)
  ambientPressure: number; // kPa (Nominal 101.3 kPa, < 80 kPa = decompression risk)
  cabinTemp: number; // C (20-24 nominal)
  o2Fraction: number; // % (20.9 - 22.0)
  relativeHumidity: number; // % (40-60 nominal)
  speRadiationFlux: number; // Protons/cm2/s/sr
}

export interface MedicalNote {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  category: 'DAILY_CHECKIN' | 'SYMPTOM_LOG' | 'SELF_TREATMENT' | 'HABIT_TRACKER' | 'TRIAGE_MEMO';
  createdAt: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: 'hypercapnia' | 'radiation_spike' | 'acute_cardiac_fatigue' | 'decompression_alert';
  severity: TriageLevel;
  description: string;
  clinicalSigns: string;
  cabinModifiers: Partial<CabinEnvironment>;
  vitalsModifiers: Partial<TelemetryState>;
  countermeasures: string[];
  scientificMechanism: string;
}
