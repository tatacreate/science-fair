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
import { createAstronautCheckinForm, GoogleFormDefinition } from '../utils/workspaceIntegration';
import {
  FileSpreadsheet,
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Radio,
  Clock,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface WorkspaceHubProps {
  user: User | null;
  onSignInPrompt: () => void;
  astronautName: string;
  dailyCheckins?: DailyCheckin[];
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  user,
  onSignInPrompt,
  astronautName,
  dailyCheckins = [],
}) => {
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [category, setCategory] = useState<MedicalNote['category']>('TRIAGE_MEMO');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Google Forms state
  const [createdForms, setCreatedForms] = useState<GoogleFormDefinition[]>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }, [user]);

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
      authorName: user?.displayName || 'Flight Surgeon',
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

  // Generate Google Forms Check-in
  const handleGenerateGoogleForm = async () => {
    setIsCreatingForm(true);
    setFormError(null);
    try {
      const formDef = await createAstronautCheckinForm(
        `${astronautName} Daily Readiness Check`,
        astronautName
      );
      setCreatedForms((prev) => [formDef, ...prev]);
    } catch (err: any) {
      console.warn('Google Form creation notification:', err);
      if (err.message?.includes('closed') || err.message?.includes('popup-closed-by-user')) {
        setFormError('Sign-in popup was closed. Please complete Google sign-in to authorize Google Forms creation.');
      } else if (err.message?.includes('sign in')) {
        setFormError('Please sign in with Google to create forms in your Google Drive.');
      } else {
        setFormError(err.message || 'Could not connect to Google Forms API. Check permissions.');
      }
    } finally {
      setIsCreatingForm(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left Column: Google Workspace Forms & Earth Sync Delay Buffer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Google Forms Check-ins &amp; Crew Surveys
              </h3>
              <p className="text-xs text-slate-400">
                Generate and sync astronaut symptom survey forms to your Workspace account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateGoogleForm}
            disabled={isCreatingForm}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreatingForm ? 'Generating Form...' : 'New Google Form'}</span>
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {formError}
          </div>
        )}

        {/* Created Google Forms List */}
        <div className="space-y-2.5">
          {createdForms.length > 0 ? (
            createdForms.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{f.title}</h4>
                  <span className="text-[11px] font-mono text-emerald-400">
                    ID: {f.formId.slice(0, 14)}...
                  </span>
                </div>
                <a
                  href={f.responderUri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Form</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              No Google Forms created for this session yet. Click &apos;New Google Form&apos; to generate a crew symptom survey directly in your Google Workspace account.
            </div>
          )}
        </div>

        {/* Earth Sync Latency & DSN Telemetry Buffer */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              DEEP SPACE NETWORK (DSN) BUFFER
            </span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Earth Transit Delay: {formatLatency(earthDelaySeconds)}
            </span>
          </div>

          <div className="space-y-2">
            {queuedPackets.map((pkt) => (
              <div
                key={pkt.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{pkt.id}</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{pkt.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{pkt.sizeKb} KB</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      pkt.status === 'TRANSMITTING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
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

      {/* Right Column: Flight Surgeon Clinical Notes & Keep Memos */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Flight Medical Notes &amp; Clinical Memos
                </h3>
                <p className="text-xs text-slate-400">
                  {user ? `Connected to Firestore (UID: ${user.uid.slice(0, 8)}...)` : 'Local preview (Sign in for Firestore cloud persistence)'}
                </p>
              </div>
            </div>
          </div>

          {/* New Note Form */}
          <form onSubmit={handleCreateNote} className="mt-4 space-y-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Clinical Memo Title (e.g. LiOH Saturation Observation)..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono focus:outline-none"
              >
                <option value="TRIAGE_MEMO">TRIAGE MEMO</option>
                <option value="DAILY_CHECKIN">DAILY CHECKIN</option>
                <option value="COUNTERMEASURE">COUNTERMEASURE</option>
                <option value="MEDICATION_LOG">MEDICATION LOG</option>
              </select>
            </div>

            <div className="flex gap-2">
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={2}
                placeholder="Log physical exam observations, medication dosages, countermeasure adherence..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
              <button
                type="submit"
                disabled={isCreatingNote || !newTitle.trim() || !newBody.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{note.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      {note.category}
                    </span>
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed">{note.body}</p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <span>By: {note.authorName}</span>
                    <span>•</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
