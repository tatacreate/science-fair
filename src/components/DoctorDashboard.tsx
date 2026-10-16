import React, { useState } from 'react';
import { OrbitautsEmblem } from './OrbitautsEmblem';
import { Biometric3DViewer } from './Biometric3DViewer';
import { INITIAL_MISSIONS, INITIAL_CREW, MissionDefinition, MissionCrewMember } from '../data/missions';
import {
  Stethoscope,
  Radio,
  ClipboardCheck,
  AlertTriangle,
  HeartPulse,
  Plus,
  X,
  LogOut,
  Home,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
  User,
  Eye,
  Sparkles,
} from 'lucide-react';

interface DoctorDashboardProps {
  missionCode: string;
  onReturnHome: () => void;
  onSignOut: () => void;
  theme?: 'light' | 'dark';
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  missionCode: initialMissionCode,
  onReturnHome,
  onSignOut,
  theme = 'dark',
}) => {
  const [missions, setMissions] = useState<MissionDefinition[]>(INITIAL_MISSIONS);
  const [activeCode, setActiveCode] = useState<string>(initialMissionCode || 'ARTEMIS-II');
  const [crewRoster, setCrewRoster] = useState<Record<string, MissionCrewMember[]>>(INITIAL_CREW);
  const [inspectedAstronaut, setInspectedAstronaut] = useState<MissionCrewMember | null>(null);

  // Create Mission Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const currentMission =
    missions.find((m) => m.code === activeCode) || {
      code: activeCode,
      name: `${activeCode} Deep Space Transit`,
      destination: 'Deep Space Orbit',
      transitDay: 1,
      flightSurgeon: 'Dr. Josef Schmid, MD (NASA Flight Surgeon)',
      earthDelay: '14m 28s',
      crewCount: (crewRoster[activeCode] || []).length,
      description: 'Active mission command link.',
    };

  const currentCrew = crewRoster[activeCode] || [
    {
      id: `${activeCode}-astro-01`,
      name: 'Astronaut',
      callsign: 'Astronaut',
      role: 'Flight Crew',
      missionDay: 1,
      status: 'NOMINAL',
      cumulativeRadiationDoseMsv: 12.0,
      missionCode: activeCode,
      hasSubmittedToday: false,
      lastCheckinTime: 'Never',
      activePainAreas: [],
      painSeverity: 0,
      recentVitals: {
        heartRate: 72,
        spo2: 98,
        coreTemp: 37.0,
        radiationRate: 2.1,
      },
    },
  ];

  // Derived compliance statistics
  const totalCrew = currentCrew.length;
  const submittedCrew = currentCrew.filter((c) => c.hasSubmittedToday).length;
  const compliancePct = Math.round((submittedCrew / (totalCrew || 1)) * 100);
  const alertCount = currentCrew.filter((c) => c.status !== 'NOMINAL').length;

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code) return;

    const newMissionDef: MissionDefinition = {
      code,
      name: newName.trim() || `${code} Mission`,
      destination: newDestination.trim() || 'Orbital Deep Space',
      transitDay: 1,
      flightSurgeon: 'NASA Flight Operations',
      earthDelay: '12m 40s',
      crewCount: 2,
      description: newDescription.trim() || 'New exploration mission assigned under HelioMed supervision.',
    };

    setMissions((prev) => [...prev, newMissionDef]);

    // Seed default crew for newly created mission
    setCrewRoster((prev) => ({
      ...prev,
      [code]: [
        {
          id: `${code}-lead`,
          name: `${code} Commander`,
          callsign: 'CDR',
          role: 'Mission Commander',
          missionDay: 1,
          status: 'NOMINAL',
          cumulativeRadiationDoseMsv: 5.4,
          missionCode: code,
          hasSubmittedToday: true,
          lastCheckinTime: 'Just now',
          activePainAreas: [],
          painSeverity: 0,
          recentVitals: { heartRate: 70, spo2: 99, coreTemp: 36.9, radiationRate: 1.8 },
        },
        {
          id: `${code}-specialist`,
          name: `${code} Specialist`,
          callsign: 'MS',
          role: 'Flight Specialist',
          missionDay: 1,
          status: 'ADVISORY',
          cumulativeRadiationDoseMsv: 6.1,
          missionCode: code,
          hasSubmittedToday: false,
          lastCheckinTime: 'Pending',
          activePainAreas: ['Neck'],
          painSeverity: 2,
          recentVitals: { heartRate: 76, spo2: 97, coreTemp: 37.1, radiationRate: 2.0 },
        },
      ],
    }));

    setActiveCode(code);
    setIsCreateModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewDestination('');
    setNewDescription('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-16">
      {/* Flight Surgeon Mission Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OrbitautsEmblem size="sm" showSubtitle={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400 uppercase">
                  NASA Flight Surgeon Console
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-300 font-bold">
                  GROUND MEDICAL COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Deep-Space Multi-Mission Crew Surveillance • Earth Telemetry Station
              </p>
            </div>
          </div>

          {/* Quick Mission Selector & Control Affordances */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Active Mission Switcher Dropdown */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">MISSION:</span>
              <select
                value={activeCode}
                onChange={(e) => {
                  setActiveCode(e.target.value);
                  setInspectedAstronaut(null);
                }}
                className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer"
              >
                {missions.map((m) => (
                  <option key={m.code} value={m.code} className="bg-slate-900 text-slate-200">
                    {m.code} ({m.name.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Create Mission Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Mission</span>
            </button>

            {/* Return to Home Briefing */}
            <button
              type="button"
              onClick={onReturnHome}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
              title="Return to Home Landing"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Home Briefing</span>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-900/60 text-slate-400 hover:text-rose-300 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Mission Banner & Telemetry Latency Indicator */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                CODE: {currentMission.code}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {currentMission.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {currentMission.description} &bull; Target Destination: <strong className="text-slate-200">{currentMission.destination}</strong> &bull; Flight Day {currentMission.transitDay}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-500 block">EARTH COMM LAG</span>
                <span className="font-bold text-amber-300">{currentMission.earthDelay}</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-500 block">FLIGHT SURGEON</span>
                <span className="font-bold text-slate-200 truncate max-w-[140px] block">
                  {currentMission.flightSurgeon.split(',')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Metric Strips for Quick Crew Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Assigned Crew</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalCrew} Astronauts</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Check-in Compliance</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {compliancePct}% ({submittedCrew}/{totalCrew})
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Triage Alerts Active</span>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  alertCount > 0 ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {alertCount} Astronauts
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                alertCount > 0
                  ? 'bg-rose-950 border border-rose-800 text-rose-400'
                  : 'bg-slate-950 border border-slate-800 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Deep Space Background</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">2.1 µSv/h</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Crew Health Check-in Summary Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                Crew Daily Check-In Roster &amp; Physiological Status
              </h3>
              <p className="text-xs text-slate-400">
                Real-time tracking for Mission <strong className="text-amber-300 font-mono">{activeCode}</strong>
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Auto-syncing via Deep Space Network
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Astronaut</th>
                  <th className="py-3 px-3">Role &amp; Callsign</th>
                  <th className="py-3 px-3">Today Check-In</th>
                  <th className="py-3 px-3">Reported Pain / Injuries</th>
                  <th className="py-3 px-3">Vitals (HR / SpO2)</th>
                  <th className="py-3 px-3">Triage</th>
                  <th className="py-3 px-3 text-right">Inspect Mannequin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentCrew.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      inspectedAstronaut?.id === c.id ? 'bg-slate-800/60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200 text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.id}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-300 font-medium block">{c.role}</span>
                      <span className="text-[11px] font-mono text-amber-400">&quot;{c.callsign}&quot;</span>
                    </td>
                    <td className="py-3.5 px-3">
                      {c.hasSubmittedToday ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Submitted ({c.lastCheckinTime || 'Today'})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Pending ({c.lastCheckinTime || 'Overdue'})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {c.activePainAreas && c.activePainAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.activePainAreas.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-mono font-semibold"
                            >
                              {p} ({c.painSeverity}/10)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-xs font-mono">No pain reported</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-300">
                      <div>
                        {c.recentVitals.heartRate} bpm &bull; {c.recentVitals.spo2}% SpO2
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.recentVitals.coreTemp}°C &bull; {c.recentVitals.radiationRate} µSv/h
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          c.status === 'CRITICAL'
                            ? 'bg-rose-950 border-rose-600 text-rose-300'
                            : c.status === 'WARNING'
                            ? 'bg-amber-950 border-amber-600 text-amber-300'
                            : c.status === 'ADVISORY'
                            ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                            : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectedAstronaut(c)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                          inspectedAstronaut?.id === c.id
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect 3D</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3D Anatomical Inspection Panel (Loaded when doctor clicks "Inspect 3D") */}
        {inspectedAstronaut && (
          <div className="bg-slate-900/90 border-2 border-cyan-600/80 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Inspecting 3D Hologram Mannequin: {inspectedAstronaut.name}
                    <span className="text-xs font-mono text-amber-300">
                      ({inspectedAstronaut.callsign})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Live dynamic pain mapping, hazard spot analysis, and mitigation steps for Mission {activeCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedAstronaut(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer self-start sm:self-center"
              >
                Close Inspection
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <Biometric3DViewer
                  theme={theme}
                  heartRate={inspectedAstronaut.recentVitals.heartRate}
                  spo2={inspectedAstronaut.recentVitals.spo2}
                  radiationRate={inspectedAstronaut.recentVitals.radiationRate}
                  status={inspectedAstronaut.status}
                  painAreas={inspectedAstronaut.activePainAreas}
                  heightClassName="h-[440px]"
                  title={`3D HOLOGRAM MANNEQUIN - ${inspectedAstronaut.name.toUpperCase()}`}
                  astronautName={inspectedAstronaut.name}
                />
              </div>

              <div className="lg:col-span-4 space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-mono text-[11px] uppercase text-cyan-400 font-bold block">
                    Astronaut Check-in Details
                  </span>
                  <div className="space-y-1.5 text-slate-300">
                    <div>
                      <span className="text-slate-500">Sleep Score:</span>{' '}
                      <strong>{inspectedAstronaut.latestCheckin?.sleepQuality || 8}/10</strong> (
                      {inspectedAstronaut.latestCheckin?.sleepHours || 7}h)
                    </div>
                    <div>
                      <span className="text-slate-500">Mental State:</span>{' '}
                      {inspectedAstronaut.latestCheckin?.mentalHealth || 'Operational'}
                    </div>
                    <div>
                      <span className="text-slate-500">Reported Feeling:</span>{' '}
                      {inspectedAstronaut.latestCheckin?.overallFeeling || 'Nominal adaptation'}
                    </div>
                    <div>
                      <span className="text-slate-500">Pain Areas:</span>{' '}
                      <span className="text-rose-400 font-bold">
                        {inspectedAstronaut.activePainAreas.join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {inspectedAstronaut.latestCheckin?.aiFeedback && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <span className="font-mono text-[11px] uppercase text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Autonomous Onboard Guidance
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans text-xs">
                      {inspectedAstronaut.latestCheckin.aiFeedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create New Mission Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Create New Mission &amp; Issue Mission Code
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Unique Mission Code (e.g. TITAN-I, EUROPA-II):
                </label>
                <input
                  type="text"
                  required
                  placeholder="TITAN-I"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Mission Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Titan Methane Sea Explorer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Target Destination / Orbit:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Saturn Moon Titan Transit"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Mission Protocol &amp; Medical Focus:
                </label>
                <textarea
                  rows={2}
                  placeholder="Cryogenic radiation shielding and prolonged microgravity musculoskeletal countermeasure tracking."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono text-xs cursor-pointer shadow"
                >
                  Create &amp; Activate Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
