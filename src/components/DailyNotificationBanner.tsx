import React from 'react';
import { Bell, ShieldCheck, CheckCircle2, ArrowRight, Clock, HelpCircle } from 'lucide-react';
import { DailyCheckin } from '../types/heliomed';
import { RoutinePromptSpec } from '../data/habitatEnvironments';

interface DailyNotificationBannerProps {
  onOpenCheckin: () => void;
  latestCheckin: DailyCheckin | null;
  hasSubmittedToday: boolean;
  dueRoutine?: RoutinePromptSpec | null;
  onStartDueRoutine?: (routine: RoutinePromptSpec) => void;
}

export const DailyNotificationBanner: React.FC<DailyNotificationBannerProps> = ({
  onOpenCheckin,
  latestCheckin,
  hasSubmittedToday,
  dueRoutine,
  onStartDueRoutine,
}) => {
  return (
    <div className="space-y-3">
      {/* Daily Medical Self-Check Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
          hasSubmittedToday
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-cyan-500/50 shadow-xl shadow-cyan-950/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl border flex-shrink-0 ${
                hasSubmittedToday
                  ? 'bg-emerald-950 border-emerald-700/60 text-emerald-400'
                  : 'bg-cyan-900/80 border-cyan-500 text-cyan-300'
              }`}
            >
              {hasSubmittedToday ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Bell className="w-5 h-5 text-cyan-300" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  {hasSubmittedToday
                    ? "Today's Medical Self-Check Completed"
                    : 'Daily Medical Check Notification: Please fill out this form'}
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    hasSubmittedToday
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-cyan-900 text-cyan-200 border border-cyan-600'
                  }`}
                >
                  {hasSubmittedToday ? 'LOGGED TODAY' : 'ACTION REQUIRED'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {hasSubmittedToday
                  ? `Logged today: Sleep ${latestCheckin?.sleepQuality}/10, Mood: ${latestCheckin?.mentalHealth}. NASA-STD-3001 offline onboard guidance is active.`
                  : 'In space there are no doctors on board. NASA flight surgeons are down on Earth with a 14+ minute communication delay. Check in on your sleep, mental health, pain, and habits so HelioMed can guide you offline.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <button
              type="button"
              onClick={onOpenCheckin}
              className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg whitespace-nowrap shrink-0 ${
                hasSubmittedToday
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black shadow-cyan-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{hasSubmittedToday ? 'Review / Update Self-Check' : 'Fill Out Form Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Mission Measurement Reminder Strip */}
      {dueRoutine && (
        <div className="rounded-xl px-4 py-3 bg-amber-950/30 border border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-amber-300 uppercase">
                  Scheduled Crew Check Reminder:
                </span>
                <span className="font-bold text-slate-100">{dueRoutine.title}</span>
                <span className="text-[11px] font-mono text-amber-200/80">
                  ({dueRoutine.cadence})
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-start gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-cyan-300">Why it matters:</strong> {dueRoutine.plainLanguageWhy}
                </span>
              </p>
            </div>
          </div>

          {onStartDueRoutine && (
            <button
              type="button"
              onClick={() => onStartDueRoutine(dueRoutine)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              <span>Start Guided Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
