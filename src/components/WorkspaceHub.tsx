import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MedicalNote, DailyCheckin } from '../types/heliomed';
import { formsStore, ClinicalGoogleForm, SubmittedFormReport } from '../data/formsStore';
import {
  FileSpreadsheet,
  Send,
  Trash2,
  ExternalLink,
  Radio,
  Clock,
  Sparkles,
  ClipboardList,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
  FileCheck,
} from 'lucide-react';

interface WorkspaceHubProps {
  user: User | null;
  astronautName: string;
  missionCode?: string;
  dailyCheckins?: DailyCheckin[];
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  user,
  astronautName,
  missionCode = 'ARTEMIS-II',
  dailyCheckins = [],
}) => {
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [category, setCategory] = useState<MedicalNote['category']>('TRIAGE_MEMO');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Forms store connection
  const [dispatchedForms, setDispatchedForms] = useState<ClinicalGoogleForm[]>(
    formsStore.getForms(missionCode)
  );
  const [submittedReports, setSubmittedReports] = useState<SubmittedFormReport[]>(
    formsStore.getReports(missionCode)
  );

  // Form filling modal state for astronauts
  const [selectedFormToFill, setSelectedFormToFill] = useState<ClinicalGoogleForm | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Earth Sync Packets Queue Simulation
  const [earthDelaySeconds, setEarthDelaySeconds] = useState(868); // 14m 28s
  const [queuedPackets, setQueuedPackets] = useState<
    Array<{ id: string; type: string; timestamp: string; sizeKb: number; status: 'BUFFERED' | 'TRANSMITTING' | 'DSN_RECEIVED' }>
  >([
    {
      id: 'PKT-091',
      type: 'Bio-Telemetry 24h Fused Telemetry Block',
      timestamp: '14:20:00 UTC',
      sizeKb: 142,
      status: 'TRANSMITTING',
    },
    {
      id: 'PKT-092',
      type: 'Clinical Decision Audit & LiOH Canister Incident Log',
      timestamp: '14:32:15 UTC',
      sizeKb: 18,
      status: 'BUFFERED',
    },
  ]);

  // Subscribe to shared formsStore
  useEffect(() => {
    const updateForms = () => {
      setDispatchedForms(formsStore.getForms(missionCode));
      setSubmittedReports(formsStore.getReports(missionCode));
    };
    const unsubscribe = formsStore.subscribe(updateForms);
    return () => unsubscribe();
  }, [missionCode]);

  // Firestore Real-time synchronization of notes for the current user
  useEffect(() => {
    if (!user) {
      // Local fallback initial notes if not signed in
      setNotes([
        {
          id: 'note-01',
          authorId: 'local',
          authorName: 'Dr. Josef Schmid, MD',
          title: 'Daily Microgravity Cephalic Fluid Shift Assessment',
          body: `${astronautName} completed 45-min LBNP protocol. SANS optic disc margins remain sharp, no edema detected. Prescribed 1L electrolyte rehydration.`,
          category: 'DAILY_CHECKIN',
          createdAt: new Date().toLocaleTimeString(),
        },
        {
          id: 'note-02',
          authorId: 'local',
          authorName: 'Dr. Josef Schmid, MD',
          title: 'LiOH Scrubber Bed Rotary Cycle Memo',
          body: 'Environmental rack B filter life reached 89%. Rotation to bed C recommended prior to next sleep cycle to prevent nighttime CO2 accumulation.',
          category: 'TRIAGE_MEMO',
          createdAt: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }

    const notesCol = 'medical_notes';
    const q = query(collection(db, notesCol), where('authorId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => docSnap.data() as MedicalNote);
        setNotes(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, notesCol);
      }
    );

    return () => unsubscribe();
  }, [user, astronautName]);

  // Countdown timer for Earth latency
  useEffect(() => {
    const timer = setInterval(() => {
      setEarthDelaySeconds((prev) => (prev > 0 ? prev - 1 : 868));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLatency = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Create Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const noteId = `note-${Date.now()}`;
    const newNote: MedicalNote = {
      id: noteId,
      authorId: user ? user.uid : 'local',
      authorName: user?.displayName || astronautName || 'Flight Crew',
      title: newTitle.trim(),
      body: newBody.trim(),
      category,
      createdAt: new Date().toLocaleTimeString(),
    };

    if (user) {
      setIsCreatingNote(true);
      try {
        await setDoc(doc(db, 'medical_notes', noteId), newNote);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'medical_notes');
      } finally {
        setIsCreatingNote(false);
      }
    } else {
      setNotes((prev) => [newNote, ...prev]);
    }

    setNewTitle('');
    setNewBody('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'medical_notes', noteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'medical_notes');
      }
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  };

  // Astronaut submits response to assigned Google Form
  const handleSubmitFormResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormToFill) return;

    setIsSubmittingForm(true);

    const report = formsStore.submitReport(
      selectedFormToFill.id,
      astronautName,
      missionCode,
      formAnswers
    );

    // Add telemetry packet to queue
    setQueuedPackets((prev) => [
      {
        id: `PKT-${Date.now().toString().slice(-3)}`,
        type: `Clinical Google Form: ${selectedFormToFill.title}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
        sizeKb: 24,
        status: 'TRANSMITTING',
      },
      ...prev,
    ]);

    setIsSubmittingForm(false);
    setSelectedFormToFill(null);
    setFormAnswers({});
    setSubmissionFeedback(
      `✓ Form answers transmitted to NASA Flight Surgeons on Earth via Deep Space Network! Status: ${report.aiAnalysis.triageLevel} (${report.aiAnalysis.summary})`
    );

    setTimeout(() => {
      setSubmissionFeedback(null);
    }, 8000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left Column: Dispatched Google Forms from Earth Doctors & Earth Transmission Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Assigned Clinical Google Forms
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                  DISPATCHED FROM EARTH
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Medical survey questionnaires assigned to {astronautName} by Ground Flight Surgeons
              </p>
            </div>
          </div>
        </div>

        {/* Clear Notice: Creation restricted to Earth doctors */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200">
              Form Authoring Restricted to NASA Flight Surgeons on Earth
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Only NASA flight surgeons can create new Google Forms from the Earth Doctor Platform. Astronauts fill out and submit assigned surveys below, which are automatically transmitted to Houston/KSC for clinical analysis.
            </p>
          </div>
        </div>

        {/* Submission Feedback Banner */}
        {submissionFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{submissionFeedback}</span>
          </div>
        )}

        {/* Dispatched Google Forms List */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Forms Awaiting Response ({dispatchedForms.length}):
          </span>

          {dispatchedForms.length > 0 ? (
            dispatchedForms.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200">{f.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      <span>Author: {f.authorDoctor}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">Mission: {f.missionCode}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex-shrink-0">
                    {f.category}
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormToFill(f);
                      setFormAnswers({});
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Fill &amp; Submit to Earth Doctors</span>
                  </button>

                  {f.responderUri &&
                    !f.responderUri.includes('1FAIpQLS_') &&
                    !f.responderUri.includes('Artemis-Readiness') &&
                    !f.responderUri.includes('Se-Rad-Survey') && (
                      <a
                        href={f.responderUri}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition flex items-center gap-1.5"
                      >
                        <span>Open in Google Forms</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              No assigned clinical Google Forms at this time. NASA flight surgeons will dispatch surveys when required.
            </div>
          )}
        </div>

        {/* Recently Submitted Reports & Earth Doctor Review Status */}
        {submittedReports.length > 0 && (
          <div className="pt-2 space-y-2.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Transmitted Form Reports to NASA Ground Doctors ({submittedReports.length}):
            </span>
            <div className="space-y-2">
              {submittedReports.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{r.formTitle}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        r.doctorReviewStatus === 'CLEARED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : r.doctorReviewStatus === 'ACTION_REQUIRED'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      {r.doctorReviewStatus === 'CLEARED'
                        ? 'DOCTOR CLEARED'
                        : r.doctorReviewStatus === 'ACTION_REQUIRED'
                        ? 'GROUND ACTION REQUIRED'
                        : 'PENDING EARTH REVIEW'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Submitted: {r.submittedAt} &bull; Received Earth: {r.receivedAtEarth} ({r.latencyDisplay})
                  </p>
                  {r.doctorNotes && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-sans">
                      <strong>Earth Surgeon Directive:</strong> {r.doctorNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earth Sync Latency & DSN Telemetry Buffer */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              DEEP SPACE NETWORK (DSN) BUFFER
            </span>
            <span className="text-amber-400 font-bold">
              EARTH LAG: {formatLatency(earthDelaySeconds)}
            </span>
          </div>

          <div className="space-y-1.5">
            {queuedPackets.map((pkt) => (
              <div
                key={pkt.id}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
              >
                <div className="flex items-center gap-2 text-slate-300 truncate max-w-[260px]">
                  <span className="text-cyan-400">{pkt.id}</span>
                  <span className="truncate">{pkt.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{pkt.sizeKb} KB</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      pkt.status === 'TRANSMITTING'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {pkt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Onboard Medical Notes & Clinical Directives */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Onboard Medical Log &amp; Flight Memos
                </h3>
                <p className="text-xs text-slate-400">
                  Local and ground clinical memos synchronized for Mission {missionCode}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400">{notes.length} Notes</span>
          </div>

          {/* New Note Form */}
          <form onSubmit={handleCreateNote} className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Clinical Memo Title (e.g., LBNP Protocol Results)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicalNote['category'])}
                className="px-2 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="TRIAGE_MEMO">Triage Memo</option>
                <option value="DAILY_CHECKIN">Daily Check-In</option>
                <option value="SYMPTOM_LOG">Symptom Log</option>
                <option value="SELF_TREATMENT">Self-Treatment</option>
              </select>
            </div>

            <textarea
              rows={2}
              placeholder="Record symptoms, diagnostic notes, or autonomous mitigation steps..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-500">
                Author: <strong className="text-slate-300">{astronautName}</strong>
              </span>
              <button
                type="submit"
                disabled={isCreatingNote || !newTitle.trim()}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isCreatingNote ? 'Saving...' : 'Log Clinical Memo'}</span>
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{n.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                      {n.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(n.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {n.body}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>Author: {n.authorName}</span>
                  <span>{n.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Form Response Modal for Astronauts */}
      {selectedFormToFill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  {selectedFormToFill.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned by {selectedFormToFill.authorDoctor} &bull; Transmits to Houston Flight Surgeons
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFormToFill(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFormResponse} className="space-y-4 text-xs">
              {selectedFormToFill.questions.map((q, idx) => (
                <div key={q.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="block text-slate-200 font-semibold leading-relaxed">
                    {idx + 1}. {q.text}
                  </label>

                  {q.type === 'CHOICE' && q.options && (
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300"
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={formAnswers[q.id] === opt}
                            onChange={(e) => setFormAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            className="text-emerald-500 focus:ring-emerald-400"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'SCALE' && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>1 (Optimal / Rested)</span>
                        <span className="text-emerald-400 font-bold">Selected: {formAnswers[q.id] || 3}/10</span>
                        <span>10 (Severe / Exhausted)</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={formAnswers[q.id] || 3}
                        onChange={(e) => setFormAnswers((prev) => ({ ...prev, [q.id]: Number(e.target.value) }))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {q.type === 'TEXT' && (
                    <input
                      type="text"
                      placeholder="Type your reading or symptom notes..."
                      value={formAnswers[q.id] || ''}
                      onChange={(e) => setFormAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedFormToFill(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to NASA Flight Surgeons</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
