import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { saveWorkout, getRoutines, getExercises } from '@/utils/storage';
import { Workout, ExerciseLog, WorkoutSet, Exercise } from '@/types';
import { generateId, totalVolume } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    loadInitial();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (restSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRestSeconds((p) => {
          if (p <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restSeconds > 0]);

  async function loadInitial() {
    const exercises = await getExercises();
    setAllExercises(exercises);

    const exerciseLogs: ExerciseLog[] = [];

    if (routineId) {
      const routines = await getRoutines();
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        for (const exId of routine.exerciseIds) {
          const ex = exercises.find((e) => e.id === exId);
          if (ex) {
            exerciseLogs.push({
              id: generateId(),
              exerciseId: ex.id,
              name: ex.name,
              sets: [],
            });
          }
        }
      }
    }

    setWorkout({
      id: generateId(),
      date: new Date().toISOString(),
      exercises: exerciseLogs,
    });
  }

  function addExercise(ex: Exercise) {
    if (!workout) return;
    const newLog: ExerciseLog = {
      id: generateId(),
      exerciseId: ex.id,
      name: ex.name,
      sets: [],
    };
    const updated = { ...workout, exercises: [...workout.exercises, newLog] };
    setWorkout(updated);
    setActiveIdx(updated.exercises.length - 1);
    setShowExercisePicker(false);
  }

  function addSet() {
    if (!workout) return;
    const exs = [...workout.exercises];
    const current = exs[activeIdx];
    // Pre-fill from last set if available
    const lastSet = current.sets[current.sets.length - 1];
    const newSet: WorkoutSet = lastSet
      ? { weight: lastSet.weight, reps: lastSet.reps }
      : { weight: 0, reps: 0 };
    exs[activeIdx] = { ...current, sets: [...current.sets, newSet] };
    setWorkout({ ...workout, exercises: exs });
  }

  function updateSet(setIdx: number, field: 'weight' | 'reps', value: string) {
    if (!workout) return;
    const num = parseFloat(value) || 0;
    const exs = [...workout.exercises];
    const sets = [...exs[activeIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: num };
    exs[activeIdx] = { ...exs[activeIdx], sets };
    setWorkout({ ...workout, exercises: exs });
  }

  function removeSet(setIdx: number) {
    if (!workout) return;
    const exs = [...workout.exercises];
    exs[activeIdx] = {
      ...exs[activeIdx],
      sets: exs[activeIdx].sets.filter((_, i) => i !== setIdx),
    };
    setWorkout({ ...workout, exercises: exs });
  }

  function removeExercise(idx: number) {
    if (!workout) return;
    const exs = workout.exercises.filter((_, i) => i !== idx);
    setWorkout({ ...workout, exercises: exs });
    if (activeIdx >= exs.length) setActiveIdx(Math.max(0, exs.length - 1));
  }

  async function handleFinish() {
    if (!workout || workout.exercises.length === 0) {
      Alert.alert('Empty Workout', 'Add at least one exercise with sets.');
      return;
    }

    const hasEmptySets = workout.exercises.some((ex) => ex.sets.length === 0);
    const doSave = async () => {
      const final: Workout = {
        ...workout,
        durationMs: Date.now() - startTimeRef.current,
      };
      await saveWorkout(final);
      router.back();
    };

    if (hasEmptySets) {
      Alert.alert('Some exercises have no sets', 'Save anyway?', [
        { text: 'Cancel' },
        { text: 'Save', onPress: doSave },
      ]);
    } else {
      await doSave();
    }
  }

  function handleDiscard() {
    Alert.alert('Discard Workout', 'All progress will be lost.', [
      { text: 'Cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!workout) return <Text style={s.loading}>Loading...</Text>;

  const currentEx = workout.exercises[activeIdx];
  const exVolume = currentEx
    ? currentEx.sets.reduce((sum, set) => sum + totalVolume(set.weight, set.reps), 0)
    : 0;

  // Exercise picker overlay
  if (showExercisePicker) {
    return (
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.pickerContent}>
          <Text style={s.pickerTitle}>Add Exercise</Text>
          {allExercises.length === 0 && (
            <Text style={s.empty}>No exercises created yet. Go to the Exercises tab first.</Text>
          )}
          {allExercises.map((ex) => (
            <TouchableOpacity key={ex.id} style={s.pickerItem} onPress={() => addExercise(ex)}>
              <Text style={s.pickerItemText}>{ex.name}</Text>
              {ex.muscleGroup && <Text style={s.pickerItemMeta}>{ex.muscleGroup}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={s.pickerCancel} onPress={() => setShowExercisePicker(false)}>
          <Text style={s.pickerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Rest Timer Banner */}
      {restSeconds > 0 && (
        <View style={s.timerBanner}>
          <Text style={s.timerText}>Rest: {restSeconds}s</Text>
          <TouchableOpacity onPress={() => setRestSeconds(0)}>
            <Text style={s.timerSkip}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
        {workout.exercises.map((ex, idx) => (
          <TouchableOpacity
            key={ex.id}
            style={[s.tab, activeIdx === idx && s.tabActive]}
            onPress={() => setActiveIdx(idx)}
          >
            <Text style={[s.tabText, activeIdx === idx && s.tabTextActive]}>{ex.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Content */}
      <ScrollView style={s.main} contentContainerStyle={s.mainContent}>
        {currentEx ? (
          <>
            <View style={s.exHeader}>
              <View>
                <Text style={s.exName}>{currentEx.name}</Text>
                {exVolume > 0 && (
                  <Text style={s.exVolume}>Volume: {exVolume.toLocaleString()} lbs</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => removeExercise(activeIdx)}>
                <Text style={s.removeExText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Set Headers */}
            {currentEx.sets.length > 0 && (
              <View style={s.setHeader}>
                <Text style={[s.setHeaderText, { width: 40 }]}>Set</Text>
                <Text style={[s.setHeaderText, { flex: 1 }]}>Weight (lbs)</Text>
                <Text style={[s.setHeaderText, { flex: 1 }]}>Reps</Text>
                <View style={{ width: 36 }} />
              </View>
            )}

            {/* Sets */}
            {currentEx.sets.map((set, idx) => (
              <View key={idx} style={s.setRow}>
                <Text style={s.setNum}>{idx + 1}</Text>
                <TextInput
                  style={s.setInput}
                  keyboardType="decimal-pad"
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(v) => updateSet(idx, 'weight', v)}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  selectTextOnFocus
                />
                <TextInput
                  style={s.setInput}
                  keyboardType="number-pad"
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(v) => updateSet(idx, 'reps', v)}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  selectTextOnFocus
                />
                <TouchableOpacity style={s.removeSetBtn} onPress={() => removeSet(idx)}>
                  <Text style={s.removeSetText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={s.addSetBtn} onPress={addSet}>
              <Text style={s.addSetText}>+ Add Set</Text>
            </TouchableOpacity>

            {/* Rest Timer Button */}
            <View style={s.timerButtons}>
              {[60, 90, 120].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={s.timerBtn}
                  onPress={() => setRestSeconds(sec)}
                >
                  <Text style={s.timerBtnText}>Rest {sec}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={s.empty}>No exercises added yet. Tap "+ Exercise" below.</Text>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.addExBtn} onPress={() => setShowExercisePicker(true)}>
          <Text style={s.addExText}>+ Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.discardBtn} onPress={handleDiscard}>
          <Text style={s.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 40 },

  // Timer banner
  timerBanner: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  timerSkip: { color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.8 },

  // Tabs
  tabs: { backgroundColor: Colors.card, maxHeight: 44 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.accent },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.text },

  // Main
  main: { flex: 1 },
  mainContent: { padding: 16 },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exName: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  exVolume: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  removeExText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },

  // Set headers
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  setHeaderText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },

  // Sets
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNum: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', width: 32, textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    color: Colors.text,
    padding: 10,
    borderRadius: 6,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  removeSetBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  removeSetText: { color: Colors.danger, fontSize: 16 },

  addSetBtn: {
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  addSetText: { color: Colors.blue, fontSize: 14, fontWeight: '600' },

  // Timer buttons
  timerButtons: { flexDirection: 'row', gap: 8, marginTop: 20 },
  timerBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timerBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },

  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.card,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
  },
  addExBtn: {
    flex: 2,
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addExText: { color: Colors.blue, fontWeight: '700', fontSize: 14 },
  discardBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  discardText: { color: Colors.danger, fontWeight: '600', fontSize: 13 },
  finishBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  finishText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Exercise Picker
  pickerContent: { padding: 16 },
  pickerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  pickerItem: {
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerItemText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  pickerItemMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  pickerCancel: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  pickerCancelText: { color: Colors.textSecondary, fontWeight: '600' },
});
