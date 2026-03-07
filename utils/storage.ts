import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, Routine, Exercise, UserProfile } from '@/types';
import { generateId } from '@/utils/helpers';

const KEYS = {
  workouts: 'repbuddy_workouts',
  routines: 'repbuddy_routines',
  exercises: 'repbuddy_exercises',
  profile: 'repbuddy_profile',
} as const;

async function getJSON<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function setJSON<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// --- Exercises ---
export async function getExercises(): Promise<Exercise[]> {
  return getJSON<Exercise>(KEYS.exercises);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const list = await getExercises();
  const idx = list.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) list[idx] = exercise;
  else list.push(exercise);
  await setJSON(KEYS.exercises, list);
}

export async function deleteExercise(id: string): Promise<void> {
  const list = await getExercises();
  await setJSON(KEYS.exercises, list.filter((e) => e.id !== id));
}

// --- Workouts ---
export async function getWorkouts(): Promise<Workout[]> {
  return getJSON<Workout>(KEYS.workouts);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const list = await getWorkouts();
  const idx = list.findIndex((w) => w.id === workout.id);
  if (idx >= 0) list[idx] = workout;
  else list.push(workout);
  await setJSON(KEYS.workouts, list);
}

export async function deleteWorkout(id: string): Promise<void> {
  const list = await getWorkouts();
  await setJSON(KEYS.workouts, list.filter((w) => w.id !== id));
}

// --- Routines ---
export async function getRoutines(): Promise<Routine[]> {
  return getJSON<Routine>(KEYS.routines);
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const list = await getRoutines();
  const idx = list.findIndex((r) => r.id === routine.id);
  if (idx >= 0) list[idx] = routine;
  else list.push(routine);
  await setJSON(KEYS.routines, list);
}

export async function deleteRoutine(id: string): Promise<void> {
  const list = await getRoutines();
  await setJSON(KEYS.routines, list.filter((r) => r.id !== id));
}

// --- User Profile ---
export async function getProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  return raw ? JSON.parse(raw) : {};
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// --- Seed Data ---
const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Pull Ups', muscleGroup: 'Back', bodyweight: true },
  { name: 'Push Ups', muscleGroup: 'Chest', bodyweight: true },
  { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Deadlift', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable' },
  { name: 'Cable Row', muscleGroup: 'Back', equipment: 'Cable' },
  { name: 'Seated Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Machine' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Face Pull', muscleGroup: 'Shoulders', equipment: 'Cable' },
  { name: 'Bicep Curl', muscleGroup: 'Arms', equipment: 'Dumbbells' },
  { name: 'Dumbbell Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbells' },
  { name: 'Tricep Pushdown', muscleGroup: 'Arms', equipment: 'Cable' },
  { name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', equipment: 'Cable' },
  { name: 'Calf Raise', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Wide Grip Pull Ups', muscleGroup: 'Back', bodyweight: true },
];

export async function seedExercisesIfEmpty(): Promise<void> {
  const existing = await getExercises();
  if (existing.length > 0) return;
  const seeded: Exercise[] = DEFAULT_EXERCISES.map((e) => ({ ...e, id: generateId() }));
  await setJSON(KEYS.exercises, seeded);
}

export async function seedRoutines(): Promise<{ added: number }> {
  const exercises = await getExercises();
  const byName = Object.fromEntries(exercises.map((e) => [e.name, e.id]));

  const DEFAULT_ROUTINES: Omit<Routine, 'id'>[] = [
    {
      name: 'Push',
      type: 'gym',
      exerciseIds: [
        'Bench Press', 'Seated Shoulder Press', 'Lateral Raise', 'Tricep Rope Pushdown',
      ].map((n) => byName[n]).filter(Boolean),
    },
    {
      name: 'Pull - Home',
      type: 'home',
      exerciseIds: ['Pull Ups'].map((n) => byName[n]).filter(Boolean),
    },
    {
      name: 'Legs & Core',
      type: 'gym',
      exerciseIds: [
        'Romanian Deadlift', 'Calf Raise',
      ].map((n) => byName[n]).filter(Boolean),
    },
    {
      name: 'Push - Home',
      type: 'home',
      exerciseIds: ['Push Ups'].map((n) => byName[n]).filter(Boolean),
    },
    {
      name: 'Pull',
      type: 'gym',
      exerciseIds: [
        'Wide Grip Pull Ups', 'Barbell Row', 'Dumbbell Hammer Curl',
      ].map((n) => byName[n]).filter(Boolean),
    },
  ];

  const existing = await getRoutines();
  const existingNames = new Set(existing.map((r) => r.name));
  const toAdd = DEFAULT_ROUTINES.filter((r) => !existingNames.has(r.name) && r.exerciseIds.length > 0);
  for (const r of toAdd) await saveRoutine({ ...r, id: generateId() });
  return { added: toAdd.length };
}
