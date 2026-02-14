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
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
}
