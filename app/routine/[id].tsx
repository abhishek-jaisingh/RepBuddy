import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (selectedIds.length === 0) { Alert.alert('Error', 'Select at least one exercise'); return; }
    await saveRoutine({ ...routine, name: name.trim(), exerciseIds: selectedIds });
    router.back();
  }

  if (!routine) return (
    <View style={s.container}><Text style={s.loading}>Loading...</Text></View>
  );

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Edit Routine</Text>

        <Text style={s.label}>ROUTINE NAME</Text>
        <TextInput style={s.input} value={name} onChangeText={setName}
          placeholderTextColor={Colors.textMuted} />

        <Text style={[s.label, { marginTop: 24 }]}>EXERCISES</Text>
        <Text style={s.hint}>{selectedIds.length} selected</Text>

        {exercises.map((ex) => {
          const selected = selectedIds.includes(ex.id);
          return (
            <TouchableOpacity key={ex.id} style={[s.exerciseRow, selected && s.exerciseRowSelected]}
              onPress={() => toggle(ex.id)}>
              <View style={[s.check, selected && s.checkSelected]}>
                {selected && <FontAwesome name="check" size={12} color={Colors.bg} />}
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
          <FontAwesome name="check" size={14} color={Colors.bg} />
          <Text style={s.saveText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { color: Colors.text, textAlign: 'center', marginTop: 100, fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 20 },

  label: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: Colors.textSecondary, marginBottom: 8,
  },
  hint: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  input: {
    backgroundColor: Colors.inputBg, color: Colors.text,
    padding: 14, borderRadius: 12, borderColor: Colors.inputBorder, borderWidth: 1, fontSize: 15,
  },

  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, padding: 14, borderRadius: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  exerciseRowSelected: { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryDim },
  check: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  exerciseName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  exerciseMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  footer: {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  cancelBtn: {
    flex: 1, backgroundColor: Colors.card, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12,
  },
  saveText: { color: Colors.bg, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});
