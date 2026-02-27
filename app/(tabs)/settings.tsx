import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkouts, getProfile, saveProfile } from '@/utils/storage';
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

  async function handleClearAll() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all workouts, routines, and exercises.',
      [
        { text: 'Cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setProfile({});
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
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
        Alert.alert('No Data', range === 'month' ? 'No workouts in the last month.' : 'No workouts recorded yet.');
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
        Alert.alert('Export saved', `File written to:\n${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', dialogTitle: 'Export Workout History' });
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message ?? String(e));
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Settings</Text>

      {/* Profile Section */}
      <Text style={s.sectionLabel}>PROFILE</Text>
      <View style={s.card}>
        {/* Row 1: Age + Weight */}
        <View style={s.profileRow}>
          <View style={s.profileField}>
            <Text style={s.profileLabel}>Age</Text>
            <View style={s.profileInputWrap}>
              <TextInput
                style={s.profileInput}
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
          <View style={s.profileField}>
            <Text style={s.profileLabel}>Weight</Text>
            <View style={s.profileInputWrap}>
              <TextInput
                style={s.profileInput}
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
        </View>
        {/* Row 2: Height */}
        <View style={s.profileHeightRow}>
          <Text style={s.profileLabel}>Height</Text>
          <View style={s.heightRow}>
              <View style={[s.profileInputWrap, { flex: 1 }]}>
                <TextInput
                  style={s.profileInput}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={Colors.textMuted}
                  value={profile.heightFt != null ? String(profile.heightFt) : ''}
                  onChangeText={(v) => updateField('heightFt', v)}
                  selectTextOnFocus
                />
                <Text style={s.profileUnit}>ft</Text>
              </View>
              <View style={[s.profileInputWrap, { flex: 1 }]}>
                <TextInput
                  style={s.profileInput}
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
            <FontAwesome name="database" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Export All Time</Text>
            <Text style={s.cardSub}>Export your complete workout history as Markdown</Text>
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
  profileRow: { flexDirection: 'row', gap: 12 },
  profileHeightRow: { marginTop: 12 },
  profileField: { flex: 1 },
  profileLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: Colors.textSecondary, marginBottom: 6,
  },
  profileInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.inputBorder,
  },
  profileInput: {
    flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700',
    paddingVertical: 10, paddingHorizontal: 12, textAlign: 'center',
  },
  profileUnit: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '600',
    paddingRight: 10,
  },
  heightRow: { flexDirection: 'row', gap: 12 },

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
