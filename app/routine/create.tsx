import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { saveRoutine, getExercises } from '@/utils/storage';
import { Exercise, Routine } from '@/types';
import { generateId } from '@/utils/helpers';
import Colors from '@/constants/Colors';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getExercises().then(setExercises);
  }, []);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Error', 'Select at least one exercise');
      return;
    }
    const routine: Routine = { id: generateId(), name: name.trim(), exerciseIds: selectedIds };
    await saveRoutine(routine);
    router.back();
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>Routine Name</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Push Day"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[s.label, { marginTop: 16 }]}>Select Exercises</Text>
        {exercises.length === 0 && (
          <Text style={s.empty}>No exercises yet. Add some in the Exercises tab first.</Text>
        )}
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
              <View style={{ flex: 1 }}>
                <Text style={s.exerciseName}>{ex.name}</Text>
                {ex.muscleGroup && <Text style={s.exerciseMeta}>{ex.muscleGroup}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Create Routine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  empty: { color: Colors.textMuted, fontSize: 13, marginTop: 8 },
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
  exerciseMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
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
