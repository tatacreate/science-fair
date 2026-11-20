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
} from './firebase';
import {
  DailyCheckin,
  TelemetryState,
  CabinEnvironment,
  SimulationScenario,
  TriageLevel,
} from './types/heliomed';
import { HelioMedEmblem } from './components/OrbitautsEmblem';
import { Biometric3DViewer } from './components/Biometric3DViewer';
import { TelemetryVitalsGrid } from './components/TelemetryVitalsGrid';
import { DailyNotificationBanner } from './components/DailyNotificationBanner';
import {
  DailySelfCheckinModal,
  DailyCheckinInteractiveForm,
} from './components/DailySelfCheckinModal';
import { PrewrittenResponseCard } from './components/PrewrittenResponseCard';
import {
  buildPrewrittenCheckinResponse,
  PrewrittenAstronautResponse,
} from './data/prewrittenResponses';
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
import { ScenarioSimulatorBar } from './components/ScenarioSimulatorBar';
import { ExplainableAssessmentCardList } from './components/ExplainableAssessmentCard';
import { MissionHealthTimeline } from './components/MissionHealthTimeline';
import { NasaDataEvidenceCenter } from './components/NasaDataEvidenceCenter';
import { runCorrelationEngine } from './utils/correlationEngine';
import { updateLatestTimelineDay } from './data/missionTimelineStore';
import {
  LogOut,
  Home,
  Users,
  Siren,
  Activity,
  TrendingUp,
  BookOpen,
  Compass,
  ShieldCheck,
  ExternalLink,
  ClipboardCheck,
  X,
  CheckCircle2,
  Sparkles,
  Award,
  MapPin,
} from 'lucide-react';

