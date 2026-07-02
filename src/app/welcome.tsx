import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useStore } from '@/store/useStore';
import { radius, spacing, usePalette } from '@/theme';

const PILLARS = [
  { emoji: '🏦', title: "Capacité d'emprunt", desc: 'Mensualité, règle des 35 %, PTZ — un verdict immédiat “finançable ou pas”.' },
  { emoji: '💶', title: 'Reste à vivre', desc: 'Ce qu’il vous reste chaque mois, avant et après impôts, une fois tout payé.' },
  { emoji: '📊', title: 'Fiscalité location', desc: 'Nu, LMNP micro-BIC ou réel : comparez et gardez le régime le plus avantageux.' },
  { emoji: '🏠', title: 'Patrimoine net', desc: 'Vos actifs, placements et dettes réunis en une seule vue claire.' },
];

const REASSURE = [
  { emoji: '⏱️', label: '≈ 3 min' },
  { emoji: '🔒', label: '100 % local' },
  { emoji: '🆓', label: 'Gratuit' },
];

export default function Welcome() {
  const p = usePalette();
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: p.accent }]}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 36 }}>🏡</Text>
          </View>
          <Text style={styles.brand}>ImmoSim</Text>
          <Text style={styles.tagline}>
            Votre projet immobilier en clair — capacité d'emprunt, reste à vivre et fiscalité,
            sans tableur.
          </Text>
          <View style={styles.reassureRow}>
            {REASSURE.map((r) => (
              <View key={r.label} style={styles.reassureChip}>
                <Text style={{ fontSize: 13 }}>{r.emoji}</Text>
                <Text style={styles.reassureText}>{r.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pillars */}
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: p.textMuted }]}>CE QUE VOUS ALLEZ OBTENIR</Text>
          {PILLARS.map((pillar) => (
            <View key={pillar.title} style={[styles.pillar, { backgroundColor: p.card, borderColor: p.border }]}>
              <View style={[styles.pillarEmoji, { backgroundColor: p.accentSoft }]}>
                <Text style={{ fontSize: 22 }}>{pillar.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: p.text, fontSize: 15.5, fontWeight: '700' }}>{pillar.title}</Text>
                <Text style={{ color: p.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>{pillar.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          <Button title="Configurer mon projet  →" onPress={() => router.push('/onboarding')} />
          <Button
            title="Explorer avec un exemple"
            variant="ghost"
            onPress={() => {
              completeOnboarding('exemple');
              router.replace('/');
            }}
          />
          <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm }}>
            Vos données restent sur votre téléphone. Outil d'estimation, ne remplace pas un conseil
            bancaire ou fiscal.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.lg * 1.6,
    borderBottomRightRadius: radius.lg * 1.6,
    gap: spacing.sm,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brand: { fontSize: 34, fontWeight: '900', letterSpacing: -0.8, color: '#fff' },
  tagline: { fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.92)' },
  reassureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  reassureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  reassureText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillarEmoji: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
