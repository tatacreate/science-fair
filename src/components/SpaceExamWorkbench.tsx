import React, { useState, useRef, useEffect } from 'react';
import {
  ANATOMICAL_REGIONS,
  EXAM_INDICATOR_SPECS,
  ClinicalAttentionLevel,
} from '../data/nasaHrpKnowledge';
import { INDICATOR_SIMPLE_GUIDES } from '../data/habitatEnvironments';
import {
  Keyboard,
  MousePointerClick,
  Camera,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Ruler,
  RotateCcw,
  Save,
  Eye,
  Stethoscope,
  Activity,
  HelpCircle,
} from 'lucide-react';

export interface LoggedExamRecord {
  id: string;
  timestamp: string;
  modality: 'KEYBOARD_LAB' | 'MOUSE_AMSLER' | 'CAMERA_ULTRASOUND';
  indicatorName: string;
  valueSummary: string;
  level: ClinicalAttentionLevel;
  recommendation: string;
}

interface SpaceExamWorkbenchProps {
  astronautName: string;
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onUpdateVitals?: (updates: { systolicBp?: number }) => void;
  onExamLogged?: (indicatorId: string, numericValue: number | null) => void;
  activeTabOverride?: 'keyboard' | 'mouse' | 'camera' | 'guide' | null;
}

const STORAGE_EXAM_LOG_KEY = 'heliomed_offline_exam_logs';

function getAttentionBadgeStyle(level: ClinicalAttentionLevel): {
  classes: string;
  label: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        classes: 'bg-rose-950 border-rose-600 text-rose-300',
        label: 'CRITICAL · IMMEDIATE ACTION',
      };
    case 'SURGEON_ALERT':
      return {
        classes: 'bg-amber-950 border-amber-600 text-amber-300',
        label: 'SURGEON ALERT · DOWNLINK',
      };
    case 'CREW_ATTENTION':
      return {
        classes: 'bg-cyan-950 border-cyan-600 text-cyan-300',
        label: 'CREW ATTENTION · MONITOR',
      };
    default:
      return {
        classes: 'bg-emerald-950 border-emerald-600 text-emerald-300',
        label: 'NOMINAL · FLIGHT CLEARED',
      };
  }
}

