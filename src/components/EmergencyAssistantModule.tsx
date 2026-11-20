import React, { useState, useEffect, useRef } from 'react';
import {
  Siren,
  Wind,
  Brain,
  Radiation,
  Droplets,
  Eye,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  VolumeX,
  Timer,
  RotateCcw,
  Radio,
  ShieldAlert,
  Play,
  HeartHandshake,
  Award,
  Sparkles,
  X,
} from 'lucide-react';
import { SimulationScenario } from '../types/heliomed';
import { SPACEFLIGHT_SCENARIOS } from '../data/spaceflightScenarios';
import {
  EmergencyHardwareIllustration,
  EmergencyToolKey,
} from './EmergencyHardwareIllustration';

export interface EmergencyLogRecord {
  id: string;
  emergencyTitle: string;
  timestampUtc: string;
  stepsCompleted: number;
  totalSteps: number;
  outcomeNote: string;
}

interface EmergencyStep {
  stepTitle: string;
  simpleAction: string;
  hardwareToGrab: string;
  toolKey: EmergencyToolKey;
  whyThisHelps: string;
  timerSeconds: number;
  calmBreathCue?: boolean;
  recheckPrompt: string;
}

interface EmergencyGuide {
  id: string;
  shortTitle: string;
  humanSymptomLabel: string;
  severityLabel: 'IMMEDIATE SOS' | 'URGENT ACTION';
  targetRegionId: string;
  linkedScenarioId: string;
  iconName: 'wind' | 'brain' | 'radiation' | 'droplets' | 'eye';
  reassuranceLine: string;
  redFlagSigns: string[];
  steps: EmergencyStep[];
  whenNormalLooksLike: string;
}

const EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: 'trouble_breathing',
    shortTitle: 'Trouble Breathing / Low Oxygen',
    humanSymptomLabel: 'Gasping for air, chest tightness, blue lips, or SpO2 below 92%',
    severityLabel: 'IMMEDIATE SOS',
    targetRegionId: 'lungs_respiratory',
    linkedScenarioId: 'scenario-decompression',
    iconName: 'wind',
    reassuranceLine:
      'Stay calm—you can restore safe oxygen in under 60 seconds using the green mask beside every hatch.',
    redFlagSigns: [
      'Finger oxygen meter (SpO2) drops under 92%',
      'Ear popping or whistling air leak sound',
      'Feeling confused, dizzy, or tingling fingers',
    ],
    steps: [
      {
        stepTitle: 'Put On Emergency Oxygen Mask First',
        simpleAction:
          'Pull the green oxygen mask firmly over your nose and mouth and twist the green valve open until you hear steady airflow.',
        hardwareToGrab: 'Green O2 Bottle + Clear Seal Mask (Emergency Rack B2)',
        toolKey: 'o2_mask_bottle',
        whyThisHelps:
          'Delivers 100% pure oxygen directly into your lungs so your brain stays clear even if cabin air pressure is dropping.',
        timerSeconds: 45,
        calmBreathCue: true,
        recheckPrompt: 'Confirm cool air is flowing into the mask and mask edges seal tightly.',
      },
      {
        stepTitle: 'Seal Bulkhead Hatch & Check Cabin Pressure',
        simpleAction:
          'Look at the wall Pressure gauge. If below 95 kPa (or below 54 kPa in Moon Base), close the module hatch latch and turn on N2/O2 repressurization.',
        hardwareToGrab: 'Manual Bulkhead Hatch Lever + Wall ECLSS Repress Switch',
        toolKey: 'hatch_repress',
        whyThisHelps:
          'Stops air from escaping into space and prevents decompression sickness ("the bends").',
        timerSeconds: 60,
        recheckPrompt: 'Confirm hatch handle is locked GREEN and pressure needle stops falling.',
      },
      {
        stepTitle: 'Re-Check Finger Oxygen & Joint Comfort',
        simpleAction:
          'Clip the pulse oximeter onto a warm finger and sit still for 30 seconds while breathing slowly through the mask.',
        hardwareToGrab: 'Fingertip Pulse Oximeter (Medical Pouch 1)',
        toolKey: 'pulse_oximeter',
        whyThisHelps:
          'Proves your blood oxygen is climbing back above 95% and confirms no sharp shoulder/knee gas-bubble pain.',
        timerSeconds: 30,
        calmBreathCue: true,
        recheckPrompt: 'SpO2 should read 95–100%. Keep mask on until Earth Flight Surgeons clear cabin air.',
      },
    ],
    whenNormalLooksLike: 'SpO2 stays at 96–100%, breathing slows below 18/min, and dizziness clears.',
  },
  {
    id: 'co2_headache',
    shortTitle: 'Pounding Headache & Brain Fog (High CO2)',
    humanSymptomLabel: 'Throbbing forehead pain, flushed face, slow thinking, or CO2 above 4.5 mmHg',
    severityLabel: 'URGENT ACTION',
    targetRegionId: 'head_brain',
    linkedScenarioId: 'scenario-hypercapnia',
    iconName: 'brain',
    reassuranceLine:
      'In zero gravity, exhaled breath builds an invisible bubble around your head unless fans keep air moving.',
    redFlagSigns: [
      'Throbbing headache that feels worse when floating still',
      'Cabin CO2 gauge shows Amber/Red (> 4.0 mmHg)',
      'Fast heart rate (> 100 bpm) while resting',
    ],
    steps: [
      {
        stepTitle: 'Move Into Moving Airflow & Turn Fans to 100%',
        simpleAction:
          'Float away from tight sleeping corners into the center aisle and flip the Cabin Circulation Fans to MAX.',
        hardwareToGrab: 'Module Airflow Control Panel (Fan Boost Switch)',
        toolKey: 'fan_boost',
        whyThisHelps:
          'Breaks up stagnant invisible pockets of exhaled carbon dioxide around your nose and mouth.',
        timerSeconds: 30,
        calmBreathCue: true,
        recheckPrompt: 'Feel steady air moving across your face.',
      },
      {
        stepTitle: 'Swap Saturated CO2 Scrubber Canister',
        simpleAction:
          'Follow the yellow arrows on the ECLSS Air Rack to latch a fresh white LiOH scrubber cartridge in place.',
        hardwareToGrab: 'Fresh LiOH / Amine Scrubber Canister (Locker A4)',
        toolKey: 'lioh_scrubber',
        whyThisHelps:
          'Captures trapped carbon dioxide out of the cabin air so headache pressure eases quickly.',
        timerSeconds: 90,
        recheckPrompt: 'Watch Cabin CO2 reading drop toward 2.5 mmHg.',
      },
      {
        stepTitle: 'Relieve Headache Pain & Hydrate',
        simpleAction:
          'Swallow 1 ibuprofen tablet (400–600 mg) with a full 500 mL water pouch, and use 100% O2 mask for 10 minutes if headache persists.',
        hardwareToGrab: 'Oral Pain Pack (Bin 3-Blue) + 500 mL Water Pouch',
        toolKey: 'pain_pack_water',
        whyThisHelps:
          'Calms swollen blood vessels in the brain caused by high CO2.',
        timerSeconds: 45,
        recheckPrompt: 'Record headache relief after 20 minutes; flag Earth Console if vision blurs.',
      },
    ],
    whenNormalLooksLike: 'Cabin CO2 below 2.8 mmHg, forehead pressure fades, and thinking feels sharp again.',
  },
  {
    id: 'solar_storm',
    shortTitle: 'Solar Radiation Storm Alarm',
    humanSymptomLabel: 'Dosimeter alarm > 15 µSv/h, solar flare warning, or sudden nausea wave',
    severityLabel: 'IMMEDIATE SOS',
    targetRegionId: 'head_brain',
    linkedScenarioId: 'scenario-radiation',
    iconName: 'radiation',
    reassuranceLine:
      'Water and polyethylene bags block solar protons effectively—getting inside the core shelter cuts your dose by over 75%.',
    redFlagSigns: [
      'Radiation rate jumps above 15 µSv/h',
      'Solar Particle Event (SPE) siren sounds',
      'Sudden stomach upset or metallic taste',
    ],
    steps: [
      {
        stepTitle: 'Get Inside the Water-Wall Storm Shelter Immediately',
        simpleAction:
          'Stop non-essential tasks and crawl inside the central core rack surrounded by water bladders and food packs (or regolith bunker at Surface Base).',
        hardwareToGrab: 'Core Water-Wall Shelter Zone + Personal Badge Dosimeter',
        toolKey: 'water_wall_dosimeter',
        whyThisHelps:
          'Hydrogen inside water packs absorbs dangerous solar protons before they reach your organs.',
        timerSeconds: 45,
        calmBreathCue: true,
        recheckPrompt: 'Confirm personal dosimeter rate drops sharply inside shelter.',
      },
      {
        stepTitle: 'Point Spacecraft Tanks Toward the Sun',
        simpleAction:
          'Hit the attitude preset "SPE-SHIELD" (if in spacecraft) so heavy propellant and water tanks sit between you and the Sun.',
        hardwareToGrab: 'Flight Console Attitude Preset (SPE-SHIELD)',
        toolKey: 'spe_attitude_console',
        whyThisHelps:
          'Adds an extra meter of dense mass shielding while the solar wave passes.',
        timerSeconds: 30,
        recheckPrompt: 'Confirm shield orientation active on status monitor.',
      },
      {
        stepTitle: 'Take Antioxidant Protection Pack',
        simpleAction:
          'Take 1 Radiation Countermeasure blister pack (N-acetylcysteine + Vitamin C/E) with water, plus anti-nausea tablet if queasy.',
        hardwareToGrab: 'Radiation Kit (Orange Pouch R-1)',
        toolKey: 'radiation_kit_r1',
        whyThisHelps:
          'Neutralizes cellular free radicals created by radiation particles during the storm.',
        timerSeconds: 60,
        recheckPrompt: 'Stay sheltered until Radiation Monitor shows < 5 µSv/h for 30 continuous minutes.',
      },
    ],
    whenNormalLooksLike: 'Dosimeter returns below 5 µSv/h and storm shelter all-clear sounds.',
  },
  {
    id: 'low_sugar_faint',
    shortTitle: 'Shaky, Cold Sweat, or Feeling Faint',
    humanSymptomLabel: 'Sudden trembling, cold sweat, dizziness when standing, or glucose < 68 mg/dL',
    severityLabel: 'URGENT ACTION',
    targetRegionId: 'abdomen_renal',
    linkedScenarioId: 'scenario-cardiac',
    iconName: 'droplets',
    reassuranceLine:
      'Do NOT try to stand or stay inside a heavy suit while dizzy—fast sugar gel and salty fluids fix this within 15 minutes.',
    redFlagSigns: [
      'Blood glucose meter reads under 68 mg/dL',
      'Cold sweat, shaky hands, or sudden weakness',
      'Blacking out / tunnel vision when standing in Moon/Mars gravity',
    ],
    steps: [
      {
        stepTitle: 'Lie Flat or Secure Yourself Safely',
        simpleAction:
          'Strap into a seat or lie flat on the floor with your legs raised slightly higher than your chest.',
        hardwareToGrab: 'Bungee Restraint Strap or Floor Footloops',
        toolKey: 'bungee_footloops',
        whyThisHelps:
          'Instantly restores blood flow to your brain so you do not faint or fall.',
        timerSeconds: 30,
        calmBreathCue: true,
        recheckPrompt: 'Tunnel vision should ease within 20 seconds of lying flat.',
      },
      {
        stepTitle: 'Squeeze 1 Fast-Acting Glucose Gel (15g)',
        simpleAction:
          'Check blood sugar if unsure. If under 70 mg/dL—or if sweaty & shaky—squeeze 1 entire 15g Glucose Gel pouch into your mouth.',
        hardwareToGrab: 'Orange Glucose Gel Pouch (15g) + Glucometer',
        toolKey: 'glucose_gel_meter',
        whyThisHelps:
          'Simple sugar absorbs rapidly into the bloodstream to refuel your brain in 10–15 minutes.',
        timerSeconds: 60,
        recheckPrompt: 'Wait 15 minutes, then re-test finger blood sugar to confirm >= 80 mg/dL.',
      },
      {
        stepTitle: 'Drink Salty Electrolytes Slowly',
        simpleAction:
          'Sip 500 mL of Oral Rehydration / Electrolyte mix to rebuild blood pressure, especially before standing in 0.16G–0.38G gravity.',
        hardwareToGrab: 'Electrolyte Mix + 500 mL Water Pouch',
        toolKey: 'electrolyte_water',
        whyThisHelps:
          'Restores lost blood volume so your heart does not have to race when you sit or stand up.',
        timerSeconds: 45,
        recheckPrompt: 'Confirm Systolic Blood Pressure rises above 95 mmHg before resuming duties.',
      },
    ],
    whenNormalLooksLike: 'Blood glucose 80–110 mg/dL, Systolic BP >= 95 mmHg, hands steady.',
  },
  {
    id: 'eye_dust_vision',
    shortTitle: 'Blurry Vision or Painful Dust in Eye',
    humanSymptomLabel: 'Wavy Amsler lines, gritty eye pain after airlock work, or eye redness',
    severityLabel: 'URGENT ACTION',
    targetRegionId: 'eyes_ocular',
    linkedScenarioId: 'scenario-cardiac',
    iconName: 'eye',
    reassuranceLine:
      'NEVER rub your eyes after Moon/Mars airlock work—surface dust has sharp glass-like edges. Gentle sterile saline flush is always Step 1.',
    redFlagSigns: [
      'Gritty feeling or tearing after suit doffing',
      'Straight lines look wavy on the Amsler Eye Grid',
      'ONSD ultrasound > 5.8 mm or Eye Pressure > 24 mmHg',
    ],
    steps: [
      {
        stepTitle: 'Do NOT Rub — Flush Gently With Sterile Saline',
        simpleAction:
          'Hold the sterile eyewash cup over the irritated eye, tilt gently, and blink repeatedly for 60 seconds to float dust particles out.',
        hardwareToGrab: 'Sterile Eyewash Cup + Saline Bottle (Airlock Med Kit)',
        toolKey: 'eyewash_saline',
        whyThisHelps:
          'Rubbing grinds razor-sharp regolith into the cornea; continuous saline floats particles out harmlessly.',
        timerSeconds: 60,
        recheckPrompt: 'Pain or scratching sensation should begin fading immediately.',
      },
      {
        stepTitle: 'Run Amsler Grid & Closed-Eyelid Ultrasound',
        simpleAction:
          'If vision is blurry without dust, cover one eye and run the Amsler Grid + Ultrasound ONSD caliper in the Exam Workbench.',
        hardwareToGrab: 'Amsler Eye Screen + Handheld Ultrasound Probe',
        toolKey: 'amsler_ultrasound',
        whyThisHelps:
          'Separates a surface eye scratch from zero-gravity brain fluid pressure (SANS) behind the eye.',
        timerSeconds: 45,
        recheckPrompt: 'Check whether ONSD is < 5.0 mm (Green) or >= 5.8 mm (Red).',
      },
      {
        stepTitle: 'Apply Relief Drop or Fluid-Shift Countermeasure',
        simpleAction:
          'For dust scratch: use 1 drop sterile lubricating gel & shield eye. For ONSD swelling: schedule 45 min Lower Body Suction (LBNP) & try backup +1.25D Space Anticipation Glasses.',
        hardwareToGrab: 'Lubricating Eye Drops OR +1.25D Space Glasses',
        toolKey: 'eye_drops_glasses',
        whyThisHelps:
          'Protects healing eye tissue or immediately sharpens near reading vision while ground doctors review your ultrasound.',
        timerSeconds: 30,
        recheckPrompt: 'Confirm scan & log are queued for Earth Flight Surgeon review.',
      },
    ],
    whenNormalLooksLike: 'Zero gritty pain, clear crisp reading vision, and Green ONSD (< 5.0 mm).',
  },
];

