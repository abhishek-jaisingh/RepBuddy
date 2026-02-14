import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { getWorkouts, deleteWorkout } from '@/utils/storage';
import { Workout } from '@/types';
import { formatDate, totalVolume } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [])
  );

  async function reload() {
    const data = await getWorkouts();
    setWorkouts([...data].reverse());
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Workout', 'This cannot be undone.', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(id);
          await reload();
        },
      },
    ]);
  }

  function formatDuration(ms?: number): string {
    if (!ms) return '';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {workouts.length === 0 && (
        <Text style={s.empty}>No workouts logged yet. Start one from the Home tab!</Text>
      )}

      {workouts.map((w) => {
        const vol = w.exercises.reduce(
          (sum, ex) => sum + ex.sets.reduce((es, set) => es + totalVolume(set.weight, set.reps), 0),
          0
        );
        const totalSets = w.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const expanded = expandedId === w.id;

        return (
          <TouchableOpacity
            key={w.id}
            style={s.card}
            activeOpacity={0.8}
            onPress={() => setExpandedId(expanded ? null : w.id)}
          >
            <View style={s.cardHeader}>
              <View>
                <Text style={s.date}>{formatDate(w.date)}</Text>
                <Text style={s.meta}>
                  {w.exercises.length} exercises \u2022 {totalSets} sets \u2022{' '}
                  {vol.toLocaleString()} lbs
                  {w.durationMs ? ` \u2022 ${formatDuration(w.durationMs)}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(w.id)}>
                <Text style={s.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {expanded && (
              <View style={s.details}>
                {w.exercises.map((ex, i) => (
                  <View key={i} style={s.exDetail}>
                    <Text style={s.exName}>{ex.name}</Text>
                    {ex.sets.map((set, si) => (
                      <Text key={si} style={s.setText}>
                        Set {si + 1}: {set.weight} lbs × {set.reps} reps
                      </Text>
                    ))}
                  </View>
                ))}
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
  content: { padding: 16, gap: 10 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: Colors.card, borderRadius: 8, overflow: 'hidden' },
  cardHeader: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  deleteText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  details: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  exDetail: {
    backgroundColor: Colors.inputBg,
    padding: 10,
    borderRadius: 6,
  },
  exName: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  setText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
