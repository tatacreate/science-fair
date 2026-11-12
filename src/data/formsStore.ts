/**
 * Shared Google Forms & Clinical Surveys Store
 * Ensures forms created by NASA Flight Surgeons in the Doctor Platform
 * are dispatched to astronauts, and all submitted responses get sent
 * to NASA Doctors on Earth for automated and physician analysis.
 */

export interface ClinicalGoogleForm {
  id: string;
  title: string;
  description: string;
  missionCode: string;
  targetAstronaut?: string;
  responderUri: string;
  createdAt: string;
  authorDoctor: string;
  category: 'PRE_EVA' | 'RADIATION_SYMPTOM' | 'SANS_VISION' | 'DAILY_READINESS' | 'PSYCH_STRESS';
  questions: Array<{
    id: string;
    text: string;
    type: 'CHOICE' | 'SCALE' | 'TEXT';
    options?: string[];
  }>;
}

export interface SubmittedFormReport {
  id: string;
  formId: string;
  formTitle: string;
  missionCode: string;
  astronautName: string;
  submittedAt: string;
  receivedAtEarth: string;
  latencyDisplay: string;
  answers: Record<string, any>;
  aiAnalysis: {
    triageLevel: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
    summary: string;
    primaryConcerns: string[];
    recommendedAction: string;
  };
  doctorReviewStatus: 'PENDING' | 'CLEARED' | 'ACTION_REQUIRED';
  doctorNotes?: string;
}

const STORAGE_FORMS_KEY = 'heliomed_doctor_google_forms';
const STORAGE_REPORTS_KEY = 'heliomed_submitted_form_reports';

export const INITIAL_DISPATCHED_FORMS: ClinicalGoogleForm[] = [
  {
    id: 'form-artemis-readiness-01',
    title: 'NASA Artemis Pre-Sortie Neuromuscular & Vision Battery',
    description: 'Required 4 hours prior to surface hatch opening or EVA airlock depressurization.',
    missionCode: 'ARTEMIS-II',
    targetAstronaut: 'Christina Koch',
    responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSc-Artemis-Readiness/viewform',
    createdAt: '06:00 UTC',
    authorDoctor: 'Dr. Josef Schmid, MD (NASA Flight Surgeon)',
    category: 'PRE_EVA',
    questions: [
      {
        id: 'q1',
        text: 'Report current visual clarity & blind spot sensations (SANS screening)',
        type: 'CHOICE',
        options: ['100% Crisp vision (No blind spots)', 'Minor near-field blurriness (Presbyopia shift)', 'Optic disc pressure / cotton wool spots'],
      },
      {
        id: 'q2',
        text: 'Subjective fatigue score prior to airlock ingress (1-10)',
        type: 'SCALE',
      },
      {
        id: 'q3',
        text: 'Musculoskeletal pain or harness chafing locations',
        type: 'CHOICE',
        options: ['None - Fully operational', 'Lumbar spinal lengthening discomfort', 'Trapezius / Shoulder suit collar pressure'],
      },
    ],
  },
  {
    id: 'form-rad-acute-02',
    title: 'Acute Solar Flare & Proton Exposure Symptom Survey',
    description: 'Post-solar particle event survey to evaluate prodromal radiation sickness signs.',
    missionCode: 'ARTEMIS-II',
    responderUri: 'https://docs.google.com/forms/d/e/1FAIpQLSe-Rad-Survey/viewform',
    createdAt: '07:30 UTC',
    authorDoctor: 'Dr. Josef Schmid, MD (NASA Flight Surgeon)',
    category: 'RADIATION_SYMPTOM',
    questions: [
      {
        id: 'rad_q1',
        text: 'Prodromal symptoms within last 3 hours',
        type: 'CHOICE',
        options: ['No symptoms (Normal)', 'Mild nausea without vomiting', 'Subtle headache / photophobia', 'Acute fatigue / weakness'],
      },
      {
        id: 'rad_q2',
        text: 'Personal dosimeter reading logged (µSv/h or mSv cumulative)',
        type: 'TEXT',
      },
      {
        id: 'rad_q3',
        text: 'Current location inside spacecraft habitat',
        type: 'CHOICE',
        options: ['Inside Water-Wall Storm Shelter', 'Crew Sleep Quarters (HDPE shielded)', 'Forward Cockpit / Command Deck'],
      },
    ],
  },
];