interface EmergencyAssistantModuleProps {
  astronautName: string;
  currentXp: number;
  onSimulateEmergency: (scenario: SimulationScenario | null, regionId: string | null) => void;
  onLogEmergencyXp: (xp: number) => void;
  onOpenBodyTwin?: () => void;
}

export const EmergencyAssistantModule: React.FC<EmergencyAssistantModuleProps> = ({
  astronautName,
  currentXp,
  onSimulateEmergency,
  onLogEmergencyXp,
  onOpenBodyTwin,
}) => {
  const [selectedGuideId, setSelectedGuideId] = useState<string>('trouble_breathing');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [runCompleted, setRunCompleted] = useState<boolean>(false);
  const [completionBanner, setCompletionBanner] = useState<{
    title: string;
    xpEarned: number;
    newTotalXp: number;
  } | null>(null);
  const [liveDrillActiveTitle, setLiveDrillActiveTitle] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(EMERGENCY_GUIDES[0].steps[0].timerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'EXHALE'>('INHALE');
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem('heliomed_emergency_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeGuide =
    EMERGENCY_GUIDES.find((g) => g.id === selectedGuideId) || EMERGENCY_GUIDES[0];
  const currentStep = activeGuide.steps[currentStepIdx] || activeGuide.steps[0];

  // Offline Web Audio API soft chime (0 internet dependencies)
  const playSoftTone = (freq: number, durationSec = 0.14) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // ignore audio restrictions
    }
  };

  // Timer countdown loop
  useEffect(() => {
    if (!isTimerRunning) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          playSoftTone(660, 0.25);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, soundEnabled]);

  // Calm 4-second breathing pacer for stressful emergencies
  useEffect(() => {
    if (!currentStep.calmBreathCue) return;
    const id = setInterval(() => {
      setBreathPhase((prev) => {
        const next = prev === 'INHALE' ? 'EXHALE' : 'INHALE';
        if (soundEnabled) {
          playSoftTone(next === 'INHALE' ? 440 : 330, 0.12);
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [currentStep.calmBreathCue, soundEnabled]);

  const handleSelectGuide = (guide: EmergencyGuide) => {
    setSelectedGuideId(guide.id);
    setCurrentStepIdx(0);
    setCompletedSteps({});
    setRunCompleted(false);
    setCompletionBanner(null);
    setSecondsLeft(guide.steps[0].timerSeconds);
    setIsTimerRunning(false);
  };

  const handleRestartDrill = () => {
    setCurrentStepIdx(0);
    setCompletedSteps({});
    setRunCompleted(false);
    setCompletionBanner(null);
    setSecondsLeft(activeGuide.steps[0].timerSeconds);
    setIsTimerRunning(false);
  };

  const handleChangeStep = (nextIdx: number) => {
    setCurrentStepIdx(nextIdx);
    setSecondsLeft(activeGuide.steps[nextIdx].timerSeconds);
    setIsTimerRunning(false);
  };

  const handleCompleteStep = () => {
    const nextDone = { ...completedSteps, [currentStepIdx]: true };
    if (currentStepIdx === activeGuide.steps.length - 1) {
      // Ensure every step up through the final step displays checked on finish
      activeGuide.steps.forEach((_, idx) => {
        nextDone[idx] = true;
      });
    }
    setCompletedSteps(nextDone);
    playSoftTone(587, 0.16);

    if (currentStepIdx < activeGuide.steps.length - 1) {
      handleChangeStep(currentStepIdx + 1);
    } else {
      setIsTimerRunning(false);
      if (!runCompleted) {
        const doneCount = activeGuide.steps.length;
        const newRecord: EmergencyLogRecord = {
          id: `emg-${Date.now()}`,
          emergencyTitle: activeGuide.shortTitle,
          timestampUtc:
            new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
            }) + ' UTC',
          stepsCompleted: doneCount,
          totalSteps: activeGuide.steps.length,
          outcomeNote: `Crew ${astronautName} completed ${doneCount}/${activeGuide.steps.length} guided steps (+60 XP). Queued for Earth DSN sync.`,
        };
        const updated = [newRecord, ...emergencyLogs.slice(0, 4)];
        setEmergencyLogs(updated);
        try {
          localStorage.setItem('heliomed_emergency_logs', JSON.stringify(updated));
        } catch {
          // ignore
        }
        onLogEmergencyXp(60);
        setRunCompleted(true);
        setCompletionBanner({
          title: activeGuide.shortTitle,
          xpEarned: 60,
          newTotalXp: currentXp + 60,
        });
        playSoftTone(784, 0.28);
      } else {
        // Re-display banner if user clicks Finish again before resetting
        setCompletionBanner({
          title: activeGuide.shortTitle,
          xpEarned: 60,
          newTotalXp: currentXp,
        });
      }
    }
  };

  const handleTriggerDrillOnDashboard = () => {
    const sc = SPACEFLIGHT_SCENARIOS.find((s) => s.id === activeGuide.linkedScenarioId) || null;
    onSimulateEmergency(sc, activeGuide.targetRegionId);
    setLiveDrillActiveTitle(activeGuide.shortTitle);
  };

  const handleClearDrill = () => {
    onSimulateEmergency(null, null);
    setLiveDrillActiveTitle(null);
  };

  const renderIcon = (name: EmergencyGuide['iconName'], cls = 'w-4 h-4') => {
    switch (name) {
      case 'wind':
        return <Wind className={cls} />;
      case 'brain':
        return <Brain className={cls} />;
      case 'radiation':
        return <Radiation className={cls} />;
      case 'droplets':
        return <Droplets className={cls} />;
      case 'eye':
        return <Eye className={cls} />;
    }
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const allStepsDone = completedCount === activeGuide.steps.length;

  return (
    <section
      id="emergency-sos-wizard"
      className="bg-slate-900/95 border border-rose-900/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700/70 text-rose-300 flex-shrink-0">
            <Siren className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Emergency First-Response Wizard (Non-Doctor Crew Guide)
              </h3>
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700/70 text-rose-300 text-[10px] font-mono font-bold">
                OFFLINE STEP-BY-STEP SOS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Written in plain everyday language for astronauts under stress—showing exact hardware bags to grab, step timers, calm breathing cues, and what normal looks like.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-400/70 text-amber-200 text-xs font-mono font-extrabold flex items-center gap-1.5 tabular-nums shadow-[0_0_12px_rgba(245,158,11,0.28)]">
            <Award className="w-4 h-4 text-amber-300" />
            <span>Total XP: {currentXp} XP</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Audio Muted</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTriggerDrillOnDashboard}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Live Drill on 3D Model</span>
          </button>

          <button
            type="button"
            onClick={handleClearDrill}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Drill</span>
          </button>
        </div>
      </div>

      {/* Live Drill Active Confirmation Notice */}
      {liveDrillActiveTitle && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-400/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-rose-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185] shrink-0" />
            <span>
              <strong>Live Drill Active:</strong> Cabin telemetry &amp; 3D Body Twin updated for{' '}
              <strong>{liveDrillActiveTitle}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBodyTwin && (
              <button
                type="button"
                onClick={onOpenBodyTwin}
                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap"
              >
                See on 3D Body Twin &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={handleClearDrill}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Stop Drill
            </button>
          </div>
        </div>
      )}

      {/* Celebratory Protocol Completion Pop-Up Banner */}
      {completionBanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-extrabold text-white">
                  Emergency Protocol Finished!
                </h4>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-mono font-extrabold">
                  +{completionBanner.xpEarned} XP EARNED
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                You completed <strong>{completionBanner.title}</strong>. Your total readiness score is now{' '}
                <strong className="text-amber-300 font-mono">{currentXp} XP</strong> (saved locally on your device).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestartDrill}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 text-white text-xs font-bold cursor-pointer"
            >
              Practice Again
            </button>
            <button
              type="button"
              onClick={() => setCompletionBanner(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
              aria-label="Dismiss completion message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* What is happening right now? Selector */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2.5">
          1. Pick What You Feel Or What Alarm Is Ringing:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {EMERGENCY_GUIDES.map((guide) => {
            const isSelected = guide.id === activeGuide.id;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => handleSelectGuide(guide)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500/80'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-rose-900 text-rose-200' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {renderIcon(guide.iconName)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      guide.severityLabel === 'IMMEDIATE SOS'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {guide.severityLabel}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 leading-snug">
                    {guide.shortTitle}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {guide.humanSymptomLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Single-Step Guided Execution Card + Side Reassurance & Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 cols: Big Clear Single-Step Action Card */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Step progress strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700/70 text-cyan-300 font-mono text-xs font-bold tabular-nums">
                  STEP {currentStepIdx + 1} OF {activeGuide.steps.length}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Target Organ:{' '}
                  <strong className="text-slate-200">{activeGuide.targetRegionId.replace('_', ' ')}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {activeGuide.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChangeStep(idx)}
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      completedSteps[idx]
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : idx === currentStepIdx
                        ? 'bg-cyan-600 border-cyan-400 text-slate-950'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {completedSteps[idx] ? '✓' : idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Huge Clear Instruction */}
            <div className="space-y-2">
              <h4 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
                {currentStep.stepTitle}
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                {currentStep.simpleAction}
              </p>
            </div>

            {/* Exact Visual Tool Illustration + Why This Helps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              <EmergencyHardwareIllustration
                toolKey={currentStep.toolKey}
                hardwareLabel={currentStep.hardwareToGrab}
              />

              <div className="p-4 rounded-xl bg-cyan-950/35 border border-cyan-700/60 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300 uppercase">
                    <HeartHandshake className="w-4 h-4 shrink-0" />
                    <span>Why This Works (Plain Words)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                    {currentStep.whyThisHelps}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-emerald-300">Verify Before Moving On:</strong>{' '}
                    {currentStep.recheckPrompt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Navigation & Mark Complete */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={currentStepIdx === 0}
              onClick={() => handleChangeStep(Math.max(0, currentStepIdx - 1))}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {runCompleted && currentStepIdx === activeGuide.steps.length - 1 && (
                <button
                  type="button"
                  onClick={handleRestartDrill}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Drill</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCompleteStep}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                  runCompleted && currentStepIdx === activeGuide.steps.length - 1
                    ? 'bg-emerald-900 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentStepIdx < activeGuide.steps.length - 1
                    ? 'Step Done — Go To Next Step'
                    : runCompleted
                    ? 'Protocol Finished! (+60 XP Added)'
                    : 'Finish Emergency Protocol (+60 XP)'}
                </span>
                {currentStepIdx < activeGuide.steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Step Timer, Calm Breathing Pacer, What Normal Looks Like */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          {/* Calm Reassurance */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-400 uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Crew Reassurance</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{activeGuide.reassuranceLine}</p>
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                Warning Signs To Watch:
              </span>
              <ul className="space-y-1">
                {activeGuide.redFlagSigns.map((sign, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Step Timer & Calm Breath Pacer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                STEP ACTION TIMER
              </span>
              <span className="text-lg font-mono font-black text-cyan-300 tabular-nums">
                00:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold cursor-pointer"
              >
                {isTimerRunning ? 'Pause Timer' : 'Start Step Timer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setSecondsLeft(currentStep.timerSeconds);
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Reset
              </button>
            </div>

            {currentStep.calmBreathCue && (
              <div className="p-3 rounded-lg bg-slate-900 border border-cyan-900/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300">Calm Breathing Pacer:</span>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                    breathPhase === 'INHALE'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {breathPhase === 'INHALE' ? 'Breathe In (4s)' : 'Breathe Out (4s)'}
                </span>
              </div>
            )}
          </div>

          {/* All-Clear Target */}
          <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-800/50 space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase block">
              What Safe &amp; Normal Looks Like Again
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">{activeGuide.whenNormalLooksLike}</p>
            {allStepsDone && (
              <div className="mt-2 pt-2 border-t border-emerald-800/40 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Protocol logged locally &amp; queued for Earth Flight Surgeons.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Offline Emergency Event Log */}
      {emergencyLogs.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Recorded First-Response Events (Synced Offline &amp; Queued For Earth Doctors)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
              {emergencyLogs.length} Logged
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {emergencyLogs.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-emerald-400 font-bold">{rec.emergencyTitle}</span>
                  <span className="text-slate-400 tabular-nums">{rec.timestampUtc}</span>
                </div>
                <p className="text-[11px] text-slate-400">{rec.outcomeNote}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
