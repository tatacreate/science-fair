/**
 * NASA Human Research Program (HRP) & Multilateral Space Agency Clinical Knowledge Base
 * 100% Offline Flight-Ready Reference for Astronaut Self-Assessment
 */

export type ClinicalAttentionLevel = 'NOMINAL' | 'CREW_ATTENTION' | 'SURGEON_ALERT' | 'CRITICAL';

export interface AnatomicalRegionInfo {
  id: string;
  label: string;
  shortLabel: string;
  system: string;
  cameraPreset: 'full' | 'spine' | 'chest' | 'head';
  meshNames: string[];
  painAreaMatch: RegExp;
  normalFunction: string;
  spaceflightHazards: string;
  inSpaceMeasurements: string[];
  whyExamNeeded: string;
  crewAttentionThreshold: string;
  groundSurgeonThreshold: string;
  preventativeActions: string[];
}

export const ANATOMICAL_REGIONS: AnatomicalRegionInfo[] = [
  {
    id: 'head_brain',
    label: 'Cranium, Vestibular & Cerebral Circulation',
    shortLabel: 'Head & Brain',
    system: 'Neurological & Vestibular',
    cameraPreset: 'head',
    meshNames: ['head', 'brain'],
    painAreaMatch: /head|brain|sinus/i,
    normalFunction:
      'Regulates cognition, executive flight decisions, spatial orientation via inner-ear otoliths, and cerebral perfusion at ~50 mL/100g/min.',
    spaceflightHazards:
      'Cephalad shift of ~2L blood/interstitial fluid elevates intracranial venous pressure; enclosed cabin CO2 accumulation (>3.0 mmHg) causes cerebral vasodilation and throbbing frontal headaches; vestibular mismatch induces Space Motion Sickness (SMS).',
    inSpaceMeasurements: [
      'Ambient Cabin PCO2 (mmHg)',
      'WinSCAT Cognitive Reaction Battery',
      'Transcranial Doppler Flow Velocity',
      'Pupillary Light Reflex & Symptom Scale',
    ],
    whyExamNeeded:
      'Early detection of CO2 toxicity and neurovestibular disorientation prevents critical piloting errors during docking, EVA, and emergency procedures.',
    crewAttentionThreshold:
      'Persistent frontal headache, mild dizziness, WinSCAT reaction time drop >12%, or Cabin PCO2 between 3.5 and 5.0 mmHg.',
    groundSurgeonThreshold:
      'Cabin PCO2 > 5.0 mmHg, projectile emesis >24h, focal neurological deficit, syncope, or acute confusion.',
    preventativeActions: [
      'Position personal sleep-station airflow tether to prevent stagnant CO2 exhaled pockets.',
      'Perform 20–30 min Lower Body Negative Pressure (LBNP) at -25 mmHg to draw cranial fluid downward.',
      'Check ECLSS LiOH / CDRA CO2 scrubber differential and hydrate with 500 mL isotonic electrolytes.',
    ],
  },
  {
    id: 'eyes_ocular',
    label: 'Ocular Globe & Optic Nerve (SANS)',
    shortLabel: 'Eyes & Optic Nerve',
    system: 'Neuro-Ocular (SANS)',
    cameraPreset: 'head',
    meshNames: ['left_eye', 'right_eye'],
    painAreaMatch: /eye|vision|sans/i,
    normalFunction:
      'Maintains sharp retinal focus, balanced intraocular pressure (10–21 mmHg), and unobstructed axoplasmic flow along the optic nerve.',
    spaceflightHazards:
      'Microgravity fluid shift flattens the posterior sclera, induces choroidal folds, and widens the Optic Nerve Sheath Diameter (ONSD)—known as Spaceflight Associated Neuro-ocular Syndrome (SANS).',
    inSpaceMeasurements: [
      'Ocular Ultrasound (ONSD in mm)',
      'Handheld Tonopen Intraocular Pressure (mmHg)',
      'Amsler Grid Macular Distortion Test',
      'Fundoscope Retinal Imaging & Visual Acuity',
    ],
    whyExamNeeded:
      'SANS affects over 60% of long-duration astronauts and can cause permanent hyperopic vision shifts or optic disc edema if unmitigated.',
    crewAttentionThreshold:
      'Near-vision blurriness (+0.75D shift), any wavy lines on Amsler Grid, ONSD 5.0–5.7 mm, or IOP 22–24 mmHg.',
    groundSurgeonThreshold:
      'ONSD >= 5.8 mm, IOP > 24 mmHg, rapid scotoma expansion on Amsler Grid, or confirmed Frisén Grade >= 2 optic disc edema.',
    preventativeActions: [
      'Switch to Space Anticipation Glasses (+1.25D adjustable lenses) for fine flight-deck work.',
      'Execute LBNP thigh-cuff or vacuum chamber protocol to lower cephalic venous congestion.',
      'Follow 20-20-20 visual rest rule and capture high-resolution retinal/ultrasound imagery for Flight Surgeon trending.',
    ],
  },
  {
    id: 'heart_cardio',
    label: 'Heart & Cardiovascular Autonomic System',
    shortLabel: 'Heart & Vessels',
    system: 'Cardiovascular',
    cameraPreset: 'chest',
    meshNames: ['heart', 'chest'],
    painAreaMatch: /chest|heart|cardiac/i,
    normalFunction:
      'Maintains systemic arterial pressure (115/75 mmHg), cardiac output (~5 L/min), and autonomic baroreflex heart rate variability (HRV).',
    spaceflightHazards:
      '10–15% plasma volume contraction occurs within 48 hours of orbit entry ("space anemia" & hypovolemia), reducing left ventricular mass and blunting baroreceptor reflexes—risking severe orthostatic hypotension upon planetary gravity transitions.',
    inSpaceMeasurements: [
      '12-Lead / Wearable Holter ECG & HRV (RMSSD ms)',
      'Brachial Systolic/Diastolic Blood Pressure (mmHg)',
      'Cardiac Echocardiography (Ultrasound)',
      'Shock Index (HR / SBP Ratio)',
    ],
    whyExamNeeded:
      'Monitors for microgravity-induced arrhythmias, atrial remodeling, autonomic vagal withdrawal, and orthostatic intolerance readiness before landing or EVA.',
    crewAttentionThreshold:
      'Resting HR > 95 bpm, HRV RMSSD < 30 ms, Shock Index > 0.75, or SBP < 95 mmHg with lightheadedness.',
    groundSurgeonThreshold:
      'Resting HR > 115 bpm or < 45 bpm, Shock Index > 0.95, multifocal PVCs/arrhythmia, or chest tightness.',
    preventativeActions: [
      'Complete prescribed 45–60 min aerobic ergometer (CEVIS) + ARED resistance countermeasure daily.',
      'Execute fluid-loading protocol (1.0 L isotonic saline / salt tablets) prior to high-G or EVA loads.',
      'Log resting supine BP and HRV each morning before leaving sleep restraint.',
    ],
  },
  {
    id: 'lungs_respiratory',
    label: 'Lungs, Airway & Alveolar Gas Exchange',
    shortLabel: 'Lungs & Airway',
    system: 'Pulmonary & Atmosphere',
    cameraPreset: 'chest',
    meshNames: ['left_lung', 'right_lung'],
    painAreaMatch: /lung|breath|dyspnea|respir/i,
    normalFunction:
      'Exchanges O2 and CO2 across alveolar membranes to sustain arterial oxygen saturation (SpO2 96–100%) and acid-base balance.',
    spaceflightHazards:
      'Without thermal convection, exhaled CO2 pools around the crew unless fans circulate air. Cabin depressurization drops PAO2 (hypoxia), while planetary dust (lunar regolith) poses acute alveolar inflammation risks.',
    inSpaceMeasurements: [
      'Pulse Oximetry SpO2 (%) & Respiratory Rate',
      'Alveolar Oxygen Equation (PAO2 mmHg)',
      'Exhaled Nitric Oxide / Spirometry Peak Flow',
      'Cabin O2% & Barometric Pressure (kPa)',
    ],
    whyExamNeeded:
      'Verifies both lung oxygen transfer and closed-loop habitat life support integrity against silent hypoxia or dust inhalation.',
    crewAttentionThreshold:
      'SpO2 92–94%, respiratory rate > 22 breaths/min at rest, or PAO2 < 80 mmHg.',
    groundSurgeonThreshold:
      'SpO2 < 90%, respiratory rate > 26/min, PAO2 < 60 mmHg, or any acute wheezing post-EVA airlock dust exposure.',
    preventativeActions: [
      'Don 100% emergency O2 mask immediately if SpO2 drops below 92% or cabin pressure falls < 85 kPa.',
      'Perform post-EVA dust abatement and HEPA airlock purge before doffing helmet.',
      'Verify ventilation duct velocity in closed sleeping or working compartments.',
    ],
  },
  {
    id: 'spine_lumbar',
    label: 'Thoracic-Lumbar Spine & Intervertebral Discs',
    shortLabel: 'Spine & Back',
    system: 'Musculoskeletal',
    cameraPreset: 'spine',
    meshNames: ['lower_back', 'neck'],
    painAreaMatch: /spine|lumbar|back|neck/i,
    normalFunction:
      'Supports axial skeletal alignment, houses the spinal cord, and absorbs mechanical loading via hydrated intervertebral discs.',
    spaceflightHazards:
      'Absence of 1G axial compression lets discs hyper-hydrate and lengthen the spine by 5–7 cm, stretching paraspinal ligaments ("space back pain") and elevating post-flight disc herniation risk by 4.3x.',
    inSpaceMeasurements: [
      'Spinal Elongation Tape Measure & Stature Check',
      'Lumbar Pain VAS Score (0–10)',
      'Ultrasound Disc Space Thickness Scan',
      'Neck / Cervical Posture Strain Rating',
    ],
    whyExamNeeded:
      'Over 50% of astronauts report moderate-to-severe lower back pain in week 1; uncontrolled paraspinal atrophy compromises EVA suit mobility.',
    crewAttentionThreshold:
      'Lumbar/cervical pain >= 4/10, stiffness limiting daily ARED exercise, or radiating tingling into glutes.',
    groundSurgeonThreshold:
      'Pain >= 7/10 unresponsive to decompression stretching, radicular leg weakness, or suspected disc herniation.',
    preventativeActions: [
      'Perform 15 min fetal knees-to-chest decompression stretching immediately upon waking.',
      'Wear Penguin / SkinSuit axial-loading garment or tighten sleep-sack bungee preload (150N).',
      'Maintain strict neutral lumbar alignment during ARED squats and deadlifts.',
    ],
  },
  {
    id: 'abdomen_renal',
    label: 'Metabolic Endocrine & Renal Filtration System',
    shortLabel: 'Metabolic & Renal',
    system: 'Metabolic & Renal',
    cameraPreset: 'full',
    meshNames: ['abdomen'],
    painAreaMatch: /abdomen|stomach|kidney|renal|nausea|gi/i,
    normalFunction:
      'Maintains blood glucose homeostasis (70–110 mg/dL), filters calcium/electrolytes, and digests nutrition for energy balance.',
    spaceflightHazards:
      'Accelerated bone demineralization dumps excess calcium into urine; combined with reduced thirst drive in microgravity, this drives a sharp risk of painful calcium-oxalate kidney stones and mild spaceflight insulin resistance.',
    inSpaceMeasurements: [
      'Capillary Blood Glucose (mg/dL)',
      'Urine Specific Gravity (Hydration / Stone Risk)',
      'Renal Ultrasound (Hydronephrosis / Calculi)',
      'Potassium Citrate & Electrolyte Balance',
    ],
    whyExamNeeded:
      'A symptomatic kidney stone in deep space can incapacitate a crew member and obstruct urinary outflow; dysglycemia degrades immune and cognitive stability.',
    crewAttentionThreshold:
      'Fasting glucose < 65 or > 130 mg/dL, Urine Specific Gravity > 1.022, or mild flank/abdominal cramping.',
    groundSurgeonThreshold:
      'Glucose < 54 or > 200 mg/dL, Urine SG > 1.028 with flank colic/hematuria, or persistent abdominal guarding.',
    preventativeActions: [
      'Enforce minimum 2.5 L/day fluid intake logged via drinking pouch tracker (target Urine SG < 1.015).',
      'Take prescribed daily Potassium Citrate prophylaxis against bone-calcium renal stones.',
      'Balance complex carbohydrates and timing before resistive workouts to stabilize blood glucose.',
    ],
  },
  {
    id: 'shoulders_joints',
    label: 'Shoulder Girdle, Clavicle & Upper Extremities',
    shortLabel: 'Shoulders & Arms',
    system: 'Upper Musculoskeletal',
    cameraPreset: 'chest',
    meshNames: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_upper_arm', 'right_upper_arm', 'left_forearm', 'right_forearm', 'left_hand', 'right_hand'],
    painAreaMatch: /shoulder|arm|elbow|hand|wrist/i,
    normalFunction:
      'Provides multi-axial upper-body reach for EVA tool manipulation, translation along handrails, and pressurized glove dexterity.',
    spaceflightHazards:
      'Pressurized EVA suits restrict scapular rotation causing rotator cuff impingement and fingernail delamination; T2 treadmill shoulder harnesses cause clavicular chafing and bursitis.',
    inSpaceMeasurements: [
      'Shoulder Range-of-Motion & Pain VAS (0–10)',
      'Dermal Camera Inspection (Harness Erythema)',
      'Musculoskeletal Ultrasound (Supraspinatus Tendon)',
      'Grip Strength Dynamometry (kg)',
    ],
    whyExamNeeded:
      'Upper extremity injury compromises the primary method of locomotion in zero-G (handrails) and jeopardizes emergency EVA maintenance capability.',
    crewAttentionThreshold:
      'Localized shoulder ache >= 3/10 post-EVA, visible skin erythema/blistering under harness, or grip strength drop >15%.',
    groundSurgeonThreshold:
      'Acute inability to abduct arm >90 degrees, suspected rotator cuff tear, or spreading dermal cellulitis/infection.',
    preventativeActions: [
      'Insert viscoelastic gel pads under T2 treadmill bungee shoulder straps.',
      'Execute daily scapular wall-slides and resistance-band external rotation warm-ups.',
      'Inspect shoulder skin and fingernails under capsule camera after every suit run.',
    ],
  },
  {
    id: 'legs_musculoskeletal',
    label: 'Lower Extremities, Femur Bone Density & Calf Muscle',
    shortLabel: 'Legs, Bones & Knees',
    system: 'Lower Musculoskeletal',
    cameraPreset: 'full',
    meshNames: ['left_hip', 'right_hip', 'left_thigh', 'right_thigh', 'left_knee', 'right_knee', 'left_calf', 'right_calf', 'left_foot', 'right_foot'],
    painAreaMatch: /leg|thigh|knee|calf|foot|joint|bone/i,
    normalFunction:
      'Supports locomotion under gravity, stores structural calcium in trabecular bone, and pumps venous blood upward via calf muscle contractions.',
    spaceflightHazards:
      'Weightlessness triggers 1–1.5% bone mineral density loss per month in the proximal femur and rapid Type-I/II soleus calf atrophy, plus rare deep-vein thrombosis (jugular/lower limb stasis risk).',
    inSpaceMeasurements: [
      'ARED Squat/Deadlift Peak Force Output (N)',
      'Lower-Limb Compression Ultrasound (DVT screen)',
      'Knee / Ankle Articular Pain Score (0–10)',
      'Calf Circumference Tape Measurement (cm)',
    ],
    whyExamNeeded:
      'Without heavy resistive countermeasures, astronauts lose critical bone mass and muscle strength needed for safe Mars/Lunar surface operations.',
    crewAttentionThreshold:
      'Unilateral calf swelling (>1.5 cm asymmetry), knee effusion post-ARED, or strength output drop >10%.',
    groundSurgeonThreshold:
      'Suspected Deep Vein Thrombosis (unilateral warm swollen calf), joint locking, or suspected stress fracture.',
    preventativeActions: [
      'Complete high-load ARED axial exercises (squats, heel raises, deadlifts) 6 days/week.',
      'Ensure Vitamin D3 (800–1000 IU/day) supplementation in zero-sunlight cabin.',
      'Apply 15 min cryo-cuff cold pack and reduce ARED eccentric load by 20% if knee synovitis flares.',
    ],
  },
];

