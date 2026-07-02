import { Link, Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, BigStat, Card, Divider, Screen, Subtitle, Title } from '@/components/ui';
import { useComputed } from '@/store/useComputed';
import { useStore } from '@/store/useStore';
import { formatEUR, formatPct, radius, spacing, usePalette } from '@/theme';

function ActionCard({
  emoji,
  title,
  subtitle,
  onPress,
  variant = 'soft',
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  variant?: 'solid' | 'soft';
}) {
  const p = usePalette();
  const solid = variant === 'solid';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View
        style={[
          styles.action,
          solid
            ? { backgroundColor: p.accent, borderColor: p.accent }
            : { backgroundColor: p.card, borderColor: p.border },
        ]}>
        <View
          style={[
            styles.actionEmoji,
            { backgroundColor: solid ? 'rgba(255,255,255,0.18)' : p.accentSoft },
          ]}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: solid ? '#fff' : p.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
          <Text
            style={{ color: solid ? 'rgba(255,255,255,0.9)' : p.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>
        <Text style={{ color: solid ? '#fff' : p.accent, fontSize: 22, fontWeight: '800' }}>›</Text>
      </View>
    </Pressable>
  );
}

interface ModuleCardProps {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  stat: string;
  tone?: 'default' | 'positive' | 'negative';
}

function ModuleCard({ href, emoji, title, subtitle, stat, tone = 'default' }: ModuleCardProps) {
  const p = usePalette();
  const statColor = tone === 'positive' ? p.positive : tone === 'negative' ? p.negative : p.text;
  return (
    <Link href={href as never} asChild>
      <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        <View style={[styles.module, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={[styles.emojiWrap, { backgroundColor: p.accentSoft }]}>
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.moduleTitle, { color: p.text }]}>{title}</Text>
            <Text style={[styles.moduleSub, { color: p.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.moduleStat, { color: statColor }]}>{stat}</Text>
            <Text style={{ color: p.textMuted, fontSize: 20 }}>›</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function Home() {
  const p = usePalette();
  const c = useComputed();
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const onboardingDone = useStore((s) => s.onboardingDone);
  const projectType = useStore((s) => s.projectType);
  const scenarios = useStore((s) => s.scenarios);
  const activeId = useStore((s) => s.activeId);
  const addBlankScenario = useStore((s) => s.addBlankScenario);
  const active = scenarios.find((x) => x.id === activeId) ?? scenarios[0];
  const isExample = projectType === 'exemple';

  // Premier lancement : afficher l'écran d'accueil explicatif.
  if (hydrated && !onboardingDone) {
    return <Redirect href="/welcome" />;
  }

  const newScenario = () => {
    addBlankScenario();
    router.push('/onboarding');
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Title>Bonjour 👋</Title>
        <Subtitle>Reprenez votre simulation ou démarrez un nouveau scénario.</Subtitle>
      </View>

      {/* Bandeau exemple */}
      {isExample ? (
        <Pressable onPress={() => router.push('/onboarding')}>
          <View style={[styles.exampleBanner, { backgroundColor: p.warningSoft, borderColor: p.warning }]}>
            <Text style={{ fontSize: 20 }}>🧪</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: p.text, fontWeight: '800', fontSize: 14 }}>Vous explorez un exemple</Text>
              <Text style={{ color: p.textSecondary, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>
                Les chiffres affichés sont une démo. Touchez ici pour configurer votre vrai projet.
              </Text>
            </View>
            <Text style={{ color: p.warning, fontWeight: '800', fontSize: 18 }}>›</Text>
          </View>
        </Pressable>
      ) : null}

      {/* Actions principales */}
      <ActionCard
        emoji="▶️"
        title="Reprendre mon scénario"
        subtitle={active?.name ? `Continuer « ${active.name} »` : 'Continuer ma simulation'}
        variant="solid"
        onPress={() => router.push('/emprunt')}
      />
      <ActionCard
        emoji="✨"
        title="Nouveau scénario"
        subtitle="Repartir d'une page blanche et configurer un nouveau projet"
        onPress={newScenario}
      />

      {/* Aperçu du scénario actif */}
      <Pressable onPress={() => router.push('/scenarios')}>
        <View style={[styles.scenarioBar, { backgroundColor: p.card, borderColor: active?.color ?? p.border }]}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: active?.color ?? p.accent }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: p.textMuted, fontSize: 11, fontWeight: '700' }}>SCÉNARIO ACTIF</Text>
            <Text style={{ color: p.text, fontSize: 15, fontWeight: '800' }}>{active?.name ?? '—'}</Text>
          </View>
          <Text style={{ color: p.accent, fontWeight: '700', fontSize: 13 }}>
            {scenarios.length > 1 ? `${scenarios.length} scénarios ›` : 'Gérer ›'}
          </Text>
        </View>
      </Pressable>

      {/* Verdict bancaire */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <BigStat
            label="Marge bancaire mensuelle"
            value={formatEUR(c.loan.margeBancaire)}
            tone={c.loan.margeBancaire >= 0 ? 'positive' : 'negative'}
            caption={`Taux d'effort ${formatPct(c.loan.tauxEffortGlobal)}`}
          />
          <Badge
            text={c.loan.statut === 'ok' ? 'Finançable' : c.loan.statut === 'derogation' ? 'Dérogation' : 'Alerte'}
            tone={c.loan.statut === 'ok' ? 'positive' : c.loan.statut === 'derogation' ? 'warning' : 'negative'}
          />
        </View>
        <Divider />
        <View style={styles.statsRow}>
          <BigStat label="Reste à vivre / mois" value={formatEUR(c.rav.ravMensuelApres)} />
          <BigStat
            label="Reste libre après budget"
            value={formatEUR(c.budget.resteLibreFinal)}
            tone={c.budget.resteLibreFinal >= 0 ? 'positive' : 'negative'}
          />
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        <ModuleCard
          href="/emprunt"
          emoji="🏦"
          title="Capacité d'emprunt"
          subtitle={`Mensualité maison ${formatEUR(c.loan.mensualiteMaison)}`}
          stat={formatEUR(c.loan.margeBancaire)}
          tone={c.loan.margeBancaire >= 0 ? 'positive' : 'negative'}
        />
        <ModuleCard
          href="/reste-a-vivre"
          emoji="💶"
          title="Reste à vivre & budget"
          subtitle="Avant / après impôts + budget courant"
          stat={formatEUR(c.rav.ravMensuelApres)}
        />
        <ModuleCard
          href="/fiscalite"
          emoji="📊"
          title="Fiscalité location"
          subtitle="Nu, micro-BIC, LMNP réel par bien"
          stat={`${formatEUR(c.rental.cashNetMensuel)}/m`}
          tone="positive"
        />
        <ModuleCard
          href="/patrimoine"
          emoji="🏠"
          title="Patrimoine net"
          subtitle="Actifs, placements, dettes"
          stat={formatEUR(c.patrimoine.patrimoineNet)}
        />
        <ModuleCard
          href="/scenarios"
          emoji="🔀"
          title="Scénarios & comparaison"
          subtitle="Créer, dupliquer et comparer vos hypothèses"
          stat={scenarios.length > 1 ? `${scenarios.length} ›` : 'Gérer ›'}
          tone="default"
        />
      </View>

      <Link href={'/parametres' as never} asChild>
        <Pressable
          style={({ pressed }) => [
            styles.settings,
            { borderColor: p.border, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={{ color: p.textSecondary, fontWeight: '600' }}>
            ⚙️  Paramètres & hypothèses
          </Text>
        </Pressable>
      </Link>

      <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center' }}>
        {hydrated ? 'Données enregistrées sur votre appareil.' : 'Chargement…'} Outil d'estimation,
        ne remplace pas un conseil bancaire ou fiscal.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionEmoji: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  exampleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  module: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: { fontSize: 16, fontWeight: '700' },
  moduleSub: { fontSize: 12.5, marginTop: 2 },
  moduleStat: { fontSize: 15, fontWeight: '800' },
  settings: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
});
