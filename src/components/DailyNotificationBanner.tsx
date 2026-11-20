import React from 'react';
import { ClipboardCheck, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { DailyCheckin } from '../types/heliomed';

interface DailyNotificationBannerProps {
  onOpenCheckin: () => void;
  onGoToCheckinTab?: () => void;
  latestCheckin: DailyCheckin | null;
  hasSubmittedToday: boolean;
}

export const DailyNotificationBanner: React.FC<DailyNotificationBannerProps> = ({
  onOpenCheckin,
  onGoToCheckinTab,
  latestCheckin,
  hasSubmittedToday,
}) => {
  const moodShort = latestCheckin?.mentalHealth?.split(':')[0] || 'Calm & Focused';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all ${
        hasSubmittedToday
          ? 'bg-gradient-to-r from-emerald-950/75 via-slate-900 to-cyan-950/60 border-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.16)]'
          : 'bg-gradient-to-r from-cyan-950/85 via-slate-900 to-indigo-950/80 border-cyan-400/80 shadow-[0_0_26px_rgba(6,182,212,0.22)]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              hasSubmittedToday
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.55)]'
            }`}
          >
            <ClipboardCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Daily Health Check-In (Sleep, Mood &amp; Pain)
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  hasSubmittedToday
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                    : 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasSubmittedToday ? 'bg-slate-950' : 'bg-rose-600'
                  }`}
                />
                <span>{hasSubmittedToday ? 'Check-In Saved' : 'Check-In Ready'}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              {hasSubmittedToday && latestCheckin ? (
                <>
                  Latest entry: <strong className="text-emerald-300">Sleep {latestCheckin.sleepQuality}/10 ({latestCheckin.sleepHours}h)</strong> ·{' '}
                  <strong className="text-amber-300">{moodShort}</strong> ·{' '}
                  <strong className={latestCheckin.hasPain ? 'text-rose-300' : 'text-cyan-300'}>
                    {latestCheckin.hasPain
                      ? `Pain: ${latestCheckin.painAreas.join(', ') || 'Reported'}`
                      : 'No Pain'}
                  </strong>
                </>
              ) : (
                'Tell HelioMed how you slept, how your mind feels, and if anything hurts to get instant, easy-to-follow steps for today.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onGoToCheckinTab && (
            <button
              type="button"
              onClick={onGoToCheckinTab}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/60 text-cyan-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-cyan-300" />
              <span>View Plan &amp; Form</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCheckin}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.45)] whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>{hasSubmittedToday ? 'Update Daily Check-In' : 'Start Daily Check-In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
