import { DailyCheckin, TelemetryState, CabinEnvironment } from '../types/heliomed';

export type ResponseLightColor = 'green' | 'amber' | 'red';

export interface PrewrittenResponseSection {
  id: 'sleep' | 'mental' | 'body' | 'habits' | 'eva';
  title: string;
  light: ResponseLightColor;
  statusLabel: string;
  chosenSummary: string;
  guidanceText: string;
  quickAction: string;
}

export interface PrewrittenAstronautResponse {
  overallStatus: 'GOOD' | 'CAUTION' | 'ATTENTION';
  headline: string;
  summaryText: string;
  sections: PrewrittenResponseSection[];
}

const MENTAL_RESPONSES: Record<
  string,
  {
    light: ResponseLightColor;
    statusLabel: string;
    guidanceText: string;
    quickAction: string;
  }
> = {
  'Calm & Focused': {
    light: 'green',
    statusLabel: 'Steady & Clear',
    guidanceText:
      'You are in a great headspace today. Your focus is steady, which makes daily tasks and teamwork feel much smoother.',
    quickAction: 'Keep your usual work rhythm and take short 5-minute stretch breaks between tasks.',
  },
  'High Morale': {
    light: 'green',
    statusLabel: 'Upbeat & Energized',
    guidanceText:
      'High morale boosts the whole crew! Your positive energy helps everyone handle tight living quarters and busy schedules.',
    quickAction: 'Share a quick encouraging word or meal with a crewmate today.',
  },
  'Mild Space Isolation': {
    light: 'amber',
    statusLabel: 'Needs Connection',
    guidanceText:
      'Missing home and normal outdoor sights is very common in deep space. Talking or listening to familiar voices helps lift that heavy feeling.',
    quickAction: 'Listen to a recorded message from family or chat with a crewmate over dinner.',
  },
  'Sensory Fatigue': {
    light: 'amber',
    statusLabel: 'Overstimulated',
    guidanceText:
      'Constant spacecraft fan noise and bright cabin lights can wear down your brain. Give your eyes and ears a short break from screens.',
    quickAction: 'Use noise-canceling headphones and rest in dim lighting for 15 minutes.',
  },
  'Anxious / High Stress': {
    light: 'red',
    statusLabel: 'High Stress',
    guidanceText:
      'Feeling tense or worried in a small spacecraft is a normal human reaction. Slowing down your breathing tells your nervous system that you are safe.',
    quickAction: 'Do 5 minutes of slow breathing (breathe in 4 seconds, out 6 seconds) and tell your commander if you need lighter tasks.',
  },
  'Crew Friction / Comm Flag': {
    light: 'amber',
    statusLabel: 'Team Tension',
    guidanceText:
      'Living and working with the same small team every day can cause friction. Taking a calm pause prevents small misunderstandings from growing.',
    quickAction: 'Step back for 10 minutes, then do a short, respectful end-of-day check-in with your crew.',
  },
  'System Confusion / Tech Alert': {
    light: 'amber',
    statusLabel: 'Screen Overload',
    guidanceText:
      'When alarms or screens feel confusing, rushing makes mistakes more likely. You do not need to memorize everything at once.',
    quickAction: 'Open the guided checklists one step at a time and ask a crewmate to double-check your steps.',
  },
};

