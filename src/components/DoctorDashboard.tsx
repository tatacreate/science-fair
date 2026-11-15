import React, { useState, useEffect } from 'react';
import { HelioMedEmblem } from './OrbitautsEmblem';
import { Biometric3DViewer } from './Biometric3DViewer';
import { INITIAL_MISSIONS, INITIAL_CREW, MissionDefinition, MissionCrewMember } from '../data/missions';
import { formsStore, ClinicalGoogleForm, SubmittedFormReport } from '../data/formsStore';
import { createAstronautCheckinForm } from '../utils/workspaceIntegration';
import { evaluateNasaFiveHazards } from '../data/nasaFiveHazards';
import { evaluateSpecificNasaRisks } from '../data/nasaHrpRisks';
import { NasaFiveHazardsWidget } from './NasaFiveHazardsWidget';
import { NasaReferenceModal } from './NasaReferenceModal';
import { NasaRiskMatrixModal, SmartRiskPills } from './NasaRiskPillsAndModal';
import { CansNeutronHudWidget } from './CansNeutronHudWidget';
import { ScenarioSimulatorBar } from './ScenarioSimulatorBar';
import { ExplainableAssessmentCardList } from './ExplainableAssessmentCard';
import { MissionHealthTimeline } from './MissionHealthTimeline';
import { NasaDataEvidenceCenter } from './NasaDataEvidenceCenter';
import { runCorrelationEngine } from '../utils/correlationEngine';
import { CabinEnvironment, DailyCheckin, SimulationScenario, TelemetryState } from '../types/heliomed';
import {
  Stethoscope,
  Radio,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  X,
  LogOut,
  Home,
  CheckCircle2,
  Clock,
  User,
  Eye,
  FileSpreadsheet,
  FileCheck,
  Send,
  ExternalLink,
  Zap,
  Check,
  BookOpen,
  ShieldCheck,
  Calendar,
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

  // Forms store connection
  const [dispatchedForms, setDispatchedForms] = useState<ClinicalGoogleForm[]>(
    formsStore.getForms(activeCode)
  );
  const [submittedReports, setSubmittedReports] = useState<SubmittedFormReport[]>(
    formsStore.getReports(activeCode)
  );

  // Create Google Form Modal (Doctor Platform ONLY)
  const [isCreateFormModalOpen, setIsCreateFormModalOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormCategory, setNewFormCategory] = useState<ClinicalGoogleForm['category']>('DAILY_READINESS');
  const [newFormTargetAstronaut, setNewFormTargetAstronaut] = useState<string>('All Crew');
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formCreationSuccess, setFormCreationSuccess] = useState<string | null>(null);

  // Doctor review state
  const [selectedReportForReview, setSelectedReportForReview] = useState<SubmittedFormReport | null>(null);
  const [doctorDirectiveInput, setDoctorDirectiveInput] = useState<string>('');

  // Create Mission Modal State, NASA Reference & Risk Matrix Modal, Demo Scenario & Tabs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNasaRefOpen, setIsNasaRefOpen] = useState(false);
  const [isRiskMatrixOpen, setIsRiskMatrixOpen] = useState(false);
  const [evaMode, setEvaMode] = useState(false);
  const [doctorTab, setDoctorTab] = useState<'overview' | 'timeline' | 'nasa_refs'>('overview');
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [selectedDoctorRegionId, setSelectedDoctorRegionId] = useState<string | null>(null);
  const [doctorRegionNonce, setDoctorRegionNonce] = useState<number>(0);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Subscribe to shared formsStore
  useEffect(() => {
    const updateForms = () => {
      setDispatchedForms(formsStore.getForms(activeCode));
      setSubmittedReports(formsStore.getReports(activeCode));
    };
    const unsubscribe = formsStore.subscribe(updateForms);
    return () => unsubscribe();
  }, [activeCode]);

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

  // Average fleet radiation dose
  const avgRadiationRate = +(
    currentCrew.reduce((acc, c) => acc + (c.recentVitals.radiationRate || 2.1), 0) / (totalCrew || 1)
  ).toFixed(1);

  const fleetCumulativeDose = Math.max(
    ...currentCrew.map((c) => c.cumulativeRadiationDoseMsv || 14.2),
    14.2
  );
  const focusCrewMember = inspectedAstronaut || currentCrew[0];
  const scenarioOverlay = activeScenario?.simulatedCheckinOverlay;
  const effectiveFleetPainAreas = Array.from(
    new Set([
      ...currentCrew.flatMap((c) => c.activePainAreas || []),
      ...(scenarioOverlay?.painAreas || []),
    ])
  );
  const rawFocusCheckin =
    inspectedAstronaut?.latestCheckin ||
    currentCrew.find((c) => c.latestCheckin)?.latestCheckin ||
    null;

  const focusCheckin: DailyCheckin | null = scenarioOverlay
    ? {
        id: rawFocusCheckin?.id || 'doc-sim-overlay',
        userId: rawFocusCheckin?.userId || focusCrewMember?.id || 'crew',
        astronautName: focusCrewMember?.name || 'Astronaut',
        date: new Date().toISOString().split('T')[0],
        sleepQuality: scenarioOverlay.sleepQuality ?? rawFocusCheckin?.sleepQuality ?? 8,
        sleepHours: scenarioOverlay.sleepHours ?? rawFocusCheckin?.sleepHours ?? 7.2,
        mentalHealth: scenarioOverlay.mentalHealth ?? rawFocusCheckin?.mentalHealth ?? 'Operational',
        overallFeeling: scenarioOverlay.overallFeeling ?? rawFocusCheckin?.overallFeeling ?? 'Nominal',
        hasPain: effectiveFleetPainAreas.length > 0,
        painAreas: scenarioOverlay.painAreas || focusCrewMember?.activePainAreas || [],
        painSeverity: scenarioOverlay.painSeverity ?? rawFocusCheckin?.painSeverity ?? 0,
        painNotes: rawFocusCheckin?.painNotes || '',
        habitsToImprove: rawFocusCheckin?.habitsToImprove || [],
        habitsStrugglingWith: rawFocusCheckin?.habitsStrugglingWith || [],
        createdAt: rawFocusCheckin?.createdAt || 'Live',
      }
    : rawFocusCheckin;

  const liveDoctorTelemetry: TelemetryState = {
    timestamp: Date.now(),
    heartRate:
      activeScenario?.vitalsModifiers.heartRate ??
      focusCrewMember?.recentVitals.heartRate ??
      72,
    hrvRmssd: activeScenario?.vitalsModifiers.hrvRmssd ?? 56,
    spo2:
      activeScenario?.vitalsModifiers.spo2 ??
      focusCrewMember?.recentVitals.spo2 ??
      98,
    coreTemp: 37.0,
    respiratoryRate: activeScenario?.vitalsModifiers.respiratoryRate ?? 15,
    radiationDoseRate:
      activeScenario?.vitalsModifiers.radiationDoseRate ?? avgRadiationRate,
    systolicBp: activeScenario?.vitalsModifiers.systolicBp ?? 118,
    diastolicBp: activeScenario?.vitalsModifiers.diastolicBp ?? 76,
    shockIndex: 0.61,
    fatigueScore: activeScenario?.vitalsModifiers.fatigueScore ?? 25,
  };

  const liveDoctorCabin: CabinEnvironment = {
    ambientCO2: activeScenario?.cabinModifiers.ambientCO2 ?? 2.3,
    ambientPressure: activeScenario?.cabinModifiers.ambientPressure ?? 101.3,
    cabinTemp: activeScenario?.cabinModifiers.cabinTemp ?? 21.8,
    o2Fraction: activeScenario?.cabinModifiers.o2Fraction ?? 21.2,
    relativeHumidity: 48,
    speRadiationFlux: activeScenario?.cabinModifiers.speRadiationFlux ?? 4.2,
  };

  const fleetFiveHazards = evaluateNasaFiveHazards({
    telemetry: liveDoctorTelemetry,
    cabin: liveDoctorCabin,
    cumulativeDoseMsv: fleetCumulativeDose,
    latestCheckin: focusCheckin,
    painAreas: effectiveFleetPainAreas,
    missionCode: currentMission.code,
    activeScenarioId: activeScenario?.id,
  });

  const { activeRisks: fleetActiveSpecificRisks, allRisks: fleetAllSpecificRisks } =
    evaluateSpecificNasaRisks({
      heartRate: liveDoctorTelemetry.heartRate,
      spo2: liveDoctorTelemetry.spo2,
      radiationRate: liveDoctorTelemetry.radiationDoseRate,
      cumulativeDoseMsv: fleetCumulativeDose,
      fatigueScore: liveDoctorTelemetry.fatigueScore,
      ambientCO2: liveDoctorCabin.ambientCO2,
      ambientPressure: liveDoctorCabin.ambientPressure,
      painAreas: effectiveFleetPainAreas,
      sleepQuality: focusCheckin?.sleepQuality,
      sleepHours: focusCheckin?.sleepHours,
      mentalHealth: focusCheckin?.mentalHealth,
      overallFeeling: focusCheckin?.overallFeeling,
      habitsStrugglingWith: focusCheckin?.habitsStrugglingWith,
      evaMode: evaMode || Boolean(focusCheckin?.evaMode),
      activeScenarioId: activeScenario?.id,
      selectedRegionId: selectedDoctorRegionId,
    });

  const doctorAssessments = runCorrelationEngine({
    telemetry: liveDoctorTelemetry,
    cabin: liveDoctorCabin,
    latestCheckin: focusCheckin,
    painAreas: scenarioOverlay?.painAreas || focusCrewMember?.activePainAreas || [],
    evaMode: evaMode || Boolean(focusCheckin?.evaMode),
    activeScenario,
    cumulativeDoseMsv: fleetCumulativeDose,
  });

  const handleSelectDoctorScenario = (sc: SimulationScenario | null) => {
    setActiveScenario(sc);
    if (sc) {
      if (!inspectedAstronaut && currentCrew[0]) {
        setInspectedAstronaut(currentCrew[0]);
      }
      if (sc.targetRegionId) {
        setSelectedDoctorRegionId(sc.targetRegionId);
        setDoctorRegionNonce((n) => n + 1);
      }
    } else {
      setSelectedDoctorRegionId(null);
    }
  };

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

  // Doctor Platform ONLY: Handle Google Form Creation & Dispatch
  const handleDispatchGoogleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;

    setIsCreatingForm(true);

    let responderUri = '';

    // Attempt real Google Forms API integration if user signed into Google Workspace
    try {
      const realForm = await createAstronautCheckinForm(
        newFormTitle.trim(),
        newFormTargetAstronaut === 'All Crew' ? activeCode : newFormTargetAstronaut
      );
      if (realForm?.responderUri) {
        responderUri = realForm.responderUri;
      }
    } catch (err) {
      console.info('Google Forms API direct call handled; dispatching via HelioMed Deep-Space Bridge.');
    }

    // Default questions based on category
    const defaultQuestions =
      newFormCategory === 'PRE_EVA'
        ? [
            {
              id: 'q1',
              text: 'Visual acuity check (Near & far field focus clarity)',
              type: 'CHOICE' as const,
              options: ['Nominal (100% Crisp)', 'Minor blurriness in lower quadrant', 'Significant visual impairment'],
            },
            {
              id: 'q2',
              text: 'Pre-EVA Fatigue and sleep restoration rating (1-10)',
              type: 'SCALE' as const,
            },
            {
              id: 'q3',
              text: 'Shoulder / Neck umbilical suit harness pressure point check',
              type: 'CHOICE' as const,
              options: ['No pain / nominal suit clearance', 'Mild clavicle pressure', 'Severe pain / restriction'],
            },
          ]
        : newFormCategory === 'RADIATION_SYMPTOM'
        ? [
            {
              id: 'rad_q1',
              text: 'Prodromal radiation symptoms reported within past 4 hours',
              type: 'CHOICE' as const,
              options: ['None - Asymptomatic', 'Mild episodic nausea', 'Cephalic headache / photophobia', 'Extreme weakness / fatigue'],
            },
            {
              id: 'rad_q2',
              text: 'Current habitat location & shielding configuration',
              type: 'CHOICE' as const,
              options: ['Inside Water-Wall Storm Shelter (-88%)', 'Sleeping Berth (HDPE shielded)', 'Forward Cockpit / Unshielded'],
            },
            {
              id: 'rad_q3',
              text: 'Dosimeter reading logged (µSv/h)',
              type: 'TEXT' as const,
            },
          ]
        : [
            {
              id: 'q1',
              text: 'Report current microgravity symptoms and fluid shift adaptation',
              type: 'CHOICE' as const,
              options: ['Nominal adaptation', 'Head congestion / fullness', 'Musculoskeletal stiffness', 'Sensory fatigue'],
            },
            {
              id: 'q2',
              text: 'Subjective fatigue score (1-10)',
              type: 'SCALE' as const,
            },
            {
              id: 'q3',
              text: 'Clinical symptom notes or pain locations',
              type: 'TEXT' as const,
            },
          ];

    const created = formsStore.addForm({
      title: newFormTitle.trim(),
      description: newFormDesc.trim() || `Clinical survey dispatched by Ground Flight Surgeon for Mission ${activeCode}.`,
      missionCode: activeCode,
      targetAstronaut: newFormTargetAstronaut === 'All Crew' ? undefined : newFormTargetAstronaut,
      responderUri,
      authorDoctor: currentMission.flightSurgeon,
      category: newFormCategory,
      questions: defaultQuestions,
    });

    setIsCreatingForm(false);
    setIsCreateFormModalOpen(false);
    setNewFormTitle('');
    setNewFormDesc('');
    setFormCreationSuccess(`✓ Successfully dispatched "${created.title}" to Mission ${activeCode}! Astronauts can now complete and submit this form.`);

    setTimeout(() => {
      setFormCreationSuccess(null);
    }, 7000);
  };

  // Doctor reviews report & issues directive
  const handleSignOffReport = (reportId: string, status: 'CLEARED' | 'ACTION_REQUIRED') => {
    formsStore.reviewReport(
      reportId,
      status,
      doctorDirectiveInput.trim() ||
        (status === 'CLEARED'
          ? 'Approved by Flight Surgeon: Astronaut cleared for scheduled flight duties.'
          : 'Flight Surgeon Order: Stand down from high-metabolic exertion. Ingress storm shelter and ingest prescribed NAC supplement.')
    );
    setSelectedReportForReview(null);
    setDoctorDirectiveInput('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-16">
      {/* Flight Surgeon Mission Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelioMedEmblem size="sm" showSubtitle={false} />
            <div>
              <span className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400 uppercase block">
                HelioMed · Flight Surgeon Console
              </span>
              <p className="text-xs text-slate-400">
                Ground Medical Command · Google Forms Dispatch &amp; Crew Monitoring
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
                    {m.code} ({m.name.replace('NASA ', '').split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Create Google Form Button (Doctor Platform ONLY) */}
            <button
              type="button"
              onClick={() => setIsCreateFormModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
              title="Only Doctors can author Google Forms"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dispatch Google Form</span>
            </button>

            {/* Create Mission Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Mission</span>
            </button>

            {/* Return to Home Briefing */}
            <button
              type="button"
              onClick={onReturnHome}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition cursor-pointer"
              title="Return to Home Landing"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Home</span>
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
              <Radio className="w-4 h-4 text-amber-400" />
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

        {/* Success Banner */}
        {formCreationSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-600 shadow-xl flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{formCreationSuccess}</span>
          </div>
        )}

        {/* Flight Surgeon Top Console Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setDoctorTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              doctorTab === 'overview'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Mission &amp; Crew Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setDoctorTab('timeline')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              doctorTab === 'timeline'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mission Health Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setDoctorTab('nasa_refs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              doctorTab === 'nasa_refs'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>NASA References</span>
          </button>
        </div>

        {doctorTab === 'nasa_refs' && (
          <NasaDataEvidenceCenter
            onOpenRiskMatrix={() => setIsRiskMatrixOpen(true)}
          />
        )}

        {doctorTab === 'timeline' && (
          <MissionHealthTimeline
            astronautId={focusCrewMember?.id || 'default'}
            astronautName={focusCrewMember?.name || 'Christina Koch'}
            roleView="doctor"
          />
        )}

        {doctorTab === 'overview' && (
          <div className="space-y-6">
            {/* Interactive Emergency Scenario Simulator (Demo Mode) */}
            <ScenarioSimulatorBar
              activeScenario={activeScenario}
              onSelectScenario={handleSelectDoctorScenario}
            />

            {/* Structured Explainable Assessment Cards */}
            <ExplainableAssessmentCardList
              assessments={doctorAssessments}
              hasActiveScenario={Boolean(activeScenario)}
              onClearScenario={() => handleSelectDoctorScenario(null)}
              onFocusBodyRegion={(regId) => {
                if (!inspectedAstronaut && currentCrew[0]) {
                  setInspectedAstronaut(currentCrew[0]);
                }
                setSelectedDoctorRegionId(regId);
                setDoctorRegionNonce((n) => n + 1);
              }}
            />

            {/* Fleet NASA 5 Hazards Surveillance Monitor */}
            <NasaFiveHazardsWidget
              title={`Fleet NASA 5 Hazards Surveillance · ${currentMission.code}`}
              hazards={fleetFiveHazards}
            />

        {/* Fleet NASA HRP Specific Risk Alerts + Coverage Matrix Toggle */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Flight Surgeon NASA HRP Specific Risk Monitor</span>
            </span>

            <button
              type="button"
              onClick={() => setIsRiskMatrixOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-700/70 text-cyan-300 font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>View NASA HRP Risk Coverage ({fleetAllSpecificRisks.length})</span>
            </button>
          </div>

          {fleetActiveSpecificRisks.length > 0 ? (
            <SmartRiskPills
              compact
              title="Active Crew NASA HRP Specific Risks"
              risks={fleetActiveSpecificRisks}
            />
          ) : (
            <p className="text-xs font-mono text-emerald-400">
              ✓ All 15 tracked NASA HRP Physiology, Behavioral &amp; Radiation risks nominal for {currentMission.code}.
            </p>
          )}
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
              <span className="text-[11px] font-mono text-slate-400 uppercase">Form Responses Received</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {submittedReports.length} Reports
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
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
              <span className="text-[11px] font-mono text-slate-400 uppercase">Fleet Avg Radiation</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{avgRadiationRate} µSv/h</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SECTION 1: NASA Flight Surgeon Incoming Form Responses & Clinical Telemetry Console */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                NASA Ground Clinical Form Intake &amp; Telemetry Analysis Console
              </h3>
              <p className="text-xs text-slate-400">
                Any info submitted by astronauts in Google Forms is downlinked to Earth via DSN and evaluated by NASA Flight Surgeons against standard NASA-STD-3001 protocols.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateFormModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create &amp; Dispatch New Google Form</span>
              </button>
            </div>
          </div>

          {/* Submitted Form Reports Table */}
          {submittedReports.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Astronaut</th>
                    <th className="py-3 px-3">Form Title</th>
                    <th className="py-3 px-3">Transmission Timestamps</th>
                    <th className="py-3 px-3">NASA Protocol Evaluation</th>
                    <th className="py-3 px-3">Triage</th>
                    <th className="py-3 px-3">Surgeon Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {submittedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-200 text-sm">{report.astronautName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Mission: {report.missionCode}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-slate-300 font-medium block">{report.formTitle}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Answers logged: {Object.keys(report.answers).length} questions
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">
                        <div>Sub: {report.submittedAt}</div>
                        <div className="text-slate-500">Rec: {report.receivedAtEarth}</div>
                        <div className="text-[10px] text-amber-400">{report.latencyDisplay}</div>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-slate-200 text-xs leading-relaxed font-sans line-clamp-2">
                          {report.aiAnalysis.summary}
                        </div>
                        {report.aiAnalysis.primaryConcerns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {report.aiAnalysis.primaryConcerns.map((c, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[9px] font-mono border border-rose-800"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            report.aiAnalysis.triageLevel === 'CRITICAL'
                              ? 'bg-rose-950 border-rose-600 text-rose-300'
                              : report.aiAnalysis.triageLevel === 'WARNING'
                              ? 'bg-amber-950 border-amber-600 text-amber-300'
                              : report.aiAnalysis.triageLevel === 'ADVISORY'
                              ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                              : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                          }`}
                        >
                          {report.aiAnalysis.triageLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            report.doctorReviewStatus === 'CLEARED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : report.doctorReviewStatus === 'ACTION_REQUIRED'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          {report.doctorReviewStatus === 'CLEARED'
                            ? 'CLEARED'
                            : report.doctorReviewStatus === 'ACTION_REQUIRED'
                            ? 'ACTION REQ'
                            : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReportForReview(report);
                            setDoctorDirectiveInput(report.doctorNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Review &amp; Order</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-300">No Form Submissions Yet for Mission {activeCode}</h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Use the &quot;Dispatch Google Form&quot; button above to create a survey. Astronauts will complete it from their capsule portal, and responses will stream here for analysis.
              </p>
            </div>
          )}

          {/* Active Dispatched Google Forms Roster */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Active Google Forms Dispatched to Crew ({dispatchedForms.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dispatchedForms.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{f.title}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{f.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-cyan-400">
                      {f.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                    <span>Dispatched: {f.createdAt}</span>
                    {f.responderUri &&
                    !f.responderUri.includes('1FAIpQLS_') &&
                    !f.responderUri.includes('Artemis-Readiness') &&
                    !f.responderUri.includes('Se-Rad-Survey') ? (
                      <a
                        href={f.responderUri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                      >
                        <span>Google Form Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-emerald-400 font-semibold">
                        Active on Capsule Portal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Mission Fleet Radiation Dosimetry Overview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-400" />
                Mission Fleet Radiation Dosimetry &amp; Exposure Tracking
              </h3>
              <p className="text-xs text-slate-400">
                Ground monitoring of cumulative ionizing radiation (GCR, SPE flares, trapped belts) across all crew members on {activeCode}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
              NASA 600 mSv Career Ceiling
            </span>
          </div>

          {/* CANS Active Neutron Spectrometer Fleet Feed */}
          <CansNeutronHudWidget
            doseRateUSv={liveDoctorTelemetry.radiationDoseRate}
            cumulativeDoseMsv={
              inspectedAstronaut?.cumulativeRadiationDoseMsv || fleetCumulativeDose
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {currentCrew.map((c) => {
              const dose = c.cumulativeRadiationDoseMsv || 14.2;
              const rate = c.recentVitals.radiationRate || 2.1;
              const pct = Math.min(100, Math.round((dose / 600) * 100));

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{c.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{c.role}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rate > 50
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : rate > 15
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {rate.toFixed(1)} µSv/h
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Cumulative:</span>
                      <strong className="text-slate-200">{dose.toFixed(1)} mSv ({pct}%)</strong>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${pct > 50 ? 'bg-rose-500' : pct > 25 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                      />
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>REID Risk: &lt;1.2%</span>
                    <span className="text-emerald-400">Shielding Nominal</span>
                  </div>
                </div>
              );
            })}
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
                  heartRate={liveDoctorTelemetry.heartRate}
                  spo2={liveDoctorTelemetry.spo2}
                  radiationRate={liveDoctorTelemetry.radiationDoseRate}
                  cumulativeDoseMsv={inspectedAstronaut.cumulativeRadiationDoseMsv}
                  status={activeScenario ? activeScenario.severity : inspectedAstronaut.status}
                  painAreas={
                    scenarioOverlay?.painAreas
                      ? Array.from(
                          new Set([...inspectedAstronaut.activePainAreas, ...scenarioOverlay.painAreas])
                        )
                      : inspectedAstronaut.activePainAreas
                  }
                  activeScenario={activeScenario?.id}
                  selectedRegionId={selectedDoctorRegionId}
                  regionFocusNonce={doctorRegionNonce}
                  cabinCO2={liveDoctorCabin.ambientCO2}
                  sleepQuality={focusCheckin?.sleepQuality}
                  mentalHealth={focusCheckin?.mentalHealth}
                  overallFeeling={focusCheckin?.overallFeeling}
                  habitsStrugglingWith={focusCheckin?.habitsStrugglingWith}
                  evaMode={evaMode || Boolean(focusCheckin?.evaMode)}
                  onRegionSelect={(regId) => setSelectedDoctorRegionId(regId)}
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

                {(() => {
                  const { activeRisks } = evaluateSpecificNasaRisks({
                    heartRate: inspectedAstronaut.recentVitals.heartRate,
                    spo2: inspectedAstronaut.recentVitals.spo2,
                    radiationRate: inspectedAstronaut.recentVitals.radiationRate,
                    cumulativeDoseMsv: inspectedAstronaut.cumulativeRadiationDoseMsv,
                    painAreas: inspectedAstronaut.activePainAreas,
                    sleepQuality: inspectedAstronaut.latestCheckin?.sleepQuality,
                    sleepHours: inspectedAstronaut.latestCheckin?.sleepHours,
                    mentalHealth: inspectedAstronaut.latestCheckin?.mentalHealth,
                    overallFeeling: inspectedAstronaut.latestCheckin?.overallFeeling,
                    habitsStrugglingWith: inspectedAstronaut.latestCheckin?.habitsStrugglingWith,
                    evaMode: evaMode || Boolean(inspectedAstronaut.latestCheckin?.evaMode),
                  });
                  if (activeRisks.length === 0) return null;
                  return (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <SmartRiskPills
                        compact
                        title={`Flagged NASA HRP Risks · ${inspectedAstronaut.callsign}`}
                        risks={activeRisks}
                      />
                    </div>
                  );
                })()}

                {inspectedAstronaut.latestCheckin?.aiFeedback && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <span className="font-mono text-[11px] uppercase text-amber-400 font-bold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                      Flight Medicine Guidance (NASA-STD-3001):
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

            {/* 14-Day Mars Transit Mission Health Timeline (Flight Surgeon View) */}
            <MissionHealthTimeline
              astronautId={focusCrewMember?.id || 'default'}
              astronautName={focusCrewMember?.name || 'Christina Koch'}
              roleView="doctor"
            />
          </div>
        )}
      </main>

      {/* MODAL 1: Create Google Form (Doctor Platform ONLY) */}
      {isCreateFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Dispatch Clinical Google Form to Mission Crew
                </h3>
                <p className="text-xs text-slate-400">
                  Doctor-authorized medical survey creation for Mission {activeCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateFormModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchGoogleForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Survey / Form Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pre-Sortie Cardiopulmonary & SANS Evaluation"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Clinical Survey Category:
                </label>
                <select
                  value={newFormCategory}
                  onChange={(e) => setNewFormCategory(e.target.value as ClinicalGoogleForm['category'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="PRE_EVA">Pre-EVA Airlock Clearance Battery</option>
                  <option value="RADIATION_SYMPTOM">Acute Radiation &amp; Solar Flare Symptom Log</option>
                  <option value="SANS_VISION">SANS Neuro-Ocular Fluid Shift Check</option>
                  <option value="DAILY_READINESS">Daily Operational Readiness Check</option>
                  <option value="PSYCH_STRESS">Deep-Space Isolation &amp; Morale Battery</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Target Recipient(s):
                </label>
                <select
                  value={newFormTargetAstronaut}
                  onChange={(e) => setNewFormTargetAstronaut(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="All Crew">All Mission Crew ({activeCode})</option>
                  {currentCrew.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Clinical Instructions for Astronaut:
                </label>
                <textarea
                  rows={2}
                  placeholder="Complete and submit prior to beginning EVA airlock depressurization."
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Once dispatched, this Google Form will appear immediately in the astronaut capsule portal. Responses will transmit back to Houston with real light-speed delay simulation for Flight Surgeon clinical review.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingForm}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs cursor-pointer shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isCreatingForm ? 'Generating...' : 'Dispatch to Capsule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Flight Surgeon Review & Clinical Orders */}
      {selectedReportForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-cyan-400" />
                  Flight Surgeon Report Review &amp; Directive
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Astronaut: <strong className="text-slate-200">{selectedReportForReview.astronautName}</strong> &bull; {selectedReportForReview.formTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportForReview(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Telemetry latency stamp */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Transmitted: {selectedReportForReview.submittedAt}</span>
                <span className="text-amber-400">{selectedReportForReview.latencyDisplay}</span>
              </div>

              {/* Answers */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-mono text-[11px] text-cyan-400 uppercase font-bold block">
                  Reported Questionnaire Answers:
                </span>
                <div className="space-y-1.5 text-slate-300">
                  {Object.entries(selectedReportForReview.answers).map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1">
                      <span className="text-slate-400 font-mono text-[11px]">{key}:</span>
                      <strong className="text-slate-200 text-right">{String(val)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ground Protocol Evaluation */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                    Automated NASA-STD-3001 Protocol Evaluation:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-amber-300 border border-slate-700">
                    {selectedReportForReview.aiAnalysis.triageLevel}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {selectedReportForReview.aiAnalysis.summary}
                </p>
                <div className="text-[11px] text-emerald-400 font-sans">
                  <strong>Recommended Protocol:</strong> {selectedReportForReview.aiAnalysis.recommendedAction}
                </div>
              </div>

              {/* Doctor Directive Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-mono text-[11px] uppercase">
                  Flight Surgeon Ground Directive / Prescription:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Approved for EVA-1 sortie. Maintain 2.5L electrolyte intake and execute 15-minute lumbar decompression stretching."
                  value={doctorDirectiveInput}
                  onChange={(e) => setDoctorDirectiveInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              {/* Sign-off Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSignOffReport(selectedReportForReview.id, 'ACTION_REQUIRED')}
                  className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-mono font-bold text-xs cursor-pointer"
                >
                  Require Ground Medical Action
                </button>
                <button
                  type="button"
                  onClick={() => handleSignOffReport(selectedReportForReview.id, 'CLEARED')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs cursor-pointer shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clear Astronaut &amp; Beam Order to Capsule</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New Mission Modal */}
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
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] uppercase mb-1">
                  Unique Mission Code (e.g. ARTEMIS-IV, CREW-10):
                </label>
                <input
                  type="text"
                  required
                  placeholder="ARTEMIS-IV"
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
                  placeholder="NASA Artemis IV Gateway Habitat"
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
                  placeholder="Near-Rectilinear Halo Orbit (NRHO)"
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
                  placeholder="Long-duration deep-space radiation shielding and autonomous clinical support."
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
      {/* Clean NASA Data & References Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <span>HelioMed · Ground Flight Surgeon Console</span>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://www.nasa.gov/hrp/hazards/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 underline underline-offset-2"
          >
            <span>NASA HRP Hazards</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.nasa.gov/hrp/risks/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 underline underline-offset-2"
          >
            <span>NASA HRP Risks</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 underline underline-offset-2"
          >
            <span>CSA CANS Radiation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
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

      <NasaRiskMatrixModal
        isOpen={isRiskMatrixOpen}
        onClose={() => setIsRiskMatrixOpen(false)}
        allRisks={fleetAllSpecificRisks}
        evaMode={evaMode}
        onToggleEvaMode={setEvaMode}
      />
    </div>
  );
};
