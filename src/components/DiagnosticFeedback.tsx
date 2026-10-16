import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export const DiagnosticFeedback: React.FC<{ feedback: string | null }> = ({ feedback }) => {
  if (!feedback) return null;

  const isCritical = feedback.toLowerCase().includes('critical') || feedback.toLowerCase().includes('immediate');

  return (
    <div className={`p-6 rounded-xl border ${isCritical ? 'bg-rose-950/30 border-rose-800' : 'bg-emerald-950/30 border-emerald-800'}`}>
      <div className="flex items-center gap-3 mb-4">
        {isCritical ? (
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        ) : (
          <Sparkles className="w-6 h-6 text-cyan-400" />
        )}
        <h3 className="text-lg font-bold text-white">Autonomous Diagnostic Report</h3>
      </div>
      <p className="text-slate-200 text-sm leading-relaxed">{feedback}</p>
    </div>
  );
};
