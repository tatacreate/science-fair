import { CabinEnvironment, DailyCheckin, TelemetryState } from '../types/heliomed';

export type NasaRiskCategory = 'physiology' | 'behavioral' | 'radiation';

export interface NasaHrpRiskSpec {
  id: string;
  title: string;
  shortBadge: string;
  category: NasaRiskCategory;
  categoryLabel: string;
  monitoredBy: string;
  whatNasaFound: string;
  countermeasure: string;
  linkedRegionId?: string;
}

export interface FlaggedNasaRisk {
  spec: NasaHrpRiskSpec;
  severity: 'GREEN' | 'AMBER' | 'RED';
  isActiveFlag: boolean;
  whyFlaggedNow: string;
}

export interface SpecificRiskEvalContext {
  heartRate?: number;
  spo2?: number;
  radiationRate?: number;
  cumulativeDoseMsv?: number;
  fatigueScore?: number;
  ambientCO2?: number;
  ambientPressure?: number;
  painAreas?: string[];
  sleepQuality?: number;
  sleepHours?: number;
  mentalHealth?: string;
  overallFeeling?: string;
  habitsStrugglingWith?: string[];
  evaMode?: boolean;
  activeScenarioId?: string;
  selectedRegionId?: string | null;
}

export const NASA_HRP_RISKS: NasaHrpRiskSpec[] = [
  // 1. HUMAN PHYSIOLOGY
  {
    id: 'sans',
    title: 'Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    shortBadge: 'SANS (Eyes / Brain)',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Head/Eyes 3D Twin · ONSD Ultrasound · Pain Log',
    whatNasaFound:
      'Microgravity pushes ~2 liters of blood and fluid toward the head, pressing on the back of the eyeballs and optic nerves.',
    countermeasure:
      'Run 25 minutes of Lower Body Negative Pressure (LBNP) or thigh cuffs, capture an eye ultrasound scan, and use Space Anticipation Glasses for reading.',
    linkedRegionId: 'eyes_ocular',
  },
  {
    id: 'hypoxia',
    title: 'Risk of Hypoxia',
    shortBadge: 'Risk of Hypoxia / CO₂',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Pulse Ox SpO₂ · Cabin CO₂ & O₂ Sensors',
    whatNasaFound:
      'Low oxygen or trapped exhaled CO₂ pockets in a sealed cabin starve the brain and lungs of clean oxygen.',
    countermeasure:
      'Crank cabin air circulation fans to 100%, check the LiOH CO₂ scrubber beds, and put on an emergency O₂ mask if SpO₂ stays below 92%.',
    linkedRegionId: 'lungs_respiratory',
  },
  {
    id: 'vestibular',
    title: 'Altered Sensorimotor & Vestibular Function',
    shortBadge: 'Altered Vestibular Function',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Inner Ear / Dizziness Check-In · Balance Log',
    whatNasaFound:
      'Gravity changes confuse the inner-ear balance system, triggering motion sickness, dizziness, and shaky hand-eye coordination.',
    countermeasure:
      'Keep head movements slow, anchor yourself with handrails before floating turns, and log vestibular recovery with the Meclizine/hydration kit if nausea rises.',
    linkedRegionId: 'head_brain',
  },
  {
    id: 'cardiovascular',
    title: 'Cardiovascular Adaptations',
    shortBadge: 'Cardiovascular Adaptations',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Heart Rate & BP Telemetry · 3D Chest Twin',
    whatNasaFound:
      'In weightlessness, the heart shrinks slightly and total blood volume drops 10–15%, causing racing pulse or dizziness when standing in gravity.',
    countermeasure:
      'Complete today’s 45-minute CEVIS aerobic workout and drink 750 mL electrolyte water before high-G or EVA duties.',
    linkedRegionId: 'heart_cardio',
  },
  {
    id: 'musculoskeletal',
    title: 'Reduced Musculoskeletal Fitness & Spaceflight-Induced Bone Changes',
    shortBadge: 'Bone & Muscle Loss',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Back/Leg/Joint Pain Log · ARED Routine Tracker',
    whatNasaFound:
      'Without Earth’s gravity, spine discs swell causing back pain while bones lose 1–1.5% calcium per month and leg muscles weaken fast.',
    countermeasure:
      'Perform 15 minutes of knees-to-chest lumbar decompression stretches and complete your heavy ARED resistance squats and deadlifts.',
    linkedRegionId: 'spine_lumbar',
  },
  {
    id: 'dynamic_loads',
    title: 'Risk of Injury from Dynamic Loads',
    shortBadge: 'Dynamic Loads / EVA Strain',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Shoulders/Harness Log · EVA Mode · Impact Readiness',
    whatNasaFound:
      'Stiff pressurized spacesuits, exercise harnesses, and landing impacts put heavy mechanical strain on shoulders, joints, and spine.',
    countermeasure:
      'Insert gel comfort pads under harness/suit shoulder straps, do 5 minutes of scapular warm-ups, and ease off peak loading if joint ache > 4/10.',
    linkedRegionId: 'shoulders_joints',
  },
  {
    id: 'immune',
    title: 'Altered Immune System Responses & Host-Microorganism Interactions',
    shortBadge: 'Altered Immune & Microbiome',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Skin Rash / Fatigue Check-In · Cabin Sanitization',
    whatNasaFound:
      'Spaceflight stress shifts gut/skin bacteria and weakens white blood cells, letting dormant skin rashes or minor viruses wake up.',
    countermeasure:
      'Sanitize shared airlock rails, capture a clear closeup photo of any rash with the Capsule Camera, and prioritize 8 hours of rest.',
    linkedRegionId: 'abdomen_renal',
  },
  {
    id: 'nutrition',
    title: 'Inadequate Food and Nutrition',
    shortBadge: 'Inadequate Nutrition / Hydration',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Appetite & Hydration Habit Tracker · Urine SG',
    whatNasaFound:
      'Microgravity dulls taste and thirst signals, making astronauts skip calories and water needed to protect muscles, bones, and kidneys.',
    countermeasure:
      'Log at least 2.5 L of electrolyte water today and eat a full nutrient-dense meal pouch plus your Vitamin D3 / Potassium Citrate pack.',
    linkedRegionId: 'abdomen_renal',
  },
  {
    id: 'decompression',
    title: 'Risk of Decompression Sickness ("The Bends")',
    shortBadge: 'Decompression Sickness',
    category: 'physiology',
    categoryLabel: 'Human Physiology',
    monitoredBy: 'Pre/Post-EVA Mode Toggle · Cabin kPa Pressure',
    whatNasaFound:
      'Stepping from a higher-pressure habitat into a lower-pressure EVA suit can release nitrogen gas bubbles into joints and blood.',
    countermeasure:
      'Complete the full 100% oxygen pre-breathe protocol before suit depressurization and report any joint popping or tingling immediately.',
    linkedRegionId: 'lungs_respiratory',
  },

  // 2. BEHAVIORAL PERFORMANCE
  {
    id: 'sleep',
    title: 'Inadequate Sleep & Irregular Schedules',
    shortBadge: 'Inadequate Sleep & Circadian Shift',
    category: 'behavioral',
    categoryLabel: 'Behavioral Performance',
    monitoredBy: 'Daily Sleep Score (1–10) & Hours Logged',
    whatNasaFound:
      'Seeing 16 sunrises a day plus noisy cabin fans breaks your internal body clock, causing sleep debt and slower reaction speeds.',
    countermeasure:
      'Switch habitat LEDs to warm amber 60 minutes before bed, secure your sleep-sack ventilation tether, and get morning blue-spectrum light.',
  },
  {
    id: 'behavioral_health',
    title: 'Behavioral Changes & Psychiatric Disorders',
    shortBadge: 'Stress & Isolation Strain',
    category: 'behavioral',
    categoryLabel: 'Behavioral Performance',
    monitoredBy: 'Daily Mental Health & Isolation Check-In',
    whatNasaFound:
      'Months inside tiny quarters far from home and nature can raise stress hormones, anxiety, and emotional fatigue.',
    countermeasure:
      'Take a 15-minute quiet mindfulness break, play recorded family Earth-audio messages, and check in privately with your crewmate or Flight Surgeon.',
  },
  {
    id: 'teamwork',
    title: 'Inadequate Teamwork',
    shortBadge: 'Inadequate Teamwork',
    category: 'behavioral',
    categoryLabel: 'Behavioral Performance',
    monitoredBy: 'Crew Friction & Comms Check-In Flag',
    whatNasaFound:
      'High-pressure workloads and isolation can spark misunderstandings between crewmates or delayed frustration with Mission Control.',
    countermeasure:
      'Run a 10-minute structured crew debrief: state observations calmly, clarify next-shift handoffs, and agree on one shared priority.',
  },
  {
    id: 'eva_cognitive',
    title: 'Spacewalk Cognitive Fatigue',
    shortBadge: 'Spacewalk Cognitive Fatigue',
    category: 'behavioral',
    categoryLabel: 'Behavioral Performance',
    monitoredBy: 'Pre/Post-EVA Readiness Check',
    whatNasaFound:
      'Long multi-hour spacewalks drain mental focus and hand strength, raising the chance of missed steps on tether or airlock checklists.',
    countermeasure:
      'Use buddy cross-checks for every airlock valve step, hydrate with the in-suit drink bag, and pause 60 seconds if tunnel vision sets in.',
  },
  {
    id: 'ops_support',
    title: 'Inadequate Systems Operations Support',
    shortBadge: 'Systems Ops Support',
    category: 'behavioral',
    categoryLabel: 'Behavioral Performance',
    monitoredBy: 'Tech Alert Flag · HelioMed Offline Checklist Guides',
    whatNasaFound:
      'When radio delays prevent live Earth help, confusing medical gear or complex steps can overwhelm crew during urgent events.',
    countermeasure:
      'HelioMed directly prevents this NASA risk by running 100% offline step-by-step checklists, 3D guides, and plain-English instructions aboard.',
  },

  // 3. SPACE RADIATION
  {
    id: 'radiation_cancer',
    title: 'Radiation-Induced Cancers',
    shortBadge: 'Radiation-Induced Cancers',
    category: 'radiation',
    categoryLabel: 'Space Radiation',
    monitoredBy: 'Live Dosimeter Rate · Cumulative mSv Dose',
    whatNasaFound:
      'Cosmic rays and solar flares pass through normal spacecraft walls, damaging cell DNA and raising lifetime cancer risk.',
    countermeasure:
      'Move into the water-wall storm shelter core if flare rate rises, track cumulative mSv dose, and take your daily antioxidant supplement pack.',
    linkedRegionId: 'head_brain',
  },
];

