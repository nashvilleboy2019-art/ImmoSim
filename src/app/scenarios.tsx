import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, SectionTitle, Subtitle, TextField } from '@/components/ui';
import { useAllComputed } from '@/store/useComputed';
import { useStore } from '@/store/useStore';
import { formatEUR, radius, spacing, usePalette } from '@/theme';

const EDIT_DESTINATIONS = [
  { href: '/emprunt', label: '🏦 Emprunt' },
  { href: '/reste-a-vivre', label: '💶 Reste à vivre' },
  { href: '/fiscalite', label: '📊 Fiscalité' },
  { href: '/patrimoine', label: '🏠 Patrimoine' },
] as const;

export default function ScenariosScreen() {
  const p = usePalette();
  const router = useRouter();
  const all = useAllComputed();
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const addScenario = useStore((s) => s.addScenario);
  const duplicateScenario = useStore((s) => s.duplicateScenario);
  const deleteScenario = useStore((s) => s.deleteScenario);
  const renameScenario = useStore((s) => s.renameScenario);
  const [editingId, setEditingId] = useState<string | null>(null);

  const confirmDelete = (id: string, name: string) => {
    if (all.length <= 1) return;
    const doDelete = () => deleteScenario(id);
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Supprimer', `Supprimer le scénario « ${name} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <Screen>
      <Card>
        <SectionTitle>Mes scénarios</SectionTitle>
        <Subtitle>
          Comparez plusieurs hypothèses : prix différents, avec/sans PTZ, location nue vs LMNP…
          Touchez un scénario pour l'activer, puis modifiez ses paramètres via les raccourcis ci-dessous
          (ou depuis l'accueil). Le scénario actif alimente tous les écrans.
        </Subtitle>
      </Card>

      {all.map(({ scenario, computed }) => {
        const active = scenario.id === activeId;
        return (
          <Card key={scenario.id} style={active ? { borderColor: scenario.color, borderWidth: 2 } : undefined}>
            <Pressable onPress={() => setActive(scenario.id)} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: scenario.color }} />
                {editingId === scenario.id ? (
                  <View style={{ flex: 1 }}>
                    <TextField label="" value={scenario.name} onChange={(name) => renameScenario(scenario.id, name)} />
                  </View>
                ) : (
                  <Text style={{ flex: 1, color: p.text, fontSize: 16, fontWeight: '800' }}>{scenario.name}</Text>
                )}
                {active ? (
                  <View style={[styles.activePill, { backgroundColor: scenario.color }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>ACTIF</Text>
                  </View>
                ) : (
                  <Text style={{ color: p.textMuted, fontSize: 13 }}>Activer</Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                <Mini label="Marge banque" value={formatEUR(computed.loan.margeBancaire)} tone={computed.loan.margeBancaire >= 0 ? p.positive : p.negative} />
                <Mini label="Reste à vivre" value={formatEUR(computed.rav.ravMensuelApres)} tone={p.text} />
                <Mini label="Reste libre" value={formatEUR(computed.budget.resteLibreFinal)} tone={computed.budget.resteLibreFinal >= 0 ? p.positive : p.negative} />
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Chip label={editingId === scenario.id ? '✓ OK' : '✎ Renommer'} onPress={() => setEditingId(editingId === scenario.id ? null : scenario.id)} />
              <Chip label="⧉ Dupliquer" onPress={() => duplicateScenario(scenario.id)} />
              {all.length > 1 ? <Chip label="🗑 Supprimer" tone="negative" onPress={() => confirmDelete(scenario.id, scenario.name)} /> : null}
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.border }} />
            <Text style={{ color: p.textMuted, fontSize: 11, fontWeight: '700' }}>
              {active ? 'MODIFIER CE SCÉNARIO' : 'ACTIVER ET MODIFIER'}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {EDIT_DESTINATIONS.map((d) => (
                <Chip
                  key={d.href}
                  label={d.label}
                  onPress={() => {
                    if (!active) setActive(scenario.id);
                    router.push(d.href as never);
                  }}
                />
              ))}
            </View>
          </Card>
        );
      })}

      <View style={{ gap: spacing.sm }}>
        <Button title="＋ Nouveau scénario (vierge)" variant="ghost" onPress={() => addScenario()} />
        <Button title="📊 Comparer les scénarios" onPress={() => router.push('/comparaison')} />
      </View>
    </Screen>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  const p = usePalette();
  return (
    <View style={{ gap: 1 }}>
      <Text style={{ color: p.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: tone, fontSize: 14, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function Chip({ label, onPress, tone = 'default' }: { label: string; onPress: () => void; tone?: 'default' | 'negative' }) {
  const p = usePalette();
  const color = tone === 'negative' ? p.negative : p.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { borderColor: p.border, opacity: pressed ? 0.6 : 1 }]}>
      <Text style={{ color, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activePill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
});
