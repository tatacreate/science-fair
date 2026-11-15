import { CabinEnvironment, DailyCheckin, TelemetryState } from '../types/heliomed';
import { HabitatEnvironmentId } from './habitatEnvironments';

export type NasaHazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'environment';

export type HazardColorStatus = 'GREEN' | 'AMBER' | 'RED';

export interface NasaHazardStatus {
  id: NasaHazardId;
  title: string;
  shortTitle: string;
  status: HazardColorStatus;
  statusLabel: string;
  liveMetric: string;
  whatItIs: string;
  crewImpact: string;
  countermeasure: string;
  linkedActionLabel: string;
  linkedRegionId?: string;
}

export interface SmartHazardTag {
  hazardId: NasaHazardId;
  tagLabel: string;
  status: HazardColorStatus;
  recommendation: string;
}

export interface HazardEvalInput {
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  cumulativeDoseMsv: number;
  latestCheckin: DailyCheckin | null;
  painAreas: string[];
  activeEnvId?: HabitatEnvironmentId;
  missionCode?: string;
  activeScenarioId?: string;
  marsTransitDelaySeconds?: number;
}

export function formatDelayClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function evaluateNasaFiveHazards(input: HazardEvalInput): NasaHazardStatus[] {
  const {
    telemetry,
    cabin,
    cumulativeDoseMsv,
    latestCheckin,
    painAreas,
    activeEnvId = 'spacecraft',
    missionCode = 'ARTEMIS-II',
    activeScenarioId,
    marsTransitDelaySeconds = 1214, // 20m 14s Mars Transit Delay default
  } = input;

  const doseRate = telemetry.radiationDoseRate || 2.1;
  const co2 = cabin.ambientCO2 || 2.3;
  const pressure = cabin.ambientPressure || 101.3;
  const temp = cabin.cabinTemp || 21.8;
  const spo2 = telemetry.spo2 || 98;

  // 1. Space Radiation
  let radStatus: HazardColorStatus = 'GREEN';
  let radLabel = 'Nominal';
  if (doseRate > 50 || cumulativeDoseMsv > 300 || activeScenarioId === 'osdr-352-test' || activeScenarioId === 'scenario-radiation') {
    radStatus = 'RED';
    radLabel = 'Action Required';
  } else if (doseRate > 12 || cumulativeDoseMsv > 100) {
    radStatus = 'AMBER';
    radLabel = 'Elevated';
  }

  // 2. Isolation & Confinement
  const sleepQ = latestCheckin?.sleepQuality ?? 8;
  const sleepH = latestCheckin?.sleepHours ?? 7.0;
  const moodStr = `${latestCheckin?.mentalHealth || ''} ${latestCheckin?.overallFeeling || ''}`.toLowerCase();
  const strugglingIso = (latestCheckin?.habitsStrugglingWith || []).some((h) =>
    /sleep|missing|anxious|stress|focus/i.test(h)
  );
  let isoStatus: HazardColorStatus = 'GREEN';
  let isoLabel = 'Nominal';
  if (sleepQ <= 4 || sleepH < 5.5 || /anxious|overwhelmed|insomnia|depress/i.test(moodStr)) {
    isoStatus = 'RED';
    isoLabel = 'Action Required';
  } else if (sleepQ <= 6 || sleepH < 6.5 || strugglingIso || /isolation|fatigue|restless/i.test(moodStr)) {
    isoStatus = 'AMBER';
    isoLabel = 'Elevated';
  }

  // 3. Distance from Earth
  const isEarthOrbit = missionCode === 'ISS-EXP72' || missionCode === 'CREW-9';
  const delayDisplay =
    activeEnvId === 'space_station' && isEarthOrbit
      ? '0.5s LEO Link'
      : activeEnvId === 'planetary_base' && missionCode.includes('ARTEMIS')
      ? '1.3s Lunar Link'
      : `${formatDelayClock(marsTransitDelaySeconds)} Delay`;
  let distStatus: HazardColorStatus = isEarthOrbit ? 'GREEN' : 'AMBER';
  let distLabel = isEarthOrbit ? 'Near Earth' : 'Offline Mode Active';
  if (radStatus === 'RED' || activeScenarioId === 'scenario-decompression' || activeScenarioId === 'osdr-630-test') {
    distStatus = 'RED';
    distLabel = 'Offline SOS';
  }

  // 4. Altered Gravity Fields
  const gravityPainMatch = painAreas.some((a) =>
    /spine|lumbar|back|neck|leg|knee|joint|shoulder|eye/i.test(a)
  );
  const severeGravityPain = gravityPainMatch && (latestCheckin?.painSeverity ?? 0) >= 6;
  let gravStatus: HazardColorStatus = 'GREEN';
  let gravLabel = 'Nominal';
  if (
    severeGravityPain ||
    activeScenarioId === 'osdr-484-test' ||
    activeScenarioId === 'osdr-102-test'
  ) {
    gravStatus = 'RED';
    gravLabel = 'Action Required';
  } else if (gravityPainMatch || activeScenarioId === 'osdr-511-test') {
    gravStatus = 'AMBER';
    gravLabel = 'Elevated';
  }

  // 5. Hostile / Closed Environments
  const headPain = painAreas.some((a) => /head|brain|sinus/i.test(a));
  let envStatus: HazardColorStatus = 'GREEN';
  let envLabel = 'Nominal';
  if (
    co2 > 4.5 ||
    pressure < 54 ||
    spo2 < 92 ||
    activeScenarioId === 'scenario-decompression' ||
    activeScenarioId === 'scenario-hypercapnia' ||
    activeScenarioId === 'osdr-630-test'
  ) {
    envStatus = 'RED';
    envLabel = 'Action Required';
  } else if (co2 > 3.0 || temp > 25 || (headPain && co2 > 2.5)) {
    envStatus = 'AMBER';
    envLabel = 'Elevated';
  }

  return [
    {
      id: 'radiation',
      title: 'Space Radiation',
      shortTitle: 'Space Radiation',
      status: radStatus,
      statusLabel: radLabel,
      liveMetric: `${cumulativeDoseMsv.toFixed(1)} mSv · ${doseRate} µSv/h`,
      whatItIs:
        'Outside Earth’s magnetic shield, astronauts are exposed to high-energy cosmic rays and sudden solar particle flares.',
      crewImpact:
        'Cumulative exposure damages DNA and raises lifetime cancer, eye cataract, and acute radiation sickness risks.',
      countermeasure:
        radStatus === 'RED'
          ? 'Enter the water-wall storm shelter now, orient supply tanks sunward, and take your antioxidant protection pack.'
          : 'Monitor daily personal dosimeter totals, keep water packs along cabin walls, and stay clear of unshielded viewports during solar alerts.',
      linkedActionLabel: 'Open Radiation Monitor',
    },
    {
      id: 'isolation',
      title: 'Isolation & Confinement',
      shortTitle: 'Isolation & Confinement',
      status: isoStatus,
      statusLabel: isoLabel,
      liveMetric: `Sleep ${sleepQ}/10 (${sleepH}h)`,
      whatItIs:
        'Months inside cramped quarters without natural sunrise, changing seasons, or face-to-face contact with family strain mind and body.',
      crewImpact:
        'Irregular light/dark cues disrupt circadian sleep rhythms, spike stress hormones, and can lower team focus and morale.',
      countermeasure:
        isoStatus === 'GREEN'
          ? 'Maintain consistent sleeping-sack rest hours, morning bright blue-spectrum light exposure, and daily crew mood check-ins.'
          : 'Run a 30-minute morning circadian light therapy session, reduce pre-sleep screen glare, and schedule a team check-in.',
      linkedActionLabel: 'Update Sleep & Mood Check-In',
    },
    {
      id: 'distance',
      title: 'Distance from Earth',
      shortTitle: 'Distance from Earth',
      status: distStatus,
      statusLabel: distLabel,
      liveMetric: delayDisplay,
      whatItIs:
        'Deep-space crews travel millions of miles from Earth, creating up to 20+ minute one-way radio delays with zero emergency evacuation.',
      crewImpact:
        'Real-time conversation with Earth doctors is physically impossible—medical emergencies require instant onboard decisions.',
      countermeasure:
        'HelioMed runs 100% offline inside your spacecraft so triage checklists, 3D guides, and clinical warnings work immediately while queuing forms for Ground Doctors.',
      linkedActionLabel: 'View Emergency Offline Wizard',
    },
    {
      id: 'gravity',
      title: 'Altered Gravity Fields',
      shortTitle: 'Altered Gravity',
      status: gravStatus,
      statusLabel: gravLabel,
      liveMetric: gravityPainMatch ? 'Musculoskeletal Flag' : 'Body Adapting',
      whatItIs:
        'Weightlessness and partial gravity (Moon 0.16G, Mars 0.38G) remove Earth’s steady downward pull on bones, muscles, inner ear, and blood.',
      crewImpact:
        'Causes spine lengthening back pain, 1–1.5% bone calcium loss per month, balance disorientation, and headward eye pressure (SANS).',
      countermeasure:
        gravityPainMatch
          ? 'Perform 15 min knees-to-chest lumbar decompression stretches and complete today’s ARED resistance workout + hydration.'
          : 'Complete daily ARED resistive loading, drink 2.5L electrolyte water, and track weekly eye nerve ultrasound scans.',
      linkedActionLabel: 'Inspect Spine & Muscles on 3D',
      linkedRegionId: 'spine_lumbar',
    },
    {
      id: 'environment',
      title: 'Hostile / Closed Environments',
      shortTitle: 'Closed Environments',
      status: envStatus,
      statusLabel: envLabel,
      liveMetric: `CO₂ ${co2.toFixed(1)} · ${pressure.toFixed(0)} kPa`,
      whatItIs:
        'Crew survive inside a sealed metal habitat relying on recycled air, water filtration, and pressure controls in the vacuum of space.',
      crewImpact:
        'Stagnant CO₂ pockets trigger throbbing headaches and brain fog, while closed air recycles dust and lowers immune defenses.',
      countermeasure:
        envStatus === 'RED' || envStatus === 'AMBER'
          ? 'Boost cabin circulation fans to 100%, inspect LiOH CO₂ scrubber beds, and don emergency O₂ mask if pressure or SpO₂ drops.'
          : 'Keep sleep-station airflow vents unobstructed, sanitize shared touch surfaces daily, and verify CO₂ stays below 3.0 mmHg.',
      linkedActionLabel: 'Inspect Lungs & Head on 3D',
      linkedRegionId: 'head_brain',
    },
  ];
}

