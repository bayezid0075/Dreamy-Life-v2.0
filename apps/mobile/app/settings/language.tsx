import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import { useI18n, Locale } from '@/shared/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const { locale, t, setLocale } = useI18n();

  const languages: { code: Locale; label: string; sub: string; flag: string }[] = [
    { code: 'en', label: t('english'), sub: t('englishSub'), flag: 'EN' },
    { code: 'bn', label: t('bengali'), sub: t('bengaliSub'), flag: 'BN' },
  ];

  const handleSelect = (code: Locale) => {
    setLocale(code);
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showMenu={false} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('languageSelection')}</Text>
        <Text style={styles.subtitle}>{t('languageDescription')}</Text>

        <View style={styles.langList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langCard, locale === lang.code && styles.langCardActive]}
              onPress={() => handleSelect(lang.code)}
            >
              <View style={styles.langLeft}>
                <View style={styles.langFlag}>
                  <Text style={styles.langFlagText}>{lang.flag}</Text>
                </View>
                <View>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  <Text style={styles.langSub}>{lang.sub}</Text>
                </View>
              </View>
              <View style={[styles.radio, locale === lang.code && styles.radioActive]}>
                {locale === lang.code && <Text style={styles.radioCheck}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>{t('save')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#45474b', marginBottom: 24, lineHeight: 24 },
  langList: { gap: 16 },
  langCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  langCardActive: { backgroundColor: 'rgba(255,255,255,0.8)' },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  langFlag: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0eded', alignItems: 'center', justifyContent: 'center' },
  langFlagText: { fontSize: 12, fontWeight: '700', color: '#1c1b1b' },
  langLabel: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  langSub: { fontSize: 14, color: '#45474b' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#76777b', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#5d5e64', backgroundColor: '#5d5e64' },
  radioCheck: { color: 'white', fontSize: 12, fontWeight: '700' },
  saveBtn: { marginTop: 32, alignSelf: 'flex-end', backgroundColor: '#1A1A1A', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 9999 },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
