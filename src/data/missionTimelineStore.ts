export interface TimelineDayEntry {
  day: number; // 1..14
  solLabel: string; // "Day 1" .. "Day 14"
  sleepHours: number; // 0..12
  stressScore: number; // 1..10 (higher = more stress)
  painSeverity: number; // 0..10
  painZone: string;
  hydrationLiters: number; // 0.5..4.0 L
  note: string;
}

const STORAGE_KEY_PREFIX = 'heliomed_mars_timeline_v1_';

function buildSeeded14DayTransit(astronautId: string): TimelineDayEntry[] {
  // Subtle crew-specific variance while showcasing a clear 14-day Mars transit progression
  const isKoch = astronautId.includes('koch');
  const isGlover = astronautId.includes('glover');

  const baseDays: TimelineDayEntry[] = [
    {
      day: 1,
      solLabel: 'Day 1',
      sleepHours: 6.4,
      stressScore: 5,
      painSeverity: 2,
      painZone: 'Head (Fluid shift)',
      hydrationLiters: 2.1,
      note: 'Transit injection burn completed; mild head fullness.',
    },
    {
      day: 2,
      solLabel: 'Day 2',
      sleepHours: 6.1,
      stressScore: 6,
      painSeverity: 3,
      painZone: 'Head / Inner Ear',
      hydrationLiters: 2.0,
      note: 'Early vestibular adaptation and minor congestion.',
    },
    {
      day: 3,
      solLabel: 'Day 3',
      sleepHours: 6.8,
      stressScore: 5,
      painSeverity: 2,
      painZone: 'Head (Easing)',
      hydrationLiters: 2.3,
      note: 'Electrolytes increased; vestibular symptoms subsiding.',
    },
    {
      day: 4,
      solLabel: 'Day 4',
      sleepHours: 7.2,
      stressScore: 4,
      painSeverity: 1,
      painZone: 'None',
      hydrationLiters: 2.5,
      note: 'Circadian lighting rhythm stabilizing.',
    },
    {
      day: 5,
      solLabel: 'Day 5',
      sleepHours: 7.4,
      stressScore: 3,
      painSeverity: 3,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.6,
      note: 'Microgravity spinal lengthening stiffness noticed.',
    },
    {
      day: 6,
      solLabel: 'Day 6',
      sleepHours: 7.1,
      stressScore: 4,
      painSeverity: 4,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.4,
      note: 'Added 15 min knees-to-chest decompression stretch.',
    },
    {
      day: 7,
      solLabel: 'Day 7',
      sleepHours: 7.5,
      stressScore: 3,
      painSeverity: 2,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.7,
      note: 'Week 1 ARED resistance benchmark nominal.',
    },
    {
      day: 8,
      solLabel: 'Day 8',
      sleepHours: 7.3,
      stressScore: 4,
      painSeverity: 2,
      painZone: 'Shoulders',
      hydrationLiters: 2.5,
      note: 'Suit fit-check harness soreness mild.',
    },
    {
      day: 9,
      solLabel: 'Day 9',
      sleepHours: 6.6,
      stressScore: 5,
      painSeverity: 2,
      painZone: 'Neck',
      hydrationLiters: 2.2,
      note: 'Sleeping sack ventilation noise reduced rest slightly.',
    },
    {
      day: 10,
      solLabel: 'Day 10',
      sleepHours: 5.9,
      stressScore: 6,
      painSeverity: 3,
      painZone: 'Head',
      hydrationLiters: 1.9,
      note: 'Lower fluid intake + late shift prep raised fatigue.',
    },
    {
      day: 11,
      solLabel: 'Day 11',
      sleepHours: 6.2,
      stressScore: 6,
      painSeverity: 3,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.0,
      note: 'Confinement check-in flagged; mindfulness break scheduled.',
    },
    {
      day: 12,
      solLabel: 'Day 12',
      sleepHours: 6.9,
      stressScore: 4,
      painSeverity: 2,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.5,
      note: 'Amber pre-sleep lighting & electrolyte pack restored sleep.',
    },
    {
      day: 13,
      solLabel: 'Day 13',
      sleepHours: 7.4,
      stressScore: 3,
      painSeverity: 2,
      painZone: 'Spine / Lumbar',
      hydrationLiters: 2.6,
      note: 'Strong crew coordination; steady vitals across transit.',
    },
    {
      day: 14,
      solLabel: 'Day 14',
      sleepHours: isGlover ? 7.6 : isKoch ? 7.2 : 7.0,
      stressScore: isGlover ? 2 : 3,
      painSeverity: isGlover ? 0 : isKoch ? 3 : 2,
      painZone: isGlover ? 'None' : 'Spine / Lumbar',
      hydrationLiters: isGlover ? 2.8 : 2.5,
      note: isGlover
        ? 'All baseline readiness indicators nominal.'
        : 'Current Mars transit baseline — stretching & hydration on track.',
    },
  ];

  if (isGlover) {
    return baseDays.map((d) => ({
      ...d,
      sleepHours: +Math.min(8.5, d.sleepHours + 0.3).toFixed(1),
      stressScore: Math.max(1, d.stressScore - 1),
      painSeverity: Math.max(0, d.painSeverity - 1),
      hydrationLiters: +Math.min(3.2, d.hydrationLiters + 0.2).toFixed(1),
    }));
  }

  return baseDays;
}

export function loadMissionTimeline(astronautId = 'default'): TimelineDayEntry[] {
  const key = `${STORAGE_KEY_PREFIX}${astronautId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage read errors
  }

  const seeded = buildSeeded14DayTransit(astronautId);
  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    // ignore quota errors
  }
  return seeded;
}

export function saveMissionTimeline(
  astronautId = 'default',
  entries: TimelineDayEntry[]
): TimelineDayEntry[] {
  const key = `${STORAGE_KEY_PREFIX}${astronautId}`;
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // ignore
  }
  return entries;
}

export function updateLatestTimelineDay(
  astronautId = 'default',
  patch: Partial<Omit<TimelineDayEntry, 'day' | 'solLabel'>>
): TimelineDayEntry[] {
  const current = loadMissionTimeline(astronautId);
  const updated = current.map((entry, idx) =>
    idx === current.length - 1 ? { ...entry, ...patch } : entry
  );
  return saveMissionTimeline(astronautId, updated);
}

export function resetMissionTimeline(astronautId = 'default'): TimelineDayEntry[] {
  const seeded = buildSeeded14DayTransit(astronautId);
  return saveMissionTimeline(astronautId, seeded);
}