export function computeSmartHazardTags(params: {
  painAreas?: string[];
  sleepQuality?: number;
  sleepHours?: number;
  mentalHealth?: string;
  ambientCO2?: number;
  spo2?: number;
  radiationRate?: number;
  activeScenarioId?: string;
  regionId?: string;
}): SmartHazardTag[] {
  const {
    painAreas = [],
    sleepQuality = 8,
    sleepHours = 7,
    mentalHealth = '',
    ambientCO2 = 2.3,
    spo2 = 98,
    radiationRate = 2.1,
    activeScenarioId,
    regionId,
  } = params;

  const tags: SmartHazardTag[] = [];

  const hasSpineOrLegOrEyePain = painAreas.some((a) =>
    /spine|lumbar|back|leg|knee|joint|neck|shoulder|eye/i.test(a)
  );
  const isGravityRegion =
    regionId === 'spine_lumbar' ||
    regionId === 'legs_musculoskeletal' ||
    regionId === 'shoulders_joints' ||
    regionId === 'eyes_ocular';

  if (
    hasSpineOrLegOrEyePain ||
    isGravityRegion ||
    activeScenarioId === 'osdr-484-test' ||
    activeScenarioId === 'osdr-102-test' ||
    activeScenarioId === 'osdr-511-test'
  ) {
    tags.push({
      hazardId: 'gravity',
      tagLabel: 'Gravity Fields',
      status:
        activeScenarioId === 'osdr-484-test' || activeScenarioId === 'osdr-102-test'
          ? 'RED'
          : hasSpineOrLegOrEyePain
          ? 'AMBER'
          : 'GREEN',
      recommendation:
        'Perform resistance exercise (ARED), spinal decompression stretching, and drink electrolyte water.',
    });
  }

  const hasHeadPainOrBreath = painAreas.some((a) => /head|sinus|lung|breath/i.test(a));
  const isEnvRegion = regionId === 'head_brain' || regionId === 'lungs_respiratory';
  if (
    ambientCO2 > 3.0 ||
    spo2 < 95 ||
    (hasHeadPainOrBreath && (!regionId || regionId === 'head_brain')) ||
    isEnvRegion ||
    activeScenarioId === 'scenario-hypercapnia' ||
    activeScenarioId === 'scenario-decompression' ||
    activeScenarioId === 'osdr-630-test'
  ) {
    tags.push({
      hazardId: 'environment',
      tagLabel: 'Hostile/Closed Environments',
      status:
        ambientCO2 > 4.5 || spo2 < 92 || activeScenarioId === 'osdr-630-test'
          ? 'RED'
          : ambientCO2 > 3.0 || hasHeadPainOrBreath
          ? 'AMBER'
          : 'GREEN',
      recommendation:
        'Check LiOH CO₂ air scrubbers, turn circulation fans to max, and verify O₂ seal pressure.',
    });
  }

  if (
    sleepQuality <= 6 ||
    sleepHours < 6.5 ||
    /isolation|anxious|stress|overwhelmed|fatigue|insomnia|restless/i.test(mentalHealth)
  ) {
    tags.push({
      hazardId: 'isolation',
      tagLabel: 'Isolation & Confinement',
      status:
        sleepQuality <= 4 || /anxious|overwhelmed|insomnia/i.test(mentalHealth) ? 'RED' : 'AMBER',
      recommendation:
        'Start 30-min morning circadian light therapy and connect with crew / family message log.',
    });
  }

  if (
    radiationRate > 12 ||
    activeScenarioId === 'osdr-352-test' ||
    activeScenarioId === 'scenario-radiation'
  ) {
    tags.push({
      hazardId: 'radiation',
      tagLabel: 'Space Radiation',
      status: radiationRate > 50 ? 'RED' : 'AMBER',
      recommendation:
        'Shelter inside water-wall core, track dosimeter rate, and take antioxidant pack.',
    });
  }

  return tags;
}
