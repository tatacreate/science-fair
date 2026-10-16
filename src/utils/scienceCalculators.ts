/**
 * HelioMed Spaceflight Bioscience Calculators
 * Grounded in NASA Human Research Program (HRP) and Aerospace Medicine Standards
 */

// 1. Alveolar Gas Equation (Spaceflight Habitat Adaptation)
// PAO2 = (PB - 47) * FiO2 - (PACO2 / R)
export function calculateAlveolarOxygen(
  ambientPressureKPa: number,
  o2FractionPercent: number,
  ambientCO2mmHg: number,
  respiratoryExchangeRatio = 0.8
): { pao2mmHg: number; status: 'NORMAL' | 'MILD_HYPOXIA' | 'SEVERE_HYPOXIA' } {
  // Convert kPa to mmHg (1 kPa = 7.50062 mmHg)
  const pbMmHg = ambientPressureKPa * 7.50062;
  const waterVaporPressure = 47.0; // Body temperature (37C) saturated water vapor pressure
  const fio2 = o2FractionPercent / 100;
  // In enclosed habitats with high CO2, PACO2 rises with ambient CO2
  const estimatedPaco2 = Math.max(38, 38 + (ambientCO2mmHg - 2.5) * 1.4);

  const pao2 = (pbMmHg - waterVaporPressure) * fio2 - estimatedPaco2 / respiratoryExchangeRatio;
  const rounded = Math.round(pao2 * 10) / 10;

  let status: 'NORMAL' | 'MILD_HYPOXIA' | 'SEVERE_HYPOXIA' = 'NORMAL';
  if (rounded < 60) status = 'SEVERE_HYPOXIA';
  else if (rounded < 80) status = 'MILD_HYPOXIA';

  return { pao2mmHg: rounded, status };
}

// 2. Space Radiation Dosimetry & Biomarker Kinetics
// Equivalent Dose: H (mSv) = D (mGy) * Q (Radiation Quality Factor for GCR/SPE protons & HZE ions)
export function calculateRadiationBiologicalImpact(
  doseRateUSvPerHour: number,
  cumulativeDoseMsv: number,
  evaHours = 0
): {
  projected30DayMsv: number;
  chromosomalDsbScore: number; // 0-100 index of DNA double-strand break repair demand
  careerLimitPercentage: number; // NASA 600 mSv career limit
  clinicalRiskTier: 'SAFE' | 'ELEVATED' | 'HAZARDOUS' | 'ACUTE_CRISIS';
} {
  const projectedDailyMsv = (doseRateUSvPerHour * 24) / 1000;
  const projected30DayMsv = Math.round((cumulativeDoseMsv + projectedDailyMsv * 30) * 10) / 10;

  // NASA career safety threshold (typically 600 mSv depending on age/sex)
  const careerLimitPercentage = Math.min(100, Math.round((cumulativeDoseMsv / 600) * 100));

  // DNA double-strand break score estimate based on acute dose rate
  const chromosomalDsbScore = Math.min(100, Math.round(doseRateUSvPerHour / 4));

  let clinicalRiskTier: 'SAFE' | 'ELEVATED' | 'HAZARDOUS' | 'ACUTE_CRISIS' = 'SAFE';
  if (doseRateUSvPerHour > 250) {
    clinicalRiskTier = 'ACUTE_CRISIS'; // SPE Storm Event
  } else if (doseRateUSvPerHour > 50) {
    clinicalRiskTier = 'HAZARDOUS';
  } else if (doseRateUSvPerHour > 15) {
    clinicalRiskTier = 'ELEVATED';
  }

  return {
    projected30DayMsv,
    chromosomalDsbScore,
    careerLimitPercentage,
    clinicalRiskTier,
  };
}

// 3. Hypercapnia Cerebral Vasodilation & Microgravity ICP Index
// ISS research demonstrated astronauts develop hypercapnic headaches at lower PCO2 thresholds
export function calculateHypercapniaRisk(
  ambientCO2mmHg: number,
  hr: number,
  hrv: number
): {
  headacheRiskPercentage: number;
  cerebralVasodilationTier: 'NOMINAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  compensatoryTachycardia: boolean;
} {
  // Nominal ambient CO2 on Earth is ~0.3 mmHg. ISS nominal is ~2.0-3.0 mmHg. >4.5 mmHg triggers symptoms.
  const headacheRisk = Math.min(100, Math.max(0, Math.round(((ambientCO2mmHg - 1.5) / 5) * 100)));

  let tier: 'NOMINAL' | 'MILD' | 'MODERATE' | 'SEVERE' = 'NOMINAL';
  if (ambientCO2mmHg > 6.0) tier = 'SEVERE';
  else if (ambientCO2mmHg > 4.5) tier = 'MODERATE';
  else if (ambientCO2mmHg > 3.0) tier = 'MILD';

  // In hypercapnia, compensatory tachycardia manifests with drops in HRV
  const compensatoryTachycardia = hr > 95 && ambientCO2mmHg > 4.0;

  return {
    headacheRiskPercentage: headacheRisk,
    cerebralVasodilationTier: tier,
    compensatoryTachycardia,
  };
}

// 4. Microgravity Cardiovascular Deconditioning & Shock Index
export function calculateCardiovascularStrain(
  hr: number,
  systolicBp: number,
  hrvRmssd: number
): {
  shockIndex: number;
  orthostaticIntoleranceRisk: 'LOW' | 'MODERATE' | 'HIGH';
  autonomicVagalTone: 'DEPRESSED' | 'NORMAL' | 'HIGH';
} {
  const shockIndex = Math.round((hr / Math.max(60, systolicBp)) * 100) / 100;

  let orthostaticRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (shockIndex > 0.9 || hrvRmssd < 25) {
    orthostaticRisk = 'HIGH';
  } else if (shockIndex > 0.75 || hrvRmssd < 40) {
    orthostaticRisk = 'MODERATE';
  }

  let vagalTone: 'DEPRESSED' | 'NORMAL' | 'HIGH' = 'NORMAL';
  if (hrvRmssd < 30) vagalTone = 'DEPRESSED';
  else if (hrvRmssd > 75) vagalTone = 'HIGH';

  return {
    shockIndex,
    orthostaticIntoleranceRisk: orthostaticRisk,
    autonomicVagalTone: vagalTone,
  };
}