export const INITIAL_SUBMITTED_REPORTS: SubmittedFormReport[] = [
  {
    id: 'report-koch-01',
    formId: 'form-artemis-readiness-01',
    formTitle: 'NASA Artemis Pre-Sortie Neuromuscular & Vision Battery',
    missionCode: 'ARTEMIS-II',
    astronautName: 'Christina Koch',
    submittedAt: '08:15 UTC',
    receivedAtEarth: '08:15:01 UTC',
    latencyDisplay: '1.3s delay (Lunar Transit)',
    answers: {
      q1: 'Minor near-field blurriness (Presbyopia shift)',
      q2: 3,
      q3: 'Lumbar spinal lengthening discomfort',
    },
    aiAnalysis: {
      triageLevel: 'ADVISORY',
      summary: 'Mild SANS fluid-shift near-vision adaptation and microgravity spinal elongation (L1-L5). Cardiovascular indices remain optimal.',
      primaryConcerns: ['Early microgravity presbyopia shift', 'Lumbar paraspinal tightness from 4cm spinal lengthening'],
      recommendedAction: 'Clear for scheduled duties with 15-minute knees-to-chest stretching and 1.5L electrolyte hydration. Monitor optic margins.',
    },
    doctorReviewStatus: 'CLEARED',
    doctorNotes: 'Reviewed by Dr. Josef Schmid, MD: Cleared for flight deck operations. Prescribed lumbar fetal stretch protocol before resistance cycle.',
  },
  {
    id: 'report-glover-01',
    formId: 'form-artemis-readiness-01',
    formTitle: 'NASA Artemis Pre-Sortie Neuromuscular & Vision Battery',
    missionCode: 'ARTEMIS-II',
    astronautName: 'Victor Glover',
    submittedAt: '09:00 UTC',
    receivedAtEarth: '09:00:01 UTC',
    latencyDisplay: '1.3s delay (Lunar Transit)',
    answers: {
      q1: '100% Crisp vision (No blind spots)',
      q2: 2,
      q3: 'None - Fully operational',
    },
    aiAnalysis: {
      triageLevel: 'NOMINAL',
      summary: 'All neuromuscular and visual parameters completely optimal. Rest score 9/10, vestibular adaptation 100%.',
      primaryConcerns: [],
      recommendedAction: 'Full clearance for all flight and EVA maneuvers without restriction.',
    },
    doctorReviewStatus: 'CLEARED',
    doctorNotes: 'Reviewed by Dr. Josef Schmid, MD: Excellent physical condition. Approved for EVA sortie.',
  },
];

