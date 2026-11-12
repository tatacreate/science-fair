import React, { useState, useEffect } from 'react';
import {
  HABITAT_ENVIRONMENTS,
  HabitatEnvironmentId,
  RoutinePromptSpec,
} from '../data/habitatEnvironments';
import {
  Rocket,
  Building2,
  Truck,
  Globe,
  Bell,
  Award,
  Flame,
  CheckCircle2,
  ChevronRight,
  Clock,
  ShieldAlert,
  Play,
  HelpCircle,
} from 'lucide-react';

export interface GamificationProgress {
  xp: number;
  streakDays: number;
  completedRoutineIds: string[];
  examsLoggedCount: number;
}

interface EnvironmentAndGamificationHubProps {
  activeEnvId: HabitatEnvironmentId;
  onChangeEnvironment: (envId: HabitatEnvironmentId) => void;
  onLaunchRoutineAction: (routine: RoutinePromptSpec) => void;
  gamification: GamificationProgress;
  onCompleteRoutine: (routine: RoutinePromptSpec) => void;
}

function getRankTitle(xp: number): { title: string; nextXp: number; level: number } {
  if (xp >= 500) return { title: 'Mars Medical Ace', nextXp: 1000, level: 4 };
  if (xp >= 250) return { title: 'Deep-Space Pathfinder', nextXp: 500, level: 3 };
  if (xp >= 100) return { title: 'Flight Health Specialist', nextXp: 250, level: 2 };
  return { title: 'Orbital Cadet', nextXp: 100, level: 1 };
}

const BADGE_DEFINITIONS = [
  {
    id: 'badge-streak',
    label: 'Consistent Crew',
    desc: 'Maintain 3+ day health check streak',
    check: (g: GamificationProgress) => g.streakDays >= 3,
  },
  {
    id: 'badge-vision',
    label: 'SANS Eagle Eye',
    desc: 'Complete 1+ eye/fluid check routine',
    check: (g: GamificationProgress) =>
      g.completedRoutineIds.some((id) => id.includes('sans') || id.includes('eye')) ||
      g.examsLoggedCount >= 2,
  },
  {
    id: 'badge-hydration',
    label: 'Kidney Shield',
    desc: 'Reach 120+ Wellness XP',
    check: (g: GamificationProgress) => g.xp >= 120,
  },
  {
    id: 'badge-explorer',
    label: 'Multi-Habitat Ready',
    desc: 'Complete 3+ scheduled health prompts',
    check: (g: GamificationProgress) => g.completedRoutineIds.length >= 3,
  },
];

