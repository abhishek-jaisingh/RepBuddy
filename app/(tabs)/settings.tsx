import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
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
      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>RepBuddy v1.0.0</Text>
          <Text style={s.cardSub}>Simple gym workout tracker</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data</Text>
        <View style={s.card}>
          <Text style={s.cardSub}>All data is stored locally on your device. Nothing is sent to any server.</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={s.dangerBtn} onPress={handleClearAll}>
          <Text style={s.dangerBtnText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 24 },
  section: { gap: 8 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: Colors.card, padding: 14, borderRadius: 8 },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 20 },
  dangerBtn: {
    backgroundColor: '#2a1515',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  dangerBtnText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
});
