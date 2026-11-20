/**
 * Multi-Environment Health Insights, Routine Prompts, & Plain-Language Guides
 * Covers Spacecraft, Space Station, Pressurized Rover, Lunar/Planetary Base, and Earth Remote/Offline
 */

export type HabitatEnvironmentId =
  | 'spacecraft'
  | 'space_station'
  | 'rover'
  | 'planetary_base'
  | 'earth_remote';

export interface RoutinePromptSpec {
  id: string;
  title: string;
  cadence: string;
  xpReward: number;
  targetRegionId: string;
  targetTab: 'keyboard' | 'mouse' | 'camera' | 'daily_checkin';
  plainLanguageWhy: string;
  stepByStepHowTo: string[];
  colorZoneHint: string;
}

export interface HabitatEnvironmentProfile {
  id: HabitatEnvironmentId;
  name: string;
  shortName: string;
  gravityLabel: string;
  commDelayLabel: string;
  radiationBaselineUSv: number;
  ambientCO2Baseline: number;
  pressureBaselineKpa: number;
  summary: string;
  keyHazards: Array<{
    hazard: string;
    effectOnBody: string;
    severityTag: 'MODERATE' | 'HIGH';
  }>;
  priorityActions: string[];
  routines: RoutinePromptSpec[];
}

