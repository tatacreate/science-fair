import React, { useState } from 'react';
import { OrbitautsEmblem } from './OrbitautsEmblem';
import { Biometric3DViewer } from './Biometric3DViewer';
import { INITIAL_MISSIONS, INITIAL_CREW } from '../data/missions';
import {
  ShieldAlert,
  Clock,
  HeartPulse,
  Brain,
  ClipboardCheck,
  Radio,
  Sparkles,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Rocket,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Compass,
  User,
} from 'lucide-react';

interface SignInIntroPageProps {
  appState: 'landing' | 'role-select';
  onSetAppState: (state: 'landing' | 'role-select') => void;
  onSignIn: (role: 'astronaut' | 'doctor', code: string, name?: string) => Promise<void>;
  onDirectEnter: (role: 'astronaut' | 'doctor', code: string, name?: string) => void;
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

  const activeMissionCode = customMissionInput.trim().toUpperCase() || selectedMissionCode;

  // --------------------------------------------------------------------------
  // 1. Initial Load State: 'landing'
  // --------------------------------------------------------------------------
  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
        {/* Ambient Deep Space Nebular Background */}
        <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-slate-950" />
        <div className="fixed top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Top Mission Briefing Header */}
        <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <OrbitautsEmblem size="sm" showSubtitle={false} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400 uppercase">
                    The Orbitauts
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold">
                    HELIOMED AUTONOMOUS MEDICAL STATION
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Autonomous Deep-Space Clinical Infrastructure • Zero Onboard Physicians
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>EARTH LATENCY: 14m 28s</span>
              </div>
              <button
                type="button"
                onClick={() => onSetAppState('role-select')}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-950 cursor-pointer flex items-center gap-2"
              >
                <span>Initialize Mission Station</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Immersive Landing Hero */}
        <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 flex-1">
          {/* Hero Banner Section */}
          <section className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-600/60 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest shadow-xl">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              DEEP SPACE TELEMETRY &amp; AUTONOMOUS TRIAGE HUB
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-slate-100 leading-tight">
              Autonomous Healthcare for Astronauts Millions of Miles from Earth
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              When traveling to Mars or deep space, human doctors cannot come with you. HelioMed operates 100% offline with zero internet in deep space, providing astronauts with instant clinical triage, 3D anatomical pain mapping, and giving Earth-based Flight Surgeons a synchronized mission command console.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onSetAppState('role-select')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm sm:text-base shadow-2xl shadow-cyan-950/60 flex items-center gap-3 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Rocket className="w-5 h-5" />
                <span>Initialize Mission Station</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Interactive 3D Mannequin & Dual Role Showcase */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 3D Anatomical Digital Twin Showcase */}
            <div className="lg:col-span-7 space-y-3">
              <div className="p-2 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between px-3 pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-bold text-slate-200">
                      LIVE 3D BIOMETRIC HOLOGRAM PREVIEW
                    </span>
                  </div>
                  <span className="text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800 text-[10px]">
                    INTERACTIVE 3D
                  </span>
                </div>

                <Biometric3DViewer
                  theme="dark"
                  heartRate={72}
                  spo2={98}
                  radiationRate={2.1}
                  status="ADVISORY"
                  painAreas={['Spine / Lumbar']}
                  heightClassName="h-[360px] sm:h-[420px]"
                  title="3D ANATOMICAL HOLOGRAM MANNEQUIN"
                  astronautName="Christina Koch"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] font-mono text-slate-400">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-rose-400 font-bold block">Hazard Red Spot</span>
                    <span className="text-[10px] text-slate-500">Spine Elongation</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-cyan-400 font-bold block">Cyan Mannequin</span>
                    <span className="text-[10px] text-slate-500">Translucent mesh</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-amber-400 font-bold block">Articulated Nodes</span>
                    <span className="text-[10px] text-slate-500">Joints &amp; Shoulders</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block">Zero Latency</span>
                    <span className="text-[10px] text-slate-500">Offline Protocol</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual Platform Role Pillars */}
            <div className="lg:col-span-5 space-y-4">
              {/* Pillar 1: For Astronauts */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-800/60 shadow-xl space-y-3 relative overflow-hidden group hover:border-cyan-500 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800">
                    ONBOARD DEEP SPACE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  For Astronauts On Board
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Start each day with the autonomous 6-point medical self-check. Rate microgravity sleep, report physical feelings, pinpoint pain areas on your rotating 3D avatar, and execute standardized NASA flight medicine mitigation protocols.
                </p>
                <div className="pt-1 flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
                  <span>Daily Forms • 3D Pain Mapping • Habit Tracking</span>
                </div>
              </div>

              {/* Pillar 2: For Flight Surgeons */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-800/60 shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800">
                    EARTH MISSION CONTROL
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  For NASA Flight Surgeons
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Monitor an entire multi-crew mission from Ground Control. Track check-in submission compliance, view active injury hazard spots on the 3D twin, review vitals, and create new mission codes to track multiple exploration fleets.
                </p>
                <div className="pt-1 flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold">
                  <span>Mission Code Grouping • Crew Roster • Latency Queue</span>
                </div>
              </div>
            </div>
          </section>

          {/* Three Core Deep Space Challenges */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Zero Doctors On Board</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No surgeon is in the capsule. Astronauts must have reliable self-assessment tools to detect spinal issues, radiation spikes, and hypoxia early.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">14+ Minute Signal Delay</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Earth communication delay makes real-time telemedicine physically impossible. Onboard flight computers execute immediate clinical countermeasures before ground signals arrive.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                <Brain className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">NASA Flight Human-System Standards</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built on NASA-STD-3001 and NASA Human Research Program protocols for microgravity fluid shift, SANS, and spinal elongation.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>HelioMed Autonomous Medical Station • Deep-Space Flight Operations</span>
            <span>The Orbitauts Heritage • NASA JSC &amp; Deep Space Human Protocol</span>
          </div>
        </footer>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. Role Gateway State: 'role-select'
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OrbitautsEmblem size="sm" showSubtitle={false} />
            <div>
              <span className="text-base font-serif font-black tracking-wider text-amber-400 uppercase">
                HelioMed Gateway
              </span>
              <span className="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline">
                Mission Access &amp; Role Authentication
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSetAppState('landing')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition cursor-pointer"
          >
            &larr; Return to Home Briefing
          </button>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-100 tracking-wide">
            Select Your Mission Station Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Choose your role and specify your Mission Code to load the appropriate station and crew records.
          </p>
        </div>

        {/* 1. Portal Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Astronaut */}
          <button
            type="button"
            onClick={() => setSelectedRole('astronaut')}
            className={`p-6 rounded-2xl border text-left transition-all cursor-pointer space-y-3 relative ${
              selectedRole === 'astronaut'
                ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 shadow-2xl shadow-cyan-950/60'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRole === 'astronaut'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <UserCheck className="w-5 h-5" />
              </div>
              {selectedRole === 'astronaut' && (
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Astronaut Portal</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                For crew members on space transit. Fill daily check-ins, view your 3D anatomical body twin with dynamic pain mapping, and execute autonomous flight triage protocols.
              </p>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 font-semibold pt-1">
              &bull; Personal Vitals &amp; Self-Check
            </div>
          </button>

          {/* Card B: Flight Surgeon */}
          <button
            type="button"
            onClick={() => setSelectedRole('doctor')}
            className={`p-6 rounded-2xl border text-left transition-all cursor-pointer space-y-3 relative ${
              selectedRole === 'doctor'
                ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 shadow-2xl shadow-amber-950/60'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRole === 'doctor'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              {selectedRole === 'doctor' && (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Flight Surgeon Portal</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                For NASA medical directors on Earth. View crew check-in compliance, track active injury flags, monitor telemetry, and manage multiple mission codes.
              </p>
            </div>
            <div className="text-[11px] font-mono text-amber-300 font-semibold pt-1">
              &bull; Fleet Health &amp; Multi-Crew Tracking
            </div>
          </button>
        </div>

        {/* 2. Name Input - Asks astronaut for their name only */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              {selectedRole === 'astronaut' ? 'Your Name:' : 'Your Doctor Name:'}
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              {selectedRole === 'astronaut' ? 'Astronaut Name Only' : 'Flight Surgeon'}
            </span>
          </div>

          <input
            type="text"
            placeholder={
              selectedRole === 'astronaut'
                ? "Enter your name (e.g., Christina, Victor, Reid, Sunita)..."
                : "Enter your doctor name (e.g., Dr. Josef Schmid, Dr. Natacha Chough)..."
            }
            value={enteredName}
            onChange={(e) => setEnteredName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          {selectedRole === 'astronaut' ? (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] text-slate-400 font-sans">
                Please enter your real name. No weird last names or fantasy titles.
              </p>
              {/* Quick suggestion buttons for real astronauts on the chosen mission */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Real Crew on {activeMissionCode}:
                </span>
                {(INITIAL_CREW[activeMissionCode] || []).map((crewMember) => (
                  <button
                    key={crewMember.id}
                    type="button"
                    onClick={() => setEnteredName(crewMember.name)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      enteredName === crewMember.name
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {crewMember.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 font-sans">
              NASA Ground Flight Surgeon directing mission telemedicine and crew health compliance.
            </p>
          )}
        </div>

        {/* 3. Mission Code Selection */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Select or Enter Real Mission Code:
            </label>
            <span className="text-[11px] font-mono text-cyan-400">
              Active Mission: <strong className="text-white">{activeMissionCode}</strong>
            </span>
          </div>

          {/* Quick-Pick Mission Badges */}
          <div className="flex flex-wrap gap-2">
            {INITIAL_MISSIONS.map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => {
                  setSelectedMissionCode(m.code);
                  setCustomMissionInput('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer border ${
                  activeMissionCode === m.code
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold">{m.code}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">({m.name.replace('NASA ', '').split(' ')[0]})</span>
              </button>
            ))}
          </div>

          {/* Custom Mission Code input */}
          <div className="pt-2">
            <input
              type="text"
              placeholder="Or enter custom mission code (e.g. ARTEMIS-IV, CREW-10)..."
              value={customMissionInput}
              onChange={(e) => setCustomMissionInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Error message banner */}
        {authError && (
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-300 text-xs flex items-center gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 4. Authentication Action Buttons */}
        <div className="space-y-3">
          {/* Primary: Sign in with Google */}
          <button
            type="button"
            onClick={() =>
              onSignIn(
                selectedRole,
                activeMissionCode,
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')
              )
            }
            disabled={isLoggingIn || !activeMissionCode}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm sm:text-base shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group border border-slate-200"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin w-5 h-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Authenticating with Firebase...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>
                  Sign in with Google as{' '}
                  {enteredName.trim()
                    ? enteredName.trim()
                    : selectedRole === 'astronaut'
                    ? 'Astronaut'
                    : 'Flight Surgeon'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-auto" />
              </>
            )}
          </button>

          {/* Secondary: Instant Direct Flight Mode */}
          <button
            type="button"
            onClick={() =>
              onDirectEnter(
                selectedRole,
                activeMissionCode,
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')
              )
            }
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 font-mono text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span>
              Enter Station as{' '}
              {enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')} ({activeMissionCode}) &rarr;
            </span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <span>HelioMed • Mission Code Validated Security • Zero Onboard Delay</span>
      </footer>
    </div>
  );
};
