// Strength standards as bodyweight multipliers (male, general population)
// Source: Symmetric Strength / Strength Level averages
// Tiers: novice | intermediate | advanced | elite
// Bodyweight exercises use rep-based thresholds instead of weight multipliers

export type StrengthTier = 'novice' | 'intermediate' | 'advanced' | 'elite';

interface WeightStandard {
  type: 'weight';
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

interface RepStandard {
  type: 'reps';
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

type Standard = WeightStandard | RepStandard;

// Multipliers are for 1-rep-max equivalent (or best set weight)
const STANDARDS: Record<string, Standard> = {
  'Bench Press':            { type: 'weight', novice: 0.75, intermediate: 1.25, advanced: 1.5,  elite: 1.75 },
  'Incline Bench Press':    { type: 'weight', novice: 0.6,  intermediate: 1.0,  advanced: 1.25, elite: 1.5  },
  'Squat':                  { type: 'weight', novice: 1.0,  intermediate: 1.5,  advanced: 2.0,  elite: 2.5  },
  'Deadlift':               { type: 'weight', novice: 1.25, intermediate: 1.75, advanced: 2.25, elite: 2.75 },
  'Romanian Deadlift':      { type: 'weight', novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.0  },
  'Barbell Row':            { type: 'weight', novice: 0.6,  intermediate: 1.0,  advanced: 1.4,  elite: 1.75 },
  'Lat Pulldown':           { type: 'weight', novice: 0.5,  intermediate: 0.8,  advanced: 1.1,  elite: 1.4  },
  'Cable Row':              { type: 'weight', novice: 0.5,  intermediate: 0.8,  advanced: 1.1,  elite: 1.4  },
  'Seated Shoulder Press':  { type: 'weight', novice: 0.4,  intermediate: 0.7,  advanced: 1.0,  elite: 1.3  },
  'Lateral Raise':          { type: 'weight', novice: 0.1,  intermediate: 0.2,  advanced: 0.3,  elite: 0.4  },
  'Face Pull':              { type: 'weight', novice: 0.2,  intermediate: 0.35, advanced: 0.5,  elite: 0.65 },
  'Bicep Curl':             { type: 'weight', novice: 0.2,  intermediate: 0.35, advanced: 0.5,  elite: 0.65 },
  'Dumbbell Hammer Curl':   { type: 'weight', novice: 0.15, intermediate: 0.3,  advanced: 0.45, elite: 0.6  },
  'Tricep Pushdown':        { type: 'weight', novice: 0.2,  intermediate: 0.35, advanced: 0.5,  elite: 0.65 },
  'Tricep Rope Pushdown':   { type: 'weight', novice: 0.15, intermediate: 0.3,  advanced: 0.45, elite: 0.6  },
  'Leg Press':              { type: 'weight', novice: 1.5,  intermediate: 2.25, advanced: 3.0,  elite: 3.75 },
  'Calf Raise':             { type: 'weight', novice: 0.75, intermediate: 1.25, advanced: 1.75, elite: 2.25 },
  // Bodyweight: thresholds are max reps in a single set
  'Pull Ups':               { type: 'reps', novice: 1,  intermediate: 5,  advanced: 12, elite: 20 },
  'Wide Grip Pull Ups':     { type: 'reps', novice: 1,  intermediate: 5,  advanced: 12, elite: 20 },
  'Push Ups':               { type: 'reps', novice: 5,  intermediate: 15, advanced: 30, elite: 50 },
};

export interface StrengthResult {
  tier: StrengthTier | null; // null if no standard or no profile weight
  standards: {
    novice: number;
    intermediate: number;
    advanced: number;
    elite: number;
    unit: 'kg' | 'reps';
  } | null;
}

export function getStrengthTier(
  exerciseName: string,
  bodyweightKg: number | undefined,
  bestValue: number, // best weight lifted OR best reps (for bodyweight)
): StrengthResult {
  const standard = STANDARDS[exerciseName];
  if (!standard) return { tier: null, standards: null };

  if (standard.type === 'reps') {
    const s = standard as RepStandard;
    const standards = { novice: s.novice, intermediate: s.intermediate, advanced: s.advanced, elite: s.elite, unit: 'reps' as const };
    if (bestValue === 0) return { tier: null, standards };
    const tier = bestValue >= s.elite ? 'elite'
      : bestValue >= s.advanced ? 'advanced'
      : bestValue >= s.intermediate ? 'intermediate'
      : 'novice';
    return { tier, standards };
  }

  // Weight-based
  if (!bodyweightKg) return { tier: null, standards: null };
  const s = standard as WeightStandard;
  const standards = {
    novice: Math.round(s.novice * bodyweightKg),
    intermediate: Math.round(s.intermediate * bodyweightKg),
    advanced: Math.round(s.advanced * bodyweightKg),
    elite: Math.round(s.elite * bodyweightKg),
    unit: 'kg' as const,
  };
  if (bestValue === 0) return { tier: null, standards };
  const tier = bestValue >= standards.elite ? 'elite'
    : bestValue >= standards.advanced ? 'advanced'
    : bestValue >= standards.intermediate ? 'intermediate'
    : 'novice';
  return { tier, standards };
}
