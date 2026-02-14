import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { getRoutines, getWorkouts } from '@/utils/storage';
import { Routine, Workout } from '@/types';
import { formatDate, totalVolume } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const workouts = await getWorkouts();
        setLastWorkout(workouts.length > 0 ? workouts[workouts.length - 1] : null);
        setRoutines(await getRoutines());
      })();
    }, [])
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity
        style={s.startBtn}
        onPress={() => router.push('/workout/active')}
      >
        <Text style={s.startBtnText}>Start Empty Workout</Text>
      </TouchableOpacity>

      {routines.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Start from Routine</Text>
          {routines.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.routineCard}
              onPress={() => router.push(`/workout/active?routineId=${r.id}`)}
            >
              <Text style={s.routineName}>{r.name}</Text>
              <Text style={s.routineMeta}>{r.exerciseIds.length} exercises</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {lastWorkout && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Last Workout</Text>
          <View style={s.card}>
            <Text style={s.cardDate}>{formatDate(lastWorkout.date)}</Text>
            <Text style={s.cardMeta}>
              {lastWorkout.exercises.length} exercises
              {' \u2022 '}
              {lastWorkout.exercises
                .reduce(
                  (sum, ex) =>
                    sum + ex.sets.reduce((s, set) => s + totalVolume(set.weight, set.reps), 0),
                  0
                )
                .toLocaleString()}{' '}
              lbs total
            </Text>
            {lastWorkout.exercises.map((ex, i) => (
              <Text key={i} style={s.cardExercise}>
                {ex.name} — {ex.sets.length} sets
              </Text>
            ))}
          </View>
        </View>
      )}

      {!lastWorkout && routines.length === 0 && (
        <View style={s.emptyContainer}>
          <Text style={s.emptyTitle}>Welcome to RepBuddy</Text>
          <Text style={s.emptyText}>
            Start by adding exercises in the Exercises tab, then create routines or jump straight into a workout.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 20 },
  startBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  routineCard: {
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  routineName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  routineMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 8,
  },
  cardDate: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  cardMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 8 },
  cardExercise: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  emptyContainer: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { color: Colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
