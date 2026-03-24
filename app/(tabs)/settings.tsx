import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Platform, Switch } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkouts, getRoutines, getProfile, saveProfile, seedExercisesIfEmpty, getExercises, seedRoutines } from '@/utils/storage';
import { workoutsToMarkdown } from '@/utils/helpers';
import { UserProfile } from '@/types';
import Colors from '@/constants/Colors';
import { version } from '../../package.json';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile>({});

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile);
    }, [])
  );

  function updateField(field: keyof UserProfile, value: string) {
    const num = value === '' ? undefined : parseFloat(value);
    const updated = { ...profile, [field]: num };
    setProfile(updated);
    saveProfile(updated);
  }

  async function handleSeedExercises() {
    const existing = await getExercises();
    if (existing.length > 0) {
      Platform.OS === 'web'
        ? window.alert('Default exercises are only added to an empty library. Clear your exercises first, or add them manually.')
        : Alert.alert('Library Not Empty', 'Default exercises are only added to an empty library. Clear your exercises first, or add them manually.');
      return;
    }
    await seedExercisesIfEmpty();
    Platform.OS === 'web' ? window.alert('Default exercises added to your library.') : Alert.alert('Done', 'Default exercises added to your library.');
  }

  async function handleSeedRoutines() {
    const { added } = await seedRoutines();
    const msg = added > 0 ? `${added} default routines added.` : 'All default routines already exist.';
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Done', msg);
  }

  async function handleClearAll() {
    const doDelete = async () => { await AsyncStorage.clear(); setProfile({}); Platform.OS === 'web' ? window.alert('All data cleared.') : Alert.alert('Done', 'All data cleared.'); };
    if (Platform.OS === 'web') {
      if (window.confirm('Clear All Data\nThis will permanently delete all workouts, routines, and exercises.')) doDelete();
    } else {
      Alert.alert('Clear All Data', 'This will permanently delete all workouts, routines, and exercises.', [
        { text: 'Cancel' },
        { text: 'Clear Everything', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  async function handleExport(range: 'month' | 'all') {
    try {
      const allWorkouts = await getWorkouts();
      const userProfile = await getProfile();

      let workouts = allWorkouts;
      if (range === 'month') {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 1);
        workouts = allWorkouts.filter((w) => new Date(w.date) >= cutoff);
      }

      if (workouts.length === 0) {
        const msg = range === 'month' ? 'No workouts in the last month.' : 'No workouts recorded yet.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('No Data', msg);
        return;
      }

      const markdown = workoutsToMarkdown(workouts, userProfile);
      const label = range === 'month' ? 'last-month' : 'all-time';
      const filename = `repbuddy-workouts-${label}-${new Date().toISOString().slice(0, 10)}.md`;

      if (Platform.OS === 'web') {
        // Web: trigger a file download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Native: use expo-file-system + expo-sharing
      const { File, Paths } = require('expo-file-system/next');
      const Sharing = require('expo-sharing');
      const file = new File(Paths.cache, filename);
      if (file.exists) {
        file.delete();
      }
      file.create();
      file.write(markdown);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Platform.OS === 'web' ? window.alert(`File written to:\n${file.uri}`) : Alert.alert('Export saved', `File written to:\n${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', dialogTitle: 'Export Workout History' });
    } catch (e: any) {
      Platform.OS === 'web' ? window.alert(`Export Failed: ${e?.message ?? String(e)}`) : Alert.alert('Export Failed', e?.message ?? String(e));
    }
  }

  async function handleBackup() {
    try {
      const [workouts, routines, exercises, profile] = await Promise.all([
        getWorkouts(),
        getRoutines(),
        getExercises(),
        getProfile(),
      ]);
      const backup = { version: 1, exportedAt: new Date().toISOString(), workouts, routines, exercises, profile };
      const json = JSON.stringify(backup, null, 2);
      const filename = `repbuddy-backup-${new Date().toISOString().slice(0, 10)}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const { File, Paths } = require('expo-file-system/next');
      const Sharing = require('expo-sharing');
      const file = new File(Paths.cache, filename);
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Backup saved', `File written to:\n${file.uri}`);
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save RepBuddy Backup' });
    } catch (e: any) {
      const msg = `Backup Failed: ${e?.message ?? String(e)}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Backup Failed', e?.message ?? String(e));
    }
  }

  async function performImport(json: string) {
    let backup: any;
    try {
      backup = JSON.parse(json);
    } catch {
      const msg = 'Invalid file: could not parse JSON.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Import Failed', msg);
      return;
    }

    if (!backup.workouts || !backup.exercises || !backup.routines) {
      const msg = 'Invalid backup file: missing required data.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Import Failed', msg);
      return;
    }

    const doImport = async () => {
      try {
        await AsyncStorage.setItem('repbuddy_workouts', JSON.stringify(backup.workouts));
        await AsyncStorage.setItem('repbuddy_exercises', JSON.stringify(backup.exercises));
        await AsyncStorage.setItem('repbuddy_routines', JSON.stringify(backup.routines));
        if (backup.profile) await AsyncStorage.setItem('repbuddy_profile', JSON.stringify(backup.profile));
        const msg = `Restored ${backup.workouts.length} workouts, ${backup.exercises.length} exercises, ${backup.routines.length} routines.`;
        Platform.OS === 'web' ? window.alert(`Import successful!\n${msg}`) : Alert.alert('Import Successful', msg);
        getProfile().then(setProfile);
      } catch (e: any) {
        const msg = `Import Failed: ${e?.message ?? String(e)}`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Import Failed', e?.message ?? String(e));
      }
    };

    const confirmMsg = `This will replace all current data with:\n• ${backup.workouts.length} workouts\n• ${backup.exercises.length} exercises\n• ${backup.routines.length} routines\n\nContinue?`;
    if (Platform.OS === 'web') {
      if (window.confirm(`Restore Backup\n${confirmMsg}`)) doImport();
    } else {
      Alert.alert('Restore Backup', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: doImport },
      ]);
    }
  }

  async function handleImport() {
    if (Platform.OS === 'web') {
      // Web: use hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const text = await file.text();
        performImport(text);
      };
      input.click();
      return;
    }

    // Native: use expo-document-picker
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json', 'public.item'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const { File } = require('expo-file-system/next');
      const file = new File(result.assets[0].uri);
      const text = await file.text();
      performImport(text);
    } catch (e: any) {
      Alert.alert('Import Failed', e?.message ?? String(e));
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Settings</Text>

      {/* Profile Section */}
      <Text style={s.sectionLabel}>PROFILE</Text>
      <View style={s.card}>
        <View style={s.profileListRow}>
          <Text style={s.profileListLabel}>Age</Text>
          <View style={s.profileInlineInput}>
            <TextInput
              style={s.profileInlineText}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={Colors.textMuted}
              value={profile.age != null ? String(profile.age) : ''}
              onChangeText={(v) => updateField('age', v)}
              selectTextOnFocus
            />
            <Text style={s.profileUnit}>yrs</Text>
          </View>
        </View>
        <View style={s.profileDivider} />
        <View style={s.profileListRow}>
          <Text style={s.profileListLabel}>Weight</Text>
          <View style={s.profileInlineInput}>
            <TextInput
              style={s.profileInlineText}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={Colors.textMuted}
              value={profile.weight != null ? String(profile.weight) : ''}
              onChangeText={(v) => updateField('weight', v)}
              selectTextOnFocus
            />
            <Text style={s.profileUnit}>kg</Text>
          </View>
        </View>
        <View style={s.profileDivider} />
        <View style={s.profileListRow}>
          <Text style={s.profileListLabel}>Height</Text>
          <View style={s.heightRow}>
            <View style={[s.profileInlineInput, s.heightInput]}>
              <TextInput
                style={s.profileInlineText}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={Colors.textMuted}
                value={profile.heightFt != null ? String(profile.heightFt) : ''}
                onChangeText={(v) => updateField('heightFt', v)}
                selectTextOnFocus
              />
              <Text style={s.profileUnit}>ft</Text>
            </View>
            <View style={[s.profileInlineInput, s.heightInput]}>
              <TextInput
                style={s.profileInlineText}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={Colors.textMuted}
                value={profile.heightIn != null ? String(profile.heightIn) : ''}
                onChangeText={(v) => updateField('heightIn', v)}
                selectTextOnFocus
              />
              <Text style={s.profileUnit}>in</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}

      <Text style={s.sectionLabel}>ABOUT</Text>
      <View style={s.card}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="info-circle" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>RepBuddy</Text>
            <Text style={s.cardSub}>Version {version}</Text>
          </View>
        </View>
      </View>

      {/* Workout Section */}
      <Text style={s.sectionLabel}>WORKOUT</Text>
      <View style={s.card}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="lightbulb-o" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Show Form Tips</Text>
            <Text style={s.cardSub}>Display exercise form cues and video links during workouts</Text>
          </View>
          <Switch
            value={profile.showFormTips !== false}
            onValueChange={(v) => {
              const updated = { ...profile, showFormTips: v };
              setProfile(updated);
              saveProfile(updated);
            }}
            trackColor={{ false: Colors.cardHighlight, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Library Section */}
      <Text style={s.sectionLabel}>LIBRARY</Text>
      <TouchableOpacity style={s.card} onPress={handleSeedExercises}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="list" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Add Default Exercises</Text>
            <Text style={s.cardSub}>Populate your library with common exercises to get started quickly</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.card} onPress={handleSeedRoutines}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="bolt" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Add Default Routines</Text>
            <Text style={s.cardSub}>Add Push, Pull, Legs & home workout routines (requires default exercises)</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Data Section */}
      <Text style={s.sectionLabel}>DATA & PRIVACY</Text>
      <View style={s.card}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="shield" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Local Storage Only</Text>
            <Text style={s.cardSub}>All data stays on your device. Nothing is sent to any server.</Text>
          </View>
        </View>
      </View>

      {/* Backup & Restore Section */}
      <Text style={s.sectionLabel}>BACKUP & RESTORE</Text>
      <TouchableOpacity style={s.card} onPress={handleBackup}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="database" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Backup All Data</Text>
            <Text style={s.cardSub}>Export all workouts, exercises, routines & profile as a JSON file</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.card} onPress={handleImport}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="upload" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Restore from Backup</Text>
            <Text style={s.cardSub}>Import a previously exported JSON backup file</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Export Section */}
      <Text style={s.sectionLabel}>EXPORT</Text>
      <TouchableOpacity style={s.card} onPress={() => handleExport('month')}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="download" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Export Last Month</Text>
            <Text style={s.cardSub}>Share workout history as a Markdown file — paste into any LLM for insights</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.card} onPress={() => handleExport('all')}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="download" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Export All Time</Text>
            <Text style={s.cardSub}>Export complete workout history as Markdown — paste into any LLM for insights</Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Danger Zone */}
      <Text style={s.sectionLabel}>DANGER ZONE</Text>
      <TouchableOpacity style={s.dangerCard} onPress={handleClearAll}>
        <View style={s.dangerIconBox}>
          <FontAwesome name="trash" size={18} color={Colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.dangerTitle}>Clear All Data</Text>
          <Text style={s.dangerSub}>Permanently delete all workouts, routines, and exercises</Text>
        </View>
        <FontAwesome name="chevron-right" size={12} color={Colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40, gap: 12 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: Colors.textSecondary, marginTop: 12, marginBottom: 4,
  },

  // Profile
  profileListRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10,
  },
  profileListLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  profileInlineInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.inputBorder,
  },
  profileInlineText: {
    color: Colors.text, fontSize: 16, fontWeight: '700',
    paddingVertical: 8, paddingHorizontal: 12, minWidth: 60, textAlign: 'right',
  },
  profileUnit: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '600',
    paddingRight: 10,
  },
  profileDivider: { height: 1, backgroundColor: Colors.cardBorder },
  heightRow: { flexDirection: 'row', gap: 8, flexShrink: 1, marginLeft: 12 },
  heightInput: { flex: 1, minWidth: 0 },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },

  dangerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,68,68,0.06)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,68,68,0.20)',
  },
  dangerIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  dangerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