export interface HealthIndicatorSpec {
  id: string;
  label: string;
  unit: string;
  system: string;
  regionId: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  nominalRangeText: string;
  howMeasuredInSpace: string;
  whyNeeded: string;
  hazardEffect: string;
  crewTrigger: string;
  surgeonTrigger: string;
  countermeasures: string[];
  evaluate: (value: number) => {
    level: ClinicalAttentionLevel;
    headline: string;
    interpretation: string;
    action: string;
  };
}

export const EXAM_INDICATOR_SPECS: HealthIndicatorSpec[] = [
  {
    id: 'glucose',
    label: 'Blood Glucose (Capillary)',
    unit: 'mg/dL',
    system: 'Metabolic & Endocrine',
    regionId: 'abdomen_renal',
    defaultValue: 92,
    min: 35,
    max: 320,
    step: 1,
    nominalRangeText: '70 – 110 mg/dL (Fasting)',
    howMeasuredInSpace: 'i-STAT / Portable Capillary Glucometer finger-stick test strip.',
    whyNeeded: 'Tracks metabolic energy availability, microgravity-induced insulin resistance, and hypoglycemia risk prior to heavy EVA or ARED blocks.',
    hazardEffect: 'Altered circadian rhythm, stress cortisol, and physical inactivity shift glucose tolerance upward; intense EVA exertion can trigger sudden hypoglycemia.',
    crewTrigger: '< 68 mg/dL or > 140 mg/dL fasting',
    surgeonTrigger: '< 54 mg/dL (neuroglycopenia) or > 200 mg/dL',
    countermeasures: [
      'If < 68 mg/dL: consume 15g fast-acting carbohydrate gel pouch immediately; re-test in 15 min.',
      'If > 140 mg/dL: complete 30 min CEVIS cycling session and verify hydration status.',
    ],
    evaluate: (v) => {
      if (v < 54 || v > 220) {
        return {
          level: 'CRITICAL',
          headline: v < 54 ? 'Severe Hypoglycemia' : 'Severe Hyperglycemia',
          interpretation: v < 54 ? 'Imminent neuroglycopenic impairment risk during flight tasks.' : 'Marked insulin dysregulation or acute metabolic stress.',
          action: v < 54 ? 'Administer 20g oral glucose gel immediately, halt EVA/controls, notify Ground Flight Surgeon.' : 'Withhold simple carbs, initiate 500 mL saline/water hydration, test urine ketones, alert Flight Surgeon.',
        };
      }
      if (v < 68 || v > 160) {
        return {
          level: 'SURGEON_ALERT',
          headline: v < 68 ? 'Low Blood Sugar Warning' : 'Elevated Dysglycemia',
          interpretation: 'Outside NASA operational flight clearance corridor; warrants Ground Flight Surgeon review.',
          action: v < 68 ? 'Ingest 15g carbohydrate ration and delay exercise 30 minutes.' : 'Adjust meal glycemic load and schedule metabolic panel repeat at next DSN pass.',
        };
      }
      if (v > 115) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Mildly Elevated Glucose',
          interpretation: 'Consistent with microgravity hepatic insulin resistance or recent post-prandial intake.',
          action: 'Perform 30 min aerobic ergometer bout and recheck fasting level tomorrow morning.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Nominal Euglycemia',
        interpretation: 'Metabolic fuel availability optimal for mission operations and EVA.',
        action: 'Maintain standard mission nutrition schedule.',
      };
    },
  },
  {
    id: 'onsd',
    label: 'Optic Nerve Sheath Diameter (ONSD)',
    unit: 'mm',
    system: 'Neuro-Ocular (SANS)',
    regionId: 'eyes_ocular',
    defaultValue: 4.5,
    min: 3.0,
    max: 7.5,
    step: 0.1,
    nominalRangeText: '< 5.0 mm',
    howMeasuredInSpace: 'ISS Ultrasound II linear probe (measured 3 mm posterior to ocular globe).',
    whyNeeded: 'Primary non-invasive surrogate marker for elevated intracranial pressure and SANS optic disc edema in deep space.',
    hazardEffect: 'Headward venous fluid shift and mildly elevated cabin CO2 distend the subarachnoid sheath surrounding the optic nerve.',
    crewTrigger: '5.0 – 5.7 mm (Borderline Distension)',
    surgeonTrigger: '>= 5.8 mm (SANS / Elevated ICP Alert)',
    countermeasures: [
      'Execute 30 min LBNP (-25 mmHg) lower-body fluid redistribution session.',
      'Capture fundus photograph and complete Amsler Grid screening.',
    ],
    evaluate: (v) => {
      if (v >= 6.2) {
        return {
          level: 'CRITICAL',
          headline: 'Marked Optic Nerve Sheath Distension',
          interpretation: 'Strong indicator of elevated intracranial pressure / active SANS papilledema risk.',
          action: 'Initiate daily LBNP -30 mmHg protocol, capture high-res fundus scan, transmit urgent DSN packet to Ground Surgeon.',
        };
      }
      if (v >= 5.6) {
        return {
          level: 'SURGEON_ALERT',
          headline: 'SANS Threshold Exceeded',
          interpretation: 'Significant optic sheath widening compared to pre-flight baseline.',
          action: 'Reduce cabin PCO2 exposure, complete Amsler visual check, and await Flight Surgeon prescription.',
        };
      }
      if (v >= 5.0) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Mild Cephalic Sheath Expansion',
          interpretation: 'Early microgravity fluid shift sign; common in weeks 2–8 of flight.',
          action: 'Schedule LBNP countermeasure and repeat ocular ultrasound in 72 hours.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Nominal Optic Sheath',
        interpretation: 'No ultrasonic evidence of elevated peri-optic cerebrospinal fluid pressure.',
        action: 'Continue standard bi-weekly SANS monitoring.',
      };
    },
  },
  {
    id: 'iop',
    label: 'Intraocular Pressure (IOP)',
    unit: 'mmHg',
    system: 'Neuro-Ocular (SANS)',
    regionId: 'eyes_ocular',
    defaultValue: 15,
    min: 6,
    max: 34,
    step: 1,
    nominalRangeText: '10 – 21 mmHg',
    howMeasuredInSpace: 'Handheld Tono-Pen / Icare rebound tonometer self-assessment.',
    whyNeeded: 'Tracks acute eye pressure spikes caused by fluid redistribution and evaluates glaucoma / ocular perfusion gradients.',
    hazardEffect: 'Microgravity causes transient IOP surges (+20–40%) during initial orbital adaptation and resistive strain.',
    crewTrigger: '22 – 24 mmHg',
    surgeonTrigger: '> 24 mmHg or >5 mmHg asymmetry between eyes',
    countermeasures: [
      'Avoid breath-holding (Valsalva maneuver) during heavy ARED squats.',
      'Re-test sitting/floating quietly after 10 min rest.',
    ],
    evaluate: (v) => {
      if (v >= 28 || v < 8) {
        return {
          level: 'CRITICAL',
          headline: v >= 28 ? 'Acute Ocular Hypertension' : 'Ocular Hypotony Alert',
          interpretation: 'High risk of optic nerve fiber compression or globe deformation.',
          action: 'Halt high-load ARED lifting immediately, check visual acuity, downlink urgent report to Ground Ophthalmology.',
        };
      }
      if (v >= 24) {
        return {
          level: 'SURGEON_ALERT',
          headline: 'Elevated Intraocular Pressure',
          interpretation: 'Exceeds NASA clinical reference limit (>24 mmHg).',
          action: 'Repeat measurement in both eyes after 30 min rest and transmit to Flight Surgeon.',
        };
      }
      if (v >= 21) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Upper Borderline IOP',
          interpretation: 'Expected mild microgravity cephalic congestion elevation.',
          action: 'Avoid Valsalva breath-holding during exercise and monitor alongside ONSD.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Nominal Eye Pressure',
        interpretation: 'Healthy intraocular fluid equilibrium.',
        action: 'Routine weekly check only.',
      };
    },
  },
  {
    id: 'urine_sg',
    label: 'Urine Specific Gravity (Hydration / Stone Risk)',
    unit: 'SG',
    system: 'Metabolic & Renal',
    regionId: 'abdomen_renal',
    defaultValue: 1.012,
    min: 1.0,
    max: 1.04,
    step: 0.002,
    nominalRangeText: '1.005 – 1.018',
    howMeasuredInSpace: 'Optical handheld refractometer or colorimetric dipstick.',
    whyNeeded: 'Assesses dehydration and urine calcium supersaturation—critical for preventing painful kidney stones caused by space bone loss.',
    hazardEffect: 'Weightlessness shrinks plasma volume and blunts thirst sensation while osteoclasts release bone calcium into renal filtrate.',
    crewTrigger: '1.020 – 1.025 (Mild Dehydration)',
    surgeonTrigger: '>= 1.028 or persistent flank pain / hematuria',
    countermeasures: [
      'Drink 750 mL electrolyte water over the next 2 hours.',
      'Confirm daily Potassium Citrate supplement dose taken.',
    ],
    evaluate: (v) => {
      if (v >= 1.032) {
        return {
          level: 'CRITICAL',
          headline: 'Severe Dehydration & Stone Crystallization Risk',
          interpretation: 'High renal supersaturation; acute nephrolithiasis risk from microgravity bone calcium.',
          action: 'Initiate immediate 1.0 L oral electrolyte rehydration protocol, verify potassium citrate, alert Flight Surgeon.',
        };
      }
      if (v >= 1.026) {
        return {
          level: 'SURGEON_ALERT',
          headline: 'Concentrated Urine / Elevated Stone Risk',
          interpretation: 'Inadequate fluid replacement relative to insensible cabin loss.',
          action: 'Consume 750 mL water now and perform renal dipstick for microhematuria.',
        };
      }
      if (v >= 1.02) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Sub-Optimal Hydration',
          interpretation: 'Mild concentration; common when workload suppresses thirst cues.',
          action: 'Increase water pouch target by +500 mL today.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Optimal Hydration',
        interpretation: 'Well-diluted urine protective against renal calculi formation.',
        action: 'Maintain 2.5 L/day fluid cadence.',
      };
    },
  },
  {
    id: 'lactate',
    label: 'Blood Lactate (Exercise & Perfusion)',
    unit: 'mmol/L',
    system: 'Cardiovascular & Muscle',
    regionId: 'legs_musculoskeletal',
    defaultValue: 1.1,
    min: 0.4,
    max: 8.0,
    step: 0.1,
    nominalRangeText: '0.5 – 2.0 mmol/L (Rest)',
    howMeasuredInSpace: 'Portable capillary lactate analyzer (Lactate Pro / i-STAT CG4+).',
    whyNeeded: 'Monitors aerobic fitness, tissue oxygenation during hypoxia/decompression, and muscular metabolic fatigue after ARED/CEVIS.',
    hazardEffect: 'Cabin hypoxia, elevated CO2, or skeletal muscle deconditioning shifts metabolism toward anaerobic glycolysis.',
    crewTrigger: '2.1 – 3.9 mmol/L at rest',
    surgeonTrigger: '>= 4.0 mmol/L at rest (Hypoperfusion / Acidosis)',
    countermeasures: [
      'Check SpO2 and cabin O2/Pressure sensors immediately if elevated at rest.',
      'Schedule active recovery cycling and electrolyte hydration.',
    ],
    evaluate: (v) => {
      if (v >= 4.0) {
        return {
          level: 'CRITICAL',
          headline: 'Elevated Resting Lactic Acidosis Risk',
          interpretation: 'Indicates tissue hypoperfusion, severe hypoxia, or acute metabolic stress.',
          action: 'Verify SpO2 & cabin pressure immediately, administer O2 if <94%, transmit urgent DSN telemetry.',
        };
      }
      if (v >= 2.5) {
        return {
          level: 'SURGEON_ALERT',
          headline: 'Elevated Anaerobic Load',
          interpretation: 'Above nominal resting threshold; assess recent exertion vs. cabin hypoxia.',
          action: 'Rest 45 min, measure SpO2 and HR, repeat test.',
        };
      }
      if (v >= 2.1) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Mild Post-Exercise Residual',
          interpretation: 'Borderline elevation consistent with recent resistive training.',
          action: 'Ensure adequate carbohydrate replenishment and cool-down.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Nominal Aerobic Balance',
        interpretation: 'Normal cellular oxidative phosphorylation.',
        action: 'Cleared for full ARED/CEVIS exercise protocol.',
      };
    },
  },
  {
    id: 'systolic_bp',
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    system: 'Cardiovascular',
    regionId: 'heart_cardio',
    defaultValue: 118,
    min: 70,
    max: 200,
    step: 1,
    nominalRangeText: '95 – 128 mmHg',
    howMeasuredInSpace: 'Automated oscillometric brachial cuff self-measurement.',
    whyNeeded: 'Detects microgravity hypovolemic hypotension (orthostatic syncope risk) or stress/CO2-induced hypertension.',
    hazardEffect: 'Reduced blood volume in zero-G lowers resting SBP while vascular stiffness and CO2 spikes can elevate acute pressure.',
    crewTrigger: 'SBP 88–94 or 135–149 mmHg',
    surgeonTrigger: 'SBP < 85 mmHg (Shock risk) or >= 160 mmHg',
    countermeasures: [
      'For low SBP: ingest salt tablets + 500 mL water and engage leg compression garments.',
      'For high SBP: rest 15 min, check cabin PCO2, avoid caffeine.',
    ],
    evaluate: (v) => {
      if (v < 85 || v >= 175) {
        return {
          level: 'CRITICAL',
          headline: v < 85 ? 'Acute Hypotension / Syncope Risk' : 'Hypertensive Urgency',
          interpretation: 'Cerebral perfusion or vascular wall stress critically altered.',
          action: v < 85 ? 'Assume horizontal/LBNP-off posture, administer rapid oral/IV fluid load, alert Flight Surgeon.' : 'Cease physical strain, verify cabin CO2, alert Flight Surgeon immediately.',
        };
      }
      if (v < 92 || v >= 150) {
        return {
          level: 'SURGEON_ALERT',
          headline: v < 92 ? 'Low Systolic Pressure' : 'Stage-2 Elevated Pressure',
          interpretation: 'Requires Ground Surgeon correlation with HR and hydration log.',
          action: 'Repeat cuff reading on opposite arm after 5 min quiet rest and downlink.',
        };
      }
      if (v >= 132) {
        return {
          level: 'CREW_ATTENTION',
          headline: 'Mildly Elevated Pressure',
          interpretation: 'Could reflect workout stress, high sodium load, or elevated CO2.',
          action: 'Recheck before sleep cycle.',
        };
      }
      return {
        level: 'NOMINAL',
        headline: 'Nominal Arterial Pressure',
        interpretation: 'Optimal perfusion pressure across cerebral and renal beds.',
        action: 'Maintain daily exercise and hydration routine.',
      };
    },
  },
];
