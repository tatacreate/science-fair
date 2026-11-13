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
import { VitaluatsEmblem } from './components/OrbitautsEmblem';
import { Biometric3DViewer } from './components/Biometric3DViewer';
import { TelemetryVitalsGrid } from './components/TelemetryVitalsGrid';
import { WorkspaceHub } from './components/WorkspaceHub';
import { DailyNotificationBanner } from './components/DailyNotificationBanner';
import { DailySelfCheckinModal } from './components/DailySelfCheckinModal';
import { SignInIntroPage } from './components/SignInIntroPage';
import { DoctorDashboard } from './components/DoctorDashboard';
import { RadiationMonitorModule } from './components/RadiationMonitorModule';
import { SpaceExamWorkbench } from './components/SpaceExamWorkbench';
import {
  DynamicHealthCharts,
  ChartDataPoint,
  TrackedChartIndicatorId,
} from './components/DynamicHealthCharts';
import {
  EnvironmentAndGamificationHub,
  GamificationProgress,
} from './components/EnvironmentAndGamificationHub';
import { EmergencyAssistantModule } from './components/EmergencyAssistantModule';
import { OsdrBenchmarkPanel } from './components/OsdrBenchmarkPanel';
import { OsdrStudyDataset } from './data/osdrDatasets';
import {
  HABITAT_ENVIRONMENTS,
  HabitatEnvironmentId,
  RoutinePromptSpec,
} from './data/habitatEnvironments';
import { INITIAL_CREW, MissionCrewMember } from './data/missions';
import {
  evaluateNasaFiveHazards,
  NasaHazardStatus,
} from './data/nasaFiveHazards';
import { evaluateSpecificNasaRisks } from './data/nasaHrpRisks';
import { NasaFiveHazardsWidget } from './components/NasaFiveHazardsWidget';
import { NasaReferenceModal } from './components/NasaReferenceModal';
import { NasaRiskMatrixModal, SmartRiskPills } from './components/NasaRiskPillsAndModal';
import {
  LogOut,
  Home,
  Users,
  Siren,
  Activity,
  TrendingUp,
  Radiation,
  FileSpreadsheet,
  Award,
  RotateCcw,
  BookOpen,
  Compass,
  ShieldCheck,
} from 'lucide-react';

