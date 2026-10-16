import React from 'react';
import { Sparkles, X, Brain, Check, ShieldCheck, Radio, Copy } from 'lucide-react';

interface GeminiThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisText: string;
  isLoading: boolean;
  astronautName: string;
}

export const GeminiThinkingModal: React.FC<GeminiThinkingModalProps> = ({
  isOpen,
  onClose,
  analysisText,
  isLoading,
  astronautName,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Gemini Deep Clinical Thinking Engine
                </h3>
                <span className="px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 font-bold uppercase">
                  ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous pathophysiology data fusion for {astronautName} (Orbitauts Mars Transit)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysisText && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans text-sm text-slate-200 leading-relaxed">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <div>
                <h4 className="text-base font-semibold text-slate-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Synthesizing High-Thinking Clinical Rationale...
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Gemini-4-Argon is processing multi-parameter telemetry, correlating cabin environmental stressors with physiological organ resilience, and drafting zero-latency edge mitigation steps.
                </p>
              </div>
            </div>
          ) : analysisText ? (
            <div className="space-y-4">
              {/* Mission Protocol Badge */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTONOMOUS FLIGHT SURGEON DIRECTIVE</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <Radio className="w-3.5 h-3.5" />
                  <span>EARTH SYNC DELAY: 14m 28s</span>
                </div>
              </div>

              {/* Rendered Markdown Output */}
              <div className="prose prose-invert prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-cyan-300 max-w-none text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                {analysisText}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No analysis has been generated yet. Click &apos;Gemini-4 Deep Thinking Triage&apos; to initiate.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">Model: gemini-3.8-flash | High Thinking</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
