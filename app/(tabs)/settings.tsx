import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
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
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Settings</Text>

      {/* About Section */}
      <Text style={s.sectionLabel}>ABOUT</Text>
      <View style={s.card}>
        <View style={s.cardRow}>
          <View style={s.iconBox}>
            <FontAwesome name="info-circle" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>RepBuddy</Text>
            <Text style={s.cardSub}>Version 1.0.0</Text>
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
