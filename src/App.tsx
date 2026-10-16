import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
} from 'firebase/firestore';
import {
  initAuthListener,
  signInWithGoogle,
  logOut,
  testFirestoreConnection,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  DailyCheckin,
  TelemetryState,
  CabinEnvironment,
  SimulationScenario,
  TriageLevel,
} from './types/heliomed';
import { OrbitautsEmblem } from './components/OrbitautsEmblem';
import { Biometric3DViewer } from './components/Biometric3DViewer';
import { TelemetryVitalsGrid } from './components/TelemetryVitalsGrid';
import { ClinicalTriageEngine } from './components/ClinicalTriageEngine';
import { GeminiThinkingModal } from './components/GeminiThinkingModal';
import { LiteratureExplorer } from './components/LiteratureExplorer';
import { WorkspaceHub } from './components/WorkspaceHub';
import { DailyNotificationBanner } from './components/DailyNotificationBanner';
import { DailySelfCheckinModal } from './components/DailySelfCheckinModal';
import { SignInIntroPage } from './components/SignInIntroPage';
import { DoctorDashboard } from './components/DoctorDashboard';
import { INITIAL_CREW, MissionCrewMember } from './data/missions';
import {
  Radio,
  LogOut,
  Sparkles,
  ClipboardCheck,
  Moon,
  Smile,
  HeartPulse,
  Target,
  AlertCircle,
  Clock,
  Shield,
  ChevronRight,
  Home,
  Users,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [offlineUser, setOfflineUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [appState, setAppState] = useState<'landing' | 'role-select' | 'authenticated'>('landing');
  const [userRole, setUserRole] = useState<'astronaut' | 'doctor' | null>(null);
  const [missionCode, setMissionCode] = useState<string>('ARTEMIS-II');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>('christina-koch');

  const activeUser = user || offlineUser;
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Daily Check-in Form Modal & History
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [selectedHistoryCheckin, setSelectedHistoryCheckin] = useState<DailyCheckin | null>(null);

  // Active Simulation Scenario (for acute emergencies)
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  // Cabin Habitat Environment
  const [cabinEnvironment, setCabinEnvironment] = useState<CabinEnvironment>({
    ambientCO2: 2.3, // mmHg
    ambientPressure: 101.3, // kPa
    cabinTemp: 21.8, // °C
    o2Fraction: 21.2, // %
    relativeHumidity: 48,
    speRadiationFlux: 4.2,
  });

  // Real-time Fused Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    timestamp: Date.now(),
    heartRate: 72,
    hrvRmssd: 58,
    spo2: 98,
    coreTemp: 37.0,
    respiratoryRate: 15,
    radiationDoseRate: 2.1,
    systolicBp: 118,
    diastolicBp: 76,
    shockIndex: 0.61,
    fatigueScore: 24,
  });

  // Gemini Thinking Modal State
  const [isThinkingModalOpen, setIsThinkingModalOpen] = useState(false);
  const [thinkingAnalysis, setThinkingAnalysis] = useState('');
  const [isThinkingLoading, setIsThinkingLoading] = useState(false);

  // Active Mission & Crew lookup
  const activeMissionCode = missionCode || 'ARTEMIS-II';
  const missionCrewList: MissionCrewMember[] =
    INITIAL_CREW[activeMissionCode] || INITIAL_CREW['ARTEMIS-II'] || [];
  const currentAstronaut =
    missionCrewList.find((c) => c.id === selectedAstronautId) || missionCrewList[0];

  // Current Astronaut identity (Prioritizes the exact name entered by the astronaut)
  const astronautName = activeUser?.displayName || currentAstronaut?.name || 'Christina Koch';

  // Determine global triage level
  const currentTriageLevel: TriageLevel = activeScenario ? activeScenario.severity : 'NOMINAL';

  // Test Firestore connection & listen for Auth state
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = initAuthListener((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Listen to daily_checkins from Firestore when user is authenticated
  useEffect(() => {
    if (!user) {
      // Default local sample check-in so astronaut sees realistic baseline
      const initialSample: DailyCheckin = {
        id: 'sample-01',
        userId: 'local',
        astronautName: 'Astronaut',
        date: new Date().toISOString().split('T')[0],
        sleepQuality: 8,
        sleepHours: 7.0,
        mentalHealth: 'Calm & Focused: Settling into mission routine, sensory adjustments progressing well.',
        overallFeeling: 'Good physical energy. Normal light cephalic fullness upon wake-up.',
        hasPain: true,
        painAreas: ['Spine / Lumbar'],
        painSeverity: 3,
        painNotes: 'Mild morning lumbar stiffness from microgravity spinal elongation.',
        habitsToImprove: ['Hydration / Electrolyte intake', 'Spinal stretching routine'],
        habitsStrugglingWith: ['Falling asleep in sleeping sack'],
        aiFeedback: 'Autonomous Guidance: Your sleep score of 8/10 indicates good restorative adaptation. For spinal elongation stiffness, perform 15 minutes of knees-to-chest fetal stretching before beginning your ARED cycle. Maintain 2.5L isotonic fluid intake to counteract spaceflight plasma contraction.',
        createdAt: '08:15 UTC',
      };
      setDailyCheckins([initialSample]);
      return;
    }

    const checkinsCol = 'daily_checkins';
    const q = query(collection(db, checkinsCol), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => docSnap.data() as DailyCheckin);
        // Sort descending by date/id
        fetched.sort((a, b) => b.id.localeCompare(a.id));
        setDailyCheckins(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, checkinsCol);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time telemetry generator loop (subtle natural drift or scenario modulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        if (activeScenario) {
          const mod = activeScenario.vitalsModifiers;
          const noise = (Math.random() - 0.5) * 2;
          return {
            ...prev,
            timestamp: Date.now(),
            heartRate: Math.round((mod.heartRate ?? prev.heartRate) + noise),
            hrvRmssd: Math.max(12, Math.round((mod.hrvRmssd ?? prev.hrvRmssd) + noise * 0.5)),
            spo2: Math.min(100, Math.round((mod.spo2 ?? prev.spo2) + (Math.random() > 0.7 ? 1 : 0))),
            coreTemp: +(prev.coreTemp + (Math.random() - 0.5) * 0.04).toFixed(2),
            radiationDoseRate: +(mod.radiationDoseRate ?? prev.radiationDoseRate + (Math.random() - 0.5) * 0.2).toFixed(1),
            respiratoryRate: Math.round((mod.respiratoryRate ?? prev.respiratoryRate) + (Math.random() > 0.6 ? 1 : 0)),
            systolicBp: Math.round(mod.systolicBp ?? prev.systolicBp),
            diastolicBp: Math.round(mod.diastolicBp ?? prev.diastolicBp),
            fatigueScore: mod.fatigueScore ?? prev.fatigueScore,
          };
        }

        const hrDrift = (Math.random() - 0.5) * 1.5;
        const newHr = Math.min(85, Math.max(64, Math.round(prev.heartRate + hrDrift)));
        return {
          ...prev,
          timestamp: Date.now(),
          heartRate: newHr,
          hrvRmssd: Math.min(75, Math.max(45, Math.round(prev.hrvRmssd + (Math.random() - 0.5)))),
          spo2: Math.min(99, Math.max(97, Math.round(prev.spo2 + (Math.random() > 0.8 ? -1 : 1)))),
          coreTemp: +(36.9 + (Math.random() - 0.5) * 0.15).toFixed(2),
          radiationDoseRate: +(2.1 + (Math.random() - 0.5) * 0.1).toFixed(1),
          respiratoryRate: Math.min(18, Math.max(14, Math.round(prev.respiratoryRate + (Math.random() - 0.5)))),
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [activeScenario]);

  // Handle Scenario Injection
  const handleSelectScenario = (sc: SimulationScenario | null) => {
    setActiveScenario(sc);
    if (sc) {
      setCabinEnvironment((prev) => ({
        ...prev,
        ...sc.cabinModifiers,
      }));
    } else {
      setCabinEnvironment({
        ambientCO2: 2.3,
        ambientPressure: 101.3,
        cabinTemp: 21.8,
        o2Fraction: 21.2,
        relativeHumidity: 48,
        speRadiationFlux: 4.2,
      });
    }
  };

  // Save new daily checkin to Firestore or local state
  const handleSaveCheckin = async (checkin: DailyCheckin) => {
    if (user) {
      try {
        await setDoc(doc(db, 'daily_checkins', checkin.id), checkin);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'daily_checkins');
      }
    } else {
      setDailyCheckins((prev) => [checkin, ...prev]);
    }
  };

  // Trigger Gemini-4 Deep Thinking
  const handleTriggerThinking = async () => {
    setIsThinkingModalOpen(true);
    setIsThinkingLoading(true);
    try {
      const res = await fetch('/api/gemini/triage-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronaut: { name: astronautName, status: currentTriageLevel },
          telemetry,
          cabinEnvironment,
          clinicalContext: activeScenario
            ? `${activeScenario.name}: ${activeScenario.description}. Signs: ${activeScenario.clinicalSigns}`
            : `Routine flight self-assessment. Latest sleep quality: ${dailyCheckins[0]?.sleepQuality || 7}/10. Pain reported: ${dailyCheckins[0]?.hasPain ? dailyCheckins[0]?.painAreas.join(', ') : 'None'}.`,
        }),
      });
      const data = await res.json();
      setThinkingAnalysis(data.analysis || 'Analysis complete.');
    } catch (err: any) {
      console.error('Failed to run thinking triage:', err);
      setThinkingAnalysis('Error generating deep thinking triage. Please retry.');
    } finally {
      setIsThinkingLoading(false);
    }
  };

  const handleLogin = async (role: 'astronaut' | 'doctor', code: string, customName?: string) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        const preferredName = customName?.trim() || result.user.displayName || (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
        setUser(result.user);
        setOfflineUser({
          ...result.user,
          displayName: preferredName,
        } as any);
        setUserRole(role);
        setMissionCode(code);
        setAppState('authenticated');
      }
    } catch (err: any) {
      console.warn('Firebase Google Auth popup cancelled or unavailable; initializing direct simulation:', err);
      const preferredName = customName?.trim() || (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
      setOfflineUser({
        uid: `crew-${role}-${Date.now().toString(36)}`,
        displayName: preferredName,
        photoURL: null,
        email: role === 'doctor' ? 'jschmid@nasa.gov' : `${preferredName.toLowerCase().replace(/[^a-z0-9]/g, '')}@nasa.gov`,
      } as any);
      setUserRole(role);
      setMissionCode(code);
      setAppState('authenticated');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDirectEnter = (role: 'astronaut' | 'doctor', code: string, customName?: string) => {
    const preferredName = customName?.trim() || (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
    setOfflineUser({
      uid: `crew-${role}-${Date.now().toString(36)}`,
      displayName: preferredName,
      photoURL: null,
      email: role === 'doctor' ? 'jschmid@nasa.gov' : `${preferredName.toLowerCase().replace(/[^a-z0-9]/g, '')}@nasa.gov`,
    } as any);
    setUserRole(role);
    setMissionCode(code);
    setAppState('authenticated');
  };

  const handleLogout = async () => {
    setOfflineUser(null);
    setUser(null);
    setUserRole(null);
    setAuthError(null);
    setAppState('landing');
    try {
      await logOut();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReturnHome = () => {
    setAppState('landing');
  };

  const handleSelectAstronaut = (astroId: string) => {
    setSelectedAstronautId(astroId);
    const member = missionCrewList.find((c) => c.id === astroId);
    if (member) {
      setTelemetry((prev) => ({
        ...prev,
        heartRate: member.recentVitals.heartRate,
        spo2: member.recentVitals.spo2,
        coreTemp: member.recentVitals.coreTemp,
        radiationDoseRate: member.recentVitals.radiationRate,
      }));
      if (member.latestCheckin) {
        setDailyCheckins([member.latestCheckin]);
      }
    }
  };

  // 1. Initial Landing & Role Selection Gateways or if not authenticated
  if (appState === 'landing' || appState === 'role-select' || !activeUser) {
    return (
      <SignInIntroPage
        appState={appState === 'authenticated' ? 'landing' : appState}
        onSetAppState={(s) => setAppState(s)}
        onSignIn={handleLogin}
        onDirectEnter={handleDirectEnter}
        isLoggingIn={isLoggingIn}
        authError={authError}
      />
    );
  }

  // 2. NASA Flight Surgeon / Doctor Dashboard State
  if (userRole === 'doctor') {
    return (
      <DoctorDashboard
        missionCode={activeMissionCode}
        onReturnHome={handleReturnHome}
        onSignOut={handleLogout}
        theme={theme}
      />
    );
  }

  // 3. Astronaut Autonomous Medical Station State
  const todayStr = new Date().toISOString().split('T')[0];
  const latestCheckin = dailyCheckins[0] || currentAstronaut?.latestCheckin || null;
  const hasSubmittedToday =
    dailyCheckins.some((c) => c.date === todayStr) || !!currentAstronaut?.hasSubmittedToday;

  // Active pain areas to highlight on the 3D model
  const activePainAreas = latestCheckin?.hasPain
    ? latestCheckin.painAreas
    : (currentAstronaut?.activePainAreas || []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-16">
      {/* Top Mission Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <OrbitautsEmblem size="sm" showSubtitle={false} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400 uppercase">
                  The Orbitauts
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold">
                  HELIOMED AUTONOMOUS MEDICAL STATION
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                For astronauts in space with zero onboard doctors • Earth comm delay: 14m 28s
              </p>
            </div>
          </div>

          {/* Deep Space Context & Status */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Return to Mission Home / Landing */}
            <button
              type="button"
              onClick={handleReturnHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition cursor-pointer"
              title="Return to Welcome & Role Selection"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mission Home</span>
            </button>

            {/* Multi-Crew Account Switcher - Only shown when multiple astronaut profiles exist */}
            {missionCrewList.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-sm">
                <Users className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="text-[10px] text-slate-400 font-bold uppercase hidden xl:inline">Crew Profile:</span>
                <select
                  value={currentAstronaut?.id || ''}
                  onChange={(e) => handleSelectAstronaut(e.target.value)}
                  className="bg-transparent text-cyan-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                  aria-label="Switch Astronaut Profile"
                >
                  {missionCrewList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-950 text-slate-200">
                      {m.name} ({m.role}) {m.activePainAreas.length > 0 ? '⚠️' : '✓'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">MISSION:</span>
              <span className="text-amber-300 font-bold">{activeMissionCode}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-400">EARTH DELAY:</span>
              <span className="text-cyan-300 font-bold">14m 28s</span>
            </div>

            {/* Authenticated Astronaut Session */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center font-bold text-xs text-white uppercase overflow-hidden border border-cyan-500 shadow-sm">
                {activeUser.photoURL ? (
                  <img src={activeUser.photoURL} alt={activeUser.displayName || 'Astronaut'} className="w-full h-full object-cover" />
                ) : (
                  activeUser.displayName?.[0] || 'A'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-200 font-semibold truncate max-w-[130px] hidden sm:inline">
                  {activeUser.displayName || 'Astronaut'}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">
                  {user ? 'AUTHENTICATED' : 'OFFLINE FLIGHT'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 border border-transparent hover:border-rose-900/40 text-xs font-mono transition-all cursor-pointer ml-1"
                title="Sign Out to Intro Page"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Core Autonomous Medical Station Banner (Clear Purpose) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-400 mt-1 sm:mt-0 flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                Autonomous Astronaut Self-Care &amp; Clinical Station
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-700 text-cyan-300">
                  NO DOCTORS ON BOARD
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                You are in deep space. Human doctors cannot come to you in space—they are millions of miles away at NASA centers with an unavoidable 14+ minute transmission delay. This autonomous system empowers you to self-check your vitals, monitor sleep and mental health, relieve pain, track habits, and get immediate medical decision support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCheckinModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Fill Daily Medical Form</span>
            </button>
          </div>
        </div>

        {/* Daily Notification Banner (Directly prompts the astronaut to fill out the form) */}
        <DailyNotificationBanner
          onOpenCheckin={() => setIsCheckinModalOpen(true)}
          latestCheckin={latestCheckin}
          hasSubmittedToday={hasSubmittedToday}
        />

        {/* Top Split: 3D Biometric Diagnostics Avatar + Telemetry Fused Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 3D Model representing the astronaut's body & pain areas */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <Biometric3DViewer
              theme={theme}
              heartRate={telemetry.heartRate}
              spo2={telemetry.spo2}
              radiationRate={telemetry.radiationDoseRate}
              status={currentTriageLevel}
              painAreas={activePainAreas}
              activeScenario={activeScenario?.id}
            />
          </div>

          {/* Vitals Fused Grid */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
            <TelemetryVitalsGrid
              telemetry={telemetry}
              cabin={cabinEnvironment}
              status={currentTriageLevel}
              cumulativeDose={94.2}
            />
          </div>
        </div>

        {/* Astronaut Self-Check History & Habit Progression Section */}
        {latestCheckin && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    My Daily Self-Check &amp; Habit Progression Log
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest check-in logged on {latestCheckin.date} ({latestCheckin.createdAt})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckinModalOpen(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>Edit / Submit New Check-In</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 Core Self-Check Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Sleep */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Moon className="w-4 h-4" /> Sleep Quality
                  </span>
                  <span className="font-mono font-bold text-slate-100">{latestCheckin.sleepQuality} / 10</span>
                </div>
                <div className="my-2">
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: `${(latestCheckin.sleepQuality / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Duration: {latestCheckin.sleepHours} hours in sleeping sack
                </span>
              </div>

              {/* 2. Mental Health */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Smile className="w-4 h-4" /> Mental Health
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                    LOGGED
                  </span>
                </div>
                <p className="my-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {latestCheckin.mentalHealth}
                </p>
                <span className="text-[11px] font-mono text-slate-400">
                  Confinement psychological check
                </span>
              </div>

              {/* 3. Physical Feeling */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <HeartPulse className="w-4 h-4" /> How You Feel
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    REPORTED
                  </span>
                </div>
                <p className="my-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {latestCheckin.overallFeeling}
                </p>
                <span className="text-[11px] font-mono text-slate-400">
                  Microgravity subjective readiness
                </span>
              </div>

              {/* 4. Pain Assessment */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="w-4 h-4" /> Pain &amp; Discomfort
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      latestCheckin.hasPain
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {latestCheckin.hasPain ? `${latestCheckin.painSeverity}/10 PAIN` : 'NO PAIN'}
                  </span>
                </div>
                <div className="my-2 text-xs text-slate-300">
                  {latestCheckin.hasPain ? (
                    <div>
                      <span className="font-semibold text-rose-300">Areas: </span>
                      {latestCheckin.painAreas.join(', ')}
                      {latestCheckin.painNotes && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          &quot;{latestCheckin.painNotes}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-emerald-400">Zero physical pain reported today.</span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {latestCheckin.hasPain ? 'Visualized on 3D avatar' : 'Spinal & joint comfort nominal'}
                </span>
              </div>

              {/* 5. Habits to Improve */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Target className="w-4 h-4" /> Habits To Improve
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {latestCheckin.habitsToImprove.length} GOALS
                  </span>
                </div>
                <div className="my-2 flex flex-wrap gap-1">
                  {latestCheckin.habitsToImprove.map((h, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400">Targeted habits</span>
              </div>

              {/* 6. Habits Struggling With */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <AlertCircle className="w-4 h-4" /> Habits Struggling With
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">
                    {latestCheckin.habitsStrugglingWith.length} CHALLENGES
                  </span>
                </div>
                <div className="my-2 flex flex-wrap gap-1">
                  {latestCheckin.habitsStrugglingWith.map((h, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-purple-300 font-mono"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400">Microgravity adaptations</span>
              </div>
            </div>

            {/* Autonomous Onboard AI Medical Guidance Banner */}
            {latestCheckin.aiFeedback && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    AUTONOMOUS ONBOARD MEDICAL GUIDANCE (ZERO-LATENCY AI FLIGHT SURGEON):
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> EARTH TRANSMIT QUEUED
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                  {latestCheckin.aiFeedback}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Autonomous Edge Triage & Clinical Scenarios Runner */}
        <ClinicalTriageEngine
          currentScenario={activeScenario}
          onSelectScenario={handleSelectScenario}
          astronautName={astronautName}
          triageLevel={currentTriageLevel}
          onOpenThinkingModal={handleTriggerThinking}
          isThinkingLoading={isThinkingLoading}
        />

        {/* Google Workspace Hub (Forms & Clinical Notes in Firestore) */}
        <WorkspaceHub
          user={user}
          onSignInPrompt={() => handleLogin('astronaut', activeMissionCode)}
          astronautName={astronautName}
          dailyCheckins={dailyCheckins}
        />

        {/* Aerospace Medicine & Scientific Evidence Hub (Search Grounding & PubMed) */}
        <LiteratureExplorer />

        {/* The Orbitauts Mission Heritage & Bespoke Emblem Showcase */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-900/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <OrbitautsEmblem size="lg" showSubtitle={false} />
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                The Orbitauts Mission Patch &amp; Ethos
              </span>
              <h3 className="text-xl font-serif font-black text-slate-100 tracking-wide">
                Bespoke Antique Brass Navigational Emblem
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Dedicated to autonomous deep-space human survival with zero reliance on immediate Earth intervention. Weathered bronze finish, central retro-futuristic rocket, compass rose, and ghost-like transparent orbital mechanics equations (<span className="text-cyan-300 font-mono">Δv = ve · ln(m₀/mf)</span>, <span className="text-cyan-300 font-mono">F = G·(m₁m₂)/r²</span>).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setIsCheckinModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Fill Daily Medical Check</span>
            </button>
          </div>
        </div>
      </main>

      {/* Daily Astronaut Self-Check Modal */}
      <DailySelfCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        user={user}
        onSaveCheckin={handleSaveCheckin}
        telemetry={telemetry}
        cabin={cabinEnvironment}
        astronautName={astronautName}
      />

      {/* Gemini Thinking Modal */}
      <GeminiThinkingModal
        isOpen={isThinkingModalOpen}
        onClose={() => setIsThinkingModalOpen(false)}
        analysisText={thinkingAnalysis}
        isLoading={isThinkingLoading}
        astronautName={astronautName}
      />
    </div>
  );
}