export const EnvironmentAndGamificationHub: React.FC<EnvironmentAndGamificationHubProps> = ({
  activeEnvId,
  onChangeEnvironment,
  onLaunchRoutineAction,
  gamification,
  onCompleteRoutine,
}) => {
  const activeEnv =
    HABITAT_ENVIRONMENTS.find((e) => e.id === activeEnvId) || HABITAT_ENVIRONMENTS[0];

  const [activePromptIdx, setActivePromptIdx] = useState<number>(0);
  const [secondsUntilNextPrompt, setSecondsUntilNextPrompt] = useState<number>(180);
  const [showHowToSteps, setShowHowToSteps] = useState<boolean>(true);

  useEffect(() => {
    setActivePromptIdx(0);
  }, [activeEnvId]);

  // Lightweight routine prompt timer (ticks every second; advances prompt on cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextPrompt((prev) => {
        if (prev <= 1) {
          setActivePromptIdx((idx) => (idx + 1) % activeEnv.routines.length);
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeEnv.routines.length]);

  const currentPrompt =
    activeEnv.routines[activePromptIdx % activeEnv.routines.length] || activeEnv.routines[0];
  const isPromptCompleted = gamification.completedRoutineIds.includes(currentPrompt.id);
  const rank = getRankTitle(gamification.xp);
  const xpProgressPercent = Math.min(100, Math.round((gamification.xp / rank.nextXp) * 100));

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getEnvIcon = (id: HabitatEnvironmentId) => {
    switch (id) {
      case 'spacecraft':
        return <Rocket className="w-4 h-4" />;
      case 'space_station':
        return <Building2 className="w-4 h-4" />;
      case 'rover':
        return <Truck className="w-4 h-4" />;
      case 'planetary_base':
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <section className="space-y-5">
      {/* PART A: Mission Environment Selector & Habitat Insights */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Mission Environment &amp; Habitat Health Insights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select where you are operating to adapt health advice, routine reminders, and safety limits automatically.
            </p>
          </div>

          {/* 4-Environment Segmented Selector */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {HABITAT_ENVIRONMENTS.map((env) => {
              const isSelected = env.id === activeEnvId;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => onChangeEnvironment(env.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {getEnvIcon(env.id)}
                  <span>{env.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Environment Brief + Top 3 Hazards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-cyan-300">{activeEnv.name}</h3>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
              <span>Gravity: <strong className="text-slate-200">{activeEnv.gravityLabel}</strong></span>
              <span>·</span>
              <span>Signal Delay: <strong className="text-slate-200">{activeEnv.commDelayLabel}</strong></span>
              <span>·</span>
              <span>Pressure: <strong className="text-slate-200 tabular-nums">{activeEnv.pressureBaselineKpa} kPa</strong></span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeEnv.summary}</p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                Top Actions for This Environment:
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {activeEnv.priorityActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeEnv.keyHazards.map((hz, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        hz.severityTag === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        hz.severityTag === 'HIGH' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {hz.severityTag} RISK
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug">{hz.hazard}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{hz.effectOnBody}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PART B: Scheduled Mission Routine Prompt + Gamification Progress Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Scheduled Routine Prompt with Simple Step-by-Step Instructions */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Scheduled Mission Routine Prompt
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Next prompt in {formatCountdown(secondsUntilNextPrompt)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePromptIdx((idx) => (idx + 1) % activeEnv.routines.length);
                  setSecondsUntilNextPrompt(180);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 cursor-pointer whitespace-nowrap shrink-0"
              >
                Next Prompt
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-amber-400">
                  {currentPrompt.cadence} · +{currentPrompt.xpReward} Wellness XP
                </span>
                <h4 className="text-base font-bold text-slate-100 mt-0.5">
                  {currentPrompt.title}
                </h4>
              </div>

              {isPromptCompleted ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-mono font-bold">
                  COMPLETED TODAY
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-600 text-amber-300 text-[11px] font-mono font-bold">
                  ACTION DUE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">Why this matters:</strong>{' '}
              {currentPrompt.plainLanguageWhy}
            </p>

            {/* Simple Step-by-Step Instructions (Assuming Zero Medical Knowledge) */}
            <div>
              <button
                type="button"
                onClick={() => setShowHowToSteps((s) => !s)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer mb-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showHowToSteps ? 'Hide Step-by-Step Instructions' : 'Show Step-by-Step Instructions'}
                </span>
              </button>

              {showHowToSteps && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                  <ol className="list-decimal list-inside space-y-1 text-slate-200">
                    {currentPrompt.stepByStepHowTo.map((step, i) => (
                      <li key={i} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                    Color Guide: {currentPrompt.colorZoneHint}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onLaunchRoutineAction(currentPrompt)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Perform Check Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onCompleteRoutine(currentPrompt)}
                disabled={isPromptCompleted}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isPromptCompleted
                    ? 'XP Claimed'
                    : `Mark Complete (+${currentPrompt.xpReward} XP)`}
                </span>
              </button>
            </div>
          </div>

          {/* All Habitat Routines Quick Switcher */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-mono text-slate-400">Routine Queue:</span>
            {activeEnv.routines.map((rt, idx) => {
              const done = gamification.completedRoutineIds.includes(rt.id);
              const isCur = idx === activePromptIdx % activeEnv.routines.length;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setActivePromptIdx(idx)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-colors ${
                    isCur
                      ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
                      : done
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {done ? '✓ ' : ''}
                  {rt.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Crew Wellness Gamification Module */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Crew Health Readiness &amp; Streaks
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
              Level {rank.level} · {rank.title}
            </span>
          </div>

          {/* Streak + XP KPI Pair */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Health Streak
              </span>
              <span className="text-2xl font-mono font-bold tabular-nums text-slate-100 mt-1 block">
                {gamification.streakDays} <span className="text-xs text-slate-400">days</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Total Wellness XP</span>
              <span className="text-2xl font-mono font-bold tabular-nums text-cyan-400 mt-1 block">
                {gamification.xp} <span className="text-xs text-slate-400">/ {rank.nextXp}</span>
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Progress to Next Rank</span>
              <span className="tabular-nums text-cyan-300">{xpProgressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Unlockable Mission Health Badges */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Mission Health Achievements:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BADGE_DEFINITIONS.map((b) => {
                const unlocked = b.check(gamification);
                return (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors ${
                      unlocked
                        ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between gap-1">
                      <span className="truncate">{b.label}</span>
                      <span className="text-[10px] font-mono">
                        {unlocked ? 'EARNED' : 'LOCKED'}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-snug opacity-85">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