type StationTab = 'body' | 'trends' | 'routine' | 'emergency' | 'comms';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [offlineUser, setOfflineUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [appState, setAppState] = useState<'landing' | 'role-select' | 'authenticated'>('landing');
  const [userRole, setUserRole] = useState<'astronaut' | 'doctor' | null>(null);
  const [missionCode, setMissionCode] = useState<string>('ARTEMIS-II');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>('christina-koch');
  const [activeStationTab, setActiveStationTab] = useState<StationTab>('body');

  const activeUser = user || offlineUser;

  // Daily Check-in Form Modal, NASA Reference Modal, Risk Matrix Modal, EVA Toggle & Mars Delay Timer
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isNasaRefOpen, setIsNasaRefOpen] = useState(false);
  const [isRiskMatrixOpen, setIsRiskMatrixOpen] = useState(false);
  const [evaMode, setEvaMode] = useState(false);
  const [marsTransitDelaySeconds, setMarsTransitDelaySeconds] = useState<number>(1214);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);

  // Interactive 3D Body Region & Exam Workbench Sync
  const [selectedBodyRegionId, setSelectedBodyRegionId] = useState<string | null>(null);
  const [regionFocusNonce, setRegionFocusNonce] = useState<number>(0);
  const [examTabRequest, setExamTabRequest] = useState<{
    tab: 'keyboard' | 'mouse' | 'camera' | 'guide';
    nonce: number;
  } | null>(null);
  const [activeChartRequest, setActiveChartRequest] = useState<{
    id: TrackedChartIndicatorId;
    nonce: number;
  } | null>(null);

  const examSectionRef = React.useRef<HTMLDivElement>(null);
  const bodySectionRef = React.useRef<HTMLDivElement>(null);

  // Multi-Environment Habitat & Gamification Progress
  const [activeEnvId, setActiveEnvId] = useState<HabitatEnvironmentId>('spacecraft');
  const [gamification, setGamification] = useState<GamificationProgress>(() => {
    try {
      const saved = localStorage.getItem('heliomed_gamification_progress');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      xp: 85,
      streakDays: 3,
      completedRoutineIds: [],
      examsLoggedCount: 1,
    };
  });

  // Dynamic Chart Series (Updated live from telemetry + logged measurements)
  const [customLoggedSeries, setCustomLoggedSeries] = useState<
    Partial<Record<TrackedChartIndicatorId, ChartDataPoint[]>>
  >({});
  const [liveHrHistory, setLiveHrHistory] = useState<ChartDataPoint[]>([
    { label: 'T-4m', value: 71 },
    { label: 'T-3m', value: 73 },
    { label: 'T-2m', value: 72 },
    { label: 'T-1m', value: 72 },
  ]);
  const [liveRadHistory, setLiveRadHistory] = useState<ChartDataPoint[]>([
    { label: 'T-4m', value: 2.1 },
    { label: 'T-3m', value: 2.2 },
    { label: 'T-2m', value: 2.1 },
    { label: 'T-1m', value: 2.1 },
  ]);

  // Active Simulation Scenario (for emergencies or OSDR tests)
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  // Cabin Habitat Environment
  const [cabinEnvironment, setCabinEnvironment] = useState<CabinEnvironment>({
    ambientCO2: 2.3,
    ambientPressure: 101.3,
    cabinTemp: 21.8,
    o2Fraction: 21.2,
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

  // Active Mission & Crew lookup
  const activeMissionCode = missionCode || 'ARTEMIS-II';
  const missionCrewList: MissionCrewMember[] =
    INITIAL_CREW[activeMissionCode] || INITIAL_CREW['ARTEMIS-II'] || [];
  const currentAstronaut =
    missionCrewList.find((c) => c.id === selectedAstronautId) || missionCrewList[0];

  const astronautName = activeUser?.displayName || currentAstronaut?.name || 'Christina Koch';
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
      const initialSample: DailyCheckin = {
        id: 'sample-01',
        userId: 'local',
        astronautName: 'Astronaut',
        date: new Date().toISOString().split('T')[0],
        sleepQuality: 8,
        sleepHours: 7.0,
        mentalHealth: 'Calm & Focused',
        overallFeeling: 'Good energy with minor lower-back tightness.',
        hasPain: true,
        painAreas: ['Spine / Lumbar'],
        painSeverity: 3,
        painNotes: 'Morning lower-back stretch needed.',
        habitsToImprove: ['Hydration', 'Stretching'],
        habitsStrugglingWith: ['Sleeping sack comfort'],
        aiFeedback:
          'Perform 15 minutes of knees-to-chest stretching and maintain 2.5L water intake today.',
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
        fetched.sort((a, b) => b.id.localeCompare(a.id));
        setDailyCheckins(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, checkinsCol);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time telemetry loop
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
            radiationDoseRate: +(
              mod.radiationDoseRate ?? prev.radiationDoseRate + (Math.random() - 0.5) * 0.2
            ).toFixed(1),
            respiratoryRate: Math.round(
              (mod.respiratoryRate ?? prev.respiratoryRate) + (Math.random() > 0.6 ? 1 : 0)
            ),
            systolicBp: Math.round(mod.systolicBp ?? prev.systolicBp),
            diastolicBp: Math.round(mod.diastolicBp ?? prev.diastolicBp),
            fatigueScore: mod.fatigueScore ?? prev.fatigueScore,
          };
        }

        const envProfile =
          HABITAT_ENVIRONMENTS.find((e) => e.id === activeEnvId) || HABITAT_ENVIRONMENTS[0];
        const hrDrift = (Math.random() - 0.5) * 1.5;
        const newHr = Math.min(85, Math.max(64, Math.round(prev.heartRate + hrDrift)));
        const newRad = +(envProfile.radiationBaselineUSv + (Math.random() - 0.5) * 0.2).toFixed(1);
        return {
          ...prev,
          timestamp: Date.now(),
          heartRate: newHr,
          hrvRmssd: Math.min(75, Math.max(45, Math.round(prev.hrvRmssd + (Math.random() - 0.5)))),
          spo2: Math.min(99, Math.max(97, Math.round(prev.spo2 + (Math.random() > 0.8 ? -1 : 1)))),
          coreTemp: +(36.9 + (Math.random() - 0.5) * 0.15).toFixed(2),
          radiationDoseRate: newRad,
          respiratoryRate: Math.min(
            18,
            Math.max(14, Math.round(prev.respiratoryRate + (Math.random() - 0.5)))
          ),
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [activeScenario, activeEnvId]);

  // Sample live HR & Radiation trajectory every 6 seconds
  useEffect(() => {
    const chartTicker = setInterval(() => {
      const timeLabel = new Date().toLocaleTimeString('en-US', {
        minute: '2-digit',
        second: '2-digit',
      });
      setLiveHrHistory((prev) => [...prev.slice(-5), { label: timeLabel, value: telemetry.heartRate }]);
      setLiveRadHistory((prev) => [
        ...prev.slice(-5),
        { label: timeLabel, value: telemetry.radiationDoseRate },
      ]);
    }, 6000);
    return () => clearInterval(chartTicker);
  }, [telemetry.heartRate, telemetry.radiationDoseRate]);

  // Live Mars Transit Delay countdown / orbital drift timer (20m 14s window)
  useEffect(() => {
    const delayTimer = setInterval(() => {
      setMarsTransitDelaySeconds((prev) => (prev <= 1185 ? 1220 : prev - 1));
    }, 1000);
    return () => clearInterval(delayTimer);
  }, []);

  const updateGamification = (updater: (prev: GamificationProgress) => GamificationProgress) => {
    setGamification((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('heliomed_gamification_progress', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleChangeEnvironment = (envId: HabitatEnvironmentId) => {
    setActiveEnvId(envId);
    const profile = HABITAT_ENVIRONMENTS.find((e) => e.id === envId);
    if (profile && !activeScenario) {
      setCabinEnvironment((prev) => ({
        ...prev,
        ambientCO2: profile.ambientCO2Baseline,
        ambientPressure: profile.pressureBaselineKpa,
      }));
      setTelemetry((prev) => ({
        ...prev,
        radiationDoseRate: profile.radiationBaselineUSv,
      }));
    }
  };

  const handleCompleteRoutine = (routine: RoutinePromptSpec) => {
    updateGamification((prev) => {
      if (prev.completedRoutineIds.includes(routine.id)) return prev;
      return {
        ...prev,
        xp: prev.xp + routine.xpReward,
        completedRoutineIds: [...prev.completedRoutineIds, routine.id],
      };
    });
  };

  const handleLaunchRoutineAction = (routine: RoutinePromptSpec) => {
    setSelectedBodyRegionId(routine.targetRegionId);
    setRegionFocusNonce((n) => n + 1);
    if (routine.targetTab === 'daily_checkin') {
      setIsCheckinModalOpen(true);
    } else {
      setActiveStationTab('body');
      setExamTabRequest({ tab: routine.targetTab, nonce: Date.now() });
      setTimeout(() => {
        examSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleExamLogged = (indicatorId: string, numericValue: number | null) => {
    updateGamification((prev) => ({
      ...prev,
      xp: prev.xp + 25,
      examsLoggedCount: prev.examsLoggedCount + 1,
    }));

    if (
      numericValue !== null &&
      (indicatorId === 'glucose' ||
        indicatorId === 'onsd' ||
        indicatorId === 'urine_sg' ||
        indicatorId === 'radiation' ||
        indicatorId === 'spo2')
    ) {
      const timeLabel = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCustomLoggedSeries((prev) => {
        const existing = prev[indicatorId] || [];
        return {
          ...prev,
          [indicatorId]: [...existing.slice(-4), { label: timeLabel, value: numericValue }],
        };
      });
    }
  };

  // Handle Scenario Injection
  const handleSelectScenario = (sc: SimulationScenario | null) => {
    setActiveScenario(sc);
    if (sc) {
      setCabinEnvironment((prev) => ({
        ...prev,
        ...sc.cabinModifiers,
      }));
      setTelemetry((prev) => ({
        ...prev,
        ...sc.vitalsModifiers,
        timestamp: Date.now(),
      }));
    } else {
      const envProfile =
        HABITAT_ENVIRONMENTS.find((e) => e.id === activeEnvId) || HABITAT_ENVIRONMENTS[0];
      setCabinEnvironment({
        ambientCO2: envProfile.ambientCO2Baseline,
        ambientPressure: envProfile.pressureBaselineKpa,
        cabinTemp: 21.8,
        o2Fraction: 21.2,
        relativeHumidity: 48,
        speRadiationFlux: 4.2,
      });
      setTelemetry((prev) => ({
        ...prev,
        heartRate: 72,
        hrvRmssd: 58,
        spo2: 98,
        respiratoryRate: 15,
        radiationDoseRate: envProfile.radiationBaselineUSv,
        systolicBp: 118,
        diastolicBp: 76,
        fatigueScore: 24,
      }));
    }
  };

  const handleApplyOsdrTestCase = (dataset: OsdrStudyDataset) => {
    handleSelectScenario(dataset.testScenario);
    setSelectedBodyRegionId(dataset.targetRegionId);
    setRegionFocusNonce((n) => n + 1);
    setCabinEnvironment((prev) => ({
      ...prev,
      ...dataset.cabinOverride,
    }));
    setTelemetry((prev) => ({
      ...prev,
      ...dataset.vitalsOverride,
      timestamp: Date.now(),
    }));

    if (dataset.chartTargetIndicator && dataset.chartSampleValue !== undefined) {
      const targetId = dataset.chartTargetIndicator;
      const val = dataset.chartSampleValue;
      setCustomLoggedSeries((prev) => ({
        ...prev,
        [targetId]: [
          ...(prev[targetId] || []).filter((p) => p.label !== dataset.studyId).slice(-3),
          { label: dataset.studyId, value: val },
        ],
      }));
      setActiveChartRequest({ id: targetId, nonce: Date.now() });
    }
  };

  const handleInspectOsdrInBody = (dataset: OsdrStudyDataset) => {
    setSelectedBodyRegionId(dataset.targetRegionId);
    setRegionFocusNonce((n) => n + 1);
    setActiveStationTab('body');
    setTimeout(() => {
      bodySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSimulateEmergency = (sc: SimulationScenario | null, regionId: string | null) => {
    handleSelectScenario(sc);
    setSelectedBodyRegionId(regionId);
    if (regionId) {
      setRegionFocusNonce((n) => n + 1);
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

  const handleLogin = async (role: 'astronaut' | 'doctor', code: string, customName?: string) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        const preferredName =
          customName?.trim() ||
          result.user.displayName ||
          (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
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
      console.warn(
        'Firebase Google Auth popup cancelled or unavailable; initializing direct simulation:',
        err
      );
      const preferredName =
        customName?.trim() || (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
      setOfflineUser({
        uid: `crew-${role}-${Date.now().toString(36)}`,
        displayName: preferredName,
        photoURL: null,
        email:
          role === 'doctor'
            ? 'jschmid@nasa.gov'
            : `${preferredName.toLowerCase().replace(/[^a-z0-9]/g, '')}@nasa.gov`,
      } as any);
      setUserRole(role);
      setMissionCode(code);
      setAppState('authenticated');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDirectEnter = (role: 'astronaut' | 'doctor', code: string, customName?: string) => {
    const preferredName =
      customName?.trim() || (role === 'doctor' ? 'Dr. Josef Schmid' : 'Christina Koch');
    setOfflineUser({
      uid: `crew-${role}-${Date.now().toString(36)}`,
      displayName: preferredName,
      photoURL: null,
      email:
        role === 'doctor'
          ? 'jschmid@nasa.gov'
          : `${preferredName.toLowerCase().replace(/[^a-z0-9]/g, '')}@nasa.gov`,
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

  // 1. Landing & Role Selection
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

  // 2. NASA Flight Surgeon Dashboard
  if (userRole === 'doctor') {
    return (
      <DoctorDashboard
        missionCode={activeMissionCode}
        onReturnHome={handleReturnHome}
        onSignOut={handleLogout}
      />
    );
  }

  // 3. Astronaut Autonomous Medical Station
  const todayStr = new Date().toISOString().split('T')[0];
  const latestCheckin = dailyCheckins[0] || currentAstronaut?.latestCheckin || null;
  const hasSubmittedToday =
    dailyCheckins.some((c) => c.date === todayStr) || !!currentAstronaut?.hasSubmittedToday;

  const activePainAreas = latestCheckin?.hasPain
    ? latestCheckin.painAreas
    : currentAstronaut?.activePainAreas || [];

  const activeEnvObj =
    HABITAT_ENVIRONMENTS.find((e) => e.id === activeEnvId) || HABITAT_ENVIRONMENTS[0];
  const dueRoutine =
    activeEnvObj.routines.find((r) => !gamification.completedRoutineIds.includes(r.id)) ||
    activeEnvObj.routines[0];

  const fiveHazards = evaluateNasaFiveHazards({
    telemetry,
    cabin: cabinEnvironment,
    cumulativeDoseMsv: currentAstronaut?.cumulativeRadiationDoseMsv || 94.2,
    latestCheckin,
    painAreas: activePainAreas,
    activeEnvId,
    missionCode: activeMissionCode,
    activeScenarioId: activeScenario?.id,
    marsTransitDelaySeconds,
  });

  const effectiveEvaMode = evaMode || Boolean(latestCheckin?.evaMode);
  const { activeRisks: activeSpecificRisks, allRisks: allSpecificRisks } =
    evaluateSpecificNasaRisks({
      heartRate: telemetry.heartRate,
      spo2: telemetry.spo2,
      radiationRate: telemetry.radiationDoseRate,
      cumulativeDoseMsv: currentAstronaut?.cumulativeRadiationDoseMsv || 94.2,
      fatigueScore: telemetry.fatigueScore,
      ambientCO2: cabinEnvironment.ambientCO2,
      ambientPressure: cabinEnvironment.ambientPressure,
      painAreas: activePainAreas,
      sleepQuality: latestCheckin?.sleepQuality,
      sleepHours: latestCheckin?.sleepHours,
      mentalHealth: latestCheckin?.mentalHealth,
      overallFeeling: latestCheckin?.overallFeeling,
      habitsStrugglingWith: latestCheckin?.habitsStrugglingWith,
      evaMode: effectiveEvaMode,
      activeScenarioId: activeScenario?.id,
      selectedRegionId: selectedBodyRegionId,
    });

  const handleHazardAction = (hazard: NasaHazardStatus) => {
    if (hazard.id === 'radiation') {
      setActiveStationTab('routine');
    } else if (hazard.id === 'isolation') {
      setIsCheckinModalOpen(true);
    } else if (hazard.id === 'distance') {
      setActiveStationTab('emergency');
    } else if (hazard.id === 'gravity') {
      setActiveStationTab('body');
      setSelectedBodyRegionId('spine_lumbar');
      setRegionFocusNonce((n) => n + 1);
    } else if (hazard.id === 'environment') {
      setActiveStationTab('body');
      setSelectedBodyRegionId('head_brain');
      setRegionFocusNonce((n) => n + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-12">
      {/* Clean Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <VitaluatsEmblem size="sm" showSubtitle={false} />
            <div>
              <h1 className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400 uppercase whitespace-nowrap">
                The Vitaluats
              </h1>
              <p className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                {activeMissionCode} · {astronautName}
              </p>
            </div>
          </div>

          {/* Primary Station Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveStationTab('emergency')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Emergency SOS</span>
            </button>

            {missionCrewList.length > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <Users className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <select
                  value={currentAstronaut?.id || ''}
                  onChange={(e) => handleSelectAstronaut(e.target.value)}
                  className="bg-transparent text-cyan-300 text-xs font-semibold focus:outline-none cursor-pointer"
                  aria-label="Switch Astronaut Profile"
                >
                  {missionCrewList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-950 text-slate-200">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleReturnHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-300 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Daily Self-Check & Due Routine Reminder */}
        <DailyNotificationBanner
          onOpenCheckin={() => setIsCheckinModalOpen(true)}
          latestCheckin={latestCheckin}
          hasSubmittedToday={hasSubmittedToday}
          dueRoutine={dueRoutine}
          onStartDueRoutine={handleLaunchRoutineAction}
        />

        {/* Active Simulation Notice Strip */}
        {activeScenario && (
          <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="text-amber-300 font-mono">{activeScenario.name}</strong>
              <span className="text-slate-300 ml-2">— {activeScenario.clinicalSigns}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSimulateEmergency(null, null)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Normal Baseline</span>
            </button>
          </div>
        )}

        {/* Compact NASA 5 Hazards Monitor HUD */}
        <NasaFiveHazardsWidget
          hazards={fiveHazards}
          onTriggerHazardAction={handleHazardAction}
        />

        {/* Quick NASA HRP Readiness Strip: EVA Spacewalk Toggle & Full 15-Risk Matrix Button */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEvaMode(!effectiveEvaMode)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  effectiveEvaMode
                    ? 'bg-amber-950 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500/70'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Pre/Post-EVA Readiness: {effectiveEvaMode ? 'ON (DCS & Cognitive Check)' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsRiskMatrixOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-700/70 text-cyan-300 font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>View NASA HRP Risk Coverage ({allSpecificRisks.length})</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {activeSpecificRisks.length > 0
                ? `${activeSpecificRisks.length} Active Risk Flag${activeSpecificRisks.length > 1 ? 's' : ''}`
                : 'All 15 NASA HRP Risks Nominal'}
            </span>
          </div>

          {effectiveEvaMode && (
            <div className="p-2.5 rounded-lg bg-amber-950/35 border border-amber-700/70 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>EVA / Spacewalk Readiness Check Active:</strong> Monitoring{' '}
                <em>Decompression Sickness (&quot;The Bends&quot;)</em> &amp;{' '}
                <em>Spacewalk Cognitive Fatigue</em> — verify 100% O₂ pre-breathe &amp; buddy checklist.
              </span>
              <span className="font-mono text-[11px] text-amber-300 font-bold">
                Cabin {cabinEnvironment.ambientPressure.toFixed(1)} kPa
              </span>
            </div>
          )}

          {activeSpecificRisks.length > 0 && (
            <SmartRiskPills
              compact
              title="Flagged NASA HRP Specific Risks (Live Sensors + Check-In)"
              risks={activeSpecificRisks}
              onInspectRegion={(regId) => {
                setActiveStationTab('body');
                setSelectedBodyRegionId(regId);
                setRegionFocusNonce((n) => n + 1);
              }}
            />
          )}
        </div>

        {/* Focused 5-Tab Workspace Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveStationTab('body')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeStationTab === 'body'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Body Scan &amp; Exam</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('trends')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeStationTab === 'trends'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trends &amp; OSDR Tests</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('routine')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeStationTab === 'routine'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radiation className="w-4 h-4" />
            <span>Routines &amp; Radiation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('emergency')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeStationTab === 'emergency'
                ? 'bg-rose-600 text-white'
                : 'text-rose-300 hover:bg-rose-950/60'
            }`}
          >
            <Siren className="w-4 h-4" />
            <span>Emergency Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('comms')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeStationTab === 'comms'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Doctor Forms &amp; Comms</span>
          </button>

          <div className="ml-auto hidden sm:flex items-center gap-3 px-3 text-xs font-mono text-amber-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{gamification.xp} XP · {gamification.streakDays}d Streak</span>
          </div>
        </div>

        {/* TAB 1: BODY SCAN & EXAM */}
        {activeStationTab === 'body' && (
          <div className="space-y-6">
            {/* Quick Environment Switcher Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-300">
                <strong className="text-cyan-300">Active Environment:</strong> {activeEnvObj.name}{' '}
                <span className="text-slate-500">({activeEnvObj.gravityLabel} · {activeEnvObj.commDelayLabel})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HABITAT_ENVIRONMENTS.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => handleChangeEnvironment(env.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                      env.id === activeEnvId
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {env.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Anatomical Twin + Live Body & Cabin Vitals */}
            <div ref={bodySectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <Biometric3DViewer
                  theme="dark"
                  heartRate={telemetry.heartRate}
                  spo2={telemetry.spo2}
                  radiationRate={telemetry.radiationDoseRate}
                  cumulativeDoseMsv={currentAstronaut?.cumulativeRadiationDoseMsv || 94.2}
                  status={currentTriageLevel}
                  painAreas={activePainAreas}
                  activeScenario={activeScenario?.id}
                  astronautName={astronautName}
                  selectedRegionId={selectedBodyRegionId}
                  regionFocusNonce={regionFocusNonce}
                  cabinCO2={cabinEnvironment.ambientCO2}
                  sleepQuality={latestCheckin?.sleepQuality}
                  mentalHealth={latestCheckin?.mentalHealth}
                  overallFeeling={latestCheckin?.overallFeeling}
                  habitsStrugglingWith={latestCheckin?.habitsStrugglingWith}
                  evaMode={effectiveEvaMode}
                  onRegionSelect={(regId) => setSelectedBodyRegionId(regId)}
                  onStartExamForRegion={(regId) => {
                    setSelectedBodyRegionId(regId);
                    setRegionFocusNonce((n) => n + 1);
                    setExamTabRequest({
                      tab: regId === 'eyes_ocular' ? 'camera' : 'keyboard',
                      nonce: Date.now(),
                    });
                    examSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </div>

              <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <TelemetryVitalsGrid
                  telemetry={telemetry}
                  cabin={cabinEnvironment}
                  status={currentTriageLevel}
                  cumulativeDose={currentAstronaut?.cumulativeRadiationDoseMsv || 94.2}
                  onOpenRadiationTab={() => setActiveStationTab('routine')}
                />
              </div>
            </div>

            {/* Multi-Modal In-Space Health Self-Assessment */}
            <div ref={examSectionRef}>
              <SpaceExamWorkbench
                astronautName={astronautName}
                selectedRegionId={selectedBodyRegionId}
                onSelectRegion={(regId) => setSelectedBodyRegionId(regId)}
                activeTabRequest={examTabRequest}
                onExamLogged={handleExamLogged}
                onUpdateVitals={(updates) =>
                  setTelemetry((prev) => ({
                    ...prev,
                    ...updates,
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* TAB 2: TRENDS & NASA OSDR TESTS */}
        {activeStationTab === 'trends' && (
          <div className="space-y-6">
            <DynamicHealthCharts
              liveHeartRate={telemetry.heartRate}
              liveSpo2={telemetry.spo2}
              liveRadiationRate={telemetry.radiationDoseRate}
              customLoggedSeries={customLoggedSeries}
              liveHrHistory={liveHrHistory}
              liveRadHistory={liveRadHistory}
              activeChartRequest={activeChartRequest}
            />

            <OsdrBenchmarkPanel
              activeScenarioId={activeScenario?.id}
              onApplyOsdrTestCase={handleApplyOsdrTestCase}
              onResetOsdrTest={() => handleSimulateEmergency(null, null)}
              onInspectInBody={handleInspectOsdrInBody}
              liveTelemetry={telemetry}
              liveCabin={cabinEnvironment}
              onJumpToEnvironment={handleChangeEnvironment}
            />
          </div>
        )}

        {/* TAB 3: ROUTINES, HABITATS & RADIATION */}
        {activeStationTab === 'routine' && (
          <div className="space-y-6">
            <EnvironmentAndGamificationHub
              activeEnvId={activeEnvId}
              onChangeEnvironment={handleChangeEnvironment}
              onLaunchRoutineAction={handleLaunchRoutineAction}
              gamification={gamification}
              onCompleteRoutine={handleCompleteRoutine}
            />

            <RadiationMonitorModule
              astronautName={astronautName}
              missionCode={activeMissionCode}
              currentDoseRate={telemetry.radiationDoseRate}
              cumulativeCareerDose={currentAstronaut?.cumulativeRadiationDoseMsv || 14.2}
              onDoseRateChange={(newRate) =>
                setTelemetry((prev) => ({ ...prev, radiationDoseRate: newRate }))
              }
            />
          </div>
        )}

        {/* TAB 4: EMERGENCY WIZARD */}
        {activeStationTab === 'emergency' && (
          <EmergencyAssistantModule
            astronautName={astronautName}
            onSimulateEmergency={handleSimulateEmergency}
            onLogEmergencyXp={(xpBonus) =>
              updateGamification((prev) => ({
                ...prev,
                xp: prev.xp + xpBonus,
              }))
            }
          />
        )}

        {/* TAB 5: DOCTOR FORMS & COMMS */}
        {activeStationTab === 'comms' && (
          <WorkspaceHub
            user={user}
            astronautName={astronautName}
            missionCode={activeMissionCode}
            dailyCheckins={dailyCheckins}
          />
        )}
      </main>

      {/* Clean NASA Data & References Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <span>The Vitaluats · HelioMed 100% Offline Deep-Space Station</span>
        <button
          type="button"
          onClick={() => setIsNasaRefOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Powered by NASA HRP Data</span>
        </button>
      </footer>

      {/* Daily Astronaut Self-Check Modal */}
      <DailySelfCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        user={user}
        onSaveCheckin={handleSaveCheckin}
        telemetry={telemetry}
        cabin={cabinEnvironment}
        astronautName={astronautName}
        evaMode={effectiveEvaMode}
        onToggleEvaMode={setEvaMode}
      />

      {/* NASA HRP Data & Citations Modal */}
      <NasaReferenceModal
        isOpen={isNasaRefOpen}
        onClose={() => setIsNasaRefOpen(false)}
      />

      {/* Official NASA HRP Risk Coverage Matrix Modal */}
      <NasaRiskMatrixModal
        isOpen={isRiskMatrixOpen}
        onClose={() => setIsRiskMatrixOpen(false)}
        allRisks={allSpecificRisks}
        evaMode={effectiveEvaMode}
        onToggleEvaMode={setEvaMode}
      />
    </div>
  );
}