function buildPainAdvice(painAreas: string[], painSeverity: number): {
  light: ResponseLightColor;
  statusLabel: string;
  guidanceText: string;
  quickAction: string;
} {
  const joined = painAreas.join(' ').toLowerCase();
  const isSevere = painSeverity >= 7 || joined.includes('chest') || joined.includes('heart');

  if (joined.includes('chest') || joined.includes('heart')) {
    return {
      light: 'red',
      statusLabel: 'Immediate Care',
      guidanceText:
        'Chest discomfort or a racing heart needs immediate rest and a quick check. Sit or float calmly and check your pulse oximeter right away.',
      quickAction: 'Stop physical work now, open the Safety & Emergency tab, and clip on your heart/oxygen monitor.',
    };
  }

  if (joined.includes('head') || joined.includes('eye')) {
    return {
      light: painSeverity >= 6 ? 'red' : 'amber',
      statusLabel: painSeverity >= 6 ? 'Head / Vision Care' : 'Mild Pressure',
      guidanceText:
        'In zero gravity, body fluid moves toward your head, which can cause headaches or tired eyes. High cabin carbon dioxide (CO2) can also make your head throb.',
      quickAction: 'Drink a full glass of water, move near a fresh air vent, and rest your eyes from bright screens for 20 minutes.',
    };
  }

  if (joined.includes('ear') || joined.includes('dizz') || joined.includes('balance')) {
    return {
      light: 'amber',
      statusLabel: 'Balance Support',
      guidanceText:
        'Floating without gravity temporarily confuses your inner ear, causing dizziness or motion sickness. Sudden head turns make it feel stronger.',
      quickAction: 'Keep your head steady, hold onto a handrail while moving, and sip water slowly.',
    };
  }

  if (joined.includes('spine') || joined.includes('lumbar') || joined.includes('back')) {
    return {
      light: isSevere ? 'red' : 'amber',
      statusLabel: 'Back Decompression',
      guidanceText:
        'Without gravity pulling your spine down, your back stretches out and often feels sore or stiff—especially in the morning.',
      quickAction: 'Float and gently hug both knees to your chest for 5 minutes to relax your lower back.',
    };
  }

  if (joined.includes('joint') || joined.includes('shoulder') || joined.includes('knee')) {
    return {
      light: isSevere ? 'red' : 'amber',
      statusLabel: 'Muscle & Joint Care',
      guidanceText:
        'Spacesuit harnesses and floating workouts can tighten shoulders and knees. Gentle motion helps blood flow without straining sore joints.',
      quickAction: 'Skip heavy resistance weights today and do 10 minutes of light stretching instead.',
    };
  }

  if (joined.includes('skin') || joined.includes('rash')) {
    return {
      light: 'amber',
      statusLabel: 'Skin & Immune Care',
      guidanceText:
        'Dry recycled air and stress can irritate skin and slow healing in space. Keeping irritated areas clean and moisturized prevents flare-ups.',
      quickAction: 'Wash gently with a clean wipe, apply mild skin cream, and avoid tight clothing over the rash.',
    };
  }

  return {
    light: painSeverity >= 6 ? 'red' : 'amber',
    statusLabel: `Pain ${painSeverity}/10`,
    guidanceText:
      'Your body is telling you to slow down and let sore areas recover before your next heavy shift or workout.',
    quickAction: 'Take a lighter workload today, stretch gently, and re-check how you feel before sleep.',
  };
}

