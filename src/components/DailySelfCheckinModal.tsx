import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { DailyCheckin, TelemetryState, CabinEnvironment } from '../types/heliomed';
import { computeSmartHazardTags } from '../data/nasaFiveHazards';
import { evaluateSpecificNasaRisks } from '../data/nasaHrpRisks';
import { SmartRiskPills } from './NasaRiskPillsAndModal';
import {
  ClipboardCheck,
  Moon,
  Smile,
  HeartPulse,
  Activity,
  X,
  Target,
  AlertCircle,
  CheckCircle2,
  Send,
  Radio,
  FileCheck,
  Compass,
} from 'lucide-react';

interface DailySelfCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaveCheckin: (checkin: DailyCheckin) => Promise<void>;
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  astronautName: string;
  evaMode?: boolean;
  onToggleEvaMode?: (val: boolean) => void;
}

export const DailySelfCheckinModal: React.FC<DailySelfCheckinModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveCheckin,
  telemetry,
  cabin,
  astronautName,
  evaMode: controlledEvaMode,
  onToggleEvaMode,
}) => {
  const [localEvaMode, setLocalEvaMode] = useState<boolean>(false);
  const evaMode = controlledEvaMode !== undefined ? controlledEvaMode : localEvaMode;
  const setEvaMode = (val: boolean) => {
    setLocalEvaMode(val);
    onToggleEvaMode?.(val);
  };

  // 1. Sleep on scale of 1 to 10
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [sleepHours, setSleepHours] = useState<number>(6.5);

  // 2. Mental health
  const [mentalHealthTag, setMentalHealthTag] = useState<string>('Calm & Focused');
  const [mentalHealthNotes, setMentalHealthNotes] = useState<string>('');

  // 3. How do you feel?
  const [overallFeeling, setOverallFeeling] = useState<string>('');

  // 4. Pain
  const [hasPain, setHasPain] = useState<boolean>(false);
  const [selectedPainAreas, setSelectedPainAreas] = useState<string[]>([]);
  const [painSeverity, setPainSeverity] = useState<number>(3);
  const [painNotes, setPainNotes] = useState<string>('');

  // 5. Habits to improve
  const [habitsToImprove, setHabitsToImprove] = useState<string[]>([
    'Hydration / Electrolyte intake',
    'Spinal stretching routine',
  ]);
  const [customHabitToImprove, setCustomHabitToImprove] = useState('');

  // 6. Habits struggling with
  const [habitsStrugglingWith, setHabitsStrugglingWith] = useState<string[]>([
    'Falling asleep in sleeping sack',
  ]);
  const [customHabitStruggling, setCustomHabitStruggling] = useState('');

  // Submission & Offline Clinical Guidance state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flightGuidance, setFlightGuidance] = useState<string | null>(null);

  if (!isOpen) return null;

  const togglePainArea = (area: string) => {
    setSelectedPainAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleHabitToImprove = (h: string) => {
    setHabitsToImprove((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  const toggleHabitStruggling = (h: string) => {
    setHabitsStrugglingWith((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  // Deterministic 100% Offline NASA-STD-3001 + NASA HRP Risks Generator (No AI, No Internet)
  const generateOfflineFlightGuidance = (
    data: DailyCheckin,
    currentTelemetry: TelemetryState,
    currentCabin: CabinEnvironment
  ): string => {
    const protocols: string[] = [];
    const smartTags = computeSmartHazardTags({
      painAreas: data.painAreas,
      sleepQuality: data.sleepQuality,
      sleepHours: data.sleepHours,
      mentalHealth: data.mentalHealth,
      ambientCO2: currentCabin.ambientCO2,
      spo2: currentTelemetry.spo2,
      radiationRate: currentTelemetry.radiationDoseRate,
    });

    const { activeRisks } = evaluateSpecificNasaRisks({
      heartRate: currentTelemetry.heartRate,
      spo2: currentTelemetry.spo2,
      radiationRate: currentTelemetry.radiationDoseRate,
      ambientCO2: currentCabin.ambientCO2,
      ambientPressure: currentCabin.ambientPressure,
      painAreas: data.painAreas,
      sleepQuality: data.sleepQuality,
      sleepHours: data.sleepHours,
      mentalHealth: data.mentalHealth,
      overallFeeling: data.overallFeeling,
      habitsStrugglingWith: data.habitsStrugglingWith,
      evaMode: data.evaMode,
    });

    if (activeRisks.length > 0) {
      protocols.push(
        `• NASA HRP Specific Risks Flagged: ${activeRisks.map((r) => r.spec.shortBadge).join(' · ')}`
      );
      activeRisks.slice(0, 4).forEach((r) => {
        protocols.push(`  → ${r.spec.title}: ${r.spec.countermeasure}`);
      });
    }

    if (smartTags.length > 0) {
      const tagHeaders = smartTags.map((t) => `[${t.tagLabel}]`).join(' · ');
      protocols.push(`• NASA 5 Hazards Match: ${tagHeaders}`);
    }

    // 1. Sleep & Circadian Assessment
    if (data.sleepQuality < 6 || data.sleepHours < 6) {
      protocols.push(
        `• [Isolation & Confinement] Circadian Protocol: Sleep score (${data.sleepQuality}/10, ${data.sleepHours}h) indicates sleep disruption. Start circadian light therapy and check sleep-station airflow.`
      );
    } else {
      protocols.push(
        `• Sleep & Restorative Status: Sleep index (${data.sleepQuality}/10, ${data.sleepHours}h) meets NASA HRP recovery guidelines.`
      );
    }

    // 2. Pain & Musculoskeletal Guidance
    if (data.hasPain && data.painAreas.length > 0) {
      const areasStr = data.painAreas.join(', ');
      let specificCare = 'Perform 15 minutes of gentle floating stretches and resistance loading.';
      if (data.painAreas.some((a) => /spine|lumbar|leg|joint/i.test(a))) {
        specificCare =
          '[Gravity Fields] Perform 15 minutes of knees-to-chest decompression stretches and complete daily resistance exercise.';
      } else if (data.painAreas.some((a) => /head/i.test(a))) {
        specificCare = `[Hostile/Closed Environments] Check cabin CO₂ (${currentCabin.ambientCO2} mmHg) and inspect air scrubbers. Drink 350 mL electrolyte water.`;
      }
      protocols.push(
        `• Symptom Guidance (${areasStr} · ${data.painSeverity}/10): ${specificCare}`
      );
    } else {
      protocols.push(`• Musculoskeletal Status: Zero pain reported today.`);
    }

    // 3. Ground Sync Log
    protocols.push(
      `• [Distance from Earth] Offline Log Ready: HR ${currentTelemetry.heartRate} bpm · SpO₂ ${currentTelemetry.spo2}% stored in capsule memory and queued for Flight Surgeons.`
    );

    return protocols.join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const checkinData: DailyCheckin = {
      id: `checkin-${Date.now()}`,
      userId: user ? user.uid : 'local-astronaut',
      astronautName: astronautName || 'Astronaut',
      date: new Date().toISOString().split('T')[0],
      sleepQuality,
      sleepHours,
      mentalHealth: mentalHealthNotes
        ? `${mentalHealthTag}: ${mentalHealthNotes}`
        : mentalHealthTag,
      overallFeeling: overallFeeling || 'Nominal microgravity operational feeling.',
      hasPain,
      painAreas: hasPain ? selectedPainAreas : [],
      painSeverity: hasPain ? painSeverity : 0,
      painNotes: hasPain ? painNotes : '',
      habitsToImprove,
      habitsStrugglingWith,
      evaMode,
      createdAt: new Date().toLocaleTimeString(),
    };

    // Generate offline deterministic flight surgeon guidance instantly (100% offline, zero internet/AI)
    const guidance = generateOfflineFlightGuidance(checkinData, telemetry, cabin);
    checkinData.aiFeedback = guidance; // Stored in field for backwards compatibility
    setFlightGuidance(guidance);

    // Save to local storage / Firestore
    await onSaveCheckin(checkinData);
    setIsSubmitting(false);
  };

  const standardPainOptions = [
    { label: 'Lower Back / Spine (Spinal Elongation)', value: 'Spine / Lumbar' },
    { label: 'Head / Forehead (Fluid shift / CO2)', value: 'Head' },
    { label: 'Eyes (Vision blur / SANS pressure)', value: 'Eyes' },
    { label: 'Inner Ear / Dizziness / Balance', value: 'Inner Ear / Dizziness' },
    { label: 'Chest / Heart Rate Spike', value: 'Chest / Heart Rate Spike' },
    { label: 'Joints / Knees (Bone & muscle load)', value: 'Joints' },
    { label: 'Shoulders (Suit / harness strain)', value: 'Shoulders' },
    { label: 'Skin Rash / Immune Fatigue', value: 'Skin Rash / Fatigue' },
  ];

  const standardHabitsImprove = [
    'Complete full 2.5h ARED exercise',
    'Hydration / Electrolyte intake',
    'Spinal stretching routine',
    'Consistent sleep sack time',
    'SANS 20-20-20 eye rest protocol',
    'High-calorie nutrition target',
    'Mindfulness / audio journal',
  ];

  const standardHabitsStruggling = [
    'Falling asleep in sleeping sack',
    'Low Hydration / Skipping Water',
    'Low Nutrition / Appetite Loss',
    'Crew Friction / Comm Tension',
    'System Confusion / Tech Alert',
    'Treadmill bungee harness chafing',
    'Missing family & sensory cues from Earth',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Daily Astronaut Medical Self-Check
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-[10px] font-mono text-cyan-300 font-bold">
                  OFFLINE CAPSULE MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operates 100% on board with no internet or cloud connectivity. NASA flight protocols are applied locally.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {flightGuidance ? (
            /* Post-Submission Offline Guidance Feedback */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">
                    Daily Self-Check Recorded Locally
                  </h4>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Your check-in has been logged in spacecraft non-volatile memory. An encrypted packet is queued for NASA flight surgeons on Earth.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  Onboard Flight Surgeon Guidance (NASA-STD-3001 Protocol):
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
                  {flightGuidance}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFlightGuidance(null);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Self-Check Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pre/Post-EVA Spacewalk Readiness Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-100 block">
                      Pre/Post-EVA (Spacewalk) Readiness Check
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Monitors Decompression Sickness (&quot;The Bends&quot;) &amp; Spacewalk Cognitive Fatigue
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEvaMode(!evaMode)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    evaMode
                      ? 'bg-amber-950 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {evaMode ? 'EVA MODE: ACTIVE' : 'ENABLE EVA MODE'}
                </button>
              </div>

              {/* Question 1: Sleep */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-cyan-400" />
                    1. How was your sleep on a scale of 1 to 10?
                  </label>
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {sleepQuality} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>1: Disrupted / Microgravity insomnia</span>
                  <span>5: Moderate</span>
                  <span>10: Deep restful sleep</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Estimated Sleep Duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-400 font-mono">hours</span>
                </div>
              </div>

              {/* Question 2: Mental Health */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-amber-400" />
                  2. How is your mental health?
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Calm & Focused',
                    'High Morale',
                    'Mild Space Isolation',
                    'Sensory Fatigue',
                    'Anxious / High Stress',
                    'Crew Friction / Comm Flag',
                    'System Confusion / Tech Alert',
                  ].map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setMentalHealthTag(mood)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                        mentalHealthTag === mood
                          ? 'bg-amber-950 border-amber-600 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>

                <textarea
                  value={mentalHealthNotes}
                  onChange={(e) => setMentalHealthNotes(e.target.value)}
                  placeholder="Share any thoughts on confinement, mood, thoughts about home, or cognitive clarity..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              {/* Question 3: Overall Feeling */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  3. How do you feel?
                </label>
                <textarea
                  value={overallFeeling}
                  onChange={(e) => setOverallFeeling(e.target.value)}
                  placeholder="Describe your general physical energy, nausea/motion sickness, appetite, breathing, or alertness today..."
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                />
              </div>

              {/* Question 4: Pain Assessment */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    4. Are you having any pain?
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHasPain(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        !hasPain ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      NO PAIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasPain(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        hasPain ? 'bg-rose-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      YES, PAIN
                    </button>
                  </div>
                </div>

                {hasPain && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <span className="text-xs font-medium text-slate-300 block">
                      Select affected anatomical areas:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {standardPainOptions.map((opt) => {
                        const isSelected = selectedPainAreas.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => togglePainArea(opt.value)}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">Pain Severity (0-10):</span>
                      <span className="text-xs font-mono font-bold text-rose-400">{painSeverity} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painSeverity}
                      onChange={(e) => setPainSeverity(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />

                    <input
                      type="text"
                      value={painNotes}
                      onChange={(e) => setPainNotes(e.target.value)}
                      placeholder="Describe the pain: constant ache, throbbing with heartbeat, worse after exercise, etc."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Question 5: What habits would you like to improve? */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  5. What habits would you like to improve?
                </label>
                <div className="flex flex-wrap gap-2">
                  {standardHabitsImprove.map((habit) => {
                    const isSelected = habitsToImprove.includes(habit);
                    return (
                      <button
                        key={habit}
                        type="button"
                        onClick={() => toggleHabitToImprove(habit)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-600 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {habit}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customHabitToImprove}
                    onChange={(e) => setCustomHabitToImprove(e.target.value)}
                    placeholder="Add custom habit to improve..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customHabitToImprove.trim()) {
                        setHabitsToImprove((prev) => [...prev, customHabitToImprove.trim()]);
                        setCustomHabitToImprove('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-200 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Question 6: Habits you're struggling with */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  6. Habits you&apos;re struggling with
                </label>
                <div className="flex flex-wrap gap-2">
                  {standardHabitsStruggling.map((habit) => {
                    const isSelected = habitsStrugglingWith.includes(habit);
                    return (
                      <button
                        key={habit}
                        type="button"
                        onClick={() => toggleHabitStruggling(habit)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-950 border-purple-600 text-purple-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {habit}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customHabitStruggling}
                    onChange={(e) => setCustomHabitStruggling(e.target.value)}
                    placeholder="Add custom habit you are struggling with..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customHabitStruggling.trim()) {
                        setHabitsStrugglingWith((prev) => [...prev, customHabitStruggling.trim()]);
                        setCustomHabitStruggling('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-200 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Live Smart NASA HRP Specific Risks Preview */}
              {(() => {
                const { activeRisks } = evaluateSpecificNasaRisks({
                  heartRate: telemetry.heartRate,
                  spo2: telemetry.spo2,
                  radiationRate: telemetry.radiationDoseRate,
                  ambientCO2: cabin.ambientCO2,
                  ambientPressure: cabin.ambientPressure,
                  painAreas: hasPain ? selectedPainAreas : [],
                  sleepQuality,
                  sleepHours,
                  mentalHealth: `${mentalHealthTag} ${mentalHealthNotes}`,
                  overallFeeling,
                  habitsStrugglingWith,
                  evaMode,
                });
                if (activeRisks.length === 0) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/60">
                    <SmartRiskPills
                      compact
                      title="Live NASA HRP Risks Flagged From This Check-In"
                      risks={activeRisks}
                    />
                  </div>
                );
              })()}

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>LOCAL LOG · OFFLINE SAFE</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !overallFeeling.trim()}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording In Memory...' : 'Submit Daily Self-Check'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