export const HABITAT_ENVIRONMENTS: HabitatEnvironmentProfile[] = [
  {
    id: 'spacecraft',
    name: 'Deep-Space Transit Spacecraft (0G)',
    shortName: 'Spacecraft',
    gravityLabel: '0.00 G Microgravity',
    commDelayLabel: '14m 28s One-Way',
    radiationBaselineUSv: 3.4,
    ambientCO2Baseline: 2.5,
    pressureBaselineKpa: 101.3,
    summary:
      'In deep-space transit beyond Earth’s magnetic shield, crew members float continuously with significant signal delay to Earth. Body fluids shift toward the head, the spine lengthens, and cosmic radiation rises.',
    keyHazards: [
      {
        hazard: 'Headward Fluid Shift (SANS)',
        effectOnBody:
          'Without gravity pulling blood downward, fluid builds up around the eyes and brain—causing puffy face, headaches, and blurry near vision.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Unshielded Deep-Space Cosmic Rays',
        effectOnBody:
          'Outside Earth’s magnetosphere, solar flares can deliver sudden high radiation doses requiring quick movement to the water-wall shelter.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Spinal Disc Swelling & Muscle Loss',
        effectOnBody:
          'Your spine stretches by up to 6 cm while floating, causing aching lower back stiffness and gradual leg muscle weakening.',
        severityTag: 'MODERATE',
      },
    ],
    priorityActions: [
      'Check Optic Nerve Sheath (ONSD) and Amsler Eye Grid every 3 days for early vision changes.',
      'Drink 2.5 L of water daily even when you do not feel thirsty to stop kidney stones.',
      'Retreat to the core water-wall shelter immediately if radiation flux exceeds 15 µSv/h.',
    ],
    routines: [
      {
        id: 'sc-sans-check',
        title: 'Eye & Head Fluid Check (Amsler Grid)',
        cadence: 'Due every 72 hrs',
        xpReward: 45,
        targetRegionId: 'eyes_ocular',
        targetTab: 'mouse',
        plainLanguageWhy:
          'Floating causes fluid to press gently on the back of your eyes. Catching wavy lines early lets us adjust your glasses or use lower-body suction before vision blurs permanently.',
        stepByStepHowTo: [
          'Open the "Click Vision & Symptoms" tab below.',
          'Cover one eye with your hand and stare at the white dot in the center of the black grid.',
          'Click any square where the grid lines look wavy, bent, or missing.',
          'Click "Record Click Screen" to save and check your Green/Amber/Red score.',
        ],
        colorZoneHint: 'Green = 0 wavy squares · Amber = 1–7 squares · Red = 8+ squares',
      },
      {
        id: 'sc-spine-stretch',
        title: 'Morning Spine Stretch & Self-Check',
        cadence: 'Due Daily 08:00 UTC',
        xpReward: 40,
        targetRegionId: 'spine_lumbar',
        targetTab: 'daily_checkin',
        plainLanguageWhy:
          'Floating stretches your spine like an uncompressed spring, which often makes your lower back ache after waking up.',
        stepByStepHowTo: [
          'Pull both knees gently toward your chest for 10–15 minutes to relieve lower back tension.',
          'Click "Fill Daily Medical Form" at the top of the screen.',
          'Rate your sleep, mood, and mark any aching body spot so the 3D hologram tracks it.',
        ],
        colorZoneHint: 'Green = Pain 0–2/10 · Amber = Pain 3–5/10 · Red = Pain 6+/10',
      },
      {
        id: 'sc-urine-stone',
        title: 'Hydration & Kidney Stone Dipstick',
        cadence: 'Due every 48 hrs',
        xpReward: 35,
        targetRegionId: 'abdomen_renal',
        targetTab: 'keyboard',
        plainLanguageWhy:
          'When bones shed calcium in zero gravity and you drink less water, sharp kidney stones can form. Checking urine concentration keeps you safe.',
        stepByStepHowTo: [
          'Place 1 drop of urine onto the handheld optical refractometer lens.',
          'Read the number (example: 1.012) and type it into "Urine Specific Gravity" under Keyboard Lab Entry.',
          'If Amber or Red appears, drink 500–750 mL of water right away.',
        ],
        colorZoneHint: 'Green = 1.005–1.018 · Amber = 1.020–1.025 · Red = 1.026+',
      },
    ],
  },
  {
    id: 'space_station',
    name: 'Orbital Space Station (0G Low Earth Orbit)',
    shortName: 'Space Station',
    gravityLabel: '0.00 G Orbital',
    commDelayLabel: '0.5s Near Real-Time',
    radiationBaselineUSv: 2.1,
    ambientCO2Baseline: 2.8,
    pressureBaselineKpa: 101.3,
    summary:
      'Aboard a multi-module orbital station, large air volumes can trap exhaled CO2 in stagnant corners, and heavy daily treadmill/resistance workouts prevent bone and heart deconditioning.',
    keyHazards: [
      {
        hazard: 'Stagnant Cabin CO2 Pockets',
        effectOnBody:
          'Without air rising naturally in zero-G, exhaled CO2 pools near desks and sleeping bags, causing throbbing headaches and sluggish thinking.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Exercise Harness Rubbing & Joint Strain',
        effectOnBody:
          'Bungee straps on the station treadmill press hard on shoulders and knees, risking skin chafing or joint soreness.',
        severityTag: 'MODERATE',
      },
      {
        hazard: 'Cardiovascular Deconditioning',
        effectOnBody:
          'Your heart pumps less aggressively when not fighting gravity, shrinking blood volume by 10–15%.',
        severityTag: 'MODERATE',
      },
    ],
    priorityActions: [
      'Keep air circulation fans directed across sleeping restraints and workstations.',
      'Check shoulder skin under the Capsule Camera after heavy treadmill runs.',
      'Log resting Blood Pressure & Heart Rate each morning before exercise.',
    ],
    routines: [
      {
        id: 'iss-bp-check',
        title: 'Morning Blood Pressure & Heart Check',
        cadence: 'Due Daily 07:30 UTC',
        xpReward: 40,
        targetRegionId: 'heart_cardio',
        targetTab: 'keyboard',
        plainLanguageWhy:
          'Your body holds less blood in space. Checking your blood pressure shows if your heart and fluids are strong enough for station work.',
        stepByStepHowTo: [
          'Wrap the automated arm cuff around your relaxed upper arm at heart level.',
          'Press Start and wait 30 seconds for the top number (Systolic BP, e.g., 118).',
          'Type that number into "Systolic Blood Pressure" in Keyboard Lab Entry.',
        ],
        colorZoneHint: 'Green = 95–128 mmHg · Amber = 132–149 · Red = <85 or >=150',
      },
      {
        id: 'iss-harness-cam',
        title: 'Post-Workout Shoulder Skin Check',
        cadence: 'Due After Treadmill Run',
        xpReward: 35,
        targetRegionId: 'shoulders_joints',
        targetTab: 'camera',
        plainLanguageWhy:
          'Tight bungee straps used to hold you down on the treadmill can bruise or break skin on your shoulders before you feel it.',
        stepByStepHowTo: [
          'Open the "Camera & Ultrasound" tab below.',
          'Capture a photo of your collarbone/shoulder or load the Dermal Harness Check scan.',
          'Check the Redness/Erythema Index and add gel pads if redness is elevated.',
        ],
        colorZoneHint: 'Green = <20% redness · Amber = 20–35% · Red = >35%',
      },
      {
        id: 'iss-co2-headache',
        title: 'CO2 & Sleep Fatigue Quick Screen',
        cadence: 'Due Evening 20:00 UTC',
        xpReward: 30,
        targetRegionId: 'head_brain',
        targetTab: 'mouse',
        plainLanguageWhy:
          'Elevated carbon dioxide inside station modules silently triggers dull headaches and poor sleep.',
        stepByStepHowTo: [
          'Verify your desk fan is spinning and check Cabin PCO2 in the Vitals grid.',
          'Click any active symptoms (such as frontal headache) in the Mouse Click tab.',
        ],
        colorZoneHint: 'Green = <3.0 mmHg CO2 · Amber = 3.5–5.0 · Red = >5.0 mmHg',
      },
    ],
  },
  {
    id: 'rover',
    name: 'Pressurized Surface Rover (Mobile Traverse)',
    shortName: 'Surface Rover',
    gravityLabel: '0.16G – 0.38G Mobile',
    commDelayLabel: 'Terrain-Dependent Relay',
    radiationBaselineUSv: 4.8,
    ambientCO2Baseline: 3.1,
    pressureBaselineKpa: 82.5,
    summary:
      'Inside a compact pressurized rover during multi-day surface traverses, tight cabin volume limits movement, continuous terrain vibration stresses the lower back, and hard physical EVA sorties burn blood sugar quickly.',
    keyHazards: [
      {
        hazard: 'Low Cabin Volume & Rapid CO2 Rise',
        effectOnBody:
          'Two crew members inside a small rover cabin use oxygen and exhale CO2 rapidly—making tiredness and breathing rate spike faster.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'High-Exertion EVA Blood Sugar Drops',
        effectOnBody:
          'Walking in a stiff pressurized suit over rocky terrain burns massive calories, risking shaky low blood sugar (hypoglycemia).',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Cramped Cockpit Posture & Vibration',
        effectOnBody:
          'Hours seated driving over craters compresses the lower spine and stiffens knees and hips.',
        severityTag: 'MODERATE',
      },
    ],
    priorityActions: [
      'Check Blood Glucose (mg/dL) before suiting up for any rover surface EVA.',
      'Monitor Blood Lactate after rock-sampling climbs to catch hidden exhaustion.',
      'Stand and stretch knees/lower back every 2 hours during rover stops.',
    ],
    routines: [
      {
        id: 'rov-glucose',
        title: 'Pre-EVA Blood Sugar Fuel Check',
        cadence: 'Due Before Every Sortie',
        xpReward: 50,
        targetRegionId: 'abdomen_renal',
        targetTab: 'keyboard',
        plainLanguageWhy:
          'Working in a heavy spacesuit burns energy fast. If your blood sugar drops too low inside the suit, you can feel dizzy or faint.',
        stepByStepHowTo: [
          'Clean one fingertip with an alcohol wipe and let it dry.',
          'Use the finger-prick lancet and touch the test strip to a small drop of blood.',
          'Type the mg/dL number into "Blood Glucose" in Keyboard Lab Entry.',
        ],
        colorZoneHint: 'Green = 70–110 mg/dL · Amber = 115–159 · Red = <68 or >=160',
      },
      {
        id: 'rov-lactate',
        title: 'Post-Sortie Muscle Fatigue (Lactate)',
        cadence: 'Due After Suit Doffing',
        xpReward: 40,
        targetRegionId: 'legs_musculoskeletal',
        targetTab: 'keyboard',
        plainLanguageWhy:
          'Lactate builds up in muscles when working hard without enough oxygen. Checking it confirms your legs and lungs recovered safely.',
        stepByStepHowTo: [
          'Wait 10 minutes after removing your EVA suit.',
          'Enter your portable Lactate meter reading (mmol/L) into Keyboard Lab Entry.',
          'Drink 500 mL electrolyte solution and stretch calves if elevated.',
        ],
        colorZoneHint: 'Green = 0.5–2.0 mmol/L · Amber = 2.1–2.4 · Red = 2.5+',
      },
    ],
  },
  {
    id: 'planetary_base',
    name: 'Lunar / Martian Planetary Surface Base',
    shortName: 'Planetary Base',
    gravityLabel: '0.16 G (Moon) / 0.38 G (Mars)',
    commDelayLabel: '1.3s Moon · 14m+ Mars',
    radiationBaselineUSv: 5.5,
    ambientCO2Baseline: 2.4,
    pressureBaselineKpa: 56.5,
    summary:
      'At a permanent planetary habitat operating at lower cabin pressure (56–65 kPa) with partial gravity, astronauts face razor-sharp regolith dust risks to the lungs, partial-G orthostatic adjustments, and surface solar storm alerts.',
    keyHazards: [
      {
        hazard: 'Toxic Lunar / Martian Regolith Dust',
        effectOnBody:
          'Microscopic jagged surface dust tracked in through airlocks irritates eyes, skin, and deep lung tissue—lowering oxygen transfer.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Partial-Gravity Orthostatic Dizziness',
        effectOnBody:
          'Standing up in 0.16G–0.38G after months in zero-G pulls blood toward the legs, causing lightheadedness if hydration is low.',
        severityTag: 'MODERATE',
      },
      {
        hazard: 'Surface Solar Particle Events (SPE)',
        effectOnBody:
          'Without a thick atmosphere, solar storms require sheltering inside regolith-covered habitat bunkers.',
        severityTag: 'HIGH',
      },
    ],
    priorityActions: [
      'Check SpO2 lung oxygen level immediately after any dusty airlock operation.',
      'Wear +1.25D eye protection & rinse eyes if regolith dust enters the habitat.',
      'Monitor Intraocular Pressure (IOP) & ONSD weekly to track partial-gravity recovery.',
    ],
    routines: [
      {
        id: 'base-lungs-dust',
        title: 'Post-Airlock Lung & Oxygen Check',
        cadence: 'Due After Surface Work',
        xpReward: 45,
        targetRegionId: 'lungs_respiratory',
        targetTab: 'mouse',
        plainLanguageWhy:
          'Moon and Mars dust is razor-sharp and sticks to everything. Checking your breathing and oxygen makes sure dust has not irritated your lungs.',
        stepByStepHowTo: [
          'Verify your finger pulse oximeter shows SpO2 >= 95% in the Vitals grid.',
          'Open "Click Vision & Symptoms" and flag any cough, sinus irritation, or shortness of breath.',
          'Run the HEPA airlock vacuum cycle before removing base goggles.',
        ],
        colorZoneHint: 'Green = SpO2 96–100% · Amber = 92–95% · Red = <92%',
      },
      {
        id: 'base-eye-ultrasound',
        title: 'Weekly Optic Nerve Ultrasound Scan',
        cadence: 'Due Weekly Sol 7',
        xpReward: 55,
        targetRegionId: 'eyes_ocular',
        targetTab: 'camera',
        plainLanguageWhy:
          'A painless sound-wave scan behind the eye tells us whether fluid pressure in your head is settling down under Moon/Mars gravity.',
        stepByStepHowTo: [
          'Apply ultrasound gel over a closed eyelid and capture the scan.',
          'In "Camera & Ultrasound", click the left and right edges of the optic nerve sheath 3mm below the eyeball.',
          'Verify the measured millimeter reading is below 5.0 mm (Green).',
        ],
        colorZoneHint: 'Green = <5.0 mm · Amber = 5.0–5.7 mm · Red = >=5.8 mm',
      },
    ],
  },
  {
    id: 'earth_remote',
    name: 'On Earth · Remote / Unknown Internet Field Site',
    shortName: 'Earth (Remote / Offline)',
    gravityLabel: '1.00 G Earth Gravity',
    commDelayLabel: '0s Local · Offline Safe',
    radiationBaselineUSv: 0.1,
    ambientCO2Baseline: 0.4,
    pressureBaselineKpa: 101.3,
    summary:
      'Operating on Earth in a remote location, expedition camp, or spot with unknown/unavailable internet. Full 1.00G gravity applies, natural atmospheric radiation is low (0.1 µSv/h), and HelioMed runs 100% locally in your browser with zero internet needed.',
    keyHazards: [
      {
        hazard: 'Unknown / Spotty Internet Access',
        effectOnBody:
          'Without reliable internet to reach a clinic, daily tracking, dehydration alerts, and clear step-by-step first-response guides must work completely offline.',
        severityTag: 'MODERATE',
      },
      {
        hazard: 'Heat, Altitude & Dehydration Strain',
        effectOnBody:
          'Long outdoor field work, unfamiliar climates, or poor indoor airflow can trigger headaches, muscle cramps, and dizziness.',
        severityTag: 'HIGH',
      },
      {
        hazard: 'Sleep Disruption & Field Fatigue',
        effectOnBody:
          'Shifting schedules or stressful travel cuts deep sleep—slowing focus, mood stability, and physical reaction times.',
        severityTag: 'MODERATE',
      },
    ],
    priorityActions: [
      'Complete your 1-minute Daily Check-In each morning—everything saves right on your device even offline.',
      'Drink 2–2.5 L of water daily and replenish electrolytes during warm or active field work.',
      'Use the Emergency & Safety guides if sudden breathing trouble, dizziness, or eye irritation occurs.',
    ],
    routines: [
      {
        id: 'earth-hydration-check',
        title: 'Daily Hydration & Fatigue Check',
        cadence: 'Due Daily Morning',
        xpReward: 35,
        targetRegionId: 'abdomen_renal',
        targetTab: 'daily_checkin',
        plainLanguageWhy:
          'Even on Earth, mild dehydration drops your energy and causes headaches before you feel thirsty.',
        stepByStepHowTo: [
          'Open Tab 1 (Daily Check-In) and log how many hours you slept and your mood.',
          'Drink one 500 mL glass of water or electrolyte drink right after submitting.',
          'Check your pre-written action plan for today.',
        ],
        colorZoneHint: 'Green = 7+ hrs sleep & hydrated · Amber = Tired · Red = Dizzy or dehydrated',
      },
      {
        id: 'earth-vitals-check',
        title: 'Resting Heart & Oxygen Quick Scan',
        cadence: 'Due Every 48 hrs',
        xpReward: 40,
        targetRegionId: 'heart_cardio',
        targetTab: 'keyboard',
        plainLanguageWhy:
          'Checking resting heart rate and blood oxygen confirms your body is adapting well to local air, altitude, and workload.',
        stepByStepHowTo: [
          'Sit quietly for 2 minutes and measure blood pressure or finger oxygen if you have a cuff/oximeter.',
          'Enter your Systolic BP in the Exam Workbench under Tab 2.',
          'Inspect any yellow or red alerts on the 3D Body Twin.',
        ],
        colorZoneHint: 'Green = 95–128 mmHg & SpO2 96–100% · Amber/Red = Rest and hydrate',
      },
    ],
  },
];

