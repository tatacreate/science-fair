export interface CheckinData {
  id: string;
  astronautId: string;
  timestamp: Date;
  sleepQuality: number; // 1-10
  sleepDuration: number; // hours
  painAreas: string[];
  nutritionalIntake: string;
  mood: number; // 1-10
  psychologicalStressors: string;
  habitsStruggling: string;
  habitsImproving: string;
  notes: string;
}

export interface Astronaut {
  id: string;
  name: string;
  role: string;
  status: 'NOMINAL' | 'ADVISORY' | 'CRITICAL';
  avatarColor: string;
  checkins: CheckinData[];
}
