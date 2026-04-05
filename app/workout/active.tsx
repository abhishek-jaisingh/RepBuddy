import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { saveWorkout, getRoutines, getExercises, getWorkouts, getProfile } from '@/utils/storage';
import { Workout, ExerciseLog, WorkoutSet, Exercise } from '@/types';
import { generateId, totalVolume } from '@/utils/helpers';
import { getFormTip, FormTip } from '@/utils/formTips';
import FormTipsModal from '@/components/FormTipsModal';
import { getStrengthTier, StrengthTier } from '@/utils/strengthStandards';
import Colors from '@/constants/Colors';

function playBeepOn(ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Cancel' }, { text: 'OK', onPress: onConfirm }]);
  }
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [lastSetsMap, setLastSetsMap] = useState<Record<string, WorkoutSet[]>>({});
  const [bestMap, setBestMap] = useState<Record<string, number>>({}); // exerciseId -> best weight or best reps
  const [activeIdx, setActiveIdx] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Raw string buffers for weight inputs so "12." doesn't get normalized while typing
  const [weightRaw, setWeightRaw] = useState<Record<string, string>>({});
  const [showFormTips, setShowFormTips] = useState(true);
  const [tipsModalVisible, setTipsModalVisible] = useState(false);
  const [profileWeight, setProfileWeight] = useState<number | undefined>(undefined);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    loadInitial();
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  useEffect(() => {
    if (restSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRestSeconds((p) => {
          if (p <= 1) {
            clearInterval(timerRef.current!);
            if (Platform.OS === 'web' && audioCtxRef.current) playBeepOn(audioCtxRef.current);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restSeconds > 0]);

  function formatElapsed(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function loadInitial() {
    const [exercises, workouts, profile] = await Promise.all([getExercises(), getWorkouts(), getProfile()]);
    setAllExercises(exercises);
    setShowFormTips(profile.showFormTips !== false);
    setProfileWeight(profile.weight);

    // Build maps of exerciseId -> last used weight, last sets, and all-time best
    const lastWeightMap: Record<string, number> = {};
    const lastSets: Record<string, WorkoutSet[]> = {};
    const best: Record<string, number> = {};
    const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if (!(ex.exerciseId in lastWeightMap)) {
          const lastSet = ex.sets[ex.sets.length - 1];
          if (lastSet && lastSet.weight > 0) lastWeightMap[ex.exerciseId] = lastSet.weight;
        }
        if (!(ex.exerciseId in lastSets) && ex.sets.length > 0) {
          lastSets[ex.exerciseId] = ex.sets;
        }
        // Best weight or best reps (for bodyweight)
        for (const set of ex.sets) {
          const val = ex.bodyweight ? set.reps : set.weight;
          if (val > (best[ex.exerciseId] ?? 0)) best[ex.exerciseId] = val;
        }
      }
    }
    setLastSetsMap(lastSets);
    setBestMap(best);

    const exerciseLogs: ExerciseLog[] = [];
    if (routineId) {
      const routines = await getRoutines();
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        for (const exId of routine.exerciseIds) {
          const ex = exercises.find((e) => e.id === exId);
          if (ex) {
            const lastWeight = lastWeightMap[ex.id];
            const sets: WorkoutSet[] = lastWeight != null ? [{ weight: lastWeight, reps: 0 }] : [];
            exerciseLogs.push({ id: generateId(), exerciseId: ex.id, name: ex.name, sets, bodyweight: ex.bodyweight });
          }
        }
      }
    }
    setWorkout({ id: generateId(), date: new Date().toISOString(), exercises: exerciseLogs });
  }

  function addExercise(ex: Exercise) {
    if (!workout) return;
    const newLog: ExerciseLog = { id: generateId(), exerciseId: ex.id, name: ex.name, sets: [], bodyweight: ex.bodyweight };
    const updated = { ...workout, exercises: [...workout.exercises, newLog] };
    setWorkout(updated);
    setActiveIdx(updated.exercises.length - 1);
    setShowExercisePicker(false);
  }

  function addSet() {
    if (!workout) return;
    const exs = [...workout.exercises];
    const current = exs[activeIdx];
    const lastSet = current.sets[current.sets.length - 1];
    const newSet: WorkoutSet = lastSet
      ? { weight: current.bodyweight ? 0 : lastSet.weight, reps: lastSet.reps }
      : { weight: 0, reps: 0 };
    exs[activeIdx] = { ...current, sets: [...current.sets, newSet] };
    setWorkout({ ...workout, exercises: exs });
  }

  function updateSet(setIdx: number, field: 'weight' | 'reps', value: string) {
    if (!workout) return;
    if (field === 'weight') {
      const key = `${activeIdx}-${setIdx}`;
      setWeightRaw((prev) => ({ ...prev, [key]: value }));
    }
    const num = value === '' ? 0 : (parseFloat(value) || 0);
    const exs = [...workout.exercises];
    const sets = [...exs[activeIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: num };
    exs[activeIdx] = { ...exs[activeIdx], sets };
    setWorkout({ ...workout, exercises: exs });
  }

  function removeSet(setIdx: number) {
    if (!workout) return;
    const key = `${activeIdx}-${setIdx}`;
    setWeightRaw((prev) => { const next = { ...prev }; delete next[key]; return next; });
    const exs = [...workout.exercises];
    exs[activeIdx] = { ...exs[activeIdx], sets: exs[activeIdx].sets.filter((_, i) => i !== setIdx) };
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
      if (Platform.OS === 'web') { window.alert('Add at least one exercise with sets.'); } else { Alert.alert('Empty Workout', 'Add at least one exercise with sets.'); }
      return;
    }
    const hasEmptySets = workout.exercises.some((ex) => ex.sets.length === 0);
    const doSave = async () => {
      const final: Workout = { ...workout, durationMs: Date.now() - startTimeRef.current };
      await saveWorkout(final);
      router.back();
    };
    if (hasEmptySets) {
      confirm('Some exercises have no sets', 'Save anyway?', doSave);
    } else {
      await doSave();
    }
  }

  function handleDiscard() {
    confirm('Discard Workout', 'All progress will be lost.', () => router.back());
  }

  if (!workout) return <View style={s.container}><Text style={s.loading}>Loading...</Text></View>;

  const currentEx = workout.exercises[activeIdx];
  const exVolume = currentEx
    ? currentEx.sets.reduce((sum, set) => sum + totalVolume(set.weight, set.reps), 0)
    : 0;
  const exTotalReps = currentEx
    ? currentEx.sets.reduce((sum, set) => sum + set.reps, 0)
    : 0;

  const strengthResult = currentEx
    ? getStrengthTier(currentEx.name, profileWeight, bestMap[currentEx.exerciseId] ?? 0)
    : null;

  // Exercise picker overlay
  if (showExercisePicker) {
    return (
      <View style={s.container}>
        <View style={s.pickerHeader}>
          <Text style={s.pickerTitle}>Add Exercise</Text>
          <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
            <FontAwesome name="times" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.pickerContent}>
          {allExercises.length === 0 && (
            <Text style={s.empty}>No exercises created yet. Go to the Library tab first.</Text>
          )}
          {allExercises.map((ex) => (
            <TouchableOpacity key={ex.id} style={s.pickerItem} onPress={() => addExercise(ex)}>
              <View style={s.pickerIcon}>
                <FontAwesome name="trophy" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.pickerItemText}>{ex.name}</Text>
                {ex.muscleGroup && <Text style={s.pickerItemMeta}>{ex.muscleGroup}</Text>}
              </View>
              <FontAwesome name="plus-circle" size={20} color={Colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header Bar */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleDiscard} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="times" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Workout</Text>
          <View style={s.timerChip}>
            <FontAwesome name="clock-o" size={11} color={Colors.primary} />
            <Text style={s.timerChipText}>{formatElapsed(elapsed)}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.finishBtn} onPress={handleFinish}>
          <Text style={s.finishText}>FINISH</Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Banner */}
      {restSeconds > 0 && (
        <View style={s.timerBanner}>
          <FontAwesome name="hourglass-half" size={14} color={Colors.bg} />
          <Text style={s.timerBannerText}>Rest: {restSeconds}s</Text>
          <TouchableOpacity onPress={() => setRestSeconds(0)}>
            <Text style={s.timerSkip}>SKIP</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise Tabs */}
      {workout.exercises.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsInner}>
          {workout.exercises.map((ex, idx) => (
            <TouchableOpacity key={ex.id} style={[s.tab, activeIdx === idx && s.tabActive]}
              onPress={() => setActiveIdx(idx)}>
              <Text style={[s.tabText, activeIdx === idx && s.tabTextActive]}
                numberOfLines={1}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main Content */}
      <ScrollView style={s.main} contentContainerStyle={s.mainContent}>
        {currentEx ? (
          <>
            <View style={s.exHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.exName}>{currentEx.name}</Text>
                {!currentEx.bodyweight && exVolume > 0 && (
                  <Text style={s.exVolume}>Volume: {exVolume.toLocaleString()} kg</Text>
                )}
                {exTotalReps > 0 && (
                  <Text style={s.exVolume}>Total Reps: {exTotalReps}</Text>
                )}
              </View>
              <View style={s.exActions}>
                {showFormTips && getFormTip(currentEx.name) && (
                  <TouchableOpacity style={s.infoBtn} onPress={() => setTipsModalVisible(true)}>
                    <FontAwesome name="info-circle" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.removeExBtn} onPress={() => removeExercise(activeIdx)}>
                  <FontAwesome name="trash-o" size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Strength Standard */}
            {strengthResult?.standards && (
              <View style={s.strengthCard}>
                <View style={s.strengthRow}>
                  {(['novice', 'intermediate', 'advanced', 'elite'] as StrengthTier[]).map((tier) => {
                    const isActive = strengthResult.tier === tier;
                    const isPast = strengthResult.tier !== null && (
                      ['novice','intermediate','advanced','elite'].indexOf(strengthResult.tier) >=
                      ['novice','intermediate','advanced','elite'].indexOf(tier)
                    );
                    return (
                      <View key={tier} style={s.strengthTierCol}>
                        <View style={[s.strengthDot, isPast && s.strengthDotFilled, isActive && s.strengthDotActive]} />
                        <Text style={[s.strengthTierLabel, isActive && s.strengthTierLabelActive]}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Text>
                        <Text style={s.strengthTierVal}>
                          {strengthResult.standards[tier as keyof typeof strengthResult.standards]}{strengthResult.standards.unit === 'reps' ? 'r' : 'kg'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Last Workout Reference */}
            {lastSetsMap[currentEx.exerciseId]?.length > 0 && (
              <View style={s.lastWorkoutCard}>
                <View style={s.lastWorkoutHeader}>
                  <Text style={s.lastWorkoutLabel}>LAST TIME</Text>
                  {currentEx.bodyweight ? (
                    <Text style={s.lastWorkoutSummary}>
                      {lastSetsMap[currentEx.exerciseId].reduce((sum, set) => sum + set.reps, 0)} reps
                    </Text>
                  ) : (
                    <Text style={s.lastWorkoutSummary}>
                      {lastSetsMap[currentEx.exerciseId].reduce((sum, set) => sum + totalVolume(set.weight, set.reps), 0).toLocaleString()} kg
                    </Text>
                  )}
                </View>
                <Text style={s.lastWorkoutSets}>
                  {lastSetsMap[currentEx.exerciseId].map((set, i) =>
                    currentEx.bodyweight
                      ? `${i + 1}: ${set.reps} reps`
                      : `${i + 1}: ${set.weight}kg × ${set.reps}`
                  ).join('   ')}
                </Text>
              </View>
            )}

            {/* Set Table */}
            {currentEx.sets.length > 0 && (
              <View style={s.setTableHeader}>
                <Text style={[s.setHeaderCell, { width: 36 }]}>SET</Text>
                {!currentEx.bodyweight && <Text style={[s.setHeaderCell, { flex: 1 }]}>KG</Text>}
                <Text style={[s.setHeaderCell, { flex: 1 }]}>REPS</Text>
                <View style={{ width: 36 }} />
              </View>
            )}

            {currentEx.sets.map((set, idx) => (
              <View key={idx} style={s.setRow}>
                <View style={s.setNumBadge}>
                  <Text style={s.setNum}>{idx + 1}</Text>
                </View>
                {!currentEx.bodyweight && (
                  <TextInput style={s.setInput} keyboardType="decimal-pad"
                    value={weightRaw[`${activeIdx}-${idx}`] ?? (set.weight ? String(set.weight) : '')}
                    onChangeText={(v) => updateSet(idx, 'weight', v)}
                    placeholder="0" placeholderTextColor={Colors.textMuted} selectTextOnFocus />
                )}
                <TextInput style={s.setInput} keyboardType="number-pad"
                  value={set.reps ? String(set.reps) : ''} onChangeText={(v) => updateSet(idx, 'reps', v)}
                  placeholder="0" placeholderTextColor={Colors.textMuted} selectTextOnFocus />
                <TouchableOpacity style={s.removeSetBtn} onPress={() => removeSet(idx)}>
                  <FontAwesome name="times" size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={s.addSetBtn} onPress={addSet}>
              <FontAwesome name="plus" size={12} color={Colors.primary} />
              <Text style={s.addSetText}>Add Set</Text>
            </TouchableOpacity>

            {/* Rest Timer Buttons */}
            <Text style={s.restLabel}>REST TIMER</Text>
            <View style={s.timerButtons}>
              {[30, 60, 90].map((sec) => (
                <TouchableOpacity key={sec} style={s.timerBtn} onPress={() => {
                  if (Platform.OS === 'web') {
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
                    else if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
                  }
                  setRestSeconds(sec);
                }}>
                  <FontAwesome name="clock-o" size={12} color={Colors.primary} />
                  <Text style={s.timerBtnText}>{sec}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={s.emptyState}>
            <FontAwesome name="plus-circle" size={32} color={Colors.textMuted} />
            <Text style={s.empty}>No exercises added yet.</Text>
            <Text style={s.emptyHint}>Tap the button below to add exercises.</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.addExBtn} onPress={() => setShowExercisePicker(true)}>
          <FontAwesome name="plus" size={14} color={Colors.bg} />
          <Text style={s.addExText}>ADD EXERCISE</Text>
        </TouchableOpacity>
      </View>

      {/* Form Tips Modal */}
      {currentEx && getFormTip(currentEx.name) && (
        <FormTipsModal
          visible={tipsModalVisible}
          exerciseName={currentEx.name}
          tip={getFormTip(currentEx.name)!}
          onClose={() => setTipsModalVisible(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 100, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryDim, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  timerChipText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  finishBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  finishText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: Colors.bg },

  // Timer banner
  timerBanner: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 10,
  },
  timerBannerText: { color: Colors.bg, fontSize: 16, fontWeight: '800' },
  timerSkip: { color: Colors.bg, fontSize: 12, fontWeight: '700', opacity: 0.7 },

  // Tabs
  tabs: { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  tabsInner: { paddingHorizontal: 12 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.text },

  // Main
  main: { flex: 1 },
  mainContent: { padding: 20, paddingBottom: 40 },

  exHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20,
  },
  exName: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  exVolume: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 4 },
  exActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  infoBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  removeExBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Strength standard
  strengthCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  strengthRow: { flexDirection: 'row', justifyContent: 'space-between' },
  strengthTierCol: { alignItems: 'center', flex: 1, gap: 4 },
  strengthDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  strengthDotFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  strengthDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  strengthTierLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: Colors.textMuted },
  strengthTierLabelActive: { color: Colors.primary },
  strengthTierVal: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  // Last workout reference
  lastWorkoutCard: {
    backgroundColor: Colors.primaryDim,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  lastWorkoutHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  lastWorkoutLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.primary,
  },
  lastWorkoutSummary: {
    fontSize: 12, fontWeight: '700', color: Colors.primary,
  },
  lastWorkoutSets: {
    fontSize: 13, fontWeight: '600', color: Colors.text,
  },

  // Set table
  setTableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  setHeaderCell: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.textMuted },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, overflow: 'hidden',
  },
  setNumBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.cardHighlight,
    alignItems: 'center', justifyContent: 'center',
  },
  setNum: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  setInput: {
    flex: 1, minWidth: 0, backgroundColor: Colors.inputBg, color: Colors.text,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderColor: Colors.inputBorder, borderWidth: 1,
    fontSize: 16, textAlign: 'center', fontWeight: '700',
  },
  removeSetBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },

  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.primaryBorder, borderStyle: 'dashed', marginTop: 4, marginBottom: 20,
  },
  addSetText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  // Rest timer
  restLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: Colors.textSecondary, marginBottom: 8 },
  timerButtons: { flexDirection: 'row', gap: 10 },
  timerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.card, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  timerBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 60, gap: 8 },
  empty: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 12 },

  // Footer
  footer: {
    padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12,
  },
  addExText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: Colors.bg },

  // Exercise Picker
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  pickerTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  pickerContent: { padding: 20, gap: 10 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  pickerIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerItemText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  pickerItemMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
});
