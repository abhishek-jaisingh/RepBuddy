import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import { getWorkouts, deleteWorkout } from '@/utils/storage';
import { Workout } from '@/types';
import { formatDate, totalVolume } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { reload(); }, []));

  async function reload() {
    const data = await getWorkouts();
    setWorkouts([...data].reverse());
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Workout', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteWorkout(id); await reload(); } },
    ]);
  }

  function formatDuration(ms?: number): string {
    if (!ms) return '';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  const totalMonthWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalVolumeAll = workouts.reduce(
    (sum, w) => sum + w.exercises.reduce((es, ex) => es + ex.sets.reduce((ss, set) => ss + totalVolume(set.weight, set.reps), 0), 0), 0
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>History</Text>

      {/* Summary Cards */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>THIS MONTH</Text>
          <Text style={s.statValue}>{totalMonthWorkouts} <Text style={s.statUnit}>Workouts</Text></Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>TOTAL VOLUME</Text>
          <Text style={s.statValue}>{(totalVolumeAll / 1000).toFixed(1)}<Text style={s.statUnit}>k</Text></Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>RECENT ACTIVITY</Text>

      {workouts.length === 0 && (
        <View style={s.emptyState}>
          <FontAwesome name="calendar-o" size={32} color={Colors.textMuted} />
          <Text style={s.emptyText}>No workouts yet. Start one from the Home tab!</Text>
        </View>
      )}

      {workouts.map((w) => {
        const vol = w.exercises.reduce(
          (sum, ex) => sum + ex.sets.reduce((es, set) => es + totalVolume(set.weight, set.reps), 0), 0
        );
        const expanded = expandedId === w.id;

        return (
          <TouchableOpacity key={w.id} style={s.card} activeOpacity={0.85}
            onPress={() => setExpandedId(expanded ? null : w.id)}>
            {/* Date Badge */}
            <View style={s.cardTop}>
              <View style={s.dateBadge}>
                <Text style={s.dateBadgeText}>{formatDate(w.date)}</Text>
              </View>
              <View style={s.cardTopRight}>
                <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textSecondary} />
              </View>
            </View>

            <Text style={s.cardTitle}>
              {w.exercises.length} Exercise{w.exercises.length !== 1 ? 's' : ''}
            </Text>
            <View style={s.cardMetaRow}>
              {w.durationMs ? (
                <View style={s.metaItem}>
                  <FontAwesome name="clock-o" size={12} color={Colors.textSecondary} />
                  <Text style={s.metaText}>{formatDuration(w.durationMs)}</Text>
                </View>
              ) : null}
              <View style={s.metaItem}>
                <FontAwesome name="bar-chart" size={12} color={Colors.textSecondary} />
                <Text style={s.metaText}>{vol.toLocaleString()} kg</Text>
              </View>
            </View>

            {expanded && (
              <View style={s.details}>
                {w.exercises.map((ex, i) => (
                  <View key={i} style={s.exBlock}>
                    <Text style={s.exName}>{ex.name}</Text>
                    <View style={s.setTableHeader}>
                      <Text style={[s.setHeaderCell, { width: 36 }]}>SET</Text>
                      {!ex.bodyweight && <Text style={[s.setHeaderCell, { flex: 1 }]}>WEIGHT</Text>}
                      <Text style={[s.setHeaderCell, { flex: 1 }]}>REPS</Text>
                    </View>
                    {ex.sets.map((set, si) => (
                      <View key={si} style={s.setTableRow}>
                        <Text style={[s.setCell, { width: 36 }]}>{si + 1}</Text>
                        {!ex.bodyweight && <Text style={[s.setCell, { flex: 1 }]}>{set.weight} kg</Text>}
                        <Text style={[s.setCell, { flex: 1 }]}>{set.reps}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                <TouchableOpacity style={s.deleteRow} onPress={() => handleDelete(w.id)}>
                  <FontAwesome name="trash-o" size={14} color={Colors.danger} />
                  <Text style={s.deleteText}>Delete Workout</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.primary, marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: '900', color: Colors.text },
  statUnit: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: Colors.textSecondary, marginBottom: 4 },

  emptyState: { alignItems: 'center', marginTop: 32, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateBadge: { backgroundColor: Colors.primaryDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  dateBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  cardTopRight: {},
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardMetaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  details: { marginTop: 14, gap: 12 },
  exBlock: { backgroundColor: Colors.inputBg, borderRadius: 10, padding: 12 },
  exName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  setTableHeader: { flexDirection: 'row', marginBottom: 4 },
  setHeaderCell: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.textMuted },
  setTableRow: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  setCell: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8 },
  deleteText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },
});
