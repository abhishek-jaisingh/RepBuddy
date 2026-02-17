import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import { getRoutines, getWorkouts } from '@/utils/storage';
import { Routine, Workout } from '@/types';
import { totalVolume } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setWorkouts(await getWorkouts());
        setRoutines(await getRoutines());
      })();
    }, [])
  );

  // Calculate weekly stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyWorkouts = workouts.filter((w) => new Date(w.date) >= weekStart);
  const weeklyVolume = weeklyWorkouts.reduce(
    (sum, w) =>
      sum +
      w.exercises.reduce(
        (es, ex) => es + ex.sets.reduce((ss, set) => ss + totalVolume(set.weight, set.reps), 0),
        0
      ),
    0
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.brandLabel}>REPBUDDY</Text>
          <Text style={s.greeting}>Let's crush it.</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>WEEKLY PROGRESS</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View style={s.statIconRow}>
              <FontAwesome name="bar-chart" size={14} color={Colors.primary} />
              <Text style={s.statLabel}>VOLUME</Text>
            </View>
            <Text style={s.statValue}>
              {weeklyVolume.toLocaleString()}{' '}
              <Text style={s.statUnit}>kg</Text>
            </Text>
          </View>
          <View style={s.statCard}>
            <View style={s.statIconRow}>
              <FontAwesome name="calendar" size={14} color={Colors.primary} />
              <Text style={s.statLabel}>WORKOUTS</Text>
            </View>
            <Text style={s.statValue}>{weeklyWorkouts.length}</Text>
            <View style={s.progressBarBg}>
              <View
                style={[
                  s.progressBarFill,
                  { width: `${Math.min(weeklyWorkouts.length * 20, 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Start Workout CTA */}
      <TouchableOpacity
        style={s.ctaButton}
        activeOpacity={0.85}
        onPress={() => router.push('/workout/active')}
      >
        <FontAwesome name="plus-circle" size={22} color={Colors.bg} />
        <Text style={s.ctaText}>START EMPTY WORKOUT</Text>
      </TouchableOpacity>

      {/* Recent Routines */}
      {routines.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>RECENT ROUTINES</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/routines')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {routines.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.routineCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/workout/active?routineId=${r.id}`)}
            >
              <View style={s.routineIcon}>
                <FontAwesome name="bolt" size={20} color={Colors.primary} />
              </View>
              <View style={s.routineInfo}>
                <Text style={s.routineName}>{r.name}</Text>
                <Text style={s.routineMeta}>{r.exerciseIds.length} exercises</Text>
              </View>
              <View style={s.playBtn}>
                <FontAwesome name="play" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {workouts.length === 0 && routines.length === 0 && (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <FontAwesome name="plus" size={28} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Welcome to RepBuddy</Text>
          <Text style={s.emptyText}>
            Add exercises in the Library, create routines, then start crushing workouts.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 32, gap: 24 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(166, 242, 13, 0.7)',
    marginBottom: 4,
  },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  seeAll: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.primary },
  statValue: { fontSize: 28, fontWeight: '900', color: Colors.text },
  statUnit: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },
  progressBarBg: {
    height: 5,
    backgroundColor: Colors.cardHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: Colors.bg,
  },

  // Routine Cards
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  routineMeta: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