class FormsStore {
  private forms: ClinicalGoogleForm[] = [];
  private reports: SubmittedFormReport[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedForms = localStorage.getItem(STORAGE_FORMS_KEY);
      if (storedForms) {
        this.forms = JSON.parse(storedForms);
      } else {
        this.forms = [...INITIAL_DISPATCHED_FORMS];
        this.saveForms();
      }

      const storedReports = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (storedReports) {
        this.reports = JSON.parse(storedReports);
      } else {
        this.reports = [...INITIAL_SUBMITTED_REPORTS];
        this.saveReports();
      }
    } catch (e) {
      this.forms = [...INITIAL_DISPATCHED_FORMS];
      this.reports = [...INITIAL_SUBMITTED_REPORTS];
    }
  }

  private saveForms() {
    try {
      localStorage.setItem(STORAGE_FORMS_KEY, JSON.stringify(this.forms));
    } catch (e) {
      console.warn('Could not save forms to storage:', e);
    }
    this.notify();
  }

  private saveReports() {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Could not save reports to storage:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getForms(missionCode?: string): ClinicalGoogleForm[] {
    if (!missionCode) return this.forms;
    return this.forms.filter((f) => !f.missionCode || f.missionCode === missionCode);
  }

  getReports(missionCode?: string): SubmittedFormReport[] {
    if (!missionCode) return this.reports;
    return this.reports.filter((r) => !r.missionCode || r.missionCode === missionCode);
  }

  // Doctor creates Google Form (ONLY allowed from Doctor Platform)
  addForm(form: Omit<ClinicalGoogleForm, 'id' | 'createdAt'>): ClinicalGoogleForm {
    const newForm: ClinicalGoogleForm = {
      ...form,
      id: `form-doc-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
    };
    this.forms.unshift(newForm);
    this.saveForms();
    return newForm;
  }

  // Astronaut submits Google Form info, which gets sent to NASA Doctors on Earth
  submitReport(
    formId: string,
    astronautName: string,
    missionCode: string,
    answers: Record<string, any>
  ): SubmittedFormReport {
    const targetForm = this.forms.find((f) => f.id === formId);
    const formTitle = targetForm?.title || 'Clinical Google Form Survey';

    // Automated Aerospace Medicine AI evaluation
    const fatigue = Number(answers['q2']) || 3;
    const hasSANS = String(answers['q1'] || '').toLowerCase().includes('blur') || String(answers['q1'] || '').toLowerCase().includes('cotton');
    const hasSeverePain = String(answers['q3'] || '').toLowerCase().includes('pressure') || String(answers['q3'] || '').toLowerCase().includes('severe');
    const hasRadiationSymptom = String(answers['rad_q1'] || '').toLowerCase().includes('nausea') || String(answers['rad_q1'] || '').toLowerCase().includes('headache');

    let triageLevel: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
    const concerns: string[] = [];

    if (hasRadiationSymptom) {
      triageLevel = 'CRITICAL';
      concerns.push('Acute prodromal radiation reaction indicated (nausea/photophobia)');
    } else if (hasSeverePain || fatigue >= 7) {
      triageLevel = 'WARNING';
      if (fatigue >= 7) concerns.push(`Elevated cognitive & physical fatigue score (${fatigue}/10)`);
      if (hasSeverePain) concerns.push('Moderate musculoskeletal harness pressure');
    } else if (hasSANS || fatigue >= 5) {
      triageLevel = 'ADVISORY';
      if (hasSANS) concerns.push('Mild microgravity presbyopia / optic fluid shift');
    }

    const aiAnalysis = {
      triageLevel,
      summary: concerns.length > 0
        ? `Identified ${concerns.length} physiological condition(s) requiring Ground Flight Surgeon oversight.`
        : 'Form submission fully compliant with NASA HRP nominal flight parameters. No acute contraindications.',
      primaryConcerns: concerns,
      recommendedAction: triageLevel === 'CRITICAL'
        ? 'Ground Flight Surgeon recommends immediate storm shelter verification and anti-emetic administration.'
        : triageLevel === 'WARNING'
        ? 'Ground Flight Surgeon recommends 30-min metabolic rest before suit pressurization.'
        : 'Maintain nominal mission schedule. Hydration and spinal decompression protocol recommended.',
    };

    const newReport: SubmittedFormReport = {
      id: `report-${Date.now()}`,
      formId,
      formTitle,
      missionCode,
      astronautName,
      submittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
      receivedAtEarth: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
      latencyDisplay: missionCode === 'ISS-EXP72' || missionCode === 'CREW-9' ? '0.5s (LEO Orbit)' : missionCode.includes('ARTEMIS') ? '1.3s (Lunar Base)' : '14m 28s (Deep Space DSN)',
      answers,
      aiAnalysis,
      doctorReviewStatus: triageLevel === 'CRITICAL' ? 'ACTION_REQUIRED' : triageLevel === 'WARNING' ? 'ACTION_REQUIRED' : 'PENDING',
    };

    this.reports.unshift(newReport);
    this.saveReports();
    return newReport;
  }

  // Doctor reviews and signs off on report
  reviewReport(reportId: string, status: 'CLEARED' | 'ACTION_REQUIRED', doctorNotes: string) {
    const report = this.reports.find((r) => r.id === reportId);
    if (report) {
      report.doctorReviewStatus = status;
      report.doctorNotes = doctorNotes;
      this.saveReports();
    }
  }
}

export const formsStore = new FormsStore();
