import React from 'react';
import { X, BookOpen, ShieldCheck, Database } from 'lucide-react';

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
    },
    {
      title: 'NASA-STD-3001 Volume 2 — Human Factors, Habitability & Environmental Health',
      detail:
        'Sets operational thresholds used across HelioMed for cabin CO₂ (< 3.0–4.5 mmHg), barometric pressure (56.5–101.3 kPa), arterial oxygen (SpO₂), radiation shelter triggers (> 15 µSv/h), and SANS optic nerve limits.',
      tag: 'Vital & Habitat Thresholds',
    },
    {
      title: 'NASA Open Science Data Repository (OSDR) — Studies OSD-511, 484, 352, 630, 102',
      detail:
        'Embedded offline cohort baselines comparing Earth norms vs. spaceflight glucose drift, optic nerve swelling (ONSD), cosmic radiation dosing, lunar regolith airway effects, and bone-calcium hydration loss.',
      tag: 'Offline Testbench Studies',
    },
    {
      title: 'Canadian Space Agency (CSA) & Bubble Technology Industries (BTI) — CANS Spectrometer',
      detail:
        'Canadian Active Neutron Spectrometer (CANS) and Space Bubble Detector heritage for continuous autonomous monitoring of secondary neutron radiation (~30% of deep-space mission dose), plus Earth applications in aircrew safety, proton cancer therapy, and nuclear monitoring.',
      tag: 'CSA / Neutron Engineering',
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
            </div>
          ))}

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              All reference thresholds and OSDR benchmarks run 100% locally with zero internet dependency.
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