export interface IndicatorPlainGuide {
  id: string;
  title: string;
  unit: string;
  whatItIs: string;
  howToMeasureSimple: string[];
  colorMeaning: {
    green: string;
    amber: string;
    red: string;
  };
  riskIfIgnored: string;
}

export const INDICATOR_SIMPLE_GUIDES: Record<string, IndicatorPlainGuide> = {
  glucose: {
    id: 'glucose',
    title: 'Blood Sugar (Glucose)',
    unit: 'mg/dL',
    whatItIs:
      'Measures how much sugar fuel is circulating in your blood to power your brain and muscles during spacewalks and workouts.',
    howToMeasureSimple: [
      'Wash and dry your fingertip with a clean wipe.',
      'Insert a test strip into the handheld glucometer.',
      'Gently prick the side of your finger, touch the blood drop to the strip, and type the number shown.',
    ],
    colorMeaning: {
      green: '70–110 mg/dL: Steady energy for flying and spacewalks.',
      amber: '115–159 mg/dL: Slightly high—stretch, hydrate, or do light cycling.',
      red: 'Under 68 or over 160 mg/dL: Eat a 15g sugar gel if low; alert Ground Doctors if very high.',
    },
    riskIfIgnored: 'Too low causes sudden shakiness or fainting inside a spacesuit; consistently high blood sugar slows healing.',
  },
  onsd: {
    id: 'onsd',
    title: 'Optic Nerve Sheath Width (ONSD)',
    unit: 'mm',
    whatItIs:
      'Measures swelling around the nerve connecting your eye to your brain. In zero gravity, body fluids float upward and can press on this nerve.',
    howToMeasureSimple: [
      'Close one eye and place sterile gel on the ultrasound probe.',
      'Hold the probe gently on your closed eyelid until the dark eyeball appears.',
      'Use the 2-point caliper tool to measure across the nerve stalk 3mm behind the eyeball.',
    ],
    colorMeaning: {
      green: 'Under 5.0 mm: Healthy fluid pressure around the optic nerve.',
      amber: '5.0–5.7 mm: Mild swelling—use Lower Body Negative Pressure pants.',
      red: '5.8 mm or higher: Strong headward pressure—notify Earth Flight Surgeons promptly.',
    },
    riskIfIgnored: 'Untreated nerve swelling can permanently flatten the back of the eye and blur close-up reading vision.',
  },
  iop: {
    id: 'iop',
    title: 'Eye Fluid Pressure (IOP)',
    unit: 'mmHg',
    whatItIs:
      'Measures the internal fluid firmness inside your eyeball, similar to checking air pressure in a tire.',
    howToMeasureSimple: [
      'Look straight ahead at a fixed point on the module wall.',
      'Hold the handheld Tono-Pen gently perpendicular to the center of your eye.',
      'Wait for the soft beep and enter the displayed mmHg number.',
    ],
    colorMeaning: {
      green: '10–20 mmHg: Safe, balanced internal eye pressure.',
      amber: '21–23 mmHg: Mildly elevated—avoid holding your breath while lifting weights.',
      red: '24 mmHg+ or <8 mmHg: Needs repeat check and Flight Surgeon evaluation.',
    },
    riskIfIgnored: 'High pressure squeezes delicate vision fibers over months of spaceflight.',
  },
  urine_sg: {
    id: 'urine_sg',
    title: 'Hydration / Urine Concentration (SG)',
    unit: 'SG',
    whatItIs:
      'Shows whether you are drinking enough water. Clear, diluted urine prevents painful kidney stones caused by calcium leaving your bones in microgravity.',
    howToMeasureSimple: [
      'Collect a small sample using the urine collection funnel.',
      'Place 1 drop onto the handheld refractometer window and close the lid.',
      'Look through the eyepiece or digital screen and record the 1.xxx number.',
    ],
    colorMeaning: {
      green: '1.005–1.018: Well hydrated and protected against kidney stones.',
      amber: '1.020–1.025: Mildly dehydrated—drink 2 extra water pouches today.',
      red: '1.026 or higher: High kidney stone risk—rehydrate with 750 mL electrolytes immediately.',
    },
    riskIfIgnored: 'Concentrated urine crystallizes bone calcium into kidney stones, which can cause severe incapacitating pain far from a hospital.',
  },
  lactate: {
    id: 'lactate',
    title: 'Muscle & Oxygen Stress (Lactate)',
    unit: 'mmol/L',
    whatItIs:
      'Shows whether your muscles and organs are getting enough oxygen or working too hard without recovery.',
    howToMeasureSimple: [
      'Sit or float quietly for 10 minutes after physical exercise.',
      'Take a tiny fingertip drop onto the lactate meter strip.',
      'Enter the mmol/L value into the keyboard box.',
    ],
    colorMeaning: {
      green: '0.5–2.0 mmol/L: Normal oxygen delivery and healthy muscle recovery.',
      amber: '2.1–2.4 mmol/L: Mild leftover workout fatigue—hydrate and rest.',
      red: '2.5+ mmol/L at rest: Check oxygen (SpO2) and cabin air pressure right away.',
    },
    riskIfIgnored: 'Elevated resting lactate can warn of silent cabin low-oxygen (hypoxia) or overtraining injury.',
  },
  systolic_bp: {
    id: 'systolic_bp',
    title: 'Systolic Blood Pressure',
    unit: 'mmHg',
    whatItIs:
      'The top blood pressure number—showing how strongly your heart pushes oxygen-rich blood up to your brain.',
    howToMeasureSimple: [
      'Wrap the blood pressure cuff snugly around your bare upper arm.',
      'Keep your arm relaxed at chest level and stay still.',
      'Press Start and type the top number (usually around 110–125) into the dashboard.',
    ],
    colorMeaning: {
      green: '95–128 mmHg: Strong, steady circulation.',
      amber: '88–94 or 132–149 mmHg: Watch hydration, stress, and cabin CO2.',
      red: 'Under 85 or 150+ mmHg: Fainting or vascular strain risk—rest and alert Earth Doctors.',
    },
    riskIfIgnored: 'Too low causes blackouts when returning to Moon/Mars/Earth gravity; too high strains blood vessels.',
  },
};
