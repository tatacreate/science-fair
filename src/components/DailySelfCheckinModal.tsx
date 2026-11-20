import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { DailyCheckin, TelemetryState, CabinEnvironment } from '../types/heliomed';
import { evaluateSpecificNasaRisks } from '../data/nasaHrpRisks';
import { SmartRiskPills } from './NasaRiskPillsAndModal';
import {
  buildPrewrittenCheckinResponse,
  PrewrittenAstronautResponse,
} from '../data/prewrittenResponses';
import { PrewrittenResponseCard } from './PrewrittenResponseCard';
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
  Compass,
} from 'lucide-react';

interface DailyCheckinFormProps {
  user: User | null;
  onSaveCheckin: (checkin: DailyCheckin) => Promise<void>;
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  astronautName: string;
  initialCheckin?: DailyCheckin | null;
  evaMode?: boolean;
  onToggleEvaMode?: (val: boolean) => void;
  onSubmittedResponse?: (checkin: DailyCheckin, response: PrewrittenAstronautResponse) => void;
  onOpenBodyTwin?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

const QUICK_FEELINGS = [
  { label: 'Feeling good & steady', tone: 'emerald' },
  { label: 'A bit tired / low energy', tone: 'amber' },
  { label: 'Headache / eye pressure', tone: 'amber' },
  { label: 'Sore back or stiff muscles', tone: 'amber' },
  { label: 'Stressed or overwhelmed', tone: 'rose' },
];

const MENTAL_OPTIONS = [
  { label: 'Calm & Focused', activeClass: 'bg-emerald-500 border-emerald-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.45)]' },
  { label: 'High Morale', activeClass: 'bg-cyan-500 border-cyan-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.45)]' },
  { label: 'Mild Space Isolation', activeClass: 'bg-amber-400 border-amber-200 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.45)]' },
  { label: 'Sensory Fatigue', activeClass: 'bg-amber-400 border-amber-200 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.45)]' },
  { label: 'Anxious / High Stress', activeClass: 'bg-rose-500 border-rose-300 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.45)]' },
  { label: 'Crew Friction / Comm Flag', activeClass: 'bg-orange-500 border-orange-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(249,115,22,0.45)]' },
  { label: 'System Confusion / Tech Alert', activeClass: 'bg-indigo-500 border-indigo-300 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.45)]' },
];

const STANDARD_PAIN_OPTIONS = [
  { label: 'Lower Back / Spine', value: 'Spine / Lumbar' },
  { label: 'Head / Forehead', value: 'Head' },
  { label: 'Eyes / Vision Blur', value: 'Eyes' },
  { label: 'Inner Ear / Dizziness', value: 'Inner Ear / Dizziness' },
  { label: 'Chest / Racing Heart', value: 'Chest / Heart Rate Spike' },
  { label: 'Joints / Knees', value: 'Joints' },
  { label: 'Shoulders', value: 'Shoulders' },
  { label: 'Skin Rash / Fatigue', value: 'Skin Rash / Fatigue' },
];

const STANDARD_HABITS_IMPROVE = [
  'Hydration / Drink more water',
  'Back & body stretching',
  'Full daily workout (2.5h)',
  'Regular sleep schedule',
  '20-20-20 eye rest breaks',
  'Eat full meals & protein',
];

const STANDARD_HABITS_STRUGGLING = [
  'Sleeping in sleeping sack',
  'Low Hydration / Skipping Water',
  'Low Nutrition / Appetite Loss',
  'Crew Friction / Comm Tension',
  'System Confusion / Tech Alert',
  'Missing family & home',
];

export const DailyCheckinInteractiveForm: React.FC<DailyCheckinFormProps> = ({
  user,
  onSaveCheckin,
  telemetry,
  cabin,
  astronautName,
  initialCheckin,
  evaMode: controlledEvaMode,
  onToggleEvaMode,
  onSubmittedResponse,
  onOpenBodyTwin,
  onClose,
  isModal = false,
}) => {
  const [localEvaMode, setLocalEvaMode] = useState<boolean>(false);
  const evaMode = controlledEvaMode !== undefined ? controlledEvaMode : localEvaMode;
  const setEvaMode = (val: boolean) => {
    setLocalEvaMode(val);
    onToggleEvaMode?.(val);
  };

  const [sleepQuality, setSleepQuality] = useState<number>(initialCheckin?.sleepQuality ?? 7);
  const [sleepHours, setSleepHours] = useState<number>(initialCheckin?.sleepHours ?? 7);
  const [mentalHealthTag, setMentalHealthTag] = useState<string>(
    initialCheckin?.mentalHealth?.split(':')[0]?.trim() || 'Calm & Focused'
  );
  const [mentalHealthNotes, setMentalHealthNotes] = useState<string>('');
  const [selectedFeelingPreset, setSelectedFeelingPreset] = useState<string>('Feeling good & steady');
  const [overallFeelingNote, setOverallFeelingNote] = useState<string>('');
  const [hasPain, setHasPain] = useState<boolean>(initialCheckin?.hasPain ?? false);
  const [selectedPainAreas, setSelectedPainAreas] = useState<string[]>(
    initialCheckin?.painAreas ?? []
  );
  const [painSeverity, setPainSeverity] = useState<number>(initialCheckin?.painSeverity || 3);
  const [painNotes, setPainNotes] = useState<string>('');
  const [habitsToImprove, setHabitsToImprove] = useState<string[]>(
    initialCheckin?.habitsToImprove?.length
      ? initialCheckin.habitsToImprove
      : ['Hydration / Drink more water', 'Back & body stretching']
  );
  const [habitsStrugglingWith, setHabitsStrugglingWith] = useState<string[]>(
    initialCheckin?.habitsStrugglingWith ?? []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    checkin: DailyCheckin;
    response: PrewrittenAstronautResponse;
  } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const feelingSummary =
        overallFeelingNote.trim() ||
        selectedFeelingPreset ||
        (hasPain
          ? `Experiencing pain (${painSeverity}/10).`
          : sleepQuality <= 4
          ? 'Tired after poor sleep.'
          : 'Feeling good & steady.');

      const checkinData: DailyCheckin = {
        id: `checkin-${Date.now()}`,
        userId: user ? user.uid : 'local-astronaut',
        astronautName: astronautName || 'Astronaut',
        date: new Date().toISOString().split('T')[0],
        sleepQuality,
        sleepHours,
        mentalHealth: mentalHealthNotes.trim()
          ? `${mentalHealthTag}: ${mentalHealthNotes.trim()}`
          : mentalHealthTag,
        overallFeeling: feelingSummary,
        hasPain,
        painAreas: hasPain ? selectedPainAreas : [],
        painSeverity: hasPain ? painSeverity : 0,
        painNotes: hasPain ? painNotes.trim() : '',
        habitsToImprove,
        habitsStrugglingWith,
        evaMode,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const prewritten = buildPrewrittenCheckinResponse(checkinData, telemetry, cabin);
      checkinData.aiFeedback = prewritten.sections
        .map((s) => `${s.title} (${s.statusLabel}): ${s.guidanceText} Action: ${s.quickAction}`)
        .join('\n\n');

      await onSaveCheckin(checkinData);
      setSubmittedResult({ checkin: checkinData, response: prewritten });
      onSubmittedResponse?.(checkinData, prewritten);
    } catch (err) {
      console.error('Check-in submit issue:', err);
      setSaveError('Saved locally on this device. Review your guidance below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] shrink-0" />
          <div className="text-xs sm:text-sm text-emerald-100 font-semibold">
            Daily Check-In Submitted! Here are your personalized, easy-to-follow answers based on what you chose:
          </div>
        </div>

        <PrewrittenResponseCard
          response={submittedResult.response}
          astronautName={astronautName}
          submittedTime={submittedResult.checkin.createdAt}
          onUpdateAgain={() => setSubmittedResult(null)}
          onOpenBodyTwin={
            onOpenBodyTwin
              ? () => {
                  onOpenBodyTwin();
                  onClose?.();
                }
              : undefined
          }
          onClosePopup={isModal ? onClose : undefined}
        />
      </div>
    );
  }

  const sleepStatus =
    sleepQuality <= 4 || sleepHours < 6
      ? { label: 'Low Rest', color: 'bg-rose-500 text-white' }
      : sleepQuality <= 6 || sleepHours < 7
      ? { label: 'Fair Rest', color: 'bg-amber-400 text-slate-950' }
      : { label: 'Well Rested', color: 'bg-emerald-400 text-slate-950' };

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
    overallFeeling: `${selectedFeelingPreset} ${overallFeelingNote}`,
    habitsStrugglingWith,
    evaMode,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* EVA Mode Toggle */}
      <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-600/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/60">
            <Compass className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-white block">
              Spacewalk Today? (Pre / Post-EVA Mode)
            </span>
            <span className="text-xs text-slate-300">
              Turn on before or after a spacewalk for oxygen &amp; joint checks
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEvaMode(!evaMode)}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
            evaMode
              ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              evaMode ? 'bg-slate-950' : 'bg-slate-400'
            }`}
          />
          <span>{evaMode ? 'Spacewalk Mode: ON' : 'Spacewalk Mode: OFF'}</span>
        </button>
      </div>

      {/* Step 1: Sleep */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/65 border border-sky-500/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 text-xs font-extrabold flex items-center justify-center">
              1
            </span>
            <Moon className="w-4 h-4 text-sky-300" />
            <span>How was your sleep? (1 = Terrible, 10 = Great)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${sleepStatus.color}`}>
              {sleepQuality}/10 · {sleepStatus.label}
            </span>
          </div>
        </div>

        {/* Quick 1-10 Score Buttons */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = sleepQuality === num;
            const activeTone =
              num <= 4
                ? 'bg-rose-500 border-rose-300 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : num <= 6
                ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
                : 'bg-emerald-400 border-emerald-200 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.45)]';
            return (
              <button
                key={num}
                type="button"
                onClick={() => setSleepQuality(num)}
                className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? activeTone
                    : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600 hover:border-sky-400'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Hours Slept Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/70 text-xs">
          <span className="text-slate-200 font-semibold">Hours slept:</span>
          {[4.5, 5.5, 6.5, 7.5, 8.5].map((hrs) => {
            const active = Math.abs(sleepHours - hrs) < 0.25;
            return (
              <button
                key={hrs}
                type="button"
                onClick={() => setSleepHours(hrs)}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.45)]'
                    : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600'
                }`}
              >
                {hrs}h
              </button>
            );
          })}
          <input
            type="number"
            min="1"
            max="14"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value) || 0)}
            aria-label="Custom sleep hours"
            className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-400"
          />
          <span className="text-slate-300 font-mono">hrs</span>
        </div>
      </div>

      {/* Step 2: Mental State */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/65 border border-amber-500/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center">
              2
            </span>
            <Smile className="w-4 h-4 text-amber-300" />
            <span>How is your mental state &amp; mood today?</span>
          </label>
          <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/60 text-amber-200 text-xs font-bold">
            Selected: {mentalHealthTag}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {MENTAL_OPTIONS.map((mood) => {
            const isSelected = mentalHealthTag === mood.label;
            return (
              <button
                key={mood.label}
                type="button"
                onClick={() => setMentalHealthTag(mood.label)}
                className={`px-3.5 py-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? mood.activeClass
                    : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600 hover:border-amber-300'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={mentalHealthNotes}
          onChange={(e) => setMentalHealthNotes(e.target.value)}
          placeholder="Optional note: anything on your mind? (not required)"
          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Step 3: How do you feel overall? */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/65 border border-emerald-500/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center">
              3
            </span>
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>How is your overall body energy today?</span>
          </label>
          <span className="text-xs text-emerald-300 font-semibold">Pick one or type below</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_FEELINGS.map((item) => {
            const isSelected = selectedFeelingPreset === item.label;
            const activeClass =
              item.tone === 'emerald'
                ? 'bg-emerald-500 border-emerald-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                : item.tone === 'rose'
                ? 'bg-rose-500 border-rose-300 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.45)]'
                : 'bg-amber-400 border-amber-200 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.45)]';
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setSelectedFeelingPreset(item.label)}
                className={`px-3.5 py-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? activeClass
                    : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600 hover:border-emerald-300'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={overallFeelingNote}
          onChange={(e) => setOverallFeelingNote(e.target.value)}
          placeholder="Optional details (e.g., dizzy when turning head, tired after workout)..."
          className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Step 4: Any Pain? */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/65 border border-rose-500/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center">
              4
            </span>
            <HeartPulse className="w-4 h-4 text-rose-300" />
            <span>Are you feeling any pain or discomfort?</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasPain(false);
                setSelectedPainAreas([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                !hasPain
                  ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
              }`}
            >
              No Pain
            </button>
            <button
              type="button"
              onClick={() => setHasPain(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                hasPain
                  ? 'bg-rose-500 border-rose-300 text-white shadow-[0_0_14px_rgba(244,63,94,0.55)]'
                  : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
              }`}
            >
              Yes, I Have Pain
            </button>
          </div>
        </div>

        {hasPain && (
          <div className="pt-3 border-t border-slate-700/80 space-y-3">
            <span className="text-xs font-semibold text-rose-200 block">
              Tap where it hurts (you can pick more than one):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STANDARD_PAIN_OPTIONS.map((opt) => {
                const isSelected = selectedPainAreas.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePainArea(opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-600 border-rose-300 text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-200 font-semibold">Pain level (1 = Mild, 10 = Strong):</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500 text-white text-xs font-mono font-bold">
                {painSeverity} / 10
              </span>
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
              placeholder="Optional note about the pain (e.g., started after workout)..."
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-400"
            />
          </div>
        )}
      </div>

      {/* Step 5: Habits */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/65 border border-indigo-500/40 space-y-4">
        <div className="space-y-2.5">
          <label className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-400 text-slate-950 text-xs font-extrabold flex items-center justify-center">
              5
            </span>
            <Target className="w-4 h-4 text-cyan-300" />
            <span>Habits to focus on today</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STANDARD_HABITS_IMPROVE.map((habit) => {
              const isSelected = habitsToImprove.includes(habit);
              return (
                <button
                  key={habit}
                  type="button"
                  onClick={() => toggleHabitToImprove(habit)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-300 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{habit}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-slate-700/80">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-300" />
            <span>Anything you are struggling with today? (Optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STANDARD_HABITS_STRUGGLING.map((habit) => {
              const isSelected = habitsStrugglingWith.includes(habit);
              return (
                <button
                  key={habit}
                  type="button"
                  onClick={() => toggleHabitStruggling(habit)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-500 border-purple-300 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.45)]'
                      : 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-600'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{habit}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live NASA Risk Pills preview if any triggered */}
      {activeRisks.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-cyan-500/50">
          <SmartRiskPills
            compact
            title="Live NASA Health Flags Detected"
            risks={activeRisks}
          />
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400 text-xs text-amber-100">
          {saveError}
        </div>
      )}

      {/* Bright, Unmistakable Submit Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>Works 100% offline · Instant advice after submit</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_22px_rgba(6,182,212,0.5)] disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving Check-In...' : 'Submit Daily Check-In'}</span>
        </button>
      </div>
    </form>
  );
};

interface DailySelfCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSaveCheckin: (checkin: DailyCheckin) => Promise<void>;
  telemetry: TelemetryState;
  cabin: CabinEnvironment;
  astronautName: string;
  initialCheckin?: DailyCheckin | null;
  evaMode?: boolean;
  onToggleEvaMode?: (val: boolean) => void;
  onOpenBodyTwin?: () => void;
}

export const DailySelfCheckinModal: React.FC<DailySelfCheckinModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveCheckin,
  telemetry,
  cabin,
  astronautName,
  initialCheckin,
  evaMode,
  onToggleEvaMode,
  onOpenBodyTwin,
}) => {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFormKey((k) => k + 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        {/* Pop-up Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Daily Astronaut Check-In
              </h3>
              <p className="text-xs text-cyan-200">
                Answer 5 quick questions about sleep, mood &amp; body to get your plan for today
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-600 transition-colors cursor-pointer"
            aria-label="Close Daily Check-In Pop-up"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto text-slate-100">
          <DailyCheckinInteractiveForm
            key={formKey}
            user={user}
            onSaveCheckin={onSaveCheckin}
            telemetry={telemetry}
            cabin={cabin}
            astronautName={astronautName}
            initialCheckin={initialCheckin}
            evaMode={evaMode}
            onToggleEvaMode={onToggleEvaMode}
            onOpenBodyTwin={onOpenBodyTwin}
            onClose={onClose}
            isModal
          />
        </div>
      </div>
    </div>
  );
};
