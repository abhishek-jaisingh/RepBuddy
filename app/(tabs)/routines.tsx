import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { getRoutines, deleteRoutine, getExercises } from '@/utils/storage';
import { Routine, Exercise } from '@/types';
import Colors from '@/constants/Colors';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setRoutines(await getRoutines());
        const exs = await getExercises();
        const map: Record<string, Exercise> = {};
        exs.forEach((e) => (map[e.id] = e));
        setExerciseMap(map);
      })();
    }, [])
  );

  async function handleDelete(id: string) {
    Alert.alert('Delete Routine', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(id);
          setRoutines(await getRoutines());
        },
      },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.addBtn} onPress={() => router.push('/routine/create')}>
        <Text style={s.addBtnText}>+ Create Routine</Text>
      </TouchableOpacity>

      {routines.length === 0 && (
        <Text style={s.empty}>No routines yet. Create one for faster logging!</Text>
      )}

      {routines.map((r) => (
        <View key={r.id} style={s.card}>
          <View style={s.cardBody}>
            <Text style={s.name}>{r.name}</Text>
            <Text style={s.meta}>
              {r.exerciseIds.map((id) => exerciseMap[id]?.name || 'Unknown').join(', ')}
            </Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => router.push(`/workout/active?routineId=${r.id}`)}
            >
              <Text style={s.startBtnText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => router.push(`/routine/${r.id}`)}
            >
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(r.id)}>
              <Text style={s.delBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 12 },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 14, gap: 10 },
  cardBody: {},
  name: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  startBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  editBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  delBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  delBtnText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
});
