import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, Routine, Exercise } from '@/types';

const KEYS = {
  workouts: 'repbuddy_workouts',
  routines: 'repbuddy_routines',
  exercises: 'repbuddy_exercises',
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