type StationTab = 'checkin' | 'body' | 'trends' | 'emergency' | 'nasa_refs';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [offlineUser, setOfflineUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [appState, setAppState] = useState<'landing' | 'role-select' | 'authenticated'>('landing');
  const [userRole, setUserRole] = useState<'astronaut' | 'doctor' | null>(null);
  const [missionCode, setMissionCode] = useState<string>('ARTEMIS-II');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>('christina-koch');
  const [activeStationTab, setActiveStationTab] = useState<StationTab>('checkin');

  const activeUser = user || offlineUser;

  // Check-in Modal, Response Pop-Up, NASA Modals, EVA Toggle & Mars Delay Timer
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [popupGuidance, setPopupGuidance] = useState<{
    checkin: DailyCheckin;
    response: PrewrittenAstronautResponse;
  } | null>(null);
  const [isNasaRefOpen, setIsNasaRefOpen] = useState(false);
  const [isRiskMatrixOpen, setIsRiskMatrixOpen] = useState(false);
  const [evaMode, setEvaMode] = useState(false);
  const [marsTransitDelaySeconds, setMarsTransitDelaySeconds] = useState<number>(1214);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [userSubmittedCheckinThisSession, setUserSubmittedCheckinThisSession] = useState(false);
  const [timelineSyncNonce, setTimelineSyncNonce] = useState<number>(0);

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
  const [xpToast, setXpToast] = useState<{ delta: number; total: number; label: string } | null>(null);
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

  // Active Simulation Scenario
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

  // Load saved local check-ins (and sync from Firestore if user is signed in)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('heliomed_daily_checkins_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDailyCheckins(parsed);
        }
      }
    } catch {
      // ignore storage read errors
    }

    if (!user) return;

    const checkinsCol = 'daily_checkins';
    const q = query(collection(db, checkinsCol), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => docSnap.data() as DailyCheckin);
        if (fetched.length > 0) {
          fetched.sort((a, b) => b.id.localeCompare(a.id));
          setDailyCheckins((prev) => {
            const ids = new Set(fetched.map((f) => f.id));
            const localOnly = prev.filter((p) => !ids.has(p.id));
            return [...localOnly, ...fetched];
          });
        }
      },
      (error) => {
        console.warn('Firestore daily_checkins sync notice (staying offline-safe):', error);
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

  // Live Mars Transit Delay countdown
  useEffect(() => {
    const delayTimer = setInterval(() => {
      setMarsTransitDelaySeconds((prev) => (prev <= 1185 ? 1220 : prev - 1));
    }, 1000);
    return () => clearInterval(delayTimer);
  }, []);

  const updateGamification = (
    updater: (prev: GamificationProgress) => GamificationProgress,
    toastLabel?: string
  ) => {
    setGamification((prev) => {
      const next = updater(prev);
      const delta = next.xp - prev.xp;
      if (delta > 0) {
        setXpToast({
          delta,
          total: next.xp,
          label: toastLabel || 'Readiness Progress Saved',
        });
      }
      try {
        localStorage.setItem('heliomed_gamification_progress', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (!xpToast) return;
    const t = setTimeout(() => setXpToast(null), 4500);
    return () => clearTimeout(t);
  }, [xpToast]);

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
      setActiveStationTab('checkin');
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
      if (sc.targetRegionId) {
        setSelectedBodyRegionId(sc.targetRegionId);
        setRegionFocusNonce((n) => n + 1);
      }
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
      setSelectedBodyRegionId(null);
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

  // Save new daily checkin locally ALWAYS + sync to Firestore best-effort + update 14-day timeline
  const handleSaveCheckin = async (checkin: DailyCheckin) => {
    const stressEstimate = Math.max(
      1,
      Math.min(
        10,
        checkin.sleepQuality <= 4 || /anxious|overwhelmed|stress|isolation/i.test(checkin.mentalHealth)
          ? 7
          : 11 - checkin.sleepQuality
      )
    );
    updateLatestTimelineDay(currentAstronaut?.id || 'default', {
      sleepHours: checkin.sleepHours,
      stressScore: stressEstimate,
      painSeverity: checkin.hasPain ? checkin.painSeverity : 0,
      painZone: checkin.hasPain && checkin.painAreas.length > 0 ? checkin.painAreas.join(', ') : 'None',
      note: checkin.overallFeeling || 'Daily self-check logged.',
    });
    setTimelineSyncNonce((n) => n + 1);

    setDailyCheckins((prev) => {
      const next = [checkin, ...prev.filter((c) => c.id !== checkin.id)];
      try {
        localStorage.setItem('heliomed_daily_checkins_v1', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
    setUserSubmittedCheckinThisSession(true);
    updateGamification((prev) => ({
      ...prev,
      xp: prev.xp + 30,
    }));

    if (user) {
      try {
        await setDoc(doc(db, 'daily_checkins', checkin.id), checkin);
      } catch (err) {
        console.warn('Firestore save skipped (kept safe locally):', err);
      }
    }
  };

  const handleLogin = async (
    role: 'astronaut' | 'doctor',
    code: string,
    customName?: string,
    envId?: HabitatEnvironmentId,
    initialEvaMode?: boolean
  ) => {
    setIsLoggingIn(true);
    setAuthError(null);
    if (envId) handleChangeEnvironment(envId);
    if (typeof initialEvaMode === 'boolean') setEvaMode(initialEvaMode);
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

  const handleDirectEnter = (
    role: 'astronaut' | 'doctor',
    code: string,
    customName?: string,
    envId?: HabitatEnvironmentId,
    initialEvaMode?: boolean
  ) => {
    if (envId) handleChangeEnvironment(envId);
    if (typeof initialEvaMode === 'boolean') setEvaMode(initialEvaMode);
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

  // 3. Astronaut Medical Station
  const todayStr = new Date().toISOString().split('T')[0];
  const latestCheckin = dailyCheckins[0] || currentAstronaut?.latestCheckin || null;
  const hasSubmittedToday =
    userSubmittedCheckinThisSession || dailyCheckins.some((c) => c.date === todayStr);

  const basePainAreas = latestCheckin?.hasPain
    ? latestCheckin.painAreas
    : currentAstronaut?.activePainAreas || [];

  const scenarioOverlay = activeScenario?.simulatedCheckinOverlay;
  const activePainAreas =
    scenarioOverlay?.painAreas && scenarioOverlay.painAreas.length > 0
      ? Array.from(new Set([...basePainAreas, ...scenarioOverlay.painAreas]))
      : basePainAreas;

  const effectiveLatestCheckin: DailyCheckin | null = scenarioOverlay
    ? {
        id: latestCheckin?.id || 'sim-overlay',
        userId: latestCheckin?.userId || 'local',
        astronautName,
        date: todayStr,
        sleepQuality: scenarioOverlay.sleepQuality ?? latestCheckin?.sleepQuality ?? 8,
        sleepHours: scenarioOverlay.sleepHours ?? latestCheckin?.sleepHours ?? 7.2,
        mentalHealth: scenarioOverlay.mentalHealth ?? latestCheckin?.mentalHealth ?? 'Calm & Focused',
        overallFeeling: scenarioOverlay.overallFeeling ?? latestCheckin?.overallFeeling ?? 'Nominal',
        hasPain: activePainAreas.length > 0,
        painAreas: activePainAreas,
        painSeverity: scenarioOverlay.painSeverity ?? latestCheckin?.painSeverity ?? 0,
        painNotes: latestCheckin?.painNotes || '',
        habitsToImprove: latestCheckin?.habitsToImprove || [],
        habitsStrugglingWith: latestCheckin?.habitsStrugglingWith || [],
        createdAt: latestCheckin?.createdAt || 'Now',
      }
    : latestCheckin;

  const latestPrewrittenGuidance = latestCheckin
    ? buildPrewrittenCheckinResponse(latestCheckin, telemetry, cabinEnvironment)
    : null;

  const fiveHazards = evaluateNasaFiveHazards({
    telemetry,
    cabin: cabinEnvironment,
    cumulativeDoseMsv: currentAstronaut?.cumulativeRadiationDoseMsv || 94.2,
    latestCheckin: effectiveLatestCheckin,
    painAreas: activePainAreas,
    activeEnvId,
    missionCode: activeMissionCode,
    activeScenarioId: activeScenario?.id,
    marsTransitDelaySeconds,
  });

  const effectiveEvaMode = evaMode || Boolean(effectiveLatestCheckin?.evaMode);
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
      sleepQuality: effectiveLatestCheckin?.sleepQuality,
      sleepHours: effectiveLatestCheckin?.sleepHours,
      mentalHealth: effectiveLatestCheckin?.mentalHealth,
      overallFeeling: effectiveLatestCheckin?.overallFeeling,
      habitsStrugglingWith: effectiveLatestCheckin?.habitsStrugglingWith,
      evaMode: effectiveEvaMode,
      activeScenarioId: activeScenario?.id,
      selectedRegionId: selectedBodyRegionId,
    });

  const correlationAssessments = runCorrelationEngine({
    telemetry,
    cabin: cabinEnvironment,
    latestCheckin: effectiveLatestCheckin,
    painAreas: activePainAreas,
    evaMode: effectiveEvaMode,
    activeScenario,
    cumulativeDoseMsv: currentAstronaut?.cumulativeRadiationDoseMsv || 94.2,
  });

  const handleHazardAction = (hazard: NasaHazardStatus) => {
    if (hazard.id === 'radiation') {
      setActiveStationTab('emergency');
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

  const currentEnvProfile =
    HABITAT_ENVIRONMENTS.find((e) => e.id === activeEnvId) || HABITAT_ENVIRONMENTS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-400 selection:text-slate-950 pb-12">
      {/* Clean, Colorful Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-700/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Zone + Live Current Location Label */}
          <div className="flex items-center gap-3 shrink-0">
            <HelioMedEmblem size="sm" showSubtitle={false} />
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-wider text-amber-400 uppercase whitespace-nowrap">
                HelioMed
              </h1>
              <p className="text-xs font-mono text-cyan-200 whitespace-nowrap">
                {activeMissionCode} · {currentEnvProfile.shortName} · {astronautName}
              </p>
            </div>
          </div>

          {/* Primary Top Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Synced Location / Stay Switcher Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.18)]">
              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <select
                value={activeEnvId}
                onChange={(e) => handleChangeEnvironment(e.target.value as HabitatEnvironmentId)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                aria-label="Change Where You Are Staying"
              >
                {HABITAT_ENVIRONMENTS.map((env) => (
                  <option key={env.id} value={env.id} className="bg-slate-900 text-white">
                    {env.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Always-Visible Live XP Counter Button */}
            <button
              type="button"
              onClick={() => setActiveStationTab('emergency')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 border border-amber-400 text-amber-200 font-mono font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 tabular-nums shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              title="View your XP rank and emergency readiness drills"
            >
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{gamification.xp} XP</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCheckinModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_16px_rgba(34,211,238,0.4)]"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Daily Check-In</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStationTab('emergency')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_14px_rgba(244,63,94,0.4)]"
            >
              <Siren className="w-4 h-4" />
              <span>Emergency SOS</span>
            </button>

            {missionCrewList.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-600">
                <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <select
                  value={currentAstronaut?.id || ''}
                  onChange={(e) => handleSelectAstronaut(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                  aria-label="Switch Astronaut Profile"
                >
                  {missionCrewList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleReturnHome}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-cyan-300" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-700 border border-slate-600 hover:border-rose-400 text-slate-100 font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Bright Hero Check-In Card */}
        <DailyNotificationBanner
          onOpenCheckin={() => setIsCheckinModalOpen(true)}
          onGoToCheckinTab={() => setActiveStationTab('checkin')}
          latestCheckin={latestCheckin}
          hasSubmittedToday={hasSubmittedToday}
        />

        {/* Clear, Color-Coded 5-Tab Workspace Navigation */}
        <nav
          aria-label="Astronaut Station Sections"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-2 rounded-2xl bg-slate-900 border border-slate-700/80"
        >
          <button
            type="button"
            onClick={() => setActiveStationTab('checkin')}
            className={`px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStationTab === 'checkin'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 border-cyan-200 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-cyan-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                activeStationTab === 'checkin' ? 'bg-slate-950' : 'bg-cyan-400'
              }`}
            />
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>1. Daily Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('body')}
            className={`px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStationTab === 'body'
                ? 'bg-sky-500 border-sky-200 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.45)]'
                : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-sky-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                activeStationTab === 'body' ? 'bg-slate-950' : 'bg-sky-400'
              }`}
            />
            <Activity className="w-4 h-4 shrink-0" />
            <span>2. 3D Body &amp; Vitals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('trends')}
            className={`px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStationTab === 'trends'
                ? 'bg-indigo-500 border-indigo-200 text-white shadow-[0_0_18px_rgba(99,102,241,0.5)]'
                : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-indigo-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                activeStationTab === 'trends' ? 'bg-white' : 'bg-indigo-400'
              }`}
            />
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>3. 14-Day Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('emergency')}
            className={`px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStationTab === 'emergency'
                ? 'bg-rose-600 border-rose-300 text-white shadow-[0_0_18px_rgba(244,63,94,0.5)]'
                : 'bg-slate-800/90 border-rose-500/50 text-rose-200 hover:bg-rose-900/50 hover:border-rose-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                activeStationTab === 'emergency' ? 'bg-white' : 'bg-rose-400'
              }`}
            />
            <Siren className="w-4 h-4 shrink-0" />
            <span>4. Safety &amp; Radiation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStationTab('nasa_refs')}
            className={`px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStationTab === 'nasa_refs'
                ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                : 'bg-slate-800/90 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-amber-400'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                activeStationTab === 'nasa_refs' ? 'bg-slate-950' : 'bg-amber-400'
              }`}
            />
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>5. NASA Risks &amp; Links</span>
          </button>
        </nav>

        {/* TAB 1: DAILY CHECK-IN & PRE-WRITTEN ADVICE */}
        {activeStationTab === 'checkin' && (
          <div className="space-y-6">
            {/* Show Latest Pre-Written Response Card at Top if Astronaut Just Submitted or Has Saved Check-In */}
            {latestPrewrittenGuidance && latestCheckin && (
              <section className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Your Latest Check-In Advice
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckinModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                  >
                    Open Pop-Up Check-In
                  </button>
                </div>

                <PrewrittenResponseCard
                  response={latestPrewrittenGuidance}
                  astronautName={astronautName}
                  submittedTime={latestCheckin.createdAt}
                  onOpenBodyTwin={() => setActiveStationTab('body')}
                />
              </section>
            )}

            {/* Inline Daily Check-In Form (Impossible to Miss!) */}
            <section className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-cyan-500/50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Fill Out or Update Your Daily Check-In
                    </h2>
                    <p className="text-xs text-slate-300">
                      Pick your sleep, mental state, pain, and habits below, then click Submit to get your simple plan.
                    </p>
                  </div>
                </div>
              </div>

              <DailyCheckinInteractiveForm
                user={user}
                onSaveCheckin={handleSaveCheckin}
                telemetry={telemetry}
                cabin={cabinEnvironment}
                astronautName={astronautName}
                initialCheckin={latestCheckin}
                evaMode={effectiveEvaMode}
                onToggleEvaMode={setEvaMode}
                onSubmittedResponse={(chk, resp) => setPopupGuidance({ checkin: chk, response: resp })}
                onOpenBodyTwin={() => setActiveStationTab('body')}
              />
            </section>

            {/* Simple Recent Check-Ins Summary (No Jargon) */}
            {dailyCheckins.length > 0 && (
              <section className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Your Saved Check-Ins ({dailyCheckins.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dailyCheckins.slice(0, 4).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-600/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">
                          {entry.date} · {entry.createdAt}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            entry.hasPain
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500 text-slate-950'
                          }`}
                        >
                          {entry.hasPain ? `Pain ${entry.painSeverity}/10` : 'No Pain'}
                        </span>
                      </div>
                      <p className="text-slate-100">
                        Sleep: <strong>{entry.sleepQuality}/10</strong> ({entry.sleepHours}h) · Mood:{' '}
                        <strong>{entry.mentalHealth.split(':')[0]}</strong>
                      </p>
                      <p className="text-slate-300 truncate">{entry.overallFeeling}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: 3D BODY TWIN, DEMO SCENARIOS, EXPLAINABLE ALERTS & VITALS */}
        {activeStationTab === 'body' && (
          <div className="space-y-6">
            {/* Interactive Emergency Scenario Simulator (Demo Mode) */}
            <ScenarioSimulatorBar
              activeScenario={activeScenario}
              onSelectScenario={handleSelectScenario}
            />

            {/* Structured Explainable Assessment Cards */}
            <ExplainableAssessmentCardList
              assessments={correlationAssessments}
              hasActiveScenario={Boolean(activeScenario)}
              onClearScenario={() => handleSimulateEmergency(null, null)}
              onFocusBodyRegion={(regId) => {
                setSelectedBodyRegionId(regId);
                setRegionFocusNonce((n) => n + 1);
                setTimeout(() => {
                  bodySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 60);
              }}
            />

            {/* Active Smart NASA Risk Pills if any triggered */}
            {activeSpecificRisks.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/60">
                <SmartRiskPills
                  compact
                  title="Flagged NASA Health Risks (From Sensors & Check-In)"
                  risks={activeSpecificRisks}
                  onInspectRegion={(regId) => {
                    setSelectedBodyRegionId(regId);
                    setRegionFocusNonce((n) => n + 1);
                  }}
                />
              </div>
            )}

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
                  sleepQuality={effectiveLatestCheckin?.sleepQuality}
                  mentalHealth={effectiveLatestCheckin?.mentalHealth}
                  overallFeeling={effectiveLatestCheckin?.overallFeeling}
                  habitsStrugglingWith={effectiveLatestCheckin?.habitsStrugglingWith}
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

              <div className="lg:col-span-5 bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5">
                <TelemetryVitalsGrid
                  telemetry={telemetry}
                  cabin={cabinEnvironment}
                  status={currentTriageLevel}
                  cumulativeDose={currentAstronaut?.cumulativeRadiationDoseMsv || 94.2}
                  onOpenRadiationTab={() => setActiveStationTab('emergency')}
                />
              </div>
            </div>

            {/* Guided Body & Eye Self-Exam */}
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

        {/* TAB 3: 14-DAY MISSION HEALTH TIMELINE, TRENDS & OSDR */}
        {activeStationTab === 'trends' && (
          <div className="space-y-6">
            <MissionHealthTimeline
              astronautId={currentAstronaut?.id || 'default'}
              astronautName={astronautName}
              roleView="astronaut"
              externalSyncNonce={timelineSyncNonce}
            />

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

        {/* TAB 4: EMERGENCY GUIDES, RADIATION SHELTER & ROUTINES */}
        {activeStationTab === 'emergency' && (
          <div className="space-y-6">
            <EmergencyAssistantModule
              astronautName={astronautName}
              currentXp={gamification.xp}
              onSimulateEmergency={handleSimulateEmergency}
              onLogEmergencyXp={(xpBonus) =>
                updateGamification(
                  (prev) => ({
                    ...prev,
                    xp: prev.xp + xpBonus,
                  }),
                  'Emergency Protocol Finished'
                )
              }
              onOpenBodyTwin={() => setActiveStationTab('body')}
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

            <EnvironmentAndGamificationHub
              activeEnvId={activeEnvId}
              onChangeEnvironment={handleChangeEnvironment}
              onLaunchRoutineAction={handleLaunchRoutineAction}
              gamification={gamification}
              onCompleteRoutine={handleCompleteRoutine}
            />
          </div>
        )}

        {/* TAB 5: NASA 5 HAZARDS, 15 RISK MATRIX & OFFICIAL LINKS */}
        {activeStationTab === 'nasa_refs' && (
          <div className="space-y-6">
            <NasaFiveHazardsWidget
              hazards={fiveHazards}
              onTriggerHazardAction={handleHazardAction}
            />

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEvaMode(!effectiveEvaMode)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center gap-2 ${
                      effectiveEvaMode
                        ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
                        : 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>
                      Pre/Post-EVA Readiness: {effectiveEvaMode ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRiskMatrixOpen(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition cursor-pointer flex items-center gap-2 shadow-[0_0_14px_rgba(6,182,212,0.4)]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View All {allSpecificRisks.length} NASA Health Risks</span>
                  </button>
                </div>

                <span className="text-xs font-mono text-emerald-300 font-bold">
                  {activeSpecificRisks.length > 0
                    ? `${activeSpecificRisks.length} Active Risk Flag${activeSpecificRisks.length > 1 ? 's' : ''}`
                    : 'All 15 NASA HRP Risks Nominal'}
                </span>
              </div>

              {activeSpecificRisks.length > 0 && (
                <SmartRiskPills
                  compact
                  title="Currently Flagged NASA HRP Risks"
                  risks={activeSpecificRisks}
                  onInspectRegion={(regId) => {
                    setActiveStationTab('body');
                    setSelectedBodyRegionId(regId);
                    setRegionFocusNonce((n) => n + 1);
                  }}
                />
              )}
            </div>

            <NasaDataEvidenceCenter
              onOpenRiskMatrix={() => setIsRiskMatrixOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Clean NASA Data & References Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
        <span>HelioMed · 100% Offline Deep-Space Station</span>
        <div className="flex flex-wrap items-center gap-3">
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
      </footer>

      {/* Daily Astronaut Self-Check Pop-Up Modal */}
      <DailySelfCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        user={user}
        onSaveCheckin={handleSaveCheckin}
        telemetry={telemetry}
        cabin={cabinEnvironment}
        astronautName={astronautName}
        initialCheckin={latestCheckin}
        evaMode={effectiveEvaMode}
        onToggleEvaMode={setEvaMode}
        onOpenBodyTwin={() => setActiveStationTab('body')}
      />

      {/* Celebratory Pop-Up After Inline Check-In Submission */}
      {popupGuidance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border-2 border-emerald-400 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.28)] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Daily Check-In Saved!
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Here are your easy-to-follow answers based on what you chose
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopupGuidance(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-600 cursor-pointer"
                aria-label="Close check-in response pop-up"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <PrewrittenResponseCard
                response={popupGuidance.response}
                astronautName={astronautName}
                submittedTime={popupGuidance.checkin.createdAt}
                onOpenBodyTwin={() => {
                  setPopupGuidance(null);
                  setActiveStationTab('body');
                }}
                onClosePopup={() => setPopupGuidance(null)}
              />
            </div>
          </div>
        </div>
      )}

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

      {/* Live XP Pop-Up Toast */}
      {xpToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-400 text-slate-950 border-2 border-white shadow-[0_0_24px_rgba(245,158,11,0.55)] flex items-center gap-3">
          <Award className="w-5 h-5 shrink-0" />
          <div className="text-xs leading-tight">
            <div className="font-extrabold">+{xpToast.delta} XP Added! ({xpToast.label})</div>
            <div className="font-mono font-bold">Total Readiness Score: {xpToast.total} XP</div>
          </div>
          <button
            type="button"
            onClick={() => setXpToast(null)}
            className="p-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/30 cursor-pointer"
            aria-label="Close XP notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