function getSpec(id: string): NasaHrpRiskSpec {
  return NASA_HRP_RISKS.find((r) => r.id === id)!;
}

export function evaluateSpecificNasaRisks(ctx: SpecificRiskEvalContext): {
  activeRisks: FlaggedNasaRisk[];
  allRisks: FlaggedNasaRisk[];
} {
  const {
    heartRate = 72,
    spo2 = 98,
    radiationRate = 2.1,
    cumulativeDoseMsv = 94.2,
    fatigueScore = 24,
    ambientCO2 = 2.3,
    ambientPressure = 101.3,
    painAreas = [],
    sleepQuality = 8,
    sleepHours = 7,
    mentalHealth = '',
    overallFeeling = '',
    habitsStrugglingWith = [],
    evaMode = false,
    activeScenarioId,
    selectedRegionId = null,
  } = ctx;

  const painJoined = painAreas.join(' ').toLowerCase();
  const textJoined = `${mentalHealth} ${overallFeeling} ${habitsStrugglingWith.join(' ')}`.toLowerCase();

  const evalMap = new Map<string, FlaggedNasaRisk>();

  const register = (
    id: string,
    isActiveFlag: boolean,
    severity: 'GREEN' | 'AMBER' | 'RED',
    whyFlaggedNow: string
  ) => {
    evalMap.set(id, {
      spec: getSpec(id),
      isActiveFlag,
      severity,
      whyFlaggedNow,
    });
  };

  // 1. SANS
  const hasHeadOrEyePain = /eye|vision|head|forehead|sans/i.test(painJoined);
  const sansRegionSelected = selectedRegionId === 'eyes_ocular' || selectedRegionId === 'head_brain';
  const isSansActive =
    hasHeadOrEyePain || sansRegionSelected || activeScenarioId === 'osdr-484-test';
  register(
    'sans',
    isSansActive,
    activeScenarioId === 'osdr-484-test' || /eye|vision/i.test(painJoined) ? 'RED' : isSansActive ? 'AMBER' : 'GREEN',
    activeScenarioId === 'osdr-484-test'
      ? 'OSD-484 ocular stress case shows optic nerve sheath swelling.'
      : /eye|vision/i.test(painJoined)
      ? 'Eye strain / vision change logged in daily check-in.'
      : hasHeadOrEyePain
      ? 'Head fullness/headache reported — fluid shift check recommended.'
      : sansRegionSelected
      ? 'Inspecting Head & Eyes on the 3D Body Twin.'
      : 'Monitoring optical ONSD & headward fluid shift nominally.'
  );

  // 2. Hypoxia
  const lowO2OrHighCO2 = spo2 < 95 || ambientCO2 > 3.0 || ambientPressure < 85;
  const hypoxiaScenario =
    activeScenarioId === 'osdr-630-test' ||
    activeScenarioId === 'scenario-decompression' ||
    activeScenarioId === 'scenario-hypercapnia';
  const hypoxiaActive =
    lowO2OrHighCO2 ||
    hypoxiaScenario ||
    (selectedRegionId === 'lungs_respiratory' && (lowO2OrHighCO2 || hypoxiaScenario)) ||
    (/head/i.test(painJoined) && ambientCO2 > 2.8);
  register(
    'hypoxia',
    hypoxiaActive,
    spo2 < 92 || ambientCO2 > 4.5 || hypoxiaScenario ? 'RED' : hypoxiaActive ? 'AMBER' : 'GREEN',
    hypoxiaScenario || lowO2OrHighCO2
      ? `Cabin CO₂ is ${ambientCO2.toFixed(1)} mmHg and SpO₂ is ${spo2}%.`
      : /head/i.test(painJoined)
      ? 'Headache logged with elevated cabin CO₂ baseline.'
      : 'Cabin oxygen and CO₂ scrubbers reading inside safe limits.'
  );

  // 3. Altered Vestibular Function
  const hasVestibularTrigger =
    /ear|dizzi|balance|vestib|vertigo/i.test(painJoined) ||
    /dizzi|vertigo|balance|motion|nausea|spin/i.test(textJoined);
  register(
    'vestibular',
    hasVestibularTrigger,
    /vertigo|dizzi/i.test(painJoined) ? 'RED' : hasVestibularTrigger ? 'AMBER' : 'GREEN',
    hasVestibularTrigger
      ? 'Inner ear, dizziness, or balance symptoms reported in your log.'
      : 'Vestibular orientation stable under current gravity mode.'
  );

  // 4. Cardiovascular Adaptations
  const cardioSpike = heartRate > 92 || heartRate < 50;
  const cardioPain = /chest|heart|cardiac/i.test(painJoined);
  const cardioActive =
    cardioSpike ||
    cardioPain ||
    selectedRegionId === 'heart_cardio' ||
    activeScenarioId === 'osdr-511-test';
  register(
    'cardiovascular',
    cardioActive,
    heartRate > 110 || cardioPain ? 'RED' : cardioActive ? 'AMBER' : 'GREEN',
    cardioSpike
      ? `Heart rate shifted to ${heartRate} bpm outside resting target.`
      : cardioPain
      ? 'Chest discomfort logged in self-check.'
      : selectedRegionId === 'heart_cardio'
      ? 'Heart & vessels selected on the 3D anatomical twin.'
      : `Resting pulse (${heartRate} bpm) and blood flow look steady.`
  );

  // 5. Reduced Musculoskeletal Fitness & Bone Changes
  const hasBackOrLegPain = /spine|lumbar|back|leg|knee|hip|joint|neck|bone|muscle/i.test(painJoined);
  const mskRegionSelected =
    selectedRegionId === 'spine_lumbar' || selectedRegionId === 'legs_musculoskeletal';
  const mskActive =
    hasBackOrLegPain || mskRegionSelected || activeScenarioId === 'osdr-102-test';
  register(
    'musculoskeletal',
    mskActive,
    activeScenarioId === 'osdr-102-test' ? 'RED' : hasBackOrLegPain ? 'AMBER' : mskActive ? 'AMBER' : 'GREEN',
    hasBackOrLegPain
      ? 'Lower back, leg, or joint soreness logged from microgravity unloading.'
      : mskRegionSelected
      ? 'Spine / lower-limb bone & muscle region selected on 3D twin.'
      : 'ARED resistive loading keeps spine & femur density protected.'
  );

  // 6. Risk of Injury from Dynamic Loads
  const shoulderOrStrainPain = /shoulder|arm|elbow|wrist|clavicle|strain/i.test(painJoined);
  const dynamicLoadsActive =
    shoulderOrStrainPain ||
    evaMode ||
    selectedRegionId === 'shoulders_joints' ||
    /harness chafing/i.test(textJoined);
  register(
    'dynamic_loads',
    dynamicLoadsActive,
    shoulderOrStrainPain ? 'AMBER' : evaMode ? 'AMBER' : 'GREEN',
    evaMode
      ? 'Pre/Post-EVA Mode active — pressurized suit shoulder & joint strain check enabled.'
      : shoulderOrStrainPain
      ? 'Shoulder/arm harness stress logged in check-in.'
      : 'Suit & exercise harness mechanical loading within nominal comfort.'
  );

  // 7. Altered Immune System Responses & Host-Microorganism Interactions
  const immuneTrigger =
    /skin|rash|immune|itch|cold|sick|fever|virus|fatigue/i.test(painJoined) ||
    /rash|skin rash|immune|sore throat|herpes|shingles/i.test(textJoined) ||
    fatigueScore > 65;
  register(
    'immune',
    immuneTrigger,
    fatigueScore > 75 || /rash/i.test(painJoined) ? 'AMBER' : immuneTrigger ? 'AMBER' : 'GREEN',
    immuneTrigger
      ? 'Skin rash, immune irritation, or elevated fatigue logged.'
      : 'No dermal lesions or immune reactivation alerts logged.'
  );

  // 8. Inadequate Food and Nutrition
  const nutritionTrigger =
    /nutrition|appetite|food|hydration|thirst|dehydrat|calorie|hungry/i.test(painJoined) ||
    /drinking enough fluids|eating enough food|appetite loss|low hydration|low nutrition/i.test(
      textJoined
    ) ||
    activeScenarioId === 'osdr-511-test';
  register(
    'nutrition',
    nutritionTrigger,
    activeScenarioId === 'osdr-511-test' ? 'AMBER' : nutritionTrigger ? 'AMBER' : 'GREEN',
    nutritionTrigger
      ? 'Low nutrition, suppressed appetite, or hydration challenge noted in habits.'
      : 'Daily calorie and fluid intake tracking on schedule.'
  );

  // 9. Decompression Sickness ("The Bends")
  const dcsTrigger =
    evaMode || ambientPressure < 85 || activeScenarioId === 'scenario-decompression';
  register(
    'decompression',
    dcsTrigger,
    ambientPressure < 80 || activeScenarioId === 'scenario-decompression'
      ? 'RED'
      : evaMode
      ? 'AMBER'
      : 'GREEN',
    evaMode
      ? 'EVA Readiness Check active — verify 100% O₂ pre-breathe before suit pressure drop.'
      : ambientPressure < 85
      ? `Cabin pressure dropped to ${ambientPressure.toFixed(1)} kPa.`
      : 'Cabin pressure steady at 101.3 kPa — zero nitrogen bubble risk.'
  );

  // 10. Inadequate Sleep & Irregular Schedules
  const sleepTrigger =
    sleepQuality <= 6 || sleepHours < 6.5 || /falling asleep|insomnia|sleep/i.test(textJoined);
  register(
    'sleep',
    sleepTrigger,
    sleepQuality <= 4 || sleepHours < 5.5 ? 'RED' : sleepTrigger ? 'AMBER' : 'GREEN',
    sleepTrigger
      ? `Sleep quality (${sleepQuality}/10, ${sleepHours}h) indicates circadian misalignment.`
      : `Restorative sleep logged (${sleepQuality}/10, ${sleepHours}h).`
  );

  // 11. Behavioral Changes & Psychiatric Disorders
  const psychTrigger = /isolation|anxious|restless|overwhelmed|stress|depress|lonely/i.test(
    textJoined
  );
  register(
    'behavioral_health',
    psychTrigger,
    /anxious|overwhelmed|depress/i.test(textJoined) ? 'RED' : psychTrigger ? 'AMBER' : 'GREEN',
    psychTrigger
      ? `Mood check-in flagged confinement stress ("${mentalHealth || 'Elevated strain'}").`
      : 'Crew mood & stress check-in remains calm and operational.'
  );

  // 12. Inadequate Teamwork
  const teamworkTrigger = /teamwork|crew friction|conflict|miscommunication|comm friction/i.test(
    textJoined
  );
  register(
    'teamwork',
    teamworkTrigger,
    teamworkTrigger ? 'AMBER' : 'GREEN',
    teamworkTrigger
      ? 'Crew friction or communication difficulty flagged during self-check.'
      : 'Crew coordination and shift handoff rapport nominal.'
  );

  // 13. Spacewalk Cognitive Fatigue
  register(
    'eva_cognitive',
    evaMode,
    evaMode && (sleepQuality <= 6 || fatigueScore > 50) ? 'RED' : evaMode ? 'AMBER' : 'GREEN',
    evaMode
      ? 'Pre/Post-EVA Spacewalk Readiness Check is active — focus & buddy-check verification required.'
      : 'Active only during Pre/Post-EVA airlock readiness windows.'
  );

  // 14. Inadequate Systems Operations Support
  const opsTrigger = /system confusion|tech alert|device confusion|unclear protocol/i.test(
    textJoined
  );
  register(
    'ops_support',
    opsTrigger,
    opsTrigger ? 'AMBER' : 'GREEN',
    opsTrigger
      ? 'System Confusion / Tech Alert flagged — HelioMed offline guided checklists launched.'
      : 'HelioMed 100% offline visual checklists actively eliminate procedure guesswork.'
  );

  // 15. Radiation-Induced Cancers
  const radElevated =
    radiationRate > 12 ||
    cumulativeDoseMsv > 120 ||
    activeScenarioId === 'osdr-352-test' ||
    activeScenarioId === 'scenario-radiation';
  register(
    'radiation_cancer',
    radElevated,
    radiationRate > 50 ||
    cumulativeDoseMsv > 300 ||
    activeScenarioId === 'osdr-352-test' ||
    activeScenarioId === 'scenario-radiation'
      ? 'RED'
      : radElevated
      ? 'AMBER'
      : 'GREEN',
    radElevated
      ? `Dosimeter rate (${radiationRate} µSv/h) / cumulative ${cumulativeDoseMsv.toFixed(1)} mSv approaching storm threshold.`
      : `Cumulative dose (${cumulativeDoseMsv.toFixed(1)} mSv) and rate (${radiationRate} µSv/h) within background range.`
  );

  const allRisks = NASA_HRP_RISKS.map((spec) => evalMap.get(spec.id)!);
  const activeRisks = allRisks.filter((r) => r.isActiveFlag);

  return { activeRisks, allRisks };
}
