import React, { useState } from 'react';
import { HelioMedEmblem } from './OrbitautsEmblem';
import { Biometric3DViewer } from './Biometric3DViewer';
import { NasaReferenceModal } from './NasaReferenceModal';
import { INITIAL_MISSIONS, INITIAL_CREW } from '../data/missions';
import {
  HABITAT_ENVIRONMENTS,
  HabitatEnvironmentId,
} from '../data/habitatEnvironments';
import {
  ArrowRight,
  UserCheck,
  Stethoscope,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Compass,
  User,
  BookOpen,
  ExternalLink,
  MapPin,
  WifiOff,
  Building2,
  Truck,
  Globe,
} from 'lucide-react';

interface SignInIntroPageProps {
  appState: 'landing' | 'role-select';
  onSetAppState: (state: 'landing' | 'role-select') => void;
  onSignIn: (
    role: 'astronaut' | 'doctor',
    code: string,
    name?: string,
    envId?: HabitatEnvironmentId,
    evaMode?: boolean
  ) => Promise<void>;
  onDirectEnter: (
    role: 'astronaut' | 'doctor',
    code: string,
    name?: string,
    envId?: HabitatEnvironmentId,
    evaMode?: boolean
  ) => void;
  isLoggingIn: boolean;
  authError?: string | null;
}