function buildHabitAdvice(habitsToImprove: string[], habitsStrugglingWith: string[]): {
  light: ResponseLightColor;
  statusLabel: string;
  chosenSummary: string;
  guidanceText: string;
  quickAction: string;
} {
  const strugglesText = habitsStrugglingWith.join(' ').toLowerCase();
  const improveText = habitsToImprove.join(' ').toLowerCase();

  if (strugglesText.includes('hydration') || strugglesText.includes('water') || improveText.includes('hydration')) {
    return {
      light: 'amber',
      statusLabel: 'Hydration Focus',
      chosenSummary: habitsStrugglingWith[0] || habitsToImprove[0] || 'Hydration',
      guidanceText:
        'Astronauts lose thirst signals in microgravity, so it is easy to get dehydrated without realizing it. Dehydration causes headaches and low energy.',
      quickAction: 'Drink one full pouch of water right now and set a reminder to sip every 2 hours.',
    };
  }

  if (strugglesText.includes('nutrition') || strugglesText.includes('appetite')) {
    return {
      light: 'amber',
      statusLabel: 'Nutrition Reminder',
      chosenSummary: 'Appetite / Nutrition',
      guidanceText:
        'Food tastes milder in space because fluid shifts stuff up your nose. Skipping meals lowers your energy and weakens muscles faster.',
      quickAction: 'Eat small, flavorful high-protein snacks even if you do not feel very hungry.',
    };
  }

  if (strugglesText.includes('sleep') || strugglesText.includes('sack')) {
    return {
      light: 'amber',
      statusLabel: 'Sleep Setup',
      chosenSummary: 'Sleeping comfort',
      guidanceText:
        'Floating inside a sleeping bag can feel strange at first and wake you up at night. Securing your arms comfortably makes a big difference.',
      quickAction: 'Adjust your sleeping sack straps snugly before bed and make sure air vent flow points gently past your face.',
    };
  }

  if (strugglesText.includes('friction') || strugglesText.includes('comm')) {
    return {
      light: 'amber',
      statusLabel: 'Crew Teamwork',
      chosenSummary: 'Crew communication',
      guidanceText:
        'Good communication keeps missions safe. Even a quick 2-minute honest check-in helps prevent stress from building up.',
      quickAction: 'Use calm, clear words at your next meal break to align on today’s chores.',
    };
  }

  return {
    light: 'green',
    statusLabel: 'On Track',
    chosenSummary: habitsToImprove[0] || 'Daily wellness routine',
    guidanceText:
      'Sticking to small daily habits—water, healthy meals, stretching, and rest—protects your bones, muscles, and mood throughout the mission.',
    quickAction: 'Pick just ONE habit from your list to complete before your next break.',
  };
}

