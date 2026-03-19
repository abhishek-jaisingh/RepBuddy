import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FormTip } from '@/utils/formTips';
import Colors from '@/constants/Colors';

interface Props {
  visible: boolean;
  exerciseName: string;
  tip: FormTip;
  onClose: () => void;
}

export default function FormTipsModal({ visible, exerciseName, tip, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.handle} />
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{exerciseName}</Text>
                <Text style={s.subtitle}>Form Guide</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <FontAwesome name="times" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {/* Setup */}
            <View style={s.section}>
              <View style={s.sectionLabelRow}>
                <FontAwesome name="cog" size={12} color={Colors.primary} />
                <Text style={s.sectionLabel}>SETUP</Text>
              </View>
              <Text style={s.bodyText}>{tip.setup}</Text>
            </View>

            {/* Cues */}
            <View style={s.section}>
              <View style={s.sectionLabelRow}>
                <FontAwesome name="check-circle" size={12} color={Colors.primary} />
                <Text style={s.sectionLabel}>CUES</Text>
              </View>
              {tip.cues.map((cue, i) => (
                <View key={i} style={s.bulletRow}>
                  <Text style={s.bullet}>•</Text>
                  <Text style={s.bodyText}>{cue}</Text>
                </View>
              ))}
            </View>

            {/* Common Mistakes */}
            <View style={s.section}>
              <View style={s.sectionLabelRow}>
                <FontAwesome name="exclamation-triangle" size={12} color={Colors.danger} />
                <Text style={[s.sectionLabel, { color: Colors.danger }]}>COMMON MISTAKES</Text>
              </View>
              {tip.mistakes.map((m, i) => (
                <View key={i} style={s.bulletRow}>
                  <Text style={[s.bullet, { color: Colors.danger }]}>✗</Text>
                  <Text style={s.bodyText}>{m}</Text>
                </View>
              ))}
            </View>

            {/* Video Link */}
            <TouchableOpacity
              style={s.videoLink}
              onPress={() => Linking.openURL(tip.videoUrl)}
            >
              <FontAwesome name="youtube-play" size={18} color="#FF0000" />
              <Text style={s.videoText}>Watch Demo</Text>
              <FontAwesome name="external-link" size={12} color={Colors.textMuted} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cardHighlight,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: { gap: 8 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.primary,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  videoText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
});
