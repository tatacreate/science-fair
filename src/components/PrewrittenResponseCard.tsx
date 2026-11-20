import React from 'react';
import {
  PrewrittenAstronautResponse,
  ResponseLightColor,
} from '../data/prewrittenResponses';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Moon,
  Smile,
  HeartPulse,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface PrewrittenResponseCardProps {
  response: PrewrittenAstronautResponse;
  astronautName?: string;
  submittedTime?: string;
  onUpdateAgain?: () => void;
  onOpenBodyTwin?: () => void;
  onClosePopup?: () => void;
}

const getLightBadge = (light: ResponseLightColor, statusLabel: string) => {
  if (light === 'red') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.45)]">
        <span className="w-2 h-2 rounded-full bg-white" />
        <span>{statusLabel}</span>
      </span>
    );
  }
  if (light === 'amber') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]">
        <span className="w-2 h-2 rounded-full bg-slate-950" />
        <span>{statusLabel}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]">
      <span className="w-2 h-2 rounded-full bg-slate-950" />
      <span>{statusLabel}</span>
    </span>
  );
};

const getCardClasses = (light: ResponseLightColor) => {
  if (light === 'red') {
    return 'bg-rose-950/60 border-rose-500/80';
  }
  if (light === 'amber') {
    return 'bg-amber-950/45 border-amber-500/75';
  }
  return 'bg-emerald-950/45 border-emerald-500/75';
};

const getSectionIcon = (id: string) => {
  switch (id) {
    case 'sleep':
      return <Moon className="w-4 h-4 text-sky-300 shrink-0" />;
    case 'mental':
      return <Smile className="w-4 h-4 text-amber-300 shrink-0" />;
    case 'body':
      return <HeartPulse className="w-4 h-4 text-rose-300 shrink-0" />;
    case 'eva':
      return <Compass className="w-4 h-4 text-amber-300 shrink-0" />;
    default:
      return <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />;
  }
};

export const PrewrittenResponseCard: React.FC<PrewrittenResponseCardProps> = ({
  response,
  astronautName,
  submittedTime,
  onUpdateAgain,
  onOpenBodyTwin,
  onClosePopup,
}) => {
  const headerStyles =
    response.overallStatus === 'ATTENTION'
      ? 'bg-gradient-to-r from-rose-900/90 to-rose-950 border-rose-500 text-rose-100'
      : response.overallStatus === 'CAUTION'
      ? 'bg-gradient-to-r from-amber-900/80 to-slate-900 border-amber-500 text-amber-100'
      : 'bg-gradient-to-r from-emerald-900/80 to-cyan-950 border-emerald-500 text-emerald-100';

  const statusPill =
    response.overallStatus === 'ATTENTION' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-[0_0_14px_rgba(244,63,94,0.6)]">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Action Needed</span>
      </span>
    ) : response.overallStatus === 'CAUTION' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-[0_0_14px_rgba(245,158,11,0.5)]">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Self-Care Tips</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-xs font-bold shadow-[0_0_14px_rgba(16,185,129,0.5)]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>All Clear</span>
      </span>
    );

  return (
    <div className="space-y-4">
      {/* Top Status Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${headerStyles} space-y-2`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {statusPill}
            {submittedTime && (
              <span className="text-xs font-mono text-slate-200">
                Saved at {submittedTime}
                {astronautName ? ` · ${astronautName}` : ''}
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-semibold text-cyan-200">
            Astronaut Daily Guide
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white">
          {response.headline}
        </h3>
        <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
          {response.summaryText}
        </p>
      </div>

      {/* Color-Coded Pre-Written Answer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {response.sections.map((section) => (
          <div
            key={section.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${getCardClasses(
              section.light
            )}`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getSectionIcon(section.id)}
                  <h4 className="text-sm font-bold text-white">{section.title}</h4>
                </div>
                {getLightBadge(section.light, section.statusLabel)}
              </div>

              <div className="text-xs font-mono text-cyan-200 bg-slate-950/60 border border-slate-700/70 rounded-lg px-2.5 py-1.5">
                You chose: <span className="text-white font-semibold">{section.chosenSummary}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                {section.guidanceText}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-700/80 text-xs text-emerald-200">
              <strong className="text-emerald-400">What to do now: </strong>
              {section.quickAction}
            </div>
          </div>
        ))}
      </div>

      {/* Clear Action Footer */}
      {(onUpdateAgain || onOpenBodyTwin || onClosePopup) && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          {onUpdateAgain && (
            <button
              type="button"
              onClick={onUpdateAgain}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Change My Answers
            </button>
          )}
          {onOpenBodyTwin && (
            <button
              type="button"
              onClick={onOpenBodyTwin}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>See 3D Body Scan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onClosePopup && (
            <button
              type="button"
              onClick={onClosePopup}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(6,182,212,0.45)]"
            >
              Done &amp; Save to Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
};
