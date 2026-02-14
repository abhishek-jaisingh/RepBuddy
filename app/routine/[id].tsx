import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { saveRoutine, getRoutines, getExercises } from '@/utils/storage';
import { Exercise, Routine } from '@/types';
import Colors from '@/constants/Colors';

export default function EditRoutineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    (async () => {
      const routines = await getRoutines();
      const found = routines.find((r) => r.id === id);
      if (found) {
        setRoutine(found);
        setName(found.name);
        setSelectedIds(found.exerciseIds);
      }
      setExercises(await getExercises());
    })();
  }, [id]);

  function toggle(exId: string) {
    setSelectedIds((prev) =>
      prev.includes(exId) ? prev.filter((x) => x !== exId) : [...prev, exId]
    );
  }

  async function handleSave() {
    if (!routine) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Error', 'Select at least one exercise');
      return;
    }
    await saveRoutine({ ...routine, name: name.trim(), exerciseIds: selectedIds });
    router.back();
  }

  if (!routine) return <Text style={s.loading}>Loading...</Text>;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>Routine Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={[s.label, { marginTop: 16 }]}>Exercises</Text>
        {exercises.map((ex) => {
          const selected = selectedIds.includes(ex.id);
          return (
            <TouchableOpacity
              key={ex.id}
              style={[s.exerciseRow, selected && s.exerciseRowSelected]}
              onPress={() => toggle(ex.id)}
            >
              <View style={[s.check, selected && s.checkSelected]}>
                {selected && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={s.exerciseName}>{ex.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 40 },
  content: { padding: 16, paddingBottom: 100 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: Colors.inputBg,
    color: Colors.text,
    padding: 12,
    borderRadius: 6,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    fontSize: 15,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  exerciseRowSelected: { borderColor: Colors.accent, borderWidth: 1 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  exerciseName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.card,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
});
