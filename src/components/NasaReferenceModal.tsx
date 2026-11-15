import React from 'react';
import { X, BookOpen, ShieldCheck, Database, ExternalLink } from 'lucide-react';

interface NasaReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NasaReferenceModal: React.FC<NasaReferenceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sources = [
    {
      title: 'NASA Human Research Program (HRP) — 5 Hazards of Human Spaceflight',
      detail:
        'Defines the five primary human health risks monitored in HelioMed: Space Radiation, Isolation & Confinement, Distance from Earth, Gravity Fields, and Hostile/Closed Environments.',
      tag: 'Primary Clinical Framework',
      url: 'https://www.nasa.gov/hrp/hazards/',
    },
    {
      title: 'NASA Human Research Program (HRP) — Specific Human Health Risks',
      detail:
        'Official physiological, behavioral performance, and space radiation risks (SANS, vestibular, musculoskeletal, immune, sleep, teamwork, radiation-induced cancers) mapped to HelioMed checks.',
      tag: 'Specific Risk Matrix',
      url: 'https://www.nasa.gov/hrp/risks/',
    },
    {
      title: 'NASA-STD-3001 Volume 2 & OSDR Studies (OSD-511, 484, 352, 630, 102)',
      detail:
        'Sets operational vital & cabin thresholds (CO₂, pressure, SpO₂, ONSD) alongside embedded offline spaceflight cohort benchmarks for offline onboard triage.',
      tag: 'Thresholds & OSDR Data',
      url: null as string | null,
    },
    {
      title: 'Canadian Space Agency (CSA) — Monitoring Radiation & Astronaut Health (CANS)',
      detail:
        'Canadian Active Neutron Spectrometer (CANS) and Bubble Technology Industries bubble-detector heritage for continuous monitoring of neutron radiation (~30% of space dose), plus Earth benefits.',
      tag: 'CSA / Neutron Engineering',
      url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Powered by NASA Human Research Program Data
              </h3>
              <p className="text-xs text-slate-400">
                Authentic offline scientific sources embedded inside HelioMed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close NASA references"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-slate-100 text-sm">{src.title}</h4>
                <span className="font-mono text-[11px] text-cyan-400 whitespace-nowrap shrink-0">
                  {src.tag}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{src.detail}</p>
              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 pt-0.5 break-all"
                >
                  <span>{src.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          ))}

          <div className="p-3.5 rounded-xl bg-amber-950/35 border border-amber-700/60 space-y-1 text-slate-200">
            <span className="font-mono text-[11px] font-bold uppercase text-amber-300 block">
              Telemetry Disclaimer · Simulated Telemetry for Prototype Testing
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Cabin sensor readings (CO₂, pressure, temperature, radiation flux) and biometric vitals are simulated locally for prototype demonstration. Guidance cards provide non-diagnostic crew safety actions.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              All reference thresholds and OSDR benchmarks run 100% locally with zero external backend dependencies.
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold cursor-pointer"
          >
            Close References
          </button>
        </div>
      </div>
    </div>
  );
};
