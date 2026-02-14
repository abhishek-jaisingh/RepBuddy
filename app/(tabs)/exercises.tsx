import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { getExercises, saveExercise, deleteExercise } from '@/utils/storage';
import { Exercise } from '@/types';
import { generateId } from '@/utils/helpers';
import Colors from '@/constants/Colors';

const EMPTY_FORM: Partial<Exercise> = { name: '', muscleGroup: '', equipment: '', notes: '' };

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<Partial<Exercise> | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [])
  );

  async function reload() {
    setExercises(await getExercises());
  }

  async function handleSave() {
    if (!editing?.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    const exercise: Exercise = {
      id: editing.id || generateId(),
      name: editing.name.trim(),
      muscleGroup: editing.muscleGroup?.trim() || undefined,
      equipment: editing.equipment?.trim() || undefined,
      notes: editing.notes?.trim() || undefined,
    };
    await saveExercise(exercise);
    setEditing(null);
    await reload();
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Exercise', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(id);
          await reload();
        },
      },
    ]);
  }

  // --- Form View ---
  if (editing) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.formTitle}>{editing.id ? 'Edit Exercise' : 'New Exercise'}</Text>

        <Text style={s.label}>Name *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Bench Press"
          placeholderTextColor={Colors.textMuted}
          value={editing.name}
          onChangeText={(t) => setEditing({ ...editing, name: t })}
          autoFocus
        />

        <Text style={s.label}>Muscle Group</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Chest"
          placeholderTextColor={Colors.textMuted}
          value={editing.muscleGroup}
          onChangeText={(t) => setEditing({ ...editing, muscleGroup: t })}
        />

        <Text style={s.label}>Equipment</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Barbell"
          placeholderTextColor={Colors.textMuted}
          value={editing.equipment}
          onChangeText={(t) => setEditing({ ...editing, equipment: t })}
        />

        <Text style={s.label}>Notes</Text>
        <TextInput
          style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Optional notes..."
          placeholderTextColor={Colors.textMuted}
          value={editing.notes}
          onChangeText={(t) => setEditing({ ...editing, notes: t })}
          multiline
        />

        <View style={s.formActions}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(null)}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- List View ---
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.addBtn} onPress={() => setEditing({ ...EMPTY_FORM })}>
        <Text style={s.addBtnText}>+ Add Exercise</Text>
      </TouchableOpacity>

      {exercises.length === 0 && (
        <Text style={s.empty}>No exercises yet. Tap above to add one!</Text>
      )}

      {exercises.map((ex) => (
        <View key={ex.id} style={s.card}>
          <TouchableOpacity style={s.cardBody} onPress={() => setEditing(ex)}>
            <Text style={s.exerciseName}>{ex.name}</Text>
            {(ex.muscleGroup || ex.equipment) && (
              <Text style={s.exerciseMeta}>
                {[ex.muscleGroup, ex.equipment].filter(Boolean).join(' \u2022 ')}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(ex.id)}>
            <Text style={s.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBody: { flex: 1, padding: 14 },
  exerciseName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  exerciseMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  deleteBtnText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },

  // Form
  formTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: Colors.inputBg,
    color: Colors.text,
    padding: 12,
    borderRadius: 6,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    fontSize: 15,
  },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