export function buildPrewrittenCheckinResponse(
  checkin: DailyCheckin,
  telemetry?: TelemetryState,
  cabin?: CabinEnvironment
): PrewrittenAstronautResponse {
  const sections: PrewrittenResponseSection[] = [];

  // 1. Sleep Section
  const poorSleep = checkin.sleepQuality <= 4 || checkin.sleepHours < 6;
  const moderateSleep = !poorSleep && (checkin.sleepQuality <= 6 || checkin.sleepHours < 7);

  sections.push({
    id: 'sleep',
    title: 'Sleep & Daily Energy',
    light: poorSleep ? 'red' : moderateSleep ? 'amber' : 'green',
    statusLabel: poorSleep ? 'Low Rest' : moderateSleep ? 'Fair Rest' : 'Well Rested',
    chosenSummary: `${checkin.sleepQuality}/10 quality · ${checkin.sleepHours} hours`,
    guidanceText: poorSleep
      ? 'You did not get enough deep rest last night. Low sleep slows down reaction time and makes stress feel heavier.'
      : moderateSleep
      ? 'Your sleep was okay, though a little short for space recovery. You should feel steady for routine tasks, just avoid overworking late.'
      : 'Great rest! Your sleep quality and hours are right on target, giving your brain and body strong energy for today.',
    quickAction: poorSleep
      ? 'Dim cabin lights 45 minutes early tonight, avoid caffeine now, and take a short 20-minute rest if possible.'
      : moderateSleep
      ? 'Aim for an extra 30 minutes in your sleep station tonight and keep your bunk cool.'
      : 'Start your main mission tasks while your focus is sharpest.',
  });

  // 2. Mental State Section
  const primaryMood = checkin.mentalHealth.split(':')[0].trim();
  const moodEntry = MENTAL_RESPONSES[primaryMood] || {
    light: 'green' as ResponseLightColor,
    statusLabel: 'Logged',
    guidanceText:
      'Thank you for sharing how your mind feels today. Checking in honestly helps keep your stress balanced throughout the flight.',
    quickAction: 'Take 5 quiet minutes mid-shift to stretch, breathe deeply, and reset.',
  };

  sections.push({
    id: 'mental',
    title: 'Mental State & Mood',
    light: moodEntry.light,
    statusLabel: moodEntry.statusLabel,
    chosenSummary: primaryMood || 'Focused',
    guidanceText: moodEntry.guidanceText,
    quickAction: moodEntry.quickAction,
  });

  // 3. Body & Pain Section
  if (checkin.hasPain) {
    const painAdvice = buildPainAdvice(checkin.painAreas, checkin.painSeverity);
    sections.push({
      id: 'body',
      title: 'Body & Pain Care',
      light: painAdvice.light,
      statusLabel: painAdvice.statusLabel,
      chosenSummary:
        checkin.painAreas.length > 0
          ? `${checkin.painAreas.join(', ')} (${checkin.painSeverity}/10)`
          : `Pain reported (${checkin.painSeverity}/10)`,
      guidanceText: painAdvice.guidanceText,
      quickAction: painAdvice.quickAction,
    });
  } else {
    sections.push({
      id: 'body',
      title: 'Body & Pain Care',
      light: 'green',
      statusLabel: 'Pain-Free',
      chosenSummary: 'No pain reported today',
      guidanceText:
        'Your body feels free of pain today—that is a great sign that your stretches and workouts are working well.',
      quickAction: 'Stay hydrated and keep up your regular stretching so muscles stay loose.',
    });
  }

  // 4. Habits Section
  const habitAdvice = buildHabitAdvice(
    checkin.habitsToImprove || [],
    checkin.habitsStrugglingWith || []
  );
  sections.push({
    id: 'habits',
    title: 'Daily Habit Tip',
    light: habitAdvice.light,
    statusLabel: habitAdvice.statusLabel,
    chosenSummary: habitAdvice.chosenSummary,
    guidanceText: habitAdvice.guidanceText,
    quickAction: habitAdvice.quickAction,
  });

  // 5. Optional EVA or Cabin Air Reminder
  if (checkin.evaMode) {
    sections.push({
      id: 'eva',
      title: 'Spacewalk (EVA) Readiness',
      light: 'amber',
      statusLabel: 'EVA Check On',
      chosenSummary: 'Pre/Post-EVA spacewalk mode enabled',
      guidanceText:
        'Spacewalks put extra pressure on your joints, shoulders, and lungs because spacesuit air pressure is lower than cabin pressure.',
      quickAction: 'Complete your pure oxygen pre-breathe countdown and tell your buddy right away if any joint starts aching.',
    });
  } else if ((cabin && cabin.ambientCO2 > 4.0) || (telemetry && telemetry.radiationDoseRate > 25)) {
    sections.push({
      id: 'eva',
      title: 'Cabin Sensor Reminder',
      light: 'red',
      statusLabel: 'Sensor Elevated',
      chosenSummary:
        cabin && cabin.ambientCO2 > 4.0
          ? `Simulated Cabin CO2 elevated`
          : `Simulated Radiation elevated`,
      guidanceText:
        cabin && cabin.ambientCO2 > 4.0
          ? 'Simulated cabin carbon dioxide is higher than normal, which can cause headaches or tired thinking.'
          : 'Simulated radiation sensors show higher space weather activity outside the hull.',
      quickAction: 'Check the Safety & Emergency tab for the simple step-by-step checklist.',
    });
  }

  const hasRed = sections.some((s) => s.light === 'red');
  const hasAmber = sections.some((s) => s.light === 'amber');
  const overallStatus: PrewrittenAstronautResponse['overallStatus'] = hasRed
    ? 'ATTENTION'
    : hasAmber
    ? 'CAUTION'
    : 'GOOD';

  const headline =
    overallStatus === 'GOOD'
      ? 'You Are All Clear & Ready for Today'
      : overallStatus === 'CAUTION'
      ? 'Check-In Saved — A Few Simple Care Tips for Today'
      : 'Check-In Saved — Please Follow These Care Steps Now';

  const summaryText =
    overallStatus === 'GOOD'
      ? 'Based on your answers, your sleep, mood, and body look healthy. Keep following your normal routine.'
      : overallStatus === 'CAUTION'
      ? 'Based on what you picked, we put together easy, plain-English steps below to help you feel your best.'
      : 'Some of your answers show you need extra rest or care today. Follow the highlighted red steps first.';

  return {
    overallStatus,
    headline,
    summaryText,
    sections,
  };
}
