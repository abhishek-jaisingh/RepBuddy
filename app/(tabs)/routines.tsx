import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import { getRoutines, deleteRoutine, getExercises } from '@/utils/storage';
import { Routine, Exercise } from '@/types';
import Colors from '@/constants/Colors';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});

  useFocusEffect(useCallback(() => {
    (async () => {
      setRoutines(await getRoutines());
      const exs = await getExercises();
      const map: Record<string, Exercise> = {};
      exs.forEach((e) => (map[e.id] = e));
      setExerciseMap(map);
    })();
  }, []));

  async function handleDelete(id: string) {
    Alert.alert('Delete Routine', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRoutine(id); setRoutines(await getRoutines()); } },
    ]);
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>My Routines</Text>

        {routines.length === 0 && (
          <View style={s.emptyState}>
            <FontAwesome name="bolt" size={32} color={Colors.textMuted} />
            <Text style={s.emptyText}>No routines yet. Create one for faster logging!</Text>
          </View>
        )}

        {routines.map((r) => (
          <View key={r.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.routineName}>{r.name}</Text>
                <View style={s.metaRow}>
                  <FontAwesome name="list" size={11} color={Colors.textSecondary} />
                  <Text style={s.metaText}>{r.exerciseIds.length} Exercises</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(r.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome name="ellipsis-v" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Exercise names */}
            <Text style={s.exerciseList}>
              {r.exerciseIds.map((id) => exerciseMap[id]?.name || 'Unknown').join(' \u2022 ')}
            </Text>

            <View style={s.actions}>
              <TouchableOpacity style={s.startBtn}
                onPress={() => router.push(`/workout/active?routineId=${r.id}`)}>
                <FontAwesome name="play" size={12} color={Colors.bg} />
                <Text style={s.startText}>START ROUTINE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editBtn}
                onPress={() => router.push(`/routine/${r.id}`)}>
                <Text style={s.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/routine/create')}>
        <FontAwesome name="plus" size={22} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },

  emptyState: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routineName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  exerciseList: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 10 },
  startBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10,
  },
  startText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: Colors.bg },
  editBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardHighlight, paddingVertical: 12, borderRadius: 10,
  },
  editText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
});
