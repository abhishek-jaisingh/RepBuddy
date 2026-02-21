export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  bodyweight?: boolean;
}

export interface Workout {
  id: string;
  date: string;
  exercises: ExerciseLog[];
  durationMs?: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  notes?: string;
  bodyweight?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface UserProfile {
  age?: number;
  weight?: number;
  heightFt?: number;
  heightIn?: number;
}
