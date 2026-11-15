import React from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldAlert,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface NasaDataEvidenceCenterProps {
  onOpenRiskMatrix?: () => void;
}

export const NasaDataEvidenceCenter: React.FC<NasaDataEvidenceCenterProps> = ({
  onOpenRiskMatrix,
}) => {
  const hrpIndicators = [
    {
      indicator: 'SANS & Headward Fluid Shift (ONSD / Visual Acuity)',
      category: 'Physiological Adaptation',
      mechanism:
        'Microgravity removes downward hydrostatic pressure, shifting ~2 L of fluid cephalad and increasing optic nerve sheath diameter.',
      moduleLink: '3D Anatomical Twin (Head/Eyes) · Capsule Eye Ultrasound',
    },
    {
      indicator: 'Cardiovascular Deconditioning & Orthostatic Strain',
      category: 'Physiological Adaptation',
      mechanism:
        'Reduced blood plasma volume (10–15%) and cardiac workload adaptation alter resting heart rate, HRV, and landing tolerance.',
      moduleLink: 'Live Body Vitals HUD · Chest/Heart 3D Region',
    },
    {
      indicator: 'Musculoskeletal Bone & Spine Unloading',
      category: 'Physiological Adaptation',
      mechanism:
        'Intervertebral discs expand up to 5–7 cm causing lumbar soreness while weight-bearing bones lose 1–1.5% mineral density monthly.',
      moduleLink: 'Spine & Lumbar 3D Inspector · ARED Routine Tracker',
    },
    {
      indicator: 'Circadian Misalignment, Sleep & Confinement Stress',
      category: 'Behavioral Performance',
      mechanism:
        'Shifted light/dark cycles, cabin noise, and multi-month isolation degrade sleep hours, mood resilience, and crew teamwork.',
      moduleLink: 'Daily Self-Check-In · 14-Day Mission Health Timeline',
    },
  ];

  const hazardMappings = [
    {
      hazard: '1. Space Radiation',
      summary: 'Galactic cosmic rays, solar particle events, and secondary neutrons (~30% of dose).',
      signals: 'Dosimeter µSv/h, career mSv ceiling, CANS neutron feed',
      module: 'CANS Neutron HUD · Radiation Monitor · Storm Shelter Protocol',
    },
    {
      hazard: '2. Isolation & Confinement',
      summary: 'Psychological strain, circadian drift, and team dynamics in closed quarters.',
      signals: 'Sleep hours, sleep quality (1–10), stress score, mood & teamwork flags',
      module: 'Daily Check-In · 14-Day Mission Timeline · Behavioral Risk Pills',
    },
    {
      hazard: '3. Distance from Earth',
      summary: 'Up to 20+ minute one-way light-speed communication delay prohibiting live telemedicine.',
      signals: 'Live Mars transit delay clock · Offline local storage sync queue',
      module: '100% Offline Correlation Engine · Emergency Step-by-Step Wizard',
    },
    {
      hazard: '4. Altered Gravity Fields',
      summary: 'Microgravity (0G), Lunar (0.16G), and Mars (0.38G) impacts on fluid, balance, bone & muscle.',
      signals: 'Pain location logs, ONSD caliper, hydration liters, EVA readiness',
      module: 'Three.js 3D Anatomical Twin · Habitat Selector · Urine Hydration Tracker',
    },
    {
      hazard: '5. Hostile / Closed Environments',
      summary: 'Sealed cabin air composition, CO₂ pooling, pressure drops, dust, and microbiome shifts.',
      signals: 'Cabin CO₂ (%/mmHg), cabin pressure (kPa), O₂%, SpO₂, skin/immune checks',
      module: 'Simulate Scenario Bar · Cabin Vitals Grid · Correlation Engine',
    },
  ];

  const officialSources = [
    {
      title: 'NASA Human Research Program — 5 Hazards of Human Spaceflight',
      description:
        'Primary spaceflight hazard taxonomy organizing radiation, isolation, distance, altered gravity, and closed habitats.',
      url: 'https://www.nasa.gov/hrp/hazards/',
    },
    {
      title: 'NASA Human Research Program — Human Health & Performance Risks',
      description:
        'Official physiological, behavioral, and radiation risk catalog including SANS, hypoxia, vestibular shifts, sleep, and radiation-induced cancers.',
      url: 'https://www.nasa.gov/hrp/risks/',
    },
    {
      title: 'Canadian Space Agency (CSA) — Monitoring Radiation & Astronaut Health (CANS)',
      description:
        'Real-world Canadian Active Neutron Spectrometer (CANS) and Bubble Technology Industries engineering for continuous neutron dosimetry.',
      url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    },
  ];

  return (
    <section
      aria-label="NASA Data and Evidence Center"
      className="space-y-6"
    >
      {/* Clear Telemetry & Non-Diagnostic Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-950/35 border border-amber-600/70 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Telemetry Disclaimer · Simulated Telemetry for Prototype Testing</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300 inline-flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            <span>100% Offline Local Browser Execution</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          All cabin environment sensors (CO₂, ambient pressure, O₂ fraction, temperature, solar radiation flux) and biometric streams displayed in HelioMed are{' '}
          <strong className="text-amber-200">Simulated Telemetry for Prototype Testing</strong>. Explainable Assessment Cards provide{' '}
          <strong>non-diagnostic initial safety and self-care guidance</strong> informed by public NASA HRP research and are not a substitute for clinical medical diagnosis.
        </p>
      </div>

      {/* Section 1: NASA HRP Physiological & Behavioral Adaptation Indicators */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>NASA Human Research Program (HRP) — Adaptation Indicators</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Physiological and behavioral markers continuously tracked across HelioMed’s onboard correlation engine.
            </p>
          </div>
          {onOpenRiskMatrix && (
            <button
              type="button"
              onClick={onOpenRiskMatrix}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-700/70 text-cyan-300 font-mono text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Open Full 15-Risk Matrix
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {hrpIndicators.map((row, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-100 text-sm">{row.indicator}</h3>
                <span className="font-mono text-[10px] text-cyan-400 whitespace-nowrap shrink-0">
                  {row.category}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{row.mechanism}</p>
              <div className="pt-1.5 border-t border-slate-900 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Mapped Module: {row.moduleLink}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Mapping of NASA 5 Hazards of Human Spaceflight to HelioMed Modules */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            NASA Hazards of Human Spaceflight — Module Mapping
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            How each of NASA’s 5 official deep-space hazards maps directly to interactive HelioMed tools.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-3 px-3.5">NASA Spaceflight Hazard</th>
                <th className="py-3 px-3.5">Key Physiological / Operational Impact</th>
                <th className="py-3 px-3.5">Signals Tracked</th>
                <th className="py-3 px-3.5">HelioMed Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-950/60">
              {hazardMappings.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60">
                  <td className="py-3 px-3.5 font-bold text-cyan-300 whitespace-nowrap">
                    {item.hazard}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 leading-relaxed">
                    {item.summary}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-amber-300">
                    {item.signals}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[11px] text-emerald-300">
                    {item.module}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Official Primary Reference Links */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100">
          Official Agency Sources &amp; Open Science Citations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {officialSources.map((src, idx) => (
            <a
              key={idx}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-600/80 transition-colors flex flex-col justify-between gap-2.5 group"
            >
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {src.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{src.description}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan-400 group-hover:text-cyan-300 underline underline-offset-2 break-all">
                <span>Open Official Source</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