export const SpaceExamWorkbench: React.FC<SpaceExamWorkbenchProps> = ({
  astronautName,
  selectedRegionId,
  onSelectRegion,
  onUpdateVitals,
  onExamLogged,
  activeTabOverride,
}) => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse' | 'camera' | 'guide'>('keyboard');

  useEffect(() => {
    if (activeTabOverride) {
      setActiveTab(activeTabOverride);
    }
  }, [activeTabOverride]);

  // ------------------------------------------------------------------
  // 1. KEYBOARD NUMERIC EXAM STATE
  // ------------------------------------------------------------------
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('glucose');
  const [indicatorValues, setIndicatorValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    EXAM_INDICATOR_SPECS.forEach((spec) => {
      initial[spec.id] = spec.defaultValue;
    });
    return initial;
  });

  // Sync indicator when astronaut clicks an anatomical region on the 3D body
  useEffect(() => {
    if (!selectedRegionId) return;
    const match = EXAM_INDICATOR_SPECS.find((s) => s.regionId === selectedRegionId);
    if (match) {
      setSelectedIndicatorId(match.id);
    }
  }, [selectedRegionId]);

  const activeSpec =
    EXAM_INDICATOR_SPECS.find((s) => s.id === selectedIndicatorId) || EXAM_INDICATOR_SPECS[0];
  const currentNumericValue = indicatorValues[activeSpec.id] ?? activeSpec.defaultValue;
  const evaluation = activeSpec.evaluate(currentNumericValue);

  // ------------------------------------------------------------------
  // 2. MOUSE CLICK AMSLER EYE GRID & SYMPTOM CHECK STATE
  // ------------------------------------------------------------------
  const [amslerCells, setAmslerCells] = useState<Record<string, boolean>>({});
  const [selectedClickSymptoms, setSelectedClickSymptoms] = useState<string[]>([]);

  const toggleAmslerCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setAmslerCells((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const distortedCellCount = Object.values(amslerCells).filter(Boolean).length;
  const amslerEvaluation: {
    level: ClinicalAttentionLevel;
    summary: string;
    action: string;
  } =
    distortedCellCount >= 8
      ? {
          level: 'SURGEON_ALERT',
          summary: `Significant macular / central field distortion (${distortedCellCount} of 100 grid sectors flagged). Consistent with SANS choroidal folds or retinal edema.`,
          action:
            'Capture retinal fundoscope image, measure ONSD via ultrasound, execute 30 min LBNP (-25 mmHg), and transmit urgent Flight Surgeon packet.',
        }
      : distortedCellCount > 0
      ? {
          level: 'CREW_ATTENTION',
          summary: `Localized subtle visual waviness detected (${distortedCellCount} sector${distortedCellCount > 1 ? 's' : ''}). Early SANS hyperopic shift check advised.`,
          action:
            'Switch to +1.25D Space Anticipation Glasses for close console work and re-screen in 24 hours.',
        }
      : {
          level: 'NOMINAL',
          summary: 'Zero grid distortion reported. Central macular visual field intact.',
          action: 'Continue standard weekly SANS Amsler monitoring.',
        };

  const toggleClickSymptom = (symptom: string) => {
    setSelectedClickSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  // ------------------------------------------------------------------
  // 3. CAMERA / ULTRASOUND IMAGE ANALYZER & CALIPER STATE
  // ------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadedSampleName, setLoadedSampleName] = useState<string>('ISS Ocular Ultrasound (ONSD Reference)');
  const [caliperPoints, setCaliperPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [imageAnalysisMetrics, setImageAnalysisMetrics] = useState<{
    meanBrightness: number;
    erythemaIndex: number;
    measuredMm: number | null;
  }>({
    meanBrightness: 42,
    erythemaIndex: 4,
    measuredMm: null,
  });

  // Procedural offline medical scan generator (zero external URLs)
  const drawProceduralSampleScan = (sampleType: 'onsd_ultrasound' | 'cardiac_echo' | 'dermal_check') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (sampleType === 'onsd_ultrasound') {
      setLoadedSampleName('ISS Ocular Ultrasound (ONSD Probe — 14 MHz)');
      // Dark ultrasound sector background
      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, w, h);

      // Fan sector speckle noise
      for (let i = 0; i < 4200; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const lum = Math.floor(Math.random() * 65) + 15;
        ctx.fillStyle = `rgba(${lum}, ${lum + 10}, ${lum + 20}, 0.45)`;
        ctx.fillRect(px, py, 2, 2);
      }

      // Hypoechoic ocular globe (dark circle at top)
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.34, 78, 0, Math.PI * 2);
      ctx.fillStyle = '#020408';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Optic nerve sheath hypoechoic column extending downward behind globe
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(w * 0.5 - 24, h * 0.55, 48, 115);
      // Echogenic dura mater borders
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 24, h * 0.55);
      ctx.lineTo(w * 0.5 - 26, h * 0.9);
      ctx.moveTo(w * 0.5 + 24, h * 0.55);
      ctx.lineTo(w * 0.5 + 26, h * 0.9);
      ctx.stroke();

      // Scale ticks & 3mm posterior guide line
      ctx.strokeStyle = '#06b6d4';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 70, h * 0.67);
      ctx.lineTo(w * 0.5 + 70, h * 0.67);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22d3ee';
      ctx.font = '11px monospace';
      ctx.fillText('3mm POST-GLOBE CALIPER AXIS', 14, h * 0.67 - 6);
      ctx.fillText('SCALE: 10px = 1.0 mm', 14, 22);
    } else if (sampleType === 'cardiac_echo') {
      setLoadedSampleName('Cardiac Parasternal Long-Axis Echo (3.5 MHz)');
      ctx.fillStyle = '#05080e';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 3500; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const lum = Math.floor(Math.random() * 55) + 15;
        ctx.fillStyle = `rgba(${lum}, ${lum + 12}, ${lum + 18}, 0.4)`;
        ctx.fillRect(px, py, 2, 2);
      }

      // Left ventricle cavity
      ctx.save();
      ctx.translate(w * 0.52, h * 0.52);
      ctx.rotate(-0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, 110, 42, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#020409';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#22d3ee';
      ctx.font = '11px monospace';
      ctx.fillText('LV END-DIASTOLIC AXIS · SCALE: 10px = 1.0 mm', 14, 22);
    } else {
      setLoadedSampleName('Dermal / T2 Harness Clavicle Inspection');
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#c69578');
      grad.addColorStop(1, '#a97458');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Mild harness erythema band
      const eryGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, 95);
      eryGrad.addColorStop(0, 'rgba(210, 58, 64, 0.72)');
      eryGrad.addColorStop(0.6, 'rgba(195, 72, 72, 0.35)');
      eryGrad.addColorStop(1, 'rgba(195, 72, 72, 0)');
      ctx.fillStyle = eryGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 10, 210, 22);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px monospace';
      ctx.fillText('DERMAL ERYTHEMA · 10px = 1.0 mm', 16, 25);
    }

    setCaliperPoints([]);
    computeCanvasStats();
  };

  const computeCanvasStats = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let totalLum = 0;
    let totalRedExcess = 0;
    const pixelCount = imgData.length / 4;

    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      totalLum += (r + g + b) / 3;
      totalRedExcess += Math.max(0, r - (g + b) / 2);
    }
    const sampled = pixelCount / 4;
    setImageAnalysisMetrics((prev) => ({
      ...prev,
      meanBrightness: Math.round((totalLum / sampled / 255) * 100),
      erythemaIndex: Math.min(100, Math.round((totalRedExcess / sampled / 120) * 100)),
      measuredMm: null,
    }));
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      drawProceduralSampleScan('onsd_ultrasound');
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [activeTab]);

  const startSpacecraftCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera hardware API unavailable in this browser environment. Upload an image or use calibrated flight scans.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied or no spacecraft webcam attached. You can upload an image file or measure calibrated scans below.');
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setLoadedSampleName('Live Spacecraft Camera Capture');
    setCaliperPoints([]);
    computeCanvasStats();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLoadedSampleName(`Uploaded Scan: ${file.name}`);
        setCaliperPoints([]);
        computeCanvasStats();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasCaliperClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setCaliperPoints((prev) => {
      const next = prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }];
      if (next.length === 2) {
        const pxDist = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y);
        // Calibrated scale: 10px = 1.0 mm
        const mm = Math.round((pxDist / 10) * 10) / 10;
        setImageAnalysisMetrics((m) => ({ ...m, measuredMm: mm }));
      } else {
        setImageAnalysisMetrics((m) => ({ ...m, measuredMm: null }));
      }
      return next;
    });
  };

  // ------------------------------------------------------------------
  // 4. PERSISTED OFFLINE DIAGNOSTIC LOG
  // ------------------------------------------------------------------
  const [examLogs, setExamLogs] = useState<LoggedExamRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EXAM_LOG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: 'init-log-1',
        timestamp: '07:40 UTC',
        modality: 'KEYBOARD_LAB',
        indicatorName: 'Blood Glucose (Capillary)',
        valueSummary: '92 mg/dL',
        level: 'NOMINAL',
        recommendation: 'Metabolic fuel availability optimal for mission operations and EVA.',
      },
    ];
  });

  const appendExamLog = (entry: Omit<LoggedExamRecord, 'id' | 'timestamp'>) => {
    const newEntry: LoggedExamRecord = {
      ...entry,
      id: `exam-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC',
    };
    setExamLogs((prev) => {
      const updated = [newEntry, ...prev].slice(0, 12);
      try {
        localStorage.setItem(STORAGE_EXAM_LOG_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleLogNumericIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSpec.id === 'systolic_bp' && onUpdateVitals) {
      onUpdateVitals({ systolicBp: currentNumericValue });
    }
    appendExamLog({
      modality: 'KEYBOARD_LAB',
      indicatorName: activeSpec.label,
      valueSummary: `${currentNumericValue} ${activeSpec.unit}`,
      level: evaluation.level,
      recommendation: evaluation.action,
    });
    onExamLogged?.(activeSpec.id, currentNumericValue);
  };

  const handleLogAmslerExam = () => {
    appendExamLog({
      modality: 'MOUSE_AMSLER',
      indicatorName: 'SANS Amsler Grid & Symptoms',
      valueSummary: `${distortedCellCount}/100 distorted · ${selectedClickSymptoms.length} symptoms`,
      level:
        selectedClickSymptoms.length >= 3 && amslerEvaluation.level === 'NOMINAL'
          ? 'CREW_ATTENTION'
          : amslerEvaluation.level,
      recommendation: amslerEvaluation.action,
    });
    onExamLogged?.('amsler_grid', distortedCellCount);
  };

  const handleLogImageMeasurement = () => {
    const mm = imageAnalysisMetrics.measuredMm;
    let level: ClinicalAttentionLevel = 'NOMINAL';
    let recommendation = 'Recorded offline medical scan into onboard spacecraft health log.';

    if (loadedSampleName.includes('ONSD') && mm !== null) {
      if (mm >= 5.8) {
        level = 'SURGEON_ALERT';
        recommendation = `Measured ONSD ${mm} mm (>= 5.8 mm SANS threshold). Initiate LBNP (-25 mmHg) and downlink scan to Flight Surgeon.`;
      } else if (mm >= 5.0) {
        level = 'CREW_ATTENTION';
        recommendation = `Borderline ONSD ${mm} mm. Monitor closely and repeat in 48 hours.`;
      } else {
        recommendation = `Nominal ONSD caliper measurement (${mm} mm).`;
      }
    } else if (imageAnalysisMetrics.erythemaIndex > 35) {
      level = 'CREW_ATTENTION';
      recommendation = `Elevated dermal erythema index (${imageAnalysisMetrics.erythemaIndex}%). Pad EVA/T2 harness straps and apply soothing hydrocortisone barrier.`;
    }

    appendExamLog({
      modality: 'CAMERA_ULTRASOUND',
      indicatorName: loadedSampleName,
      valueSummary:
        mm !== null
          ? `Caliper: ${mm} mm · Contrast ${imageAnalysisMetrics.meanBrightness}%`
          : `Brightness ${imageAnalysisMetrics.meanBrightness}% · Erythema ${imageAnalysisMetrics.erythemaIndex}%`,
      level,
      recommendation,
    });
    onExamLogged?.(loadedSampleName.includes('ONSD') ? 'onsd' : 'camera_scan', mm);
  };

  const activeBadge = getAttentionBadgeStyle(evaluation.level);

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              In-Space Self-Assessment &amp; Multi-Modal Exam Workbench
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crew: {astronautName} · Offline NASA HRP Evaluation · Supports Keyboard Labs, Mouse Click Grids &amp; Camera/Ultrasound Calipers
            </p>
          </div>
        </div>

        {/* Modality Segmented Navigation */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('keyboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'keyboard'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Lab Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mouse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'mouse'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Click Vision &amp; Symptoms</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'camera'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera &amp; Ultrasound</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'guide'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>NASA HRP Thresholds</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KEYBOARD NUMERIC LAB ENTRY */}
      {activeTab === 'keyboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Indicator Selector & Keyboard Numeric Input */}
          <form onSubmit={handleLogNumericIndicator} className="lg:col-span-6 space-y-4">
            <div>
              <label className="text-xs font-mono uppercase text-slate-400 block mb-2">
                Select In-Space Measurement Indicator:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAM_INDICATOR_SPECS.map((spec) => {
                  const val = indicatorValues[spec.id] ?? spec.defaultValue;
                  const ev = spec.evaluate(val);
                  const isSelected = spec.id === activeSpec.id;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => {
                        setSelectedIndicatorId(spec.id);
                        onSelectRegion(spec.regionId);
                      }}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-500 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold truncate">{spec.label}</span>
                        <span className="text-xs font-mono font-bold tabular-nums text-cyan-400 shrink-0">
                          {val} {spec.unit}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                        <span>{spec.system}</span>
                        <span
                          className={
                            ev.level === 'NOMINAL'
                              ? 'text-emerald-400'
                              : ev.level === 'CREW_ATTENTION'
                              ? 'text-cyan-400'
                              : ev.level === 'SURGEON_ALERT'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {ev.level.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric Keyboard Entry Box + Slider */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Enter Measured Value ({activeSpec.unit})
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Nominal Flight Corridor: {activeSpec.nominalRangeText}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={activeSpec.min}
                    max={activeSpec.max}
                    step={activeSpec.step}
                    value={currentNumericValue}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      if (!Number.isNaN(num)) {
                        setIndicatorValues((prev) => ({ ...prev, [activeSpec.id]: num }));
                      }
                    }}
                    className="w-28 px-3 py-2 bg-slate-900 border border-cyan-700 rounded-lg text-right font-mono font-bold text-base tabular-nums text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs font-mono text-slate-400">{activeSpec.unit}</span>
                </div>
              </div>

              <input
                type="range"
                min={activeSpec.min}
                max={activeSpec.max}
                step={activeSpec.step}
                value={currentNumericValue}
                onChange={(e) =>
                  setIndicatorValues((prev) => ({
                    ...prev,
                    [activeSpec.id]: Number(e.target.value),
                  }))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>Min: {activeSpec.min}</span>
                <span>Default: {activeSpec.defaultValue}</span>
                <span>Max: {activeSpec.max}</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Log Measurement &amp; Evaluate Protocol</span>
              </button>
            </div>
          </form>

          {/* Right: Real-Time NASA HRP Clinical Diagnostic Feedback */}
          <div className="lg:col-span-6 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block">
                  Diagnostic Readout · {activeSpec.system}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{evaluation.headline}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold whitespace-nowrap shrink-0 ${activeBadge.classes}`}
              >
                {activeBadge.label}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold block mb-1">
                  Clinical Interpretation &amp; Action:
                </span>
                <p className="text-slate-200 leading-relaxed">{evaluation.interpretation}</p>
                <p className="text-emerald-300 font-medium mt-2 leading-relaxed">
                  Protocol Action: {evaluation.action}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Measured In Space Using:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{activeSpec.howMeasuredInSpace}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Why This Exam Is Needed:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{activeSpec.whyNeeded}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
                  Spaceflight Hazard Effect &amp; Escalation Triggers:
                </span>
                <p className="text-slate-300 leading-relaxed">{activeSpec.hazardEffect}</p>
                <div className="pt-1 flex flex-wrap gap-4 text-[11px] font-mono">
                  <span className="text-cyan-300">Crew Attention: {activeSpec.crewTrigger}</span>
                  <span className="text-rose-300">Flight Surgeon Alert: {activeSpec.surgeonTrigger}</span>
                </div>
              </div>

              {INDICATOR_SIMPLE_GUIDES[activeSpec.id] && (
                <div className="p-3 rounded-lg bg-slate-900 border border-cyan-900/60 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-cyan-300 font-semibold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    Simple Step-by-Step Guide (No Medical Training Required):
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {INDICATOR_SIMPLE_GUIDES[activeSpec.id].whatItIs}
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-200 pt-0.5">
                    {INDICATOR_SIMPLE_GUIDES[activeSpec.id].howToMeasureSimple.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOUSE CLICK AMSLER VISION GRID & SYMPTOMS */}
      {activeTab === 'mouse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive 10x10 Amsler Grid */}
          <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  ISS Amsler Grid Self-Test (SANS Macular Screening)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Focus on the center white dot with one eye covered. Click any grid squares that look wavy, blurred, or dark.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAmslerCells({})}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="relative mx-auto w-full max-w-[340px] aspect-square bg-slate-950 border-2 border-slate-600 grid grid-cols-10 grid-rows-10">
              {Array.from({ length: 100 }).map((_, idx) => {
                const row = Math.floor(idx / 10);
                const col = idx % 10;
                const key = `${row}-${col}`;
                const active = !!amslerCells[key];
                const isCenter = (row === 4 || row === 5) && (col === 4 || col === 5);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmslerCell(row, col)}
                    aria-label={`Amsler sector row ${row + 1} column ${col + 1}`}
                    className={`border border-slate-700/70 transition-colors cursor-pointer relative ${
                      active ? 'bg-rose-500/70 border-rose-400' : 'hover:bg-cyan-900/30'
                    }`}
                  >
                    {isCenter && row === 4 && col === 4 && (
                      <span
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-cyan-500 z-10 pointer-events-none"
                        title="Central fixation target"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span>Distorted Sectors Marked: <strong className="text-rose-400 tabular-nums">{distortedCellCount} / 100</strong></span>
              <span className="text-cyan-400">Hold 35 cm from eye</span>
            </div>
          </div>

          {/* Click Symptom Check & SANS Interpretation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block">
                Click Active Physical / Neuro-Vestibular Symptoms:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Near-vision blurriness (SANS)',
                  'Space Motion Sickness / Nausea',
                  'Ear barotrauma / Sinus fullness',
                  'Orthostatic dizziness on float',
                  'Lumbar spine stretching ache',
                  'Treadmill harness shoulder pain',
                  'Fingernail pressure delamination',
                  'Throbbing CO2 frontal headache',
                ].map((sym) => {
                  const active = selectedClickSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleClickSymptom(sym)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-950 border-amber-500 text-amber-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase text-slate-400">
                  Visual &amp; Symptom Assessment
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    getAttentionBadgeStyle(amslerEvaluation.level).classes
                  }`}
                >
                  {getAttentionBadgeStyle(amslerEvaluation.level).label}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">{amslerEvaluation.summary}</p>
              <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                Preventative Protocol: {amslerEvaluation.action}
              </p>

              <button
                type="button"
                onClick={handleLogAmslerExam}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Record Click Screen to Onboard Medical Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAMERA & ULTRASOUND / IMAGE CALIPER ANALYZER */}
      {activeTab === 'camera' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Canvas & Camera Viewport */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{loadedSampleName}</h3>
                <p className="text-[11px] text-slate-400">
                  Click two points directly on the image to measure anatomical width in millimeters (Caliper Scale: 10px = 1.0 mm).
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startSpacecraftCamera}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Camera</span>
                </button>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {cameraError && (
              <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-800 text-xs text-amber-200">
                {cameraError}
              </div>
            )}

            {isCameraActive && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  className="w-full max-h-60 rounded-lg border border-cyan-600 bg-black object-cover"
                  muted
                  playsInline
                />
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold cursor-pointer"
                >
                  Capture Frame to Diagnostic Analyzer
                </button>
              </div>
            )}

            {/* Interactive Caliper Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black">
              <canvas
                ref={canvasRef}
                width={520}
                height={300}
                onClick={handleCanvasCaliperClick}
                className="w-full h-auto block cursor-crosshair"
              />
              {/* SVG Overlay for clicked caliper points */}
              <svg
                viewBox="0 0 520 300"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {caliperPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                ))}
                {caliperPoints.length === 2 && (
                  <line
                    x1={caliperPoints[0].x}
                    y1={caliperPoints[0].y}
                    x2={caliperPoints[1].x}
                    y2={caliperPoints[1].y}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}
              </svg>
            </div>

            {/* Reference Scan Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-400">Calibrated In-Flight Scans:</span>
              <button
                type="button"
                onClick={() => drawProceduralSampleScan('onsd_ultrasound')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] font-mono text-slate-200 cursor-pointer"
              >
                Ocular Ultrasound (ONSD)
              </button>
              <button
                type="button"
                onClick={() => drawProceduralSampleScan('cardiac_echo')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] font-mono text-slate-200 cursor-pointer"
              >
                Cardiac Echo
              </button>
              <button
                type="button"
                onClick={() => drawProceduralSampleScan('dermal_check')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] font-mono text-slate-200 cursor-pointer"
              >
                Dermal Harness Check
              </button>
            </div>
          </div>

          {/* Right: Local Pixel & Caliper Analysis Results */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Ruler className="w-4 h-4 text-amber-400" />
              Offline Image &amp; Caliper Analysis
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Caliper Distance
                </span>
                <span className="text-xl font-mono font-bold tabular-nums text-amber-400 mt-1 block">
                  {imageAnalysisMetrics.measuredMm !== null
                    ? `${imageAnalysisMetrics.measuredMm} mm`
                    : 'Click 2 pts'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Mean Luminance
                </span>
                <span className="text-xl font-mono font-bold tabular-nums text-cyan-400 mt-1 block">
                  {imageAnalysisMetrics.meanBrightness}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Dermal Erythema / Inflammation Index
                  </span>
                  <span className="text-xs text-slate-300">
                    Measures local redness delta for harness chafing or suit dermatitis
                  </span>
                </div>
                <span className="text-lg font-mono font-bold tabular-nums text-rose-400">
                  {imageAnalysisMetrics.erythemaIndex}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
                Clinical Protocol Note:
              </span>
              {imageAnalysisMetrics.measuredMm !== null && loadedSampleName.includes('ONSD') ? (
                imageAnalysisMetrics.measuredMm >= 5.8 ? (
                  <p className="text-amber-300">
                    Measured ONSD ({imageAnalysisMetrics.measuredMm} mm) exceeds 5.8 mm SANS threshold. Initiate LBNP fluid shift countermeasure and queue scan for Ground Ophthalmology.
                  </p>
                ) : (
                  <p className="text-emerald-300">
                    Measured ONSD ({imageAnalysisMetrics.measuredMm} mm) is within nominal flight corridor (&lt; 5.0–5.7 mm).
                  </p>
                )
              ) : (
                <p>
                  Click across the dashed 3mm posterior optic sheath axis on the ultrasound canvas (approx 45–60px wide) to calculate sheath diameter offline without internet.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogImageMeasurement}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Scan Measurement to Onboard Record</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: NASA HRP THRESHOLDS & SPACEFLIGHT HAZARD MATRIX */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ANATOMICAL_REGIONS.map((reg) => {
              const isSelected = selectedRegionId === reg.id;
              return (
                <div
                  key={reg.id}
                  className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                    isSelected
                      ? 'bg-slate-950 border-amber-500'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-cyan-400">
                        {reg.system}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">{reg.label}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectRegion(reg.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 text-[11px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Focus on 3D Body
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-200">In-Space Measurements:</strong>{' '}
                      <span className="text-slate-400">{reg.inSpaceMeasurements.join(' · ')}</span>
                    </div>
                    <div>
                      <strong className="text-slate-200">Why Exam Is Needed:</strong>{' '}
                      <span className="text-slate-400">{reg.whyExamNeeded}</span>
                    </div>
                    <div>
                      <strong className="text-amber-300">Spaceflight Hazard Effect:</strong>{' '}
                      <span className="text-slate-300">{reg.spaceflightHazards}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <span className="text-cyan-400 font-mono font-bold block">CREW ATTENTION:</span>
                        <span className="text-slate-300">{reg.crewAttentionThreshold}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <span className="text-rose-400 font-mono font-bold block">GROUND SURGEON ALERT:</span>
                        <span className="text-slate-300">{reg.groundSurgeonThreshold}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Offline Self-Assessment Logs Strip */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Recent Multi-Modal Assessment Log ({examLogs.length} entries stored locally)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            100% Offline Capsule Persistence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {examLogs.slice(0, 6).map((log) => {
            const badge = getAttentionBadgeStyle(log.level);
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200 truncate">{log.indicatorName}</span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold tabular-nums text-cyan-400">
                    {log.valueSummary}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${badge.classes}`}>
                    {log.level.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {log.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