export const SignInIntroPage: React.FC<SignInIntroPageProps> = ({
  appState,
  onSetAppState,
  onSignIn,
  onDirectEnter,
  isLoggingIn,
  authError,
}) => {
  const [selectedRole, setSelectedRole] = useState<'astronaut' | 'doctor'>('astronaut');
  const [selectedMissionCode, setSelectedMissionCode] = useState<string>('ARTEMIS-II');
  const [customMissionInput, setCustomMissionInput] = useState<string>('');
  const [enteredName, setEnteredName] = useState<string>('');
  const [selectedEnvId, setSelectedEnvId] = useState<HabitatEnvironmentId>('spacecraft');
  const [internetStatus, setInternetStatus] = useState<'offline_unknown' | 'delayed_link' | 'live_link'>('delayed_link');
  const [activityEvaMode, setActivityEvaMode] = useState<boolean>(false);
  const [isNasaRefOpen, setIsNasaRefOpen] = useState<boolean>(false);

  const activeMissionCode = customMissionInput.trim().toUpperCase() || selectedMissionCode;

  const renderEnvSmallIcon = (id: HabitatEnvironmentId) => {
    switch (id) {
      case 'spacecraft':
        return <Rocket className="w-4 h-4 text-cyan-300 shrink-0" />;
      case 'space_station':
        return <Building2 className="w-4 h-4 text-sky-300 shrink-0" />;
      case 'rover':
        return <Truck className="w-4 h-4 text-amber-300 shrink-0" />;
      case 'planetary_base':
        return <Globe className="w-4 h-4 text-indigo-300 shrink-0" />;
      case 'earth_remote':
        return <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />;
    }
  };

  // 1. Initial Load State: 'landing'
  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-400 selection:text-slate-950">
        {/* Clean 3-Zone Top Bar */}
        <header className="border-b border-slate-800 bg-slate-900/95 px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
            <div className="flex items-center gap-3 shrink-0">
              <HelioMedEmblem size="sm" showSubtitle={false} />
              <span className="text-lg font-extrabold tracking-wider text-amber-400 uppercase whitespace-nowrap">
                HelioMed
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-200">
              <a href="#preview-3d" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                3D Body Twin
              </a>
              <a href="#portals" className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0">
                Mission Portals
              </a>
            </nav>

            <button
              type="button"
              onClick={() => onSetAppState('role-select')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 shadow-[0_0_16px_rgba(34,211,238,0.4)]"
            >
              <span>Enter Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Landing Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10 flex-1">
          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>HelioMed · 100% Offline Space Health Assistant</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight [text-wrap:balance]">
              Simple, Clear Health Support for Astronauts in Space
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              With no doctors on board and a 14+ minute signal delay to Earth, HelioMed helps astronauts complete their daily sleep, mood, and pain check-in, see instant color-coded advice, and inspect a live 3D body scan completely offline.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => onSetAppState('role-select')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-sm flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_24px_rgba(34,211,238,0.45)]"
              >
                <Rocket className="w-4 h-4" />
                <span>Choose Crew or Doctor Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* 3D Preview + Two Role Pillars */}
          <section id="preview-3d" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <Biometric3DViewer
                theme="dark"
                heartRate={72}
                spo2={98}
                radiationRate={2.1}
                status="ADVISORY"
                painAreas={['Spine / Lumbar']}
                heightClassName="h-[380px] sm:h-[430px]"
                title="INTERACTIVE 3D BODY TWIN PREVIEW"
                astronautName="Christina Koch"
              />
            </div>

            <div id="portals" className="lg:col-span-5 flex flex-col justify-center gap-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/50 space-y-2.5">
                <div className="flex items-center gap-2.5 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <UserCheck className="w-5 h-5" />
                  <h2 className="text-base font-bold text-white">Astronaut Station (In-Flight)</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Complete your 1-minute Daily Health Check-In (sleep, mood, pain &amp; habits), read easy pre-written self-care steps, explore the 3D body twin, and test simulated emergencies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/50 space-y-2.5">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                  <Stethoscope className="w-5 h-5" />
                  <h2 className="text-base font-bold text-white">Flight Surgeon Console (Earth)</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Monitor crew readiness across NASA missions, inspect 3D body alerts, review 14-day Mars transit health timelines, and track space radiation exposure.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/80 py-5 px-6 text-xs text-slate-300 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <span>HelioMed · Space Medical Station</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://www.nasa.gov/hrp/hazards/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
              >
                <span>NASA HRP Hazards</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.nasa.gov/hrp/risks/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
              >
                <span>NASA HRP Risks</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
              >
                <span>CSA CANS Radiation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setIsNasaRefOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 text-cyan-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Powered by NASA HRP Data</span>
              </button>
            </div>
          </div>
        </footer>

        <NasaReferenceModal
          isOpen={isNasaRefOpen}
          onClose={() => setIsNasaRefOpen(false)}
        />
      </div>
    );
  }

  // 2. Role Gateway State: 'role-select'
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-400 selection:text-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/95 px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelioMedEmblem size="sm" showSubtitle={false} />
            <span className="text-base font-extrabold tracking-wider text-amber-400 uppercase whitespace-nowrap">
              HelioMed · Portal Setup
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSetAppState('landing')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-bold text-xs transition cursor-pointer whitespace-nowrap"
          >
            &larr; Back Home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Choose Your Role &amp; Mission
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Select Astronaut or Ground Doctor and pick your mission to get started.
          </p>
        </div>

        {/* 1. Portal Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedRole('astronaut')}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2 ${
              selectedRole === 'astronaut'
                ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                : 'bg-slate-800/80 border-slate-600 hover:border-cyan-400/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedRole === 'astronaut' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'
                  }`}
                />
                <UserCheck className="w-5 h-5 text-cyan-300" />
              </div>
              {selectedRole === 'astronaut' && <CheckCircle2 className="w-5 h-5 text-cyan-300" />}
            </div>
            <h3 className="text-base font-bold text-white">Astronaut Station</h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Daily sleep, mood &amp; pain check-in, personalized care tips, 3D body scanner, and 14-day timeline.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('doctor')}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2 ${
              selectedRole === 'doctor'
                ? 'bg-amber-900/45 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.28)]'
                : 'bg-slate-800/80 border-slate-600 hover:border-amber-400/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedRole === 'doctor' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-500'
                  }`}
                />
                <Stethoscope className="w-5 h-5 text-amber-300" />
              </div>
              {selectedRole === 'doctor' && <CheckCircle2 className="w-5 h-5 text-amber-300" />}
            </div>
            <h3 className="text-base font-bold text-white">Flight Surgeon Console</h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Earth command console to monitor crew vitals, 3D alerts, radiation levels, and crew timelines.
            </p>
          </button>
        </div>

        {/* 2. Name Input */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-300" />
            <span>{selectedRole === 'astronaut' ? 'Astronaut Name' : 'Doctor Name'}</span>
          </label>

          <input
            type="text"
            placeholder={
              selectedRole === 'astronaut'
                ? 'Enter your name (e.g., Christina, Victor, Reid)...'
                : 'Enter your name (e.g., Dr. Josef Schmid)...'
            }
            value={enteredName}
            onChange={(e) => setEnteredName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />

          {selectedRole === 'astronaut' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Quick Pick Crew:</span>
              {(INITIAL_CREW[activeMissionCode] || []).map((crewMember) => (
                <button
                  key={crewMember.id}
                  type="button"
                  onClick={() => setEnteredName(crewMember.name)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    enteredName === crewMember.name
                      ? 'bg-cyan-400 border-cyan-200 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                      : 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  {crewMember.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Where Are You Staying? & Context Questions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Where are you staying right now?</span>
            </label>
            <p className="text-xs text-slate-300">
              HelioMed adjusts gravity, radiation baseline, oxygen limits, and daily routines for your location. You can also switch this anytime from the top dropdown menu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {HABITAT_ENVIRONMENTS.map((env) => {
              const active = selectedEnvId === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    setSelectedEnvId(env.id);
                    if (env.id === 'earth_remote') {
                      setInternetStatus('offline_unknown');
                    } else if (env.id === 'space_station') {
                      setInternetStatus('live_link');
                    } else {
                      setInternetStatus('delayed_link');
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    active
                      ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.28)]'
                      : 'bg-slate-800/80 border-slate-600 hover:border-emerald-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {renderEnvSmallIcon(env.id)}
                    {active && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                  </div>
                  <div className="text-xs font-extrabold text-white leading-snug">
                    {env.shortName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {env.gravityLabel}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Follow-up Question: Internet / Activity Context */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                <span>How is your internet / Earth link?</span>
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'offline_unknown', label: 'No / Unknown Internet (100% Offline)' },
                  { id: 'delayed_link', label: 'Deep-Space Radio Delay (Mars/Moon)' },
                  { id: 'live_link', label: 'Live Connection to Earth' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setInternetStatus(opt.id as 'offline_unknown' | 'delayed_link' | 'live_link');
                    }}
                    className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold cursor-pointer transition ${
                      internetStatus === opt.id
                        ? 'bg-cyan-500 border-cyan-300 text-slate-950 font-bold'
                        : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-300" />
                <span>What are you doing right now?</span>
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivityEvaMode(false)}
                  className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold cursor-pointer transition ${
                    !activityEvaMode
                      ? 'bg-cyan-500 border-cyan-300 text-slate-950 font-bold'
                      : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  Inside Cabin / Resting / Routine Check
                </button>
                <button
                  type="button"
                  onClick={() => setActivityEvaMode(true)}
                  className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold cursor-pointer transition ${
                    activityEvaMode
                      ? 'bg-amber-400 border-amber-200 text-slate-950 font-bold'
                      : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  Spacewalk Suit (EVA) / Active Field Work
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Mission Code Selection */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-300" />
              Mission Code
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono font-bold">
              {activeMissionCode}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {INITIAL_MISSIONS.map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => {
                  setSelectedMissionCode(m.code);
                  setCustomMissionInput('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  activeMissionCode === m.code
                    ? 'bg-indigo-500 border-indigo-300 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]'
                    : 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700'
                }`}
              >
                {m.code}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or type a custom mission code (e.g., ARTEMIS-IV)..."
            value={customMissionInput}
            onChange={(e) => setCustomMissionInput(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 5. Launch Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={!activeMissionCode}
            onClick={() =>
              onDirectEnter(
                selectedRole,
                activeMissionCode,
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid'),
                selectedEnvId,
                activityEvaMode
              )
            }
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
          >
            <Rocket className="w-4 h-4" />
            <span>
              Launch {selectedRole === 'astronaut' ? 'Astronaut' : 'Flight Surgeon'} Portal (
              {enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')})
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onSignIn(
                selectedRole,
                activeMissionCode,
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid'),
                selectedEnvId,
                activityEvaMode
              )
            }
            disabled={isLoggingIn || !activeMissionCode}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 border border-slate-600"
          >
            <span>
              {isLoggingIn ? 'Connecting Google Account...' : 'Optional: Link Google Account for Ground Sync'}
            </span>
          </button>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/80 py-4 px-6 text-xs text-slate-300 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span>HelioMed · Deep-Space Medical Station</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.nasa.gov/hrp/hazards/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
            >
              <span>NASA HRP Hazards</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.nasa.gov/hrp/risks/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
            >
              <span>NASA HRP Risks</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-white underline underline-offset-2"
            >
              <span>CSA CANS Radiation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setIsNasaRefOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 text-cyan-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Powered by NASA HRP Data</span>
            </button>
          </div>
        </div>
      </footer>

      <NasaReferenceModal
        isOpen={isNasaRefOpen}
        onClose={() => setIsNasaRefOpen(false)}
      />
    </div>
  );
};
