import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import { getExercises, saveExercise, deleteExercise } from '@/utils/storage';
import { Exercise } from '@/types';
import { generateId } from '@/utils/helpers';
import Colors from '@/constants/Colors';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EMPTY_FORM: Partial<Exercise> = { name: '', muscleGroup: '', equipment: '', notes: '' };

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<Partial<Exercise> | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useFocusEffect(useCallback(() => { reload(); }, []));

  async function reload() { setExercises(await getExercises()); }

  async function handleSave() {
    if (!editing?.name?.trim()) { Alert.alert('Error', 'Name is required'); return; }
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
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExercise(id); await reload(); } },
    ]);
  }

  const filtered = exercises.filter((ex) => {
    const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || ex.muscleGroup?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // --- Form View ---
  if (editing) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.formContent}>
        <Text style={s.pageTitle}>{editing.id ? 'Edit Exercise' : 'Add Exercise'}</Text>

        <Text style={s.label}>EXERCISE NAME</Text>
        <TextInput style={s.input} placeholder="e.g. Bench Press" placeholderTextColor={Colors.textMuted}
          value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} autoFocus />

        <Text style={s.label}>MUSCLE GROUP</Text>
        <TextInput style={s.input} placeholder="e.g. Chest" placeholderTextColor={Colors.textMuted}
          value={editing.muscleGroup} onChangeText={(t) => setEditing({ ...editing, muscleGroup: t })} />

        <Text style={s.label}>EQUIPMENT</Text>
        <TextInput style={s.input} placeholder="e.g. Barbell" placeholderTextColor={Colors.textMuted}
          value={editing.equipment} onChangeText={(t) => setEditing({ ...editing, equipment: t })} />

        <Text style={s.label}>NOTES</Text>
        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Optional notes..."
          placeholderTextColor={Colors.textMuted} value={editing.notes}
          onChangeText={(t) => setEditing({ ...editing, notes: t })} multiline />

        <View style={s.formActions}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(null)}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- List View ---
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.headerRow}>
          <FontAwesome name="list" size={22} color={Colors.primary} />
          <Text style={s.pageTitle}>Exercise Library</Text>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <FontAwesome name="search" size={14} color={Colors.textMuted} />
          <TextInput style={s.searchInput} placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
          {MUSCLE_GROUPS.map((g) => (
            <TouchableOpacity key={g} style={[s.chip, filter === g && s.chipActive]}
              onPress={() => setFilter(g)}>
              <Text style={[s.chipText, filter === g && s.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise List */}
        <Text style={s.sectionLabel}>ALL EXERCISES</Text>
        {filtered.length === 0 && (
          <Text style={s.empty}>No exercises found. Add one below!</Text>
        )}
        {filtered.map((ex) => (
          <TouchableOpacity key={ex.id} style={s.card} activeOpacity={0.8} onPress={() => setEditing(ex)}>
            <View style={s.cardIcon}>
              <FontAwesome name="trophy" size={18} color={Colors.primary} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{ex.name}</Text>
              {ex.equipment && <Text style={s.cardMeta}>Equipment: {ex.equipment}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDelete(ex.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome name="trash-o" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Add Custom Exercise */}
        <TouchableOpacity style={s.addDashed} onPress={() => setEditing({ ...EMPTY_FORM })}>
          <FontAwesome name="plus" size={14} color={Colors.textSecondary} />
          <Text style={s.addDashedText}>Add Custom Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setEditing({ ...EMPTY_FORM })}>
        <FontAwesome name="plus" size={22} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },
  formContent: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },

  // Filter chips
  chips: { marginBottom: 20, maxHeight: 38 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.bg },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: Colors.textSecondary, marginBottom: 10 },

  empty: { color: Colors.textMuted, textAlign: 'center', marginVertical: 20, fontSize: 14 },

  // Exercise card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Add dashed
  addDashed: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.cardBorder, borderStyle: 'dashed', marginTop: 8,
  },
  addDashedText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },

  // Form
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.textSecondary, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: Colors.card, color: Colors.text, padding: 14, borderRadius: 12,
    borderColor: Colors.cardBorder, borderWidth: 1, fontSize: 15,
  },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: { flex: 1, backgroundColor: Colors.card, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  cancelText: { color: Colors.textSecondary, fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: Colors.bg, fontWeight: '700' },
});
