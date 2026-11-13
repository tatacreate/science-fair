import React, { useState } from 'react';
import { VitaluatsEmblem } from './OrbitautsEmblem';
import { Biometric3DViewer } from './Biometric3DViewer';
import { NasaReferenceModal } from './NasaReferenceModal';
import { INITIAL_MISSIONS, INITIAL_CREW } from '../data/missions';
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
  const [isNasaRefOpen, setIsNasaRefOpen] = useState<boolean>(false);

  const activeMissionCode = customMissionInput.trim().toUpperCase() || selectedMissionCode;

  // --------------------------------------------------------------------------
  // 1. Initial Load State: 'landing'
  // --------------------------------------------------------------------------
  if (appState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
        {/* Clean 3-Zone Top Bar */}
        <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
            <div className="flex items-center gap-3 shrink-0">
              <VitaluatsEmblem size="sm" showSubtitle={false} />
              <span className="text-lg font-serif font-black tracking-wider text-amber-400 uppercase whitespace-nowrap">
                The Vitaluats
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="#preview-3d" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                3D Body Twin
              </a>
              <a href="#portals" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                Mission Portals
              </a>
            </nav>

            <button
              type="button"
              onClick={() => onSetAppState('role-select')}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Enter Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Landing Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 flex-1">
          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              HelioMed · 100% Offline Deep-Space Health System
            </p>
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-slate-100 leading-tight [text-wrap:balance]">
              Autonomous Healthcare for Astronauts Far from Earth
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No doctors aboard and a 14+ minute signal delay to Earth. HelioMed runs completely offline so crew can inspect their 3D body twin, log health checks, and follow step-by-step emergency guidance while syncing forms to Ground Flight Surgeons.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => onSetAppState('role-select')}
                className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch Mission Portal</span>
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
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2.5 text-cyan-400">
                  <UserCheck className="w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-100">Astronaut Station (In-Flight)</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click body regions in 3D, enter readings by keyboard, mouse, or spacecraft camera, track color-coded health trends, test NASA OSDR studies, and run emergency checklists—no medical training required.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2.5 text-amber-400">
                  <Stethoscope className="w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-100">Flight Surgeon Console (Earth)</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Monitor crew check-in compliance by Mission Code, inspect 3D injury markers, track radiation dosimetry, and create Google Forms that route directly back to Ground Doctors.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-5 px-6 text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>The Vitaluats · HelioMed Autonomous Medical Station</span>
            <button
              type="button"
              onClick={() => setIsNasaRefOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Powered by NASA HRP Data</span>
            </button>
          </div>
        </footer>

        <NasaReferenceModal
          isOpen={isNasaRefOpen}
          onClose={() => setIsNasaRefOpen(false)}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. Role Gateway State: 'role-select'
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/95 px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VitaluatsEmblem size="sm" showSubtitle={false} />
            <span className="text-base font-serif font-black tracking-wider text-amber-400 uppercase whitespace-nowrap">
              The Vitaluats · Access
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSetAppState('landing')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition cursor-pointer whitespace-nowrap"
          >
            &larr; Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full flex flex-col justify-center space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-100">
            Select Portal &amp; Mission Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Choose Astronaut or Flight Surgeon and enter your name to begin.
          </p>
        </div>

        {/* 1. Portal Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedRole('astronaut')}
            className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer space-y-2 ${
              selectedRole === 'astronaut'
                ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              {selectedRole === 'astronaut' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
            </div>
            <h3 className="text-base font-bold text-slate-100">Astronaut Portal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In-flight self-assessment, 3D body inspector, health charts, OSDR tests, and emergency SOS.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('doctor')}
            className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer space-y-2 ${
              selectedRole === 'doctor'
                ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <Stethoscope className="w-5 h-5 text-amber-400" />
              {selectedRole === 'doctor' && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </div>
            <h3 className="text-base font-bold text-slate-100">Flight Surgeon Portal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Earth command console to monitor crew vitals, review forms, and dispatch Google Forms.
            </p>
          </button>
        </div>

        {/* 2. Name Input */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>{selectedRole === 'astronaut' ? 'Your Name (First Name or Full Name)' : 'Doctor Name'}</span>
          </label>

          <input
            type="text"
            placeholder={
              selectedRole === 'astronaut'
                ? 'Enter your name (e.g., Christina, Victor, Reid, Sunita)...'
                : 'Enter your name (e.g., Dr. Josef Schmid)...'
            }
            value={enteredName}
            onChange={(e) => setEnteredName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          {selectedRole === 'astronaut' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500">Crew on {activeMissionCode}:</span>
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
          )}
        </div>

        {/* 3. Mission Code Selection */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Mission Code
            </span>
            <span className="text-cyan-400 font-bold">{activeMissionCode}</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                  activeMissionCode === m.code
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.code}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or type custom mission code (e.g., ARTEMIS-IV)..."
            value={customMissionInput}
            onChange={(e) => setCustomMissionInput(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 4. Launch Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={!activeMissionCode}
            onClick={() =>
              onDirectEnter(
                selectedRole,
                activeMissionCode,
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')
              )
            }
            className="w-full py-3.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            <span>
              Launch {selectedRole === 'astronaut' ? 'Astronaut' : 'Flight Surgeon'} Station (
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
                enteredName.trim() || (selectedRole === 'astronaut' ? 'Christina Koch' : 'Dr. Josef Schmid')
              )
            }
            disabled={isLoggingIn || !activeMissionCode}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer disabled:opacity-50 border border-slate-800"
          >
            <span>
              {isLoggingIn ? 'Connecting Google Account...' : 'Optional: Link Google Account for Ground Sync'}
            </span>
          </button>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>The Vitaluats · HelioMed Station</span>
          <button
            type="button"
            onClick={() => setIsNasaRefOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Powered by NASA HRP Data</span>
          </button>
        </div>
      </footer>

      <NasaReferenceModal
        isOpen={isNasaRefOpen}
        onClose={() => setIsNasaRefOpen(false)}
      />
    </div>
  );
};
