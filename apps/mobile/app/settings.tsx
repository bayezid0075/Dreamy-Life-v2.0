import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import { useI18n } from '@/shared/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const settingsItems = [
    { icon: '🌐', label: t('language'), href: '/settings/language' as const },
    { icon: '🔔', label: t('notifications'), href: '/notifications' as const },
    { icon: '👛', label: t('wallet'), href: '/wallet' as const },
  ];

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showMenu={false} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settingsTitle')}</Text>

        <View style={styles.card}>
          {settingsItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(item.href)}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
                <Text style={styles.itemArrow}>›</Text>
              </TouchableOpacity>
              {i < settingsItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1c1b1b', marginBottom: 24 },
  card: { borderRadius: 30, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemIcon: { fontSize: 20 },
  itemLabel: { fontSize: 16, color: '#1c1b1b' },
  itemArrow: { fontSize: 22, color: '#76777b' },
  divider: { height: 1, width: '90%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
});
